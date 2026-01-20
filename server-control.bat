@echo off
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart

echo Использование: server-control.bat [start^|stop^|restart]
echo.
echo Примеры:
echo   server-control.bat start    - запуск полного приложения
echo   server-control.bat stop     - остановка всех серверов
echo   server-control.bat restart  - перезапуск серверов
goto end

:start
echo Запуск серверов...
call start-full.bat
goto end

:stop
echo Остановка серверов...
call stop-server-simple.bat
goto end

:restart
echo Перезапуск серверов...
echo Останавливаю серверы...
call stop-server-simple.bat
echo.
echo Запускаю серверы...
call start-full.bat
goto end

:end