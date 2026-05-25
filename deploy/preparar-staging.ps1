# ============================================================
#  ParkPro - Preparar carpeta "staging" para el instalador
#  Se ejecuta en el PC de DESARROLLO (donde si hay internet).
#
#  Hace:
#   1. Instala dependencias de produccion del backend
#   2. Genera el certificado HTTPS
#   3. Compila el frontend (dist)
#   4. Copia todo a deploy\staging\  (app + scripts)
#
#  Luego TU copias manualmente node\ y mysql\ dentro de staging\
#  (ver COMO-CREAR-INSTALADOR.txt) y compilas el .iss con Inno Setup.
#
#  Uso (PowerShell, parado en la carpeta deploy):
#     .\preparar-staging.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$deploy   = $PSScriptRoot
$raiz     = Split-Path $deploy -Parent
$backend  = Join-Path $raiz "parkpro-backend"
$frontend = Join-Path $raiz "parkpro-frontend"
$staging  = Join-Path $deploy "staging"

Write-Host "==> 1/5 Asegurando dependencias del backend y certificado..." -ForegroundColor Cyan
Push-Location $backend
npm install
node generar-certificado.js
Pop-Location

Write-Host "==> 2/5 Compilando el frontend..." -ForegroundColor Cyan
Push-Location $frontend
npm install
npm run build
Pop-Location

Write-Host "==> 3/5 Limpiando staging anterior..." -ForegroundColor Cyan
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory -Force -Path $staging | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $staging "parkpro-frontend") | Out-Null

Write-Host "==> 4/5 Copiando archivos a staging..." -ForegroundColor Cyan
# Backend completo (incluye node_modules y certs), excluyendo sesiones y basura
robocopy $backend (Join-Path $staging "parkpro-backend") /E /R:2 /W:2 `
  /XD ".baileys_auth" ".wwebjs_auth" ".wwebjs_cache" ".git" | Out-Null
# Frontend compilado
robocopy (Join-Path $frontend "dist") (Join-Path $staging "parkpro-frontend\dist") /E /R:2 /W:2 | Out-Null
# Scripts de arranque/parada
Copy-Item (Join-Path $deploy "iniciar-parkpro.bat") $staging -Force
Copy-Item (Join-Path $deploy "iniciar.vbs")         $staging -Force
Copy-Item (Join-Path $deploy "detener-parkpro.bat") $staging -Force
Copy-Item (Join-Path $deploy "detener.vbs")         $staging -Force
if (Test-Path (Join-Path $deploy "parkpro.ico")) { Copy-Item (Join-Path $deploy "parkpro.ico") $staging -Force }

Write-Host "==> 5/5 Podando dependencias de desarrollo en la copia (no afecta tu proyecto)..." -ForegroundColor Cyan
Push-Location (Join-Path $staging "parkpro-backend")
npm prune --omit=dev
Pop-Location

Write-Host ""
Write-Host "LISTO. Carpeta staging preparada en:" -ForegroundColor Green
Write-Host "   $staging"
Write-Host ""
Write-Host "FALTA (manual): copiar dentro de staging\ las carpetas:" -ForegroundColor Yellow
Write-Host "   staging\node\    (Node.js portable - node.exe en la raiz)"
Write-Host "   staging\mysql\   (MySQL portable - con la subcarpeta bin\)"
Write-Host "Luego compila deploy\instalador.iss con Inno Setup."
