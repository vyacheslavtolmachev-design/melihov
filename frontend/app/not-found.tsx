import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Emblem3D } from "@/components/brand/Emblem3D";
import { headerCta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="relative flex min-h-svh items-center overflow-hidden pt-[140px] pb-[108px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#2a4030_0%,#1a2c1c_58%,rgba(18,31,20,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

      <div className="shell relative z-10">
        <div className="glass-strong flex flex-col gap-10 p-8 md:p-11 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Ошибка 404</p>

            <h1 className="mt-6 text-[clamp(2rem,4.2vw,3rem)] font-extrabold">
              Такой страницы <span className="gold-text">здесь не растёт</span>
            </h1>

            <p className="mt-6 text-[16px] leading-relaxed text-fg-soft">
              Возможно, сорт снят с продажи, ссылка устарела или в адресе опечатка. Загляните в каталог — там
              собраны все культуры и сорта питомника.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/catalog" className="btn btn-gold">
                В каталог
                <ArrowRight size={18} strokeWidth={1.7} />
              </Link>
              <Link href={headerCta.href} className="btn btn-ghost">
                {headerCta.label}
              </Link>
            </div>
          </div>

          <Emblem3D className="hidden h-[150px] w-[150px] shrink-0 lg:block" interactive={false} />
        </div>
      </div>
    </section>
  );
}
