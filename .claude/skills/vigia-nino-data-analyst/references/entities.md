# Entidades — Vigía El Niño · Acueductos

## Municipio (incluye ANM)

- **Definición**: entidad territorial DIVIPOLA. Es la unidad de cálculo del ICR. Las áreas no municipalizadas se tratan igual (RN-TER-01).
- **Tabla principal**: hoy `data/config/territorio_municipios.json → municipios[]`; destino `oro.dim_territorio` (planificada).
- **Llave**: `divipola` (texto de 5 caracteres). No existe llave por nombre (ADR-0002).
- **Atributos**: `nombre`, `departamento`, `cod_depto`, `poblacion`, `region`, `lat`, `lon`.
- **Cobertura actual**: 23 municipios de 12 departamentos (La Guajira, Magdalena, Bolívar, Cesar, Santander, Bogotá, Cundinamarca, Tolima, Huila, Boyacá, Antioquia, Valle). La spec apunta a ~1.100.
- **Advertencias**:
  - `poblacion` y `region` vienen del prototipo, no de las proyecciones DANE. Usa la población para ponderar, pero no la cites como cifra oficial.
  - `lat` y `lon` son la cabecera municipal de la DIVIPOLA del DANE (desde 2026-11-07); es un punto, no un polígono.

## Área / zona / subzona hidrográfica

- **Definición**: zonificación hidrográfica oficial del IDEAM (capa «Zonificación Hidrográfica 2025»), con 5 áreas: Caribe, Magdalena Cauca, Orinoco, Amazonas y Pacífico.
- **Tabla**: `data/config/territorio_hidrografico.json → municipios[]`, llave `divipola`; campos `cod_area_hidrografica`, `area_hidrografica`, `cod_zona_hidrografica`, `zona_hidrografica`, `cod_subzona_hidrografica` (texto, p. ej. `"2701"`), `subzona_hidrografica`, `estado` (`resuelto` / `no_resuelto`).
- **Asignación**: subzona que contiene la cabecera municipal del DANE (RF-TER-08). Hoy hay 23/23 resueltos: 6 en Caribe y 17 en Magdalena Cauca.
- **Relación**: N municipios → 1 subzona. Ojo: una subzona no pertenece a un solo departamento (Río Bogotá incluye Bogotá, Cajicá y Girardot).

## Departamento

- **Llave**: `cod_depto` (2 caracteres); Bogotá D.C. = `11`.
- **Tabla**: `corte → departamentos[]` (agregado ya calculado).
- **Relación**: `municipio.cod_depto = departamento.cod_depto` y siempre `= divipola[:2]`.

## Indicador (catálogo A/H/S/R)

- **Llave**: `codigo` (`A-1`…`R-4`).
- **Catálogo**: `context-lake/specs/indicadores.md`; destino `oro.dim_indicador` (planificada; hoy nombre y unidad se repiten en cada municipio).

| Capa | Códigos en ICR | Informativos (no entran al ICR) |
|---|---|---|
| A — Amenaza | A-3, A-4, H-1 | A-1, A-2 (nacionales), A-5 |
| H — Oferta hídrica | H-2, H-3, H-4 | H-5 |
| S — Servicio | S-1…S-5 | S-6 |
| R — Respuesta | R-1…R-4 | — |

- **Tipos de `valor`**: numérico (la mayoría), **texto categórico** en H-2/H-3 (`"Bajo"`, `"Medio"`, `"Alto"`, `"Muy Alto"`), binario 0/1 en R-n, o `null`.

## Corte diario

- **Llave**: `fecha_corte` (AAAA-MM-DD, UTC).
- **Archivos**: `data/oro/corte_AAAA-MM-DD.json` (histórico) y `corte_vigente.json` (último publicado). Los rechazados están en `data/oro/rechazados/`.
- **Estados**: `PUBLICADO_VALIDO` o `RECHAZADO` (con `motivos_rechazo`).
- **Versión**: `metadata_corte.version_configuracion` (`v1.0.0-20261008` hasta el 06-nov; `v1.1.0-20261107` después).

## Semana

- **Llave**: `semana_iso` (`'2026-W45'`).
- **Tabla**: `dim_semana` (en el JSON semanal y en `oro.dim_semana`), con `inicio` (lunes), `fin`, `semana_evento` y `cerrada`.

## Variable semanal

- **Llave**: `codigo`, en MAYÚSCULAS.
- **Catálogo**: `corte_semanal_vigente.json → variables[]`; destino `config.variable_semanal` (SCD por `vigente_desde`).
- **Grupos**: `amenaza` (NINO*_SSTA, ONI), `colombia` (embalses, lluvia, incendios, focos), `riesgo` (ICR_NACIONAL, POB_RIESGO_CRITICO, MUN_ALERTA_ROJA).
- **`direccion`**: `sube_empeora` o `baja_empeora`. Define si un delta positivo es «empeora» o «mejora».

## Evento análogo

- **Llave**: `id_evento` (`'1997-98'`, `'2015-16'`, `'2023-24'`).
- **Tabla**: `analogos[]`; destino `config.evento_analogo` + `oro.fct_analogo_semana`.
- Se alinea con el evento vigente por `semana_evento`.

## Fuente / captura

- **Llave de fuente**: `id_fuente` (`FTE-CPC-NOAA`, `FTE-SSPD-SUI`, `FTE-INS-IRCA`, `FTE-IDEAM-CLIMA`, `FTE-UNGRD-MVCT`, `FTE-XM-EMBALSES`, `FTE-FIRMS-NASA`…).
- **Llave de captura**: `hash_sha256`. El nombre del archivo en bronce es `AAAAMMDD_HHMMSS_<hash8>.<ext>`.
- **Registro**: `data/ops/capturas.json` (con `estado`: `exitosa`, `sin_cambios`, `fallida`).
