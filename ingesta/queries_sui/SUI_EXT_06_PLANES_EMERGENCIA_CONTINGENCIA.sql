-- =============================================================================
-- PROYECTO: Vigía El Niño · Acueductos (CRA)
-- QUERY_ID: SUI_EXT_06_PLANES_EMERGENCIA_CONTINGENCIA
-- VERSION: 1.0.0
-- DOMINIO: GESTION_RIESGO_PEC
-- FUENTE: SUI Oracle (SSPD) / MinVivienda - Módulo de Planes de Contingencia
-- INDICADOR ASOCIADO: R-1 (Planes de Emergencia y Contingencia - PEC Reportado)
-- DESCRIPCIÓN:
--   Verifica si los prestadores de acueducto activos en cada municipio cuentan
--   con su Plan de Emergencia y Contingencia (PEC) debidamente radicado,
--   actualizado y vigente ante la SSPD, de acuerdo con el Decreto 1077 de 2015
--   y la Resolución MinVivienda 0549 de 2020.
--
-- REGLA DE EVALUACIÓN MUNICIPAL (specs/indicadores.md):
--   - R-1 Municipal = 1 si y solo si el 100 % de los prestadores con APS urbana
--     en el municipio tienen PEC vigente.
--   - Si al menos un prestador no ha radicado o tiene PEC vencido, R-1 Municipal = 0.
--   - Si ningún prestador reporta en la base o no hay información, el valor queda 'SIN_DATO'.
--
-- IMPACTO EN ICR (specs/indice-riesgo.md RF-ICR-03):
--   - R-1 = 1 (Con PEC al día) -> Puntaje de riesgo 0.
--   - R-1 = 0 (Sin PEC o incompleto) -> Puntaje de riesgo 100.
--
-- PARÁMETROS:
--   :fecha_corte -> Fecha actual de corte en formato 'YYYY-MM-DD' (ej. '2026-10-08')
-- =============================================================================

WITH prestadores_municipio AS (
    SELECT DISTINCT
        p.ID_EMPRESA                                        AS id_prestador_rups,
        p.NOMBRE_COMERCIAL                                  AS nombre_prestador,
        LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0')             AS divipola
    FROM SUI_AAA.EMPRESAS_PRESTADORAS p
    JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps 
        ON p.ID_EMPRESA = aps.ID_EMPRESA
    WHERE aps.SERVICIO = 'ACU'
      AND p.ESTADO_EMPRESA = 'ACTIVA'
),
estado_pec_prestador AS (
    SELECT 
        pm.divipola,
        pm.id_prestador_rups,
        pm.nombre_prestador,
        pec.NUMERO_RADICADO                                 AS radicado_pec,
        pec.FECHA_RADICACION                                AS fecha_radicacion,
        pec.FECHA_VENCIMIENTO                               AS fecha_vencimiento,
        pec.ESTADO_APROBACION                               AS estado_aprobacion,
        
        -- Condición de vigencia: Radicado + Vigente a la fecha de corte + Aprobado
        CASE 
            WHEN pec.NUMERO_RADICADO IS NOT NULL 
             AND pec.FECHA_VENCIMIENTO >= TO_DATE(:fecha_corte, 'YYYY-MM-DD')
             AND pec.ESTADO_APROBACION IN ('APROBADO', 'RADICADO_VALIDO') 
            THEN 1 
            ELSE 0 
        END                                                 AS tiene_pec_vigente
    FROM prestadores_municipio pm
    LEFT JOIN SUI_AAA.GESTION_RIESGO_PEC pec 
        ON pm.id_prestador_rups = pec.ID_EMPRESA
),
consolidado_municipal_r1 AS (
    SELECT 
        divipola,
        COUNT(id_prestador_rups)                            AS total_prestadores_municipio,
        SUM(tiene_pec_vigente)                              AS prestadores_con_pec_vigente,
        SUM(CASE WHEN tiene_pec_vigente = 0 THEN 1 ELSE 0 END) AS prestadores_incumplidos,
        MAX(fecha_radicacion)                               AS fecha_radicacion_mas_reciente
    FROM estado_pec_prestador
    GROUP BY divipola
)
SELECT 
    c.divipola,
    :fecha_corte                                            AS fecha_corte,
    c.total_prestadores_municipio,
    c.prestadores_con_pec_vigente,
    c.prestadores_incumplidos,
    
    -- Indicador R-1 binario municipal
    CASE 
        WHEN c.total_prestadores_municipio > 0 AND c.prestadores_incumplidos = 0 THEN 1
        WHEN c.total_prestadores_municipio > 0 AND c.prestadores_incumplidos > 0 THEN 0
        ELSE NULL 
    END                                                     AS valor_indicador_r1_pec_reportado,
    
    -- Puntaje normalizado para la Capa R (RF-ICR-03)
    CASE 
        WHEN c.prestadores_incumplidos = 0 THEN 0   -- Óptimo: 0 puntos de riesgo
        WHEN c.prestadores_incumplidos > 0 THEN 100 -- Alarma: 100 puntos de riesgo por falta de plan
        ELSE NULL 
    END                                                     AS puntaje_riesgo_r1,
    
    c.fecha_radicacion_mas_reciente,
    SYSDATE                                                 AS fecha_extraccion_sui
FROM consolidado_municipal_r1 c
ORDER BY c.divipola;
