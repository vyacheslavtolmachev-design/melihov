import Link from "next/link";
import { categoryGroups } from "@/lib/catalog";
import { footerNavigation, site } from "@/lib/site";
import { Emblem3D } from "@/components/brand/Emblem3D";

export function Footer() {
  const year = new Date().getFullYear();
  const trees = categoryGroups[0]?.categories.slice(0, 5) ?? [];

  return (
    <footer className="border-t border-white/8 bg-bg-deep">
      <div className="shell grid gap-[46px] pb-16 pt-[70px] lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <Emblem3D className="h-[72px] w-[72px]" interactive={false} />
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
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-fg-muted">
            {site.location.place}, {site.location.region}
          </p>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-fg-muted">
            <a href={site.contacts.phoneHref} className="transition-colors hover:text-gold">
              {site.contacts.phone}
            </a>
            {" · "}
            <a href={site.contacts.emailHref} className="transition-colors hover:text-gold">
              {site.contacts.email}
            </a>
          </p>
        </div>

        <nav className="flex flex-col gap-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Разделы</p>
          {footerNavigation.map((navItem) => (
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
