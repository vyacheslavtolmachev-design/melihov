#!/bin/sh
# Первичная настройка WordPress: установка ядра, плагины, базовые страницы.
# Скрипт идемпотентный, безопасно выполняется при каждом старте стека.
set -eu

cd /var/www/html

echo "[bootstrap] ждём файлы WordPress"
attempt=0
while [ ! -f wp-settings.php ] || [ ! -f wp-config.php ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 150 ]; then
    echo "[bootstrap] файлы WordPress так и не появились"
    exit 1
  fi
  sleep 2
done

echo "[bootstrap] ждём базу данных"
attempt=0
until wp db check >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 60 ]; then
    echo "[bootstrap] база данных недоступна"
    exit 1
  fi
  sleep 3
done

if wp core is-installed >/dev/null 2>&1; then
  echo "[bootstrap] WordPress уже установлен"
else
  echo "[bootstrap] устанавливаем WordPress"
  wp core install \
    --url="$WP_PUBLIC_URL" \
    --title="Сады Наследия" \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" \
    --skip-email
fi

wp option update blogdescription "Питомник плодовых деревьев МелиховЪ" >/dev/null
wp option update timezone_string "Europe/Moscow" >/dev/null || true
wp rewrite structure '/%postname%/' >/dev/null

echo "[bootstrap] локализация"
wp language core install ru_RU >/dev/null 2>&1 || true
wp language core activate ru_RU >/dev/null 2>&1 || wp site switch-language ru_RU >/dev/null 2>&1 || true

echo "[bootstrap] плагины"
for plugin in wp-graphql advanced-custom-fields wpgraphql-acf; do
  if ! wp plugin is-installed "$plugin" >/dev/null 2>&1; then
    wp plugin install "$plugin" >/dev/null 2>&1 || echo "[bootstrap] не удалось скачать $plugin"
  fi
  if wp plugin is-installed "$plugin" >/dev/null 2>&1; then
    wp plugin activate "$plugin" >/dev/null 2>&1 || echo "[bootstrap] не удалось активировать $plugin"
  fi
done

create_page() {
  page_title="$1"
  page_slug="$2"
  existing="$(wp post list --post_type=page --name="$page_slug" --field=ID --format=ids)"
  if [ -z "$existing" ]; then
    wp post create \
      --post_type=page \
      --post_title="$page_title" \
      --post_name="$page_slug" \
      --post_status=publish >/dev/null
    echo "[bootstrap] создана страница: $page_title"
  fi
}

echo "[bootstrap] базовые страницы"
create_page "Главная" "home"
create_page "Каталог" "catalog"
create_page "Услуги" "services"
create_page "О питомнике" "about"
create_page "Покупателям" "info"

home_id="$(wp post list --post_type=page --name=home --field=ID --format=ids)"
if [ -n "$home_id" ]; then
  wp option update show_on_front page >/dev/null
  wp option update page_on_front "$home_id" >/dev/null
fi

sample_id="$(wp post list --post_type=page --name=sample-page --field=ID --format=ids)"
if [ -n "$sample_id" ]; then
  wp post delete "$sample_id" --force >/dev/null
fi

wp rewrite flush >/dev/null || true

echo "[bootstrap] готово. Админка: $WP_PUBLIC_URL/wp-admin"
