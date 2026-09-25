import { wpQuery } from "./client";
import { toOptimizerMediaUrl } from "./media";
import { culturePlaceholderImage } from "@/lib/media-fallbacks";

export type Term = { name: string; slug: string };

export type Availability = "in_stock" | "preorder" | "sold_out";

export type Variety = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  /** Настоящий кадр из медиатеки WordPress. null — фотографию ещё не загрузили. */
  image: { url: string; alt: string } | null;
  /** Чем закрыть карточку, пока своего кадра нет: снимок культуры из public/media/catalog. */
  placeholder: string;
  culture: Term | null;
  ripening: Term | null;
  region: Term | null;
  rootstock: Term | null;
  priceRetail: number | null;
  priceWholesale: number | null;
  wholesaleMin: number | null;
  saplingAge: string | null;
  availability: Availability;
  plantingRules: string | null;
};

type RawTermList = { nodes: Term[] } | null;

type RawVariety = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: { node: { sourceUrl: string; altText: string | null } | null } | null;
  cultures: RawTermList;
  ripenings: RawTermList;
  regions: RawTermList;
  rootstocks: RawTermList;
  specs: {
    priceRetail: number | null;
    priceWholesale: number | null;
    wholesaleMin: number | null;
    saplingAge: string | null;
    // ACF отдаёт select списком даже без множественного выбора
    availability: string[] | string | null;
    plantingRules: string | null;
  } | null;
};

const VARIETY_FIELDS = `
  id
  title
  slug
  excerpt
  content
  featuredImage { node { sourceUrl altText } }
  cultures { nodes { name slug } }
  ripenings { nodes { name slug } }
  regions { nodes { name slug } }
  rootstocks { nodes { name slug } }
  specs {
    priceRetail
    priceWholesale
    wholesaleMin
    saplingAge
    availability
    plantingRules
  }
`;

function stripTags(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
    .trim();
}

function firstTerm(list: RawTermList): Term | null {
  return list?.nodes?.[0] ?? null;
}

function toAvailability(value: string[] | string | null | undefined): Availability {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "preorder" || raw === "sold_out" ? raw : "in_stock";
}

function mapVariety(raw: RawVariety): Variety {
  const image = raw.featuredImage?.node;
  // next/image сам оптимизирует картинку на сервере — ему нужен внутренний адрес,
  // не публичный порт хоста (frontend/lib/wp/media.ts).
  const imageUrl = toOptimizerMediaUrl(image?.sourceUrl);
  const culture = firstTerm(raw.cultures);

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: stripTags(raw.excerpt),
    content: raw.content ?? "",
    // Подстановку заглушки не смешиваем с настоящим фото: иначе каталог всегда
    // выглядит наполненным и не видно, каким сортам съёмка ещё нужна.
    image: imageUrl ? { url: imageUrl, alt: image?.altText ?? raw.title } : null,
    placeholder: culturePlaceholderImage(culture?.slug),
    culture,
    ripening: firstTerm(raw.ripenings),
    region: firstTerm(raw.regions),
    rootstock: firstTerm(raw.rootstocks),
    priceRetail: raw.specs?.priceRetail ?? null,
    priceWholesale: raw.specs?.priceWholesale ?? null,
    wholesaleMin: raw.specs?.wholesaleMin ?? null,
    saplingAge: raw.specs?.saplingAge ?? null,
    availability: toAvailability(raw.specs?.availability),
    plantingRules: raw.specs?.plantingRules ?? null,
  };
}

/**
 * WPGraphQL режет соединение на сто узлов, сколько ни проси в `first`,
 * и молча отдаёт первую сотню. Поэтому страницы забираем курсором.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

type VarietiesConnection = {
  nodes: RawVariety[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null } | null;
};

const VARIETIES_QUERY = `query Varieties($after: String) {
  varieties(first: ${PAGE_SIZE}, after: $after, where: { orderby: { field: TITLE, order: ASC } }) {
    pageInfo { hasNextPage endCursor }
    nodes { ${VARIETY_FIELDS} }
  }
}`;

/** Отдельная функция, а не вызов в теле цикла: иначе тип курсора и тип ответа выводятся друг через друга. */
function fetchVarietiesPage(after: string | null) {
  return wpQuery<{ varieties: VarietiesConnection | null }>(VARIETIES_QUERY, {
    variables: { after },
    tags: ["varieties"],
  });
}

/** Все опубликованные сорта. Фильтрация идёт на витрине: объём каталога это позволяет. */
export async function getVarieties(): Promise<Variety[]> {
  const nodes: RawVariety[] = [];
  let after: string | null = null;

  // Верхняя граница на случай, если WordPress вернёт курсор, не сдвигающий выборку.
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await fetchVarietiesPage(after);

    const connection = data?.varieties;
    if (!connection) break;

    nodes.push(...connection.nodes);

    const { hasNextPage, endCursor } = connection.pageInfo ?? { hasNextPage: false, endCursor: null };
    if (!hasNextPage || !endCursor) break;

    after = endCursor;
  }

  return nodes.map(mapVariety);
}

export async function getVarietyBySlug(slug: string): Promise<Variety | null> {
  const data = await wpQuery<{ variety: RawVariety | null }>(
    `query Variety($slug: ID!) { variety(id: $slug, idType: SLUG) { ${VARIETY_FIELDS} } }`,
    { variables: { slug }, tags: ["varieties", `variety:${slug}`] },
  );

  return data?.variety ? mapVariety(data.variety) : null;
}

export type FacetValue = Term & { count: number };

/** Считаем доступные значения фильтров по самим сортам, чтобы не показывать пустые варианты. */
export function buildFacets(varieties: Variety[], key: "culture" | "ripening" | "region"): FacetValue[] {
  const map = new Map<string, FacetValue>();

  for (const variety of varieties) {
    const term = variety[key];
    if (!term) continue;

    const existing = map.get(term.slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(term.slug, { ...term, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export type VarietyPhoto = {
  url: string;
  alt: string;
  /** true — показан общий кадр культуры, своей фотографии у сорта ещё нет.
   *  Флаг остаётся в модели: на нём стоит подпись под фото на странице сорта,
   *  и он же понадобится, когда появятся слои иллюстраций и таблиц. */
  pending: boolean;
};

/** Что рисовать в карточке: своё фото, а пока его нет — общий кадр культуры. */
export function varietyPhoto(variety: Pick<Variety, "image" | "placeholder" | "title" | "culture">): VarietyPhoto {
  if (variety.image) {
    return { url: variety.image.url, alt: variety.image.alt, pending: false };
  }

  // Alt описывает то, что на кадре, а не то, чего на нём нет: это снимок культуры,
  // а не сорта. Экранному читателю нельзя обещать «Антоновку», показывая яблоню.
  const alt = variety.culture
    ? `${variety.culture.name} — общий кадр культуры, фотографии сорта «${variety.title}» пока нет`
    : `Общий кадр питомника, фотографии сорта «${variety.title}» пока нет`;

  return { url: variety.placeholder, alt, pending: true };
}

export const availabilityLabels: Record<Availability, string> = {
  in_stock: "В наличии",
  preorder: "Под заказ",
  sold_out: "Нет в сезоне",
};

export function formatPrice(value: number | null): string {
  if (value === null) return "по запросу";
  return `${value.toLocaleString("ru-RU")} ₽`;
}
