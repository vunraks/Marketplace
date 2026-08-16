# VaultTrade

VaultTrade - маркетплейс цифровых товаров и услуг с личным кабинетом продавца, заказами, чатами, отзывами, избранным, спорами, промокодами и виртуальной валютой.

Проект состоит из backend на **ASP.NET Core 10** и frontend на **React + Vite + Material UI**.

## Возможности

- Регистрация и вход по email/password.
- Вход через Google аккаунт.
- Каталог объявлений с карточками товаров, категориями, поиском и фильтрами.
- Создание, редактирование и архивирование объявлений продавцом.
- Загрузка изображений товара и просмотр галереи в карточке товара.
- Покупка без моментального списания: баланс списывается после подтверждения товара.
- Чат покупателя и продавца.
- Уведомления в реальном времени через SignalR.
- Отзывы продавцам, видимые всем пользователям.
- Избранные товары.
- Панель продавца.
- Споры по заказам.
- Админ-панель пользователей, ролей, баланса, блокировок и модерации.
- Модератор может одобрять и отклонять объявления.
- Промокоды: админ создает код, пользователь вводит и получает виртуальную валюту.
- Публичный профиль продавца со стеной.

## Технологии

**Backend**

- ASP.NET Core 10
- Entity Framework Core
- PostgreSQL
- Npgsql
- JWT authentication
- SignalR
- Clean Architecture

**Frontend**

- React 19
- TypeScript
- Vite
- Material UI
- Redux Toolkit
- Axios
- SignalR client

## Структура проекта

```text
src/
  VaultTrade.API/             Controllers, hubs, middleware, Program.cs
  VaultTrade.Application/     Services, DTOs, validators, mapping
  VaultTrade.Domain/          Entities, enums, constants
  VaultTrade.Infrastructure/  DbContext, repositories, auth, storage

frontend/
  src/
    api/                      API clients
    components/               Shared UI
    pages/                    App pages
    routes/                   Routing
    store/                    Redux state

tests/
  VaultTrade.Tests/
```

## Требования

- .NET 10 SDK
- Node.js 20+
- PostgreSQL 16+ или Docker
- Git

## Быстрый запуск локально

### 1. Запуск PostgreSQL

```powershell
docker compose up postgres -d
```

По умолчанию в `docker-compose.yml` используется база:

```text
Host=localhost;Port=5432;Database=Market;Username=postgres;Password=0103
```

### 2. Запуск backend

```powershell
cd src/VaultTrade.API
dotnet run
```

Backend будет доступен на:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

В режиме Development доступен Swagger:

```text
http://localhost:5000/swagger
```

Миграции применяются автоматически при запуске через `DbSeeder`.

### 3. Запуск frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend будет доступен на:

```text
http://localhost:5173
```

## Переменные окружения backend

Для локального запуска можно использовать `appsettings.Development.json`, user-secrets или переменные окружения.

Пример для PowerShell:

```powershell
$env:ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=Market;Username=postgres;Password=0103"
$env:Jwt__Secret="VaultTrade-Super-Secret-Key-Min-32-Chars-For-Development!"
$env:Jwt__Issuer="VaultTrade"
$env:Jwt__Audience="VaultTrade.Web"
$env:Authentication__Google__ClientId="your-google-client-id.apps.googleusercontent.com"
$env:Cors__Origins__0="http://localhost:5173"
```

Для Render лучше использовать `DATABASE_URL`:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Backend умеет читать оба формата:

- `DATABASE_URL`
- `POSTGRES_URL`
- `ConnectionStrings__DefaultConnection`

## Переменные окружения frontend

Для Vercel или локального `.env`:

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Если `VITE_API_URL` не указан, production frontend использует URL из `frontend/src/config/api.ts`.

## Google OAuth

В Google Cloud Console для OAuth client нужно добавить JavaScript origins:

```text
http://localhost:5173
https://your-frontend.vercel.app
```

Client ID должен быть одинаковым:

- в backend: `Authentication__Google__ClientId`
- в frontend: `VITE_GOOGLE_CLIENT_ID`

## Деплой backend на Render

