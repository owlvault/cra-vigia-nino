# Bronce, config y ops: trazabilidad y parámetros

## Referencia rápida

### Contexto
- **Bronce** guarda el crudo inmutable de cada captura (evidencia regulatoria).
- **Config** guarda los parámetros versionados que se recalibran sin desplegar código.
- **Ops** guarda el registro de capturas, ejecuciones y auditorías.

Úsalos para **trazar** de dónde sale una cifra, no para analizar tendencias.

### Regla
Nunca escribas, edites ni borres en `data/bronce/`: solo los conectores insertan (regla de oro 2). Ojo: `ingesta/tests/test_conectores.py` y `test_auditoria.py` hacen capturas reales y escriben ahí.

---

## Bronce: `data/bronce/fte_<fuente>/AAAAMMDD_HHMMSS_<hash8>.<ext>`

| Carpeta | Fuente | Formato | Alimenta |
|---|---|---|---|
| fte_cpc_noaa | NOAA CPC `wksst9120.for` + `oni.ascii.txt` | .txt | A-1, NINO*_SSTA, ONI |
| fte_sui / fte_sspd_sui | Extracto oficial SUI (periodo 2026-08) | .json | H-4, S-1, S-3…S-6, R-1 |
| fte_ins_irca | SIVICAP (datos.gov.co `nxt2-39c3`), año 2024 | .json | S-2 |
| fte_ideam_clima | Desde 2026-11-08: lluvia diaria por estación (`crudo.diarios`: código, día, mm, n_registros), normales 1991-2020 usadas, ENA por cabecera y resumen municipal (`municipios`). Antes: snapshot del catálogo estático | .json | A-3, A-4, H-2, H-3 |
| fte_ungrd_mvct | Snapshot del registro de actos verificados | .json | R-2, R-3, R-4 |
| fte_xm_embalses | API XM capacidad útil por reservorio | .json | H-5, EMBALSES_* |
| fte_firms_nasa | NASA FIRMS VIIRS | .json | A-5, FOCOS_CALOR_7D |
| fte_*_historico | Series para los análogos | .json | Comparativo semanal |

## ops

| Archivo | Contenido | Notas |
|---|---|---|
| `data/ops/capturas.json` | Lista de capturas: `id_fuente`, `estado` (`exitosa` / `sin_cambios` / `fallida`), `hash_sha256`, `ruta_archivo_bronce`, `capturado_en` | Rutas absolutas de Windows. 214 de 298 archivos de bronce **no** tienen registro (históricos XM/UNGRD y el extracto SUI). |
| `data/ops/auditoria_corte_*.json` | Resultado de cada auditoría de veracidad | |
| `data/ops/ejecuciones_semanal.json` | Bitácora del botón «Actualizar datos» (`ops.ejecucion_semanal`) | |
| `auditoria/reporte_auditoria_vigente.json` | Último dictamen (`veredicto_oficial`) | Copia también en `tablero/auditoria/` |

## config (`data/config/`)

| Archivo | Contenido |
|---|---|
| `parametros_icr.json` | Versión, capas, pesos, quiebres, niveles, piso, categóricos y binarios del ICR |
| `parametros_corte.json` | Frescura por indicador (periodo esperado) y compuerta de publicación |
| `territorio_municipios.json` | Los 23 municipios evaluados (coordenadas DANE; población aún del prototipo) |
| `territorio_hidrografico.json` | Municipio → área, zona y subzona hidrográfica IDEAM, con procedencia; se regenera con `python -m ingesta.territorio.cruce_hidrografico` |
| `parametros_ideam.json` | URLs del IDEAM (datos.gov.co y ArcGIS), sensor, completitud diaria, radio e IDW, asunciones de A-3/A-4 |
| `estaciones_ideam.json` | Estaciones automáticas y de normales dentro de cada municipio (por polígono) y cercanas a la cabecera; se regenera con `python -m ingesta.territorio.estaciones_ideam` |
| `actos_administrativos_verificados.json` | Municipios con calamidad verificada + `municipios_verificados_sin_evento` |
| `comparativo_semanal.json` | Variables, umbrales y análogos del modelo semanal |

---

## Consultas de ejemplo

### Trazar un valor del corte hasta su crudo
```python
import json, hashlib, os
caps = json.load(open("data/ops/capturas.json", encoding="utf-8"))
ultima = max((c for c in caps if c["id_fuente"] == "FTE-SSPD-SUI" and c["estado"] == "exitosa"),
             key=lambda c: c["capturado_en"])
rel = "data/bronce/" + ultima["ruta_archivo_bronce"].replace("\\", "/").split("data/bronce/")[-1]
assert hashlib.sha256(open(rel, "rb").read()).hexdigest() == ultima["hash_sha256"]
```

### Salud de las fuentes (última captura por fuente)
```python
from collections import defaultdict
ult = defaultdict(dict)
for c in caps:
    if c["capturado_en"] > ult[c["id_fuente"]].get("capturado_en", ""):
        ult[c["id_fuente"]] = c
for f, c in sorted(ult.items()):
    print(f, c["estado"], c["capturado_en"][:16], c.get("mensaje", "")[:60])
```

### Destino SQL: última ejecución semanal y su estado
```sql
SELECT id_ejecucion, modo, inicio AT TIME ZONE 'America/Bogota' AS inicio_bogota, estado, semana_publicada, mensaje
FROM ops.ejecucion_semanal
ORDER BY inicio DESC
LIMIT 5;
```

---

## Trampas comunes

1. **Rutas de Windows**: normaliza siempre con `split("data/bronce/")` después de cambiar `\` por `/`. Un `os.path.exists()` directo da falso.
2. **`sin_cambios` repite el hash** de la captura anterior, trae `ruta_archivo_bronce` vacía y no genera archivo nuevo. Para trazarla, busca la captura `exitosa` con el mismo hash.
3. **El auditor no certifica hoy**: el dictamen vigente (`reporte_auditoria_vigente.json`) es `CON_OBSERVACIONES` y audita el corte del **2026-10-14**, no el vigente. Al correrlo fuera de la máquina original, los archivos salen como «FALTA_ARCHIVO» por las rutas de Windows.
4. **El catálogo estático del IDEAM ya no existe** (`catalogo_municipios_ideam.json`, retirado el 2026-11-08). Si lo ves en un análisis o en un corte antiguo, sus valores de A-3/A-4/H-1 no eran mediciones.
