import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Filters } from "@/components/catalog/Filters";
import { PriceSwitch } from "@/components/catalog/PriceSwitch";
import { SearchBox } from "@/components/catalog/SearchBox";
import { VarietyCard } from "@/components/catalog/VarietyCard";
import {
  filterKeys,
  isWholesale,
  readParam,
  readQuery,
  type SearchParams,
} from "@/components/catalog/filter-url";
import { buildFacets, getVarieties, type Variety } from "@/lib/wp/varieties";
import { categoryGroups } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Каталог саженцев",
  description:
    "Сортовые саженцы плодовых деревьев и ягодных кустарников: подбор по культуре, сроку созревания и региону. Розничные и оптовые цены.",
};

const groupTitles: Record<(typeof filterKeys)[number], string> = {
  culture: "Культура",
  ripening: "Срок созревания",
  region: "Регион",
};

/** Порядок культур в выдаче — как в категориях сайта, а не по алфавиту. */
const cultureOrder = categoryGroups.flatMap((group) => group.categories.map((category) => category.slug));

function matchesQuery(variety: Variety, query: string): boolean {
  return variety.title.toLocaleLowerCase("ru").includes(query);
}

/** Сорта, разложенные по культурам в порядке категорий сайта. */
function groupByCulture(varieties: Variety[]) {
  const sections = new Map<string, { title: string; items: Variety[] }>();

  for (const variety of varieties) {
    const slug = variety.culture?.slug ?? "other";
    const title = variety.culture?.name ?? "Прочее";
    const section = sections.get(slug);

    if (section) {
      section.items.push(variety);
    } else {
      sections.set(slug, { title, items: [variety] });
    }
  }

  return [...sections.entries()]
    .map(([slug, section]) => ({ slug, ...section }))
    .sort((a, b) => {
      const left = cultureOrder.indexOf(a.slug);
      const right = cultureOrder.indexOf(b.slug);
      return (left === -1 ? cultureOrder.length : left) - (right === -1 ? cultureOrder.length : right);
    });
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const wholesale = isWholesale(params);
  const query = readQuery(params).toLocaleLowerCase("ru");

  const varieties = await getVarieties();

  // Группы без значений не показываем: пока у сортов не заполнены сроки и регионы,
  // такой фильтр — пустой заголовок в панели.
  const groups = filterKeys
    .map((key) => ({ key, title: groupTitles[key], values: buildFacets(varieties, key) }))
    .filter((group) => group.values.length > 0);

  const active = filterKeys.filter((key) => readParam(params, key) !== null);

  const visible = varieties
    .filter((variety) => active.every((key) => variety[key]?.slug === readParam(params, key)))
    .filter((variety) => (query ? matchesQuery(variety, query) : true));

  // Сплошная сетка нужна там, где выборка уже сужена. Полный каталог — за сотню
  // карточек, его читают только разбитым на культуры.
  const sections =
    readParam(params, "culture") === null && !query ? groupByCulture(visible) : null;

  return (
    <>
      <PageHeader
        eyebrow="Каталог"
        title="Галерея сортов и"
        accent="посадочного материала"
        lead="Смотрите фото и описания, сравнивайте культуры. Цены — ориентир; заказ собирается листом заявки на странице покупателям."
      />

      <section className="pb-[108px]">
        <div className="shell">
          <div className="grid gap-9 lg:grid-cols-[264px_1fr]">
            <Filters groups={groups} params={params} hasActive={active.length > 0} />

            <div>
              <SearchBox params={params} value={readQuery(params)} />

              <div className="mt-6 flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] text-fg-muted">
                  {visible.length > 0 ? `Найдено сортов: ${visible.length}` : "Ничего не найдено"}
                </p>
                <PriceSwitch params={params} />
              </div>

              {wholesale && (
                <p className="mt-6 border border-gold/20 bg-gold/6 px-5 py-4 text-[14px] text-fg-soft">
                  Оптовые цены — ориентир. Если вы оптовый покупатель —{" "}
                  <a href="/info" className="text-gold transition-colors hover:text-gold-light">
                    звоните
                  </a>
                  : партию и сроки согласуем по телефону.
                </p>
              )}

              {visible.length === 0 ? (
                <div className="glass mt-8 p-11 text-center">
                  <h2 className="font-display text-[22px]">
                    {varieties.length === 0 ? "Каталог наполняется" : "Под такие условия сортов нет"}
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                    {varieties.length === 0
                      ? "Сорта добавляются в CMS. Напишите нам — подберём культуру и сорт под ваш участок вручную."
                      : "Попробуйте изменить запрос или снять часть фильтров: подберём подходящий сорт под ваш регион."}
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {varieties.length > 0 && (
                      <Link href="/catalog" className="btn btn-ghost">
                        Сбросить фильтры
                      </Link>
                    )}
                    <Link href="/info" className="btn btn-gold">
                      К покупателям
                    </Link>
                  </div>
                </div>
              ) : sections ? (
                <div className="mt-10 flex flex-col gap-14">
                  {sections.map((section) => (
                    <section key={section.slug}>
                      <Reveal>
                        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/8 pb-4">
                          <h2 className="font-display text-[24px]">{section.title}</h2>
                          <p className="text-[13px] text-fg-muted tabular-nums">
                            {section.items.length}
                          </p>
                        </div>
                      </Reveal>

                      <div className="mt-7 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                        {section.items.map((variety, index) => (
                          <Reveal key={variety.id} delay={(index % 3) * 0.07}>
                            <VarietyCard variety={variety} wholesale={wholesale} />
                          </Reveal>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="mt-8 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((variety, index) => (
                    <Reveal key={variety.id} delay={(index % 3) * 0.07}>
                      <VarietyCard variety={variety} wholesale={wholesale} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
