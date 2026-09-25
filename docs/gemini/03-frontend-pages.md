# 03-frontend-pages.md

---

## `frontend/lib/catalog.ts`
```typescript
export type Category = {
  name: string;
  slug: string;
  note: string;
};

export type CategoryGroup = {
  title: string;
  description: string;
  categories: Category[];
};

/** Четыре плитки в нижнем ряду геройской bento-сетки. */
export const heroTiles: Category[] = [
  { name: "Яблони", slug: "apple", note: "Летние, осенние, зимние" },
  { name: "Груши", slug: "pear", note: "Устойчивые к парше" },
  { name: "Косточковые", slug: "cherry", note: "Вишни, черешни, сливы" },
  { name: "Кустарники", slug: "currant", note: "Смородина и малина" },
];

export const categoryGroups: CategoryGroup[] = [
  {
    title: "Плодовые деревья",
    description: "Привитые саженцы на проверенных подвоях, с паспортом сорта.",
    categories: [
      { name: "Яблони", slug: "apple", note: "Летние, осенние и зимние сорта" },
      { name: "Груши", slug: "pear", note: "Устойчивые к парше" },
      { name: "Вишни", slug: "cherry", note: "Самоплодные формы" },
      { name: "Черешни", slug: "sweet-cherry", note: "Ранние и поздние" },
      { name: "Сливы", slug: "plum", note: "Домашняя и русская" },
      { name: "Персики", slug: "peach", note: "Для южных участков" },
      { name: "Абрикосы", slug: "apricot", note: "Морозостойкие сорта" },
    ],
  },
  {
    title: "Ягодные кустарники",
    description: "Урожай уже на второй сезон после посадки.",
    categories: [
      { name: "Смородина", slug: "currant", note: "Чёрная, красная, белая" },
      { name: "Крыжовник", slug: "gooseberry", note: "Бесшипные формы" },
      { name: "Малина", slug: "raspberry", note: "Ремонтантная и летняя" },
    ],
  },
];
```

---

## `frontend/lib/services.ts`
```typescript
import type { LucideIcon } from "lucide-react";
import {
  Grape,
  Handshake,
  Leaf,
  LayoutGrid,
  MapPinned,
  MessagesSquare,
  PackageCheck,
  Scissors,
  TreeDeciduous,
} from "lucide-react";

export type Direction = {
  icon: LucideIcon;
  title: string;
  text: string;
};

/** Виды деятельности питомника. Источник правды для страницы услуг и блока на главной. */
export const directions: Direction[] = [
  {
    icon: TreeDeciduous,
    title: "Саженцы плодовых деревьев",
    text: "Яблоня, груша, вишня, черешня, слива, персик и абрикос — выращиваем полный цикл в собственном питомнике.",
  },
  {
    icon: Grape,
    title: "Ягодные кустарники",
    text: "Смородина, крыжовник и малина: сильные однолетние и двухлетние кусты, готовые к посадке.",
  },
  {
    icon: PackageCheck,
    title: "Производство сортовых саженцев",
    text: "Производим и реализуем посадочный материал с подтверждённым сортом и подвоем.",
  },
  {
    icon: MapPinned,
    title: "Подбор районированных сортов",
    text: "Смотрим на климат, почву и уровень грунтовых вод участка и подбираем сорта под ваш регион.",
  },
  {
    icon: Scissors,
    title: "Прививка и окулировка",
    text: "Прививаем, окулируем и размножаем плодовые культуры, в том числе на ваших деревьях.",
  },
  {
    icon: Leaf,
    title: "Уход за маточными насаждениями",
    text: "Формирование, обрезка и содержание маточника — основа качества будущих саженцев.",
  },
  {
    icon: MessagesSquare,
    title: "Консультации агронома",
    text: "Посадка, полив, подкормка, обрезка и защита растений — сопровождаем на всех этапах.",
  },
  {
    icon: LayoutGrid,
    title: "Комплектация садов",
    text: "Подбираем культуры и сорта для закладки плодового или ягодного сада под задачу участка.",
  },
  {
    icon: Handshake,
    title: "Опт и розница",
    text: "Отгружаем частным садам, фермерским и коммерческим хозяйствам: от одного саженца до партии.",
  },
];
```

