-- =============================================================================
-- PROYECTO: Vigía El Niño · Acueductos (CRA)
-- QUERY_ID: SUI_EXT_02_CONTINUIDAD_SERVICIO
-- VERSION: 1.0.0
-- DOMINIO: CONTINUIDAD_ACUEDUCTO
-- FUENTE: SUI Oracle (SSPD) - Tablas Operativas de Acueducto
-- INDICADOR ASOCIADO: S-1 (Continuidad de Acueducto en horas/día)
-- DESCRIPCIÓN:
--   Extrae las horas diarias promedio de suministro de agua potable reportadas
--   por cada prestador en cada APS durante el periodo mensual de referencia.
--   Aplica la agregación a nivel municipal ponderada por el número de suscriptores
--   activos de cada APS, dando cumplimiento al requisito RF-TER-03.
--
-- REGLAS DE NORMALIZACIÓN (specs/indicadores.md):
--   - Dirección de riesgo: ↓ (A menor número de horas de servicio, mayor es el riesgo).
--   - Puntos de quiebre ICR: Óptimo (24h) -> 0; Amarilla (22h) -> 40; Naranja (18h) -> 60;
--     Roja (12h) -> 75; Extremo (<= 4h) -> 100.
--   - Si un prestador no reporta horas válidas (o reporta NULL), no se asume 0;
--     queda excluido de la ponderación para no falsear el indicador hacia colapso artificial.
--
-- PARÁMETROS:
--   :period_id -> Periodo mensual en formato 'YYYY-MM' (ej. '2026-08')
-- =============================================================================

WITH detalle_aps_continuidad AS (
    SELECT 
        c.ID_EMPRESA                                        AS id_prestador_rups,
        c.ID_APS                                            AS id_aps,
        LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0')             AS divipola,
        c.PERIODO                                           AS periodo_reporte,
        
        -- Horas/día de servicio en el mes
        CASE 
            WHEN c.HORAS_CONTINUIDAD_DIA BETWEEN 0 AND 24 THEN c.HORAS_CONTINUIDAD_DIA
            WHEN c.HORAS_TOTALES_MES > 0 AND c.DIAS_CON_SERVICIO > 0 THEN 
                ROUND(c.HORAS_TOTALES_MES / c.DIAS_CON_SERVICIO, 2)
            ELSE NULL 
        END                                                 AS horas_continuidad_dia,
        
        -- Suscriptores de ponderación
        GREATEST(NVL(c.NUMERO_SUSCRIPTORES_APS, NVL(aps.TOTAL_SUSCRIPTORES, 0)), 1) AS suscriptores_ponderacion,
        
        -- Indicadores de eventos de suspensión
        NVL(c.EVENTOS_SUSPENSION_MES, 0)                    AS suspensiones_reportadas,
        NVL(c.DURACION_SUSPENSIONES_HORAS, 0)               AS horas_suspension_mes,
        c.CAUSA_PRINCIPAL_SUSPENSION                        AS causa_suspension,       -- 'FALLA_FUENTE', 'MANTENIMIENTO', 'RACIONAMIENTO'
        c.FECHA_RADICACION_SUI                              AS fecha_radicacion_sui,
        c.ESTADO_CERTIFICACION                              AS estado_certificacion
    FROM SUI_AAA.CAR_CONTINUIDAD_ACUEDUCTO c
    JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps 
        ON c.ID_EMPRESA = aps.ID_EMPRESA AND c.ID_APS = aps.ID_APS
    WHERE c.PERIODO = :period_id
      AND aps.SERVICIO = 'ACU'
),
resumen_municipal_ponderado AS (
    SELECT 
        divipola,
        periodo_reporte,
        COUNT(DISTINCT id_prestador_rups)                   AS total_prestadores_reportando,
        COUNT(DISTINCT id_aps)                              AS total_aps_reportando,
        SUM(suscriptores_ponderacion)                       AS suscriptores_totales_municipio,
        
        -- Ponderación municipal S-1
        ROUND(
            SUM(horas_continuidad_dia * suscriptores_ponderacion) / 
            NULLIF(SUM(CASE WHEN horas_continuidad_dia IS NOT NULL THEN suscriptores_ponderacion ELSE 0 END), 0)
        , 2)                                                AS continuidad_municipal_promedio,
        
        MIN(horas_continuidad_dia)                          AS continuidad_minima_aps,
        MAX(horas_continuidad_dia)                          AS continuidad_maxima_aps,
        SUM(suspensiones_reportadas)                        AS total_eventos_suspension,
        SUM(horas_suspension_mes)                           AS total_horas_suspension,
        MAX(fecha_radicacion_sui)                           AS fecha_ultimo_reporte
    FROM detalle_aps_continuidad
    WHERE horas_continuidad_dia IS NOT NULL
    GROUP BY divipola, periodo_reporte
)
SELECT 
    m.divipola,
    m.periodo_reporte,
    m.total_prestadores_reportando,
    m.total_aps_reportando,
    m.suscriptores_totales_municipio,
    m.continuidad_municipal_promedio                        AS valor_indicador_s1,
    'HORAS/DIA'                                             AS unidad_medida,
    m.continuidad_minima_aps,
    m.continuidad_maxima_aps,
    m.total_eventos_suspension,
    m.total_horas_suspension,
    m.fecha_ultimo_reporte,
    
    -- Clasificación preliminar según umbrales CRA
    CASE 
        WHEN m.continuidad_municipal_promedio >= 22.0 THEN 'SIN_ALERTA'
        WHEN m.continuidad_municipal_promedio >= 18.0 THEN 'AMARILLA'
        WHEN m.continuidad_municipal_promedio >= 12.0 THEN 'NARANJA'
        WHEN m.continuidad_municipal_promedio < 12.0  THEN 'ROJA'
        ELSE 'SIN_DATO'
    END                                                     AS banda_alerta_s1,
    
    SYSDATE                                                 AS fecha_extraccion_sui
FROM resumen_municipal_ponderado m
ORDER BY m.divipola;
