import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  accent: string;
  lead?: string;
};

export function PageHeader({ eyebrow, title, accent, lead }: PageHeaderProps) {
  return (
    <section className="page-top">
      <div className="shell relative z-10">
        <Reveal>
          <nav className="flex items-center gap-2 text-[12px] text-fg-muted">
            <Link href="/" className="transition-colors hover:text-gold-light">
              Главная
            </Link>
            <ChevronRight size={14} strokeWidth={1.5} />
            <span className="text-fg-soft">{eyebrow}</span>
          </nav>

          <p className="eyebrow mt-8">{eyebrow}</p>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.1rem,4.6vw,3.15rem)] font-extrabold">
            {title} <span className="gold-text">{accent}</span>
          </h1>

          {lead && <p className="mt-7 max-w-2xl text-[18px] leading-relaxed text-fg-soft">{lead}</p>}
        </Reveal>
      </div>
    </section>
  );
}
