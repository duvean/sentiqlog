# Сенти

PWA‑дневник эмоций на React, TypeScript, Vite и Dexie. Все записи и имя хранятся в IndexedDB устройства: приложение не требует сервера и продолжает работать без сети после первого открытия.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте адрес, который покажет Vite — по умолчанию это `http://127.0.0.1:5173/`.

## Cloudflare Pages

Подключите Git‑репозиторий в Cloudflare Pages и укажите:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js:** 20 или новее

Vite PWA генерирует service worker и web manifest в `dist` при каждой production‑сборке. После первой загрузки Cloudflare Pages приложение ставится на домашний экран Android/iOS и открывается офлайн.
