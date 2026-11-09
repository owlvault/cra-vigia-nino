---
id: spec-contratos-datos-fase1
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-11-09
fuentes: [ADR-0007, specs/indicadores.md, specs/modelo-territorial.md RF-TER-03, specs/ingesta-fuentes.md RF-ING-06, ADR-0006]
---

# Spec — Contratos de datos de la Fase 1 (capas S y R a escala nacional)

## Propósito

Definir qué debe entregar cada entidad para que las capas S (servicio) y R (respuesta) pasen de los 23 municipios piloto a los 1.122. El contrato es el anexo técnico de cada convenio o solicitud. Vigía valida cada entrega y la agrega. No depende del modelo interno de la entidad: el esquema Oracle del SUI no es público, y las consultas de `ingesta/queries_sui/` son una propuesta que la SSPD debe validar.

## Entrega y carga

- Formato: CSV UTF-8, separador coma, encabezado obligatorio. Celda vacía = sin dato; nunca 0 por defecto.
- Carga: RF-ING-06 (carga asistida por ACT-ADMIN-DATOS) en la carpeta de bronce del conector. Las filas inválidas se rechazan con su motivo y el resto continúa.
- Llave territorial: DIVIPOLA de 5 dígitos (ADR-0002). Un código fuera de la DIVIPOLA se rechaza.

| Contrato | Entidad | Archivo en bronce | Código | Indicadores |
|---|---|---|---|---|
| `sui_aps_v1` | SSPD (bodega SUI) | `data/bronce/fte_sui/sui_aps_<periodo>.csv` | `ingesta/fase1/contrato_sui.py` | S-1, S-3, S-4, S-5, S-6, H-4, R-1 |
| `eventos_respuesta_v1` | UNGRD, MinVivienda, Superservicios, CRA, gobernaciones, alcaldías | `data/bronce/fte_ungrd_mvct/eventos_respuesta_<fecha>.csv` | `ingesta/fase1/contrato_eventos.py` | R-2, R-3, R-4 |
| `irca_mensual_v1` | INS / SIVICAP | `data/bronce/fte_ins_irca/irca_mensual_<periodo>.csv` | `ingesta/fase1/contrato_irca.py` | S-2 |

## Requisitos funcionales

### RF-F1-01 — Extracto SUI por APS

El sistema DEBE aceptar el contrato `sui_aps_v1` (una fila por periodo × prestador × APS) y agregar al municipio con estas reglas:

| Indicador | Regla de agregación |
|---|---|
| S-1 | Media de horas/día ponderada por `suscriptores_total` (RF-TER-03) |
| S-4 | (Σ producido − Σ facturado) / Σ producido × 100. Sin volúmenes: `ianc_pct` ponderado |
| S-5 | (Σ PQR mes − Σ PQR mismo mes año anterior) / Σ año anterior × 100; casos borde de `specs/indicadores.md` |
| S-6 | Σ consumo residencial / Σ suscriptores residenciales |
| S-3 | Σ suscriptores residenciales urbanos / hogares urbanos DANE × 100. Requiere `data/config/hogares_urbanos_dane.json` (pendiente) |
| H-4 | Σ capacidad de almacenamiento / Σ demanda media horaria |
| R-1 | 1 si todos los prestadores reportan PEC vigente; 0 si alguno no; sin_dato si falta alguno |

El extracto nacional prevalece sobre el extracto certificado del piloto en los municipios que cubre.

```gherkin
Escenario: Dos prestadores en un municipio (RF-TER-03)
  Dado el extracto con APS-1 de 9.000 suscriptores y 20 h, y APS-2 de 1.000 suscriptores y 10 h, en 47001
  Cuando se carga el extracto
  Entonces S-1 de 47001 es 19,0 h/día con origen "extracto_nacional_aps"
```

### RF-F1-02 — Eventos con soporte para la capa R

El sistema DEBE aceptar `eventos_respuesta_v1`. Un evento `activo` sin soporte se rechaza (ADR-0006). R-2 y R-4 valen 1 si un evento activo cubre la fecha de corte. R-3 vale 1 si hay un reporte activo en los últimos 30 días. `sin_evento` vale 0 solo si se reportó en los últimos 30 días. Sin registro, el valor es sin_dato. Un evento con soporte prevalece sobre `actos_administrativos_verificados.json`.

```gherkin
Escenario: Calamidad vencida sin verificación reciente
  Dado una calamidad de 05001 con fecha_fin 2026-09-30
  Cuando se evalúa el corte del 2026-11-09
  Entonces R-4 de 05001 es sin_dato (no 0)
```

### RF-F1-03 — IRCA mensual

El sistema DEBE preferir el IRCA mensual (`irca_mensual_v1`) al anual publicado cuando el mensual es del mismo año o posterior. La fecha del dato es el último día del mes.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-F1-01 | ¿La SSPD puede entregar `sui_aps_v1` mensual por convenio, o solo da acceso a la bodega? En el segundo caso, validar con la SSPD las consultas de `queries_sui/` | S, H-4, R-1 | CRA – Dirección Ejecutiva / SSPD |
| Q-F1-02 | Hogares urbanos por municipio para S-3: ¿CNPV 2018 del DANE o proyección de hogares? | S-3 | Camilo / DANE |
| Q-F1-03 | ¿MinVivienda comparte el consolidado Survey123 con soporte por reporte? | R-3 | Camilo / MinVivienda |
| Q-F1-04 | ¿La UNGRD puede entregar el consolidado diario de 2026? El conjunto abierto 2343-nuqp termina el 2025-12-31 | R-2, R-4 | CRA / UNGRD |
