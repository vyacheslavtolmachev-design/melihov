"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { buildSearchHref, type SearchParams } from "./filter-url";

const DEBOUNCE_MS = 300;

type SearchBoxProps = {
  params: SearchParams;
  /** Значение из адреса: оно же источник правды после навигации. */
  value: string;
};

/**
 * Поиск живёт в адресной строке (`?q=`), как фильтры и переключатель цен:
 * страница остаётся серверной, а ссылку с поиском можно переслать.
 */
export function SearchBox({ params, value }: SearchBoxProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React 19 запрещает синхронный setState в теле эффекта: на смену адреса
  // реагируем правкой состояния прямо на рендере по сравнению с предыдущим значением.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  function navigate(next: string) {
    if (timer.current) clearTimeout(timer.current);
    router.replace(buildSearchHref(params, next), { scroll: false });
  }

  function handleChange(next: string) {
    setDraft(next);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(draft);
      }}
      className="relative"
    >
      <Search
        size={16}
        strokeWidth={1.6}
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted"
      />

      <input
        type="search"
        name="q"
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Поиск по названию сорта"
        aria-label="Поиск по названию сорта"
        className="w-full border border-white/10 bg-white/4 py-2.5 pl-11 pr-11 text-[14px] text-fg placeholder:text-fg-muted focus:border-gold/40 focus:outline-none"
      />

      {draft.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            navigate("");
          }}
          aria-label="Очистить поиск"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-muted transition-colors hover:text-gold"
        >
          <X size={15} strokeWidth={1.6} />
        </button>
      )}
    </form>
  );
}
