#!/bin/sh
# Импорт каталога сортов из wordpress/catalog/varieties.tsv.
# Запуск:
#   docker compose run --rm --entrypoint sh wp-cli /import-catalog.sh
# То же плюс удаление записей, которых нет в файле (демо-данные, снятые с продажи сорта):
#   docker compose run --rm --entrypoint sh wp-cli /import-catalog.sh --prune
#
# Импорт идемпотентный: сорт ищется по слагу и обновляется, дублей не возникает.
set -eu

cd /var/www/html

# wp eval-file принимает только позиционные аргументы: незнакомый флаг он отвергнет.
prune=""
for arg in "$@"; do
	case "$arg" in
		--prune) prune="prune" ;;
		*) echo "[import] неизвестный аргумент: $arg" >&2; exit 1 ;;
	esac
done

wp eval-file /import-catalog.php $prune
