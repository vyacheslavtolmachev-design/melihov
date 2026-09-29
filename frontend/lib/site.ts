export const site = {
  name: "Сады Наследия",
  founder: "МелиховЪ",
  tagline: "Питомник плодовых и ягодных культур",
  description:
    "Питомник плодовых и ягодных культур «Сады Наследия». Выращиваем сортовые саженцы для частных садов, фермерских хозяйств и коммерческих садов: районированные сорта, паспорт сортности, сопровождение агронома.",
  audiences: ["Частные сады и дачи", "Фермерские хозяйства", "Коммерческие сады"],
  location: {
    place: "станица Октябрьская",
    region: "Краснодарский край",
  },
  experience: "более 20 лет",
  /** Контакты-заглушки: заменить реальными данными питомника. */
  contacts: {
    phone: "+7 (000) 000-00-00",
    phoneHref: "tel:+70000000000",
    email: "info@example.com",
    emailHref: "mailto:info@example.com",
    telegram: "@sady_naslediya",
    telegramHref: "https://t.me/sady_naslediya",
    max: "Сады Наследия",
    /** Адреса профиля в Max пока нет — ссылка не рендерится, вместо неё обычный текст. */
    maxHref: null,
  },
} as const;

/** Публичный адрес витрины: нужен карте сайта, robots и абсолютным ссылкам в метаданных. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type ContactChannel = {
  key: string;
  label: string;
  value: string;
  /** null — значение есть, а рабочего адреса ещё нет: показываем текстом, а не ссылкой. */
  href: string | null;
};

export const contactChannels: ContactChannel[] = [
  { key: "phone", label: "Телефон", value: site.contacts.phone, href: site.contacts.phoneHref },
  { key: "email", label: "Email", value: site.contacts.email, href: site.contacts.emailHref },
  { key: "telegram", label: "Telegram", value: site.contacts.telegram, href: site.contacts.telegramHref },
  { key: "max", label: "Max", value: site.contacts.max, href: site.contacts.maxHref },
];

export type NavItem = {
  label: string;
  href: string;
};

export const navigation: NavItem[] = [
  { label: "Каталог", href: "/catalog" },
  { label: "Покупателям", href: "/info" },
  { label: "Полезный материал", href: "/articles" },
  { label: "О питомнике", href: "/about" },
];

/** CTA в шапке: консультации и подбор сада. */
export const headerCta = {
  label: "Подбор сада",
  href: "/services",
} as const;
