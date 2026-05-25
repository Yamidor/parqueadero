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

# "Continue" para que los avisos de npm/vite (que van a stderr) no aborten el script.
# Validamos el exito con $LASTEXITCODE despues de cada paso critico.
$ErrorActionPreference = "Continue"
function Verificar($msg) { if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en: $msg (codigo $LASTEXITCODE)" -ForegroundColor Red; exit 1 } }
$deploy   = $PSScriptRoot
$raiz     = Split-Path $deploy -Parent
$backend  = Join-Path $raiz "parkpro-backend"
$frontend = Join-Path $raiz "parkpro-frontend"
$staging  = Join-Path $deploy "staging"

Write-Host "==> 1/5 Asegurando dependencias del backend y certificado..." -ForegroundColor Cyan
Push-Location $backend
cmd /c "npm install"; Verificar "npm install backend"
node generar-certificado.js; Verificar "generar certificado"
Pop-Location

Write-Host "==> 2/5 Compilando el frontend..." -ForegroundColor Cyan
Push-Location $frontend
cmd /c "npm install"; Verificar "npm install frontend"
cmd /c "npm run build"; Verificar "npm run build"
Pop-Location

Write-Host "==> 3/5 Limpiando staging anterior (conserva node\ y mysql\)..." -ForegroundColor Cyan
# Borrar solo las partes de la app; preservar node\ y mysql\ ya colocados
foreach ($sub in @("parkpro-backend","parkpro-frontend","vcredist.x64.exe",
                    "iniciar-parkpro.bat","iniciar.vbs","detener-parkpro.bat","detener.vbs")) {
  $p = Join-Path $staging $sub
  if (Test-Path $p) { Remove-Item -Recurse -Force $p }
}
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
# Visual C++ Redistributable (lo instala el instalador; requerido por MySQL)
$vc = Join-Path $deploy "descargas\vcredist.x64.exe"
if (Test-Path $vc) { Copy-Item $vc $staging -Force }
else { Write-Host "AVISO: falta descargas\vcredist.x64.exe (descargalo de https://aka.ms/vs/17/release/vc_redist.x64.exe)" -ForegroundColor Yellow }

Write-Host "==> 5/5 Podando dependencias de desarrollo en la copia (no afecta tu proyecto)..." -ForegroundColor Cyan
Push-Location (Join-Path $staging "parkpro-backend")
cmd /c "npm prune --omit=dev"
Pop-Location

Write-Host ""
Write-Host "LISTO. Carpeta staging preparada en:" -ForegroundColor Green
Write-Host "   $staging"
Write-Host ""
Write-Host "FALTA (manual): copiar dentro de staging\ las carpetas:" -ForegroundColor Yellow
Write-Host "   staging\node\    (Node.js portable - node.exe en la raiz)"
Write-Host "   staging\mysql\   (MySQL portable - con la subcarpeta bin\)"
Write-Host "Luego compila deploy\instalador.iss con Inno Setup."
