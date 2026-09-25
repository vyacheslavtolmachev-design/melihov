"use client";

import { useCallback, useRef, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "motion/react";

type Emblem3DProps = {
  className?: string;
  /** Лёгкий наклон за курсором на desktop */
  interactive?: boolean;
  /** Автопокачивание влево-вправо и золотой перелив */
  sway?: boolean;
};

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia("(pointer: fine)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Объёмная эмблема «МелиховЪ»: 3D-рендер медальона + перспектива.
 * Режим sway — заметное покачивание по yaw и металлический перелив (для героя).
 */
export function Emblem3D({ className = "", interactive = true, sway = false }: Emblem3DProps) {
  const reduceMotion = useReducedMotion();
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );

  const canSway = Boolean(sway && !reduceMotion);
  const live = Boolean(interactive && !sway && finePointer && !reduceMotion);
  const sceneRef = useRef<HTMLSpanElement>(null);
  const medalRef = useRef<HTMLSpanElement>(null);

  const onMove = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (!live || !sceneRef.current || !medalRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      medalRef.current.style.transform = `rotateX(${-py * 18}deg) rotateY(${px * 22}deg) translateZ(12px)`;
    },
    [live],
  );

  const onLeave = useCallback(() => {
    if (!medalRef.current) return;
    medalRef.current.style.transform = "rotateX(8deg) rotateY(-12deg) translateZ(8px)";
  }, []);

  return (
    <span
      ref={sceneRef}
      className={`emblem-3d relative inline-flex shrink-0 ${className}`}
      style={{ perspective: "640px" }}
      onPointerMove={live ? onMove : undefined}
      onPointerLeave={live ? onLeave : undefined}
    >
      <span
        ref={medalRef}
        className={`emblem-3d__medal relative block h-full w-full ${live ? "emblem-3d__medal--live" : ""} ${
          canSway ? "emblem-3d__medal--sway" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: canSway ? undefined : live ? "rotateX(8deg) rotateY(-12deg) translateZ(8px)" : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-melihov-3d.png"
          alt="Эмблема МелиховЪ"
          className="relative z-[1] h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
          draggable={false}
        />

        {/* Перелив только по внутренней зоне — внешний зелёный обод не трогаем */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute z-[2] overflow-hidden rounded-full ${
            canSway ? "emblem-3d__shimmer" : ""
          }`}
          style={{ transform: "translateZ(20px)", inset: canSway ? undefined : "10%" }}
        >
          {!canSway && (
            <span className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.22)_0%,transparent_42%,transparent_58%,rgba(197,168,128,0.1)_100%)] mix-blend-soft-light" />
          )}
        </span>
      </span>
    </span>
  );
}
