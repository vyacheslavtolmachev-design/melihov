import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";
import { siteUrl } from "@/lib/site";
import { getVarieties } from "@/lib/wp/varieties";

/**
 * Карта сайта собирается из тех же источников, что и страницы,
 * поэтому новый сорт или статья попадают в неё без ручной правки.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/catalog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/info`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${siteUrl}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  // Каталог живёт в WordPress: если он недоступен, карта всё равно должна отдаться
  const varieties = await getVarieties().catch(() => []);

  const varietyRoutes: MetadataRoute.Sitemap = varieties.map((variety) => ({
    url: `${siteUrl}/catalog/${variety.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = getArticles()
    .filter((article) => !article.externalUrl)
    .map((article) => ({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "yearly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...varietyRoutes, ...articleRoutes];
}
