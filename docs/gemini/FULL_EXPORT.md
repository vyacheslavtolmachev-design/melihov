# Сады Наследия — экспорт для Gemini

## Как использовать
1. Загрузите все файлы из docs/gemini/ в чат Gemini (или один FULL_EXPORT.md если он помещается)
2. В первом сообщении напишите: «Это проект сайта питомника. Помоги доработать [задача]»
3. Ссылайтесь на файлы по путям из дерева ниже

## Стек
- Next.js 16 (App Router) + React 19 + Tailwind v4 + Motion + Lucide
- WordPress headless (WPGraphQL + ACF) в Docker
- Коммерция через заявку, без WooCommerce

## Маршруты
| URL | Статус |
|-----|--------|
| / | Готово: Hero, УТП, виды деятельности, категории, CTA |
| /catalog | Готово: фильтры, розница/опт, карточки из WP |
| /catalog/[slug] | Готово: карточка сорта |
| /services | Готово: 9 видов деятельности |
| /about | Заглушка |
| /info | Заглушка (нужна форма заявки) |

## Дерево файлов
```
AGENTS.md
README.md
docker-compose.yml
.env.example
wordpress/bootstrap.sh
wordpress/seed-demo.sh
wordpress/uploads.ini
wordpress/wp-content/mu-plugins/heritage-content.php
wordpress/wp-content/mu-plugins/heritage-fields.php
frontend/package.json
frontend/next.config.ts
frontend/tsconfig.json
frontend/Dockerfile.dev
frontend/postcss.config.mjs
frontend/app/globals.css
frontend/app/layout.tsx
frontend/app/page.tsx
frontend/app/about/page.tsx
frontend/app/services/page.tsx
frontend/app/info/page.tsx
frontend/app/catalog/page.tsx
frontend/app/catalog/[slug]/page.tsx
frontend/app/api/revalidate/route.ts
frontend/lib/site.ts
frontend/lib/catalog.ts
frontend/lib/services.ts
frontend/lib/wp/client.ts
frontend/lib/wp/media.ts
frontend/lib/wp/varieties.ts
frontend/components/brand/GoldDefs.tsx
frontend/components/brand/Emblem.tsx
frontend/components/brand/Wordmark.tsx
frontend/components/layout/Header.tsx
frontend/components/layout/Footer.tsx
frontend/components/layout/PageHeader.tsx
frontend/components/layout/PagePlaceholder.tsx
frontend/components/home/Hero.tsx
frontend/components/home/ValueProps.tsx
frontend/components/home/Directions.tsx
frontend/components/home/CategoryGrid.tsx
frontend/components/home/CtaRibbon.tsx
frontend/components/home/OrchardCanvas.tsx
frontend/components/catalog/Filters.tsx
frontend/components/catalog/PriceSwitch.tsx
frontend/components/catalog/VarietyCard.tsx
frontend/components/catalog/filter-url.ts
frontend/components/ui/Reveal.tsx
frontend/components/providers/MotionProvider.tsx
docs/GRAPHICS.md
```
## Стартовый промпт для Gemini

```
Ты — senior frontend-разработчик. Перед тобой проект сайта питомника «Сады Наследия» (headless WordPress + Next.js).

Правила:
- Стиль «Тёмный престиж»: тёмно-зелёный фон, металлическое золото только градиентом (.gold-text, stroke="url(#goldStroke)")
- Шрифты: Playfair Display (заголовки) + Manrope (текст)
- Не выдумывай телефоны, адреса, цены — только то, что есть в коде
- Коммерция через заявку, без корзины и WooCommerce
- Tailwind v4: токены в globals.css через @theme, без tailwind.config.js
- Dev-сервер: next dev --webpack (не turbopack)

Следующая задача: [опишите здесь]
```

# 01-infra-wordpress.md

---

## `AGENTS.md`
```md
# Память проекта: «Сады Наследия»

Сайт питомника плодовых и ягодных культур. Бренд — «Сады Наследия», основатель — «МелиховЪ».

## Что это за проект

Витрина на Next.js плюс WordPress в роли CMS. Всё поднимается в Docker Desktop одной командой `docker compose up -d`.

- Витрина: `http://localhost:3000`
- Админка: `http://localhost:8080/wp-admin`
- Код живёт в `C:\dev\melihov`, вне синхронизации YandexDisk: облачная синхронизация ломает бинд-маунт и `node_modules`

## Позиционирование

Питомник выращивает посадочный материал для трёх аудиторий: частные сады, фермерские хозяйства и коммерческие сады. Ключевое обещание — здоровые саженцы, проверенные сорта и профессиональный подход.

### Виды деятельности

1. Выращивание саженцев яблони, груши, вишни, черешни, сливы, персика и абрикоса
2. Выращивание ягодных кустарников: смородины, крыжовника и малины
3. Производство и реализация сортовых саженцев плодовых деревьев и кустарников
4. Подбор районированных сортов под условия участка и региона
5. Прививка, окулировка и размножение плодовых культур
6. Формирование, обрезка и уход за маточными насаждениями
7. Консультации по посадке, поливу, подкормке, обрезке и защите растений
8. Комплектация садов: подбор культур и сортов для закладки плодового или ягодного сада
9. Продажа посадочного материала оптом и в розницу

Данные лежат в `frontend/lib/services.ts` и `frontend/lib/catalog.ts` — при изменениях правим там, а не в разметке страниц.

## Модель каталога

Сорт — это запись типа `variety`. Таксономии: `culture`, `ripening`, `region`, `rootstock`. Слаги культур совпадают с `frontend/lib/catalog.ts`: `apple`, `pear`, `cherry`, `sweet-cherry`, `plum`, `peach`, `apricot`, `currant`, `gooseberry`, `raspberry`.

Характеристики сорта — группа ACF `Характеристики сорта`, зарегистрированная кодом в `wordpress/wp-content/mu-plugins/heritage-fields.php`. В GraphQL она доступна как `specs`: `priceRetail`, `priceWholesale`, `wholesaleMin`, `saplingAge`, `availability`, `plantingRules`. Поля правим в PHP, а не мышкой в админке — иначе изменения не попадут в репозиторий.

Витрина забирает данные в `frontend/lib/wp/varieties.ts` одним запросом и фильтрует на своей стороне: объём каталога это позволяет, зато фасеты считаются по реальным записям и пустых вариантов в фильтрах не бывает. Фильтры и переключатель цен живут в адресной строке (`?culture=apple&price=opt`), поэтому страница остаётся серверной и ссылку можно переслать.

ACF признаёт значение поля только вместе с парной мета-записью ключа: `price_retail` плюс `_price_retail` со значением `field_price_retail`. Скрипты, которые пишут поля мимо админки, обязаны ставить обе.

Демо-каталог для проверки вёрстки: `docker compose run --rm --entrypoint sh wp-cli /seed-demo.sh`. Десять реальных сортов с вымышленными ценами — перед сдачей заменить данными питомника.

### Коммерческая модель

Корзины и онлайн-оплаты нет. Покупка оформляется заявкой: подбор позиций плюс контакты, дальше связывается менеджер. Цены делятся на розничные и оптовые, опт — от партии. WooCommerce намеренно не используется.

## Визуальный стиль

Тема «Тёмный престиж» в зелёной гамме, референс — сайт АТБ-Юг.

- Фон `#0a1f14`, панели `#12301e`, подвал `#061509`
- Текст `#edf3ec` основной, `#bfcebf` body, `#94a894` приглушённый
- Золото `#c5a880`. **Только металлический градиент**: в тексте через `.gold-text`, в SVG и иконках через `stroke="url(#goldStroke)"`. Плоская заливка золотом запрещена
- Заголовки Playfair Display, интерфейс и текст Manrope. Больше двух шрифтов не вводим
- Компоненты: стеклянные панели `.glass` и `.glass-strong`, pill-кнопки `.btn-gold` и `.btn-ghost`, плавающая навигация `.nav-glass`, подъём карточек через `.lift`
- Контейнер `.shell` — 1200px, секция `.sec` — 108px по вертикали
- Анимации появления: 0.85s `cubic-bezier(.16,.8,.24,1)` через компонент `Reveal`
- Светлые фоны, плоское жёлтое золото и неоновые акценты не используем

Токены и компонентные классы — в `frontend/app/globals.css`. Требования к графике — в `docs/GRAPHICS.md`.

## Структура

```
docker-compose.yml
wordpress/
  bootstrap.sh                      автонастройка WordPress через wp-cli
  wp-content/mu-plugins/            типы записей, редирект витрины, сброс кеша
  wp-content/acf-json/              поля ACF под контролем версий
frontend/
  app/                              маршруты App Router
  components/  brand | layout | home | ui | providers
  lib/         site | catalog | services | wp
docs/GRAPHICS.md
```

## Подводные камни, уже пройденные

**Turbopack не видит правки.** Через бинд-маунт Windows события файловой системы не доходят, страница отдаётся старая. Dev-сервер запускается с `--webpack` и `WATCHPACK_POLLING`. Флаг не убирать.

**Константы WordPress.** Образ применяет `WORDPRESS_CONFIG_EXTRA` через `eval` во время выполнения, поэтому в контексте WP-CLI констант нет. Настройки читаются функцией `heritage_config()`: сначала константа, потом переменная окружения. Переменные передаются и сервису `wordpress`, и сервису `wp-cli`.

**Tailwind v4.** Нельзя применять `@apply` к своему же кастомному классу — базовые стили кнопок развёрнуты явно. Конфиг задаётся в CSS через `@theme`, файла `tailwind.config.js` нет.

**React 19 и правило `set-state-in-effect`.** Линтер запрещает синхронный `setState` в теле эффекта. Подписки на браузерные события (скролл, media query) делаем через `useSyncExternalStore`, а реакцию на смену маршрута — правкой состояния прямо на рендере по сравнению с предыдущим значением.

**`revalidateTag` в Next 16** требует второй аргумент — профиль времени жизни. Используем `revalidateTag("wp", "max")`.

**Два адреса WordPress.** `WP_INTERNAL_URL=http://wordpress` для серверных запросов Next.js, `NEXT_PUBLIC_WP_URL=http://localhost:8080` для браузера. Ссылки на медиа нормализуются в `frontend/lib/wp/media.ts`.

**Сброс кеша.** При сохранении записи WordPress дёргает `POST /api/revalidate` с общим секретом и сбрасывает тег `wp`. В контексте WP-CLI запрос делается блокирующим, иначе процесс завершается раньше отправки.

## Правила работы с контентом

Не выдумывать фактов, которых нет: телефоны, адреса, годы основания, имена сотрудников, цены и названия конкретных сортов появляются только после подтверждения заказчиком. Пока данных нет — формулировать без них.

Тексты пишем спокойно и по делу, без рекламных превосходных степеней. Обращение к клиенту на «вы» со строчной буквы.
```

---

## `README.md`
```md
# Сады Наследия — питомник плодовых деревьев «МелиховЪ»

Витрина на Next.js и WordPress в роли CMS. Оба приложения поднимаются одной командой в Docker Desktop.

## Быстрый старт

```bash
docker compose up -d --build
```

Первый запуск занимает несколько минут: скачиваются образы, устанавливаются зависимости Next.js, WordPress настраивается автоматически.

- Витрина: http://localhost:3000
- Админка WordPress: http://localhost:8080/wp-admin

Учётные данные администратора задаются в `.env` (`WP_ADMIN_USER` / `WP_ADMIN_PASSWORD`).

## Как устроено

| Сервис | Назначение |
| --- | --- |
| `db` | MariaDB, данные в томе `db_data` |
| `wordpress` | CMS, ядро в томе `wp_data`, код проекта примонтирован из `wordpress/` |
| `wp-cli` | Одноразовая настройка при старте: установка ядра, плагины, базовые страницы |
| `frontend` | Next.js в режиме разработки с горячей перезагрузкой |

Собственный фронтенд WordPress отключён: любые запросы, кроме админки и API, уводятся редиректом на витрину.

## Адреса WordPress

У WordPress два адреса, и это важно не перепутать:

- `WP_INTERNAL_URL=http://wordpress` — по нему Next.js ходит с сервера внутри сети Docker
- `WP_PUBLIC_URL=http://localhost:8080` — по нему WordPress открывает браузер, и такие ссылки должны попадать в разметку

