# Сады Наследия — экспорт для Gemini

## Как использовать
1. Загрузите все файлы из docs/gemini/ в чат Gemini (или один FULL_EXPORT.md если он помещается)
2. В первом сообщении напишите: «Это проект сайта питомника. Помоги доработать [задача]»
3. Ссылайтесь на файлы по путям из дерева ниже

## Стек
- Next.js 16 (App Router) + React 19 + Tailwind v4 + Motion + Lucide
- WordPress headless (WPGraphQL + ACF) в Docker
- Коммерция через заявку, без WooCommerce

## Маршруты
| URL | Статус |
|-----|--------|
| / | Готово: Hero, УТП, виды деятельности, категории, CTA |
| /catalog | Готово: фильтры, розница/опт, карточки из WP |
| /catalog/[slug] | Готово: карточка сорта |
| /services | Готово: 9 видов деятельности |
| /about | Заглушка |
| /info | Заглушка (нужна форма заявки) |

## Дерево файлов
```
AGENTS.md
README.md
docker-compose.yml
.env.example
wordpress/bootstrap.sh
wordpress/seed-demo.sh
wordpress/uploads.ini
wordpress/wp-content/mu-plugins/heritage-content.php
wordpress/wp-content/mu-plugins/heritage-fields.php
frontend/package.json
frontend/next.config.ts
frontend/tsconfig.json
frontend/Dockerfile.dev
frontend/postcss.config.mjs
frontend/app/globals.css
frontend/app/layout.tsx
frontend/app/page.tsx
frontend/app/about/page.tsx
frontend/app/services/page.tsx
frontend/app/info/page.tsx
frontend/app/catalog/page.tsx
frontend/app/catalog/[slug]/page.tsx
frontend/app/api/revalidate/route.ts
frontend/lib/site.ts
frontend/lib/catalog.ts
frontend/lib/services.ts
frontend/lib/wp/client.ts
frontend/lib/wp/media.ts
frontend/lib/wp/varieties.ts
frontend/components/brand/GoldDefs.tsx
frontend/components/brand/Emblem.tsx
frontend/components/brand/Wordmark.tsx
frontend/components/layout/Header.tsx
frontend/components/layout/Footer.tsx
frontend/components/layout/PageHeader.tsx
frontend/components/layout/PagePlaceholder.tsx
frontend/components/home/Hero.tsx
frontend/components/home/ValueProps.tsx
frontend/components/home/Directions.tsx
frontend/components/home/CategoryGrid.tsx
frontend/components/home/CtaRibbon.tsx
frontend/components/home/OrchardCanvas.tsx
frontend/components/catalog/Filters.tsx
frontend/components/catalog/PriceSwitch.tsx
frontend/components/catalog/VarietyCard.tsx
frontend/components/catalog/filter-url.ts
frontend/components/ui/Reveal.tsx
frontend/components/providers/MotionProvider.tsx
docs/GRAPHICS.md
```
## Стартовый промпт для Gemini

```
Ты — senior frontend-разработчик. Перед тобой проект сайта питомника «Сады Наследия» (headless WordPress + Next.js).

Правила:
- Стиль «Тёмный престиж»: тёмно-зелёный фон, металлическое золото только градиентом (.gold-text, stroke="url(#goldStroke)")
- Шрифты: Playfair Display (заголовки) + Manrope (текст)
- Не выдумывай телефоны, адреса, цены — только то, что есть в коде
- Коммерция через заявку, без корзины и WooCommerce
- Tailwind v4: токены в globals.css через @theme, без tailwind.config.js
- Dev-сервер: next dev --webpack (не turbopack)

Следующая задача: [опишите здесь]
```
