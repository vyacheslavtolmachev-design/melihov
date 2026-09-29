#!/bin/sh
# Пилотная заливка: 5 ботанических иллюстраций сортов как featured image.
# Файлы лежат в wordpress/catalog/illustrations/{slug}.webp, alt-текст — здесь же.
set -eu

import_one() {
  slug="$1"
  alt="$2"
  file="/catalog/illustrations/${slug}.webp"

  post_id=$(wp --allow-root post list --post_type=variety --name="${slug}" --field=ID)
  if [ -z "$post_id" ]; then
    echo "нет записи с slug=${slug}, пропуск" >&2
    return 1
  fi

  # Фотография сорта (import-photos.sh) главнее иллюстрации — не перекрываем её.
  thumb_id=$(wp --allow-root post meta get "$post_id" _thumbnail_id 2>/dev/null || true)
  if [ -n "$thumb_id" ] && [ -n "$(wp --allow-root post meta get "$thumb_id" _heritage_photo 2>/dev/null || true)" ]; then
    echo "${slug}: у сорта есть фотография, иллюстрация не ставится"
    return 0
  fi

  attachment_id=$(wp --allow-root media import "$file" \
    --post_id="$post_id" \
    --title="$alt" \
    --alt="$alt" \
    --featured_image \
    --porcelain)

  echo "${slug}: post ${post_id} -> attachment ${attachment_id}"
}

import_one "apple-golden-delishes" "Яблоня Голден Делишес — ботаническая иллюстрация плода с листом"
import_one "pear-abbat-fetel" "Груша Аббат Фетель — ботаническая иллюстрация плода с листом"
import_one "sweet-cherry-revna" "Черешня Ревна — ботаническая иллюстрация пары плодов с листьями"
import_one "plum-stenley" "Слива Стенлей — ботаническая иллюстрация плодов с листом"
import_one "currant-rovada" "Смородина Ровада — ботаническая иллюстрация кисти ягод с листом"