Ссылки на медиа приводятся к публичному адресу в `frontend/lib/wp/media.ts`.

## Обновление контента

При сохранении записи WordPress дёргает `POST /api/revalidate` на витрине и сбрасывает кеш по тегу `wp`. Секрет общий, задаётся в `.env`.

## Каталог

Сорт — запись типа «Сорта» в админке. Культура, срок созревания, регион и подвой задаются таксономиями, цены и характеристики — блоком «Характеристики сорта» (ACF). Поля описаны кодом в `wordpress/wp-content/mu-plugins/heritage-fields.php`, поэтому переносятся вместе с репозиторием.

Фильтры и переключатель «розница / опт» живут в адресной строке: `/catalog?culture=apple&price=opt`. Ссылку можно переслать, состояние переживает перезагрузку.

Демонстрационное наполнение для проверки вёрстки:

```bash
docker compose run --rm --entrypoint sh wp-cli /seed-demo.sh
```

Скрипт добавляет таксономии и десять сортов с условными ценами. Перед сдачей содержимое заменяется данными питомника.

## Визуальный стиль

Тема «Тёмный престиж» в зелёной гамме: глубокий зелёный фон, металлическое золото, стеклянные панели, pill-кнопки, плавающая стеклянная навигация. Заголовки — Playfair Display, интерфейс и текст — Manrope.

Токены палитры и компонентные классы (`glass`, `btn-gold`, `nav-glass`, `gold-text`) лежат в `frontend/app/globals.css`. Золото задаётся только градиентом: для текста через `gold-text`, для SVG и иконок — через `stroke="url(#goldStroke)"` из `components/brand/GoldDefs.tsx`.

Что и в каком виде нужно отрисовать и снять — в [docs/GRAPHICS.md](docs/GRAPHICS.md).

## Горячая перезагрузка

Dev-сервер запускается с флагом `--webpack`. Turbopack не получает события файловой системы через бинд-маунт Windows и не видит правки в компонентах, а webpack с опросом файлов (`WATCHPACK_POLLING`) работает корректно.

## Медиа для Hero

Положите ролик сада в `frontend/public/media/hero.mp4`. Пока файла нет, Hero показывает градиентный фон — это штатное поведение. Видео не загружается на экранах уже 768 пикселей и при включённом системном режиме уменьшения анимации.

## Структура

```
docker-compose.yml
wordpress/
  bootstrap.sh                      # автонастройка WordPress
  seed-demo.sh                      # демо-каталог для проверки вёрстки
  uploads.ini                       # лимиты загрузки медиа
  wp-content/mu-plugins/            # типы записей, поля сорта, редирект, сброс кеша
  wp-content/acf-json/              # поля ACF под контролем версий
frontend/
  app/                              # маршруты App Router
  components/                       # brand, layout, home, catalog, ui
  lib/                              # конфиг сайта, каталог, услуги, клиент WordPress
```

## Полезные команды

```bash
docker compose logs -f frontend     # логи витрины
docker compose logs wp-cli          # что сделала автонастройка
docker compose down                 # остановить стек
docker compose down -v              # остановить и удалить данные
```
```

---

## `docker-compose.yml`
```yaml
name: ${COMPOSE_PROJECT_NAME:-melihov}

# Образ WordPress применяет эти строки через eval при каждом запуске.
# Нужны и Apache, и wp-cli: иначе консольные команды работают без констант проекта.
x-wp-config-extra: &wp-config-extra |
  define( 'WP_HOME', '${WP_PUBLIC_URL}' );
  define( 'WP_SITEURL', '${WP_PUBLIC_URL}' );
  define( 'FRONTEND_PUBLIC_URL', '${FRONTEND_PUBLIC_URL}' );
  define( 'FRONTEND_INTERNAL_URL', '${FRONTEND_INTERNAL_URL}' );
  define( 'REVALIDATE_SECRET', '${REVALIDATE_SECRET}' );
  define( 'WP_ENVIRONMENT_TYPE', 'local' );

services:
  db:
    image: mariadb:11.4
    container_name: melihov-db
    restart: unless-stopped
    environment:
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 20

  wordpress:
    image: wordpress:php8.3-apache
    container_name: melihov-wp
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "${WP_PORT}:80"
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_NAME: ${DB_NAME}
      WORDPRESS_DB_USER: ${DB_USER}
      WORDPRESS_DB_PASSWORD: ${DB_PASSWORD}
      WORDPRESS_DEBUG: 1
      WORDPRESS_CONFIG_EXTRA: *wp-config-extra
      FRONTEND_PUBLIC_URL: ${FRONTEND_PUBLIC_URL}
      FRONTEND_INTERNAL_URL: ${FRONTEND_INTERNAL_URL}
      REVALIDATE_SECRET: ${REVALIDATE_SECRET}
    volumes:
      - wp_data:/var/www/html
      - ./wordpress/wp-content/mu-plugins:/var/www/html/wp-content/mu-plugins
      - ./wordpress/wp-content/acf-json:/var/www/html/wp-content/acf-json
      - ./wordpress/uploads.ini:/usr/local/etc/php/conf.d/uploads.ini:ro

  # Одноразовая настройка WordPress: установка, плагины, страницы. Отрабатывает и завершается.
  wp-cli:
    image: wordpress:cli-php8.3
    container_name: melihov-wp-cli
    restart: "no"
    depends_on:
      db:
        condition: service_healthy
      wordpress:
        condition: service_started
    user: "33:33"
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_NAME: ${DB_NAME}
      WORDPRESS_DB_USER: ${DB_USER}
      WORDPRESS_DB_PASSWORD: ${DB_PASSWORD}
      WORDPRESS_CONFIG_EXTRA: *wp-config-extra
      FRONTEND_PUBLIC_URL: ${FRONTEND_PUBLIC_URL}
      FRONTEND_INTERNAL_URL: ${FRONTEND_INTERNAL_URL}
      REVALIDATE_SECRET: ${REVALIDATE_SECRET}
      WP_PUBLIC_URL: ${WP_PUBLIC_URL}
      WP_ADMIN_USER: ${WP_ADMIN_USER}
      WP_ADMIN_PASSWORD: ${WP_ADMIN_PASSWORD}
      WP_ADMIN_EMAIL: ${WP_ADMIN_EMAIL}
    volumes:
      - wp_data:/var/www/html
      - ./wordpress/wp-content/mu-plugins:/var/www/html/wp-content/mu-plugins
      - ./wordpress/wp-content/acf-json:/var/www/html/wp-content/acf-json
      - ./wordpress/bootstrap.sh:/bootstrap.sh:ro
      - ./wordpress/seed-demo.sh:/seed-demo.sh:ro
    entrypoint: ["sh", "/bootstrap.sh"]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: melihov-frontend
    restart: unless-stopped
    depends_on:
      - wordpress
    ports:
      - "${FRONTEND_PORT}:3000"
    environment:
      WP_INTERNAL_URL: ${WP_INTERNAL_URL}
      NEXT_PUBLIC_WP_URL: ${WP_PUBLIC_URL}
      NEXT_PUBLIC_SITE_URL: ${FRONTEND_PUBLIC_URL}
      REVALIDATE_SECRET: ${REVALIDATE_SECRET}
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
      - frontend_next:/app/.next

volumes:
  db_data:
  wp_data:
  frontend_node_modules:
  frontend_next:
```

---

## `.env.example`
```
COMPOSE_PROJECT_NAME=melihov

# База данных
DB_NAME=melihov
DB_USER=melihov
DB_PASSWORD=change_me
DB_ROOT_PASSWORD=change_me_root

# Порты на хосте
WP_PORT=8080
FRONTEND_PORT=3000

# Адреса. public — для браузера, internal — для запросов между контейнерами
WP_PUBLIC_URL=http://localhost:8080
WP_INTERNAL_URL=http://wordpress
FRONTEND_PUBLIC_URL=http://localhost:3000
FRONTEND_INTERNAL_URL=http://frontend:3000

# Администратор WordPress, создаётся при первом запуске
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=change_me
WP_ADMIN_EMAIL=admin@example.com

# Общий секрет для инвалидации кеша витрины из WordPress
REVALIDATE_SECRET=change_me_secret
```

---

## `wordpress/bootstrap.sh`
```bash
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
```

---

## `wordpress/seed-demo.sh`
```bash
#!/bin/sh
# Демонстрационное наполнение каталога для проверки вёрстки и фильтров.
# Запуск вручную:
#   docker compose run --rm --entrypoint sh wp-cli /seed-demo.sh
# Удалить демо-данные:
#   docker compose run --rm --entrypoint wp wp-cli post list --post_type=variety --field=ID | xargs -r -n1 docker compose run --rm --entrypoint wp wp-cli post delete --force
set -eu

cd /var/www/html

echo "[seed] таксономии"

add_term() {
	taxonomy="$1"
	name="$2"
	slug="$3"
	if ! wp term list "$taxonomy" --field=slug | grep -qx "$slug"; then
		wp term create "$taxonomy" "$name" --slug="$slug" >/dev/null
	fi
}

add_term culture "Яблони" apple
add_term culture "Груши" pear
add_term culture "Вишни" cherry
add_term culture "Черешни" sweet-cherry
add_term culture "Сливы" plum
add_term culture "Персики" peach
add_term culture "Абрикосы" apricot
add_term culture "Смородина" currant
add_term culture "Крыжовник" gooseberry
add_term culture "Малина" raspberry

add_term ripening "Летний" summer
add_term ripening "Осенний" autumn
add_term ripening "Зимний" winter

add_term region "Средняя полоса" middle
add_term region "Чернозёмье" chernozem
add_term region "Юг России" south

add_term rootstock "Семенной" seed
add_term rootstock "Полукарликовый" semi-dwarf
add_term rootstock "Карликовый" dwarf

echo "[seed] сорта"

# название | слаг | культура | срок | регион | подвой | розница | опт | возраст
add_variety() {
	title="$1"
	slug="$2"
	culture="$3"
	ripening="$4"
	region="$5"
	rootstock="$6"
	retail="$7"
	wholesale="$8"
	age="$9"
	excerpt="${10}"

	existing="$(wp post list --post_type=variety --name="$slug" --field=ID --format=ids)"
	if [ -n "$existing" ]; then
		echo "[seed] уже есть: $title"
		return
	fi

	id="$(wp post create \
		--post_type=variety \
		--post_title="$title" \
		--post_name="$slug" \
		--post_status=publish \
		--post_excerpt="$excerpt" \
		--porcelain)"

	wp post term set "$id" culture "$culture" >/dev/null
	wp post term set "$id" ripening "$ripening" >/dev/null
	wp post term set "$id" region "$region" >/dev/null
	wp post term set "$id" rootstock "$rootstock" >/dev/null

	# ACF узнаёт поле только вместе с парной мета-записью ключа
	set_field() {
		wp post meta update "$id" "$1" "$2" >/dev/null
		wp post meta update "$id" "_$1" "$3" >/dev/null
	}

	set_field price_retail "$retail" field_price_retail
	set_field price_wholesale "$wholesale" field_price_wholesale
	set_field wholesale_min 50 field_wholesale_min
	set_field sapling_age "$age" field_sapling_age
	set_field availability in_stock field_availability
	set_field planting_rules "Схема посадки 4×5 м. Яма 60×60 см, корневая шейка на уровне почвы. Полив 2–3 ведра при посадке и далее раз в неделю в первый месяц." field_planting_rules

	echo "[seed] добавлен: $title"
}

