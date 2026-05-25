@echo off
REM ============================================================
REM  ParkPro - Detener sistema
REM  Apaga SOLO el servidor de ParkPro (puerto 3001) y su MySQL
REM  (puerto 3307), sin tocar otros Node/MySQL del equipo.
REM ============================================================
cd /d "%~dp0"
set "BASE=%~dp0"
set "MYSQLADMIN=%BASE%mysql\bin\mysqladmin.exe"

REM ---- 1. Detener el servidor Node que escucha en el puerto 3001 ----
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

REM ---- 2. Apagar MySQL de ParkPro de forma ordenada (puerto 3307) ----
"%MYSQLADMIN%" -h 127.0.0.1 --port=3307 -u root -p12345 shutdown >nul 2>&1
if errorlevel 1 (
  REM Si no respondio, cerrar solo el proceso que ocupa el 3307
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3307" ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
  )
)

echo ParkPro detenido.
