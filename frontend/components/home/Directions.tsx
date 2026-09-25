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
