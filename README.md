# NaviconWeb

CRM система с frontend (React) и backend (Node.js + Express + Prisma).

## Управление сервером

### Универсальный скрипт (рекомендуется)
```bash
server-control.bat start    # запуск серверов
server-control.bat stop     # остановка серверов
server-control.bat restart  # перезапуск серверов
```

### Отдельные скрипты

#### Запуск
- `start-full.bat` - полное приложение (frontend + backend в отдельных окнах)
- `start-server.bat` - только backend
- `run-minimal-server.bat` - минимальный сервер для тестирования

#### Остановка
- `stop-server.bat` - полная остановка (ищет процессы по портам)
- `stop-server-simple.bat` - быстрая остановка всех Node.js процессов
- `stop-server-ps.bat` - остановка через PowerShell

## Разработка

### Backend
```bash
cd CRM_base/backend
npm install
npm run dev
```

### Frontend
```bash
cd CRM_base/frontend
npm install
npm run dev
```