"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { headerCta, navigation } from "@/lib/site";
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
      <header className="fixed inset-x-0 top-4 z-50 md:top-6">
        <div className="shell">
          <div
            data-scrolled={scrolled}
            className="nav-glass flex h-[72px] w-full items-center gap-5 px-4 md:h-[88px] md:gap-8 md:px-7 lg:px-8"
          >
            <Link href="/" aria-label="На главную" className="min-w-0 shrink-0">
              <Wordmark compact />
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-evenly xl:flex">
              {navigation.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  className={`group relative py-2.5 text-[14px] font-medium tracking-[0.04em] transition-colors duration-300 md:text-[14.5px] ${
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

            <div className="ml-auto flex shrink-0 items-center gap-3 xl:ml-0">
              <Link href={headerCta.href} className="btn btn-gold btn-gold-shine hidden md:inline-flex !px-7 !py-3 !text-[13.5px]">
                {headerCta.label}
                <ArrowRight size={17} strokeWidth={1.7} />
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Открыть меню"
                className="flex h-11 w-11 items-center justify-center text-fg xl:hidden"
              >
                <Menu size={24} strokeWidth={1.5} />
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
          className={`absolute inset-y-0 right-0 flex w-[86%] max-w-[380px] flex-col border-l border-gold/35 bg-[linear-gradient(160deg,rgba(24,38,28,.97),rgba(16,26,19,.98))] backdrop-blur-xl transition-transform duration-500 ${
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
            <Link href={headerCta.href} className="btn btn-gold btn-gold-shine w-full">
              {headerCta.label}
              <ArrowRight size={17} strokeWidth={1.6} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
