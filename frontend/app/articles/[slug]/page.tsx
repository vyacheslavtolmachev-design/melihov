import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { getArticleBySlug, getArticles } from "@/lib/articles";
import { headerCta } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Материал не найден" };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

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
              <Link href="/articles" className="transition-colors hover:text-gold-light">
                Полезный материал
              </Link>
            </nav>

            <p className="eyebrow mt-8">Статья</p>
            <h1 className="mt-6 max-w-3xl text-[clamp(2rem,4.2vw,3rem)] font-extrabold">{article.title}</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-fg-soft">{article.excerpt}</p>
          </Reveal>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <Reveal>
            <article className="prose-panel glass space-y-5 p-8 md:p-11">
              {article.image && (
                <div className="relative mb-8 aspect-16/9 overflow-hidden rounded-xl">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              {article.content.map((paragraph) => (
                <p key={paragraph} className="text-[16.5px] leading-relaxed text-fg-soft">
                  {paragraph}
                </p>
              ))}
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <aside className="glass h-fit p-8">
              <p className="eyebrow">Дальше</p>
              <h2 className="mt-5 font-display text-[22px]">
                Нужен подбор <span className="gold-text">под участок</span>?
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                Оставьте заявку на консультацию — или выберите сорта в каталоге и соберите лист на странице покупателям.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link href={headerCta.href} className="btn btn-gold justify-center">
                  {headerCta.label}
                </Link>
                <Link href="/catalog" className="btn btn-ghost justify-center">
                  В каталог
                </Link>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
