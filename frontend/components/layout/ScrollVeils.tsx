"use client";

import { useSyncExternalStore } from "react";

/** Сколько нужно отойти от края страницы, чтобы вуаль включилась. Как порог data-scrolled у шапки. */
const EDGE = 24;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  // Высота страницы меняется и без прокрутки: догрузились фото, сменился маршрут
  const observer = new ResizeObserver(onChange);
  observer.observe(document.body);

  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
    observer.disconnect();
  };
}

const scrolledFromTop = () => window.scrollY > EDGE;
const contentBelow = () => document.documentElement.scrollHeight - window.scrollY - window.innerHeight > EDGE;

/**
 * Контент у верхнего и нижнего края окна размывается и тает в фон (.scroll-veil в globals.css).
 * Верхняя вуаль включается с началом прокрутки, нижняя гаснет у конца страницы —
 * там, где за краем больше ничего нет, резать нечего.
 */
export function ScrollVeils() {
  const top = useSyncExternalStore(subscribe, scrolledFromTop, () => false);
  const bottom = useSyncExternalStore(subscribe, contentBelow, () => false);

  return (
    <>
      <Veil edge="top" active={top} />
      <Veil edge="bottom" active={bottom} />
    </>
  );
}

function Veil({ edge, active }: { edge: "top" | "bottom"; active: boolean }) {
  return (
    <div aria-hidden className={`scroll-veil scroll-veil--${edge}`} data-active={active}>
      <span className="scroll-veil__blur" />
      <span className="scroll-veil__blur" />
      <span className="scroll-veil__blur" />
      <span className="scroll-veil__blur" />
      <span className="scroll-veil__melt" />
    </div>
  );
}
