import { Emblem } from "./Emblem";

type WordmarkProps = {
  id?: string;
  compact?: boolean;
};

/**
 * Словесный знак: плоская печать + «Сады Наследия».
 * compact — для шапки (крупнее медальон и кегль).
 */
export function Wordmark({ id = "wordmark", compact = false }: WordmarkProps) {
  const size = compact
    ? "h-[52px] w-[52px] md:h-[60px] md:w-[60px] lg:h-[64px] lg:w-[64px]"
    : "h-14 w-14";

  return (
    <span className={`flex items-center ${compact ? "gap-3.5 md:gap-4" : "gap-3.5"}`}>
      <Emblem id={id} variant="seal" className={`${size} shrink-0`} />
      <span
        className={`font-display font-bold uppercase text-fg ${
          compact
            ? "text-[15px] tracking-[0.16em] md:text-[18px] md:tracking-[0.18em] lg:text-[19px]"
            : "text-[15px] tracking-[0.18em] md:text-[17px]"
        }`}
      >
        Сады Наследия
      </span>
    </span>
  );
}
