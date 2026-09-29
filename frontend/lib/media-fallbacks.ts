/** Локальные плейсхолдеры: ветка/куст культуры, не яркий макро-плод. */

const ownCultureImages: Record<string, string> = {
  apple: "/media/catalog/apple.jpg",
  pear: "/media/catalog/pear.jpg",
  cherry: "/media/catalog/cherry.jpg",
  "sweet-cherry": "/media/catalog/sweet-cherry.jpg",
  plum: "/media/catalog/plum.jpg",
  peach: "/media/catalog/peach.jpg",
  apricot: "/media/catalog/apricot.jpg",
  currant: "/media/catalog/currant.jpg",
  gooseberry: "/media/catalog/gooseberry.jpg",
  raspberry: "/media/catalog/raspberry.jpg",
};

const cultureImages: Record<string, string> = {
  ...ownCultureImages,
  // Своих кадров у этих культур ещё нет — временно берём ближайшую родственную.
  // Требования к съёмке — в docs/GRAPHICS.md.
  "columnar-apple": "/media/catalog/apple.jpg",
  "felt-cherry": "/media/catalog/cherry.jpg",
  josta: "/media/catalog/currant.jpg",
};

/** Собственный кадр культуры или null, если сейчас подставлен чужой (см. выше). */
export function cultureOwnImage(cultureSlug: string): string | null {
  return ownCultureImages[cultureSlug] ?? null;
}

/**
 * Кадр культуры — один и тот же для всех сортов этой культуры.
 * Повтор здесь осознанный: карточка честно говорит «яблоня» и не выдаёт
 * случайный ряд питомника за конкретный сорт. Расходятся карточки слоем выше —
 * собственной иллюстрацией и съёмкой сорта, а не перетасовкой заглушек.
 */
export function culturePlaceholderImage(cultureSlug: string | null | undefined): string {
  return (cultureSlug && cultureImages[cultureSlug]) || "/media/catalog/orchard.jpg";
}
