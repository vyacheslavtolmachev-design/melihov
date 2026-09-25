# Frontend — «Сады Наследия»

Витрина Next.js. Память проекта и договорённости — в корневом [`AGENTS.md`](../AGENTS.md), графика — [`docs/GRAPHICS.md`](../docs/GRAPHICS.md).

```bash
# Dev (из корня репозитория)
docker compose up -d

# Prod на этом сервере — без бинд-маунта, после правок нужна пересборка:
docker compose -f docker-compose.prod.yml up -d --build frontend
```

Сайт: `http://localhost:3000`
