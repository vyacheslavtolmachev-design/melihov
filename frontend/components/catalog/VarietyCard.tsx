import Image from "next/image";
import Link from "next/link";
import { AddToRequestButton } from "@/components/request/AddToRequestButton";
import { availabilityLabels, formatPrice, varietyPhoto, type Variety } from "@/lib/wp/varieties";

type VarietyCardProps = {
  variety: Variety;
  wholesale: boolean;
};

export function VarietyCard({ variety, wholesale }: VarietyCardProps) {
  const price = wholesale ? variety.priceWholesale : variety.priceRetail;
  const chips = [variety.ripening?.name, variety.saplingAge].filter(Boolean) as string[];
  const photo = varietyPhoto(variety);

  return (
    // Ссылка растянута отдельным слоем: кнопка «В заявку» не может лежать внутри ссылки
    <article className="group lift media-frame relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-4/5 overflow-hidden">
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        {variety.availability !== "in_stock" && (
          <span className="absolute right-4 top-4 z-10 rounded-full border border-gold/30 bg-bg-deep/80 px-3 py-1.5 text-[11px] tracking-wide text-fg-soft backdrop-blur-sm">
            {availabilityLabels[variety.availability]}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 p-5 pt-16">
          {variety.culture && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">
              {variety.culture.name}
            </p>
          )}
          <h3 className="mt-2 font-display text-[22px] leading-snug text-fg">{variety.title}</h3>
          {chips.length > 0 && <p className="mt-2 text-[13px] text-fg-soft">{chips.join(" · ")}</p>}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="font-display text-[20px] text-gold-light">{formatPrice(price)}</p>

            <AddToRequestButton
              slug={variety.slug}
              title={variety.title}
              culture={variety.culture?.name ?? null}
              className="btn btn-gold relative z-30 !px-4 !py-2 !text-[13px]"
            />
          </div>
        </div>
      </div>

      <Link
        href={`/catalog/${variety.slug}`}
        aria-label={`${variety.title} — открыть карточку сорта`}
        className="absolute inset-0 z-20 rounded-[inherit]"
      />
    </article>
  );
}