Проект уже содержит `Dockerfile` и `render.yaml`.

Основные переменные для Render Web Service:

```text
ASPNETCORE_ENVIRONMENT=Production
PORT=8080
DATABASE_URL=External Database URL из Render PostgreSQL
Jwt__Secret=длинный_секрет_минимум_32_символа
Jwt__Issuer=VaultTrade
Jwt__Audience=VaultTrade.Web
Authentication__Google__ClientId=your-google-client-id.apps.googleusercontent.com
Cors__Origins__0=https://your-frontend.vercel.app
DOTNET_EnableDiagnostics=0
DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
```

Важно: если база Render создается отдельно, вставляй именно **External Database URL** в `DATABASE_URL`. Старую переменную `ConnectionStrings__DefaultConnection` лучше удалить, чтобы backend не пытался подключаться к устаревшему `dpg-...` хосту.

## Деплой frontend на Vercel

Root Directory:

```text
frontend
```

Build Command:

```text
npm run build
```

Output Directory:

```text
dist
```

Environment Variables:

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

После изменения backend URL или Google Client ID нужно redeploy frontend.

## Seed данные

При первом запуске создаются роли, категории, админ и демо-объявления.

```text
Email: admin@vaulttrade.local
Password: Admin123!
Roles: Admin, Seller, User
```

После деплоя лучше сменить пароль администратора и `Jwt__Secret`.

## Основные страницы frontend

```text
/catalog              Каталог
/listing/:id          Страница товара и оформление заказа
/login                Вход
/register             Регистрация
/profile              Личный профиль
/seller/:username     Публичный профиль продавца
/my-listings          Мои товары
/my-listings/create   Создание объявления
/my-listings/:id/edit Редактирование объявления
/seller-dashboard     Панель продавца
/favorites            Избранное
/chats                Чаты
/disputes             Споры
/moderation           Модерация объявлений
/admin/users          Пользователи
/admin/promocodes     Промокоды
```

## Основные API endpoints

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/external/google
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/categories

GET    /api/v1/listings
GET    /api/v1/listings/{id}
POST   /api/v1/listings
PUT    /api/v1/listings/{id}
DELETE /api/v1/listings/{id}
POST   /api/v1/listings/{id}/images

GET    /api/v1/orders
POST   /api/v1/orders
POST   /api/v1/orders/{id}/confirm

GET    /api/v1/conversations
POST   /api/v1/conversations

GET    /api/v1/favorites
POST   /api/v1/favorites/{listingId}
DELETE /api/v1/favorites/{listingId}

GET    /api/v1/disputes
POST   /api/v1/disputes

GET    /api/v1/notifications
POST   /api/v1/notifications/{id}/read

GET    /api/v1/users/me
GET    /api/v1/users/admin

GET    /api/v1/profile-posts/users/{username}
POST   /api/v1/profile-posts/users/{username}

GET    /api/v1/promo-codes
POST   /api/v1/promo-codes
POST   /api/v1/promo-codes/redeem
```

## SignalR hubs

```text
/hubs/chat
/hubs/notifications
```

Frontend подключается к notifications hub через URL backend origin.

## Работа с миграциями

Создать новую миграцию:

```powershell
dotnet ef migrations add MigrationName -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

Применить миграции вручную:

```powershell
dotnet ef database update -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

Обычно вручную применять не нужно: при старте backend вызывает `DbSeeder.SeedAsync`, который применяет миграции автоматически.

## Проверка перед коммитом

Backend:

```powershell
dotnet build
dotnet test
```

Frontend:

```powershell
cd frontend
npm run build
```

Сейчас в проекте может появляться предупреждение `NU1903` про `AutoMapper 12.0.1`. Это предупреждение безопасности пакета, не ошибка сборки.

## Важные заметки

- Не коммить `.env`, пароли баз, JWT secrets и Google client secrets.
- Render free PostgreSQL может истечь. Если база истекла, создай новую и обнови `DATABASE_URL`.
- Файлы, загруженные в локальное хранилище контейнера Render, не являются постоянными. Для production лучше подключить внешнее хранилище изображений.
- После изменения CORS origin на backend нужно redeploy Render service.
