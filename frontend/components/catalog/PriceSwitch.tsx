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
