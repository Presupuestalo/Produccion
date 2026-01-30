@echo off
echo PREPARANDO ARRANQUE...

:: Ir al directorio
cd /d "F:\PRESUPUESTALO\WEB-PRODUCCION"

:: 1. Limpiar procesos de node anteriores y archivos de bloqueo
taskkill /f /im node.exe 2>nul
del /f /q ".next\dev\lock" 2>nul

:: 2. Abrir el navegador
start http://localhost:3000

:: 3. Arrancar
echo Iniciando servidor en puerto 3000...
call npm run dev

echo.
echo Proceso terminado.
pause