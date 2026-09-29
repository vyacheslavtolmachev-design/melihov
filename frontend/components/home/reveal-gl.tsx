"use client";

import { useSyncExternalStore, type Ref } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Обвязка оживления сада в герое (PollenReveal): когда эффект включать,
 * статичный кадр вместо него и WebGL-помощники.
 */

export const REVEAL_SRC = "/media/orchard-reveal.jpg?v=4";

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia("(pointer: fine)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeMounted(onChange: () => void) {
  onChange();
  return () => {};
}

/** Эффект нужен только под мышью и без reduced motion; на таче и при SSR — статичный контурный кадр. */
export function useRevealEnabled() {
  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );

  return mounted && finePointer && !reduceMotion;
}

export function StaticAmbient({ src, className, rootRef }: { src: string; className: string; rootRef?: Ref<HTMLDivElement> }) {
  return (
    <div ref={rootRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.1] saturate-[0.15] brightness-[0.45] contrast-[1.55]"
      />
    </div>
  );
}

/** Полноэкранный прямоугольник: v_uv от (0,0) внизу слева до (1,1). */
export const FULLSCREEN_VERTEX = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

/** Тусклые контуры сада — то же, что CSS у StaticAmbient: saturate(0.15) brightness(0.45) contrast(1.55), 10%. */
export const AMBIENT_GLSL = `
const float AMBIENT_ALPHA = 0.1;

vec3 ambient(vec3 col) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 amb = mix(vec3(l), col, 0.15) * 0.45;
  return clamp((amb - 0.5) * 1.55 + 0.5, 0.0, 1.0);
}
`;

export type Program = {
  program: WebGLProgram;
  u: (name: string) => WebGLUniformLocation | null;
};

/** attributes — имена атрибутов по порядку их location. */
export function compileProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
  attributes: string[],
  label: string,
): Program | null {
  const program = gl.createProgram();
  const shaders = [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const;

  for (const [type, source] of shaders) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(`[${label}]`, gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
  }

  attributes.forEach((name, location) => gl.bindAttribLocation(program, location, name));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(`[${label}]`, gl.getProgramInfoLog(program));
    return null;
  }

  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(program, name));
    return uniforms.get(name) ?? null;
  };

  return { program, u };
}

/** Текстура с framebuffer для рисования в неё; очищена в прозрачно-чёрный с альфой 1. */
export function makeTarget(gl: WebGL2RenderingContext, width: number, height: number) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return { texture, framebuffer };
}

export type Target = ReturnType<typeof makeTarget>;

export function deleteTarget(gl: WebGL2RenderingContext, target: Target | null) {
  if (!target) return;
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.framebuffer);
}

/** Картина сада в текстуру: низ кадра — v = 0, с мипмапами для уменьшенных проходов. */
export function uploadImage(gl: WebGL2RenderingContext, texture: WebGLTexture, image: HTMLImageElement) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/** Масштаб uv картины для object-fit: cover — (uv - 0.5) * cover + 0.5. */
export function coverScale(image: HTMLImageElement, width: number, height: number): [number, number] {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  return imageRatio > boxRatio ? [boxRatio / imageRatio, 1] : [1, imageRatio / boxRatio];
}

/** Точка картины (доли, y сверху) → точка кадра в css-px с учётом кадрирования cover. */
export function imagePointToBox(point: { x: number; y: number }, cover: [number, number], width: number, height: number) {
  return {
    x: ((point.x - 0.5) / cover[0] + 0.5) * width,
    y: ((point.y - 0.5) / cover[1] + 0.5) * height,
  };
}

/** Точка света в туннеле картины: оттуда сад оживает при загрузке. */
export const LIGHT_POINT = { x: 0.5, y: 0.45 };

/** Полноэкранный прямоугольник для проходов по всему кадру (атрибут location 0). */
export function makeFullscreenQuad(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, buffer };
}
