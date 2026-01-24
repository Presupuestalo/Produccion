@echo off
echo PREPARANDO ARRANQUE...

:: Abrir el navegador automáticamente
start http://localhost:3000

:: Ir a la carpeta del script
cd /d "%~dp0"
echo Directorio: %CD%

:: Intentar arrancar
call npm run dev

echo.
echo Proceso terminado.
pause
