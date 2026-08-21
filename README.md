# VaultTrade

VaultTrade - учебный маркетплейс цифровых товаров и услуг: игровые аккаунты, ключи, подписки, предметы, софт и цифровые услуги. Проект показывает полный путь от регистрации пользователя до покупки товара, общения с продавцом, подтверждения заказа, отзывов, споров и администрирования платформы.

Главная идея проекта: покупатель не теряет виртуальную валюту сразу после нажатия "Купить". Сначала создается заказ, товар резервируется, покупатель проверяет полученный товар и только после подтверждения баланс списывается у покупателя и начисляется продавцу.

## Возможности

### Пользователи и вход

- Регистрация и вход по email и паролю.
- Вход через Google.
- Вход через Telegram OpenID Connect.
- JWT access token и refresh token.
- Восстановление пароля через email.
- Смена пароля в профиле.
- Для аккаунтов, созданных через Google/Telegram, кнопка смены пароля скрывается, если локального пароля нет.
- Публичный профиль пользователя и продавца.
- Редактирование имени, описания и аватара.
- Стена профиля: пользователь может публиковать записи у себя и писать на стене другого пользователя.

### Каталог и объявления

- Каталог цифровых товаров с поиском и фильтрами.
- Карточки товаров с анимациями и skeleton-загрузкой.
- Страница товара с описанием, рейтингом продавца, галереей изображений и отзывами.
- Переход в профиль продавца прямо со страницы товара.
- Избранное.
- CRUD объявлений: создание, редактирование, удаление и просмотр своих товаров.
- Количество товара/остаток на объявлении.
- Загрузка изображений продавцом.
- Вставка изображений через `Ctrl+V` при создании объявления.
- Мини-галерея выбранных изображений с возможностью удалить ошибочно выбранную картинку.
- Стоковая галерея изображений по категориям, если у продавца нет собственной картинки.
- Отдельная страница после создания объявления: товар отправлен на модерацию.

### Покупки и заказы

- Покупка за виртуальную валюту `VT`.
- Проверка баланса до покупки: если `VT` не хватает, заказ нельзя подтвердить.
- При покупке товар резервируется, но баланс не списывается моментально.
- После подтверждения покупателем `VT` списывается у покупателя и начисляется продавцу.
- Баланс обновляется в интерфейсе сразу после покупки, подтверждения заказа, промокода или изменения администратором.
- История заказов доступна приватно в меню пользователя.
- После завершенной покупки можно оставить отзыв продавцу.

### Чаты и поддержка

- Чат покупателя и продавца на странице товара.
- Чат открывается, когда покупатель пишет продавцу.
- Если продавец закрыл чат, при повторной покупке того же товара чат открывается заново.
- В сообщениях отображаются дата и время.
- Поле ввода поддерживает переносы строк.
- Продавец может закрыть чат по сделке.
- Чаты можно удалять только после закрытия.
- Отдельный мини-чат поддержки с админами и модераторами.
- Когда сотрудник поддержки отвечает пользователю, чат становится приватным между этим сотрудником и пользователем.
- После закрытия чата поддержки пользователь может создать новый чат.
- Админ или модератор может написать пользователю из панели пользователей.
- Звуковые и toast-уведомления о новых событиях.

### Уведомления в реальном времени

- SignalR/WebSocket для чатов и уведомлений.
- Живой dropdown уведомлений.
- Уведомления о сообщениях, заказах, спорах, модерации и поддержке.
- Если пользователь уже находится в нужном чате, всплывающее уведомление о новом сообщении не мешает чтению.

### Споры

- Покупатель может открыть спор по заказу.
- Продавец может открыть спор, если считает, что валюта по сделке не пришла.
- Админ и модератор видят споры и могут разбирать конфликтные ситуации.
- Споры связаны с заказами.

### Админка и модерация

- Админ видит всех пользователей.
- Модератор может видеть пользователей и писать им, но не имеет полных админских прав.
- Админ может назначать роли `User`, `Seller`, `Moderator`, `Admin`.
- Админ может менять баланс пользователей.
- Админ может создавать промокоды.
- Админ и модератор могут одобрять или отклонять объявления.
- Админ может ограничивать пользователей, продавцов и модераторов на время.
- Ограниченный пользователь может только просматривать объявления.
- В публичном профиле показывается статус "Ограничен до", но причина ограничения остается приватной.
- При входе в ограниченный аккаунт показывается окно с причиной и сроком ограничения.

### Промокоды и валюта

- Внутренняя валюта сайта `VT`.
- Админ создает промокоды.
- Пользователь вводит промокод и получает бонусный баланс.
- Баланс отображается в шапке и профиле.

### Интерфейс

- Темный современный дизайн маркетплейса.
- Анимированный фон на страницах входа и регистрации.
- Красивые кнопки быстрого входа через Google и Telegram.
- Многоязычная поддержка: русский, английский, казахский и польский.
- Адаптивная верстка.
- Toast-уведомления, skeleton-загрузки, анимации карточек.

## Роли

