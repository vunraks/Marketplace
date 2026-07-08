# VaultTrade — Backend

Маркетплейс цифровых товаров. Backend на **ASP.NET Core 10** (Clean Architecture).

## Структура

```
src/
├── VaultTrade.API/           # Controllers, Hubs, Middlewares
├── VaultTrade.Application/   # Services, DTOs, Validators, Mapping
├── VaultTrade.Domain/        # Entities, Enums
└── VaultTrade.Infrastructure/# DbContext, Repositories, JWT, Storage
tests/
└── VaultTrade.Tests/
```

## Требования

- .NET 10 SDK
- PostgreSQL 16+ (или Docker)

## Быстрый старт

### 1. PostgreSQL через Docker

```bash
docker compose up postgres -d
```

### 2. Настройка пароля PostgreSQL

Ошибка `28P01` = неверный пароль пользователя `postgres`.

**Вариант A — User Secrets (рекомендуется):**

```powershell
cd src/VaultTrade.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=vaulttrade;Username=postgres;Password=ВАШ_ПАРОЛЬ"
```

**Вариант B — переменная окружения (на текущую сессию PowerShell):**

```powershell
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=vaulttrade;Username=postgres;Password=ВАШ_ПАРОЛЬ"
```

**Вариант C — файл `appsettings.Development.json`** (не коммитьте пароль в Git):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vaulttrade;Username=postgres;Password=ВАШ_ПАРОЛЬ"
  }
}
```

### 3. Создание базы (если ещё не создана)

```powershell
psql -U postgres -c "CREATE DATABASE vaulttrade;"
```

### 4. Запуск API

```bash
cd src/VaultTrade.API
dotnet run
```

API: `http://localhost:5000` (или порт из launchSettings)  
Swagger: `http://localhost:5000/swagger`

### 3. Полный стек Docker

```bash
docker compose up --build
```

## Учётные данные по умолчанию (seed)

| Поле | Значение |
|------|----------|
| Email | admin@vaulttrade.local |
| Password | Admin123! |
| Роли | Admin, User, Seller |

## API Endpoints (v1)

| Метод | URL | Auth |
|-------|-----|------|
| POST | /api/v1/auth/register | — |
| POST | /api/v1/auth/login | — |
| POST | /api/v1/auth/refresh | — |
| GET | /api/v1/users/me | JWT |
| GET | /api/v1/categories | — |
| GET | /api/v1/listings | — |
| POST | /api/v1/listings | Seller |
| GET | /api/v1/health | — |

## Миграции EF Core

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
dotnet ef database update -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

> При первом запуске миграции применяются автоматически через `DbSeeder`.

## Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Откройте: **http://localhost:5173**

Backend должен работать на **http://localhost:5000**.

### Страницы MVP

- `/` — главная
- `/catalog` — каталог с поиском и фильтрами
- `/listing/:id` — карточка товара
- `/login`, `/register` — авторизация
- `/profile` — профиль
- `/become-seller` — стать продавцом
- `/my-listings` — мои объявления (Seller)
- `/my-listings/create` — создать объявление
- `/seller/:username` — профиль продавца

