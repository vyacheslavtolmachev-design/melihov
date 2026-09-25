"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

/**
 * Рантайм-ошибка не должна выкидывать пользователя на белый экран Next.js:
 * оформляем её в теме витрины и даём путь назад.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="relative flex min-h-svh items-center overflow-hidden pt-[140px] pb-[108px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#2a4030_0%,#1a2c1c_58%,rgba(18,31,20,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

      <div className="shell relative z-10">
        <div className="glass-strong max-w-[760px] p-8 md:p-11">
          <p className="eyebrow">Сбой</p>

          <h1 className="mt-6 text-[clamp(1.8rem,3.6vw,2.5rem)] font-extrabold">
            Страница не <span className="gold-text">загрузилась</span>
          </h1>

          <p className="mt-6 text-[16px] leading-relaxed text-fg-soft">
            Что-то пошло не так на нашей стороне. Попробуйте обновить — если не поможет, вернитесь в каталог
            или свяжитесь с нами на странице покупателям.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn btn-gold">
              <RotateCcw size={17} strokeWidth={1.7} />
              Обновить
            </button>
            <Link href="/catalog" className="btn btn-ghost">
              В каталог
            </Link>
            <Link href="/info" className="btn btn-ghost">
              Покупателям
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
