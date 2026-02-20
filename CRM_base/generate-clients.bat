@echo off
chcp 65001 >nul
echo ========================================
echo Генерация клиентов
echo ========================================
echo.
if "%1"=="" (
    echo Использование: generate-clients.bat --count=^<количество^>
    echo.
    echo Пример: generate-clients.bat --count=10
    echo.
    echo Вы можете изменить количество клиентов в параметре --count
    echo.
    pause
    exit /b 1
)
cd /d "%~dp0backend"
node generate-clients.js %*
