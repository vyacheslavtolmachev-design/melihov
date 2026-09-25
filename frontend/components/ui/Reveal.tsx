"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const easePremium: [number, number, number, number] = [0.16, 0.8, 0.24, 1];

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, ease: easePremium, delay }}
    >
      {children}
    </motion.div>
  );
}
