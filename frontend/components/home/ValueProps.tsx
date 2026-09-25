import { Sprout, ScrollText, Snowflake, HeartHandshake } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  {
    icon: Sprout,
    title: "Собственный маточник",
    text: "Черенки берём со своих маточных деревьев, а не перекупаем саженцы у посредников.",
  },
  {
    icon: ScrollText,
    title: "Паспорт сортности",
    text: "К каждому саженцу — сорт, подвой, возраст и рекомендации по схеме посадки.",
  },
  {
    icon: Snowflake,
    title: "Районированные сорта",
    text: "Подбираем культуры под климат, почву и уровень грунтовых вод вашего участка.",
  },
  {
    icon: HeartHandshake,
    title: "Сопровождение сезона",
    text: "Агроном остаётся на связи весь первый год после посадки — от полива до защиты.",
  },
];

export function ValueProps() {
  return (
    <section className="sec">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">Почему нам доверяют сад</p>
          <h2 className="mt-6 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)]">
            Питомник полного цикла — от маточника до <span className="gold-text">первого урожая</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.08}>
              <article className="glass lift h-full p-[22px]">
                <value.icon size={27} strokeWidth={1.1} stroke="url(#goldStroke)" />
                <h3 className="mt-6 font-display text-[20px]">{value.title}</h3>
                <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">{value.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
