# 02-frontend-config-lib.md

---

## `frontend/package.json`
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack -H 0.0.0.0",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "lucide-react": "^1.28.0",
    "motion": "^13.0.0",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## `frontend/next.config.ts`
```typescript
import type { NextConfig } from "next";

const wpPublicUrl = process.env.NEXT_PUBLIC_WP_URL ?? "http://localhost:8080";
const { protocol, hostname, port } = new URL(wpPublicUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
```

---

## `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

---

## `frontend/Dockerfile.dev`
```
FROM node:22-alpine

WORKDIR /app

# Бинд-маунт с Windows не отдаёт inotify-события в контейнер, поэтому опрос файлов.
ENV NEXT_TELEMETRY_DISABLED=1 \
    WATCHPACK_POLLING=true \
    CHOKIDAR_USEPOLLING=true

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

---

## `frontend/postcss.config.mjs`
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

## `frontend/app/globals.css`
```css
@import "tailwindcss";

@theme {
  /* Фоны: глубокий зелёный вместо сапфира «Тёмного престижа» */
  --color-bg: #0a1f14;
  --color-bg-deep: #061509;
  --color-emerald: #10331f;
  --color-panel: #12301e;
  --color-panel-dark: #0d2616;

  /* Текст */
  --color-fg: #edf3ec;
  --color-fg-soft: #bfcebf;
  --color-fg-muted: #94a894;
  --color-on-gold: #14301c;

  /* Золото — фамильная бронза бренда */
  --color-gold: #c5a880;
  --color-gold-light: #e4cfa8;
  --color-gold-dark: #9c7a4e;

  --font-display: var(--font-playfair), Georgia, serif;
  --font-body: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family: var(--font-body);
    font-size: 16.5px;
    line-height: 1.74;
    color: var(--color-fg-soft);
    background-color: var(--color-bg);
    background-image:
      radial-gradient(1250px 720px at 10% -8%, rgba(24, 74, 45, 0.9), transparent 62%),
      radial-gradient(900px 620px at 92% 2%, rgba(197, 168, 128, 0.12), transparent 58%),
      radial-gradient(1100px 850px at 50% 112%, rgba(9, 32, 18, 0.95), transparent 62%);
    background-attachment: fixed;
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    color: var(--color-fg);
    font-weight: 700;
    letter-spacing: -0.018em;
    line-height: 1.14;
    text-wrap: balance;
  }

  ::selection {
    background: var(--color-gold);
    color: var(--color-on-gold);
  }

  :focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 3px;
  }
}

