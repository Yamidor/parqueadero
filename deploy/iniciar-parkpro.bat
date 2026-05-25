@echo off
REM ============================================================
REM  ParkPro - Iniciar sistema
REM  Arranca MySQL y el servidor. No requiere internet.
REM  Estructura esperada (instalada por el instalador):
REM    {app}\node\node.exe
REM    {app}\mysql\bin\mysqld.exe
REM    {app}\parkpro-backend\server.js
REM ============================================================
cd /d "%~dp0"

set "BASE=%~dp0"
set "NODE=%BASE%node\node.exe"
set "MYSQLD=%BASE%mysql\bin\mysqld.exe"
set "MYSQL=%BASE%mysql\bin\mysql.exe"
set "MYSQLADMIN=%BASE%mysql\bin\mysqladmin.exe"
set "DATADIR=%BASE%mysql\data"

REM ---- 1. Inicializar MySQL la PRIMERA vez ----
if not exist "%DATADIR%" (
  echo Inicializando base de datos por primera vez...
  "%MYSQLD%" --initialize-insecure --datadir="%DATADIR%"
  start "" /B "%MYSQLD%" --datadir="%DATADIR%" --port=3306 --bind-address=127.0.0.1
  REM esperar a que MySQL acepte conexiones
  call :ESPERAR_MYSQL
  "%MYSQL%" -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '12345'; CREATE DATABASE IF NOT EXISTS parkpro CHARACTER SET utf8mb4; FLUSH PRIVILEGES;"
  goto ARRANCAR_NODE
)

REM ---- 2. Arrancar MySQL si no está corriendo ----
tasklist /FI "IMAGENAME eq mysqld.exe" | find /I "mysqld.exe" >nul
if errorlevel 1 (
  start "" /B "%MYSQLD%" --datadir="%DATADIR%" --port=3306 --bind-address=127.0.0.1
  call :ESPERAR_MYSQL
)

:ARRANCAR_NODE
REM ---- 3. Arrancar el servidor (HTTPS + frontend servido) ----
set PARKPRO_HTTPS=true
set PARKPRO_STATIC=true
cd /d "%BASE%parkpro-backend"
start "" /B "%NODE%" server.js

REM ---- 4. Abrir el navegador en el sistema ----
timeout /t 4 /nobreak >nul
start "" "https://localhost:3001"
goto :EOF

:ESPERAR_MYSQL
REM Reintenta hasta 30 veces (cada 1s) hasta que MySQL responda
setlocal
set /a intentos=0
:LOOP_MYSQL
"%MYSQLADMIN%" --silent -u root -p12345 ping >nul 2>&1
if not errorlevel 1 goto MYSQL_OK
"%MYSQLADMIN%" --silent -u root --skip-password ping >nul 2>&1
if not errorlevel 1 goto MYSQL_OK
set /a intentos+=1
if %intentos% geq 30 goto MYSQL_OK
timeout /t 1 /nobreak >nul
goto LOOP_MYSQL
:MYSQL_OK
endlocal
goto :EOF