add_variety "Яблоня Мельба" "apple-melba" apple summer middle semi-dwarf 950 640 "Двухлетка" "Летний сорт с десертным вкусом, плодоносит на третий год."
add_variety "Яблоня Антоновка обыкновенная" "apple-antonovka" apple autumn middle seed 900 610 "Двухлетка" "Осенний сорт народной селекции, зимостойкий и урожайный."
add_variety "Яблоня Флорина" "apple-florina" apple winter chernozem semi-dwarf 1100 740 "Двухлетка" "Зимний сорт с устойчивостью к парше и долгой лёжкостью."
add_variety "Груша Лада" "pear-lada" pear summer middle seed 1050 700 "Двухлетка" "Ранний сорт, стабильный урожай и хорошая зимостойкость."
add_variety "Груша Ноябрьская" "pear-noyabrskaya" pear autumn chernozem seed 1150 780 "Двухлетка" "Поздний сорт с плотной сочной мякотью, хранится до зимы."
add_variety "Вишня Молодёжная" "cherry-molodezhnaya" cherry summer middle seed 850 570 "Двухлетка" "Самоплодный сорт, компактная крона, стабильное плодоношение."
add_variety "Черешня Ипуть" "sweet-cherry-iput" sweet-cherry summer chernozem seed 1250 850 "Двухлетка" "Ранняя черешня с крупной тёмной ягодой."
add_variety "Слива Стенли" "plum-stanley" plum autumn south seed 980 660 "Двухлетка" "Урожайный сорт с крупным плодом, хорош для сушки и переработки."
add_variety "Смородина Селеченская-2" "currant-selechenskaya" currant summer middle seed 420 260 "Двухлетка" "Крупноплодная чёрная смородина сладкого вкуса."
add_variety "Малина Полка" "raspberry-polka" raspberry autumn middle seed 380 230 "Однолетка" "Ремонтантный сорт, плодоносит до заморозков."

wp cache flush >/dev/null 2>&1 || true

echo "[seed] готово"
```

---

## `wordpress/uploads.ini`
```ini
file_uploads = On
memory_limit = 512M
upload_max_filesize = 128M
post_max_size = 128M
max_execution_time = 300
max_input_time = 300
```

---

## `wordpress/wp-content/mu-plugins/heritage-content.php`
```php
<?php
/**
 * Plugin Name: Сады Наследия — модель контента
 * Description: Типы записей, таксономии, редирект витрины и инвалидация кеша Next.js.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Настройки приходят из окружения контейнера. Константа wp-config имеет приоритет,
 * но в контексте WP-CLI её может не быть, поэтому есть запасной путь через getenv.
 */
function heritage_config( $name ) {
	if ( defined( $name ) ) {
		$value = constant( $name );
		if ( $value ) {
			return $value;
		}
	}

	$value = getenv( $name );

	return $value ? $value : '';
}

add_action(
	'init',
	function () {
		register_post_type(
			'variety',
			array(
				'labels'              => array(
					'name'          => 'Сорта',
					'singular_name' => 'Сорт',
					'add_new_item'  => 'Добавить сорт',
					'edit_item'     => 'Редактировать сорт',
					'search_items'  => 'Искать сорта',
				),
				'public'              => true,
				'menu_icon'           => 'dashicons-palmtree',
				'menu_position'       => 20,
				'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'has_archive'         => true,
				'rewrite'             => array( 'slug' => 'catalog' ),
				'show_in_rest'        => true,
				'show_in_graphql'     => true,
				'graphql_single_name' => 'variety',
				'graphql_plural_name' => 'varieties',
			)
		);

		$taxonomies = array(
			'culture'  => array( 'Культуры', 'Культура', 'culture', 'cultures', true ),
			'ripening' => array( 'Сроки созревания', 'Срок созревания', 'ripening', 'ripenings', false ),
			'region'   => array( 'Регионы', 'Регион', 'region', 'regions', false ),
			'rootstock' => array( 'Подвои', 'Подвой', 'rootstock', 'rootstocks', false ),
		);

		foreach ( $taxonomies as $slug => $config ) {
			list( $plural, $single, $graphql_single, $graphql_plural, $hierarchical ) = $config;

			register_taxonomy(
				$slug,
				array( 'variety' ),
				array(
					'labels'              => array(
						'name'          => $plural,
						'singular_name' => $single,
					),
					'public'              => true,
					'hierarchical'        => $hierarchical,
					'show_admin_column'   => true,
					'show_in_rest'        => true,
					'show_in_graphql'     => true,
					'graphql_single_name' => $graphql_single,
					'graphql_plural_name' => $graphql_plural,
				)
			);
		}
	}
);

/**
 * Фронтенд WordPress не используется: витрина живёт на Next.js.
 * Всё, кроме админки, API и служебных путей, уводим на витрину.
 */
add_action(
	'template_redirect',
	function () {
		if ( is_admin() || wp_doing_ajax() || is_feed() || is_robots() ) {
			return;
		}

		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return;
		}

		$frontend_url = heritage_config( 'FRONTEND_PUBLIC_URL' );

		if ( ! $frontend_url ) {
			return;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';

		$passthrough = array( '/graphql', '/wp-json', '/wp-admin', '/wp-login.php', '/wp-content', '/wp-includes' );
		foreach ( $passthrough as $prefix ) {
			if ( 0 === strpos( $request_uri, $prefix ) ) {
				return;
			}
		}

		wp_safe_redirect( rtrim( $frontend_url, '/' ) . $request_uri, 302 );
		exit;
	}
);

add_filter(
	'allowed_redirect_hosts',
	function ( $hosts ) {
		$frontend_url = heritage_config( 'FRONTEND_PUBLIC_URL' );

		if ( $frontend_url ) {
			$host = wp_parse_url( $frontend_url, PHP_URL_HOST );
			if ( $host ) {
				$hosts[] = $host;
			}
		}

		return $hosts;
	}
);

/**
 * Сбрасывает кеш витрины, иначе правки в админке не видны без перезапуска Next.js.
 */
function heritage_ping_revalidate( $reason ) {
	$frontend_url = heritage_config( 'FRONTEND_INTERNAL_URL' );
	$secret       = heritage_config( 'REVALIDATE_SECRET' );

	if ( ! $frontend_url || ! $secret ) {
		return;
	}

	// В контексте WP-CLI процесс завершается сразу, поэтому неблокирующий запрос теряется.
	$blocking = ! ( defined( 'WP_CLI' ) && WP_CLI );

	wp_remote_post(
		rtrim( $frontend_url, '/' ) . '/api/revalidate',
		array(
			'timeout'  => 5,
			'blocking' => $blocking,
			'headers'  => array( 'Content-Type' => 'application/json' ),
			'body'     => wp_json_encode(
				array(
					'secret' => $secret,
					'reason' => $reason,
				)
			),
		)
	);
}

add_action(
	'save_post',
	function ( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( 'auto-draft' === $post->post_status ) {
			return;
		}

		heritage_ping_revalidate( 'save_post:' . $post->post_type );
	},
	10,
	2
);

add_action(
	'deleted_post',
	function () {
		heritage_ping_revalidate( 'deleted_post' );
	}
);

foreach ( array( 'created_term', 'edited_term', 'delete_term' ) as $term_hook ) {
	add_action(
		$term_hook,
		function () {
			heritage_ping_revalidate( 'term_changed' );
		}
	);
}
```

---

## `wordpress/wp-content/mu-plugins/heritage-fields.php`
```php
<?php
/**
 * Plugin Name: Сады Наследия — поля сорта
 * Description: Характеристики сорта на ACF, зарегистрированные кодом и доступные в WPGraphQL.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'acf/init',
	function () {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		acf_add_local_field_group(
			array(
				'key'                 => 'group_variety_specs',
				'title'               => 'Характеристики сорта',
				'menu_order'          => 0,
				'position'            => 'normal',
				'style'               => 'default',
				'active'              => true,
				'show_in_graphql'     => 1,
				'graphql_field_name'  => 'specs',
				'location'            => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => 'variety',
						),
					),
				),
				'fields'              => array(
					array(
						'key'           => 'field_price_retail',
						'label'         => 'Розничная цена, ₽',
						'name'          => 'price_retail',
						'type'          => 'number',
						'min'           => 0,
						'step'          => 10,
						'wrapper'       => array( 'width' => '33' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_price_wholesale',
						'label'         => 'Оптовая цена, ₽',
						'name'          => 'price_wholesale',
						'type'          => 'number',
						'min'           => 0,
						'step'          => 10,
						'wrapper'       => array( 'width' => '33' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_wholesale_min',
						'label'         => 'Опт от, шт',
						'name'          => 'wholesale_min',
						'type'          => 'number',
						'min'           => 1,
						'default_value' => 50,
						'wrapper'       => array( 'width' => '34' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_sapling_age',
						'label'         => 'Возраст саженца',
						'name'          => 'sapling_age',
						'type'          => 'text',
						'placeholder'   => 'Двухлетка',
						'wrapper'       => array( 'width' => '50' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_availability',
						'label'         => 'Наличие',
						'name'          => 'availability',
						'type'          => 'select',
						'default_value' => 'in_stock',
						'wrapper'       => array( 'width' => '50' ),
						'choices'       => array(
							'in_stock' => 'В наличии',
							'preorder' => 'Под заказ',
							'sold_out' => 'Нет в сезоне',
						),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_planting_rules',
						'label'         => 'Правила посадки',
						'name'          => 'planting_rules',
						'type'          => 'textarea',
						'rows'          => 6,
						'instructions'  => 'Схема посадки, глубина, полив, что важно в первый сезон.',
						'show_in_graphql' => 1,
					),
				),
			)
		);
	}
);
```

---

# 02-frontend-config-lib.md

---

## `frontend/package.json`
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack -H 0.0.0.0",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "lucide-react": "^1.28.0",
    "motion": "^13.0.0",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## `frontend/next.config.ts`
```typescript
import type { NextConfig } from "next";

const wpPublicUrl = process.env.NEXT_PUBLIC_WP_URL ?? "http://localhost:8080";
const { protocol, hostname, port } = new URL(wpPublicUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
```

---

## `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

---

## `frontend/Dockerfile.dev`
```
FROM node:22-alpine

WORKDIR /app

# Бинд-маунт с Windows не отдаёт inotify-события в контейнер, поэтому опрос файлов.
ENV NEXT_TELEMETRY_DISABLED=1 \
    WATCHPACK_POLLING=true \
    CHOKIDAR_USEPOLLING=true

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

---

## `frontend/postcss.config.mjs`
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

## `frontend/app/globals.css`
```css
@import "tailwindcss";

@theme {
  /* Фоны: глубокий зелёный вместо сапфира «Тёмного престижа» */
  --color-bg: #0a1f14;
  --color-bg-deep: #061509;
  --color-emerald: #10331f;
  --color-panel: #12301e;
  --color-panel-dark: #0d2616;

  /* Текст */
  --color-fg: #edf3ec;
  --color-fg-soft: #bfcebf;
  --color-fg-muted: #94a894;
  --color-on-gold: #14301c;

  /* Золото — фамильная бронза бренда */
  --color-gold: #c5a880;
  --color-gold-light: #e4cfa8;
  --color-gold-dark: #9c7a4e;

  --font-display: var(--font-playfair), Georgia, serif;
  --font-body: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family: var(--font-body);
    font-size: 16.5px;
    line-height: 1.74;
    color: var(--color-fg-soft);
    background-color: var(--color-bg);
    background-image:
      radial-gradient(1250px 720px at 10% -8%, rgba(24, 74, 45, 0.9), transparent 62%),
      radial-gradient(900px 620px at 92% 2%, rgba(197, 168, 128, 0.12), transparent 58%),
      radial-gradient(1100px 850px at 50% 112%, rgba(9, 32, 18, 0.95), transparent 62%);
    background-attachment: fixed;
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    color: var(--color-fg);
    font-weight: 700;
    letter-spacing: -0.018em;
    line-height: 1.14;
    text-wrap: balance;
  }

  ::selection {
    background: var(--color-gold);
    color: var(--color-on-gold);
  }

  :focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 3px;
  }
}

