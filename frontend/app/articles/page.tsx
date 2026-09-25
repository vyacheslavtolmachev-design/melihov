import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Полезный материал",
  description: "Статьи, обзоры и материалы питомника «Сады Наследия»: посадка, уход и подбор сортов.",
};

export default function ArticlesPage() {
  const articles = getArticles();

  return (
    <>
      <PageHeader
        eyebrow="Полезный материал"
        title="Статьи, обзоры и"
        accent="практика питомника"
        lead="Короткие материалы о посадке, сезоне и выборе сортов. Раздел будет пополняться."
      />

      <section className="pb-[108px]">
        <div className="shell">
          {articles.length > 0 ? (
            <div className="grid gap-[18px] md:grid-cols-2">
              {articles.map((article, index) => (
                <Reveal key={article.slug} delay={(index % 2) * 0.08}>
                  <Link
                    href={article.externalUrl ?? `/articles/${article.slug}`}
                    className="glass lift group flex h-full flex-col overflow-hidden"
                    {...(article.externalUrl ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    <div className="relative aspect-16/10 overflow-hidden bg-[linear-gradient(150deg,#173d26_0%,#0d2517_100%)]">
                      {article.image && (
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-[22px]">
                      <p className="eyebrow">
                        {article.kind === "review" ? "Обзор" : article.kind === "link" ? "Ссылка" : "Статья"}
                      </p>
                      <h2 className="mt-4 font-display text-[22px] leading-snug transition-colors group-hover:text-gold-light">
                        {article.title}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-fg-muted">{article.excerpt}</p>
                      <span className="mt-auto flex items-center gap-2 pt-7 text-[13px] text-fg-muted transition-colors group-hover:text-gold">
                        Читать
                        <ArrowUpRight size={16} strokeWidth={1.5} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="glass p-11 text-center">
              <h2 className="font-display text-[22px]">Материалы готовятся</h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                Скоро здесь появятся статьи о посадке и уходе. Пока можно посмотреть каталог или оставить заявку на
                подбор сада.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
