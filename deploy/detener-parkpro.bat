@echo off
REM ============================================================
REM  ParkPro - Detener sistema
REM  Apaga el servidor (node) y MySQL de forma segura.
REM ============================================================
cd /d "%~dp0"
set "BASE=%~dp0"
set "MYSQLADMIN=%BASE%mysql\bin\mysqladmin.exe"

REM Detener el servidor Node
taskkill /F /IM node.exe >nul 2>&1

REM Apagar MySQL de forma ordenada (evita corrupción de datos)
"%MYSQLADMIN%" -u root -p12345 shutdown >nul 2>&1
if errorlevel 1 (
  taskkill /F /IM mysqld.exe >nul 2>&1
)

echo ParkPro detenido.
