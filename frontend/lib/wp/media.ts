import { WP_PUBLIC_URL } from "./client";

const WP_INTERNAL_URL = process.env.WP_INTERNAL_URL ?? "http://wordpress";

/**
 * WordPress может отдать ссылку на медиа по внутреннему адресу контейнера,
 * который браузер не резолвит. Приводим такие ссылки к публичному адресу.
 */
export function toPublicMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith(WP_INTERNAL_URL)) {
    return `${WP_PUBLIC_URL}${url.slice(WP_INTERNAL_URL.length)}`;
  }

  if (url.startsWith("/")) {
    return `${WP_PUBLIC_URL}${url}`;
  }

  return url;
}

/**
 * Для `next/image`: сервер оптимизации сам ходит за оригиналом изнутри docker-сети,
 * публичный порт хоста тут ни при чём. Публичный адрес не всегда доступен обратно из
 * контейнера (нет хайрпин-NAT на голом Linux, в отличие от Docker Desktop) — отдаём
 * внутренний. Браузер эту ссылку не видит, next/image возвращает готовый файл через
 * собственный `/_next/image`; нужный хост уже разрешён в `next.config.ts`.
 */
export function toOptimizerMediaUrl(url: string | null | undefined): string | null {
  const pub = toPublicMediaUrl(url);
  if (!pub) {
    return null;
  }
  if (pub.startsWith(WP_PUBLIC_URL)) {
    return `${WP_INTERNAL_URL}${pub.slice(WP_PUBLIC_URL.length)}`;
  }
  return pub;
}
