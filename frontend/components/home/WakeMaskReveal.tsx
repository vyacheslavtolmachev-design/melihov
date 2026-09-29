"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

/** Радиус мягкого мазка цвета (css-px). */
const BRUSH_R = 170;
/**
 * Множитель альфы маски за кадр.
 * ~0.952 при 60fps → след почти гаснет за ~1 с.
 */
const FADE_KEEP = 0.952;
/** Постоянный просвет: тусклые контуры сада. */
const AMBIENT_OPACITY = 0.1;
/** Контурность ambient — под курсором проявляется полный цвет. */
const AMBIENT_FILTER = "saturate(0.15) brightness(0.45) contrast(1.55)";
/** Лёгкое удлинение мазка по ходу (не «фонарик»). */
const MAX_STRETCH = 1.08;
const SPEED_FOR_MAX = 26;

type WakeMaskRevealProps = {
  revealSrc?: string;
  className?: string;
};

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia("(pointer: fine)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeMounted(onChange: () => void) {
  onChange();
  return () => {};
}

function makeBrush(radius: number) {
  const size = Math.ceil(radius * 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Мягкий мазок: центр без «прожектора», длинный спад к краю
  const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  g.addColorStop(0, "rgba(255,255,255,0.92)");
  g.addColorStop(0.22, "rgba(255,255,255,0.78)");
  g.addColorStop(0.48, "rgba(255,255,255,0.42)");
  g.addColorStop(0.72, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const ir = image.naturalWidth / image.naturalHeight;
  const cr = width / height;
  let dw: number;
  let dh: number;
  let dx: number;
  let dy: number;

  if (ir > cr) {
    dh = height;
    dw = height * ir;
    dx = (width - dw) / 2;
    dy = 0;
  } else {
    dw = width;
    dh = width / ir;
    dx = 0;
    dy = (height - dh) / 2;
  }

  ctx.drawImage(image, dx, dy, dw, dh);
}

/**
 * Фон героя: контурный сад оживает цветом под курсором —
 * мягкий мазок проявляется и затягивается за ~1 с.
 */
export function WakeMaskReveal({
  revealSrc = "/media/orchard-reveal.jpg?v=4",
  className = "",
}: WakeMaskRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);

  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );

  const enabled = mounted && finePointer && !reduceMotion;

  useEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    const display = displayRef.current;
    const host = root?.closest("section") ?? root?.parentElement;
    if (!root || !display || !host) return;

    const dctx = display.getContext("2d", { alpha: true });
    if (!dctx) return;

    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d", { alpha: true });
    if (!mctx) return;

    const reveal = document.createElement("canvas");
    const rctx = reveal.getContext("2d", { alpha: true });
    if (!rctx) return;

    // Контурный слой рисуется с фильтром один раз на размер, а не каждый кадр:
    // холст героя во всю ширину экрана, фильтр на нём дорогой
    const ambient = document.createElement("canvas");
    const actx = ambient.getContext("2d", { alpha: true });
    if (!actx) return;

    const brush = makeBrush(BRUSH_R);
    const image = new Image();
    image.decoding = "async";
    image.src = revealSrc;

    let width = 0;
    let height = 0;
    let ratio = 1;
    let frame = 0;
    let imageReady = false;

    const pointer = {
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      angle: 0,
      stretch: 1,
      inside: false,
      moved: false,
    };

    const paintAmbient = () => {
      actx.setTransform(1, 0, 0, 1, 0, 0);
      actx.clearRect(0, 0, ambient.width, ambient.height);
      if (!imageReady) return;
      actx.setTransform(ratio, 0, 0, ratio, 0, 0);
      actx.globalAlpha = AMBIENT_OPACITY;
      actx.filter = AMBIENT_FILTER;
      drawCover(actx, image, width, height);
      actx.filter = "none";
      actx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      ratio = Math.min(window.devicePixelRatio || 1, 2);

      display.width = Math.round(width * ratio);
      display.height = Math.round(height * ratio);
      display.style.width = `${width}px`;
      display.style.height = `${height}px`;

      mask.width = display.width;
      mask.height = display.height;
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, mask.width, mask.height);

      reveal.width = display.width;
      reveal.height = display.height;

      ambient.width = display.width;
      ambient.height = display.height;
      paintAmbient();

      if (!pointer.moved) {
        pointer.x = width * 0.62;
        pointer.y = height * 0.42;
        pointer.px = pointer.x;
        pointer.py = pointer.y;
      }
    };

    const paintBrush = () => {
      if (!pointer.inside || !pointer.moved) return;

      mctx.save();
      mctx.globalCompositeOperation = "source-over";
      mctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      mctx.translate(pointer.x, pointer.y);
      mctx.rotate(pointer.angle);
      mctx.scale(pointer.stretch, 1 / Math.sqrt(pointer.stretch));
      mctx.drawImage(brush, -BRUSH_R, -BRUSH_R);
      mctx.restore();
    };

    const fadeMask = () => {
      // Умножаем альфу маски — цвет постепенно возвращается к контуру
      mctx.save();
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.globalCompositeOperation = "destination-in";
      mctx.fillStyle = `rgba(255,255,255,${FADE_KEEP})`;
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.restore();
      mctx.globalCompositeOperation = "source-over";
    };

    const composite = () => {
      dctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      dctx.globalCompositeOperation = "source-over";
      dctx.clearRect(0, 0, width, height);
      if (!imageReady) return;

      // Тусклые контуры сада
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.drawImage(ambient, 0, 0);
      dctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Полный цвет только в мазке под курсором
      rctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      rctx.globalCompositeOperation = "source-over";
      rctx.clearRect(0, 0, width, height);
      drawCover(rctx, image, width, height);
      rctx.globalCompositeOperation = "destination-in";
      rctx.setTransform(1, 0, 0, 1, 0, 0);
      rctx.drawImage(mask, 0, 0);
      rctx.globalCompositeOperation = "source-over";

      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.drawImage(reveal, 0, 0);
      dctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const tick = () => {
      fadeMask();
      paintBrush();
      composite();
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = event.clientX - rect.left;
      const ny = event.clientY - rect.top;
      const inside = nx >= 0 && ny >= 0 && nx <= rect.width && ny <= rect.height;

      if (!inside) {
        pointer.inside = false;
        pointer.stretch = 1;
        return;
      }

      const dx = nx - pointer.px;
      const dy = ny - pointer.py;
      const speed = Math.hypot(dx, dy);

      pointer.inside = true;
      pointer.moved = true;
      pointer.x = nx;
      pointer.y = ny;

      if (speed > 0.35) {
        pointer.angle = Math.atan2(dy, dx);
        const t = Math.min(1, speed / SPEED_FOR_MAX);
        pointer.stretch = 1 + (MAX_STRETCH - 1) * t;
      } else {
        pointer.stretch = 1;
      }

      pointer.px = nx;
      pointer.py = ny;
    };

    const onEnter = (event: PointerEvent) => {
      onMove(event);
    };

    const onLeave = () => {
      pointer.inside = false;
      pointer.stretch = 1;
    };

    const onImage = () => {
      imageReady = true;
      paintAmbient();
    };

    if (image.complete && image.naturalWidth > 0) {
      imageReady = true;
    } else {
      image.addEventListener("load", onImage);
    }

    resize();
    frame = requestAnimationFrame(tick);

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      image.removeEventListener("load", onImage);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, [enabled, revealSrc]);

  if (!enabled) {
    return (
      <div
        ref={rootRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={revealSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.1] saturate-[0.15] brightness-[0.45] contrast-[1.55]"
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      <canvas ref={displayRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