---

## `frontend/lib/wp/client.ts`
```typescript
const WP_INTERNAL_URL = process.env.WP_INTERNAL_URL ?? "http://wordpress";

export const WP_PUBLIC_URL = process.env.NEXT_PUBLIC_WP_URL ?? "http://localhost:8080";

type QueryOptions = {
  variables?: Record<string, unknown>;
  tags?: string[];
  revalidate?: number;
};

/**
 * Запрос к WPGraphQL по внутреннему адресу контейнера.
 * Возвращает null, если WordPress недоступен: витрина должна открываться и без CMS.
 */
export async function wpQuery<T>(query: string, options: QueryOptions = {}): Promise<T | null> {
  const { variables = {}, tags = [], revalidate = 300 } = options;

  try {
    const response = await fetch(`${WP_INTERNAL_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { tags: ["wp", ...tags], revalidate },
    });

    if (!response.ok) {
      console.warn(`[wp] ответ ${response.status} на GraphQL-запрос`);
      return null;
    }

    const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (payload.errors?.length) {
      console.warn("[wp] ошибки GraphQL:", payload.errors.map((error) => error.message).join("; "));
      return null;
    }

    return payload.data ?? null;
  } catch (error) {
    console.warn("[wp] WordPress недоступен:", error instanceof Error ? error.message : error);
    return null;
  }
}
```

---

## `frontend/lib/wp/media.ts`
```typescript
import { WP_PUBLIC_URL } from "./client";

const WP_INTERNAL_URL = process.env.WP_INTERNAL_URL ?? "http://wordpress";

/**
 * WordPress может отдать ссылку на медиа по внутреннему адресу контейнера,
 * который браузер не резолвит. Приводим такие ссылки к публичному адресу.
 */
export function toPublicMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith(WP_INTERNAL_URL)) {
    return `${WP_PUBLIC_URL}${url.slice(WP_INTERNAL_URL.length)}`;
  }

  if (url.startsWith("/")) {
    return `${WP_PUBLIC_URL}${url}`;
  }

  return url;
}
```

---

## `frontend/lib/wp/varieties.ts`
```typescript
import { wpQuery } from "./client";
import { toPublicMediaUrl } from "./media";

export type Term = { name: string; slug: string };

export type Availability = "in_stock" | "preorder" | "sold_out";

export type Variety = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: { url: string; alt: string } | null;
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
  const imageUrl = toPublicMediaUrl(image?.sourceUrl);

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: stripTags(raw.excerpt),
    content: raw.content ?? "",
    image: imageUrl ? { url: imageUrl, alt: image?.altText ?? raw.title } : null,
    culture: firstTerm(raw.cultures),
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

