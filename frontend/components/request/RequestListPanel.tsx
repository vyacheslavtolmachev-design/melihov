"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  clearRequestList,
  getRequestListServerSnapshot,
  getRequestListSnapshot,
  removeFromRequestList,
  requestListCount,
  setRequestListQuantity,
  subscribeRequestList,
} from "@/lib/request-list";

export function RequestListPanel() {
  const items = useSyncExternalStore(
    subscribeRequestList,
    getRequestListSnapshot,
    getRequestListServerSnapshot,
  );
  const total = requestListCount(items);

  if (items.length === 0) {
    return (
      <div className="glass p-8 md:p-10">
        <h2 className="font-display text-[22px]">Лист заявки</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
          Пока пусто. Добавьте сорта из{" "}
          <Link href="/catalog" className="text-gold transition-colors hover:text-gold-light">
            каталога
          </Link>
          — они появятся здесь перед отправкой заявки.
        </p>
      </div>
    );
  }

  return (
    <div className="glass p-8 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px]">Лист заявки</h2>
          <p className="mt-2 text-[14px] text-fg-muted">Позиций: {items.length}, саженцев: {total}</p>
        </div>
        <button
          type="button"
          onClick={() => clearRequestList()}
          className="text-[13px] text-fg-muted transition-colors hover:text-gold"
        >
          Очистить
        </button>
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.slug}
            className="flex flex-col gap-4 border-b border-white/8 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              {item.culture && <p className="text-[12px] uppercase tracking-[0.14em] text-fg-muted">{item.culture}</p>}
              <Link
                href={`/catalog/${item.slug}`}
                className="mt-1 block font-display text-[18px] transition-colors hover:text-gold"
              >
                {item.title}
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/12 px-2 py-1">
                <button
                  type="button"
                  aria-label="Уменьшить"
                  className="flex h-8 w-8 items-center justify-center text-fg-soft transition-colors hover:text-gold"
                  onClick={() => setRequestListQuantity(item.slug, item.quantity - 1)}
                >
                  <Minus size={14} strokeWidth={1.6} />
                </button>
                <span className="min-w-8 text-center text-[14px]">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Увеличить"
                  className="flex h-8 w-8 items-center justify-center text-fg-soft transition-colors hover:text-gold"
                  onClick={() => setRequestListQuantity(item.slug, item.quantity + 1)}
                >
                  <Plus size={14} strokeWidth={1.6} />
                </button>
              </div>
              <button
                type="button"
                aria-label="Удалить"
                className="flex h-9 w-9 items-center justify-center text-fg-muted transition-colors hover:text-gold"
                onClick={() => removeFromRequestList(item.slug)}
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
