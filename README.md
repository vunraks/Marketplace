# VaultTrade

**VaultTrade** - полнофункциональный маркетплейс цифровых товаров и услуг.  
Проект имитирует современную торговую площадку, где пользователи могут продавать и покупать аккаунты, ключи, подписки, игровые предметы и цифровые услуги через внутреннюю виртуальную валюту `VT`.

Платформа включает каталог товаров, оформление заказов, чаты между покупателем и продавцом, отзывы, избранное, публичные профили, промокоды, споры, панель продавца, модерацию и админ-панель.

## Кратко о проекте

VaultTrade решает задачу безопасной покупки цифрового товара внутри маркетплейса. Покупатель не просто нажимает кнопку "Купить", а проходит полноценный сценарий:

1. Находит товар в каталоге.
2. Открывает страницу товара.
3. При необходимости пишет продавцу.
4. Оформляет заказ.
5. Проверяет полученный товар.
6. Подтверждает заказ.
7. Только после подтверждения происходит списание виртуальной валюты.
8. После завершения сделки покупатель может оставить отзыв продавцу.

Такой подход похож на механику безопасной сделки: продавец получает оплату только после того, как покупатель подтвердил получение товара.

## Основные возможности сайта

### Пользователи и авторизация

- Регистрация по email и паролю.
- Вход по email и паролю.
- Вход через Google аккаунт.
- JWT-авторизация.
- Обновление access token через refresh token.
- Выход из аккаунта.
- Восстановление пароля через email.
- Смена пароля в профиле.
- Для Google-аккаунтов кнопка смены пароля скрывается, потому что пароль управляется через Google.
- Защита приватных страниц от неавторизованных пользователей.

### Каталог и объявления

- Главная страница с современным темным дизайном.
- Каталог цифровых товаров.
- Поиск по объявлениям.
- Фильтрация по категориям, цене, статусу и другим параметрам.
- Карточки товаров с анимациями.
- Skeleton-загрузки во время получения данных.
- Страница товара с подробным описанием.
- Просмотр продавца прямо со страницы товара.
- Изображения товара.
- Галерея изображений.
- Увеличение изображения при клике.
- Добавление товара в избранное.

### Продавец

- Возможность стать продавцом.
- Создание объявлений.
- Редактирование объявлений.
- Удаление объявлений.
- Загрузка изображений к товару.
- Указание количества товара.
- Просмотр своих товаров.
- Панель продавца.
- Управление заказами.
- Получение уведомлений о новых покупках и сообщениях.
- Возможность закрывать чат по сделке.

### Покупка и заказы

- Покупка товара за виртуальную валюту `VT`.
- Баланс не списывается сразу при нажатии "Купить".
- Количество товара корректно резервируется.
- После подтверждения товара покупателем баланс списывается у покупателя и начисляется продавцу.
- Если страница перезагружается во время покупки, заказ не должен пропадать.
- История заказов доступна приватно в меню пользователя.
- После завершения заказа можно оставить отзыв.

### Чаты и уведомления

- Чат между покупателем и продавцом.
- Чат открывается, когда покупатель пишет продавцу.
- Сообщения поддерживают переносы строк.
- В сообщениях отображаются дата и время.
- Продавец может закрыть чат.
- Если покупатель снова покупает тот же товар, чат автоматически открывается заново.
- Уведомления о сообщениях, заказах, спорах и модерации.
- Real-time обновления через SignalR.
- Живой dropdown уведомлений.
- Toast-уведомления без перезагрузки страницы.

### Отзывы, профили и стена

- Публичный профиль пользователя/продавца.
- Возможность перейти в профиль продавца из товара.
- Аватар пользователя.
- Редактирование профиля.
- Стена профиля.
- Возможность писать посты на стену.
- Отзывы продавцу после завершенной покупки.
- Отзывы видны другим пользователям.
- Отображение ролей и статуса пользователя.

### Виртуальная валюта и промокоды

- Внутренняя валюта сайта `VT`.
- Отображение баланса в интерфейсе.
- Мгновенное обновление баланса после покупки, подтверждения заказа, промокода или изменения администратором.
- Администратор может начислять или снимать `VT` у пользователей.
- Промокоды и бонусы.
- Администратор создает промокод.
- Пользователь вводит промокод и получает виртуальную валюту.

