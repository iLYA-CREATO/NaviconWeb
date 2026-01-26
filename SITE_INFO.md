# Информация о сайте NaviconWeb CRM

## Обзор проекта

NaviconWeb - это CRM-система (Customer Relationship Management) с frontend на React и backend на Node.js + Express + Prisma. Система предназначена для управления заявками (bids), клиентами, оборудованием и поставщиками в контексте сервисной компании (вероятно, для обслуживания автомобилей или оборудования).

### Структура проекта
- **Backend**: `CRM_base/backend/` - Node.js сервер с Express, Prisma ORM, PostgreSQL база данных
- **Frontend**: `CRM_base/frontend/` - React приложение с Vite, Tailwind CSS, React Router
- **База данных**: PostgreSQL с Prisma для миграций и схемы

## Backend

### Технологии и зависимости
- **Node.js** с **Express.js** для API сервера
- **Prisma** - ORM для работы с PostgreSQL
- **JWT** для аутентификации
- **bcryptjs** для хеширования паролей
- **CORS** для кросс-доменных запросов
- **Multer** для загрузки файлов
- **Node-cron** для планировщика задач

### Скрипты
- `npm start` - запуск сервера
- `npm run dev` - запуск с nodemon для разработки
- `npm test` - запуск тестов Jest
- `prisma:generate` - генерация Prisma клиента
- `prisma:migrate` - применение миграций
- `prisma:studio` - запуск Prisma Studio

### API маршруты

#### Аутентификация (`/api/auth`)
- `POST /login` - вход в систему
- `POST /register` - регистрация пользователя
- `GET /me` - получение данных текущего пользователя

#### Заявки (Bids) (`/api/bids`)
- `GET /` - получение всех заявок
- `GET /:id` - получение заявки по ID
- `POST /` - создание новой заявки
- `PUT /:id` - обновление заявки
- `DELETE /:id` - удаление заявки
- `GET /:id/comments` - комментарии к заявке
- `POST /:id/comments` - добавление комментария
- `PUT /:id/comments/:commentId` - обновление комментария
- `DELETE /:id/comments/:commentId` - удаление комментария
- `GET /:id/specifications` - спецификации заявки
- `POST /:id/specifications` - добавление спецификации
- `PUT /:id/specifications/:specId` - обновление спецификации
- `DELETE /:id/specifications/:specId` - удаление спецификации
- `GET /:id/history` - история изменений заявки

#### Клиенты (`/api/clients`)
- `GET /` - получение всех клиентов
- `GET /:id` - получение клиента по ID
- `POST /` - создание клиента
- `PUT /:id` - обновление клиента
- `DELETE /:id` - удаление клиента
- `POST /bulk-upload` - массовый импорт клиентов

#### Оборудование (`/api/equipment`)
- `GET /` - получение всего оборудования
- `GET /:id` - получение оборудования по ID
- `POST /` - создание оборудования
- `PUT /:id` - обновление оборудования
- `DELETE /:id` - удаление оборудования

Дополнительные маршруты: пользователи, роли, спецификации, поставщики, зарплаты, бэкапы.

## Frontend

### Технологии и зависимости
- **React 18** с **Vite** для сборки
- **React Router DOM** для маршрутизации
- **Tailwind CSS** для стилизации
- **Axios** для HTTP запросов
- **XLSX** для работы с Excel файлами

### Скрипты
- `npm run dev` - запуск dev сервера
- `npm run build` - сборка для продакшена
- `npm run lint` - проверка ESLint
- `npm run preview` - превью сборки

### Структура маршрутов
- `/login` - страница входа
- `/dashboard` - защищенный дашборд с вложенными маршрутами:
  - `/dashboard/clients` - список клиентов
  - `/dashboard/clients/:id` - детали клиента
  - `/dashboard/client-objects/:id` - детали объекта клиента
  - `/dashboard/objects` - список объектов клиентов
  - `/dashboard/bids` - список заявок
  - `/dashboard/bids/:id` - детали заявки
  - `/dashboard/equipment` - список оборудования (требует разрешения `tab_warehouse`)
  - `/dashboard/suppliers/create` - создание поставщика
  - `/dashboard/salary` - зарплаты (требует разрешения `tab_salary`)
  - `/dashboard/settings` - настройки

