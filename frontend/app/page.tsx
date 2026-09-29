import { Hero, type HeroCultureTile } from "@/components/home/Hero";
import { getFeaturedArticle } from "@/lib/articles";
import { categoryGroups } from "@/lib/catalog";
import { cultureOwnImage } from "@/lib/media-fallbacks";
import { getVarieties } from "@/lib/wp/varieties";

/** Случайные плитки культур в герое обновляются при запросе. */
export const dynamic = "force-dynamic";

function pickRandom<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/** Главная — один экран: герой и подвал, без прокрутки. Дальше — через меню и плитки героя. */
export default async function HomePage() {
  const [varieties, featuredArticle] = await Promise.all([getVarieties(), Promise.resolve(getFeaturedArticle())]);

  const counts = new Map<string, number>();
  for (const variety of varieties) {
    const slug = variety.culture?.slug;
    if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  // Только культуры со своим кадром: у заимствованных две плитки показали бы одно фото.
  // Пока WordPress недоступен, счётчиков нет — берём культуры без них.
  const candidates: HeroCultureTile[] = categoryGroups
    .flatMap((group) => group.categories)
    .flatMap((category) => {
      const image = cultureOwnImage(category.slug);
      const count = counts.get(category.slug) ?? 0;
      if (!image || (counts.size > 0 && count === 0)) return [];
      return [{ slug: category.slug, name: category.name, image, count }];
    });

  return <Hero featuredArticle={featuredArticle} cultureTiles={pickRandom(candidates, 4)} />;
}
