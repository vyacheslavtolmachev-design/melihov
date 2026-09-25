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
