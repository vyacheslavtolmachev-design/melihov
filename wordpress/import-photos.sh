#!/bin/sh
# Фотографии сортов из wordpress/catalog/photos.tsv → featured image в WordPress.
# Запуск:
#   docker compose run --rm --entrypoint sh wp-cli /import-photos.sh
#
# Файлы в wordpress/catalog/photos/ готовит tools/photos/ingest.py из папки inbox/.
# Импорт идемпотентный: уже загруженное фото повторно не заливается.
set -eu

cd /var/www/html

wp eval-file /import-photos.php
