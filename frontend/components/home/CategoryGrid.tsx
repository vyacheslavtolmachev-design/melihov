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