### Споры

- Пользователь может открыть спор по заказу.
- Споры вынесены в отдельный раздел.
- Администрация или модерация может разбирать конфликтные ситуации.
- Споры связаны с заказами.

### Админ-панель и модерация

- Просмотр всех пользователей.
- Переход в профиль пользователя из админ-панели.
- Управление ролями.
- Назначение модератора.
- Назначение продавца.
- Управление балансом пользователей.
- Блокировка пользователей или продавцов.
- Временное ограничение продавца.
- Создание промокодов.
- Модерация объявлений.
- Одобрение объявлений.
- Отклонение объявлений.

### Многоязычность и интерфейс

- Поддержка русского, английского, казахского и польского языков.
- Перевод основных страниц: каталог, профиль, фильтры, создание объявления, вход, регистрация и другие разделы.
- Переключение языка в интерфейсе.
- Темный современный дизайн.
- Анимации карточек.
- Toast-уведомления.
- Skeleton-загрузки.
- Адаптивная верстка.

## Роли в системе

| Роль | Возможности |
| --- | --- |
| `User` | Покупка товаров, чаты, отзывы, избранное, история заказов, промокоды |
| `Seller` | Создание и управление объявлениями, общение с покупателями, получение заказов |
| `Moderator` | Проверка, одобрение и отклонение объявлений |
| `Admin` | Полное управление пользователями, ролями, балансами, промокодами, блокировками и модерацией |

## Технологический стек

### Backend

| Технология | Для чего используется |
| --- | --- |
| ASP.NET Core / .NET 10 | Backend API |
| Entity Framework Core | Работа с базой данных через ORM |
| PostgreSQL | Основная база данных |
| Npgsql | Провайдер PostgreSQL для .NET |
| JWT | Авторизация пользователей |
| Google OAuth | Вход через Google аккаунт |
| SignalR | Real-time чаты и уведомления |
| Docker | Контейнеризация backend |
| Clean Architecture | Разделение проекта на слои |

### Frontend

| Технология | Для чего используется |
| --- | --- |
| React 19 | Пользовательский интерфейс |
| TypeScript | Типизация frontend-кода |
| Vite | Сборка и dev-сервер |
| Material UI | UI-компоненты |
| Redux Toolkit | Глобальное состояние |
| Axios | HTTP-запросы к API |
| SignalR Client | Подключение к real-time уведомлениям |
| SCSS | Стилизация интерфейса |

### Инфраструктура

| Сервис | Назначение |
| --- | --- |
| Render | Деплой backend |
| Render PostgreSQL | База данных |
| Vercel | Деплой frontend |
| Brevo SMTP | Отправка писем для восстановления пароля |
| Google Cloud Console | OAuth Client ID для входа через Google |

## Архитектура проекта

Проект разделен на несколько слоев. Это помогает не смешивать API, бизнес-логику, сущности базы данных и инфраструктуру.

```text
src/
  VaultTrade.API/
    Controllers/        HTTP endpoints
    Hubs/               SignalR hubs
    Middleware/         Middleware
    Program.cs          Startup and DI configuration

  VaultTrade.Application/
    Services/           Business logic
    DTOs/               Request/response models
    Mapping/            AutoMapper profiles
    Interfaces/         Service contracts

  VaultTrade.Domain/
    Entities/           Database entities
    Enums/              Statuses and enum values
    Constants/          Role names and constants

  VaultTrade.Infrastructure/
    Data/               AppDbContext, migrations, seed data
    Configurations/     EF Core entity configurations
    Services/           Infrastructure services

frontend/
  src/
    api/                API clients
    components/         Reusable UI components
    i18n/               Translations and language provider
    pages/              Application pages
    realtime/           SignalR clients
    routes/             React routes
    store/              Redux state
    styles/             SCSS styles
```

## Как работает основной сценарий

### Создание объявления

