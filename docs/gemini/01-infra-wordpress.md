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
