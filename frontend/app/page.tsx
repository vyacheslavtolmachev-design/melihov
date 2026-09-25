import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { Directions } from "@/components/home/Directions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CtaRibbon } from "@/components/home/CtaRibbon";
import { getFeaturedArticle } from "@/lib/articles";
import { getVarieties, varietyPhoto } from "@/lib/wp/varieties";

/** Случайные плитки каталога в герое обновляются при запросе. */
export const dynamic = "force-dynamic";

function pickRandomVarieties<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export default async function HomePage() {
  const [varieties, featuredArticle] = await Promise.all([getVarieties(), Promise.resolve(getFeaturedArticle())]);
  const varietyTiles = pickRandomVarieties(varieties, 4).map((variety) => ({
    slug: variety.slug,
    title: variety.title,
    image: varietyPhoto(variety),
    culture: variety.culture,
    excerpt: variety.excerpt,
  }));

  return (
    <>
      <Hero featuredArticle={featuredArticle} varietyTiles={varietyTiles} />
      <ValueProps />
      <Directions />
      <CategoryGrid />
      <CtaRibbon />
    </>
  );
}
