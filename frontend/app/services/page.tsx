import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { RequestForm } from "@/components/request/RequestForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Подбор сада",
  description:
    "Консультация и заявка на подбор сортов под участок: культуры, схема посадки и комплектация сада с питомником «Сады Наследия».",
};

const consultPoints = [
  {
    title: "Подбор под участок",
    text: "Учитываем климат, почву, размер и задачу — от семейного сада до закладки хозяйства.",
  },
  {
    title: "Схема и культуры",
    text: "Предложим набор сортов и логику размещения, чтобы посадки не мешали друг другу и давали урожай по сезону.",
  },
  {
    title: "Сопровождение",
    text: "После подбора можно перейти к заявке на саженцы и уточнить самовывоз. Посадка и уход — с подсказками агронома.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Подбор сада"
        title="Консультация и заявка на"
        accent="комплектацию сада"
        lead="Не витрина продаж, а помощь с выбором: задайте вопросы и опишите участок — подберём культуры и сорта."
      />

      <section className="pb-16">
        <div className="shell grid gap-[18px] md:grid-cols-3">
          {consultPoints.map((point, index) => (
            <Reveal key={point.title} delay={index * 0.08}>
              <article className="glass h-full p-[22px]">
                <h2 className="font-display text-[20px]">{point.title}</h2>
                <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">{point.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <div className="shell grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <Reveal>
            <div className="glass p-8 md:p-10">
              <p className="eyebrow">Кому помогает</p>
              <h2 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                Частный участок и <span className="gold-text">хозяйство</span> — в одной заявке
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-fg-muted">
                Отдельных веток на сайте нет. В комментарии укажите масштаб задачи — от нескольких деревьев до партии.
                Оптовую отгрузку саженцев удобнее согласовать по телефону на странице покупателям.
              </p>
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {site.audiences.map((audience) => (
                  <li
                    key={audience}
                    className="rounded-full border border-gold/25 bg-gold/8 px-4 py-2 text-[13px] text-fg-soft"
                  >
                    {audience}
                  </li>
                ))}
              </ul>
              <Link href="/info" className="btn btn-ghost mt-8">
                К оформлению заказа
                <ArrowRight size={17} strokeWidth={1.6} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <RequestForm intent="consult" />
          </Reveal>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="glass-strong flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div className="max-w-2xl">
                <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.85rem)]">
                  Уже знаете сорта? Соберите <span className="gold-text">лист заявки</span>
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                  Каталог — фотогалерея продукции. Нужные позиции добавьте в заявку на странице «Покупателям».
                </p>
              </div>
              <Link href="/catalog" className="btn btn-gold shrink-0">
                Открыть каталог
                <ArrowRight size={18} strokeWidth={1.7} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
