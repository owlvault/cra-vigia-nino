# Script PowerShell de Auditoría Periódica y Certificación de Veracidad
# Proyecto: Vigía El Niño · Acueductos (CRA)
# Programable en Windows Task Scheduler o ejecutable bajo demanda

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Vigía El Niño · Acueductos (CRA) — Auditoría Periódica de Veracidad" -ForegroundColor Yellow
Write-Host "Fecha y Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan

python auditoria/auditor_veracidad.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[EXITO] Auditoría completada con éxito. Dictamen: CERTIFICADO_FEHACIENTE (100% verificado)." -ForegroundColor Green
    Write-Host "Reportes generados en:" -ForegroundColor White
    Write-Host "  -> auditoria/reporte_auditoria_vigente.json" -ForegroundColor Gray
    Write-Host "  -> auditoria/auditoria_data.js" -ForegroundColor Gray
    Write-Host "  -> auditoria/index.html" -ForegroundColor Gray
} else {
    Write-Host "`n[ADVERTENCIA] La auditoría identificó observaciones o discrepancias." -ForegroundColor Red
    Write-Host "Revise el informe forense detallado en auditoria/reporte_auditoria_vigente.json" -ForegroundColor Yellow
}
