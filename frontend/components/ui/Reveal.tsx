"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import type { ReactNode } from "react";

const easePremium: [number, number, number, number] = [0.16, 0.8, 0.24, 1];

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Появление снизу. Сдвиг задан строкой transform, а не `y`: такую анимацию Motion отдаёт браузеру
 * (WAAPI) и она идёт в композиторе, а `y` считается на JS в каждом кадре — в каталоге так
 * появляется сотня карточек прямо во время прокрутки.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  // reducedMotion="user" в MotionProvider гасит сдвиг только у `y`/`x` — для строки transform
  // то же делаем здесь: при reduced motion карточка встаёт на место сразу, остаётся только проявление
  const reduceMotion = useReducedMotion();
  const base: Transition = { duration: 0.85, ease: easePremium, delay };
  const transition: Transition = reduceMotion ? { ...base, transform: { type: false } } : base;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(30px)" }}
      whileInView={{ opacity: 1, transform: "none" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
