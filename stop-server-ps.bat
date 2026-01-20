@echo off
echo Остановка сервера с помощью PowerShell...
powershell -ExecutionPolicy Bypass -Command "& {Stop-Process -Name 'node' -Force -ErrorAction SilentlyContinue; if ($?) {Write-Host 'Процессы Node.js остановлены'} else {Write-Host 'Активные процессы Node.js не найдены'}}"
echo.
echo Готово!
pause