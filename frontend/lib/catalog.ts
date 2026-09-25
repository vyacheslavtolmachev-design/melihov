export type Category = {
  name: string;
  /** Единственное число: имя термина множественное («Яблони»), для SEO-титула нужна «Яблоня». */
  singular: string;
  slug: string;
  note: string;
};

export type CategoryGroup = {
  title: string;
  description: string;
  categories: Category[];
};

/**
 * Порядок внутри групп — по объёму каталога: футер (`Footer.tsx`) показывает
 * первые пять деревьев, туда должны попадать самые массовые культуры.
 */
export const categoryGroups: CategoryGroup[] = [
  {
    title: "Плодовые деревья",
    description: "Привитые саженцы на проверенных подвоях, с паспортом сорта.",
    categories: [
      { name: "Яблони", singular: "Яблоня", slug: "apple", note: "Летние, осенние и зимние сорта" },
      { name: "Сливы", singular: "Слива", slug: "plum", note: "Домашняя и русская" },
      { name: "Груши", singular: "Груша", slug: "pear", note: "Устойчивые к парше" },
      { name: "Черешни", singular: "Черешня", slug: "sweet-cherry", note: "Ранние и поздние" },
      { name: "Вишни", singular: "Вишня", slug: "cherry", note: "Самоплодные формы" },
      { name: "Персики", singular: "Персик", slug: "peach", note: "Для южных участков" },
      { name: "Абрикосы", singular: "Абрикос", slug: "apricot", note: "Морозостойкие сорта" },
      { name: "Колоновидные яблони", singular: "Колоновидная яблоня", slug: "columnar-apple", note: "Компактные, для тесных участков" },
    ],
  },
  {
    title: "Ягодные кустарники",
    description: "Урожай уже на второй сезон после посадки.",
    categories: [
      { name: "Смородина", singular: "Смородина", slug: "currant", note: "Чёрная, красная, белая" },
      { name: "Крыжовник", singular: "Крыжовник", slug: "gooseberry", note: "Бесшипные формы" },
      { name: "Войлочная вишня", singular: "Войлочная вишня", slug: "felt-cherry", note: "Кустовая, ранняя" },
      { name: "Малина", singular: "Малина", slug: "raspberry", note: "Ремонтантная и летняя" },
      { name: "Йошта", singular: "Йошта", slug: "josta", note: "Гибрид смородины и крыжовника" },
    ],
  },
];

const singularByCulture = new Map(
  categoryGroups.flatMap((group) => group.categories.map((category) => [category.slug, category.singular])),
);

/** «Яблоня» вместо «Яблони» — для заголовков, где культура стоит перед названием сорта. */
export function cultureSingular(slug: string | null | undefined, fallback: string): string {
  return (slug && singularByCulture.get(slug)) || fallback;
}
