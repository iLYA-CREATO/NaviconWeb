@echo off
echo Запуск полного приложения (frontend + backend)...

REM Запуск backend в новом окне
start "Backend Server" cmd /k "cd CRM_base\backend && echo Запуск backend сервера... && npm run dev"

REM Небольшая пауза перед запуском frontend
timeout /t 3 /nobreak >nul

REM Запуск frontend в новом окне
start "Frontend Dev Server" cmd /k "cd CRM_base\frontend && echo Запуск frontend dev сервера... && npm run dev"

echo.
echo Серверы запущены в отдельных окнах.
echo Для остановки используйте stop-server.bat
pause