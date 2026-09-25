export type SearchParams = Record<string, string | string[] | undefined>;

export const filterKeys = ["culture", "ripening", "region"] as const;

export type FilterKey = (typeof filterKeys)[number];

export function readParam(params: SearchParams, key: string): string | null {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single && single.length > 0 ? single : null;
}

/** Параметры, которые каталог переносит из ссылки в ссылку помимо самих фильтров. */
const carriedKeys = ["price", "q"] as const;

/** Ссылка на каталог с переключённым значением фильтра: повторный клик снимает его. */
export function buildFilterHref(params: SearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams();

  for (const filterKey of [...filterKeys, ...carriedKeys]) {
    const current = readParam(params, filterKey);
    if (current) next.set(filterKey, current);
  }

  if (value === null || readParam(params, key) === value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }

  const query = next.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

export function isWholesale(params: SearchParams): boolean {
  return readParam(params, "price") === "opt";
}

export function readQuery(params: SearchParams): string {
  return readParam(params, "q") ?? "";
}

/** Ссылка на каталог с новой строкой поиска. Пустая строка убирает параметр из адреса. */
export function buildSearchHref(params: SearchParams, value: string): string {
  const next = new URLSearchParams();

  for (const filterKey of [...filterKeys, ...carriedKeys]) {
    const current = readParam(params, filterKey);
    if (current) next.set(filterKey, current);
  }

  const trimmed = value.trim();

  if (trimmed) {
    next.set("q", trimmed);
  } else {
    next.delete("q");
  }

  const query = next.toString();
  return query ? `/catalog?${query}` : "/catalog";
}