| Роль | Возможности |
| --- | --- |
| `User` | Покупки, чаты, поддержка, избранное, отзывы, история заказов, промокоды |
| `Seller` | Создание и управление объявлениями, общение с покупателями, получение заказов, споры по выплатам |
| `Moderator` | Модерация объявлений, просмотр пользователей, связь с пользователями, работа с поддержкой и спорами |
| `Admin` | Полное управление пользователями, ролями, балансами, промокодами, ограничениями, модерацией и спорами |

## Технологический стек

### Backend

| Технология | Назначение |
| --- | --- |
| ASP.NET Core / .NET 10 | Backend API |
| Entity Framework Core | ORM и работа с PostgreSQL |
| PostgreSQL | Основная база данных |
| Npgsql | Провайдер PostgreSQL для .NET |
| JWT | Авторизация |
| Google OAuth | Вход через Google |
| Telegram OpenID Connect | Вход через Telegram |
| SignalR | Real-time чаты и уведомления |
| Docker | Контейнеризация backend |
| Clean Architecture | Разделение API, Application, Domain и Infrastructure |

### Frontend

| Технология | Назначение |
| --- | --- |
| React 19 | Пользовательский интерфейс |
| TypeScript | Типизация frontend-кода |
| Vite | Сборка и dev-сервер |
| Material UI | UI-компоненты |
| Redux Toolkit | Глобальное состояние |
| Axios | HTTP-запросы к API |
| SignalR Client | Подключение к real-time событиям |
| SCSS | Дополнительная стилизация |
| Zod + React Hook Form | Валидация и формы |

### Инфраструктура

| Сервис | Назначение |
| --- | --- |
| Render | Деплой backend |
| Render PostgreSQL | База данных |
| Vercel | Деплой frontend |
| Brevo SMTP | Отправка писем восстановления пароля |
| Google Cloud Console | Google OAuth Client ID |
| BotFather / Telegram | Telegram OpenID Connect |

## Архитектура

```text
src/
  VaultTrade.API/
    Controllers/        HTTP endpoints
    Hubs/               SignalR hubs
    Middlewares/        Ограничения аккаунтов и обработка запросов
    Program.cs          Startup, DI, CORS, auth, hubs

  VaultTrade.Application/
    Services/           Бизнес-логика
    DTOs/               Request/response models
    Mapping/            AutoMapper profiles
    Interfaces/         Контракты сервисов

  VaultTrade.Domain/
    Entities/           Сущности базы данных
    Enums/              Статусы заказов, объявлений, споров
    Constants/          Названия ролей

  VaultTrade.Infrastructure/
    Data/               AppDbContext, migrations, seed data
    Configurations/     EF Core configurations
    Services/           Email, auth validators, storage, seed

frontend/
  src/
    api/                API-клиенты
    components/         Переиспользуемые компоненты
    i18n/               Переводы и переключение языка
    pages/              Страницы приложения
    realtime/           SignalR client
    routes/             React routes
    store/              Redux state
    styles/             SCSS
```

## Основные сценарии

### Создание объявления

1. Продавец открывает `/my-listings/create`.
2. Заполняет категорию, название, описание, цену и количество.
3. Загружает изображения, вставляет картинку через `Ctrl+V` или выбирает стоковую обложку.
4. Frontend отправляет данные на `POST /api/v1/listings`.
5. Если есть изображения, они загружаются через `POST /api/v1/listings/{id}/images` или как stock image URL.
6. Объявление отправляется на модерацию.
7. После одобрения объявление появляется в каталоге.

### Покупка товара

1. Покупатель открывает товар.
2. При необходимости пишет продавцу.
3. Нажимает кнопку покупки.
4. Создается заказ, а количество товара резервируется.
5. Покупатель проверяет товар.
6. После подтверждения заказа списывается `VT`.
7. Продавцу начисляется `VT`.
8. Покупатель может оставить отзыв.

### Real-time события

1. После входа frontend подключается к SignalR hubs.
2. Backend отправляет событие о новом сообщении, заказе, споре или модерации.
3. Frontend обновляет dropdown, показывает toast и проигрывает звук уведомления.
4. Если пользователь уже находится в активном чате, всплывающее уведомление не появляется.

## Основные страницы

| Страница | Назначение |
| --- | --- |
| `/` | Главная |
| `/catalog` | Каталог |
| `/listing/:id` | Страница товара и оформление заказа |
| `/seller/:username` | Публичный профиль продавца/пользователя |
| `/login` | Вход |
| `/register` | Регистрация |
| `/forgot-password` | Восстановление пароля |
| `/reset-password` | Сброс пароля |
| `/auth/telegram/callback` | Callback Telegram OpenID |
| `/profile` | Личный профиль |
| `/become-seller` | Стать продавцом |
| `/chats` | Чаты |
| `/favorites` | Избранное |
| `/orders` | История заказов |
| `/disputes` | Споры |
| `/seller-dashboard` | Панель продавца |
| `/my-listings` | Мои товары |
| `/my-listings/create` | Создание объявления |
| `/my-listings/submitted/:id` | Объявление отправлено на модерацию |
| `/my-listings/:id/edit` | Редактирование объявления |
| `/moderation` | Модерация объявлений |
| `/admin/users` | Пользователи |
| `/admin/promocodes` | Промокоды |

