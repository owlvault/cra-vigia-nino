# Script PowerShell para iniciar el Tablero Web Vigía El Niño (CRA)
# Uso: .\iniciar_tablero.ps1
# Sirve tablero/ y la API del botón «Actualizar datos» (specs/comparativo-semanal.md RF-SEM-05)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$Puerto = 8088
$Url = "http://localhost:$Puerto/semanal/"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Iniciando Tablero Web Vigía El Niño - Acueductos (CRA)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Puerto: $Puerto (solo 127.0.0.1)" -ForegroundColor White
Write-Host "Tablero principal:   http://localhost:$Puerto/" -ForegroundColor White
Write-Host "Comparativo semanal: $Url" -ForegroundColor Green

Start-Process $Url

Write-Host "Servidor HTTP activo. Presione Ctrl + C para detener." -ForegroundColor Gray
python servidor_tablero.py --puerto $Puerto
