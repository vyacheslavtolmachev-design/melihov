import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { headerCta } from "@/lib/site";

export function CtaRibbon() {
  return (
    <section className="pb-[108px]">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col items-start gap-7 rounded-2xl bg-panel px-8 py-9 ring-1 ring-gold/25 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="max-w-2xl">
              <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] text-fg">
                Соберём сад под ваш участок
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-fg-muted">
                Пришлите размер участка, регион и пожелания по культурам — вернёмся со схемой посадки и подбором
                сортов.
              </p>
            </div>

            <Link
              href={headerCta.href}
              className="btn btn-gold shrink-0"
            >
              {headerCta.label}
              <ArrowRight size={18} strokeWidth={1.7} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
