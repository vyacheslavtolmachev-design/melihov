import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { aboutIntro, aboutLocation, aboutPillars } from "@/lib/about";
import { headerCta, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "О питомнике",
  description: `Питомник «${site.name}» работает ${site.experience}. ${site.location.place}, ${site.location.region}. Сортовые саженцы из собственного маточника для частных садов и хозяйств.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="О питомнике"
        title="Питомник, которому доверяют сад"
        accent="на десятилетия"
        lead={`«${site.name}» — ${site.tagline.toLowerCase()}. Работаем ${site.experience}: ${site.location.place}, ${site.location.region}.`}
      />

      <section className="pb-12">
        <div className="shell">
          <Reveal>
            <div className="media-frame relative aspect-21/9 overflow-hidden rounded-2xl md:aspect-3/1">
              <Image
                src="/media/articles/ryady-pitomnika.jpg"
                alt="Ряды питомника"
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-20">
        <div className="shell">
          <Reveal>
            <div className="prose-panel glass max-w-[900px] p-8 md:p-11">
              <div className="space-y-5">
                {aboutIntro.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[16.5px] leading-relaxed text-fg-soft">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-20">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">На чём держится питомник</p>
            <h2 className="mt-6 max-w-2xl font-display text-[clamp(1.85rem,3.2vw,2.5rem)]">
              Три опоры качества <span className="gold-text">посадочного материала</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-[18px] md:grid-cols-3">
            {aboutPillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 0.08}>
                <article className="glass lift h-full p-[22px]">
                  <pillar.icon size={27} strokeWidth={1.1} stroke="url(#goldStroke)" />
                  <h3 className="mt-6 font-display text-[20px]">{pillar.title}</h3>
                  <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">{pillar.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="shell">
          <Reveal>
            <div className="glass max-w-[900px] p-8 md:p-11">
              <p className="eyebrow">{aboutLocation.title}</p>
              <h2 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                {site.location.place},{" "}
                <span className="gold-text">{site.location.region}</span>
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-fg-soft">{aboutLocation.lead}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">{aboutLocation.note}</p>

              <ul className="mt-8 flex flex-wrap gap-2.5">
                {site.audiences.map((audience) => (
                  <li
                    key={audience}
                    className="rounded-full border border-gold/25 bg-gold/8 px-4 py-2 text-[13px] text-fg-soft"
                  >
                    {audience}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="glass-strong flex flex-col gap-8 p-8 md:p-11 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">Дальше — к сортам</p>
                <h2 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                  Посмотрите каталог или <span className="gold-text">подберите сад</span> вместе с нами
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-fg-muted">
                  В каталоге — культуры и сорта с характеристиками. Если нужен подбор под участок или партию для
                  хозяйства — оставьте задачу через «{headerCta.label}».
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link href="/catalog" className="btn btn-gold">
                  Смотреть каталог
                  <ArrowRight size={18} strokeWidth={1.7} />
                </Link>
                <Link href={headerCta.href} className="btn btn-ghost">
                  {headerCta.label}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
