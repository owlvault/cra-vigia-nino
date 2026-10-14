@echo off
title Auditoria de Veracidad y Linaje - Vigia El Nino CRA
echo ======================================================================
echo Ejecutando Auditoria Periodica de Veracidad - Vigia El Nino (CRA)
echo ======================================================================
echo.
python auditoria/auditor_veracidad.py
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo AUDITORIA COMPLETADA: 100%% VERIFICADO FEHACIENTE
    echo Abriendo Tablero de Auditoria en el navegador...
    echo ======================================================================
    start "" "auditoria\index.html"
) else (
    echo.
    echo ======================================================================
    echo ADVERTENCIA: La auditoria detecto discrepancias o fallas de integridad.
    echo Revise auditoria\reporte_auditoria_vigente.json
    echo ======================================================================
)
pause
