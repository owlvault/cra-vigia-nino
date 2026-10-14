@echo off
title Vigia El Nino - Tablero CRA
cd /d "%~dp0"
echo ========================================================
echo Iniciando Tablero Web Vigia El Nino - Acueductos (CRA)
echo ========================================================
echo Puerto: 8088 (solo 127.0.0.1)
echo Tablero:              http://localhost:8088/
echo Comparativo semanal:  http://localhost:8088/semanal/
start http://localhost:8088/semanal/
python servidor_tablero.py --puerto 8088
pause
