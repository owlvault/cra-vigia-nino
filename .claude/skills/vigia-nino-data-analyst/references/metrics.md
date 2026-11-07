# Métricas — Vigía El Niño · Acueductos

Parámetros vigentes: `data/config/parametros_icr.json` (versión `v1.1.0-20261107`). Si cambian, manda la config, no este documento.

## Puntaje de indicador (normalización 0-100)

- **Definición**: transforma el valor del indicador en riesgo de 0 a 100 (RF-ICR-01).
- **Fórmula (cuantitativos)**: interpolación lineal entre 5 quiebres `(valor → 0, 40, 60, 75, 100)`, recortada a [0, 100].

| Código | → 0 | → 40 | → 60 | → 75 | → 100 |
|---|---|---|---|---|---|
| A-3 Anomalía lluvia 30 d (%) | 0 | −20 | −40 | −60 | −90 |
| A-4 Días sin lluvia | 0 | 10 | 20 | 30 | 60 |
| H-1 Caudal fuente (% del normal) | 100 | 70 | 50 | 30 | 10 |
| H-4 Autonomía (h) | 36 | 24 | 12 | 6 | 0 |
| S-1 Continuidad (h/día) | 24 | 22 | 18 | 12 | 4 |
| S-2 IRCA | 0 | 5 | 14 | 35 | 80 |
| S-3 Cobertura (%) | 100 | 95 | 85 | 70 | 40 |
| S-4 IANC (%) | 20 | 30 | 40 | 50 | 70 |
| S-5 Variación de PQR (%) | 0 | 25 | 50 | 100 | 300 |

- **Categóricos H-2/H-3**: muy bajo 0, bajo 15, moderado/medio 40, alto 65, muy alto 90. Una categoría desconocida da `null`.
- **Binarios R-n**: R-1 con PEC = 0 y sin PEC = 100; R-2 activo = 60; R-3 activo = 80; R-4 activo = 100; inactivos = 0.
- **Caveats**:
  - `puntaje = null` cuando `valor = null`.
  - Hasta `v1.0.0`, H-4 usaba 24/18/12/6/2 h → 0/35/55/75/100.

## ICR municipal

- **Definición**: riesgo compuesto del municipio, 0-100.
- **Fórmula**:
  1. Subíndice de capa = promedio de puntajes disponibles (A, H, S) o **máximo** (R).
  2. `ICR = Σ (subíndice_c × peso_c) / Σ peso_c`, sumando solo capas con subíndice. Pesos: A 0,30, H 0,30, S 0,25, R 0,15.
  3. Si `Σ peso_c` disponible < 0,60, `ICR = null` y `nivel = 'sin_dato'`.
- **Fuente**: `municipios[].icr`, `subindices_capa{amenaza_A, vulnerabilidad_H, servicio_S, respuesta_R}`.
- **Grano**: municipio × corte diario.
- **Caveats**:
  - El JSON guarda el ICR redondeado a 1 decimal.
  - Para recalcular, usa los subíndices (2 decimales) y no los ICR redondeados.

## Nivel de alerta

- **Fórmula**: `ICR < 40` sin alerta; `< 60` amarilla; `< 75` naranja; `≥ 75` roja.
- **Piso**: si R-3 o R-4 valen 1 y el nivel es menor que naranja, el nivel pasa a naranja y `nivel_por_regla = true`.
- **Fuente**: `municipios[].nivel_alerta`, `nivel_por_regla`.

## ICR medio ponderado (departamento / Nación)

- **Fórmula**: `Σ (icr × poblacion) / Σ poblacion`.
- **Fuente**: `departamentos[].icr_medio_ponderado` y `metadata_corte.icr_nacional_ponderado`.
- **Caveats**:
  - El denominador del departamento incluye municipios sin ICR, así que un municipio `sin_dato` arrastra la media hacia abajo. En la Nación pasa lo mismo.
  - Con 23 municipios, Bogotá (7,9 M hab.) domina el ICR nacional.
  - Los cortes hasta el 2026-11-06 ponderan con la población del prototipo; los siguientes, con la proyección DANE del año del corte. Con el corte del 06-nov, el cambio sube el ICR nacional de 39,3 a 39,6 y la población en naranja o roja de 1.064.500 a 1.121.278.
  - No lo presentes como «ICR de Colombia»: es el de la muestra.

## Población en riesgo crítico

- **Fórmula**: `Σ poblacion` de municipios con nivel naranja o roja.
- **Fuente**: `metadata_corte.poblacion_en_riesgo_critico`, `departamentos[].poblacion_naranja_roja`.

## Conteo por nivel

- **Fuente**: `metadata_corte.conteo_niveles_nacional` y `departamentos[].conteo_niveles`, con las claves `roja`, `naranja`, `amarilla`, `sin_alerta` y `sin_dato`.

## Cobertura de datos

- **Definición oficial (RF-ICR-04)**: `cobertura_datos_pct` = % del **peso de capas** que tiene al menos un indicador con puntaje.
- **No es** el % de indicadores con dato. Para eso:
  ```python
  sum(v["valor"] is not None for v in m["indicadores"].values()) / 20 * 100
  ```
- **Compuerta (RF-CAL-04)**: un corte se publica si ≥ 90 % de los municipios tienen ICR y A-1 está vigente.

## Métricas semanales (V-08)

| Métrica | Campo | Definición |
|---|---|---|
| Valor semanal | `series[codigo][i].valor` | Agregado según `variables[].agregacion` (`ultimo`, `promedio`, `suma`, `arrastre`) |
| Delta | `fct_variable_semana[desp][codigo][semana].delta_abs` / `delta_pct` | Frente a la semana `desp` semanas atrás (`desp` ∈ {1, 4}) |
| Tendencia | `...tendencia` | `empeora` / `mejora` / `estable` según `direccion` y `tolerancia_estable` |
| Nivel | `...nivel_etiqueta`, `nivel_riesgo` | Según `variables[].niveles` |
| Inicio del evento | `evento_vigente.inicio_semana` | Primera semana de 4 consecutivas con NINO34_SSTA ≥ 0,5 °C |
