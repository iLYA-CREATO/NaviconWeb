@echo off
chcp 65001 >nul
echo ========================================
echo Генерация заявок
echo ========================================
echo.
if "%1"=="" (
    echo Использование: generate-bids.bat --count=^<количество^>
    echo.
    echo Пример: generate-bids.bat --count=30
    echo.
    echo Вы можете изменить количество заявок в параметре --count
    echo.
    pause
    exit /b 1
)
cd /d "%~dp0backend"
node generate-bids.js %*
