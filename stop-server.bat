@echo off
echo Остановка сервера...

REM Остановка процесса Node.js на порту 3000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Найден процесс %%a на порту 3000, останавливаю...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo Не удалось остановить процесс %%a
    ) else (
        echo Процесс %%a успешно остановлен
    )
)

REM Остановка процесса Node.js на порту 5173 (frontend dev server)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo Найден процесс %%a на порту 5173, останавливаю...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo Не удалось остановить процесс %%a
    ) else (
        echo Процесс %%a успешно остановлен
    )
)

REM Остановка всех процессов node.exe (если не найдены по портам)
echo Ищу оставшиеся процессы Node.js...
taskkill /IM node.exe /F >nul 2>&1
if errorlevel 1 (
    echo Активные процессы Node.js не найдены
) else (
    echo Все процессы Node.js остановлены
)

echo Готово!
pause