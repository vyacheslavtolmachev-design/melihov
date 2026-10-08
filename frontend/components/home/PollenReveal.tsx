"use client";

import { useEffect, useRef } from "react";
import {
  AMBIENT_GLSL,
  FULLSCREEN_VERTEX,
  LIGHT_POINT,
  REVEAL_SRC,
  StaticAmbient,
  compileProgram,
  coverScale,
  deleteTarget,
  imagePointToBox,
  makeFullscreenQuad,
  makeTarget,
  uploadImage,
  useRevealEnabled,
  type Program,
  type Target,
} from "./reveal-gl";

/** Шаг следа: одна пылинка на столько css-px пути курсора. */
const SPACING = 10;
/** Пылинок в секунду, пока курсор стоит на месте, — тонкая струйка. */
const IDLE_RATE = 10;
/** Сколько секунд струйка сыплется после остановки курсора. Дальше пыльца догорает и цикл
 *  кадров засыпает: иначе холст под стеклом героя перерисовывался бы 60 раз в секунду всё
 *  время, пока мышь лежит над страницей, и вместе с ним всё размытие плиток над ним. */
const IDLE_SECONDS = 1;
/** Разброс пылинок вокруг следа, css-px. */
const JITTER = 20;
const MAX_PARTICLES = 900;
/** Жизнь пылинки, с. */
const LIFE_MIN = 1.8;
const LIFE_MAX = 3.0;
/** Радиус проявленного цвета вокруг пылинки, css-px; к концу жизни пятно расплывается в 1.6 раза. */
const REVEAL_MIN = 11;
const REVEAL_MAX = 28;
const REVEAL_SPREAD = 0.6;
/** Радиус искры вместе с ореолом, css-px. */
const SPECK_R = 7;
/** Тёплый воздух: ускорение вверх, px/с², и предельная скорость подъёма. */
const LIFT = 22;
const RISE_MAX = 34;
/** Начальный разлёт пылинки во все стороны, px/с: облачко расширяется, а не лежит полосой. */
const BURST_MIN = 12;
const BURST_MAX = 48;
/** Доля скорости курсора, которую пылинка получает при рождении. */
const INHERIT = 0.12;
/** Какая доля скорости остаётся через секунду: пылинку быстро тормозит воздух. */
const DRAG_PER_SECOND = 0.25;
/** При загрузке из света туннеля поднимается облачко пыльцы. */
const INTRO_COUNT = 36;
const INTRO_SECONDS = 0.7;
/** Плотность холста. Картина мягкая и почти вся под плитками, а на экране с DPR 2 холст
 *  в полной плотности — вчетверо больше пикселей на каждый кадр. */
const MAX_RATIO = 1;

/** Поля пылинки в плоском массиве. */
const X = 0;
const Y = 1;
const VX = 2;
const VY = 3;
const AGE = 4;
const LIFE = 5;
const REVEAL = 6;
const PHASE = 7;
const STRIDE = 8;

type PollenRevealProps = {
  revealSrc?: string;
  className?: string;
};

/** Квадрат пылинки: центр и радиус в css-px, y сверху. */
const PARTICLE_VERTEX = `#version 300 es
in vec2 a_corner;
in vec4 a_particle;
uniform vec2 u_res;
out vec2 v_local;
out float v_alpha;
void main() {
  v_local = a_corner;
  v_alpha = a_particle.w;
  vec2 p = (a_particle.xy + a_corner * a_particle.z) / u_res * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
}`;

/** Мягкое пятно в маску проявления. Смешивание «экран»: пятна сливаются, не пересвечиваясь. */
const SPOT = `#version 300 es
precision highp float;
in vec2 v_local;
in float v_alpha;
out vec4 o;
void main() {
  float d = length(v_local);
  float m = 1.0 - smoothstep(0.0, 1.0, d);
  o = vec4(vec3(m * m * v_alpha), 1.0);
}`;

/** Золотая искра: плотное ядро и ореол, премультиплицированный цвет. */
const SPECK = `#version 300 es
precision highp float;
in vec2 v_local;
in float v_alpha;
out vec4 o;
void main() {
  float d = length(v_local);
  float core = 1.0 - smoothstep(0.14, 0.3, d);
  float halo = pow(max(0.0, 1.0 - d), 3.0) * 0.5;
  float a = (core + halo) * v_alpha;
  o = vec4(vec3(1.0, 0.86, 0.56) * a, a);
}`;