## API endpoints

```text
Auth:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/external/google
POST   /api/v1/auth/external/telegram/oidc
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

Users:
GET    /api/v1/users/me
PUT    /api/v1/users/me
PUT    /api/v1/users/me/password
POST   /api/v1/users/me/avatar
POST   /api/v1/users/me/become-seller
GET    /api/v1/users/{username}
GET    /api/v1/users/admin
PUT    /api/v1/users/admin/{id}/roles
POST   /api/v1/users/admin/{id}/balance
PUT    /api/v1/users/admin/{id}/block

Listings:
GET    /api/v1/listings
GET    /api/v1/listings/search
GET    /api/v1/listings/{id}
GET    /api/v1/listings/my
POST   /api/v1/listings
PUT    /api/v1/listings/{id}
DELETE /api/v1/listings/{id}
POST   /api/v1/listings/{id}/images
POST   /api/v1/listings/{id}/image-urls

Orders:
POST   /api/v1/orders
POST   /api/v1/orders/{id}/confirm
GET    /api/v1/orders/{id}
GET    /api/v1/orders/mine
GET    /api/v1/orders/listings/{listingId}/active

Conversations:
GET    /api/v1/conversations
GET    /api/v1/conversations/support
GET    /api/v1/conversations/listings/{listingId}
POST   /api/v1/conversations/{conversationId}/messages
POST   /api/v1/conversations/listings/{listingId}/messages
POST   /api/v1/conversations/support/messages
POST   /api/v1/conversations/users/{targetUserId}/messages
POST   /api/v1/conversations/{conversationId}/close
DELETE /api/v1/conversations/{conversationId}

Favorites:
GET    /api/v1/favorites
POST   /api/v1/favorites/{listingId}
DELETE /api/v1/favorites/{listingId}

Reviews:
GET    /api/v1/reviews/sellers/{sellerId}
POST   /api/v1/reviews/orders/{orderId}

Disputes:
GET    /api/v1/disputes/mine
GET    /api/v1/disputes/admin
POST   /api/v1/disputes
PUT    /api/v1/disputes/{id}/resolve

Notifications:
GET    /api/v1/notifications
POST   /api/v1/notifications/mark-read

Promo codes:
GET    /api/v1/promocodes
POST   /api/v1/promocodes
POST   /api/v1/promocodes/redeem
```

## SignalR hubs

```text
/hubs/chat
/hubs/notifications
```

- `/hubs/chat` - сообщения между покупателем, продавцом и поддержкой.
- `/hubs/notifications` - уведомления о сообщениях, заказах, спорах, модерации и поддержке.

## Локальный запуск

### Требования

- .NET 10 SDK
- Node.js 20+
- PostgreSQL 16+ или Docker
- Git

### PostgreSQL

```powershell
docker compose up postgres -d
```

Строка подключения по умолчанию:

```text
Host=localhost;Port=5432;Database=Market;Username=postgres;Password=0103
```

### Backend

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

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Переменные окружения

### Backend

```text
ASPNETCORE_ENVIRONMENT=Production
PORT=8080
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
Jwt__Secret=long_secret_minimum_32_characters
Jwt__Issuer=VaultTrade
Jwt__Audience=VaultTrade.Web
Cors__Origins__0=https://your-frontend.vercel.app
Frontend__BaseUrl=https://your-frontend.vercel.app
Authentication__Google__ClientId=your-google-client-id.apps.googleusercontent.com
Authentication__Telegram__BotToken=your-telegram-bot-token
Authentication__Telegram__BotUsername=YourTelegramBot
DOTNET_EnableDiagnostics=0
DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
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

### Frontend

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_TELEGRAM_CLIENT_ID=your-telegram-client-id
```

После изменения `VITE_*` на Vercel нужен redeploy frontend.

## Деплой

### Render backend

Проект содержит `Dockerfile` и `render.yaml`.

Для Render Web Service:

```text
Root Directory: .
Environment: Docker
PORT=8080
DATABASE_URL=External Database URL from Render PostgreSQL
```

Важно: если база Render создается отдельно, в `DATABASE_URL` нужно вставлять именно External Database URL.

### Vercel frontend

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

## Seed данные

При первом запуске создаются роли, категории, администратор и демо-объявления.

```text
Email: admin@vaulttrade.local
Password: Admin123!
Roles: Admin, Seller, User
```

После деплоя рекомендуется сменить пароль администратора и `Jwt__Secret`.

## Миграции

Создать миграцию:

```powershell
dotnet ef migrations add MigrationName -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

Применить миграции:

```powershell
dotnet ef database update -p src/VaultTrade.Infrastructure -s src/VaultTrade.API
```

При старте backend вызывается `DbSeeder.SeedAsync`, который автоматически применяет миграции.

## Проверка

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