@layer components {
  .shell {
    width: 100%;
    max-width: 1200px;
    margin-inline: auto;
    padding-inline: 30px;
  }

  .sec {
    padding-block: 108px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--color-gold);
  }

  .eyebrow::before {
    content: "";
    width: 34px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-gold));
  }

  /* Золото всегда металлическое, никогда плоское */
  .gold-text {
    background-image: linear-gradient(
      100deg,
      #f7eeda 0%,
      #e4cfa8 22%,
      #c5a880 44%,
      #9c7a4e 60%,
      #e4cfa8 80%,
      #faf4e6 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .gold-rule {
    width: 48px;
    height: 2px;
    background: linear-gradient(90deg, #e4cfa8, #c5a880 55%, #9c7a4e);
  }

  .glass {
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
    backdrop-filter: blur(18px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow:
      0 22px 50px -26px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .glass-strong {
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.045));
    backdrop-filter: blur(22px) saturate(155%) brightness(1.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    box-shadow:
      0 28px 56px -26px rgba(0, 0, 0, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .lift {
    transition:
      transform 0.45s cubic-bezier(0.16, 0.8, 0.24, 1),
      border-color 0.45s ease,
      box-shadow 0.45s ease;
  }

  .lift:hover {
    transform: translateY(-6px);
    border-color: rgba(197, 168, 128, 0.45);
    box-shadow:
      0 42px 82px -30px rgba(0, 0, 0, 0.82),
      0 0 26px -8px rgba(197, 168, 128, 0.28);
  }

  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    overflow: hidden;
    border-radius: 999px;
    padding: 14px 30px;
    font-family: var(--font-body);
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    transition: all 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  .btn-gold {
    background: linear-gradient(120deg, #e4cfa8, #c5a880 55%, #9c7a4e);
    color: var(--color-on-gold);
    box-shadow: 0 12px 30px -12px rgba(197, 168, 128, 0.6);
  }

  /* Блик проходит по кнопке при наведении */
  .btn-gold::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-140%) skewX(-18deg);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
    transition: transform 0.75s cubic-bezier(0.16, 0.8, 0.24, 1);
  }

  .btn-gold:hover {
    transform: translateY(-2px) scale(1.012);
    box-shadow: 0 22px 50px -14px rgba(197, 168, 128, 0.78);
  }

  .btn-gold:hover::after {
    transform: translateX(140%) skewX(-18deg);
  }

  .btn-ghost {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: var(--color-fg);
    backdrop-filter: blur(10px);
  }

  .btn-ghost:hover {
    transform: translateY(-2px);
    border-color: rgba(197, 168, 128, 0.6);
    background: rgba(197, 168, 128, 0.08);
  }

  .nav-glass {
    background: linear-gradient(140deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.035));
    backdrop-filter: blur(16px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    box-shadow: 0 24px 54px -30px rgba(0, 0, 0, 0.85);
    transition:
      background 0.45s ease,
      border-color 0.45s ease;
  }

  .nav-glass[data-scrolled="true"] {
    background: linear-gradient(140deg, rgba(9, 30, 18, 0.9), rgba(6, 20, 12, 0.82));
    border-color: rgba(197, 168, 128, 0.26);
  }

  .prose-panel :is(h2, h3) {
    margin-top: 2.2em;
    margin-bottom: 0.7em;
  }

  .prose-panel h2::after {
    content: "";
    display: block;
    margin-top: 0.55em;
    width: 48px;
    height: 2px;
    background: linear-gradient(90deg, #e4cfa8, #c5a880 55%, #9c7a4e);
  }

  .prose-panel ul {
    list-style: none;
    padding: 0;
  }

  .prose-panel li {
    position: relative;
    padding-left: 22px;
    margin-block: 0.6em;
  }

  .prose-panel li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.72em;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(120deg, #e4cfa8, #9c7a4e);
  }
}

@media (max-width: 860px) {
  .sec {
    padding-block: 72px;
  }
}

@media (max-width: 768px) {
  .shell {
    padding-inline: 14px;
  }

  body {
    font-size: 16px;
    background-attachment: scroll;
  }

  /* Perf-lite: тяжёлое стекло и подъёмы на мобильных отключены */
  .glass,
  .glass-strong,
  .nav-glass {
    backdrop-filter: blur(10px);
  }

  .lift:hover {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .btn,
  .lift,
  .nav-glass {
    transition: none;
  }

  .btn-gold::after {
    display: none;
  }

  .lift:hover,
  .btn-gold:hover,
  .btn-ghost:hover {
    transform: none;
  }
}
```

---

## `frontend/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { GoldDefs } from "@/components/brand/GoldDefs";
import { site } from "@/lib/site";

const playfair = Playfair_Display({
  subsets: ["cyrillic", "latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} — ${site.tagline} ${site.founder}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${playfair.variable} ${manrope.variable}`}>
      <body className="min-h-screen">
        <GoldDefs />
        <MotionProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
```

---

## `frontend/app/page.tsx`
```tsx
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { Directions } from "@/components/home/Directions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CtaRibbon } from "@/components/home/CtaRibbon";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <Directions />
      <CategoryGrid />
      <CtaRibbon />
    </>
  );
}
```

---

## `frontend/app/about/page.tsx`
```tsx
import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = {
  title: "О питомнике",
};

export default function AboutPage() {
  return (
    <PagePlaceholder
      eyebrow="О питомнике"
      title="История бренда МелиховЪ и"
      accent="философия наследия"
      description="Питомник выращивает посадочный материал для частных садов, фермерских хозяйств и коммерческих садов. Сад — это вложение на десятилетия, поэтому мы отвечаем не за проданный саженец, а за дерево, которое будет плодоносить, когда вырастут дети владельца участка."
      points={[
        "Как устроен маточник и почему мы не перекупаем посадочный материал",
        "Принципы отбора сортов и работы с подвоями",
        "Гарантии на приживаемость и сортовое соответствие",
        "Команда питомника и агрономическая служба",
      ]}
    />
  );
}
```

---

## `frontend/app/services/page.tsx`
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { directions } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Виды деятельности",
  description:
    "Выращивание саженцев плодовых деревьев и ягодных кустарников, подбор районированных сортов, прививка, обрезка, комплектация садов, консультации агронома.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Виды деятельности"
        title="Питомник плодовых и"
        accent="ягодных культур"
        lead="Выращиваем качественный посадочный материал для частных садов, фермерских хозяйств и коммерческих садов."
      />

      <section className="pb-20">
        <div className="shell">
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {directions.map((direction, index) => (
              <Reveal key={direction.title} delay={(index % 3) * 0.08}>
                <article className="glass lift h-full p-[22px]">
                  <direction.icon size={27} strokeWidth={1.1} stroke="url(#goldStroke)" />
                  <h2 className="mt-6 font-display text-[20px]">{direction.title}</h2>
                  <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">{direction.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="glass-strong flex flex-col gap-8 p-8 md:p-11 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">Кому отгружаем</p>
                <h2 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                  Для сада, дачи и <span className="gold-text">фермерского хозяйства</span>
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-fg-muted">
                  Здоровые саженцы, проверенные сорта и профессиональный подход — от одного дерева для дачного
                  участка до партии на закладку коммерческого сада.
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
              </div>

              <Link href="/info" className="btn btn-gold shrink-0">
                Оставить заявку
                <ArrowRight size={18} strokeWidth={1.7} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/app/info/page.tsx`
```tsx
import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = {
  title: "Покупателям",
};

export default function InfoPage() {
  return (
    <PagePlaceholder
      eyebrow="Покупателям"
      title="Доставка, оплата и"
      accent="самовывоз из питомника"
      description="Отгружаем частным участкам и фермерским хозяйствам. Саженцы готовим к перевозке так, чтобы корневая система дошла живой."
      points={[
        "Условия доставки по регионам и сроки отгрузки",
        "Оплата для частных лиц и по счёту для хозяйств",
        "Подготовка корневой системы к транспортировке",
        "Карта проезда к питомнику и время работы для самовывоза",
        "Форма заявки на подбор сада",
      ]}
    />
  );
}
```

---

## `frontend/app/catalog/page.tsx`
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Filters } from "@/components/catalog/Filters";
import { PriceSwitch } from "@/components/catalog/PriceSwitch";
import { VarietyCard } from "@/components/catalog/VarietyCard";
import { filterKeys, isWholesale, readParam, type SearchParams } from "@/components/catalog/filter-url";
import { buildFacets, getVarieties } from "@/lib/wp/varieties";

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

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const wholesale = isWholesale(params);

  const varieties = await getVarieties();

  const groups = filterKeys.map((key) => ({
    key,
    title: groupTitles[key],
    values: buildFacets(varieties, key),
  }));

  const active = filterKeys.filter((key) => readParam(params, key) !== null);

  const visible = varieties.filter((variety) =>
    active.every((key) => variety[key]?.slug === readParam(params, key)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Каталог"
        title="Саженцы плодовых и"
        accent="ягодных культур"
        lead="Каждый сорт выращен в собственном питомнике: подтверждённый сорт, здоровый подвой и понятные правила посадки."
      />

      <section className="pb-[108px]">
        <div className="shell">
          <div className="grid gap-9 lg:grid-cols-[264px_1fr]">
            <Filters groups={groups} params={params} hasActive={active.length > 0} />

            <div>
              <div className="flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] text-fg-muted">
                  {visible.length > 0 ? `Найдено сортов: ${visible.length}` : "Ничего не найдено"}
                </p>
                <PriceSwitch params={params} />
              </div>

              {wholesale && (
                <p className="mt-6 border border-gold/20 bg-gold/6 px-5 py-4 text-[14px] text-fg-soft">
                  Оптовые цены действуют от указанной партии. Точная стоимость фиксируется в заявке.
                </p>
              )}

              {visible.length > 0 ? (
                <div className="mt-8 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((variety, index) => (
                    <Reveal key={variety.id} delay={(index % 3) * 0.07}>
                      <VarietyCard variety={variety} wholesale={wholesale} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="glass mt-8 p-11 text-center">
                  <h2 className="font-display text-[22px]">
                    {varieties.length === 0 ? "Каталог наполняется" : "Под такие условия сортов нет"}
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                    {varieties.length === 0
                      ? "Сорта добавляются в CMS. Напишите нам — подберём культуру и сорт под ваш участок вручную."
                      : "Попробуйте снять часть фильтров или свяжитесь с нами: подберём подходящий сорт под ваш регион."}
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {varieties.length > 0 && (
                      <Link href="/catalog" className="btn btn-ghost">
                        Сбросить фильтры
                      </Link>
                    )}
                    <Link href="/info" className="btn btn-gold">
                      Оставить заявку
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/app/catalog/[slug]/page.tsx`
```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Shovel, Sprout } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { availabilityLabels, formatPrice, getVarietyBySlug, getVarieties } from "@/lib/wp/varieties";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const variety = await getVarietyBySlug(slug);

  if (!variety) {
    return { title: "Сорт не найден" };
  }

  return {
    title: variety.title,
    description: variety.excerpt || `${variety.title} — саженцы из питомника «Сады Наследия».`,
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

  const related = (await getVarieties())
    .filter((item) => item.slug !== variety.slug && item.culture?.slug === variety.culture?.slug)
    .slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-[132px]">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#17452b_0%,#0e2c1b_58%,rgba(5,19,11,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

        <div className="shell relative z-10 pt-16">
          <Reveal>
            <nav className="flex flex-wrap items-center gap-2 text-[12.5px] text-fg-muted">
              <Link href="/" className="transition-colors hover:text-gold">
                Главная
              </Link>
              <ChevronRight size={14} strokeWidth={1.5} />
              <Link href="/catalog" className="transition-colors hover:text-gold">
                Каталог
              </Link>
              {variety.culture && (
                <>
                  <ChevronRight size={14} strokeWidth={1.5} />
                  <Link
                    href={`/catalog?culture=${variety.culture.slug}`}
                    className="transition-colors hover:text-gold"
                  >
                    {variety.culture.name}
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
              <div className="glass relative aspect-4/3 overflow-hidden bg-[linear-gradient(150deg,#173d26_0%,#0d2517_100%)]">
                {variety.image ? (
                  <Image
                    src={variety.image.url}
                    alt={variety.image.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Sprout size={72} strokeWidth={0.7} stroke="url(#goldStroke)" className="opacity-40" />
                  </div>
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
                      <p className="gold-text mt-2 font-display text-[30px] leading-none">
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

                  <Link href="/info" className="btn btn-gold mt-8 w-full justify-center">
                    Оставить заявку
                    <ArrowRight size={18} strokeWidth={1.7} />
                  </Link>

                  <p className="mt-5 text-center text-[12.5px] leading-relaxed text-fg-muted">
                    Отвечаем в течение рабочего дня: уточняем наличие, сроки выкопки и способ доставки.
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
                      <p className="gold-text mt-auto pt-6 font-display text-[20px]">
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
```

---

## `frontend/app/api/revalidate/route.ts`
```typescript
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return Response.json({ error: "REVALIDATE_SECRET не задан" }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as { secret?: string; reason?: string } | null;

  if (!payload || payload.secret !== secret) {
    return Response.json({ error: "Неверный секрет" }, { status: 403 });
  }

  // Next 16 требует профиль времени жизни: "max" помечает тег устаревшим немедленно
  revalidateTag("wp", "max");

  return Response.json({ revalidated: true, reason: payload.reason ?? null });
}
```

---

## `frontend/lib/site.ts`
```typescript
export const site = {
  name: "Сады Наследия",
  founder: "МелиховЪ",
  tagline: "Питомник плодовых и ягодных культур",
  description:
    "Питомник плодовых и ягодных культур «Сады Наследия». Выращиваем сортовые саженцы для частных садов, фермерских хозяйств и коммерческих садов: районированные сорта, паспорт сортности, сопровождение агронома.",
  audiences: ["Частные сады и дачи", "Фермерские хозяйства", "Коммерческие сады"],
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const navigation: NavItem[] = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "/catalog" },
  { label: "Услуги", href: "/services" },
  { label: "О питомнике", href: "/about" },
  { label: "Покупателям", href: "/info" },
];
```

---