1. Продавец открывает страницу создания товара.
2. Frontend отправляет данные на `POST /api/v1/listings`.
3. `ListingsController` принимает запрос.
4. `ListingService` проверяет права продавца, блокировку и корректность данных.
5. Entity Framework сохраняет объявление в PostgreSQL.
6. Объявление попадает на модерацию или становится доступным в зависимости от статуса.

### Покупка товара

1. Покупатель открывает страницу товара.
2. Нажимает кнопку покупки.
3. Создается заказ.
4. Товар резервируется.
5. Покупатель проверяет товар.
6. После подтверждения заказа списывается `VT`.
7. Продавцу начисляется `VT`.
8. Покупатель может оставить отзыв.

### Real-time уведомления

1. Пользователь авторизуется.
2. Frontend подключается к SignalR hub.
3. Backend отправляет событие при новом сообщении, заказе, споре или модерации.
4. Frontend показывает toast и обновляет dropdown уведомлений.

## Основные страницы

| Страница | Назначение |
| --- | --- |
| `/` | Главная страница |
| `/catalog` | Каталог товаров |
| `/listing/:id` | Страница товара и оформление заказа |
| `/login` | Вход |
| `/register` | Регистрация |
| `/forgot-password` | Восстановление пароля |
| `/reset-password` | Сброс пароля |
| `/profile` | Личный профиль |
| `/seller/:username` | Публичный профиль продавца |
| `/my-listings` | Мои товары |
| `/my-listings/create` | Создание объявления |
| `/my-listings/:id/edit` | Редактирование объявления |
| `/seller-dashboard` | Панель продавца |
| `/favorites` | Избранное |
| `/chats` | Чаты |
| `/orders` | История заказов |
| `/disputes` | Споры |
| `/moderation` | Модерация объявлений |
| `/admin/users` | Управление пользователями |
| `/admin/promocodes` | Управление промокодами |

## Основные API endpoints

```text
Auth:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/external/google
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

Listings:
GET    /api/v1/listings
GET    /api/v1/listings/{id}
POST   /api/v1/listings
PUT    /api/v1/listings/{id}
DELETE /api/v1/listings/{id}
POST   /api/v1/listings/{id}/images

Orders:
GET    /api/v1/orders
POST   /api/v1/orders
POST   /api/v1/orders/{id}/confirm

Chats:
GET    /api/v1/conversations
POST   /api/v1/conversations

Favorites:
GET    /api/v1/favorites
POST   /api/v1/favorites/{listingId}
DELETE /api/v1/favorites/{listingId}

Disputes:
GET    /api/v1/disputes
POST   /api/v1/disputes

Notifications:
GET    /api/v1/notifications
POST   /api/v1/notifications/{id}/read

Users:
GET    /api/v1/users/me
GET    /api/v1/users/admin

Profile posts:
GET    /api/v1/profile-posts/users/{username}
POST   /api/v1/profile-posts/users/{username}

Promo codes:
GET    /api/v1/promo-codes
POST   /api/v1/promo-codes
POST   /api/v1/promo-codes/redeem
```

## SignalR hubs

```text
/hubs/chat
/hubs/notifications
```

- `/hubs/chat` - сообщения между покупателем и продавцом.
- `/hubs/notifications` - уведомления о сообщениях, заказах, спорах и модерации.

## Требования для запуска

- .NET 10 SDK
- Node.js 20+
- PostgreSQL 16+ или Docker
- Git

## Локальный запуск

### 1. Запустить PostgreSQL

```powershell
docker compose up postgres -d
```

Строка подключения по умолчанию:

```text
Host=localhost;Port=5432;Database=Market;Username=postgres;Password=0103
```

### 2. Запустить backend

```powershell
cd src/VaultTrade.API
dotnet run
```