### Компоненты

#### Dashboard
Основной компонент с боковой навигацией. Включает:
- Навигацию по разделам (клиенты, объекты, заявки, оборудование, поставщики, зарплаты, настройки)
- Защиту маршрутов по разрешениям
- Специальный режим для страницы настроек с вкладками

#### Clients
Управление клиентами:
- Список клиентов с поиском и фильтрами
- Создание новых клиентов
- Фильтры по ответственному лицу
- Сохранение настроек в localStorage

#### Equipment
Управление оборудованием:
- Список оборудования с настраиваемыми колонками
- Поиск и фильтры
- Создание, редактирование, удаление
- Настройки видимости колонок (сохранение в localStorage)

## База данных (Prisma Schema)

### Основные модели

#### User
- id, username, fullName, email, password, role
- Связи: clients, bids, comments, auditLogs

#### Client
- id, name, email, phone, responsibleId
- Связи: bids, clientObjects

#### ClientObject
- id, clientId, brandModel, stateNumber, equipment
- Связи: client, bids

#### Bid
- id, clientId, bidTypeId, tema, amount, status, description
- clientObjectId, updNumber, updDate, contract, workAddress
- contactFullName, contactPhone, parentId, plannedResolutionDate
- plannedReactionTimeMinutes, assignedAt, plannedDurationHours, spentTimeHours
- createdBy, createdAt, updatedAt
- Связи: client, bidType, clientObject, creator, parent/children, comments, bidSpecifications, auditLogs, bidEquipments

#### Comment
- id, bidId, userId, content, createdAt, updatedAt
- Связи: bid, user

#### SpecificationCategory
- id, name, description, parentId
- Связи: parent/children, specifications

#### Specification
- id, categoryId, name, discount, cost
- Связи: category, bidSpecifications

#### BidSpecification
- id, bidId, specificationId, executorIds, discount
- Связи: bid, specification

#### Supplier
- id, name, entityType, inn, phone, email

#### BidType
- id, name, description, statuses, transitions

#### AuditLog
- id, bidId, userId, action, details, createdAt
- Связи: bid, user

#### Warehouse
- id, name, address

#### Equipment
- id, name, productCode, purchasePrice, sellingPrice
- Связи: bidEquipments

#### BidEquipment
- id, bidId, equipmentId, imei, quantity
- Связи: bid, equipment

#### Role
- id, name, description, permissions

## Запуск проекта

### Сервер
Используйте универсальный скрипт `server-control.bat`:
- `server-control.bat start` - запуск серверов
- `server-control.bat stop` - остановка
- `server-control.bat restart` - перезапуск

Или отдельно:
- `start-full.bat` - полный запуск (frontend + backend)
- `start-server.bat` - только backend
- `run-minimal-server.bat` - минимальный сервер

### Разработка
```bash
# Backend
cd CRM_base/backend
npm install
npm run dev

# Frontend
cd CRM_base/frontend
npm install
npm run dev
```

## Функциональность системы

### Управление клиентами
- Просмотр списка клиентов
- Поиск и фильтрация
- Создание и редактирование клиентов
- Привязка ответственных лиц
- Управление объектами клиентов (автомобили)

### Управление заявками
- Создание заявок с привязкой к клиентам и объектам
- Управление статусами и типами заявок
- Добавление спецификаций работ с исполнителями
- Комментирование и история изменений
- Назначение оборудования на заявки

### Управление оборудованием
- Каталог оборудования с ценами
- Привязка к заявкам
- Управление складом

### Система ролей и разрешений
- Ролевая модель с гибкими разрешениями
- Защита маршрутов и действий по разрешениям

### Настройки
- Управление пользователями
- Настройка ролей и разрешений
- Управление категориями спецификаций
- Типы заявок и их статусы

Система предназначена для комплексного управления бизнес-процессами сервисной компании, включая работу с клиентами, заявками на обслуживание и оборудованием.