@echo off
chcp 65001 >nul
echo ========================================
echo Генерация транспортных средств (автомобилей)
echo ========================================
echo.
if "%1"=="" (
    echo Использование: generate-vehicles.bat --count=^<количество^>
    echo.
    echo Пример: generate-vehicles.bat --count=20
    echo.
    echo Вы можете изменить количество автомобилей в параметре --count
    echo.
    pause
    exit /b 1
)
cd /d "%~dp0backend"
node generate-vehicles.js %*
