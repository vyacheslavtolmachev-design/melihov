import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone, Shovel } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { AddToRequestButton } from "@/components/request/AddToRequestButton";
import {
  availabilityLabels,
  formatPrice,
  getVarietyBySlug,
  getVarieties,
  varietyPhoto,
} from "@/lib/wp/varieties";
import { cultureSingular } from "@/lib/catalog";
import { site } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const variety = await getVarietyBySlug(slug);

  if (!variety) {
    return { title: "Сорт не найден" };
  }

  // В заголовке записи только название сорта: культура показана на странице отдельно.
  // Поисковику её нужно вернуть — «Флорина» без культуры ничего не значит.
  const name = variety.culture
    ? `${cultureSingular(variety.culture.slug, variety.culture.name)} ${variety.title}`
    : variety.title;

  return {
    title: name,
    description: variety.excerpt || `${name} — саженцы из питомника «Сады Наследия».`,
  };
}

export default async function VarietyPage({ params }: PageProps) {
  const { slug } = await params;
  const variety = await getVarietyBySlug(slug);

  if (!variety) {
    notFound();
  }

  const specs = [
    { label: "Культура", value: variety.culture?.name },
    { label: "Срок созревания", value: variety.ripening?.name },
    { label: "Подвой", value: variety.rootstock?.name },
    { label: "Возраст саженца", value: variety.saplingAge },
    { label: "Регион", value: variety.region?.name },
    { label: "Наличие", value: availabilityLabels[variety.availability] },
  ].filter((spec) => Boolean(spec.value));

  const photo = varietyPhoto(variety);

  const related = (await getVarieties())
    .filter((item) => item.slug !== variety.slug && item.culture?.slug === variety.culture?.slug)
    .slice(0, 3);

  return (
    <>
      <section className="page-top">
        <div className="shell relative z-10">
          <Reveal>
            <nav className="flex flex-wrap items-center gap-2 text-[12px] text-fg-muted">
              <Link href="/" className="transition-colors hover:text-gold-light">
                Главная
              </Link>
              <ChevronRight size={14} strokeWidth={1.5} />
              <Link href="/catalog" className="transition-colors hover:text-gold-light">
                Каталог
              </Link>
              {variety.culture && (
                <>
                  <ChevronRight size={14} strokeWidth={1.5} />
                  <Link
                    href={`/catalog?culture=${variety.culture.slug}`}
                    className="transition-colors hover:text-gold-light"
                  >
                    {variety.culture.name}
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
              <div>
                <div className="media-frame relative aspect-4/3 overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Оговорка живёт здесь, а не плашкой в сетке: на одной странице она
                    читается как честная подпись, а на 97 карточках — как стройка. */}
                {photo.pending && (
                  <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                    {variety.culture
                      ? `На снимке — ${variety.culture.name.toLowerCase()}, общий кадр культуры. Фотография сорта готовится.`
                      : "Общий кадр питомника. Фотография сорта готовится."}
                  </p>
                )}
              </div>

              <div className="lg:pt-2">
                {variety.culture && <p className="eyebrow">{variety.culture.name}</p>}

                <h1 className="mt-6 text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold">{variety.title}</h1>

                {variety.excerpt && (
                  <p className="mt-6 text-[16.5px] leading-relaxed text-fg-soft">{variety.excerpt}</p>
                )}

                <div className="glass-strong mt-9 p-7">
                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <p className="text-[12.5px] uppercase tracking-[0.14em] text-fg-muted">Розница</p>
                      <p className="mt-2 font-display text-[30px] leading-none text-gold-light">
                        {formatPrice(variety.priceRetail)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[12.5px] uppercase tracking-[0.14em] text-fg-muted">
                        Опт{variety.wholesaleMin ? ` от ${variety.wholesaleMin} шт` : ""}
                      </p>
                      <p className="mt-2 font-display text-[30px] leading-none text-fg">
                        {formatPrice(variety.priceWholesale)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <AddToRequestButton
                      slug={variety.slug}
                      title={variety.title}
                      culture={variety.culture?.name ?? null}
                      className="btn btn-gold w-full justify-center"
                    />
                    <a href={site.contacts.phoneHref} className="btn btn-ghost w-full justify-center">
                      <Phone size={17} strokeWidth={1.6} />
                      Опт — звоните
                    </a>
                  </div>

                  <p className="mt-5 text-center text-[12.5px] leading-relaxed text-fg-muted">
                    Розницу добавьте в лист заявки. Оптовую партию согласуем по телефону. Самовывоз, оплата при
                    получении.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
            <div className="flex flex-col gap-[18px]">
              {variety.content && (
                <Reveal>
                  <div
                    className="prose-panel glass p-8 md:p-10"
                    dangerouslySetInnerHTML={{ __html: variety.content }}
                  />
                </Reveal>
              )}

              {variety.plantingRules && (
                <Reveal>
                  <div className="glass p-8 md:p-10">
                    <Shovel size={26} strokeWidth={1.1} stroke="url(#goldStroke)" />
                    <h2 className="mt-6 font-display text-[24px]">Правила посадки</h2>
                    <p className="mt-4 whitespace-pre-line text-[15.5px] leading-relaxed text-fg-soft">
                      {variety.plantingRules}
                    </p>
                  </div>
                </Reveal>
              )}
            </div>

            <Reveal>
              <div className="glass p-8">
                <h2 className="font-display text-[22px]">Характеристики</h2>

                <dl className="mt-6 flex flex-col">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-baseline justify-between gap-5 border-b border-white/8 py-3.5 last:border-b-0"
                    >
                      <dt className="text-[14px] text-fg-muted">{spec.label}</dt>
                      <dd className="text-right text-[14.5px] text-fg-soft">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>

          {related.length > 0 && (
            <div className="mt-20">
              <Reveal>
                <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                  Другие сорта <span className="gold-text">этой культуры</span>
                </h2>
              </Reveal>

              <div className="mt-9 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item, index) => (
                  <Reveal key={item.id} delay={(index % 3) * 0.07}>
                    <Link href={`/catalog/${item.slug}`} className="glass lift flex h-full flex-col p-[22px]">
                      <h3 className="font-display text-[19px] leading-snug">{item.title}</h3>
                      {item.excerpt && (
                        <p className="mt-3 line-clamp-2 text-[14.5px] leading-relaxed text-fg-muted">
                          {item.excerpt}
                        </p>
                      )}
                      <p className="mt-auto pt-6 font-display text-[20px] text-gold-light">
                        {formatPrice(item.priceRetail)}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
