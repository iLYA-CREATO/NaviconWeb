@echo off
echo Остановка сервера...
echo.

REM Простой способ остановки всех процессов Node.js
taskkill /IM node.exe /F >nul 2>&1

if errorlevel 1 (
    echo Активные процессы Node.js не найдены
) else (
    echo Все процессы Node.js успешно остановлены
)

echo.
echo Готово!
timeout /t 2 >nul