---
id: business-context
tipo: business
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-11-07
fuentes: [conversación con Camilo Carvajalino (CRA) 2026-10-08, prototipo documentacion/fuentes/prototipo-tablero.html, NOAA CPC discusión ENSO 2026-09-10, MinVivienda comunicados sept-2026, MinVivienda circular 2026EE0026348, Superservicios circular 20261000000624]
---

# Contexto de negocio — Vigía El Niño · Acueductos

## Problema

El Niño 2026-27 está en fortalecimiento. La discusión de NOAA CPC del 2026-09-10 reporta Niño 3.4 = +1.8 °C (agosto) y 75 % de probabilidad de un evento histórico (RONI ≥ +2.5 °C) en octubre-diciembre 2026. MinVivienda identificó 558 municipios y áreas no municipalizadas en riesgo Alto (447) o Muy Alto (111) para agua y saneamiento.

La información que la CRA necesita para anticipar el impacto sobre el servicio de acueducto está dispersa en al menos 12 fuentes (SUI, SIVICAP, IDEAM, NOAA, UNGRD, MinVivienda, DANE, XM, NASA FIRMS), con frecuencias, formatos y llaves territoriales distintas. Hoy se consolida manualmente, sin un indicador común de riesgo por municipio y sin trazabilidad de qué dato alimentó cada conclusión.

Línea base histórica (El Niño 2014-2016, MinVivienda circular 2026EE0026348): 296 municipios con racionamiento; de 358 calamidades públicas declaradas, 187 (52,2 %) por desabastecimiento.

> **ASUNCIÓN (sin validar):** La consolidación manual actual toma más de 1 día-persona por corte y se hace con frecuencia menor a semanal. Origen: inferido. Confirmar con el equipo técnico de la CRA para fijar la línea base de la métrica MET-01.

## Propuesta de valor

Un sistema productivo, automatizado y on-premise que:

1. Recopila sin intervención manual los datos de las fuentes oficiales con la frecuencia de cada una.
2. Los integra por código DIVIPOLA en un modelo territorial único Nación → Departamento → Municipio → Área de Prestación de Servicio (APS).
3. Calcula 20 indicadores y un Índice Compuesto de Riesgo (ICR) por municipio.
4. Presenta el resultado en un tablero con la imagen institucional de la CRA, con drill territorial y ficha municipal.
5. Emite alertas cuando un municipio cambia de nivel de riesgo.

Para la CRA, el valor es regulatorio: priorizar análisis, soportar medidas regulatorias transitorias y dar evidencia trazable en mesas con SSPD, MinVivienda y UNGRD.

## Modelo de negocio

Sistema de uso interno de una entidad pública. No genera ingresos. La unidad de valor es **horas de análisis ahorradas por corte** y **días de anticipación** con los que la CRA identifica un municipio en alerta frente a la fecha de su primer reporte oficial de afectación.

## Actores

| ID | Actor | Rol | Qué puede hacer | Qué NO puede hacer |
|---|---|---|---|---|
| ACT-COMISIONADO | Comisionado / Director Ejecutivo CRA | interno | Consultar tablero y fichas; recibir alertas rojas | Editar configuración, pesos ni umbrales |
| ACT-ANALISTA | Experto comisionado / analista técnico CRA | interno | Consultar todo; exportar datos; anotar municipios; recibir alertas | Cambiar pesos, umbrales o fuentes |
| ACT-ADMIN-DATOS | Administrador de datos (TI CRA) | interno | Configurar fuentes, horarios, pesos y umbrales; reprocesar cargas; gestionar usuarios | Modificar datos de origen a mano |
| ACT-ORQUESTADOR | Orquestador de cargas | sistema | Ejecutar ingestas programadas, transformar, calcular indicadores, disparar alertas | Publicar un corte que no pasó calidad de datos |
| ACT-FUENTE | Sistemas de fuente externa (SUI, SIVICAP, IDEAM, CPC…) | externo | Proveer datos | — |

## Flujos operativos

### FL-01 — Corte diario automatizado

1. **ACT-ORQUESTADOR** ejecuta las ingestas programadas de cada fuente → guarda el crudo inmutable en la zona bronce con hash y fecha de captura.
2. **ACT-ORQUESTADOR** valida y normaliza → zona plata, con DIVIPOLA resuelto.
3. **ACT-ORQUESTADOR** calcula indicadores e ICR → zona oro, versionada por fecha de corte.
4. **ACT-ORQUESTADOR** compara el nivel de alerta del corte con el anterior → genera eventos de cambio de nivel.
5. **ACT-ORQUESTADOR** publica el corte en el tablero solo si pasó las reglas de calidad (ver `specs/calidad-datos.md`).
6. **ACT-ANALISTA** revisa los municipios que cambiaron de nivel.

