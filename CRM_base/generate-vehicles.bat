@echo off
chcp 65001 >nul
echo ========================================
echo Генерация транспортных средств (автомобилей)
echo ========================================
echo.
cd /d "%~dp0backend"
node generate-vehicles.js %*
pause
