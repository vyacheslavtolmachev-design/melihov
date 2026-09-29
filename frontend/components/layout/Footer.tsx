import { Emblem3D } from "@/components/brand/Emblem3D";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/8 bg-bg-deep">
      <div className="shell flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Emblem3D className="h-[56px] w-[56px]" interactive={false} />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold uppercase tracking-[0.2em] text-fg">Сады Наследия</span>
            <span className="mt-2 font-body text-[0.55rem] uppercase tracking-[0.34em] text-gold">
              Основатель — МелиховЪ
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-[12.5px] text-fg-muted md:flex-row md:items-center md:gap-8">
          <p>© {year} Питомник «Сады Наследия»</p>
          <p>Политика конфиденциальности</p>
        </div>
      </div>
    </footer>
  );
}
