-- =============================================================================
-- PROYECTO: Vigía El Niño · Acueductos (CRA)
-- QUERY_ID: SUI_EXT_04_BALANCE_HIDRICO_IANC_PERDIDAS
-- VERSION: 1.0.0
-- DOMINIO: BALANCE_HIDRICO
-- FUENTE: SUI Oracle (SSPD) - Formato de Balance Hídrico de Acueducto
-- INDICADOR ASOCIADO: S-4 (Agua No Contabilizada / IANC - %)
-- DESCRIPCIÓN:
--   Extrae los componentes del balance hídrico mensual: volumen de agua cruda
--   captada, agua tratada producida, agua suministrada a la red de distribución
--   y agua efectivamente facturada a los suscriptores.
--   Calcula el Índice de Agua No Contabilizada (IANC) y el Índice de Pérdidas
--   por Usuario Facturado (IPUF), fundamentales para medir la resiliencia
--   y eficiencia operativa de los acueductos durante periodos de sequía.
--
-- FÓRMULA OFICIAL CRA (Resolución CRA 943 de 2021):
--   IANC (%) = ((Volumen Suministrado - Volumen Facturado) / Volumen Suministrado) * 100
--
-- UMBRALES DE NORMALIZACIÓN (specs/indicadores.md):
--   - Dirección de riesgo: ↑ (A mayor porcentaje de pérdidas, mayor es el riesgo).
--   - Puntos de quiebre: Óptimo (<= 20%) -> 0; Amarilla (30%) -> 40; Naranja (40%) -> 60;
--     Roja (50%) -> 75; Extremo (>= 70%) -> 100.
--
-- PARÁMETROS:
--   :period_id -> Periodo mensual en formato 'YYYY-MM' (ej. '2026-08')
-- =============================================================================

WITH balance_aps AS (
    SELECT 
        b.ID_EMPRESA                                        AS id_prestador_rups,
        b.ID_APS                                            AS id_aps,
        LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0')             AS divipola,
        b.PERIODO                                           AS periodo_reporte,
        
        -- Volúmenes en m3/mes
        NVL(b.VOL_AGUA_CAPTADA_M3, 0)                       AS vol_captado_m3,
        NVL(b.VOL_AGUA_TRATADA_M3, 0)                       AS vol_producido_m3,
        NVL(b.VOL_AGUA_SUMINISTRADA_M3, 0)                  AS vol_suministrado_m3,
        NVL(b.VOL_AGUA_FACTURADA_M3, 0)                     AS vol_facturado_m3,
        NVL(b.VOL_CONSUMO_AUTORIZADO_NO_FACT_M3, 0)         AS vol_autorizado_no_facturado_m3,
        
        -- Pérdidas
        NVL(b.PERDIDAS_APARENTES_M3, 0)                     AS perdidas_aparentes_m3,
        NVL(b.PERDIDAS_REALES_M3, 0)                        AS perdidas_reales_m3,
        
        -- Cobertura de medición
        b.PORCENTAJE_MACROMEDICION                          AS pct_macromedicion,
        b.PORCENTAJE_MICROMEDICION                          AS pct_micromedicion,
        b.FECHA_REPORTE_SUI                                 AS fecha_reporte_sui,
        b.ESTADO_CERTIFICACION                              AS estado_certificacion
    FROM SUI_AAA.CAR_BALANCE_HIDRICO b
    JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps 
        ON b.ID_EMPRESA = aps.ID_EMPRESA AND b.ID_APS = aps.ID_APS
    WHERE b.PERIODO = :period_id
      AND aps.SERVICIO = 'ACU'
),
agregado_municipal AS (
    SELECT 
        divipola,
        periodo_reporte,
        COUNT(DISTINCT id_prestador_rups)                   AS total_prestadores,
        SUM(vol_captado_m3)                                 AS total_captado_m3,
        SUM(vol_producido_m3)                               AS total_producido_m3,
        SUM(vol_suministrado_m3)                            AS total_suministrado_m3,
        SUM(vol_facturado_m3)                               AS total_facturado_m3,
        SUM(vol_autorizado_no_facturado_m3)                 AS total_autorizado_no_fact_m3,
        SUM(perdidas_aparentes_m3)                          AS total_perdidas_aparentes_m3,
        SUM(perdidas_reales_m3)                             AS total_perdidas_reales_m3,
        ROUND(AVG(pct_micromedicion), 1)                    AS promedio_micromedicion_pct,
        ROUND(AVG(pct_macromedicion), 1)                    AS promedio_macromedicion_pct,
        MAX(fecha_reporte_sui)                              AS fecha_ultimo_reporte
    FROM balance_aps
    GROUP BY divipola, periodo_reporte
)
SELECT 
    m.divipola,
    m.periodo_reporte,
    m.total_captado_m3,
    m.total_producido_m3,
    m.total_suministrado_m3,
    m.total_facturado_m3,
    
    -- Indicador S-4: IANC municipal agregado (%)
    -- IANC = ((Suministrado - Facturado) / Suministrado) * 100
    CASE 
        WHEN m.total_suministrado_m3 > 0 THEN 
            ROUND(
                ((m.total_suministrado_m3 - m.total_facturado_m3) / m.total_suministrado_m3) * 100
            , 2)
        ELSE NULL 
    END                                                     AS valor_indicador_s4_ianc_pct,
    
    m.total_perdidas_reales_m3,
    m.total_perdidas_aparentes_m3,
    m.promedio_micromedicion_pct,
    m.promedio_macromedicion_pct,
    m.fecha_ultimo_reporte,
    
    -- Clasificación de riesgo de pérdidas (specs/indicadores.md)
    CASE 
        WHEN ((m.total_suministrado_m3 - m.total_facturado_m3) / NULLIF(m.total_suministrado_m3, 0)) * 100 <= 30.0 THEN 'SIN_ALERTA'
        WHEN ((m.total_suministrado_m3 - m.total_facturado_m3) / NULLIF(m.total_suministrado_m3, 0)) * 100 <= 40.0 THEN 'AMARILLA'
        WHEN ((m.total_suministrado_m3 - m.total_facturado_m3) / NULLIF(m.total_suministrado_m3, 0)) * 100 <= 50.0 THEN 'NARANJA'
        WHEN ((m.total_suministrado_m3 - m.total_facturado_m3) / NULLIF(m.total_suministrado_m3, 0)) * 100 > 50.0  THEN 'ROJA'
        ELSE 'SIN_DATO'
    END                                                     AS banda_alerta_s4,
    
    SYSDATE                                                 AS fecha_extraccion_sui
FROM agregado_municipal m
ORDER BY m.divipola;