/** Все опубликованные сорта. Фильтрация идёт на витрине: объём каталога это позволяет. */
export async function getVarieties(): Promise<Variety[]> {
  const data = await wpQuery<{ varieties: { nodes: RawVariety[] } }>(
    `query Varieties { varieties(first: 200, where: { orderby: { field: TITLE, order: ASC } }) { nodes { ${VARIETY_FIELDS} } } }`,
    { tags: ["varieties"] },
  );

  return data?.varieties?.nodes?.map(mapVariety) ?? [];
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

export const availabilityLabels: Record<Availability, string> = {
  in_stock: "В наличии",
  preorder: "Под заказ",
  sold_out: "Нет в сезоне",
};

export function formatPrice(value: number | null): string {
  if (value === null) return "по запросу";
  return `${value.toLocaleString("ru-RU")} ₽`;
}
```

---

## `frontend/components/brand/GoldDefs.tsx`
```tsx
/**
 * Общие градиенты золота. Рендерятся один раз в layout, чтобы иконки Lucide и SVG
 * могли ссылаться на них через stroke="url(#goldStroke)" или fill="url(#goldMetal)".
 */
export function GoldDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7eeda" />
          <stop offset="22%" stopColor="#e4cfa8" />
          <stop offset="45%" stopColor="#c5a880" />
          <stop offset="62%" stopColor="#9c7a4e" />
          <stop offset="82%" stopColor="#e4cfa8" />
          <stop offset="100%" stopColor="#faf4e6" />
        </linearGradient>

        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2e4c6" />
          <stop offset="35%" stopColor="#c5a880" />
          <stop offset="65%" stopColor="#9c7a4e" />
          <stop offset="100%" stopColor="#e4cfa8" />
        </linearGradient>

        <linearGradient id="goldSoft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e4cfa8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9c7a4e" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

---

## `frontend/components/brand/Emblem.tsx`
```tsx
type EmblemProps = {
  /** Уникальный идентификатор: внутри SVG есть ссылки по id, они не должны конфликтовать. */
  id?: string;
  className?: string;
};

/**
 * Круглая эмблема питомника: кольца, надпись «МЕЛИХОВЪ» по дуге,
 * монограмма «СН» и лиственная веточка. Всё в металлическом золоте.
 */
export function Emblem({ id = "emblem", className }: EmblemProps) {
  const arcId = `${id}-arc`;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Эмблема питомника «Сады Наследия», основатель МелиховЪ">
      <defs>
        <path id={arcId} d="M 34 104 A 66 66 0 0 1 166 104" fill="none" />
      </defs>

      <circle cx="100" cy="100" r="84" fill="none" stroke="url(#goldStroke)" strokeWidth="1.4" opacity="0.92" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="url(#goldStroke)" strokeWidth="0.7" opacity="0.45" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="url(#goldStroke)" strokeWidth="0.9" opacity="0.3" />

      <text
        fill="url(#goldMetal)"
        fontFamily="var(--font-manrope), sans-serif"
        fontSize="15"
        fontWeight="600"
        letterSpacing="3.4"
      >
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          МЕЛИХОВЪ
        </textPath>
      </text>

      {/* Веточка с двумя листьями — мотив из логотипа */}
      <g stroke="url(#goldStroke)" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M100 148 C 100 136, 100 128, 100 118" />
        <path d="M100 132 C 90 130, 83 122, 82 112 C 92 112, 99 120, 100 130 Z" fill="url(#goldSoft)" />
        <path d="M100 126 C 110 124, 117 116, 118 106 C 108 106, 101 114, 100 124 Z" fill="url(#goldSoft)" />
      </g>

      <text
        x="100"
        y="112"
        textAnchor="middle"
        fill="url(#goldMetal)"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="56"
        fontWeight="700"
        letterSpacing="-2"
      >
        СН
      </text>

      <g stroke="url(#goldStroke)" strokeWidth="1.2" fill="none" opacity="0.75">
        <path d="M70 158 A 46 46 0 0 0 130 158" />
      </g>
      <circle cx="63" cy="150" r="2" fill="url(#goldMetal)" />
      <circle cx="137" cy="150" r="2" fill="url(#goldMetal)" />
    </svg>
  );
}
```

---

## `frontend/components/brand/Wordmark.tsx`
```tsx
import { Emblem } from "./Emblem";

type WordmarkProps = {
  id?: string;
  compact?: boolean;
};

export function Wordmark({ id = "wordmark", compact = false }: WordmarkProps) {
  return (
    <span className="flex items-center gap-3">
      <Emblem id={id} className={compact ? "h-11 w-11" : "h-14 w-14"} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-bold uppercase tracking-[0.2em] text-fg md:text-base">
          Сады Наследия
        </span>
        <span className="mt-1.5 font-body text-[0.55rem] uppercase tracking-[0.34em] text-gold">
          Питомник плодовых деревьев
        </span>
      </span>
    </span>
  );
}
```

---
