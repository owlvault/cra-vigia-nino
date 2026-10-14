-- =============================================================================
-- PROYECTO: Vigía El Niño · Acueductos (CRA)
-- QUERY_ID: SUI_EXT_05_PQR_DESABASTECIMIENTO
-- VERSION: 1.0.0
-- DOMINIO: RECLAMACIONES_PQR
-- FUENTE: SUI Oracle (SSPD) - Registro de PQR por Causal
-- INDICADOR ASOCIADO: S-5 (Variación de PQR por falta de servicio - %)
-- DESCRIPCIÓN:
--   Extrae las Peticiones, Quejas y Reclamos radicadas por los usuarios ante
--   los prestadores de acueducto clasificadas específicamente en las causales
--   asociadas a la prestación deficiente por sequía: 'FALTA_DE_SERVICIO',
--   'SUSPENSION_NO_PROGRAMADA', 'BAJA_PRESION' e 'INTERMITENCIA'.
--   Compara el volumen del mes corriente contra el mismo mes del año anterior
--   para calcular la variación porcentual interanual (S-5).
--
-- FÓRMULA OFICIAL (specs/indicadores.md):
--   S-5 (%) = ((PQR_mes_actual - PQR_mismo_mes_ano_anterior) / PQR_mismo_mes_ano_anterior) * 100
--
-- MANEJO DE CASOS BORDE:
--   - Si PQR año anterior = 0 y PQR mes actual > 0: Se fija en valor extremo (+300.0%).
--   - Si PQR año anterior = 0 y PQR mes actual = 0: Se fija en 0.0%.
--
-- PARÁMETROS:
--   :period_id      -> Periodo mensual actual en formato 'YYYY-MM' (ej. '2026-08')
--   :prev_period_id -> Periodo mensual comparativo año anterior (ej. '2025-08')
-- =============================================================================

WITH pqr_filtradas AS (
    SELECT 
        r.ID_EMPRESA                                        AS id_prestador_rups,
        LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0')             AS divipola,
        r.PERIODO                                           AS periodo_reporte,
        r.CAUSAL_RECLAMO                                    AS causal_reclamo,
        COUNT(r.NUMERO_RADICADO)                            AS conteo_pqr
    FROM SUI_AAA.PQR_USUARIOS r
    JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps 
        ON r.ID_EMPRESA = aps.ID_EMPRESA AND r.ID_APS = aps.ID_APS
    WHERE r.SERVICIO = 'ACU'
      AND r.PERIODO IN (:period_id, :prev_period_id)
      AND r.CAUSAL_RECLAMO IN (
          'FALTA_DE_SERVICIO',
          'SUSPENSION_NO_PROGRAMADA',
          'BAJA_PRESION',
          'INTERMITENCIA',
          'DESABASTECIMIENTO'
      )
    GROUP BY 
        r.ID_EMPRESA, 
        LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0'), 
        r.PERIODO, 
        r.CAUSAL_RECLAMO
),
conteo_por_periodo AS (
    SELECT 
        divipola,
        SUM(CASE WHEN periodo_reporte = :period_id THEN conteo_pqr ELSE 0 END)      AS pqr_mes_actual,
        SUM(CASE WHEN periodo_reporte = :prev_period_id THEN conteo_pqr ELSE 0 END) AS pqr_mes_anterior
    FROM pqr_filtradas
    GROUP BY divipola
)
SELECT 
    c.divipola,
    :period_id                                              AS periodo_actual,
    :prev_period_id                                         AS periodo_base_anterior,
    c.pqr_mes_actual,
    c.pqr_mes_anterior,
    
    -- Indicador S-5: Variación interanual de PQR (%)
    CASE 
        WHEN c.pqr_mes_anterior > 0 THEN 
            ROUND(((c.pqr_mes_actual - c.pqr_mes_anterior) / c.pqr_mes_anterior) * 100, 2)
        WHEN c.pqr_mes_anterior = 0 AND c.pqr_mes_actual > 0 THEN 
            300.00 -- Disparo extremo según regla de caso borde
        ELSE 
            0.00
    END                                                     AS valor_indicador_s5_var_pqr_pct,
    
    -- Clasificación según umbrales CRA:
    -- Óptimo: 0% -> 0; Amarilla: 25% -> 40; Naranja: 50% -> 60; Roja: 100% -> 75; Extremo: >= 300% -> 100
    CASE 
        WHEN c.pqr_mes_anterior = 0 AND c.pqr_mes_actual = 0 THEN 'SIN_ALERTA'
        WHEN c.pqr_mes_anterior > 0 AND ((c.pqr_mes_actual - c.pqr_mes_anterior) / c.pqr_mes_anterior) * 100 <= 25.0 THEN 'SIN_ALERTA'
        WHEN c.pqr_mes_anterior > 0 AND ((c.pqr_mes_actual - c.pqr_mes_anterior) / c.pqr_mes_anterior) * 100 <= 50.0 THEN 'AMARILLA'
        WHEN c.pqr_mes_anterior > 0 AND ((c.pqr_mes_actual - c.pqr_mes_anterior) / c.pqr_mes_anterior) * 100 <= 100.0 THEN 'NARANJA'
        ELSE 'ROJA'
    END                                                     AS banda_alerta_s5,
    
    SYSDATE                                                 AS fecha_extraccion_sui
FROM conteo_por_periodo c
ORDER BY c.divipola;
