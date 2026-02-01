@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   Client Generator for CRM Navicon
echo ============================================
echo.

set /p count="Enter number of clients to create: "

if "!count!"=="" (
    echo Error: You did not enter a number.
    pause
    exit /b 1
)

set "num=!count!"
set "i=0"
:check_loop
if "!num!"=="" goto valid_number
set "first=!num:~0,1!"
if "!first!" GEQ "0" if "!first!" LEQ "9" (
    set "num=!num:~1!"
    goto check_loop
)
echo Error: "!count!" is not a number.
pause
exit /b 1

:valid_number
if !count! LEQ 0 (
    echo Error: Number must be positive.
    pause
    exit /b 1
)

echo.
echo Starting generation of !count! clients with random responsible...
echo.

cd /d "%~dp0backend"
node generate-clients.js --count=!count!

echo.
pause
