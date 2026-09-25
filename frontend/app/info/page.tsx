import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { RequestForm } from "@/components/request/RequestForm";
import { RequestListPanel } from "@/components/request/RequestListPanel";
import { contactChannels, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Покупателям",
  description:
    "Оформление заявки на саженцы, контакты питомника, самовывоз и оплата при получении. Оптовым покупателям — звоните.",
};

export default function InfoPage() {
  const { contacts, location } = site;

  return (
    <>
      <PageHeader
        eyebrow="Покупателям"
        title="Заявка, самовывоз и"
        accent="контакты питомника"
        lead="Один поток для всех: соберите лист заявки из каталога или напишите нам напрямую. Оплата при получении, отгрузка — самовывозом."
      />

      <section className="pb-16">
        <div className="shell">
          <Reveal>
            <div className="glass-strong flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div className="max-w-2xl">
                <p className="eyebrow">Оптовым покупателям</p>
                <h2 className="mt-4 font-display text-[clamp(1.4rem,2.4vw,1.85rem)]">
                  Если вы оптовый покупатель — <span className="gold-text">звоните</span>
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                  Партии, сроки выкопки и условия отгрузки согласуем по телефону. Лист заявки на сайте — для розничного
                  подбора сортов.
                </p>
              </div>
              <a href={contacts.phoneHref} className="btn btn-gold shrink-0">
                <Phone size={18} strokeWidth={1.6} />
                {contacts.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="shell grid gap-8 lg:grid-cols-2">
          <Reveal>
            <RequestListPanel />
          </Reveal>
          <Reveal delay={0.08}>
            <RequestForm intent="order" />
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="shell grid gap-[18px] md:grid-cols-3">
          <Reveal>
            <article className="glass h-full p-[22px]">
              <h2 className="font-display text-[20px]">Как оформить</h2>
              <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">
                Выберите сорта в каталоге, добавьте в лист заявки и отправьте форму — или свяжитесь любым удобным
                способом. Мы уточним наличие и срок самовывоза.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.06}>
            <article className="glass h-full p-[22px]">
              <h2 className="font-display text-[20px]">Самовывоз</h2>
              <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">
                Забрать саженцы можно в питомнике: {location.place}, {location.region}. Доставку пока не организуем —
                согласуем дату отгрузки при заявке.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.12}>
            <article className="glass h-full p-[22px]">
              <h2 className="font-display text-[20px]">Оплата</h2>
              <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">
                Оплата при получении. Онлайн-оплаты на сайте нет — состав и стоимость фиксируем при подтверждении
                заявки.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="glass max-w-[900px] p-8 md:p-11">
              <p className="eyebrow">Контакты</p>
              <h2 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                Свяжитесь с нами <span className="gold-text">удобным способом</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                Ниже — временные заглушки. Реальные телефон, почта, Telegram и Max появятся после подтверждения
                питомником.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {contactChannels.map((channel) => (
                  <li key={channel.key}>
                    <p className="text-[12px] uppercase tracking-[0.14em] text-fg-muted">{channel.label}</p>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="mt-2 block text-[16px] text-fg-soft transition-colors hover:text-gold-light"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      // Адреса ещё нет — показываем текстом, чтобы ссылка не вела в пустоту
                      <p className="mt-2 block text-[16px] text-fg-soft">{channel.value}</p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/catalog" className="btn btn-gold">
                  В каталог
                </Link>
                <Link href="/services" className="btn btn-ghost">
                  Подбор сада
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
