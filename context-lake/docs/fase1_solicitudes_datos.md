---
id: doc-fase1-solicitudes
tipo: doc
proyecto: vigia-nino-acueductos
estado: borrador para revisión de la CRA
actualizado: 2026-11-09
fuentes: [specs/contratos-datos-fase1.md, ADR-0007, verificación de fuentes públicas del 2026-11-09]
---

# Fase 1 — Solicitudes de datos a otras entidades

**Para qué:** completar las capas S (servicio) y R (respuesta) de Vigía en los 1.122 municipios. Hoy esas capas solo existen para los 23 municipios piloto.

**Qué contiene:** el texto base de cada solicitud. La CRA lo adapta a su formato de oficio o convenio y la Oficina Jurídica valida las citas normativas antes del envío. Cada solicitud adjunta como anexo técnico el contrato de datos de `specs/contratos-datos-fase1.md`.

## Estado de partida (verificado el 2026-11-09)

| Necesidad | Lo que ya es público | Lo que falta |
|---|---|---|
| Continuidad, IANC, suscriptores, PQR, almacenamiento, PEC (SUI) | Nada nacional en datos.gov.co. Los reportes del portal del SUI están detrás de una verificación anti-robots y no se pueden automatizar | **Todo**: convenio con la SSPD |
| IRCA | Anual 2025 en datos.gov.co (1.019 municipios) | IRCA **mensual** |
| Racionamiento y desabastecimiento (R-3) | Reportes públicos de MinVivienda en ArcGIS (Survey123 de gestores y prestadores, y PDA), con DIVIPOLA. **Ya se ingieren** | Cobertura: solo reportan quienes diligencian el formulario. Falta el "Seguimiento Fenómeno El Niño", que exige token |
| Riesgo de desabastecimiento El Niño 2026 | Capa `MpiosAfectadosNino` de MinVivienda (1.104 municipios clasificados). **Ya se ingiere como contexto** | — |
| Carrotanques y calamidad pública (R-2, R-4) | UNGRD solo hasta el 2025-12-31 (datos.gov.co 2343-nuqp y consolidado anual 2025) | Consolidado **2026** con DIVIPOLA |

## 1. Superintendencia de Servicios Públicos Domiciliarios (SSPD) — prioridad 1

**Qué pedimos:** un extracto mensual del SUI por prestador × APS × periodo, de acueducto, con las columnas del contrato `sui_aps_v1`:

- suscriptores;
- horas de continuidad;
- volúmenes producido y facturado;
- consumo residencial;
- PQR por falta de servicio del mes y del mismo mes del año anterior;
- capacidad de almacenamiento y demanda media;
- PEC reportado vigente.

**Alternativa:** acceso de consulta a la bodega del SUI. En ese caso, la SSPD debe validar con la CRA las consultas de `ingesta/queries_sui/`, porque los nombres de tablas de esas consultas no se han podido confirmar.

**Frecuencia:** mensual, idealmente antes del día 15. Desde el primer envío: los últimos 24 meses, para calcular la variación interanual de PQR.

**Por qué:** el SUI es el sistema de información del sector que la regulación tarifaria de la CRA ya utiliza. La Oficina Jurídica debe confirmar la base normativa para el intercambio de información entre la SSPD y la Comisión, incluida la Ley 689 de 2001, que regula el SUI.

**Entregable:** `sui_aps_<AAAA-MM>.csv`. Se carga en `data/bronce/fte_sui/` y se agrega automáticamente por municipio.

## 2. Instituto Nacional de Salud (INS) — SIVICAP

**Qué pedimos:** el IRCA mensual por municipio (urbano y rural), con el contrato `irca_mensual_v1`.

**Frecuencia:** mensual, desde enero de 2025.

**Por qué:** el IRCA anual publicado llega con un año de rezago. Durante El Niño, la calidad del agua cambia mes a mes cuando se activan fuentes alternas.

**Entregable:** `irca_mensual_<AAAA-MM>.csv` en `data/bronce/fte_ins_irca/`.

## 3. Ministerio de Vivienda, Ciudad y Territorio (Viceministerio de Agua)

**Qué pedimos:**

- Acceso de lectura (token o vista pública) a la capa Survey123 «Seguimiento Fenómeno El Niño», creada el 2026-10-27.
- Confirmación de que las capas públicas `Reporte_de_Emergencias-*` y `MpiosAfectadosNino` seguirán disponibles y con el mismo esquema durante el evento.

**Datos personales:** Vigía **no** consulta ni guarda los campos de personas (`responsable`, `Creator`, `Editor`), en cumplimiento de la Ley 1581 de 2012. Pedimos que, si es posible, se publique una vista sin esos campos.

**Hallazgo a reportar:** hay reportes con fecha futura, por ejemplo 2026-12-03, que parecen errores de digitación. Vigía los descarta.

## 4. Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD)

**Qué pedimos:** el consolidado de emergencias 2026 con el formato del consolidado anual 2025, que incluye el código DIVIPOLA, el evento, los galones de agua potable entregados y los datos del decreto de calamidad. Lo ideal sería diario; como mínimo, semanal mientras dure El Niño.

**Alternativa:** reanudar la actualización del conjunto abierto 2343-nuqp, cuya fecha máxima sigue en 2025-12-31.

**Entregable:** el archivo de la UNGRD, o su conversión al contrato `eventos_respuesta_v1`, en `data/bronce/fte_ungrd_mvct/`.

## 5. DANE

**Qué pedimos:** hogares urbanos por municipio (proyección o CNPV 2018). Es el denominador de la cobertura de acueducto (S-3). Es probable que esté publicado; queda por verificar antes de enviar una solicitud (Q-F1-02).

## Orden sugerido

1. SSPD: es la fuente de 7 indicadores y la única que lleva la capa S a escala nacional.
2. UNGRD: R-2 y R-4.
3. INS: IRCA mensual.
4. MinVivienda: el token del seguimiento de El Niño.