Backend:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/swagger
```

Health check:

```text
http://localhost:5000/health
```

### 3. Запустить frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Переменные окружения backend

Минимальный набор:

```text
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=Market;Username=postgres;Password=0103
Jwt__Secret=long_secret_minimum_32_characters
Jwt__Issuer=VaultTrade
Jwt__Audience=VaultTrade.Web
Cors__Origins__0=http://localhost:5173
Frontend__BaseUrl=http://localhost:5173
Authentication__Google__ClientId=your-google-client-id.apps.googleusercontent.com
```

Для Render можно использовать:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Для восстановления пароля через Brevo SMTP:

```text
Email__SmtpHost=smtp-relay.brevo.com
Email__Port=587
Email__Username=your-brevo-smtp-login
Email__Password=your-brevo-smtp-key
Email__FromEmail=your-verified-sender@email.com
Email__FromName=VaultTrade
Email__EnableSsl=true
```

## Переменные окружения frontend

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

После изменения переменных `VITE_*` на Vercel нужно сделать redeploy frontend.

## Google OAuth

В Google Cloud Console нужно добавить JavaScript origins:

```text
http://localhost:5173
https://your-frontend.vercel.app
```

Client ID должен совпадать:

- backend: `Authentication__Google__ClientId`
- frontend: `VITE_GOOGLE_CLIENT_ID`

## Деплой backend на Render

Проект содержит `Dockerfile` и `render.yaml`.

Основные переменные для Render Web Service:

```text
ASPNETCORE_ENVIRONMENT=Production
PORT=8080
DATABASE_URL=External Database URL from Render PostgreSQL
Jwt__Secret=long_secret_minimum_32_characters
Jwt__Issuer=VaultTrade
Jwt__Audience=VaultTrade.Web
Authentication__Google__ClientId=your-google-client-id.apps.googleusercontent.com
Cors__Origins__0=https://your-frontend.vercel.app
Frontend__BaseUrl=https://your-frontend.vercel.app
DOTNET_EnableDiagnostics=0
DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
```

Важно: если база Render создается отдельно, в `DATABASE_URL` нужно вставлять именно **External Database URL**.

## Деплой frontend на Vercel

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Environment Variables:

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Seed данные

При первом запуске создаются роли, категории, администратор и демо-объявления.

```text
Email: admin@vaulttrade.local
Password: Admin123!
Roles: Admin, Seller, User
```

После деплоя рекомендуется сменить пароль администратора и `Jwt__Secret`.

## Миграции базы данных

Создать миграцию:

```powershell
dotnet ef migrations add MigrationName -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

Применить миграции:

```powershell
dotnet ef database update -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

Обычно вручную применять миграции не нужно: при старте backend вызывает `DbSeeder.SeedAsync`, который применяет миграции автоматически.

## Проверка проекта

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

В проекте может появляться предупреждение `NU1903` про `AutoMapper 12.0.1`. Это предупреждение безопасности пакета, а не ошибка сборки.

## Что показать на защите

1. Главную страницу и общий дизайн.
2. Каталог, фильтры и поиск.
3. Страницу товара.
4. Картинки товара и увеличение изображения.
5. Переход в профиль продавца.
6. Чат с продавцом.
7. Покупку товара.
8. Подтверждение заказа.
9. Изменение баланса `VT`.
10. Отзыв продавцу.
11. Историю заказов.
12. Избранное.
13. Создание объявления продавцом.
14. Панель продавца.
15. Споры.
16. Уведомления в реальном времени.
17. Админ-панель пользователей.
18. Назначение ролей.
19. Промокоды.
20. Модерацию объявлений.

## Как коротко объяснить проект на защите

> VaultTrade - это маркетплейс цифровых товаров. Backend написан на ASP.NET Core / .NET 10, frontend - на React и TypeScript. В проекте есть регистрация, Google вход, роли пользователей, каталог товаров, создание объявлений, виртуальная валюта, заказы, чаты, отзывы, промокоды, споры, уведомления в реальном времени через SignalR и админ-панель. Данные хранятся в PostgreSQL, а для работы с базой используется Entity Framework Core.

## Важные заметки

- Не коммитить `.env`, пароли, SMTP ключи, JWT secrets и строки подключения.
- Render free PostgreSQL может истечь. Если база истекла, нужно создать новую и обновить `DATABASE_URL`.
- Файлы, загруженные в контейнер Render, не являются постоянным хранилищем. Для production лучше подключить внешнее хранилище изображений.
- После изменения CORS origin на backend нужно redeploy Render service.
- После изменения `VITE_API_URL` или `VITE_GOOGLE_CLIENT_ID` на Vercel нужно redeploy frontend.