/** Итог: тусклые контуры сада, полный цвет там, где прошла пыльца. */
const DISPLAY = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_mask;
uniform vec2 u_cover;
in vec2 v_uv;
out vec4 o;
${AMBIENT_GLSL}
void main() {
  vec3 col = texture(u_image, (v_uv - 0.5) * u_cover + 0.5).rgb;
  float a = smoothstep(0.04, 0.7, texture(u_mask, v_uv).r);
  float ambA = AMBIENT_ALPHA * (1.0 - a);
  o = vec4(ambient(col) * ambA + col * a, ambA + a);
}`;

const random = (min: number, max: number) => min + Math.random() * (max - min);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Инстансы пылинок: общий квадрат (location 0) и по вектору на пылинку (location 1). */
function makeParticleLayer(gl: WebGL2RenderingContext, corners: WebGLBuffer | null) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * 4 * 4, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);

  return { vao, buffer, data: new Float32Array(MAX_PARTICLES * 4) };
}

/**
 * Фон героя: контурный сад, а за курсором тянется шлейф золотой пыльцы.
 * Пылинки поднимаются в тёплом воздухе, каждая проявляет цвет картины вокруг себя
 * и за 2–3 с оседает и гаснет.
 */
export function PollenReveal({ revealSrc = REVEAL_SRC, className = "" }: PollenRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useRevealEnabled();

  useEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    const canvas = canvasRef.current;
    const host = root?.closest("section") ?? root?.parentElement;
    if (!root || !canvas || !host) return;

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const spot = compileProgram(gl, PARTICLE_VERTEX, SPOT, ["a_corner", "a_particle"], "PollenReveal");
    const speck = compileProgram(gl, PARTICLE_VERTEX, SPECK, ["a_corner", "a_particle"], "PollenReveal");
    const display = compileProgram(gl, FULLSCREEN_VERTEX, DISPLAY, ["a_pos"], "PollenReveal");
    if (!spot || !speck || !display) return;

    const fullscreen = makeFullscreenQuad(gl);
    const spots = makeParticleLayer(gl, fullscreen.buffer);
    const specks = makeParticleLayer(gl, fullscreen.buffer);

    const imageTexture = gl.createTexture();
    const image = new Image();
    image.decoding = "async";
    image.src = revealSrc;

    const particles = new Float32Array(MAX_PARTICLES * STRIDE);
    let count = 0;

    let width = 1;
    let height = 1;
    let cover: [number, number] = [1, 1];
    let mask: Target | null = null;
    let maskW = 1;
    let maskH = 1;
    let imageReady = false;
    let raf = 0;
    let last = 0;
    let introLeft = 0;
    let introCarry = 0;

    const pointer = {
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      inside: false,
      fresh: true,
      moved: false,
      carry: 0,
      idleCarry: 0,
      idleLeft: 0,
    };

    const spawn = (x: number, y: number, vx: number, vy: number) => {
      if (count >= MAX_PARTICLES) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = random(BURST_MIN, BURST_MAX);
      const i = count * STRIDE;
      particles[i + X] = x + random(-JITTER, JITTER);
      particles[i + Y] = y + random(-JITTER, JITTER);
      particles[i + VX] = Math.cos(angle) * speed + vx * INHERIT;
      particles[i + VY] = Math.sin(angle) * speed + vy * INHERIT;
      particles[i + AGE] = 0;
      particles[i + LIFE] = random(LIFE_MIN, LIFE_MAX);
      particles[i + REVEAL] = random(REVEAL_MIN, REVEAL_MAX);
      particles[i + PHASE] = Math.random() * Math.PI * 2;
      count += 1;
    };

    const emit = (dt: number) => {
      if (pointer.inside && pointer.moved) {
        // Пылинки ложатся по всему пути за кадр, а не только в текущую точку — след без разрывов
        const dx = pointer.x - pointer.lastX;
        const dy = pointer.y - pointer.lastY;
        const distance = Math.hypot(dx, dy);
        const vx = dx / dt;
        const vy = dy / dt;
        pointer.carry += distance;
        while (pointer.carry >= SPACING) {
          pointer.carry -= SPACING;
          const t = distance > 0 ? 1 - pointer.carry / distance : 1;
          spawn(pointer.lastX + dx * t, pointer.lastY + dy * t, vx, vy);
        }
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.moved = false;
      } else if (pointer.inside && pointer.idleLeft > 0) {
        pointer.idleLeft -= dt;
        pointer.idleCarry += IDLE_RATE * dt;
        while (pointer.idleCarry >= 1) {
          pointer.idleCarry -= 1;
          spawn(pointer.x, pointer.y, 0, 0);
        }
      }

      if (introLeft > 0) {
        const light = imagePointToBox(LIGHT_POINT, cover, width, height);
        introCarry += (INTRO_COUNT / INTRO_SECONDS) * dt;
        while (introCarry >= 1) {
          introCarry -= 1;
          spawn(light.x + random(-70, 70), light.y + random(-40, 40), 0, -160);
        }
        introLeft -= dt;
      }
    };

    const update = (dt: number) => {
      const drag = Math.pow(DRAG_PER_SECOND, dt);
      let i = 0;
      while (i < count) {
        const o = i * STRIDE;
        particles[o + AGE] += dt;
        if (particles[o + AGE] >= particles[o + LIFE]) {
          // Погасшую меняем местами с последней — массив остаётся плотным
          count -= 1;
          particles.copyWithin(o, count * STRIDE, count * STRIDE + STRIDE);
          continue;
        }
        particles[o + VX] *= drag;
        particles[o + VY] = Math.max(particles[o + VY] * drag - LIFT * dt, -RISE_MAX);
        const sway = Math.sin(particles[o + AGE] * 1.6 + particles[o + PHASE]) * 9;
        particles[o + X] += (particles[o + VX] + sway) * dt;
        particles[o + Y] += particles[o + VY] * dt;
        i += 1;
      }
    };

    const drawParticles = (layer: ReturnType<typeof makeParticleLayer>, program: Program) => {
      gl.useProgram(program.program);
      gl.uniform2f(program.u("u_res"), width, height);
      gl.bindVertexArray(layer.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, layer.data, 0, count * 4);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    };

    const render = () => {
      for (let i = 0; i < count; i += 1) {
        const o = i * STRIDE;
        const k = particles[o + AGE] / particles[o + LIFE];
        const j = i * 4;

        spots.data[j] = particles[o + X];
        spots.data[j + 1] = particles[o + Y];
        spots.data[j + 2] = particles[o + REVEAL] * (1 + REVEAL_SPREAD * k);
        spots.data[j + 3] = smoothstep(0, 0.12, k) * (1 - smoothstep(0.5, 1, k));

        const twinkle = 0.65 + 0.35 * Math.sin(particles[o + AGE] * 11 + particles[o + PHASE] * 3);
        specks.data[j] = particles[o + X];
        specks.data[j + 1] = particles[o + Y];
        specks.data[j + 2] = SPECK_R;
        specks.data[j + 3] = smoothstep(0, 0.05, k) * (1 - smoothstep(0.35, 1, k)) * twinkle;
      }

      // Маска проявления: пятна вокруг пылинок, слитые «экраном»
      gl.bindFramebuffer(gl.FRAMEBUFFER, mask?.framebuffer ?? null);
      gl.viewport(0, 0, maskW, maskH);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
      if (count) drawParticles(spots, spot);

      // Сад: контуры и цвет по маске
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(display.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mask?.texture ?? null);
      gl.uniform1i(display.u("u_image"), 0);
      gl.uniform1i(display.u("u_mask"), 1);
      gl.uniform2f(display.u("u_cover"), cover[0], cover[1]);
      gl.bindVertexArray(fullscreen.vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Искры поверх
      if (count) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        drawParticles(specks, speck);
        gl.disable(gl.BLEND);
      }
      gl.bindVertexArray(null);
    };

    const tick = (now: number) => {
      raf = 0;
      if (!imageReady) return;
      // После паузы вкладки не прыгаем: шаг не длиннее 1/20 с
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;

      emit(dt);
      update(dt);
      render();

      // Пыльца догорела, курсор замер или ушёл — последний кадр уже чистый, ждём движения
      if (count > 0 || introLeft > 0 || (pointer.inside && pointer.idleLeft > 0)) {
        raf = requestAnimationFrame(tick);
      } else {
        last = 0;
      }
    };

    const wake = () => {
      if (!raf && imageReady) raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      // Пятна мягкие — маске хватает половины css-разрешения
      maskW = Math.max(1, Math.round(width / 2));
      maskH = Math.max(1, Math.round(height / 2));
      deleteTarget(gl, mask);
      mask = makeTarget(gl, maskW, maskH);

      if (imageReady) cover = coverScale(image, width, height);
      wake();
      // Без пыльцы цикл не крутится — перерисуем контуры под новый размер сразу
      if (imageReady && !count) render();
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      if (!pointer.inside) return;

      introLeft = 0;
      // После входа в кадр след начинается с текущей точки, а не тянется от прошлой
      if (pointer.fresh) {
        pointer.lastX = x;
        pointer.lastY = y;
        pointer.fresh = false;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
      pointer.idleLeft = IDLE_SECONDS;
      wake();
    };

    const onLeave = () => {
      pointer.inside = false;
      pointer.fresh = true;
      pointer.carry = 0;
    };

    const onImage = () => {
      if (imageReady || !imageTexture) return;
      uploadImage(gl, imageTexture, image);
      imageReady = true;
      introLeft = INTRO_SECONDS;
      resize();
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
      imageReady = false;
    };

    image.addEventListener("load", onImage);
    if (image.complete && image.naturalWidth > 0) onImage();

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerenter", onMove);
    host.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      image.removeEventListener("load", onImage);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerenter", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost);
      deleteTarget(gl, mask);
      gl.deleteTexture(imageTexture);
      for (const layer of [spots, specks]) {
        gl.deleteVertexArray(layer.vao);
        gl.deleteBuffer(layer.buffer);
      }
      gl.deleteVertexArray(fullscreen.vao);
      gl.deleteBuffer(fullscreen.buffer);
      for (const p of [spot, speck, display]) gl.deleteProgram(p.program);
    };
  }, [enabled, revealSrc]);

  if (!enabled) return <StaticAmbient src={revealSrc} className={className} rootRef={rootRef} />;

  return (
    <div ref={rootRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
