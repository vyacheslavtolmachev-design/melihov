# 04-frontend-components.md

---

## `frontend/components/layout/Header.tsx`
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X, Sprout, ArrowRight } from "lucide-react";
import { navigation } from "@/lib/site";
import { Wordmark } from "@/components/brand/Wordmark";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renderedPath, setRenderedPath] = useState(pathname);

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false,
  );

  // Переход по ссылке из шторки закрывает её: состояние правим на рендере, а не эффектом
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="fixed inset-x-0 top-5 z-50 md:top-[30px]">
        <div className="shell">
          <div
            data-scrolled={scrolled}
            className="nav-glass flex h-[60px] items-center justify-between gap-6 px-4 md:h-[70px] md:px-6"
          >
            <Link href="/" aria-label="На главную">
              <Wordmark id="nav-emblem" compact />
            </Link>

            <nav className="hidden items-center gap-8 xl:flex">
              {navigation.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  className={`group relative py-2 text-[13.5px] font-medium tracking-[0.01em] transition-colors duration-300 ${
                    isActive(navItem.href) ? "text-fg" : "text-fg-soft hover:text-fg"
                  }`}
                >
                  {navItem.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-gold-light to-gold-dark transition-all duration-500 ${
                      isActive(navItem.href) ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/info"
                className="hidden items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 py-2 pl-2 pr-4 text-[12.5px] font-medium text-fg transition-colors duration-300 hover:border-gold/60 lg:inline-flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-deep">
                  <Sprout size={14} strokeWidth={1.5} stroke="url(#goldStroke)" />
                </span>
                Консультация агронома
              </Link>

              <Link href="/services" className="btn btn-gold hidden !px-6 !py-2.5 !text-[13px] md:inline-flex">
                Подобрать сад
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Открыть меню"
                className="flex h-9 w-9 items-center justify-center text-fg xl:hidden"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Мобильная шторка */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-500 xl:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm"
        />

        <aside
          className={`absolute inset-y-0 right-0 flex w-[86%] max-w-[380px] flex-col border-l-2 border-gold/60 bg-[linear-gradient(160deg,rgba(12,38,22,.96),rgba(6,21,12,.98))] backdrop-blur-xl transition-transform duration-500 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(.16,.8,.24,1)" }}
        >
          <div className="flex items-center justify-between px-7 pb-6 pt-7">
            <span className="eyebrow">Меню</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрыть меню"
              className="text-fg-soft transition-colors hover:text-fg"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-col px-7">
            {navigation.map((navItem) => (
              <Link
                key={navItem.href}
                href={navItem.href}
                className="border-b border-white/8 py-4 font-display text-[19px] text-fg transition-colors hover:text-gold"
              >
                {navItem.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 px-7 pb-9">
            <Link href="/services" className="btn btn-gold w-full">
              Подобрать сад
              <ArrowRight size={17} strokeWidth={1.6} />
            </Link>
            <Link href="/info" className="btn btn-ghost w-full">
              Консультация агронома
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
```

---

## `frontend/components/layout/Footer.tsx`
```tsx
import Link from "next/link";
import { categoryGroups } from "@/lib/catalog";
import { navigation, site } from "@/lib/site";
import { Emblem } from "@/components/brand/Emblem";

export function Footer() {
  const year = new Date().getFullYear();
  const trees = categoryGroups[0]?.categories.slice(0, 5) ?? [];

  return (
    <footer className="border-t border-white/8 bg-bg-deep">
      <div className="shell grid gap-[46px] pb-16 pt-[70px] lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <Emblem id="footer-emblem" className="h-16 w-16" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-fg">
                Сады Наследия
              </span>
              <span className="mt-2 font-body text-[0.55rem] uppercase tracking-[0.34em] text-gold">
                Основатель — МелиховЪ
              </span>
            </div>
          </div>

          <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-fg-muted">
            {site.tagline}. Саженцы из собственного маточника, районированные сорта и сопровождение агронома весь
            первый сезон.
          </p>
        </div>

        <nav className="flex flex-col gap-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Разделы</p>
          {navigation.map((navItem) => (
            <Link
              key={navItem.href}
              href={navItem.href}
              className="text-[14.5px] text-fg-muted transition-colors hover:text-fg"
            >
              {navItem.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Каталог</p>
          {trees.map((category) => (
            <Link
              key={category.slug}
              href={`/catalog?culture=${category.slug}`}
              className="text-[14.5px] text-fg-muted transition-colors hover:text-fg"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/8">
        <div className="shell flex flex-col gap-2 py-6 text-[12.5px] text-fg-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} Питомник «Сады Наследия»</p>
          <p>Политика конфиденциальности</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## `frontend/components/layout/PageHeader.tsx`
```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  accent: string;
  lead?: string;
};

export function PageHeader({ eyebrow, title, accent, lead }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-[132px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#17452b_0%,#0e2c1b_58%,rgba(5,19,11,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

      <div className="shell relative z-10 pt-16">
        <Reveal>
          <nav className="flex items-center gap-2 text-[12.5px] text-fg-muted">
            <Link href="/" className="transition-colors hover:text-gold">
              Главная
            </Link>
            <ChevronRight size={14} strokeWidth={1.5} />
            <span className="text-fg-soft">{eyebrow}</span>
          </nav>

          <p className="eyebrow mt-8">{eyebrow}</p>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.1rem,4.6vw,3.15rem)] font-extrabold">
            {title} <span className="gold-text">{accent}</span>
          </h1>

          {lead && <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-fg-soft">{lead}</p>}
        </Reveal>
      </div>
    </section>
  );
}
```

---

## `frontend/components/layout/PagePlaceholder.tsx`
```tsx
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "./PageHeader";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  points: string[];
};

export function PagePlaceholder({ eyebrow, title, accent, description, points }: PagePlaceholderProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} accent={accent} />

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="prose-panel glass max-w-[900px] p-8 md:p-11">
              <p className="text-[16.5px] leading-relaxed text-fg-soft">{description}</p>

              <h2 className="font-display text-[24px]">Что появится в этом разделе</h2>
              <ul>
                {points.map((point) => (
                  <li key={point} className="text-[15.5px] text-fg-muted">
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/catalog" className="btn btn-gold">
                  Перейти в каталог
                </Link>
                <Link href="/" className="btn btn-ghost">
                  На главную
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/components/home/Hero.tsx`
```tsx
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarDays, Tractor } from "lucide-react";
import { OrchardCanvas } from "./OrchardCanvas";
import { Emblem } from "@/components/brand/Emblem";
import { heroTiles } from "@/lib/catalog";

const HERO_VIDEO_SRC = "/media/hero.mp4";
const WIDE_SCREEN_QUERY = "(min-width: 768px)";

function subscribeWideScreen(onChange: () => void) {
  const query = window.matchMedia(WIDE_SCREEN_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const easeOutExpo: [number, number, number, number] = [0.16, 0.8, 0.24, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: easeOutExpo } },
};

const tickerItems = [
  "Приём заявок на осенний сезон открыт",
  "Опт для хозяйств — от 50 саженцев",
  "Подбор сорта под участок за 1 день",
  "Паспорт сортности к каждому саженцу",
  "Гарантия сортового соответствия",
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);

  // На узких экранах и при reduced motion видео не грузим вовсе
  const wideScreen = useSyncExternalStore(
    subscribeWideScreen,
    () => window.matchMedia(WIDE_SCREEN_QUERY).matches,
    () => false,
  );

  const videoAllowed = wideScreen && !reduceMotion;

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden pb-16 pt-[104px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#17452b_0%,#0e2c1b_52%,#05130b_100%)]" />

      {videoAllowed && (
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ${
            videoReady ? "opacity-40" : "opacity-0"
          }`}
          src={HERO_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        />
      )}

      <OrchardCanvas />

      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,19,11,.92)_0%,rgba(5,19,11,.62)_45%,rgba(5,19,11,.3)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

      <motion.div variants={container} initial="hidden" animate="show" className="shell relative z-10 w-full">
        <div className="grid gap-4 lg:grid-cols-[1.62fr_1fr]">
          <motion.div variants={item} className="glass-strong relative overflow-hidden p-8 md:p-11 lg:p-14">
            <p className="eyebrow">Питомник плодовых деревьев</p>

            <h1 className="mt-7 max-w-3xl text-[clamp(2.3rem,5.2vw,3.35rem)] font-extrabold">
              Сады, которые переживут <span className="gold-text">поколения</span>
            </h1>

            <p className="mt-7 max-w-xl text-fg-soft">
              Саженцы из собственного маточника: районированные сорта, паспорт сортности и агроном на связи весь
              первый сезон.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalog" className="btn btn-gold group">
                Перейти в каталог
                <ArrowRight
                  size={18}
                  strokeWidth={1.7}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link href="/services" className="btn btn-ghost">
                Подобрать сад
              </Link>
            </div>

            {/* Бегущая строка активности питомника */}
            <div className="relative mt-11 overflow-hidden border-t border-white/8 pt-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
              <motion.div
                className="flex w-max gap-10 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              >
                {[...tickerItems, ...tickerItems].map((text, index) => (
                  <span
                    key={`${text}-${index}`}
                    className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] text-fg-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-gold" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -right-8 hidden lg:block"
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Emblem id="hero-emblem" className="h-[260px] w-[260px] opacity-[0.13]" />
            </motion.div>
          </motion.div>

          <div className="grid gap-4">
            <motion.article variants={item} className="glass lift p-7">
              <CalendarDays size={26} strokeWidth={1.1} stroke="url(#goldStroke)" />
              <h2 className="mt-5 font-display text-[21px]">Осенняя посадка</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                Лучшее окно для плодовых — с конца сентября. Заявку стоит закрепить заранее: сорта расходятся
                партиями.
              </p>
            </motion.article>

            <motion.article variants={item} className="glass lift p-7">
              <Tractor size={26} strokeWidth={1.1} stroke="url(#goldStroke)" />
              <h2 className="mt-5 font-display text-[21px]">Хозяйствам</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                Оптовые цены от 50 саженцев, расчёт схемы посадки и подбор подвоя под тип почвы.
              </p>
            </motion.article>
          </div>
        </div>

        <motion.div variants={item} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroTiles.map((tile) => (
            <Link
              key={tile.slug}
              href={`/catalog?culture=${tile.slug}`}
              className="glass lift group flex items-start justify-between gap-4 p-6"
            >
              <span>
                <span className="block font-display text-[19px] text-fg">{tile.name}</span>
                <span className="mt-1.5 block text-[13px] text-fg-muted">{tile.note}</span>
              </span>
              <ArrowUpRight
                size={19}
                strokeWidth={1.4}
                className="mt-1 shrink-0 text-white/25 transition-colors duration-300 group-hover:text-gold"
              />
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
```

---

## `frontend/components/home/ValueProps.tsx`
```tsx
import { Sprout, ScrollText, Snowflake, HeartHandshake } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  {
    icon: Sprout,
    title: "Собственный маточник",
    text: "Черенки берём со своих маточных деревьев, а не перекупаем саженцы у посредников.",
  },
  {
    icon: ScrollText,
    title: "Паспорт сортности",
    text: "К каждому саженцу — сорт, подвой, возраст и рекомендации по схеме посадки.",
  },
  {
    icon: Snowflake,
    title: "Районированные сорта",
    text: "Подбираем культуры под климат, почву и уровень грунтовых вод вашего участка.",
  },
  {
    icon: HeartHandshake,
    title: "Сопровождение сезона",
    text: "Агроном остаётся на связи весь первый год после посадки — от полива до защиты.",
  },
];

export function ValueProps() {
  return (
    <section className="sec">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">Почему нам доверяют сад</p>
          <h2 className="mt-6 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)]">
            Питомник полного цикла — от маточника до <span className="gold-text">первого урожая</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.08}>
              <article className="glass lift h-full p-[22px]">
                <value.icon size={27} strokeWidth={1.1} stroke="url(#goldStroke)" />
                <h3 className="mt-6 font-display text-[20px]">{value.title}</h3>
                <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">{value.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/Directions.tsx`
```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { directions } from "@/lib/services";
import { Reveal } from "@/components/ui/Reveal";

export function Directions() {
  const preview = directions.slice(0, 6);

  return (
    <section className="sec pt-0">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Виды деятельности</p>
              <h2 className="mt-6 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)]">
                Питомник полного цикла — от прививки до <span className="gold-text">закладки сада</span>
              </h2>
            </div>

            <Link
              href="/services"
              className="group inline-flex shrink-0 items-center gap-2.5 text-[14px] font-medium text-gold transition-colors hover:text-gold-light"
            >
              Все направления
              <ArrowRight
                size={17}
                strokeWidth={1.6}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((direction, index) => (
            <Reveal key={direction.title} delay={(index % 3) * 0.07}>
              <article className="glass lift flex h-full items-center gap-4 p-[22px]">
                <direction.icon size={24} strokeWidth={1.1} stroke="url(#goldStroke)" className="shrink-0" />
                <h3 className="font-display text-[18px] leading-snug">{direction.title}</h3>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/CategoryGrid.tsx`
```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryGroups } from "@/lib/catalog";
import { Reveal } from "@/components/ui/Reveal";

export function CategoryGrid() {
  return (
    <section className="sec pt-0">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">Каталог</p>
          <h2 className="mt-6 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)]">
            Плодовые деревья и <span className="gold-text">ягодные кустарники</span>
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-16">
          {categoryGroups.map((group) => (
            <div key={group.title}>
              <Reveal>
                <div className="flex flex-col gap-3 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
                  <h3 className="font-display text-[24px]">{group.title}</h3>
                  <p className="text-[14px] text-fg-muted">{group.description}</p>
                </div>
              </Reveal>

              <div className="mt-[15px] grid gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
                {group.categories.map((category, index) => (
                  <Reveal key={category.slug} delay={index * 0.06}>
                    <Link
                      href={`/catalog?culture=${category.slug}`}
                      className="glass lift group flex h-full items-start justify-between gap-4 p-[22px]"
                    >
                      <span>
                        <span className="block font-display text-[19px] text-fg transition-colors duration-300 group-hover:text-gold-light">
                          {category.name}
                        </span>
                        <span className="mt-2 block text-[13.5px] text-fg-muted">{category.note}</span>
                      </span>
                      <ArrowUpRight
                        size={19}
                        strokeWidth={1.4}
                        className="mt-1 shrink-0 text-white/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                      />
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/CtaRibbon.tsx`
```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export function CtaRibbon() {
  return (
    <section className="pb-[108px]">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col items-start gap-7 rounded-2xl bg-[linear-gradient(120deg,#e4cfa8_0%,#c5a880_55%,#9c7a4e_100%)] px-8 py-9 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="max-w-2xl">
              <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] text-on-gold">
                Соберём сад под ваш участок
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-on-gold/80">
                Пришлите размер участка, регион и пожелания по культурам — вернёмся со схемой посадки, подбором
                сортов и расчётом партии.
              </p>
            </div>

            <Link
              href="/info"
              className="btn shrink-0 bg-emerald text-fg transition-transform duration-300 hover:-translate-y-0.5"
            >
              Оставить заявку
              <ArrowRight size={18} strokeWidth={1.7} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/OrchardCanvas.tsx`
```tsx
"use client";

import { useEffect, useRef } from "react";

type Branch = {
  x0: number;
  y0: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  x1: number;
  y1: number;
  phase: number;
  amplitude: number;
  buds: number[];
};

function pointOnCurve(branch: Branch, t: number, sway: number) {
  const u = 1 - t;
  const x =
    u * u * u * branch.x0 +
    3 * u * u * t * (branch.cx1 + sway) +
    3 * u * t * t * (branch.cx2 + sway * 1.6) +
    t * t * t * (branch.x1 + sway * 2);
  const y =
    u * u * u * branch.y0 + 3 * u * u * t * branch.cy1 + 3 * u * t * t * branch.cy2 + t * t * t * branch.y1;

  return { x, y };
}

/**
 * Фон героя: сеть ветвей с почками, медленно покачивается.
 * Аналог сети маршрутов в «Тёмном престиже», переведённый на язык сада.
 */
export function OrchardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    let branches: Branch[] = [];
    let frame = 0;
    let start = performance.now();

    const buildBranches = () => {
      const count = lite ? 7 : 14;
      branches = Array.from({ length: count }, (_, index) => {
        const spread = index / Math.max(count - 1, 1);
        const x0 = width * (-0.05 + spread * 0.5);
        const y0 = height * (1.05 - spread * 0.12);
        const x1 = width * (0.35 + spread * 0.72);
        const y1 = height * (0.62 - spread * 0.58);

        return {
          x0,
          y0,
          cx1: x0 + width * 0.1,
          cy1: y0 - height * 0.34,
          cx2: x1 - width * 0.22,
          cy2: y1 + height * 0.24,
          x1,
          y1,
          phase: index * 0.7,
          amplitude: lite ? 4 : 9 + (index % 4) * 3,
          buds: [0.36, 0.58, 0.79].slice(0, lite ? 2 : 3),
        };
      });
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildBranches();
    };

    const draw = (now: number) => {
      const time = (now - start) / 1000;
      context.clearRect(0, 0, width, height);

      const stroke = context.createLinearGradient(0, height, width, 0);
      stroke.addColorStop(0, "rgba(156, 122, 78, 0.05)");
      stroke.addColorStop(0.45, "rgba(197, 168, 128, 0.42)");
      stroke.addColorStop(1, "rgba(228, 207, 168, 0.12)");

      branches.forEach((branch) => {
        const sway = reduceMotion ? 0 : Math.sin(time * 0.28 + branch.phase) * branch.amplitude;

        context.beginPath();
        context.moveTo(branch.x0, branch.y0);
        context.bezierCurveTo(
          branch.cx1 + sway,
          branch.cy1,
          branch.cx2 + sway * 1.6,
          branch.cy2,
          branch.x1 + sway * 2,
          branch.y1
        );
        context.strokeStyle = stroke;
        context.lineWidth = 1.15;
        context.stroke();

        branch.buds.forEach((t, budIndex) => {
          const { x, y } = pointOnCurve(branch, t, sway);
          const pulse = reduceMotion ? 0.55 : 0.42 + Math.sin(time * 0.9 + budIndex + branch.phase) * 0.28;

          context.beginPath();
          context.arc(x, y, 2.1, 0, Math.PI * 2);
          context.fillStyle = `rgba(228, 207, 168, ${Math.max(pulse, 0.15)})`;
          context.fill();

          if (!lite) {
            context.beginPath();
            context.arc(x, y, 7.5, 0, Math.PI * 2);
            context.fillStyle = `rgba(197, 168, 128, ${Math.max(pulse * 0.12, 0.03)})`;
            context.fill();
          }
        });
      });

      if (!reduceMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    start = performance.now();
    frame = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
```

---

## `frontend/components/catalog/Filters.tsx`
```tsx
import Link from "next/link";
import { X } from "lucide-react";
import type { FacetValue } from "@/lib/wp/varieties";
import { buildFilterHref, readParam, type FilterKey, type SearchParams } from "./filter-url";

type Group = {
  key: FilterKey;
  title: string;
  values: FacetValue[];
};

type FiltersProps = {
  groups: Group[];
  params: SearchParams;
  hasActive: boolean;
};

export function Filters({ groups, params, hasActive }: FiltersProps) {
  return (
    <aside className="lg:sticky lg:top-[110px]">
      <div className="glass p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Фильтры</p>
          {hasActive && (
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted transition-colors hover:text-gold"
            >
              <X size={13} strokeWidth={1.6} />
              Сбросить
            </Link>
          )}
        </div>

        {groups.map((group) => (
          <section key={group.key} className="mt-8 border-t border-white/8 pt-6 first-of-type:mt-7">
            <h2 className="font-display text-[17px]">{group.title}</h2>

            <ul className="mt-4 flex flex-col gap-1.5">
              {group.values.map((value) => {
                const active = readParam(params, group.key) === value.slug;

                return (
                  <li key={value.slug}>
                    <Link
                      href={buildFilterHref(params, group.key, value.slug)}
                      aria-current={active ? "true" : undefined}
                      className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-[14px] transition-colors ${
                        active
                          ? "border-gold/45 bg-gold/12 text-fg"
                          : "border-transparent text-fg-muted hover:border-white/12 hover:text-fg-soft"
                      }`}
                    >
                      <span>{value.name}</span>
                      <span className="text-[12px] text-fg-muted/70 tabular-nums">{value.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
```

---

## `frontend/components/catalog/PriceSwitch.tsx`
```tsx
import Link from "next/link";
import { buildFilterHref, isWholesale, type SearchParams } from "./filter-url";

/** Розница / опт переключаются ссылкой: фильтр остаётся в адресе и переживает перезагрузку. */
export function PriceSwitch({ params }: { params: SearchParams }) {
  const wholesale = isWholesale(params);

  const modes = [
    { label: "Розница", active: !wholesale, href: buildFilterHref({ ...params, price: undefined }, "price", null) },
    { label: "Опт", active: wholesale, href: buildFilterHref({ ...params, price: undefined }, "price", "opt") },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1">
      {modes.map((mode) => (
        <Link
          key={mode.label}
          href={mode.href}
          aria-current={mode.active ? "true" : undefined}
          className={`rounded-full px-5 py-2 text-[13.5px] transition-colors ${
            mode.active ? "bg-gold/18 text-fg" : "text-fg-muted hover:text-fg-soft"
          }`}
        >
          {mode.label}
        </Link>
      ))}
    </div>
  );
}
```

---

## `frontend/components/catalog/VarietyCard.tsx`
```tsx
import Image from "next/image";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { availabilityLabels, formatPrice, type Variety } from "@/lib/wp/varieties";

type VarietyCardProps = {
  variety: Variety;
  wholesale: boolean;
};

export function VarietyCard({ variety, wholesale }: VarietyCardProps) {
  const price = wholesale ? variety.priceWholesale : variety.priceRetail;
  const chips = [variety.ripening?.name, variety.saplingAge, variety.rootstock?.name].filter(Boolean) as string[];

  return (
    <Link href={`/catalog/${variety.slug}`} className="glass lift group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-4/3 overflow-hidden bg-[linear-gradient(150deg,#173d26_0%,#0d2517_100%)]">
        {variety.image ? (
          <Image
            src={variety.image.url}
            alt={variety.image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sprout size={44} strokeWidth={0.8} stroke="url(#goldStroke)" className="opacity-45" />
          </div>
        )}

        {variety.availability !== "in_stock" && (
          <span className="absolute left-4 top-4 border border-gold/30 bg-bg-deep/75 px-3 py-1.5 text-[11.5px] tracking-wide text-fg-soft backdrop-blur-sm">
            {availabilityLabels[variety.availability]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[22px]">
        {variety.culture && <p className="eyebrow">{variety.culture.name}</p>}

        <h3 className="mt-4 font-display text-[20px] leading-snug transition-colors group-hover:text-gold-light">
          {variety.title}
        </h3>

        {variety.excerpt && (
          <p className="mt-3 line-clamp-2 text-[14.5px] leading-relaxed text-fg-muted">{variety.excerpt}</p>
        )}

        {chips.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip} className="border border-white/10 px-2.5 py-1 text-[11.5px] text-fg-muted">
                {chip}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-7">
          <div>
            <p className="gold-text font-display text-[22px]">{formatPrice(price)}</p>
            {wholesale && variety.wholesaleMin && (
              <p className="mt-1 text-[12px] text-fg-muted">от {variety.wholesaleMin} шт</p>
            )}
          </div>
          <span className="text-[13px] text-fg-muted transition-colors group-hover:text-gold">Подробнее</span>
        </div>
      </div>
    </Link>
  );
}
```

---

## `frontend/components/catalog/filter-url.ts`
```typescript
export type SearchParams = Record<string, string | string[] | undefined>;

export const filterKeys = ["culture", "ripening", "region"] as const;

export type FilterKey = (typeof filterKeys)[number];

export function readParam(params: SearchParams, key: string): string | null {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single && single.length > 0 ? single : null;
}

/** Ссылка на каталог с переключённым значением фильтра: повторный клик снимает его. */
export function buildFilterHref(params: SearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams();

  for (const filterKey of [...filterKeys, "price"]) {
    const current = readParam(params, filterKey);
    if (current) next.set(filterKey, current);
  }

  if (value === null || readParam(params, key) === value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }

  const query = next.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

export function isWholesale(params: SearchParams): boolean {
  return readParam(params, "price") === "opt";
}
```

---

## `frontend/components/ui/Reveal.tsx`
```tsx
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
```

---

## `frontend/components/providers/MotionProvider.tsx`
```tsx
"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```

---

## `docs/GRAPHICS.md`
```md
# Графическое наполнение сайта «Сады Наследия»

Визуальный язык — «Тёмный престиж» в зелёной гамме: глубокий зелёный фон, металлическое золото, стеклянные поверхности. Документ описывает, какая графика нужна сайту, в каком виде и что предстоит снять или отрисовать.

## 1. Логотип и эмблема

### Что уже есть

- `frontend/public/brand/logo-source.png` — исходный логотип на бежевом фоне. Для тёмного сайта не годится: бежевая подложка вырежет прямоугольник на фоне.
- `frontend/components/brand/Emblem.tsx` — векторная эмблема в металлическом золоте: кольца, надпись «МЕЛИХОВЪ» по дуге, монограмма и лиственная веточка. Используется в навигации, подвале и как крупный водяной знак в герое.

### Что нужно от дизайнера

- Оригинал логотипа в **SVG** с разделёнными слоями: монограмма, дуговая надпись, растительный орнамент.
- Три версии: полная (эмблема + название), только эмблема, горизонтальная для узких мест.
- Монохромные варианты: золото, белый, тёмно-зелёный.
- Favicon 32×32 и 180×180, где читается только монограмма — мелкие детали в иконке пропадут.

Как только появится настоящий SVG, он заменит содержимое `Emblem.tsx`, а градиенты и анимация парения останутся прежними.

## 2. Фотография

### Обработка

Все фото на тёмном фоне идут в три слоя, как в исходном визуальном языке:

1. Размытая копия фоном: `blur(20–24px) saturate(125%) brightness(.76)`, увеличение 1.1
2. Виньетка сверху: тёмно-зелёный градиент снизу вверх
3. Основной кадр: `object-fit: contain`, внутренние отступы, мягкая тень

Это позволяет использовать кадры с разным светом и кадрированием, не ломая композицию карточек.

### Что снимать

Съёмку удобно разделить на четыре группы.

**Каталог, главное.** Саженец целиком на однотонном фоне: ствол, крона, корневая система, бирка с сортом. По кадру на каждую культуру минимум, в идеале — на каждый сорт. Именно эти фото продают.

**Детали.** Место прививки, почки, срез подвоя, корневой ком, паспорт сортности в руке. Такие макро-кадры закрывают блок «Паспорт сортности» и карточку сорта.

**Питомник.** Ряды маточника, поле в утреннем свете, теплицы, техника, работа с посадочным материалом. Нужны для страницы «О питомнике» и фоновых блоков.

**Люди.** Портреты агронома и основателя, работа в саду, передача саженцев покупателю. Круг 120×120 для карточек команды, горизонтальные кадры для блоков доверия.

**Плоды.** Урожай по культурам — яблоки, груши, вишня, слива, смородина. Идут в плитки категорий и в сезонные баннеры.

### Требования к файлам

- Исходники не менее 2400px по длинной стороне, без агрессивной ретуши и фильтров
- На сайт — WebP, ширина 1600px для героя, 800px для карточек
- Ориентация: для карточек каталога вертикальная, для секций горизонтальная
- Каждое фото загружается в медиатеку WordPress с осмысленным alt-текстом

## 3. Иллюстрации

Пока фотографий нет, а также там, где фото избыточно, работает **ботаническая линейная графика**: тонкие золотые контуры на тёмном фоне.

Нужен набор из десяти иконок-культур в едином стиле: яблоня, груша, вишня, черешня, слива, персик, абрикос, смородина, крыжовник, малина. Каждая — силуэт ветви с листом и плодом, обводка 1–1.5px, без заливки, в формате SVG 48×48 и 96×96.

Такой набор решает сразу три задачи: оживляет плитки категорий, служит подложкой для карточек без фото и даёт узнаваемый декор для внутренних страниц.

Дополнительно пригодятся два декоративных элемента: горизонтальная растительная виньетка-разделитель для секций и угловой орнамент из логотипа для стеклянных панелей.

## 4. Фон и текстуры

- **Герой.** Анимированная сеть ветвей на canvas: золотые кривые с пульсирующими почками (`OrchardCanvas.tsx`). На мобильных и при отключённой анимации упрощается автоматически.
- **Страница.** Многослойные радиальные градиенты зелёного с золотым подсветом, зафиксированы относительно окна.
- **Видео.** Опциональный слой в герое: положите ролик в `frontend/public/media/hero.mp4`, он подхватится сам и уйдёт под затемнение. Нужен короткий цикл 8–12 секунд, спокойное движение камеры по саду, без резких склеек. Вес до 6 МБ.
- **Шум.** Тонкая зернистость поверх фона убирает полосатость градиентов на больших экранах. Добавляется как PNG-тайл 128×128 с прозрачностью около 3%.

## 5. Иконки интерфейса

Lucide React, обводка 1–1.2px, размер 26–27px. Металлический градиент подключается через общий градиент: `stroke="url(#goldStroke)"`. Определения лежат в `components/brand/GoldDefs.tsx` и рендерятся один раз в layout.

Плоская заливка иконок золотом запрещена — только градиент, иначе теряется ощущение металла.

## 6. Заглушки

Карточка без фотографии не должна выглядеть сломанной. Заглушка — зелёный градиент `#173a24 → #0b1f14` с золотым радиальным свечением и полупрозрачной эмблемой 48px в центре при непрозрачности около 58%.

## 7. Изображения для соцсетей

- OG-картинка 1200×630: эмблема, название, короткий слоган на тёмно-зелёном градиенте с золотой рамкой
- Отдельные OG для каталога, услуг и страницы «О питомнике» — с соответствующим фото и той же типографикой
- Формируются генератором Next.js, чтобы не рисовать вручную под каждую страницу

## 8. Соглашения по файлам

```
frontend/public/
  brand/          логотип, эмблема, favicon
  media/          видео героя
  cultures/       линейные иконки культур
  textures/       шум и декоративные элементы
```

Фотографии контента живут в медиатеке WordPress, а не в репозитории: их подбирает и меняет редактор.

Именование: `culture-apple.svg`, `hero.mp4`, `noise.png` — латиница, нижний регистр, дефисы.

## 9. Приоритет работ

Сначала — то, без чего сайт выглядит незаполненным: набор иконок культур и десять фотографий саженцев по культурам. Затем видео героя и портреты. Фотографии сортов добавляются по мере наполнения каталога и не блокируют запуск.
```

---