**Disparador:** programación diaria 06:00 hora Colombia (UTC-5).
**Resultado esperado:** corte publicado con fecha, fuentes y frescura visibles.
**Frecuencia y volumen:** 1 corte diario; todos los municipios y áreas no municipalizadas vigentes en DIVIPOLA (del orden de 1.100); 20 indicadores.
**Qué pasa si falla:** el tablero sigue mostrando el último corte válido con aviso de desactualización; ACT-ADMIN-DATOS recibe notificación.

### FL-02 — Consulta territorial

1. **ACT-ANALISTA** abre el tablero → ve la vista Nación con el mapa coloreado por ICR.
2. **ACT-ANALISTA** selecciona un departamento → ve ranking de sus municipios.
3. **ACT-ANALISTA** selecciona un municipio → ve la ficha municipal con los 20 indicadores, fuente y fecha de cada uno.
4. **ACT-ANALISTA** exporta la ficha o la tabla.

### FL-03 — Gestión de alertas

1. **ACT-ORQUESTADOR** detecta que un municipio sube a nivel naranja o rojo → crea alerta.
2. El sistema notifica por correo institucional a los suscriptores del nivel.
3. **ACT-ANALISTA** marca la alerta como revisada y registra una nota.

### FL-04 — Configuración del modelo de riesgo

1. **ACT-ADMIN-DATOS** cambia un peso o umbral → el sistema crea una nueva versión de la configuración.
2. El siguiente corte usa la nueva versión; los cortes anteriores conservan la versión con que se calcularon.

## Métricas de éxito

| ID | Métrica | Línea base hoy | Objetivo | Cómo se mide |
|---|---|---|---|---|
| MET-01 | Horas-persona por corte consolidado | Q-NEG-01 | 0 h para el corte automático | Registro de ejecución del orquestador |
| MET-02 | Frescura del corte publicado | n/a | Corte diario publicado antes de 08:00 en ≥ 95 % de días hábiles | Log de publicación |
| MET-03 | Cobertura territorial | n/a | ICR calculado para ≥ 95 % de municipios | Conteo en zona oro |
| MET-04 | Anticipación | n/a | ≥ 14 días entre primera alerta naranja y primer reporte oficial de afectación, medido sobre los municipios afectados | Cruce alertas vs. R-3/R-4 |

## Restricciones

| ID | Restricción | Fuente |
|---|---|---|
| RES-01 | Despliegue on-premise en infraestructura de la CRA con software de código abierto. | Decisión de Camilo, 2026-10-08 (ADR-0005) |
| RES-02 | Operación del sistema exclusivamente interna CRA. Se habilita un canal ciudadano de solo lectura sobre un subconjunto de la información, sujeto a las condiciones de ADR-0006. | Decisión de Camilo, 2026-10-08; modificada 2026-11-07 (ADR-0006) |
| RES-03 | Alcance de servicio: solo acueducto. | Decisión de Camilo, 2026-10-08 |
| RES-04 | Imagen institucional CRA y lineamientos GOV.CO. | Decisión de Camilo, 2026-10-08 (ADR-0004) |
| RES-05 | Solo fuentes oficiales o institucionales; cada dato publicado debe citar fuente y fecha. | Solicitud de Camilo |
| RES-06 | Tratamiento de datos conforme a Ley 1581 de 2012 y Ley 1712 de 2014. | Marco legal colombiano |
| RES-07 | El evento está activo: la v1 debe estar operando antes del pico esperado (nov-2026 a ene-2027). | NOAA CPC 2026-09-10 |

## No-objetivos

- **Alcantarillado y aseo.** Fuera de la v1 (RES-03). No crear tablas, indicadores ni vistas para esos servicios.
- **Acceso de entidades externas, registro de usuarios externos o API pública.** Fuera de la v1 (RES-02). El canal ciudadano de solo lectura de ADR-0006 es la única excepción, y no se construye antes de `specs/canal-ciudadano.md`.
- **Modelos numéricos propios de predicción climática.** El sistema consume pronósticos oficiales (CPC, IDEAM); no corre modelos de circulación ni downscaling.
- **Captura manual de datos por prestadores.** El sistema no reemplaza el SUI ni recibe reportes de prestadores.
- **Gestión operativa de la emergencia** (despacho de carrotanques, inventarios). Solo se observa como indicador.
- **App móvil nativa.** El tablero web responsive basta.
- **Energía, gas o embalses de generación** salvo como fuente de H-5 cuando abastecen acueductos.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-NEG-01 | ¿Cuántas horas-persona toma hoy consolidar un corte? | MET-01 | CRA – equipo técnico |
| Q-NEG-02 | ¿Qué dependencias de la CRA son usuarias (Subdirección de Regulación, Oficina Asesora de Planeación y TIC, Dirección Ejecutiva)? | `specs/seguridad-acceso.md` | Camilo |
| Q-NEG-03 | ¿Fecha objetivo de salida a producción? | Plan de entrega | Camilo |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Conversación y prototipo |
| 2026-11-07 | RES-02 modificada: canal ciudadano de solo lectura | ADR-0006 |
