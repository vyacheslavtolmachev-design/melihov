import { getImageProps } from "next/image";

type EmblemProps = {
  /** Уникальный идентификатор — нужен, если на странице несколько экземпляров. */
  id?: string;
  className?: string;
  /**
   * seal — оригинал на кремовом круге (для тёмного сайта, по умолчанию).
   * brand — только знак, прозрачный фон, фирменные цвета.
   * onDark — осветлённый контур без подложки.
   */
  variant?: "seal" | "brand" | "onDark";
};

const SOURCES = {
  seal: "/brand/logo-melihov.png",
  brand: "/brand/logo-melihov.png",
  onDark: "/brand/logo-melihov-on-dark.png",
} as const;

/**
 * Печать нигде не крупнее 64px, а исходник — 512px и 245 КБ на каждой странице.
 * SVG-<image> не умеет srcset, поэтому сразу берём кадр оптимизатора на двойную плотность.
 */
const DISPLAY_SIZE = 64;

function optimizedSrc(src: string) {
  return getImageProps({ src, alt: "", width: DISPLAY_SIZE, height: DISPLAY_SIZE }).props.src;
}

/**
 * Фирменная эмблема «МелиховЪ».
 * SVG-обёртка вокруг подготовленного знака: каллиграфия и листья оригинала, а не перерисовка.
 */
export function Emblem({ id = "emblem", className, variant = "seal" }: EmblemProps) {
  const src = optimizedSrc(SOURCES[variant]);
  const withSeal = variant === "seal";
  const clipId = `${id}-seal-clip`;

  return (
    <svg
      id={id}
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="Эмблема МелиховЪ — питомник «Сады Наследия»"
    >
      <title>МелиховЪ</title>
      {withSeal && (
        <defs>
          <clipPath id={clipId}>
            <circle cx="256" cy="256" r="250" />
          </clipPath>
        </defs>
      )}
      {withSeal && <circle cx="256" cy="256" r="250" fill="#f3efe6" />}
      <g clipPath={withSeal ? `url(#${clipId})` : undefined}>
        <image href={src} width="512" height="512" preserveAspectRatio="xMidYMid meet" />
      </g>
      {withSeal && (
        <circle
          cx="256"
          cy="256"
          r="250"
          fill="none"
          stroke="url(#goldStroke)"
          strokeWidth="3"
          opacity="0.45"
        />
      )}
    </svg>
  );
}
