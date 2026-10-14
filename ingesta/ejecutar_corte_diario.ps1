# Script de Automatización Diaria — Vigía El Niño · Acueductos
# Programable en Windows Task Scheduler o cron
# Hora sugerida: 06:00 a.m. (America/Bogota)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Vigía El Niño · Acueductos (CRA) - Ejecución de Corte Diario" -ForegroundColor Yellow
Write-Host "Fecha y Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Ejecutar ciclo completo de ingesta
python -m ingesta.cli ejecutar-todo

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nCorte diario completado exitosamente y publicado en data/oro/corte_vigente.json" -ForegroundColor Green
} else {
    Write-Host "`nError en la ejecución del ciclo diario de ingesta. Revise data/ops/capturas.json" -ForegroundColor Red
}
