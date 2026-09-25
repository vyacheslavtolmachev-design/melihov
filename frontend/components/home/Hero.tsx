"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { WakeMaskReveal } from "./WakeMaskReveal";
import { Emblem3D } from "@/components/brand/Emblem3D";
import type { Article } from "@/lib/articles";
import type { Variety, VarietyPhoto } from "@/lib/wp/varieties";

const easeOutExpo: [number, number, number, number] = [0.16, 0.8, 0.24, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: easeOutExpo } },
};

const tickerItems = [
  "Приём заявок на посадку открыт",
  "Самовывоз из питомника",
  "Оплата при получении",
  "Паспорт сортности к каждому саженцу",
  "Подбор сада с агрономом",
];

type HeroVarietyTile = Pick<Variety, "slug" | "title" | "culture" | "excerpt"> & { image: VarietyPhoto };

type HeroProps = {
  featuredArticle: Article | null;
  varietyTiles: HeroVarietyTile[];
};

export function Hero({ featuredArticle, varietyTiles }: HeroProps) {
  return (
    <section className="relative flex min-h-svh items-center overflow-hidden pb-16 pt-[112px] md:pt-[120px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#375440_0%,#273d2c_55%,#1e3022_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(38,58,40,.25)_0%,transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="shell h-full">
          <div className="relative h-full w-full">
            <WakeMaskReveal />
          </div>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="shell relative z-10 w-full">
        <div className="grid min-h-[300px] items-stretch gap-2 md:min-h-[340px] lg:min-h-[360px] lg:grid-cols-[1.62fr_1fr]">
          <motion.div
            variants={item}
            className="glass-hero relative flex h-full min-h-[300px] flex-col overflow-hidden px-4 py-[18px] md:min-h-[340px] md:px-[22px] md:py-[25px] lg:min-h-0 lg:px-6 lg:py-[28px]"
          >
            <div className="grid flex-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(140px,200px)] lg:gap-6">
              <div className="min-w-0">
                <p className="eyebrow text-[10px] tracking-[0.2em]">Питомник плодовых деревьев</p>

                <h1 className="mt-5 text-[clamp(1.55rem,3.4vw,2.45rem)] font-extrabold leading-[1.12]">
                  Сады, которые переживут <span className="gold-text">поколения</span>
                </h1>

                <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-fg-soft md:text-[14.5px]">
                  Саженцы из собственного маточника: районированные сорта, паспорт сортности и агроном на связи весь
                  первый сезон.
                </p>
              </div>

              <div className="flex justify-center lg:justify-end">
                <Emblem3D
                  className="h-[140px] w-[140px] md:h-[170px] md:w-[170px] lg:h-[190px] lg:w-[190px]"
                  interactive={false}
                  sway
                />
              </div>
            </div>

            <div className="relative mt-auto overflow-hidden border-t border-white/8 pt-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
              <motion.div
                className="flex w-max gap-5 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              >
                {[...tickerItems, ...tickerItems].map((text, index) => (
                  <span
                    key={`${text}-${index}`}
                    className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-fg-muted"
                  >
                    <span className="h-0.5 w-0.5 rounded-full bg-gold" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={item} className="h-full min-h-[300px] md:min-h-[340px] lg:min-h-0">
            {featuredArticle ? (
              <Link
                href={`/articles/${featuredArticle.slug}`}
                className="glass lift group relative flex h-full flex-col overflow-hidden"
              >
                <div className="absolute inset-0">
                  {featuredArticle.image ? (
                    <Image
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 360px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full bg-[linear-gradient(150deg,#173d26_0%,#0d2517_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/95 via-bg-deep/45 to-bg-deep/15" />
                </div>

                <div className="relative z-10 mt-auto p-5 md:p-6">
                  <p className="eyebrow text-[10px]">Полезный материал</p>
                  <h2 className="mt-3 font-display text-[20px] leading-snug md:text-[22px]">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-fg-soft">
                    {featuredArticle.excerpt}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="glass flex h-full flex-col justify-end p-5 md:p-6">
                <p className="eyebrow text-[10px]">Полезный материал</p>
                <h2 className="mt-3 font-display text-[20px] leading-snug">Статьи скоро появятся</h2>
                <p className="mt-3 text-[12.5px] leading-relaxed text-fg-muted">
                  Здесь будет избранный материал сезона — посадка, уход и обзоры сортов.
                </p>
                <Link href="/articles" className="mt-5 text-[13px] text-gold transition-colors hover:text-gold-light">
                  Перейти в раздел
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div variants={item} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {varietyTiles.length > 0
            ? varietyTiles.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/catalog/${tile.slug}`}
                  className="glass lift group relative flex min-h-[168px] flex-col overflow-hidden"
                >
                  <div className="absolute inset-0">
                    <Image
                      src={tile.image.url}
                      alt={tile.image.alt}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/92 via-bg-deep/35 to-transparent" />
                  </div>

                  <div className="relative z-10 mt-auto flex items-end justify-between gap-3 p-5">
                    <span>
                      {tile.culture && (
                        <span className="block text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                          {tile.culture.name}
                        </span>
                      )}
                      <span className="mt-1.5 block font-display text-[18px] text-fg md:text-[19px]">
                        {tile.title}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.4}
                      className="mb-1 shrink-0 text-white/30 transition-colors duration-300 group-hover:text-gold"
                    />
                  </div>
                </Link>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <Link
                  key={index}
                  href="/catalog"
                  className="glass lift flex min-h-[168px] flex-col justify-end p-5"
                >
                  <span className="font-display text-[18px] text-fg">Каталог саженцев</span>
                  <span className="mt-1.5 text-[13px] text-fg-muted">Скоро появятся сорта</span>
                </Link>
              ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