@layer components {
  .shell {
    width: 100%;
    max-width: 1200px;
    margin-inline: auto;
    padding-inline: 30px;
  }

  .sec {
    padding-block: 108px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--color-gold);
  }

  .eyebrow::before {
    content: "";
    width: 34px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-gold));
  }

  /* Золото всегда металлическое, никогда плоское */
  .gold-text {
    background-image: linear-gradient(
      100deg,
      #f7eeda 0%,
      #e4cfa8 22%,
      #c5a880 44%,
      #9c7a4e 60%,
      #e4cfa8 80%,
      #faf4e6 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .gold-rule {
    width: 48px;
    height: 2px;
    background: linear-gradient(90deg, #e4cfa8, #c5a880 55%, #9c7a4e);
  }

  .glass {
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
    backdrop-filter: blur(18px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow:
      0 22px 50px -26px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .glass-strong {
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.045));
    backdrop-filter: blur(22px) saturate(155%) brightness(1.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;
    box-shadow:
      0 28px 56px -26px rgba(0, 0, 0, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .lift {
    transition:
      transform 0.45s cubic-bezier(0.16, 0.8, 0.24, 1),
      border-color 0.45s ease,
      box-shadow 0.45s ease;
  }

  .lift:hover {
    transform: translateY(-6px);
    border-color: rgba(197, 168, 128, 0.45);
    box-shadow:
      0 42px 82px -30px rgba(0, 0, 0, 0.82),
      0 0 26px -8px rgba(197, 168, 128, 0.28);
  }

  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    overflow: hidden;
    border-radius: 999px;
    padding: 14px 30px;
    font-family: var(--font-body);
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    transition: all 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  .btn-gold {
    background: linear-gradient(120deg, #e4cfa8, #c5a880 55%, #9c7a4e);
    color: var(--color-on-gold);
    box-shadow: 0 12px 30px -12px rgba(197, 168, 128, 0.6);
  }

  /* Блик проходит по кнопке при наведении */
  .btn-gold::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-140%) skewX(-18deg);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
    transition: transform 0.75s cubic-bezier(0.16, 0.8, 0.24, 1);
  }

  .btn-gold:hover {
    transform: translateY(-2px) scale(1.012);
    box-shadow: 0 22px 50px -14px rgba(197, 168, 128, 0.78);
  }

  .btn-gold:hover::after {
    transform: translateX(140%) skewX(-18deg);
  }

  .btn-ghost {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: var(--color-fg);
    backdrop-filter: blur(10px);
  }

  .btn-ghost:hover {
    transform: translateY(-2px);
    border-color: rgba(197, 168, 128, 0.6);
    background: rgba(197, 168, 128, 0.08);
  }

  .nav-glass {
    background: linear-gradient(140deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.035));
    backdrop-filter: blur(16px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    box-shadow: 0 24px 54px -30px rgba(0, 0, 0, 0.85);
    transition:
      background 0.45s ease,
      border-color 0.45s ease;
  }

  .nav-glass[data-scrolled="true"] {
    background: linear-gradient(140deg, rgba(9, 30, 18, 0.9), rgba(6, 20, 12, 0.82));
    border-color: rgba(197, 168, 128, 0.26);
  }

  .prose-panel :is(h2, h3) {
    margin-top: 2.2em;
    margin-bottom: 0.7em;
  }

  .prose-panel h2::after {
    content: "";
    display: block;
    margin-top: 0.55em;
    width: 48px;
    height: 2px;
    background: linear-gradient(90deg, #e4cfa8, #c5a880 55%, #9c7a4e);
  }

  .prose-panel ul {
    list-style: none;
    padding: 0;
  }

  .prose-panel li {
    position: relative;
    padding-left: 22px;
    margin-block: 0.6em;
  }

  .prose-panel li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.72em;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(120deg, #e4cfa8, #9c7a4e);
  }
}

@media (max-width: 860px) {
  .sec {
    padding-block: 72px;
  }
}

@media (max-width: 768px) {
  .shell {
    padding-inline: 14px;
  }

  body {
    font-size: 16px;
    background-attachment: scroll;
  }

  /* Perf-lite: тяжёлое стекло и подъёмы на мобильных отключены */
  .glass,
  .glass-strong,
  .nav-glass {
    backdrop-filter: blur(10px);
  }

  .lift:hover {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .btn,
  .lift,
  .nav-glass {
    transition: none;
  }

  .btn-gold::after {
    display: none;
  }

  .lift:hover,
  .btn-gold:hover,
  .btn-ghost:hover {
    transform: none;
  }
}
```

---

## `frontend/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { GoldDefs } from "@/components/brand/GoldDefs";
import { site } from "@/lib/site";

const playfair = Playfair_Display({
  subsets: ["cyrillic", "latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} — ${site.tagline} ${site.founder}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${playfair.variable} ${manrope.variable}`}>
      <body className="min-h-screen">
        <GoldDefs />
        <MotionProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
```

---

## `frontend/app/page.tsx`
```tsx
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { Directions } from "@/components/home/Directions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CtaRibbon } from "@/components/home/CtaRibbon";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <Directions />
      <CategoryGrid />
      <CtaRibbon />
    </>
  );
}
```

---

## `frontend/app/about/page.tsx`
```tsx
import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = {
  title: "О питомнике",
};

export default function AboutPage() {
  return (
    <PagePlaceholder
      eyebrow="О питомнике"
      title="История бренда МелиховЪ и"
      accent="философия наследия"
      description="Питомник выращивает посадочный материал для частных садов, фермерских хозяйств и коммерческих садов. Сад — это вложение на десятилетия, поэтому мы отвечаем не за проданный саженец, а за дерево, которое будет плодоносить, когда вырастут дети владельца участка."
      points={[
        "Как устроен маточник и почему мы не перекупаем посадочный материал",
        "Принципы отбора сортов и работы с подвоями",
        "Гарантии на приживаемость и сортовое соответствие",
        "Команда питомника и агрономическая служба",
      ]}
    />
  );
}
```

---

## `frontend/app/services/page.tsx`
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { directions } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Виды деятельности",
  description:
    "Выращивание саженцев плодовых деревьев и ягодных кустарников, подбор районированных сортов, прививка, обрезка, комплектация садов, консультации агронома.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Виды деятельности"
        title="Питомник плодовых и"
        accent="ягодных культур"
        lead="Выращиваем качественный посадочный материал для частных садов, фермерских хозяйств и коммерческих садов."
      />

      <section className="pb-20">
        <div className="shell">
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {directions.map((direction, index) => (
              <Reveal key={direction.title} delay={(index % 3) * 0.08}>
                <article className="glass lift h-full p-[22px]">
                  <direction.icon size={27} strokeWidth={1.1} stroke="url(#goldStroke)" />
                  <h2 className="mt-6 font-display text-[20px]">{direction.title}</h2>
                  <p className="mt-3.5 text-[15px] leading-relaxed text-fg-muted">{direction.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="glass-strong flex flex-col gap-8 p-8 md:p-11 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">Кому отгружаем</p>
                <h2 className="mt-6 font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                  Для сада, дачи и <span className="gold-text">фермерского хозяйства</span>
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-fg-muted">
                  Здоровые саженцы, проверенные сорта и профессиональный подход — от одного дерева для дачного
                  участка до партии на закладку коммерческого сада.
                </p>

                <ul className="mt-7 flex flex-wrap gap-2.5">
                  {site.audiences.map((audience) => (
                    <li
                      key={audience}
                      className="rounded-full border border-gold/25 bg-gold/8 px-4 py-2 text-[13px] text-fg-soft"
                    >
                      {audience}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/info" className="btn btn-gold shrink-0">
                Оставить заявку
                <ArrowRight size={18} strokeWidth={1.7} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/app/info/page.tsx`
```tsx
import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = {
  title: "Покупателям",
};

export default function InfoPage() {
  return (
    <PagePlaceholder
      eyebrow="Покупателям"
      title="Доставка, оплата и"
      accent="самовывоз из питомника"
      description="Отгружаем частным участкам и фермерским хозяйствам. Саженцы готовим к перевозке так, чтобы корневая система дошла живой."
      points={[
        "Условия доставки по регионам и сроки отгрузки",
        "Оплата для частных лиц и по счёту для хозяйств",
        "Подготовка корневой системы к транспортировке",
        "Карта проезда к питомнику и время работы для самовывоза",
        "Форма заявки на подбор сада",
      ]}
    />
  );
}
```

---

## `frontend/app/catalog/page.tsx`
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Filters } from "@/components/catalog/Filters";
import { PriceSwitch } from "@/components/catalog/PriceSwitch";
import { VarietyCard } from "@/components/catalog/VarietyCard";
import { filterKeys, isWholesale, readParam, type SearchParams } from "@/components/catalog/filter-url";
import { buildFacets, getVarieties } from "@/lib/wp/varieties";

export const metadata: Metadata = {
  title: "Каталог саженцев",
  description:
    "Сортовые саженцы плодовых деревьев и ягодных кустарников: подбор по культуре, сроку созревания и региону. Розничные и оптовые цены.",
};

const groupTitles: Record<(typeof filterKeys)[number], string> = {
  culture: "Культура",
  ripening: "Срок созревания",
  region: "Регион",
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const wholesale = isWholesale(params);

  const varieties = await getVarieties();

  const groups = filterKeys.map((key) => ({
    key,
    title: groupTitles[key],
    values: buildFacets(varieties, key),
  }));

  const active = filterKeys.filter((key) => readParam(params, key) !== null);

  const visible = varieties.filter((variety) =>
    active.every((key) => variety[key]?.slug === readParam(params, key)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Каталог"
        title="Саженцы плодовых и"
        accent="ягодных культур"
        lead="Каждый сорт выращен в собственном питомнике: подтверждённый сорт, здоровый подвой и понятные правила посадки."
      />

      <section className="pb-[108px]">
        <div className="shell">
          <div className="grid gap-9 lg:grid-cols-[264px_1fr]">
            <Filters groups={groups} params={params} hasActive={active.length > 0} />

            <div>
              <div className="flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] text-fg-muted">
                  {visible.length > 0 ? `Найдено сортов: ${visible.length}` : "Ничего не найдено"}
                </p>
                <PriceSwitch params={params} />
              </div>

              {wholesale && (
                <p className="mt-6 border border-gold/20 bg-gold/6 px-5 py-4 text-[14px] text-fg-soft">
                  Оптовые цены действуют от указанной партии. Точная стоимость фиксируется в заявке.
                </p>
              )}

              {visible.length > 0 ? (
                <div className="mt-8 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((variety, index) => (
                    <Reveal key={variety.id} delay={(index % 3) * 0.07}>
                      <VarietyCard variety={variety} wholesale={wholesale} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="glass mt-8 p-11 text-center">
                  <h2 className="font-display text-[22px]">
                    {varieties.length === 0 ? "Каталог наполняется" : "Под такие условия сортов нет"}
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                    {varieties.length === 0
                      ? "Сорта добавляются в CMS. Напишите нам — подберём культуру и сорт под ваш участок вручную."
                      : "Попробуйте снять часть фильтров или свяжитесь с нами: подберём подходящий сорт под ваш регион."}
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {varieties.length > 0 && (
                      <Link href="/catalog" className="btn btn-ghost">
                        Сбросить фильтры
                      </Link>
                    )}
                    <Link href="/info" className="btn btn-gold">
                      Оставить заявку
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/app/catalog/[slug]/page.tsx`
```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Shovel, Sprout } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { availabilityLabels, formatPrice, getVarietyBySlug, getVarieties } from "@/lib/wp/varieties";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const variety = await getVarietyBySlug(slug);

  if (!variety) {
    return { title: "Сорт не найден" };
  }

  return {
    title: variety.title,
    description: variety.excerpt || `${variety.title} — саженцы из питомника «Сады Наследия».`,
  };
}

export default async function VarietyPage({ params }: PageProps) {
  const { slug } = await params;
  const variety = await getVarietyBySlug(slug);

  if (!variety) {
    notFound();
  }

  const specs = [
    { label: "Культура", value: variety.culture?.name },
    { label: "Срок созревания", value: variety.ripening?.name },
    { label: "Подвой", value: variety.rootstock?.name },
    { label: "Возраст саженца", value: variety.saplingAge },
    { label: "Регион", value: variety.region?.name },
    { label: "Наличие", value: availabilityLabels[variety.availability] },
  ].filter((spec) => Boolean(spec.value));

  const related = (await getVarieties())
    .filter((item) => item.slug !== variety.slug && item.culture?.slug === variety.culture?.slug)
    .slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-[132px]">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#17452b_0%,#0e2c1b_58%,rgba(5,19,11,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

        <div className="shell relative z-10 pt-16">
          <Reveal>
            <nav className="flex flex-wrap items-center gap-2 text-[12.5px] text-fg-muted">
              <Link href="/" className="transition-colors hover:text-gold">
                Главная
              </Link>
              <ChevronRight size={14} strokeWidth={1.5} />
              <Link href="/catalog" className="transition-colors hover:text-gold">
                Каталог
              </Link>
              {variety.culture && (
                <>
                  <ChevronRight size={14} strokeWidth={1.5} />
                  <Link
                    href={`/catalog?culture=${variety.culture.slug}`}
                    className="transition-colors hover:text-gold"
                  >
                    {variety.culture.name}
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
              <div className="glass relative aspect-4/3 overflow-hidden bg-[linear-gradient(150deg,#173d26_0%,#0d2517_100%)]">
                {variety.image ? (
                  <Image
                    src={variety.image.url}
                    alt={variety.image.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Sprout size={72} strokeWidth={0.7} stroke="url(#goldStroke)" className="opacity-40" />
                  </div>
                )}
              </div>

              <div className="lg:pt-2">
                {variety.culture && <p className="eyebrow">{variety.culture.name}</p>}

                <h1 className="mt-6 text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold">{variety.title}</h1>

                {variety.excerpt && (
                  <p className="mt-6 text-[16.5px] leading-relaxed text-fg-soft">{variety.excerpt}</p>
                )}

                <div className="glass-strong mt-9 p-7">
                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <p className="text-[12.5px] uppercase tracking-[0.14em] text-fg-muted">Розница</p>
                      <p className="gold-text mt-2 font-display text-[30px] leading-none">
                        {formatPrice(variety.priceRetail)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[12.5px] uppercase tracking-[0.14em] text-fg-muted">
                        Опт{variety.wholesaleMin ? ` от ${variety.wholesaleMin} шт` : ""}
                      </p>
                      <p className="mt-2 font-display text-[30px] leading-none text-fg">
                        {formatPrice(variety.priceWholesale)}
                      </p>
                    </div>
                  </div>

                  <Link href="/info" className="btn btn-gold mt-8 w-full justify-center">
                    Оставить заявку
                    <ArrowRight size={18} strokeWidth={1.7} />
                  </Link>

                  <p className="mt-5 text-center text-[12.5px] leading-relaxed text-fg-muted">
                    Отвечаем в течение рабочего дня: уточняем наличие, сроки выкопки и способ доставки.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-[108px]">
        <div className="shell">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
            <div className="flex flex-col gap-[18px]">
              {variety.content && (
                <Reveal>
                  <div
                    className="prose-panel glass p-8 md:p-10"
                    dangerouslySetInnerHTML={{ __html: variety.content }}
                  />
                </Reveal>
              )}

              {variety.plantingRules && (
                <Reveal>
                  <div className="glass p-8 md:p-10">
                    <Shovel size={26} strokeWidth={1.1} stroke="url(#goldStroke)" />
                    <h2 className="mt-6 font-display text-[24px]">Правила посадки</h2>
                    <p className="mt-4 whitespace-pre-line text-[15.5px] leading-relaxed text-fg-soft">
                      {variety.plantingRules}
                    </p>
                  </div>
                </Reveal>
              )}
            </div>

            <Reveal>
              <div className="glass p-8">
                <h2 className="font-display text-[22px]">Характеристики</h2>

                <dl className="mt-6 flex flex-col">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-baseline justify-between gap-5 border-b border-white/8 py-3.5 last:border-b-0"
                    >
                      <dt className="text-[14px] text-fg-muted">{spec.label}</dt>
                      <dd className="text-right text-[14.5px] text-fg-soft">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>

          {related.length > 0 && (
            <div className="mt-20">
              <Reveal>
                <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)]">
                  Другие сорта <span className="gold-text">этой культуры</span>
                </h2>
              </Reveal>

              <div className="mt-9 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item, index) => (
                  <Reveal key={item.id} delay={(index % 3) * 0.07}>
                    <Link href={`/catalog/${item.slug}`} className="glass lift flex h-full flex-col p-[22px]">
                      <h3 className="font-display text-[19px] leading-snug">{item.title}</h3>
                      {item.excerpt && (
                        <p className="mt-3 line-clamp-2 text-[14.5px] leading-relaxed text-fg-muted">
                          {item.excerpt}
                        </p>
                      )}
                      <p className="gold-text mt-auto pt-6 font-display text-[20px]">
                        {formatPrice(item.priceRetail)}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/app/api/revalidate/route.ts`
```typescript
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return Response.json({ error: "REVALIDATE_SECRET не задан" }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as { secret?: string; reason?: string } | null;

  if (!payload || payload.secret !== secret) {
    return Response.json({ error: "Неверный секрет" }, { status: 403 });
  }

  // Next 16 требует профиль времени жизни: "max" помечает тег устаревшим немедленно
  revalidateTag("wp", "max");

  return Response.json({ revalidated: true, reason: payload.reason ?? null });
}
```

---

## `frontend/lib/site.ts`
```typescript
export const site = {
  name: "Сады Наследия",
  founder: "МелиховЪ",
  tagline: "Питомник плодовых и ягодных культур",
  description:
    "Питомник плодовых и ягодных культур «Сады Наследия». Выращиваем сортовые саженцы для частных садов, фермерских хозяйств и коммерческих садов: районированные сорта, паспорт сортности, сопровождение агронома.",
  audiences: ["Частные сады и дачи", "Фермерские хозяйства", "Коммерческие сады"],
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const navigation: NavItem[] = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "/catalog" },
  { label: "Услуги", href: "/services" },
  { label: "О питомнике", href: "/about" },
  { label: "Покупателям", href: "/info" },
];
```

---

# 03-frontend-pages.md

---

## `frontend/lib/catalog.ts`
```typescript
export type Category = {
  name: string;
  slug: string;
  note: string;
};

export type CategoryGroup = {
  title: string;
  description: string;
  categories: Category[];
};

/** Четыре плитки в нижнем ряду геройской bento-сетки. */
export const heroTiles: Category[] = [
  { name: "Яблони", slug: "apple", note: "Летние, осенние, зимние" },
  { name: "Груши", slug: "pear", note: "Устойчивые к парше" },
  { name: "Косточковые", slug: "cherry", note: "Вишни, черешни, сливы" },
  { name: "Кустарники", slug: "currant", note: "Смородина и малина" },
];

export const categoryGroups: CategoryGroup[] = [
  {
    title: "Плодовые деревья",
    description: "Привитые саженцы на проверенных подвоях, с паспортом сорта.",
    categories: [
      { name: "Яблони", slug: "apple", note: "Летние, осенние и зимние сорта" },
      { name: "Груши", slug: "pear", note: "Устойчивые к парше" },
      { name: "Вишни", slug: "cherry", note: "Самоплодные формы" },
      { name: "Черешни", slug: "sweet-cherry", note: "Ранние и поздние" },
      { name: "Сливы", slug: "plum", note: "Домашняя и русская" },
      { name: "Персики", slug: "peach", note: "Для южных участков" },
      { name: "Абрикосы", slug: "apricot", note: "Морозостойкие сорта" },
    ],
  },
  {
    title: "Ягодные кустарники",
    description: "Урожай уже на второй сезон после посадки.",
    categories: [
      { name: "Смородина", slug: "currant", note: "Чёрная, красная, белая" },
      { name: "Крыжовник", slug: "gooseberry", note: "Бесшипные формы" },
      { name: "Малина", slug: "raspberry", note: "Ремонтантная и летняя" },
    ],
  },
];
```

---

## `frontend/lib/services.ts`
```typescript
import type { LucideIcon } from "lucide-react";
import {
  Grape,
  Handshake,
  Leaf,
  LayoutGrid,
  MapPinned,
  MessagesSquare,
  PackageCheck,
  Scissors,
  TreeDeciduous,
} from "lucide-react";

export type Direction = {
  icon: LucideIcon;
  title: string;
  text: string;
};

/** Виды деятельности питомника. Источник правды для страницы услуг и блока на главной. */
export const directions: Direction[] = [
  {
    icon: TreeDeciduous,
    title: "Саженцы плодовых деревьев",
    text: "Яблоня, груша, вишня, черешня, слива, персик и абрикос — выращиваем полный цикл в собственном питомнике.",
  },
  {
    icon: Grape,
    title: "Ягодные кустарники",
    text: "Смородина, крыжовник и малина: сильные однолетние и двухлетние кусты, готовые к посадке.",
  },
  {
    icon: PackageCheck,
    title: "Производство сортовых саженцев",
    text: "Производим и реализуем посадочный материал с подтверждённым сортом и подвоем.",
  },
  {
    icon: MapPinned,
    title: "Подбор районированных сортов",
    text: "Смотрим на климат, почву и уровень грунтовых вод участка и подбираем сорта под ваш регион.",
  },
  {
    icon: Scissors,
    title: "Прививка и окулировка",
    text: "Прививаем, окулируем и размножаем плодовые культуры, в том числе на ваших деревьях.",
  },
  {
    icon: Leaf,
    title: "Уход за маточными насаждениями",
    text: "Формирование, обрезка и содержание маточника — основа качества будущих саженцев.",
  },
  {
    icon: MessagesSquare,
    title: "Консультации агронома",
    text: "Посадка, полив, подкормка, обрезка и защита растений — сопровождаем на всех этапах.",
  },
  {
    icon: LayoutGrid,
    title: "Комплектация садов",
    text: "Подбираем культуры и сорта для закладки плодового или ягодного сада под задачу участка.",
  },
  {
    icon: Handshake,
    title: "Опт и розница",
    text: "Отгружаем частным садам, фермерским и коммерческим хозяйствам: от одного саженца до партии.",
  },
];
```

---

## `frontend/lib/wp/client.ts`
```typescript
const WP_INTERNAL_URL = process.env.WP_INTERNAL_URL ?? "http://wordpress";

export const WP_PUBLIC_URL = process.env.NEXT_PUBLIC_WP_URL ?? "http://localhost:8080";

type QueryOptions = {
  variables?: Record<string, unknown>;
  tags?: string[];
  revalidate?: number;
};

/**
 * Запрос к WPGraphQL по внутреннему адресу контейнера.
 * Возвращает null, если WordPress недоступен: витрина должна открываться и без CMS.
 */
export async function wpQuery<T>(query: string, options: QueryOptions = {}): Promise<T | null> {
  const { variables = {}, tags = [], revalidate = 300 } = options;

  try {
    const response = await fetch(`${WP_INTERNAL_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { tags: ["wp", ...tags], revalidate },
    });

    if (!response.ok) {
      console.warn(`[wp] ответ ${response.status} на GraphQL-запрос`);
      return null;
    }

    const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (payload.errors?.length) {
      console.warn("[wp] ошибки GraphQL:", payload.errors.map((error) => error.message).join("; "));
      return null;
    }

    return payload.data ?? null;
  } catch (error) {
    console.warn("[wp] WordPress недоступен:", error instanceof Error ? error.message : error);
    return null;
  }
}
```

---

## `frontend/lib/wp/media.ts`
```typescript
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
```

---

## `frontend/lib/wp/varieties.ts`
```typescript
import { wpQuery } from "./client";
import { toPublicMediaUrl } from "./media";

export type Term = { name: string; slug: string };

export type Availability = "in_stock" | "preorder" | "sold_out";

export type Variety = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: { url: string; alt: string } | null;
  culture: Term | null;
  ripening: Term | null;
  region: Term | null;
  rootstock: Term | null;
  priceRetail: number | null;
  priceWholesale: number | null;
  wholesaleMin: number | null;
  saplingAge: string | null;
  availability: Availability;
  plantingRules: string | null;
};

type RawTermList = { nodes: Term[] } | null;

type RawVariety = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: { node: { sourceUrl: string; altText: string | null } | null } | null;
  cultures: RawTermList;
  ripenings: RawTermList;
  regions: RawTermList;
  rootstocks: RawTermList;
  specs: {
    priceRetail: number | null;
    priceWholesale: number | null;
    wholesaleMin: number | null;
    saplingAge: string | null;
    // ACF отдаёт select списком даже без множественного выбора
    availability: string[] | string | null;
    plantingRules: string | null;
  } | null;
};

const VARIETY_FIELDS = `
  id
  title
  slug
  excerpt
  content
  featuredImage { node { sourceUrl altText } }
  cultures { nodes { name slug } }
  ripenings { nodes { name slug } }
  regions { nodes { name slug } }
  rootstocks { nodes { name slug } }
  specs {
    priceRetail
    priceWholesale
    wholesaleMin
    saplingAge
    availability
    plantingRules
  }
`;

function stripTags(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
    .trim();
}

function firstTerm(list: RawTermList): Term | null {
  return list?.nodes?.[0] ?? null;
}

function toAvailability(value: string[] | string | null | undefined): Availability {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "preorder" || raw === "sold_out" ? raw : "in_stock";
}

function mapVariety(raw: RawVariety): Variety {
  const image = raw.featuredImage?.node;
  const imageUrl = toPublicMediaUrl(image?.sourceUrl);

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: stripTags(raw.excerpt),
    content: raw.content ?? "",
    image: imageUrl ? { url: imageUrl, alt: image?.altText ?? raw.title } : null,
    culture: firstTerm(raw.cultures),
    ripening: firstTerm(raw.ripenings),
    region: firstTerm(raw.regions),
    rootstock: firstTerm(raw.rootstocks),
    priceRetail: raw.specs?.priceRetail ?? null,
    priceWholesale: raw.specs?.priceWholesale ?? null,
    wholesaleMin: raw.specs?.wholesaleMin ?? null,
    saplingAge: raw.specs?.saplingAge ?? null,
    availability: toAvailability(raw.specs?.availability),
    plantingRules: raw.specs?.plantingRules ?? null,
  };
}

/** Все опубликованные сорта. Фильтрация идёт на витрине: объём каталога это позволяет. */
export async function getVarieties(): Promise<Variety[]> {
  const data = await wpQuery<{ varieties: { nodes: RawVariety[] } }>(
    `query Varieties { varieties(first: 200, where: { orderby: { field: TITLE, order: ASC } }) { nodes { ${VARIETY_FIELDS} } } }`,
    { tags: ["varieties"] },
  );

  return data?.varieties?.nodes?.map(mapVariety) ?? [];
}

export async function getVarietyBySlug(slug: string): Promise<Variety | null> {
  const data = await wpQuery<{ variety: RawVariety | null }>(
    `query Variety($slug: ID!) { variety(id: $slug, idType: SLUG) { ${VARIETY_FIELDS} } }`,
    { variables: { slug }, tags: ["varieties", `variety:${slug}`] },
  );

  return data?.variety ? mapVariety(data.variety) : null;
}

export type FacetValue = Term & { count: number };

/** Считаем доступные значения фильтров по самим сортам, чтобы не показывать пустые варианты. */
export function buildFacets(varieties: Variety[], key: "culture" | "ripening" | "region"): FacetValue[] {
  const map = new Map<string, FacetValue>();

  for (const variety of varieties) {
    const term = variety[key];
    if (!term) continue;

    const existing = map.get(term.slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(term.slug, { ...term, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export const availabilityLabels: Record<Availability, string> = {
  in_stock: "В наличии",
  preorder: "Под заказ",
  sold_out: "Нет в сезоне",
};

export function formatPrice(value: number | null): string {
  if (value === null) return "по запросу";
  return `${value.toLocaleString("ru-RU")} ₽`;
}
```

---

## `frontend/components/brand/GoldDefs.tsx`
```tsx
/**
 * Общие градиенты золота. Рендерятся один раз в layout, чтобы иконки Lucide и SVG
 * могли ссылаться на них через stroke="url(#goldStroke)" или fill="url(#goldMetal)".
 */
export function GoldDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7eeda" />
          <stop offset="22%" stopColor="#e4cfa8" />
          <stop offset="45%" stopColor="#c5a880" />
          <stop offset="62%" stopColor="#9c7a4e" />
          <stop offset="82%" stopColor="#e4cfa8" />
          <stop offset="100%" stopColor="#faf4e6" />
        </linearGradient>

        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2e4c6" />
          <stop offset="35%" stopColor="#c5a880" />
          <stop offset="65%" stopColor="#9c7a4e" />
          <stop offset="100%" stopColor="#e4cfa8" />
        </linearGradient>

        <linearGradient id="goldSoft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e4cfa8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#9c7a4e" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

---

## `frontend/components/brand/Emblem.tsx`
```tsx
type EmblemProps = {
  /** Уникальный идентификатор: внутри SVG есть ссылки по id, они не должны конфликтовать. */
  id?: string;
  className?: string;
};

/**
 * Круглая эмблема питомника: кольца, надпись «МЕЛИХОВЪ» по дуге,
 * монограмма «СН» и лиственная веточка. Всё в металлическом золоте.
 */
export function Emblem({ id = "emblem", className }: EmblemProps) {
  const arcId = `${id}-arc`;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Эмблема питомника «Сады Наследия», основатель МелиховЪ">
      <defs>
        <path id={arcId} d="M 34 104 A 66 66 0 0 1 166 104" fill="none" />
      </defs>

      <circle cx="100" cy="100" r="84" fill="none" stroke="url(#goldStroke)" strokeWidth="1.4" opacity="0.92" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="url(#goldStroke)" strokeWidth="0.7" opacity="0.45" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="url(#goldStroke)" strokeWidth="0.9" opacity="0.3" />

      <text
        fill="url(#goldMetal)"
        fontFamily="var(--font-manrope), sans-serif"
        fontSize="15"
        fontWeight="600"
        letterSpacing="3.4"
      >
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          МЕЛИХОВЪ
        </textPath>
      </text>

      {/* Веточка с двумя листьями — мотив из логотипа */}
      <g stroke="url(#goldStroke)" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M100 148 C 100 136, 100 128, 100 118" />
        <path d="M100 132 C 90 130, 83 122, 82 112 C 92 112, 99 120, 100 130 Z" fill="url(#goldSoft)" />
        <path d="M100 126 C 110 124, 117 116, 118 106 C 108 106, 101 114, 100 124 Z" fill="url(#goldSoft)" />
      </g>

      <text
        x="100"
        y="112"
        textAnchor="middle"
        fill="url(#goldMetal)"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="56"
        fontWeight="700"
        letterSpacing="-2"
      >
        СН
      </text>

      <g stroke="url(#goldStroke)" strokeWidth="1.2" fill="none" opacity="0.75">
        <path d="M70 158 A 46 46 0 0 0 130 158" />
      </g>
      <circle cx="63" cy="150" r="2" fill="url(#goldMetal)" />
      <circle cx="137" cy="150" r="2" fill="url(#goldMetal)" />
    </svg>
  );
}
```

---

## `frontend/components/brand/Wordmark.tsx`
```tsx
import { Emblem } from "./Emblem";

type WordmarkProps = {
  id?: string;
  compact?: boolean;
};

export function Wordmark({ id = "wordmark", compact = false }: WordmarkProps) {
  return (
    <span className="flex items-center gap-3">
      <Emblem id={id} className={compact ? "h-11 w-11" : "h-14 w-14"} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-bold uppercase tracking-[0.2em] text-fg md:text-base">
          Сады Наследия
        </span>
        <span className="mt-1.5 font-body text-[0.55rem] uppercase tracking-[0.34em] text-gold">
          Питомник плодовых деревьев
        </span>
      </span>
    </span>
  );
}
```

---

# 04-frontend-components.md

---

## `frontend/components/layout/Header.tsx`
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X, Sprout, ArrowRight } from "lucide-react";
import { navigation } from "@/lib/site";
import { Wordmark } from "@/components/brand/Wordmark";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renderedPath, setRenderedPath] = useState(pathname);

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false,
  );

  // Переход по ссылке из шторки закрывает её: состояние правим на рендере, а не эффектом
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="fixed inset-x-0 top-5 z-50 md:top-[30px]">
        <div className="shell">
          <div
            data-scrolled={scrolled}
            className="nav-glass flex h-[60px] items-center justify-between gap-6 px-4 md:h-[70px] md:px-6"
          >
            <Link href="/" aria-label="На главную">
              <Wordmark id="nav-emblem" compact />
            </Link>

            <nav className="hidden items-center gap-8 xl:flex">
              {navigation.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  className={`group relative py-2 text-[13.5px] font-medium tracking-[0.01em] transition-colors duration-300 ${
                    isActive(navItem.href) ? "text-fg" : "text-fg-soft hover:text-fg"
                  }`}
                >
                  {navItem.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-gold-light to-gold-dark transition-all duration-500 ${
                      isActive(navItem.href) ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/info"
                className="hidden items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 py-2 pl-2 pr-4 text-[12.5px] font-medium text-fg transition-colors duration-300 hover:border-gold/60 lg:inline-flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-deep">
                  <Sprout size={14} strokeWidth={1.5} stroke="url(#goldStroke)" />
                </span>
                Консультация агронома
              </Link>

              <Link href="/services" className="btn btn-gold hidden !px-6 !py-2.5 !text-[13px] md:inline-flex">
                Подобрать сад
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Открыть меню"
                className="flex h-9 w-9 items-center justify-center text-fg xl:hidden"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Мобильная шторка */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-500 xl:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm"
        />

        <aside
          className={`absolute inset-y-0 right-0 flex w-[86%] max-w-[380px] flex-col border-l-2 border-gold/60 bg-[linear-gradient(160deg,rgba(12,38,22,.96),rgba(6,21,12,.98))] backdrop-blur-xl transition-transform duration-500 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(.16,.8,.24,1)" }}
        >
          <div className="flex items-center justify-between px-7 pb-6 pt-7">
            <span className="eyebrow">Меню</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрыть меню"
              className="text-fg-soft transition-colors hover:text-fg"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-col px-7">
            {navigation.map((navItem) => (
              <Link
                key={navItem.href}
                href={navItem.href}
                className="border-b border-white/8 py-4 font-display text-[19px] text-fg transition-colors hover:text-gold"
              >
                {navItem.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 px-7 pb-9">
            <Link href="/services" className="btn btn-gold w-full">
              Подобрать сад
              <ArrowRight size={17} strokeWidth={1.6} />
            </Link>
            <Link href="/info" className="btn btn-ghost w-full">
              Консультация агронома
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
```

---

## `frontend/components/layout/Footer.tsx`
```tsx
import Link from "next/link";
import { categoryGroups } from "@/lib/catalog";
import { navigation, site } from "@/lib/site";
import { Emblem } from "@/components/brand/Emblem";

export function Footer() {
  const year = new Date().getFullYear();
  const trees = categoryGroups[0]?.categories.slice(0, 5) ?? [];

  return (
    <footer className="border-t border-white/8 bg-bg-deep">
      <div className="shell grid gap-[46px] pb-16 pt-[70px] lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <Emblem id="footer-emblem" className="h-16 w-16" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-fg">
                Сады Наследия
              </span>
              <span className="mt-2 font-body text-[0.55rem] uppercase tracking-[0.34em] text-gold">
                Основатель — МелиховЪ
              </span>
            </div>
          </div>

          <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-fg-muted">
            {site.tagline}. Саженцы из собственного маточника, районированные сорта и сопровождение агронома весь
            первый сезон.
          </p>
        </div>

        <nav className="flex flex-col gap-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Разделы</p>
          {navigation.map((navItem) => (
            <Link
              key={navItem.href}
              href={navItem.href}
              className="text-[14.5px] text-fg-muted transition-colors hover:text-fg"
            >
              {navItem.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Каталог</p>
          {trees.map((category) => (
            <Link
              key={category.slug}
              href={`/catalog?culture=${category.slug}`}
              className="text-[14.5px] text-fg-muted transition-colors hover:text-fg"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/8">
        <div className="shell flex flex-col gap-2 py-6 text-[12.5px] text-fg-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} Питомник «Сады Наследия»</p>
          <p>Политика конфиденциальности</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## `frontend/components/layout/PageHeader.tsx`
```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  accent: string;
  lead?: string;
};

export function PageHeader({ eyebrow, title, accent, lead }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-[132px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#17452b_0%,#0e2c1b_58%,rgba(5,19,11,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

      <div className="shell relative z-10 pt-16">
        <Reveal>
          <nav className="flex items-center gap-2 text-[12.5px] text-fg-muted">
            <Link href="/" className="transition-colors hover:text-gold">
              Главная
            </Link>
            <ChevronRight size={14} strokeWidth={1.5} />
            <span className="text-fg-soft">{eyebrow}</span>
          </nav>

          <p className="eyebrow mt-8">{eyebrow}</p>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.1rem,4.6vw,3.15rem)] font-extrabold">
            {title} <span className="gold-text">{accent}</span>
          </h1>

          {lead && <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-fg-soft">{lead}</p>}
        </Reveal>
      </div>
    </section>
  );
}
```

---

## `frontend/components/layout/PagePlaceholder.tsx`
```tsx
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "./PageHeader";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  points: string[];
};

export function PagePlaceholder({ eyebrow, title, accent, description, points }: PagePlaceholderProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} accent={accent} />

      <section className="pb-[108px]">
        <div className="shell">
          <Reveal>
            <div className="prose-panel glass max-w-[900px] p-8 md:p-11">
              <p className="text-[16.5px] leading-relaxed text-fg-soft">{description}</p>

              <h2 className="font-display text-[24px]">Что появится в этом разделе</h2>
              <ul>
                {points.map((point) => (
                  <li key={point} className="text-[15.5px] text-fg-muted">
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/catalog" className="btn btn-gold">
                  Перейти в каталог
                </Link>
                <Link href="/" className="btn btn-ghost">
                  На главную
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
```

---

## `frontend/components/home/Hero.tsx`
```tsx
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarDays, Tractor } from "lucide-react";
import { OrchardCanvas } from "./OrchardCanvas";
import { Emblem } from "@/components/brand/Emblem";
import { heroTiles } from "@/lib/catalog";

const HERO_VIDEO_SRC = "/media/hero.mp4";
const WIDE_SCREEN_QUERY = "(min-width: 768px)";

function subscribeWideScreen(onChange: () => void) {
  const query = window.matchMedia(WIDE_SCREEN_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const easeOutExpo: [number, number, number, number] = [0.16, 0.8, 0.24, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: easeOutExpo } },
};

const tickerItems = [
  "Приём заявок на осенний сезон открыт",
  "Опт для хозяйств — от 50 саженцев",
  "Подбор сорта под участок за 1 день",
  "Паспорт сортности к каждому саженцу",
  "Гарантия сортового соответствия",
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);

  // На узких экранах и при reduced motion видео не грузим вовсе
  const wideScreen = useSyncExternalStore(
    subscribeWideScreen,
    () => window.matchMedia(WIDE_SCREEN_QUERY).matches,
    () => false,
  );

  const videoAllowed = wideScreen && !reduceMotion;

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden pb-16 pt-[104px]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#17452b_0%,#0e2c1b_52%,#05130b_100%)]" />

      {videoAllowed && (
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ${
            videoReady ? "opacity-40" : "opacity-0"
          }`}
          src={HERO_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        />
      )}

      <OrchardCanvas />

      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,19,11,.92)_0%,rgba(5,19,11,.62)_45%,rgba(5,19,11,.3)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

      <motion.div variants={container} initial="hidden" animate="show" className="shell relative z-10 w-full">
        <div className="grid gap-4 lg:grid-cols-[1.62fr_1fr]">
          <motion.div variants={item} className="glass-strong relative overflow-hidden p-8 md:p-11 lg:p-14">
            <p className="eyebrow">Питомник плодовых деревьев</p>

            <h1 className="mt-7 max-w-3xl text-[clamp(2.3rem,5.2vw,3.35rem)] font-extrabold">
              Сады, которые переживут <span className="gold-text">поколения</span>
            </h1>

            <p className="mt-7 max-w-xl text-fg-soft">
              Саженцы из собственного маточника: районированные сорта, паспорт сортности и агроном на связи весь
              первый сезон.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalog" className="btn btn-gold group">
                Перейти в каталог
                <ArrowRight
                  size={18}
                  strokeWidth={1.7}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link href="/services" className="btn btn-ghost">
                Подобрать сад
              </Link>
            </div>

            {/* Бегущая строка активности питомника */}
            <div className="relative mt-11 overflow-hidden border-t border-white/8 pt-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
              <motion.div
                className="flex w-max gap-10 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              >
                {[...tickerItems, ...tickerItems].map((text, index) => (
                  <span
                    key={`${text}-${index}`}
                    className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] text-fg-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-gold" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -right-8 hidden lg:block"
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Emblem id="hero-emblem" className="h-[260px] w-[260px] opacity-[0.13]" />
            </motion.div>
          </motion.div>

          <div className="grid gap-4">
            <motion.article variants={item} className="glass lift p-7">
              <CalendarDays size={26} strokeWidth={1.1} stroke="url(#goldStroke)" />
              <h2 className="mt-5 font-display text-[21px]">Осенняя посадка</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                Лучшее окно для плодовых — с конца сентября. Заявку стоит закрепить заранее: сорта расходятся
                партиями.
              </p>
            </motion.article>

            <motion.article variants={item} className="glass lift p-7">
              <Tractor size={26} strokeWidth={1.1} stroke="url(#goldStroke)" />
              <h2 className="mt-5 font-display text-[21px]">Хозяйствам</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                Оптовые цены от 50 саженцев, расчёт схемы посадки и подбор подвоя под тип почвы.
              </p>
            </motion.article>
          </div>
        </div>

        <motion.div variants={item} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroTiles.map((tile) => (
            <Link
              key={tile.slug}
              href={`/catalog?culture=${tile.slug}`}
              className="glass lift group flex items-start justify-between gap-4 p-6"
            >
              <span>
                <span className="block font-display text-[19px] text-fg">{tile.name}</span>
                <span className="mt-1.5 block text-[13px] text-fg-muted">{tile.note}</span>
              </span>
              <ArrowUpRight
                size={19}
                strokeWidth={1.4}
                className="mt-1 shrink-0 text-white/25 transition-colors duration-300 group-hover:text-gold"
              />
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
```

---

## `frontend/components/home/ValueProps.tsx`
```tsx
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
```

---

## `frontend/components/home/Directions.tsx`
```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { directions } from "@/lib/services";
import { Reveal } from "@/components/ui/Reveal";

export function Directions() {
  const preview = directions.slice(0, 6);

  return (
    <section className="sec pt-0">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Виды деятельности</p>
              <h2 className="mt-6 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)]">
                Питомник полного цикла — от прививки до <span className="gold-text">закладки сада</span>
              </h2>
            </div>

            <Link
              href="/services"
              className="group inline-flex shrink-0 items-center gap-2.5 text-[14px] font-medium text-gold transition-colors hover:text-gold-light"
            >
              Все направления
              <ArrowRight
                size={17}
                strokeWidth={1.6}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((direction, index) => (
            <Reveal key={direction.title} delay={(index % 3) * 0.07}>
              <article className="glass lift flex h-full items-center gap-4 p-[22px]">
                <direction.icon size={24} strokeWidth={1.1} stroke="url(#goldStroke)" className="shrink-0" />
                <h3 className="font-display text-[18px] leading-snug">{direction.title}</h3>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/CategoryGrid.tsx`
```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryGroups } from "@/lib/catalog";
import { Reveal } from "@/components/ui/Reveal";

export function CategoryGrid() {
  return (
    <section className="sec pt-0">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">Каталог</p>
          <h2 className="mt-6 max-w-2xl text-[clamp(1.85rem,3.6vw,2.9rem)]">
            Плодовые деревья и <span className="gold-text">ягодные кустарники</span>
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-16">
          {categoryGroups.map((group) => (
            <div key={group.title}>
              <Reveal>
                <div className="flex flex-col gap-3 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
                  <h3 className="font-display text-[24px]">{group.title}</h3>
                  <p className="text-[14px] text-fg-muted">{group.description}</p>
                </div>
              </Reveal>

              <div className="mt-[15px] grid gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
                {group.categories.map((category, index) => (
                  <Reveal key={category.slug} delay={index * 0.06}>
                    <Link
                      href={`/catalog?culture=${category.slug}`}
                      className="glass lift group flex h-full items-start justify-between gap-4 p-[22px]"
                    >
                      <span>
                        <span className="block font-display text-[19px] text-fg transition-colors duration-300 group-hover:text-gold-light">
                          {category.name}
                        </span>
                        <span className="mt-2 block text-[13.5px] text-fg-muted">{category.note}</span>
                      </span>
                      <ArrowUpRight
                        size={19}
                        strokeWidth={1.4}
                        className="mt-1 shrink-0 text-white/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                      />
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/CtaRibbon.tsx`
```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export function CtaRibbon() {
  return (
    <section className="pb-[108px]">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col items-start gap-7 rounded-2xl bg-[linear-gradient(120deg,#e4cfa8_0%,#c5a880_55%,#9c7a4e_100%)] px-8 py-9 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="max-w-2xl">
              <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] text-on-gold">
                Соберём сад под ваш участок
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-on-gold/80">
                Пришлите размер участка, регион и пожелания по культурам — вернёмся со схемой посадки, подбором
                сортов и расчётом партии.
              </p>
            </div>

            <Link
              href="/info"
              className="btn shrink-0 bg-emerald text-fg transition-transform duration-300 hover:-translate-y-0.5"
            >
              Оставить заявку
              <ArrowRight size={18} strokeWidth={1.7} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

---

## `frontend/components/home/OrchardCanvas.tsx`
```tsx
"use client";

import { useEffect, useRef } from "react";

type Branch = {
  x0: number;
  y0: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  x1: number;
  y1: number;
  phase: number;
  amplitude: number;
  buds: number[];
};

function pointOnCurve(branch: Branch, t: number, sway: number) {
  const u = 1 - t;
  const x =
    u * u * u * branch.x0 +
    3 * u * u * t * (branch.cx1 + sway) +
    3 * u * t * t * (branch.cx2 + sway * 1.6) +
    t * t * t * (branch.x1 + sway * 2);
  const y =
    u * u * u * branch.y0 + 3 * u * u * t * branch.cy1 + 3 * u * t * t * branch.cy2 + t * t * t * branch.y1;

  return { x, y };
}

/**
 * Фон героя: сеть ветвей с почками, медленно покачивается.
 * Аналог сети маршрутов в «Тёмном престиже», переведённый на язык сада.
 */
export function OrchardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    let branches: Branch[] = [];
    let frame = 0;
    let start = performance.now();

    const buildBranches = () => {
      const count = lite ? 7 : 14;
      branches = Array.from({ length: count }, (_, index) => {
        const spread = index / Math.max(count - 1, 1);
        const x0 = width * (-0.05 + spread * 0.5);
        const y0 = height * (1.05 - spread * 0.12);
        const x1 = width * (0.35 + spread * 0.72);
        const y1 = height * (0.62 - spread * 0.58);

        return {
          x0,
          y0,
          cx1: x0 + width * 0.1,
          cy1: y0 - height * 0.34,
          cx2: x1 - width * 0.22,
          cy2: y1 + height * 0.24,
          x1,
          y1,
          phase: index * 0.7,
          amplitude: lite ? 4 : 9 + (index % 4) * 3,
          buds: [0.36, 0.58, 0.79].slice(0, lite ? 2 : 3),
        };
      });
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildBranches();
    };

    const draw = (now: number) => {
      const time = (now - start) / 1000;
      context.clearRect(0, 0, width, height);

      const stroke = context.createLinearGradient(0, height, width, 0);
      stroke.addColorStop(0, "rgba(156, 122, 78, 0.05)");
      stroke.addColorStop(0.45, "rgba(197, 168, 128, 0.42)");
      stroke.addColorStop(1, "rgba(228, 207, 168, 0.12)");

      branches.forEach((branch) => {
        const sway = reduceMotion ? 0 : Math.sin(time * 0.28 + branch.phase) * branch.amplitude;

        context.beginPath();
        context.moveTo(branch.x0, branch.y0);
        context.bezierCurveTo(
          branch.cx1 + sway,
          branch.cy1,
          branch.cx2 + sway * 1.6,
          branch.cy2,
          branch.x1 + sway * 2,
          branch.y1
        );
        context.strokeStyle = stroke;
        context.lineWidth = 1.15;
        context.stroke();

        branch.buds.forEach((t, budIndex) => {
          const { x, y } = pointOnCurve(branch, t, sway);
          const pulse = reduceMotion ? 0.55 : 0.42 + Math.sin(time * 0.9 + budIndex + branch.phase) * 0.28;

          context.beginPath();
          context.arc(x, y, 2.1, 0, Math.PI * 2);
          context.fillStyle = `rgba(228, 207, 168, ${Math.max(pulse, 0.15)})`;
          context.fill();

          if (!lite) {
            context.beginPath();
            context.arc(x, y, 7.5, 0, Math.PI * 2);
            context.fillStyle = `rgba(197, 168, 128, ${Math.max(pulse * 0.12, 0.03)})`;
            context.fill();
          }
        });
      });

      if (!reduceMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    start = performance.now();
    frame = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
```

---

## `frontend/components/catalog/Filters.tsx`
```tsx
import Link from "next/link";
import { X } from "lucide-react";
import type { FacetValue } from "@/lib/wp/varieties";
import { buildFilterHref, readParam, type FilterKey, type SearchParams } from "./filter-url";

type Group = {
  key: FilterKey;
  title: string;
  values: FacetValue[];
};

type FiltersProps = {
  groups: Group[];
  params: SearchParams;
  hasActive: boolean;
};

export function Filters({ groups, params, hasActive }: FiltersProps) {
  return (
    <aside className="lg:sticky lg:top-[110px]">
      <div className="glass p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Фильтры</p>
          {hasActive && (
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted transition-colors hover:text-gold"
            >
              <X size={13} strokeWidth={1.6} />
              Сбросить
            </Link>
          )}
        </div>

        {groups.map((group) => (
          <section key={group.key} className="mt-8 border-t border-white/8 pt-6 first-of-type:mt-7">
            <h2 className="font-display text-[17px]">{group.title}</h2>

            <ul className="mt-4 flex flex-col gap-1.5">
              {group.values.map((value) => {
                const active = readParam(params, group.key) === value.slug;

                return (
                  <li key={value.slug}>
                    <Link
                      href={buildFilterHref(params, group.key, value.slug)}
                      aria-current={active ? "true" : undefined}
                      className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-[14px] transition-colors ${
                        active
                          ? "border-gold/45 bg-gold/12 text-fg"
                          : "border-transparent text-fg-muted hover:border-white/12 hover:text-fg-soft"
                      }`}
                    >
                      <span>{value.name}</span>
                      <span className="text-[12px] text-fg-muted/70 tabular-nums">{value.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
```

---

## `frontend/components/catalog/PriceSwitch.tsx`
```tsx
import Link from "next/link";
import { buildFilterHref, isWholesale, type SearchParams } from "./filter-url";

/** Розница / опт переключаются ссылкой: фильтр остаётся в адресе и переживает перезагрузку. */
export function PriceSwitch({ params }: { params: SearchParams }) {
  const wholesale = isWholesale(params);

  const modes = [
    { label: "Розница", active: !wholesale, href: buildFilterHref({ ...params, price: undefined }, "price", null) },
    { label: "Опт", active: wholesale, href: buildFilterHref({ ...params, price: undefined }, "price", "opt") },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1">
      {modes.map((mode) => (
        <Link
          key={mode.label}
          href={mode.href}
          aria-current={mode.active ? "true" : undefined}
          className={`rounded-full px-5 py-2 text-[13.5px] transition-colors ${
            mode.active ? "bg-gold/18 text-fg" : "text-fg-muted hover:text-fg-soft"
          }`}
        >
          {mode.label}
        </Link>
      ))}
    </div>
  );
}
```

---

## `frontend/components/catalog/VarietyCard.tsx`
```tsx
import Image from "next/image";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { availabilityLabels, formatPrice, type Variety } from "@/lib/wp/varieties";

type VarietyCardProps = {
  variety: Variety;
  wholesale: boolean;
};

export function VarietyCard({ variety, wholesale }: VarietyCardProps) {
  const price = wholesale ? variety.priceWholesale : variety.priceRetail;
  const chips = [variety.ripening?.name, variety.saplingAge, variety.rootstock?.name].filter(Boolean) as string[];

  return (
    <Link href={`/catalog/${variety.slug}`} className="glass lift group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-4/3 overflow-hidden bg-[linear-gradient(150deg,#173d26_0%,#0d2517_100%)]">
        {variety.image ? (
          <Image
            src={variety.image.url}
            alt={variety.image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Sprout size={44} strokeWidth={0.8} stroke="url(#goldStroke)" className="opacity-45" />
          </div>
        )}

        {variety.availability !== "in_stock" && (
          <span className="absolute left-4 top-4 border border-gold/30 bg-bg-deep/75 px-3 py-1.5 text-[11.5px] tracking-wide text-fg-soft backdrop-blur-sm">
            {availabilityLabels[variety.availability]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[22px]">
        {variety.culture && <p className="eyebrow">{variety.culture.name}</p>}

        <h3 className="mt-4 font-display text-[20px] leading-snug transition-colors group-hover:text-gold-light">
          {variety.title}
        </h3>

        {variety.excerpt && (
          <p className="mt-3 line-clamp-2 text-[14.5px] leading-relaxed text-fg-muted">{variety.excerpt}</p>
        )}

        {chips.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip} className="border border-white/10 px-2.5 py-1 text-[11.5px] text-fg-muted">
                {chip}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-7">
          <div>
            <p className="gold-text font-display text-[22px]">{formatPrice(price)}</p>
            {wholesale && variety.wholesaleMin && (
              <p className="mt-1 text-[12px] text-fg-muted">от {variety.wholesaleMin} шт</p>
            )}
          </div>
          <span className="text-[13px] text-fg-muted transition-colors group-hover:text-gold">Подробнее</span>
        </div>
      </div>
    </Link>
  );
}
```

---

## `frontend/components/catalog/filter-url.ts`
```typescript
export type SearchParams = Record<string, string | string[] | undefined>;

export const filterKeys = ["culture", "ripening", "region"] as const;

export type FilterKey = (typeof filterKeys)[number];

export function readParam(params: SearchParams, key: string): string | null {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single && single.length > 0 ? single : null;
}

/** Ссылка на каталог с переключённым значением фильтра: повторный клик снимает его. */
export function buildFilterHref(params: SearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams();

  for (const filterKey of [...filterKeys, "price"]) {
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
```

---

## `frontend/components/ui/Reveal.tsx`
```tsx
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const easePremium: [number, number, number, number] = [0.16, 0.8, 0.24, 1];

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, ease: easePremium, delay }}
    >
      {children}
    </motion.div>
  );
}
```

---

## `frontend/components/providers/MotionProvider.tsx`
```tsx
"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```

---

## `docs/GRAPHICS.md`
```md
# Графическое наполнение сайта «Сады Наследия»

Визуальный язык — «Тёмный престиж» в зелёной гамме: глубокий зелёный фон, металлическое золото, стеклянные поверхности. Документ описывает, какая графика нужна сайту, в каком виде и что предстоит снять или отрисовать.

## 1. Логотип и эмблема

### Что уже есть

- `frontend/public/brand/logo-source.png` — исходный логотип на бежевом фоне. Для тёмного сайта не годится: бежевая подложка вырежет прямоугольник на фоне.
- `frontend/components/brand/Emblem.tsx` — векторная эмблема в металлическом золоте: кольца, надпись «МЕЛИХОВЪ» по дуге, монограмма и лиственная веточка. Используется в навигации, подвале и как крупный водяной знак в герое.

### Что нужно от дизайнера

- Оригинал логотипа в **SVG** с разделёнными слоями: монограмма, дуговая надпись, растительный орнамент.
- Три версии: полная (эмблема + название), только эмблема, горизонтальная для узких мест.
- Монохромные варианты: золото, белый, тёмно-зелёный.
- Favicon 32×32 и 180×180, где читается только монограмма — мелкие детали в иконке пропадут.

Как только появится настоящий SVG, он заменит содержимое `Emblem.tsx`, а градиенты и анимация парения останутся прежними.

## 2. Фотография

### Обработка

Все фото на тёмном фоне идут в три слоя, как в исходном визуальном языке:

1. Размытая копия фоном: `blur(20–24px) saturate(125%) brightness(.76)`, увеличение 1.1
2. Виньетка сверху: тёмно-зелёный градиент снизу вверх
3. Основной кадр: `object-fit: contain`, внутренние отступы, мягкая тень

Это позволяет использовать кадры с разным светом и кадрированием, не ломая композицию карточек.

### Что снимать

Съёмку удобно разделить на четыре группы.

**Каталог, главное.** Саженец целиком на однотонном фоне: ствол, крона, корневая система, бирка с сортом. По кадру на каждую культуру минимум, в идеале — на каждый сорт. Именно эти фото продают.

**Детали.** Место прививки, почки, срез подвоя, корневой ком, паспорт сортности в руке. Такие макро-кадры закрывают блок «Паспорт сортности» и карточку сорта.

**Питомник.** Ряды маточника, поле в утреннем свете, теплицы, техника, работа с посадочным материалом. Нужны для страницы «О питомнике» и фоновых блоков.

**Люди.** Портреты агронома и основателя, работа в саду, передача саженцев покупателю. Круг 120×120 для карточек команды, горизонтальные кадры для блоков доверия.

**Плоды.** Урожай по культурам — яблоки, груши, вишня, слива, смородина. Идут в плитки категорий и в сезонные баннеры.

### Требования к файлам

- Исходники не менее 2400px по длинной стороне, без агрессивной ретуши и фильтров
- На сайт — WebP, ширина 1600px для героя, 800px для карточек
- Ориентация: для карточек каталога вертикальная, для секций горизонтальная
- Каждое фото загружается в медиатеку WordPress с осмысленным alt-текстом

## 3. Иллюстрации

Пока фотографий нет, а также там, где фото избыточно, работает **ботаническая линейная графика**: тонкие золотые контуры на тёмном фоне.

Нужен набор из десяти иконок-культур в едином стиле: яблоня, груша, вишня, черешня, слива, персик, абрикос, смородина, крыжовник, малина. Каждая — силуэт ветви с листом и плодом, обводка 1–1.5px, без заливки, в формате SVG 48×48 и 96×96.

Такой набор решает сразу три задачи: оживляет плитки категорий, служит подложкой для карточек без фото и даёт узнаваемый декор для внутренних страниц.

Дополнительно пригодятся два декоративных элемента: горизонтальная растительная виньетка-разделитель для секций и угловой орнамент из логотипа для стеклянных панелей.

## 4. Фон и текстуры

- **Герой.** Анимированная сеть ветвей на canvas: золотые кривые с пульсирующими почками (`OrchardCanvas.tsx`). На мобильных и при отключённой анимации упрощается автоматически.
- **Страница.** Многослойные радиальные градиенты зелёного с золотым подсветом, зафиксированы относительно окна.
- **Видео.** Опциональный слой в герое: положите ролик в `frontend/public/media/hero.mp4`, он подхватится сам и уйдёт под затемнение. Нужен короткий цикл 8–12 секунд, спокойное движение камеры по саду, без резких склеек. Вес до 6 МБ.
- **Шум.** Тонкая зернистость поверх фона убирает полосатость градиентов на больших экранах. Добавляется как PNG-тайл 128×128 с прозрачностью около 3%.

## 5. Иконки интерфейса

Lucide React, обводка 1–1.2px, размер 26–27px. Металлический градиент подключается через общий градиент: `stroke="url(#goldStroke)"`. Определения лежат в `components/brand/GoldDefs.tsx` и рендерятся один раз в layout.

Плоская заливка иконок золотом запрещена — только градиент, иначе теряется ощущение металла.

## 6. Заглушки

Карточка без фотографии не должна выглядеть сломанной. Заглушка — зелёный градиент `#173a24 → #0b1f14` с золотым радиальным свечением и полупрозрачной эмблемой 48px в центре при непрозрачности около 58%.

## 7. Изображения для соцсетей

- OG-картинка 1200×630: эмблема, название, короткий слоган на тёмно-зелёном градиенте с золотой рамкой
- Отдельные OG для каталога, услуг и страницы «О питомнике» — с соответствующим фото и той же типографикой
- Формируются генератором Next.js, чтобы не рисовать вручную под каждую страницу

## 8. Соглашения по файлам

```
frontend/public/
  brand/          логотип, эмблема, favicon
  media/          видео героя
  cultures/       линейные иконки культур
  textures/       шум и декоративные элементы
```

Фотографии контента живут в медиатеке WordPress, а не в репозитории: их подбирает и меняет редактор.

Именование: `culture-apple.svg`, `hero.mp4`, `noise.png` — латиница, нижний регистр, дефисы.

## 9. Приоритет работ

Сначала — то, без чего сайт выглядит незаполненным: набор иконок культур и десять фотографий саженцев по культурам. Затем видео героя и портреты. Фотографии сортов добавляются по мере наполнения каталога и не блокируют запуск.
```

---
