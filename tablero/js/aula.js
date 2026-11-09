/**
 * AULA EL NIÑO — MICROSITIO PEDAGÓGICO DEL TABLERO VIGÍA (CRA)
 * ---------------------------------------------------------------------------
 * Módulos:
 *   1. ¿Qué es El Niño?            (simulador del Pacífico, regiones Niño, escala ONI)
 *   2. Modelo de afectación         (cadena causal, 4 capas del ICR, simulador ICR)
 *   3. ¿Qué monitorear?             (señales tempranas vs. impacto, explorador de indicadores)
 *   4. ¿Qué hacer?                  (protocolo por nivel y actor, matriz Si→Entonces, diagnóstico guiado)
 *   5. Ponte a prueba               (autoevaluación + glosario)
 *
 * Fuentes internas reutilizadas (sin duplicar datos):
 *   - window.VIGIA_DATA.corte              → valores del corte vigente
 *   - window.CATALOGO_INDICADORES_MASTER   → umbrales, unidades, fuentes (app.js)
 *   - window.CATALOGO_DIVULGACION_CIUDADANA→ lenguaje sencillo (app.js)
 * Lógica del ICR replicada de ingesta/pipeline_corte.py (RF-ICR-01 a RF-ICR-06).
 */
(function () {
  'use strict';

  /* =========================================================================
     CONSTANTES DEL MODELO (fiel a ingesta/pipeline_corte.py)
     ========================================================================= */
  // Pesos y quiebres de la config publicada por el pipeline (data.js → config_icr); respaldo v1.2.0-20261108
  const CONFIG = (window.VIGIA_DATA && window.VIGIA_DATA.config_icr) || null;
  const PESOS = CONFIG
    ? Object.fromEntries(Object.entries(CONFIG.capas).map(([k, c]) => [k, c.peso]))
    : { A: 0.30, H: 0.30, S: 0.25, R: 0.15 };
  const QUIEBRES = (CONFIG && CONFIG.quiebres) || {};
  // Valor del indicador en un puntaje de quiebre (60 = inicio de naranja), en formato es-CO
  const quiebre = (cod, pts, respaldo) => {
    const par = (QUIEBRES[cod] || []).find(([, p]) => p === pts);
    return par ? String(par[0]).replace('.', ',').replace('-', '−') : respaldo;
  };
  const pesoTxt = k => `${Math.round(PESOS[k] * 100)} %`;
  const pesoDec = k => PESOS[k].toFixed(2).replace('.', ',');

  const COMPOSICION_ICR = {
    A: { cods: ['A-3', 'A-4', 'H-1'], regla: 'Promedio de A-3, A-4 y H-1' },
    H: { cods: ['H-2', 'H-3', 'H-4'], regla: 'Promedio de H-2, H-3 y H-4' },
    S: { cods: ['S-1', 'S-2', 'S-3', 'S-4', 'S-5'], regla: 'Promedio de S-1 a S-5' },
    R: { cods: ['R-1', 'R-2', 'R-3', 'R-4'], regla: 'Máximo entre R-1 y R-4' }
  };
  const CODS_EN_CALCULO = new Set(Object.values(COMPOSICION_ICR).flatMap(c => c.cods));
  const CODS_CONTEXTO = ['A-1', 'A-2', 'A-5', 'H-5', 'S-6'];

  const NIVELES = {
    sin_alerta: { nombre: 'Sin alerta', rango: 'ICR < 40', color: '#2E7D4F', resumen: 'Operación normal. El sistema resiste la sequía con sus propios medios.' },
    amarilla:   { nombre: 'Amarilla',   rango: '40 ≤ ICR < 60', color: '#C79E00', resumen: 'Vigilancia. Aparece déficit hídrico: es momento de prepararse, no de improvisar.' },
    naranja:    { nombre: 'Naranja',    rango: '60 ≤ ICR < 75', color: '#E07A10', resumen: 'Alerta alta. El servicio ya se deteriora o hay impacto confirmado (racionamiento o calamidad).' },
    roja:       { nombre: 'Roja',       rango: 'ICR ≥ 75', color: '#B3261E', resumen: 'Alerta máxima. Riesgo de colapso del suministro: se requiere apoyo externo inmediato.' },
    sin_dato:   { nombre: 'Sin dato',   rango: 'Cobertura < 60 %', color: '#B9C4CC', resumen: 'No hay información suficiente para calcular el ICR con confianza.' }
  };

  const NOMBRE_CAPA = {
    A: 'Amenaza hidroclimática',
    H: 'Vulnerabilidad de la oferta hídrica',
    S: 'Desempeño del servicio',
    R: 'Respuesta e impacto confirmado'
  };

  /* Cadencia sugerida de revisión por indicador */
  const CADENCIA = {
    'A-1': 'Semanal', 'A-2': 'Mensual', 'A-3': 'Diaria', 'A-4': 'Diaria', 'A-5': 'Diaria',
    'H-1': 'Diaria', 'H-2': 'Estructural (ENA)', 'H-3': 'Estructural (ENA)', 'H-4': 'Mensual', 'H-5': 'Diaria',
    'S-1': 'Mensual', 'S-2': 'Mensual', 'S-3': 'Anual', 'S-4': 'Mensual', 'S-5': 'Mensual', 'S-6': 'Mensual',
    'R-1': 'Al inicio de temporada', 'R-2': 'Diaria', 'R-3': 'Diaria', 'R-4': 'Diaria'
  };

  /* Tipo de señal (anticipación) */
  const ANTICIPACION = [
    { id: 'meses',   ico: '🌊', titulo: 'Señal oceánica',    cuando: 'Meses antes',   cods: ['A-1', 'A-2'],
      texto: 'Avisan que viene la sequía. Dan tiempo para planear, revisar el PEC y asegurar fuentes alternas.' },
    { id: 'semanas', ico: '☀️', titulo: 'Señal atmosférica', cuando: 'Semanas antes', cods: ['A-3', 'A-4', 'A-5'],
      texto: 'Confirman que la lluvia ya falta en el territorio. Es hora de ahorrar y vigilar de cerca las fuentes.' },
    { id: 'dias',    ico: '🏞️', titulo: 'Señal en la fuente', cuando: 'Días a semanas', cods: ['H-1', 'H-4', 'H-5'],
      texto: 'Muestran cuánta agua queda para captar y almacenar. Disparan las fases operativas del PEC.' },
    { id: 'impacto', ico: '🚰', titulo: 'Señal de impacto',  cuando: 'Ya está ocurriendo', cods: ['S-1', 'S-2', 'S-5', 'S-6', 'R-2', 'R-3', 'R-4'],
      texto: 'El usuario ya siente la sequía. Se gestiona la emergencia y se protege a la población.' }
  ];
  const ESTRUCTURALES = ['H-2', 'H-3', 'S-3', 'S-4', 'R-1'];

  /* Cadena causal (modelo de afectación) */
  const CADENA = [
    { ico: '🌊', titulo: 'El océano Pacífico se calienta', rezago: 'Mes 0', cods: ['A-1', 'A-2'],
      detalle: '<strong>Origen de la amenaza.</strong> El agua superficial del Pacífico ecuatorial se calienta por encima de lo normal y se debilitan los vientos alisios. Lo detectan la NOAA y el IRI con boyas y satélites. <em>Aún no falta agua en Colombia, pero el reloj ya empezó a correr.</em>' },
    { ico: '☁️', titulo: 'Cambia la atmósfera: menos lluvia y más calor', rezago: '1 – 3 meses', cods: ['A-3', 'A-4', 'A-5'],
      detalle: '<strong>Transmisión atmosférica.</strong> Las nubes de lluvia se desplazan hacia el Pacífico central. En Colombia llueve menos de lo normal (sobre todo en las regiones Caribe y Andina), sube la temperatura y aumentan los incendios forestales en las cuencas.' },
    { ico: '🏞️', titulo: 'Las cuencas y fuentes pierden agua', rezago: '2 – 4 meses', cods: ['H-1', 'H-2', 'H-3', 'H-5'],
      detalle: '<strong>Afectación de la oferta.</strong> Sin lluvia, el suelo se seca y los ríos y quebradas reducen su caudal. Las cuencas frágiles (alta vulnerabilidad IVH) o muy presionadas por otros usos (IUA alto) se agotan primero. Los embalses comienzan a descender.' },
    { ico: '🚰', titulo: 'El acueducto se estresa', rezago: '3 – 6 meses', cods: ['H-4', 'S-1', 'S-2', 'S-3', 'S-4', 'S-6'],
      detalle: '<strong>Afectación del servicio.</strong> La bocatoma capta menos, los tanques no alcanzan a llenarse y se reducen las horas de servicio. El agua llega más turbia y la calidad (IRCA) puede empeorar. Las redes con muchas fugas (IANC alto) pierden agua que ya no sobra.' },
    { ico: '🏘️', titulo: 'La comunidad siente el impacto y se responde', rezago: '4 – 8 meses', cods: ['S-5', 'R-1', 'R-2', 'R-3', 'R-4'],
      detalle: '<strong>Impacto y respuesta.</strong> Aumentan los reclamos, se imponen turnos de racionamiento, llegan carrotanques y, si la capacidad local se desborda, la alcaldía declara calamidad pública (Ley 1523 de 2012). Un municipio con PEC vigente responde mucho mejor.' }
  ];

  /* Matriz Si → Entonces (acción por indicador) */
  const MATRIZ = [
    { cod: 'A-1', si: 'ONI / Niño 3.4 ≥ +1.5 °C', nivel: 'amarilla', entonces: 'Activar la fase de alistamiento: revisar vigencia de los PEC, inventariar fuentes alternas (pozos, carrotanques) y comunicar el escenario a prestadores de municipios vulnerables.' },
    { cod: 'A-2', si: 'Probabilidad de evento muy fuerte ≥ 65 %', nivel: 'amarilla', entonces: 'Construir escenarios de déficit a 3–6 meses y priorizar municipios con cuencas frágiles (H-2, H-3 altos) y baja autonomía (H-4).' },
    { cod: 'A-3', si: `Déficit de lluvia 30 días ≤ ${quiebre('A-3', 60, '−40')} %`, nivel: 'naranja', entonces: 'Intensificar campañas de uso eficiente y aumentar la frecuencia de aforo de caudal en las bocatomas.' },
    { cod: 'A-4', si: `Días secos consecutivos ≥ ${quiebre('A-4', 60, '20')}`, nivel: 'naranja', entonces: 'Preparar la sectorización del suministro y verificar el estado de bombas y captaciones alternas.' },
    { cod: 'A-5', si: 'Focos de calor en la microcuenca ≥ 8 (7 días)', nivel: 'naranja', entonces: 'Coordinar con CAR, bomberos y CMGRD la protección de la cuenca; anticipar picos de turbiedad y ajustar la dosificación en planta.' },
    { cod: 'H-1', si: `Caudal en bocatoma ≤ ${quiebre('H-1', 60, '50')} % de lo normal`, nivel: 'naranja', entonces: 'Activar la fase de alerta del PEC: turnos sectorizados, puesta en marcha de fuentes alternas y reporte a la SSPD.' },
    { cod: 'H-4', si: `Autonomía de tanques ≤ ${quiebre('H-4', 60, '12')} horas`, nivel: 'naranja', entonces: 'Optimizar llenado y operación de tanques, priorizar sectores altos y usuarios sensibles, y alistar abastecimiento alterno.' },
    { cod: 'H-5', si: 'Volumen útil de embalse ≤ 32 %', nivel: 'naranja', entonces: 'Coordinar con el operador del embalse caudales mínimos y adoptar medidas de ahorro obligatorio en el sistema abastecido.' },
    { cod: 'S-1', si: `Continuidad ≤ ${quiebre('S-1', 60, '18')} horas/día`, nivel: 'naranja', entonces: 'Publicar y socializar el esquema de turnos, garantizar suministro a hospitales, escuelas y hogares de cuidado; seguimiento especial SSPD.' },
    { cod: 'S-2', si: `IRCA ≥ ${quiebre('S-2', 60, '14')} % (riesgo medio o mayor)`, nivel: 'naranja', entonces: 'Muestreo intensivo, revisión de procesos de potabilización y alerta sanitaria (recomendar hervir el agua). Si IRCA > 35 %: agua no apta.' },
    { cod: 'S-4', si: `Agua no contabilizada (IANC) ≥ ${quiebre('S-4', 60, '40')} %`, nivel: 'naranja', entonces: 'Programa urgente de detección y reparación de fugas, control de presiones y de conexiones no autorizadas.' },
    { cod: 'S-5', si: `Reclamos por fallas (PQR) ≥ +${quiebre('S-5', 60, '50')} % vs. año anterior`, nivel: 'naranja', entonces: 'Reforzar la atención y comunicación al usuario e identificar los sectores con fallas recurrentes.' },
    { cod: 'R-1', si: 'PEC no vigente / no radicado (= 0)', nivel: 'naranja', entonces: 'Requerir al prestador la actualización y radicación inmediata del Plan de Emergencia y Contingencia.' },
    { cod: 'R-2', si: 'Carrotanques operando (= 1)', nivel: 'naranja', entonces: 'Verificar calidad del agua distribuida, cobertura de los puntos de entrega y costos del esquema de abastecimiento alterno.' },
    { cod: 'R-3', si: 'Racionamiento oficial (= 1)', nivel: 'naranja', entonces: 'Regla de piso: el municipio pasa como mínimo a Naranja. Exigir transparencia en los turnos y equidad entre sectores.' },
    { cod: 'R-4', si: 'Calamidad pública vigente (= 1)', nivel: 'roja', entonces: 'Máxima prioridad: articulación CRA – MinVivienda – UNGRD – SSPD y evaluación de medidas regulatorias transitorias.' }
  ];
  const ACCION_POR_COD = Object.fromEntries(MATRIZ.map(m => [m.cod, m.entonces]));

  /* Protocolo de actuación por nivel y actor */
  const PROTOCOLO = {
    sin_alerta: {
      disparador: 'ICR menor a 40 y sin racionamiento ni calamidad vigentes.',
      actores: {
        cra: ['Mantener el monitoreo ordinario en el ciclo diario del Vigía.', 'Seguimiento preventivo a micromedición y preservación de fuentes.'],
        prestador: ['Mantener actualizado y radicado el PEC.', 'Ejecutar mantenimiento preventivo y control de pérdidas.'],
        alcaldia: ['Incluir la sequía en el plan municipal de gestión del riesgo.', 'Proteger y reforestar las microcuencas abastecedoras.'],
        ciudadania: ['Uso responsable del agua en el día a día.', 'Reportar fugas en la vía pública.']
      },
      pie: 'Objetivo: llegar preparados. Lo que se hace en verde define cuánto se sufre en rojo.'
    },
    amarilla: {
      disparador: 'ICR entre 40 y 59,9. Aparece déficit de lluvia o descenso de caudales.',
      actores: {
        cra: ['Seguimiento preventivo a la evolución de caudales en fuentes abastecedoras.', 'Verificar radicación y aprobación del PEC del prestador.', 'Impulsar campañas de uso eficiente y ahorro del agua.'],
        prestador: ['Activar la fase de preparación del PEC.', 'Aumentar la frecuencia de aforos y de muestreo de calidad.', 'Alistar fuentes alternas (pozos, interconexiones).'],
        alcaldia: ['Convocar el Consejo Municipal de Gestión del Riesgo (CMGRD).', 'Identificar población y usuarios sensibles (hospitales, escuelas).'],
        ciudadania: ['Reducir consumos no esenciales (lavado de carros, riego).', 'Almacenar agua de forma segura y tapada.']
      },
      pie: 'Objetivo: ganar tiempo. Cada litro ahorrado hoy alarga la autonomía del sistema.'
    },
    naranja: {
      disparador: 'ICR entre 60 y 74,9, o racionamiento (R-3) o calamidad (R-4) confirmados (regla de piso).',
      actores: {
        cra: ['Requerir al prestador el cronograma de turnos de racionamiento sectorizado.', 'Verificar protocolos de desinfección y muestreo intensivo de calidad (IRCA).', 'Seguimiento especial a la reducción de pérdidas (S-4).'],
        prestador: ['Activar la fase de alerta del PEC: sectorización y turnos.', 'Poner en operación fuentes alternas y obras de contingencia.', 'Informar a los usuarios horarios y puntos de abastecimiento.'],
        alcaldia: ['Sesión permanente del CMGRD.', 'Gestionar carrotanques y priorizar usuarios sensibles.', 'Evaluar la necesidad de declarar calamidad pública.'],
        ciudadania: ['Respetar los turnos y horarios.', 'Hervir el agua si hay alerta sanitaria.', 'Usar solo canales oficiales de información.']
      },
      pie: 'Objetivo: proteger el servicio esencial y la salud. El impacto ya es visible para la población.'
    },
    roja: {
      disparador: 'ICR igual o mayor a 75. Riesgo de colapso del suministro.',
      actores: {
        cra: ['Priorización inmediata en Mesa Técnica Nacional de Agua (CRA – MinVivienda – UNGRD).', 'Revisión de costos transitorios de abastecimiento alterno (carrotanques, plantas portátiles).', 'Monitoreo diario de continuidad y caudales con la SSPD.', 'Evaluar medidas tarifarias de contingencia según el marco regulatorio vigente.'],
        prestador: ['Activar la fase de emergencia del PEC.', 'Abastecimiento alterno organizado y con control de calidad.', 'Reporte diario de la situación a SSPD y autoridades.'],
        alcaldia: ['Declarar calamidad pública (Ley 1523 de 2012) si la capacidad local se desborda.', 'Solicitar apoyo departamental y nacional (UNGRD).', 'Coordinar ayuda humanitaria y salud pública.'],
        ciudadania: ['Consumir solo agua de fuentes seguras o tratada.', 'Priorizar agua para beber, cocinar e higiene.', 'Apoyar a vecinos vulnerables (adultos mayores, niños).']
      },
      pie: 'Objetivo: evitar el colapso y proteger la vida. Se requiere la acción coordinada de todos los niveles del Estado.'
    }
  };

  const ACTORES = [
    { id: 'cra', ico: '⚖️', nombre: 'CRA (Regulador)' },
    { id: 'prestador', ico: '🏭', nombre: 'Prestador del servicio' },
    { id: 'alcaldia', ico: '🏛️', nombre: 'Alcaldía y CMGRD' },
    { id: 'ciudadania', ico: '👪', nombre: 'Ciudadanía' }
  ];

  const SIM_ESTADOS = {
    neutro: {
      titulo: 'Condición neutra', chip: 'Normal',
      puntos: [
        'Los vientos alisios soplan de este a oeste y acumulan agua cálida en el Pacífico occidental.',
        'Frente a Sudamérica aflora agua fría y profunda, rica en nutrientes.',
        'Las nubes de lluvia se concentran sobre Indonesia y el Pacífico occidental.'
      ],
      colombia: '<strong>En Colombia:</strong> lluvias dentro de lo normal para cada temporada.'
    },
    nino: {
      titulo: 'El Niño (fase cálida)', chip: 'Fase cálida',
      puntos: [
        'Los vientos alisios se debilitan e incluso pueden invertirse.',
        'El agua cálida se desplaza hacia el Pacífico central y oriental; la termoclina se aplana y se reduce el afloramiento frío.',
        'Las nubes de lluvia se mueven hacia el centro del océano, lejos del norte de Sudamérica.'
      ],
      colombia: '<strong>En Colombia:</strong> menos lluvias y más calor, sobre todo en las regiones Caribe y Andina → ríos y embalses bajan y aumenta el riesgo de desabastecimiento.'
    },
    nina: {
      titulo: 'La Niña (fase fría)', chip: 'Fase fría',
      puntos: [
        'Los vientos alisios se intensifican.',
        'Se refuerza el afloramiento de agua fría frente a Sudamérica y la termoclina se inclina más.',
        'Las lluvias se intensifican en el Pacífico occidental y el norte de Sudamérica.'
      ],
      colombia: '<strong>En Colombia:</strong> exceso de lluvias → inundaciones, deslizamientos y alta turbiedad en las fuentes (otro riesgo para los acueductos).'
    }
  };

  const QUIZ = [
    { p: '¿Qué ocurre en el océano Pacífico durante un evento El Niño?',
      ops: ['Las aguas del Pacífico ecuatorial central y oriental se calientan por encima de lo normal.', 'El océano se enfría y aumentan las lluvias en Colombia.', 'Se intensifican los vientos alisios.', 'Sube el nivel del mar en el Caribe colombiano.'],
      ok: 0, exp: 'El Niño es la fase cálida del ENSO: el agua superficial del Pacífico ecuatorial central y oriental se calienta y los alisios se debilitan.' },
    { p: '¿Cuál es la región oceánica que funciona como "termómetro oficial" para declarar El Niño?',
      ops: ['Niño 1+2', 'Niño 3', 'Niño 3.4', 'Niño 4'],
      ok: 2, exp: 'La región Niño 3.4 (5° N–5° S, 170° O–120° O) y su promedio trimestral (ONI) son el estándar internacional oficial de NOAA, OMM e IDEAM porque sus anomalías se acoplan a la circulación de Walker y anticipan las sequías en Colombia.' },
    { p: 'Un municipio tiene ICR = 52 (amarilla), pero la alcaldía acaba de decretar racionamiento (R-3 = 1). ¿Qué nivel muestra el tablero?',
      ops: ['Amarilla, porque el ICR es 52.', 'Naranja, por la regla de piso de impacto confirmado.', 'Roja automáticamente.', 'Sin dato hasta el próximo corte.'],
      ok: 1, exp: 'Regla de piso (RF-ICR-06): si hay racionamiento (R-3) o calamidad (R-4) vigentes, el nivel mínimo es Naranja, aunque el puntaje sea menor.' },
    { p: '¿Cuál de estos indicadores es una señal TEMPRANA (avisa con meses de anticipación)?',
      ops: ['S-5 Reclamos por fallas (PQR)', 'R-3 Racionamiento oficial', 'A-1 Anomalía de temperatura del mar (ONI)', 'S-1 Continuidad del servicio'],
      ok: 2, exp: 'A-1 se mueve meses antes de que falte el agua. S-1, S-5 y R-3 son señales de impacto: indican que la sequía ya llegó a los hogares.' },
    { p: 'El caudal de la bocatoma (H-1) cae al 38 % de lo normal. ¿Cuál es la acción más adecuada?',
      ops: ['Esperar a que se declare calamidad pública.', 'Activar la fase de alerta del PEC: sectorización, fuentes alternas y reporte a la SSPD.', 'No hacer nada hasta que bajen las horas de servicio.', 'Suspender el muestreo de calidad del agua.'],
      ok: 1, exp: `Un caudal por debajo del ${quiebre('H-1', 60, '50')} % ya es naranja (y bajo el ${quiebre('H-1', 75, '30')} % sería rojo): hay que activar el PEC antes de que el usuario pierda el servicio.` },
    { p: '¿Qué capa del ICR tiene el menor peso en el cálculo?',
      ops: [`A · Amenaza (${pesoTxt('A')})`, `H · Oferta hídrica (${pesoTxt('H')})`, `S · Servicio (${pesoTxt('S')})`, `R · Respuesta e impacto (${pesoTxt('R')})`],
      ok: 3, exp: `R pesa ${pesoTxt('R')} porque refleja hechos ya confirmados; además, su efecto se refuerza con la regla de piso a Naranja.` }
  ];

  const GLOSARIO = [
    ['ENSO', 'El Niño – Oscilación del Sur. Ciclo natural de calentamiento (El Niño) y enfriamiento (La Niña) del Pacífico ecuatorial acoplado con la atmósfera.'],
    ['Regiones Niño (1+2, 3, 3.4, 4)', 'Cuatro zonas del Pacífico ecuatorial estandarizadas por NOAA/OMM para medir la temperatura superficial del mar (TSM). Niño 3.4 es el índice rector global (ONI); Niño 1+2 vigila el calentamiento costero (Ecuador/Perú); Niño 3 los eventos canónicos orientales y Niño 4 los eventos Modoki en el centro del océano.'],
    ['Niño 3.4', 'Región central del Pacífico ecuatorial (5° N–5° S, 170° O–120° O). Es el estándar de monitoreo climático global más sensible a la circulación de Walker y el índice que utiliza el IDEAM para evaluar la amenaza de sequía en los acueductos colombianos.'],
    ['El Niño Costero', 'Evento anómalo de calentamiento centrado en la región Niño 1+2 (costas de Ecuador y norte de Perú). Detona intensas precipitaciones e inundaciones locales y cambios térmicos en el litoral Pacífico, con independencia de si existe o no un evento global en Niño 3.4.'],
    ['El Niño Modoki', 'Variante de El Niño caracterizada por un calentamiento anómalo en el Pacífico central (región Niño 4) con aguas más frías hacia el este y oeste, desplazando los centros de lluvia de forma atípica respecto al Niño canónico.'],
    ['ONI', 'Índice Oceánico de El Niño: promedio móvil de 3 meses de la anomalía de temperatura en la región Niño 3.4. Valores ≥ +0,5 °C indican condición El Niño.'],
    ['Anomalía', 'Diferencia entre el valor observado y el promedio histórico de referencia (p. ej. 1991‑2020). Una anomalía de +2 °C significa 2 °C por encima de lo normal.'],
    ['Vientos alisios', 'Vientos que soplan de este a oeste sobre el Pacífico tropical. Cuando se debilitan, el agua cálida se desplaza hacia Sudamérica.'],
    ['Termoclina', 'Capa del océano donde la temperatura cambia bruscamente entre el agua cálida superficial y la fría profunda.'],
    ['Bocatoma', 'Estructura que capta el agua del río o quebrada para llevarla a la planta de tratamiento del acueducto.'],
    ['IVH', 'Índice de Vulnerabilidad al Desabastecimiento Hídrico (IDEAM, ENA). Mide la fragilidad de una cuenca para mantener la oferta en temporada seca.'],
    ['IUA', 'Índice de Uso del Agua (IDEAM, ENA). Relación entre la demanda de todos los usuarios y el agua disponible en la cuenca.'],
    ['IRCA', 'Índice de Riesgo de la Calidad del Agua para consumo humano (Res. 2115 de 2007). 0‑5 % sin riesgo; > 35 % agua no apta.'],
    ['IANC', 'Índice de Agua No Contabilizada: porcentaje del agua producida que se pierde (fugas, conexiones no autorizadas) antes de facturarse.'],
    ['PEC', 'Plan de Emergencia y Contingencia del prestador: define fases, responsables y recursos para responder a eventos como la sequía.'],
    ['CMGRD', 'Consejo Municipal de Gestión del Riesgo de Desastres, presidido por el alcalde (Ley 1523 de 2012).'],
    ['UNGRD', 'Unidad Nacional para la Gestión del Riesgo de Desastres. Coordina el apoyo nacional en emergencias.'],
    ['Calamidad pública', 'Declaratoria del alcalde cuando un evento desborda la capacidad local. Habilita recursos y apoyo extraordinarios.'],
    ['ICR', 'Índice Compuesto de Riesgo del Vigía (0 a 100). Integra las capas A, H, S y R para priorizar municipios.'],
    ['Regla de piso', 'Si hay racionamiento (R-3) o calamidad (R-4) vigentes, el municipio queda como mínimo en Naranja, sin importar su ICR.']
  ];

  /* =========================================================================
     UTILIDADES
     ========================================================================= */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmt = (n, d = 1) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signo = n => (n > 0 ? '+' : '') + fmt(n, 1);

  function catalogo() { return window.CATALOGO_INDICADORES_MASTER || []; }
  function ind(cod) { return catalogo().find(i => i.codigo === cod) || { codigo: cod, capa: cod[0], nombre: cod, umbrales: {} }; }
  function ciudadano(cod) { return (window.getExplicacionCiudadana && window.getExplicacionCiudadana(cod)) || {}; }

  function nivelPorIcr(icr) {
    if (icr === null || icr === undefined) return 'sin_dato';
    if (icr < 40) return 'sin_alerta';
    if (icr < 60) return 'amarilla';
    if (icr < 75) return 'naranja';
    return 'roja';
  }

  function colorAnomalia(a) {
    if (a < 0.5) return '#2E7D4F';
    if (a < 1.0) return '#C79E00';
    if (a < 1.5) return '#E07A10';
    if (a < 2.0) return '#D2531E';
    return '#B3261E';
  }

  function chipCod(cod) {
    return `<span class="au-cod" data-capa="${cod[0]}" title="${ind(cod).nombre}">${cod}</span>`;
  }

  /* Evalúa el nivel de un indicador municipal (usa puntaje 0‑100 si existe; si no, umbrales del catálogo) */
  function nivelIndicador(cod, dato) {
    if (!dato || dato.valor === null || dato.valor === undefined) return 'sin_dato';
    if (typeof dato.puntaje === 'number') return nivelPorIcr(dato.puntaje);
    const c = ind(cod);
    const u = c.umbrales || {};
    const v = Number(dato.valor);
    if (isNaN(v)) return 'sin_dato';
    const am = parseFloat(u.amarilla), na = parseFloat(u.naranja), ro = parseFloat(u.roja);
    if (c.dir === '↓') {
      if (v <= ro) return 'roja';
      if (v <= na) return 'naranja';
      if (v <= am) return 'amarilla';
      return 'sin_alerta';
    }
    if (v >= ro) return 'roja';
    if (v >= na) return 'naranja';
    if (v >= am) return 'amarilla';
    return 'sin_alerta';
  }

  /* Texto de umbral generado desde el catálogo (fuente única de verdad) */
  function textoUmbral(cod) {
    const c = ind(cod);
    const u = c.umbrales || {};
    const uni = c.unidad && !c.unidad.startsWith('binario') && c.unidad !== 'adimensional' ? ` ${c.unidad}` : '';
    if ((c.unidad || '').startsWith('binario')) {
      return c.dir === '↓' ? '<b>Alerta</b> cuando el valor es 0 (no cuenta con el plan).' : '<b>Alerta</b> cuando el valor es 1 (el evento está confirmado).';
    }
    const op = c.dir === '↓' ? '≤' : '≥';
    return `<b>Naranja</b> ${op} ${u.naranja}${uni} · <b style="color:var(--alerta-roja)">Roja</b> ${op} ${u.roja}${uni}`;
  }

  function espectro(cod) {
    const c = ind(cod);
    const u = c.umbrales || {};
    if ((c.unidad || '').startsWith('binario')) {
      const alerta = c.dir === '↓' ? '0' : '1';
      const normal = c.dir === '↓' ? '1' : '0';
      return `<div class="au-espectro" style="grid-template-columns:1fr 1fr">
        <div style="background:var(--alerta-sin)">${normal} · Normal</div>
        <div style="background:var(--alerta-naranja)">${alerta} · Alerta</div></div>`;
    }
    const op = c.dir === '↓' ? '≤' : '≥';
    const opN = c.dir === '↓' ? '>' : '<';
    return `<div class="au-espectro" aria-label="Umbrales de ${cod}">
      <div style="background:var(--alerta-sin)">${opN} ${u.amarilla}</div>
      <div style="background:#C79E00">${op} ${u.amarilla}</div>
      <div style="background:var(--alerta-naranja)">${op} ${u.naranja}</div>
      <div style="background:var(--alerta-roja)">${op} ${u.roja}</div></div>`;
  }

  function irAVista(v) {
    const tab = document.querySelector(`.nav-tab-btn[data-vista="${v}"]`);
    if (tab) tab.click();
  }

  /* =========================================================================
     PLANTILLAS HTML
     ========================================================================= */
  function htmlHero(ctx) {
    return `
    <header class="au-hero">
      <svg class="au-hero-olas" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true">
        <path class="au-ola-1" d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 T1500 60 T1800 60 T2100 60 T2400 60 V120 H0Z"/>
        <path class="au-ola-2" d="M0 80 Q150 50 300 80 T600 80 T900 80 T1200 80 T1500 80 T1800 80 T2100 80 T2400 80 V120 H0Z"/>
      </svg>
      <span class="au-hero-tag">🎓 Aula Vigía · Micrositio pedagógico · ~15 min</span>
      <h2 id="aula-title">Entender <em>El Niño</em> para anticipar la sequía en los acueductos</h2>
      <p class="au-hero-lead">Un recorrido en 5 módulos para comprender qué es el fenómeno, cómo se transmite desde el océano hasta la llave de cada hogar, qué señales vigilar y qué decisiones tomar según lo que muestran los indicadores del tablero.</p>
      <div class="au-hero-stats">
        <div class="au-stat"><div class="au-stat-val">${signo(ctx.oni)} °C</div><div class="au-stat-lbl">ONI ${ctx.trimestre} · ${ctx.intensidad}</div></div>
        <div class="au-stat"><div class="au-stat-val">${signo(ctx.n34)} °C</div><div class="au-stat-lbl">Niño 3.4 semanal (NOAA)</div></div>
        <div class="au-stat"><div class="au-stat-val">${ctx.rojos + ctx.naranjas} / ${ctx.total}</div><div class="au-stat-lbl">Municipios en Naranja o Roja</div></div>
        <div class="au-stat"><div class="au-stat-val">${fmt(ctx.poblacion / 1e6, 1)} M</div><div class="au-stat-lbl">Habitantes en riesgo crítico</div></div>
      </div>
      <div class="au-hero-cta">
        <button class="au-btn au-btn-primario" id="au-btn-comenzar" type="button">Comenzar el recorrido ↓</button>
        <button class="au-btn au-btn-fantasma" type="button" data-au-ir="aula-m4">Ir directo a "¿Qué hacer?"</button>
      </div>
    </header>

    <nav class="au-subnav" aria-label="Módulos del Aula El Niño">
      <ol class="au-subnav-lista">
        ${['¿Qué es El Niño?', 'Modelo de afectación', '¿Qué monitorear?', '¿Qué hacer?', 'Ponte a prueba']
          .map((t, i) => `<li><a href="#aula-m${i + 1}" data-au-ir="aula-m${i + 1}"><span class="au-subnav-num">${i + 1}</span><span class="au-subnav-txt">${t}</span></a></li>`).join('')}
      </ol>
      <div class="au-progreso" aria-hidden="true"><span id="au-progreso-barra"></span></div>
    </nav>`;
  }

  function cabeceraModulo(n, kicker, titulo, intro) {
    return `<div class="au-modulo-head">
      <div class="au-modulo-num" aria-hidden="true">${n}</div>
      <div><span class="au-modulo-kicker">Módulo ${n} · ${kicker}</span><h3 id="aula-m${n}-t">${titulo}</h3><p class="au-modulo-intro">${intro}</p></div>
    </div>`;
  }

  function htmlModulo1(ctx) {
    const regLive = [
      { nom: 'Niño 4', anom: ctx.idx.nino4_anomalia, sst: ctx.idx.nino4_sst, desc: 'Pacífico central‑occidental' },
      { nom: 'Niño 3.4', anom: ctx.idx.nino34_anomalia, sst: ctx.idx.nino34_sst, desc: 'Termómetro oficial (define el ONI)', rector: true },
      { nom: 'Niño 3', anom: ctx.idx.nino3_anomalia, sst: ctx.idx.nino3_sst, desc: 'Pacífico oriental' },
      { nom: 'Niño 1+2', anom: ctx.idx.nino12_anomalia, sst: ctx.idx.nino12_sst, desc: 'Costas de Ecuador y Perú' }
    ];

    const regionesDetalle = [
      {
        id: 'nino12',
        nom: 'Niño 1+2',
        coords: '0° – 10° S, 90° O – 80° O',
        subtitulo: 'Pacífico Costero / Oriental Extremo',
        ubicacion: 'Frente a las costas de Ecuador y norte de Perú (abarcando las Islas Galápagos). Es la región más pequeña y cercana al continente.',
        anom: ctx.idx.nino12_anomalia,
        sst: ctx.idx.nino12_sst,
        badge: 'Costero',
        badgeClass: 'costero',
        queEs: 'Es la región más pequeña y con mayor volatilidad térmica de todo el Pacífico tropical.',
        importancia: 'Se utiliza para detectar el <strong>"Niño Costero"</strong>: un calentamiento súbito y local que detona lluvias torrenciales e inundaciones en Perú y Ecuador y colapsa la pesca.',
        colombia: 'Funciona como <strong>alarma temprana en la fachada del Pacífico</strong>. Sus anomalías inciden en el régimen de lluvias del Litoral Pacífico y el suroccidente colombiano (Nariño, Cauca, Valle).'
      },
      {
        id: 'nino3',
        nom: 'Niño 3',
        coords: '5° N – 5° S, 150° O – 90° O',
        subtitulo: 'Pacífico Oriental',
        ubicacion: 'Pacífico tropical oriental (al oeste de Niño 1+2 y hacia el centro de la cuenca).',
        anom: ctx.idx.nino3_anomalia,
        sst: ctx.idx.nino3_sst,
        badge: 'Canónico',
        badgeClass: 'canonico',
        queEs: 'Históricamente fue la primera región delimitada para caracterizar los eventos tradicionales de El Niño (El Niño canónico).',
        importancia: 'Tiene una fuerte interacción aire-mar y una termoclina superficial muy sensible a las ondas Kelvin oceánicas que transportan calor.',
        colombia: 'Su calentamiento consolida el debilitamiento de los vientos alisios y refuerza el déficit de precipitaciones en el territorio nacional.'
      },
      {
        id: 'nino4',
        nom: 'Niño 4',
        coords: '5° N – 5° S, 160° E – 150° O',
        subtitulo: 'Pacífico Central-Occidental',
        ubicacion: 'Pacífico tropical central, atravesando la línea internacional de cambio de fecha (180°).',
        anom: ctx.idx.nino4_anomalia,
        sst: ctx.idx.nino4_sst,
        badge: 'Modoki',
        badgeClass: 'modoki',
        queEs: 'Ubicada en la transición entre la "piscina cálida" occidental y la "lengua fría" del este.',
        importancia: 'Clave para identificar los eventos <strong>El Niño Modoki</strong> (o del Pacífico Central), donde el calentamiento anómalo no se ubica en la costa sino en el centro del océano.',
        colombia: 'Aunque sus anomalías absolutas suelen ser menores, altera la convección global y puede generar patrones atípicos de lluvia en Colombia, distintos a los de un Niño clásico.'
      },
      {
        id: 'nino34',
        nom: 'Niño 3.4',
        coords: '5° N – 5° S, 170° O – 120° O',
        subtitulo: 'Pacífico Central-Oriental · Índice Estándar Global',
        ubicacion: 'Franja central que superpone la mitad occidental de Niño 3 y la mitad oriental de Niño 4 (de ahí su denominación 3.4).',
        anom: ctx.idx.nino34_anomalia,
        sst: ctx.idx.nino34_sst,
        badge: 'Oficial / Rector',
        badgeClass: 'rector',
        rector: true,
        queEs: '<strong>El estándar de referencia mundial más importante.</strong> Es el punto neurálgico donde el océano se comunica con la atmósfera global.',
        importancia: 'Científicamente se comprobó que sus anomalías térmicas son las que mejor se correlacionan con la <strong>circulación de Walker</strong> y las teleconexiones climáticas en el planeta. A partir de ella la NOAA calcula el índice <strong>ONI</strong>.',
        colombia: '<strong>Es el indicador rector para el IDEAM, la CRA y los acueductos.</strong> Anomalías ≥ +0,5 °C sostenidas en Niño 3.4 detonan sequía en las regiones Andina y Caribe, desploman los caudales de las cuencas y reducen los embalses.'
      }
    ];

    const posOni = (() => {
      const v = Math.max(0, ctx.oni);
      if (v < 0.5) return (v / 0.5) * 20;
      if (v < 2.0) return 20 + ((v - 0.5) / 0.5) * 20;
      return 80 + Math.min(v - 2.0, 1) * 20;
    })();

    return `
    <section class="au-modulo" id="aula-m1" aria-labelledby="aula-m1-t">
      ${cabeceraModulo(1, 'La amenaza', '¿Qué es El Niño?', 'El Niño es la <strong>fase cálida</strong> de un ciclo natural del océano Pacífico tropical llamado ENSO (El Niño – Oscilación del Sur). Ocurre cada 2 a 7 años y altera el clima de buena parte del planeta, incluida Colombia.')}

      <div class="au-ideas au-reveal">
        <div class="au-idea"><span class="au-idea-ico">🌡️</span><strong>Es un calentamiento del océano</strong><p>El agua superficial del Pacífico ecuatorial se calienta al menos +0,5 °C sobre lo normal durante varios meses seguidos.</p></div>
        <div class="au-idea"><span class="au-idea-ico">🌬️</span><strong>Cambia la circulación de la atmósfera</strong><p>Los vientos alisios se debilitan y las nubes de lluvia se desplazan, alejándose del norte de Sudamérica.</p></div>
        <div class="au-idea"><span class="au-idea-ico">💧</span><strong>En Colombia significa menos agua</strong><p>Menos lluvia y más calor reducen los caudales de ríos y embalses de los que dependen los acueductos.</p></div>
      </div>

      <h4 class="au-subtitulo">Simulador: ¿qué cambia en el Pacífico?</h4>
      <div class="au-sim au-reveal">
        <div class="au-sim-lienzo">
          <div class="au-sim-tabs" role="tablist" aria-label="Estado del océano Pacífico">
            <button class="au-sim-tab" role="tab" type="button" data-estado="neutro" aria-selected="false">Condición neutra</button>
            <button class="au-sim-tab" role="tab" type="button" data-estado="nino" aria-selected="true">🔥 El Niño</button>
            <button class="au-sim-tab" role="tab" type="button" data-estado="nina" aria-selected="false">❄️ La Niña</button>
          </div>
          ${svgPacifico()}
        </div>
        <div class="au-sim-panel" id="au-sim-panel" aria-live="polite"></div>
      </div>

      <h4 class="au-subtitulo">Las 4 regiones de monitoreo del Pacífico: Niño 1+2, Niño 3, Niño 4 y Niño 3.4</h4>
      <p class="au-modulo-intro" style="margin-bottom:14px">Para anticipar cómo se propaga la amenaza, la comunidad científica internacional (NOAA, OMM, IDEAM) dividió el Océano Pacífico ecuatorial en cuatro cuadrantes estandarizados de medición de la Temperatura Superficial del Mar (TSM / SST). Cada uno cumple un rol diagnóstico específico:</p>

      <!-- Tarjetas en vivo con anomalías de la semana -->
      <div class="au-regiones au-reveal">
        ${regLive.map(r => `<div class="au-region ${r.rector ? 'rector' : ''}" style="background:linear-gradient(160deg, ${colorAnomalia(r.anom)}, ${colorAnomalia(r.anom)}CC)">
            ${r.rector ? '<span class="au-region-badge">OFICIAL</span>' : ''}
            <span class="au-region-nom">${r.nom}</span>
            <span class="au-region-anom">${signo(r.anom)} °C</span>
            <span class="au-region-desc">${r.desc}${typeof r.sst === 'number' ? ` · TSM ${fmt(r.sst, 1)} °C` : ''}</span></div>`).join('')}
      </div>
      <div class="au-regiones-eje"><span>← Oeste (Asia / Oceanía)</span><span>Este (Sudamérica) →</span></div>

      <!-- Cuadrícula detallada con explicación técnica de cada región -->
      <div class="au-regiones-grid-detalle au-reveal">
        ${regionesDetalle.map(rd => `
          <article class="au-card-region ${rd.badgeClass} ${rd.rector ? 'rector' : ''}">
            <div class="au-card-region-head">
              <div class="au-card-region-tit">
                <div class="au-card-region-nom">${rd.nom} <span class="au-tag-rol ${rd.badgeClass}">${rd.badge}</span></div>
                <span class="au-card-region-sub">${rd.subtitulo}</span>
              </div>
              <div class="au-card-region-meta">
                <span class="au-card-region-anom" style="--c-anom:${colorAnomalia(rd.anom)}">${signo(rd.anom)} °C</span>
                <span class="au-card-region-sst">${typeof rd.sst === 'number' ? `TSM: ${fmt(rd.sst, 1)} °C` : 'Anomalía semanal'}</span>
              </div>
            </div>
            <div class="au-coords-chip">📍 <strong>Coordenadas:</strong> ${rd.coords}</div>
            <div class="au-card-region-sec">
              <p><strong>Ubicación:</strong> ${rd.ubicacion}</p>
              <p>${rd.queEs}</p>
              <p><strong>Función clave:</strong> ${rd.importancia}</p>
            </div>
            <div class="au-card-region-colombia">
              <strong>🇨🇴 Relevancia para Colombia y Acueductos:</strong>
              ${rd.colombia}
            </div>
          </article>
        `).join('')}
      </div>

      <!-- Cuadro Comparativo Síntesis -->
      <h5 style="font-size:14px;font-weight:900;color:var(--texto-fuerte);margin:24px 0 8px;display:flex;align-items:center;gap:6px">
        <span>📋</span> Cuadro comparativo de las 4 regiones oceánicas
      </h5>
      <div class="au-tabla-comparativa-wrap au-reveal">
        <table class="au-tabla-comparativa">
          <thead>
            <tr>
              <th style="width:110px">Región</th>
              <th style="width:170px">Coordenadas</th>
              <th style="width:180px">Ubicación Relativa</th>
              <th style="width:170px">Fenómeno / Rol</th>
              <th>Importancia y Uso Clave</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Niño 1+2</strong></td>
              <td><code>0°–10° S, 90°–80° O</code></td>
              <td>Costas de Ecuador y Perú</td>
              <td><span class="au-tag-rol costero">Niño Costero</span></td>
              <td>Detección de calentamiento costero súbito, inundaciones locales y señal temprana en la fachada del Pacífico.</td>
            </tr>
            <tr>
              <td><strong>Niño 3</strong></td>
              <td><code>5° N–5° S, 150°–90° O</code></td>
              <td>Pacífico Oriental</td>
              <td><span class="au-tag-rol canonico">Niño Canónico</span></td>
              <td>Eventos clásicos u orientales. Fuerte intercambio de calor y oscilación de la termoclina.</td>
            </tr>
            <tr class="rector">
              <td><strong>Niño 3.4 ⭐</strong></td>
              <td><code>5° N–5° S, 170°–120° O</code></td>
              <td>Pacífico Central-Oriental</td>
              <td><span class="au-tag-rol rector">Índice Rector (ONI)</span></td>
              <td><strong>Estándar mundial.</strong> Máximo acoplamiento océano-atmósfera (Walker). Define la sequía en la región Andina y Caribe de Colombia.</td>
            </tr>
            <tr>
              <td><strong>Niño 4</strong></td>
              <td><code>5° N–5° S, 160° E–150° O</code></td>
              <td>Pacífico Central-Occidental</td>
              <td><span class="au-tag-rol modoki">Niño Modoki</span></td>
              <td>Detección de eventos con calentamiento anómalo en el centro del océano, modificando la convección global.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bloque destacado: Por qué Niño 3.4 define la sequía en Colombia -->
      <div class="au-bloque-rector au-reveal">
        <span class="au-bloque-rector-tag">🎯 Mecanismo Físico y Regulatorio</span>
        <h4>¿Por qué la región Niño 3.4 es la que define la sequía en los acueductos colombianos?</h4>
        <p class="au-bloque-rector-intro">
          El <strong>IDEAM</strong> y la <strong>CRA</strong> basan sus alertas en <strong>Niño 3.4</strong> porque no todo calentamiento del mar llega a la atmósfera de la misma manera. Esta zona intermedia es el "motor térmico" que gobierna el clima colombiano:
        </p>
        <div class="au-bloque-rector-puntos">
          <div class="au-bloque-rector-item">
            <strong>1. Ruptura de la Circulación de Walker</strong>
            <p>Al calentarse Niño 3.4 (anomalía ≥ +0,5 °C), la columna de aire cálido y húmedo asciende en el centro del Pacífico. Esto fuerza el descenso de aire seco y estable (subsidencia) sobre Colombia, <strong>bloqueando la formación de nubes de lluvia</strong>.</p>
          </div>
          <div class="au-bloque-rector-item">
            <strong>2. Impacto en Cuencas y Embalses</strong>
            <p>Las regiones Andina y Caribe albergan a más del 70 % de la población y la mayoría de cuencas reguladas. La falta de lluvia seca el suelo, merma los caudales en las bocatomas y hace caer el volumen útil de los embalses a niveles críticos.</p>
          </div>
          <div class="au-bloque-rector-item">
            <strong>3. Costero vs. Canónico vs. Modoki</strong>
            <p>Un Niño en <strong>1+2</strong> puede inundar la costa de Perú sin secar a Bogotá o Barranquilla. Un Niño en <strong>4</strong> (Modoki) altera lluvias selectivas. Pero cuando <strong>Niño 3.4</strong> se calienta, la sequía en Colombia es prácticamente generalizada y severa.</p>
          </div>
        </div>
      </div>

      <h4 class="au-subtitulo">¿Qué tan fuerte es este Niño? Escala del ONI</h4>
      <div class="au-escala au-reveal">
        <div class="au-escala-marca" style="left:${posOni}%"><span>Hoy: ${signo(ctx.oni)} °C</span><i></i></div>
        <div class="au-escala-barra">
          <div class="au-escala-seg" style="background:#2E7D4F">Neutro</div>
          <div class="au-escala-seg" style="background:#C79E00">Débil</div>
          <div class="au-escala-seg" style="background:#E07A10">Moderado</div>
          <div class="au-escala-seg" style="background:#D2531E">Fuerte</div>
          <div class="au-escala-seg" style="background:#B3261E">Muy fuerte</div>
        </div>
        <div class="au-escala-ticks"><span>&lt; 0,5 °C</span><span>0,5 – 0,9</span><span>1,0 – 1,4</span><span>1,5 – 1,9</span><span>≥ 2,0 °C</span></div>
      </div>
      <div class="au-historicos">
        <span class="au-historico">Referencias históricas (pico ONI):</span>
        <span class="au-historico"><strong>1982‑83</strong> +2,2 °C</span>
        <span class="au-historico"><strong>1997‑98</strong> +2,4 °C</span>
        <span class="au-historico"><strong>2015‑16</strong> +2,6 °C</span>
        <span class="au-historico"><strong>2023‑24</strong> +2,0 °C</span>
      </div>

      <h4 class="au-subtitulo">¿Cómo se siente en Colombia?</h4>
      <div class="au-efectos au-reveal">
        <div class="au-efecto"><span class="au-efecto-ico">🌧️</span><strong>Menos lluvia</strong><p>Déficit de precipitación, con mayor intensidad en las regiones Caribe y Andina, donde vive la mayor parte de la población.</p></div>
        <div class="au-efecto"><span class="au-efecto-ico">🌡️</span><strong>Más calor y evaporación</strong><p>Temperaturas más altas aumentan la evaporación de embalses y la demanda de agua en los hogares.</p></div>
        <div class="au-efecto"><span class="au-efecto-ico">🔥</span><strong>Incendios forestales</strong><p>La vegetación seca arde con facilidad, degrada las cuencas y llena de ceniza las fuentes de agua.</p></div>
        <div class="au-efecto"><span class="au-efecto-ico">🚱</span><strong>Ríos y embalses bajos</strong><p>Menos caudal para captar: aparecen los cortes, los racionamientos y los carrotanques.</p></div>
      </div>
    </section>`;
  }

  function svgPacifico() {
    const lluvia = (x0, n, y1, y2) => Array.from({ length: n }, (_, i) => `<line x1="${x0 + i * 14}" y1="${y1}" x2="${x0 + i * 14 - 6}" y2="${y2}"/>`).join('');
    return `
    <svg class="au-pacifico" id="au-pacifico" data-estado="nino" viewBox="0 0 800 360" role="img" aria-labelledby="au-pac-tit au-pac-desc">
      <title id="au-pac-tit">Corte transversal del océano Pacífico ecuatorial</title>
      <desc id="au-pac-desc">Muestra la posición del agua cálida, los vientos alisios, la termoclina y las lluvias entre Asia‑Oceanía (izquierda) y Sudamérica (derecha).</desc>
      <defs>
        <linearGradient id="au-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFEAF7"/><stop offset="1" stop-color="#F4FAFD"/></linearGradient>
        <linearGradient id="au-mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B7FB8"/><stop offset="1" stop-color="#0D3E66"/></linearGradient>
        <radialGradient id="au-calida"><stop offset="0" stop-color="#FF5A2C"/><stop offset=".6" stop-color="#FF8A4C" stop-opacity=".85"/><stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/></radialGradient>
        <radialGradient id="au-fria"><stop offset="0" stop-color="#9EE0FF"/><stop offset="1" stop-color="#9EE0FF" stop-opacity="0"/></radialGradient>
        <marker id="au-flecha" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#0D2C4D"/></marker>
      </defs>
      <rect width="800" height="150" fill="url(#au-cielo)"/>
      <rect y="150" width="800" height="210" fill="url(#au-mar)"/>

      <!-- Nube y lluvia de convección (sigue al agua cálida) -->
      <g class="au-g au-nube">
        <g fill="#fff" stroke="#B9C4CC" stroke-width="1.5">
          <ellipse cx="170" cy="52" rx="44" ry="22"/><ellipse cx="210" cy="44" rx="40" ry="26"/><ellipse cx="240" cy="58" rx="34" ry="18"/><ellipse cx="195" cy="64" rx="56" ry="16"/>
        </g>
        <g class="au-lluvia" stroke="#2F8FD8" stroke-width="2.5" stroke-linecap="round">${lluvia(150, 8, 84, 140)}</g>
      </g>

      <!-- Vientos alisios (este → oeste) -->
      <g class="au-g au-vientos" stroke="#0D2C4D" stroke-width="3.5" fill="none" stroke-linecap="round">
        <line class="au-viento-linea" x1="690" y1="112" x2="330" y2="112" marker-end="url(#au-flecha)"/>
        <line class="au-viento-linea" x1="650" y1="132" x2="290" y2="132" marker-end="url(#au-flecha)"/>
        <text x="510" y="102" font-size="13" font-weight="800" fill="#0D2C4D" stroke="none" text-anchor="middle">Vientos alisios</text>
      </g>

      <!-- Agua cálida superficial -->
      <g class="au-g au-warm" style="transform-origin:190px 170px">
        <ellipse cx="190" cy="170" rx="175" ry="28" fill="url(#au-calida)"/>
        <text x="190" y="175" font-size="13" font-weight="900" fill="#fff" text-anchor="middle">Agua cálida</text>
      </g>

      <!-- Afloramiento frío -->
      <g class="au-g au-cold">
        <ellipse cx="690" cy="185" rx="60" ry="24" fill="url(#au-fria)"/>
        <text x="690" y="222" font-size="11" font-weight="800" fill="#DDF3FF" text-anchor="middle">Afloramiento frío</text>
      </g>

      <!-- Termoclina (tres estados) -->
      <g fill="none" stroke="#FFD08A" stroke-width="2.5" stroke-dasharray="8 6">
        <path class="au-termo au-termo-neutro" d="M70 305 C 300 295, 520 240, 735 200"/>
        <path class="au-termo au-termo-nino" d="M70 272 C 300 265, 520 255, 735 248"/>
        <path class="au-termo au-termo-nina" d="M70 325 C 300 310, 520 225, 735 185"/>
      </g>
      <text x="90" y="345" font-size="11" font-weight="800" fill="#FFD08A">— — Termoclina (frontera agua cálida / fría)</text>

      <!-- Continentes -->
      <path d="M0 132 Q30 118 62 134 L74 360 L0 360 Z" fill="#6E8F52"/>
      <text x="8" y="112" font-size="11.5" font-weight="900" fill="#1F2A36">Indonesia /</text>
      <text x="8" y="126" font-size="11.5" font-weight="900" fill="#1F2A36">Australia</text>
      <path d="M732 150 L746 96 L760 122 L776 66 L790 108 L800 96 L800 360 L736 360 Z" fill="#7F9C5E"/>
      <text x="792" y="24" font-size="11.5" font-weight="900" fill="#1F2A36" text-anchor="end">Colombia /</text>
      <text x="792" y="38" font-size="11.5" font-weight="900" fill="#1F2A36" text-anchor="end">Sudamérica</text>

      <!-- Clima sobre Colombia -->
      <g class="au-g au-col-lluvia">
        <ellipse cx="755" cy="58" rx="26" ry="11" fill="#fff" stroke="#B9C4CC"/>
        <g class="au-lluvia" stroke="#2F8FD8" stroke-width="2" stroke-linecap="round">${lluvia(742, 3, 72, 92)}</g>
      </g>
      <g class="au-g au-col-sol">
        <circle cx="755" cy="64" r="13" fill="#FFC800"/>
        <g stroke="#FFC800" stroke-width="2.5" stroke-linecap="round">
          <line x1="755" y1="44" x2="755" y2="38"/><line x1="755" y1="84" x2="755" y2="90"/><line x1="735" y1="64" x2="729" y2="64"/><line x1="775" y1="64" x2="781" y2="64"/>
          <line x1="741" y1="50" x2="737" y2="46"/><line x1="769" y1="78" x2="773" y2="82"/><line x1="769" y1="50" x2="773" y2="46"/><line x1="741" y1="78" x2="737" y2="82"/>
        </g>
      </g>
    </svg>`;
  }

  function htmlModulo2(ctx) {
    return `
    <section class="au-modulo" id="aula-m2" aria-labelledby="aula-m2-t">
      ${cabeceraModulo(2, 'Cómo nos afecta', 'Modelo de afectación: del océano a la llave', 'El Niño no deja sin agua a un municipio de un día para otro. Su efecto viaja por una <strong>cadena de eslabones</strong> con rezagos de semanas a meses. Esa demora es nuestra ventaja: permite anticiparse. Haga clic en cada eslabón.')}

      <div class="au-cadena au-reveal" role="group" aria-label="Cadena causal del riesgo">
        ${CADENA.map((e, i) => `<button type="button" class="au-eslabon" data-eslabon="${i}" aria-pressed="${i === 0}">
            <div class="au-eslabon-ico" aria-hidden="true">${e.ico}</div>
            <div class="au-eslabon-paso">Eslabón ${i + 1}</div>
            <strong>${e.titulo}</strong>
            <div class="au-eslabon-cods">${e.cods.map(chipCod).join('')}</div>
          </button>`).join('')}
      </div>
      <div class="au-rezago" aria-hidden="true">${CADENA.map(e => `<div>${e.rezago}</div>`).join('')}</div>
      <div class="au-cadena-detalle" id="au-cadena-detalle" aria-live="polite">${CADENA[0].detalle}</div>
      <p class="au-nota">Rezagos orientativos: varían según la región, el tamaño del sistema de acueducto y la regulación natural de la cuenca.</p>

      <h4 class="au-subtitulo">Las 4 capas del Índice Compuesto de Riesgo (ICR)</h4>
      <p style="font-size:14px;max-width:880px">Para comparar municipios, el Vigía traduce cada indicador a <strong>puntos de presión de 0 (sin presión) a 100 (máxima presión)</strong> usando los umbrales oficiales, los agrupa en cuatro capas y las pondera:</p>
      <div class="au-capas au-reveal" style="margin-top:14px">
        ${[
          ['A', '¿Qué tan fuerte golpea la sequía al territorio?'],
          ['H', '¿Qué tan frágil es la fuente de agua?'],
          ['S', '¿Qué tan bien resiste el servicio?'],
          ['R', '¿Ya hay impacto confirmado y cómo se responde?']
        ].map(([k, preg]) => `<article class="au-capa" data-capa="${k}">
            <div class="au-capa-letra">${k}</div>
            <h4>${NOMBRE_CAPA[k]}</h4>
            <p class="au-capa-pregunta">${preg}</p>
            <div class="au-capa-peso"><span>Peso</span><div class="au-capa-peso-barra"><span style="width:${(PESOS[k] / Math.max(...Object.values(PESOS))) * 100}%"></span></div><span>${pesoTxt(k)}</span></div>
            <div class="au-eslabon-cods">${COMPOSICION_ICR[k].cods.map(chipCod).join('')}</div>
            <span class="au-capa-calc">${COMPOSICION_ICR[k].regla}</span>
          </article>`).join('')}
      </div>
      <div class="au-contexto">
        <strong>Indicadores de contexto</strong> (se vigilan, pero no suman al ICR): ${CODS_CONTEXTO.map(chipCod).join(' ')}
        <span>— anticipan la amenaza (A-1, A-2), alertan sobre incendios (A-5), embalses (H-5) o hábitos de consumo (S-6).</span>
      </div>

      <h4 class="au-subtitulo">Laboratorio: arme su propio ICR</h4>
      <div class="au-icr-sim au-reveal">
        <div class="au-icr-controles">
          <div class="au-icr-presets">
            <label for="au-icr-muni"><strong>Cargar un municipio real:</strong></label>
            <select class="au-select" id="au-icr-muni"><option value="">— Escenario libre —</option>${ctx.opcionesMunis}</select>
          </div>
          ${['A', 'H', 'S', 'R'].map(k => `<div class="au-icr-fila" data-capa="${k}">
              <label for="au-sl-${k}"><span class="au-cod" data-capa="${k}">${k}</span>${NOMBRE_CAPA[k].split(' ')[0]} (${pesoTxt(k)})</label>
              <input type="range" id="au-sl-${k}" min="0" max="100" step="0.1" value="${{ A: 70, H: 55, S: 45, R: 20 }[k]}">
              <output for="au-sl-${k}" id="au-out-${k}">0</output>
            </div>`).join('')}
          <div class="au-icr-toggles">
            <label class="au-toggle"><input type="checkbox" id="au-tg-r3"> Racionamiento oficial (R-3)</label>
            <label class="au-toggle"><input type="checkbox" id="au-tg-r4"> Calamidad pública (R-4)</label>
          </div>
        </div>
        <div class="au-icr-resultado" id="au-icr-res" aria-live="polite">
          <span class="au-icr-res-lbl">Índice Compuesto de Riesgo</span>
          <span class="au-icr-res-val" id="au-icr-val">0</span>
          <div class="au-gauge"><i id="au-icr-aguja"></i></div>
          <span class="au-icr-res-nivel" id="au-icr-nivel">—</span>
          <span class="au-icr-res-txt" id="au-icr-txt"></span>
          <div class="au-icr-regla" id="au-icr-regla">⚠️ <strong>Regla de piso activada:</strong> hay impacto confirmado (racionamiento o calamidad), por lo que el nivel sube como mínimo a Naranja aunque el puntaje sea menor.</div>
          <div class="au-icr-formula" id="au-icr-formula"></div>
        </div>
      </div>

      <h4 class="au-subtitulo">El semáforo del Vigía</h4>
      <div class="au-semaforo au-reveal">
        ${['sin_alerta', 'amarilla', 'naranja', 'roja'].map(n => `<div class="au-sem" data-nivel="${n}">
            <span class="au-sem-rango">${NIVELES[n].rango}</span><strong>${NIVELES[n].nombre}</strong><p>${NIVELES[n].resumen}</p></div>`).join('')}
      </div>
      <p class="au-nota">Si las capas con dato suman menos del 60 % del peso total, el municipio se marca como "Sin dato". Si falta una capa, su peso se redistribuye proporcionalmente entre las disponibles.</p>
    </section>`;
  }

  function htmlModulo3() {
    return `
    <section class="au-modulo" id="aula-m3" aria-labelledby="aula-m3-t">
      ${cabeceraModulo(3, 'Vigilancia', '¿Qué hay que monitorear?', 'No todos los indicadores dicen lo mismo ni al mismo tiempo. Algunos <strong>anticipan</strong> la sequía con meses de ventaja; otros <strong>confirman</strong> que ya llegó. Un buen monitoreo combina ambos.')}

      <div class="au-anticipa au-reveal">
        ${ANTICIPACION.map(c => `<div class="au-anticipa-col">
            <header><span aria-hidden="true">${c.ico}</span><div><small>${c.cuando}</small><h4>${c.titulo}</h4></div></header>
            <p>${c.texto}</p>
            <div class="au-eslabon-cods">${c.cods.map(chipCod).join('')}</div>
          </div>`).join('')}
      </div>
      <div class="au-anticipa-barra" style="border-radius:0 0 6px 6px"></div>
      <div class="au-anticipa-pie"><span>◀ Más tiempo para actuar</span><span>Menos margen, más impacto ▶</span></div>
      <div class="au-contexto"><strong>🧱 Vulnerabilidad estructural</strong> (cambia lento, define qué tan preparado está el municipio): ${ESTRUCTURALES.map(chipCod).join(' ')}</div>

      <h4 class="au-subtitulo">Explorador de los 20 indicadores</h4>
      <div class="au-filtros" role="group" aria-label="Filtrar indicadores">
        <button type="button" class="au-chip" data-filtro="TODOS" aria-pressed="true">Todos</button>
        ${['A', 'H', 'S', 'R'].map(k => `<button type="button" class="au-chip" data-filtro="${k}" data-capa="${k}" aria-pressed="false"><i></i>Capa ${k} · ${NOMBRE_CAPA[k].split(' ')[0]}</button>`).join('')}
        <button type="button" class="au-chip" data-filtro="TEMPRANA" aria-pressed="false">⏱️ Solo señales tempranas</button>
        <button type="button" class="au-chip" data-filtro="ICR" aria-pressed="false">∑ Solo los que suman al ICR</button>
      </div>
      <div class="au-indicadores" id="au-indicadores"></div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="au-btn au-btn-borde" type="button" data-au-vista="V-05">Ver fórmulas y fuentes en el Catálogo (V-05) →</button>
      </div>
    </section>`;
  }

  function htmlIndicadores(filtro) {
    const tempranas = new Set([...ANTICIPACION[0].cods, ...ANTICIPACION[1].cods, ...ANTICIPACION[2].cods]);
    return catalogo()
      .filter(c => {
        if (filtro === 'TODOS') return true;
        if (filtro === 'TEMPRANA') return tempranas.has(c.codigo);
        if (filtro === 'ICR') return CODS_EN_CALCULO.has(c.codigo);
        return c.capa === filtro;
      })
      .map(c => {
        const cd = ciudadano(c.codigo);
        const tipo = ANTICIPACION.find(a => a.cods.includes(c.codigo));
        return `<article class="au-ind" data-capa="${c.capa}">
          <div class="au-ind-top">
            ${chipCod(c.codigo)}
            <div class="au-ind-badges">
              ${CODS_EN_CALCULO.has(c.codigo) ? '<span class="au-badge icr">Suma al ICR</span>' : '<span class="au-badge ctx">Contexto</span>'}
              <span class="au-badge">${tipo ? tipo.cuando : 'Estructural'}</span>
            </div>
          </div>
          <h5>${cd.titulo_sencillo || c.nombre}</h5>
          <p>${cd.que_mide || ''}</p>
          <p style="color:var(--texto-claro)"><em>${cd.por_que_importa || ''}</em></p>
          <div class="au-ind-alerta">${textoUmbral(c.codigo)}</div>
          ${espectro(c.codigo)}
          <div class="au-ind-pie"><span>📡 ${c.fuente}</span><span>🔁 ${CADENCIA[c.codigo] || '—'}</span></div>
        </article>`;
      }).join('');
  }

  function htmlModulo4(ctx) {
    return `
    <section class="au-modulo" id="aula-m4" aria-labelledby="aula-m4-t">
      ${cabeceraModulo(4, 'Decisión', '¿Qué acciones tomar según los indicadores?', 'El color del semáforo indica <strong>qué tan urgente</strong> es actuar; los indicadores que lo empujan indican <strong>dónde</strong> actuar. Seleccione un nivel para ver el protocolo por actor.')}

      <div class="au-niveles-tabs" role="tablist" aria-label="Nivel de alerta">
        ${['sin_alerta', 'amarilla', 'naranja', 'roja'].map(n => `<button type="button" role="tab" class="au-nivel-tab" data-nivel="${n}" aria-selected="${n === 'naranja'}">
            <strong>${NIVELES[n].nombre}</strong><span>${NIVELES[n].rango} · ${ctx.conteo[n] || 0} mun.</span></button>`).join('')}
      </div>
      <div class="au-protocolo" id="au-protocolo" aria-live="polite"></div>

      <h4 class="au-subtitulo">Matriz "Si ves… entonces haz…"</h4>
      <p style="font-size:14px;margin-bottom:12px">Disparadores por indicador, con los umbrales oficiales del catálogo. Úsela para pasar del dato a la acción concreta.</p>
      <div class="au-matriz-wrap au-reveal">
        <table class="au-matriz">
          <thead><tr><th style="width:80px">Indicador</th><th style="width:260px">Si ves…</th><th style="width:100px">Nivel</th><th>Entonces haz…</th></tr></thead>
          <tbody>${MATRIZ.map(m => `<tr><td>${chipCod(m.cod)}</td><td class="au-si">${m.si}</td><td><span class="au-nivel-pill" data-nivel="${m.nivel}">${NIVELES[m.nivel].nombre}</span></td><td class="au-entonces">${m.entonces}</td></tr>`).join('')}</tbody>
        </table>
      </div>

      <h4 class="au-subtitulo">Diagnóstico guiado con datos del corte vigente</h4>
      <div class="au-diag au-reveal">
        <div class="au-diag-top">
          <div><h4>¿Qué debería hacerse en este municipio?</h4><p>El Aula lee los indicadores del corte ${ctx.fecha} y propone acciones según los que superan el umbral naranja.</p></div>
          <select class="au-select" id="au-diag-muni" aria-label="Seleccionar municipio">${ctx.opcionesMunis}</select>
        </div>
        <div id="au-diag-res"></div>
      </div>
    </section>`;
  }

  function htmlModulo5() {
    return `
    <section class="au-modulo" id="aula-m5" aria-labelledby="aula-m5-t">
      ${cabeceraModulo(5, 'Autoevaluación', 'Ponte a prueba', 'Seis preguntas rápidas para verificar lo aprendido. Cada respuesta incluye una explicación.')}
      <div class="au-quiz" id="au-quiz">
        ${QUIZ.map((q, i) => `<fieldset class="au-pregunta" data-q="${i}">
            <legend>${i + 1}. ${q.p}</legend>
            <div class="au-opciones">${q.ops.map((o, j) => `<button type="button" class="au-opcion" data-op="${j}">${o}</button>`).join('')}</div>
            <div class="au-feedback" role="status"></div>
          </fieldset>`).join('')}
        <div class="au-puntaje"><span>Tu resultado: <strong id="au-puntaje">0 / ${QUIZ.length}</strong></span><button class="au-btn au-btn-fantasma" type="button" id="au-quiz-reset">Reiniciar</button></div>
      </div>

      <h4 class="au-subtitulo">Glosario esencial</h4>
      <div class="au-glosario">${GLOSARIO.map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join('')}</div>

      <div class="au-cierre">
        <div><h4>Ahora, a los datos 📊</h4><p>Con estos conceptos ya puede leer el tablero con criterio de decisión.</p></div>
        <div class="au-cierre-btns">
          <button class="au-btn au-btn-cian" type="button" data-au-vista="V-01">Ir al Resumen Ejecutivo</button>
          <button class="au-btn au-btn-borde" type="button" data-au-vista="V-03">Explorar el mapa territorial</button>
          <button class="au-btn au-btn-borde" type="button" data-au-vista="STORY">Ver el Recorrido Ejecutivo</button>
        </div>
      </div>
    </section>`;
  }

  /* =========================================================================
     COMPORTAMIENTO
     ========================================================================= */
  function initSimulador() {
    const svg = $('#au-pacifico');
    const panel = $('#au-sim-panel');
    const pintar = estado => {
      const e = SIM_ESTADOS[estado];
      svg.setAttribute('data-estado', estado);
      panel.setAttribute('data-estado', estado);
      panel.innerHTML = `<span class="au-chip-estado">${e.chip}</span><h4>${e.titulo}</h4>
        <ul>${e.puntos.map(p => `<li>${p}</li>`).join('')}</ul>
        <div class="au-efecto-col">${e.colombia}</div>`;
      $$('.au-sim-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.estado === estado)));
    };
    $$('.au-sim-tab').forEach(t => t.addEventListener('click', () => pintar(t.dataset.estado)));
    pintar('nino');
  }

  function initCadena() {
    const det = $('#au-cadena-detalle');
    $$('.au-eslabon').forEach(b => b.addEventListener('click', () => {
      $$('.au-eslabon').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      det.innerHTML = CADENA[+b.dataset.eslabon].detalle;
    }));
  }

  function initSimuladorIcr(munis) {
    const sl = k => $(`#au-sl-${k}`);
    const r3 = $('#au-tg-r3'), r4 = $('#au-tg-r4');
    const calc = () => {
      const v = {};
      ['A', 'H', 'S', 'R'].forEach(k => { v[k] = +sl(k).value; $(`#au-out-${k}`).textContent = fmt(v[k], Number.isInteger(v[k]) ? 0 : 1); });
      const icr = +(v.A * PESOS.A + v.H * PESOS.H + v.S * PESOS.S + v.R * PESOS.R).toFixed(1);
      let nivel = nivelPorIcr(icr);
      const piso = (r3.checked || r4.checked) && (nivel === 'sin_alerta' || nivel === 'amarilla');
      if (piso) nivel = 'naranja';
      $('#au-icr-val').textContent = fmt(icr, 1);
      $('#au-icr-aguja').style.left = `${Math.min(100, icr)}%`;
      $('#au-icr-nivel').textContent = `Nivel ${NIVELES[nivel].nombre}`;
      $('#au-icr-txt').textContent = NIVELES[nivel].resumen;
      $('#au-icr-res').style.setProperty('--nivel-color', NIVELES[nivel].color);
      $('#au-icr-regla').classList.toggle('visible', piso);
      $('#au-icr-formula').innerHTML =
        `ICR = ${pesoDec('A')}×${fmt(v.A)} + ${pesoDec('H')}×${fmt(v.H)} + ${pesoDec('S')}×${fmt(v.S)} + ${pesoDec('R')}×${fmt(v.R)}<br>= ${fmt(v.A * PESOS.A)} + ${fmt(v.H * PESOS.H)} + ${fmt(v.S * PESOS.S)} + ${fmt(v.R * PESOS.R)} = <strong>${fmt(icr)}</strong>`;
    };
    ['A', 'H', 'S', 'R'].forEach(k => sl(k).addEventListener('input', () => { $('#au-icr-muni').value = ''; calc(); }));
    [r3, r4].forEach(t => t.addEventListener('change', calc));
    $('#au-icr-muni').addEventListener('change', e => {
      const m = munis.find(x => x.divipola === e.target.value);
      if (!m) return;
      const s = m.subindices_capa || {};
      const val = { A: s.amenaza_A, H: s.vulnerabilidad_H, S: s.servicio_S, R: s.respuesta_R };
      ['A', 'H', 'S', 'R'].forEach(k => { sl(k).value = (+(val[k] ?? 0)).toFixed(1); });
      r3.checked = m.indicadores?.['R-3']?.valor === 1;
      r4.checked = m.indicadores?.['R-4']?.valor === 1;
      calc();
    });
    calc();
  }

  function initExplorador() {
    const cont = $('#au-indicadores');
    const pintar = f => {
      cont.innerHTML = htmlIndicadores(f);
      $$('.au-filtros .au-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filtro === f)));
    };
    $$('.au-filtros .au-chip').forEach(c => c.addEventListener('click', () => pintar(c.dataset.filtro)));
    pintar('TODOS');
  }

  function initProtocolo() {
    const cont = $('#au-protocolo');
    const pintar = n => {
      const p = PROTOCOLO[n];
      cont.setAttribute('data-nivel', n);
      cont.innerHTML = `
        <div class="au-protocolo-head">
          <div><h4>Nivel ${NIVELES[n].nombre}</h4><p>${NIVELES[n].resumen}</p></div>
          <div class="au-protocolo-meta"><span>${NIVELES[n].rango}</span><span>Disparador: ${p.disparador}</span></div>
        </div>
        <div class="au-actores">
          ${ACTORES.map(a => `<div class="au-actor"><header><span aria-hidden="true">${a.ico}</span><h5>${a.nombre}</h5></header>
            <ul>${p.actores[a.id].map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}
        </div>
        <div class="au-protocolo-pie">🎯 ${p.pie}</div>`;
      $$('.au-nivel-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.nivel === n)));
    };
    $$('.au-nivel-tab').forEach(t => t.addEventListener('click', () => pintar(t.dataset.nivel)));
    pintar('naranja');
    return pintar;
  }

  function initDiagnostico(munis, pintarProtocolo) {
    const sel = $('#au-diag-muni');
    const res = $('#au-diag-res');
    const pintar = div => {
      const m = munis.find(x => x.divipola === div);
      if (!m) return;
      const nivel = m.nivel_alerta || nivelPorIcr(m.icr);
      const s = m.subindices_capa || {};
      const capas = { A: s.amenaza_A, H: s.vulnerabilidad_H, S: s.servicio_S, R: s.respuesta_R };
      const criticos = Object.entries(m.indicadores || {})
        .map(([cod, d]) => ({ cod, d, n: nivelIndicador(cod, d) }))
        .filter(x => x.n === 'naranja' || x.n === 'roja')
        .sort((a, b) => (b.n === 'roja') - (a.n === 'roja'));
      const unidad = d => (d.unidad && !['binario', 'categoría'].includes(d.unidad) ? ` ${d.unidad}` : '');

      res.innerHTML = `<div class="au-diag-res">
        <div class="au-diag-card">
          <div style="font-size:12px;opacity:.8">${m.departamento} · ${Number(m.poblacion || 0).toLocaleString('es-CO')} hab.</div>
          <div style="font-size:20px;font-weight:900;margin:2px 0 8px">${m.nombre}</div>
          <div class="au-diag-icr">${fmt(m.icr, 1)}</div>
          <span class="au-nivel-pill" data-nivel="${nivel}" style="margin-top:6px">Nivel ${NIVELES[nivel].nombre}${m.nivel_por_regla ? ' · por regla de piso' : ''}</span>
          <div class="au-diag-capas">
            ${['A', 'H', 'S', 'R'].map(k => `<div class="au-diag-capa"><span class="au-cod" data-capa="${k}">${k}</span>
              <div class="au-capa-peso-barra"><span style="width:${capas[k] ?? 0}%;background:var(--au-capa-${k.toLowerCase()})"></span></div><span>${fmt(capas[k], 0)}</span></div>`).join('')}
          </div>
        </div>
        <div>
          <div style="font-size:13px;font-weight:800;margin-bottom:8px">Indicadores que empujan el riesgo (${criticos.length}) y acción sugerida:</div>
          ${criticos.length ? `<ul class="au-diag-lista">${criticos.map(x => `<li>
              <span class="au-nivel-pill" data-nivel="${x.n}">${x.cod}</span>
              <div><b>${ciudadano(x.cod).titulo_sencillo || x.d.nombre}: ${typeof x.d.valor === 'number' ? fmt(x.d.valor, Number.isInteger(x.d.valor) ? 0 : 1) : x.d.valor}${unidad(x.d)}</b><br>
              ${ACCION_POR_COD[x.cod] || 'Vigilar de cerca y verificar con el prestador; es un factor de vulnerabilidad estructural del municipio.'}</div></li>`).join('')}</ul>`
            : '<p class="au-diag-vacio">✅ Ningún indicador supera el umbral naranja. Mantener monitoreo ordinario y preparación.</p>'}
          <div class="au-diag-acciones">
            <button class="au-btn au-btn-primario" type="button" id="au-diag-protocolo">Ver protocolo del nivel ${NIVELES[nivel].nombre}</button>
            <button class="au-btn au-btn-fantasma" type="button" data-abrir-municipio="${m.divipola}">Abrir ficha municipal completa →</button>
          </div>
        </div>
      </div>`;
      const btnP = $('#au-diag-protocolo');
      if (btnP && PROTOCOLO[nivel]) btnP.addEventListener('click', () => {
        pintarProtocolo(nivel);
        $('.au-niveles-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    sel.addEventListener('change', e => pintar(e.target.value));
    if (munis[0]) pintar(munis[0].divipola);
  }

  function initQuiz() {
    let aciertos = 0;
    const actualizar = () => { $('#au-puntaje').textContent = `${aciertos} / ${QUIZ.length}`; };
    $$('#au-quiz .au-pregunta').forEach(fs => {
      const q = QUIZ[+fs.dataset.q];
      $$('.au-opcion', fs).forEach(b => b.addEventListener('click', () => {
        const j = +b.dataset.op;
        $$('.au-opcion', fs).forEach(x => { x.disabled = true; });
        $$('.au-opcion', fs)[q.ok].classList.add('correcta');
        const fb = $('.au-feedback', fs);
        if (j === q.ok) { aciertos++; fb.className = 'au-feedback visible ok'; fb.innerHTML = `✅ <strong>¡Correcto!</strong> ${q.exp}`; }
        else { b.classList.add('incorrecta'); fb.className = 'au-feedback visible ko'; fb.innerHTML = `💡 <strong>Casi.</strong> ${q.exp}`; }
        actualizar();
      }));
    });
    $('#au-quiz-reset').addEventListener('click', () => {
      aciertos = 0;
      $$('#au-quiz .au-opcion').forEach(x => { x.disabled = false; x.classList.remove('correcta', 'incorrecta'); });
      $$('#au-quiz .au-feedback').forEach(f => { f.className = 'au-feedback'; f.innerHTML = ''; });
      actualizar();
    });
  }

  function initNavegacionInterna(raiz) {
    raiz.addEventListener('click', e => {
      const ir = e.target.closest('[data-au-ir]');
      if (ir) {
        e.preventDefault();
        document.getElementById(ir.dataset.auIr)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const v = e.target.closest('[data-au-vista]');
      if (v) irAVista(v.dataset.auVista);
    });
    $('#au-btn-comenzar').addEventListener('click', () => $('#aula-m1').scrollIntoView({ behavior: 'smooth', block: 'start' }));

    // Resaltado del módulo activo + progreso de lectura
    const links = $$('.au-subnav a');
    const vistos = new Set();
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        vistos.add(id);
        links.forEach(a => {
          a.classList.toggle('activo', a.dataset.auIr === id);
          a.classList.toggle('visto', vistos.has(a.dataset.auIr) && a.dataset.auIr !== id);
        });
        $('#au-progreso-barra').style.width = `${(vistos.size / 5) * 100}%`;
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.au-modulo', raiz).forEach(m => obs.observe(m));
  }

  /* =========================================================================
     ARRANQUE
     ========================================================================= */
  function init() {
    const raiz = document.getElementById('vista-aula');
    const corte = window.VIGIA_DATA && window.VIGIA_DATA.corte;
    if (!raiz || !corte) return;

    const ag = corte.amenaza_global || {};
    const oni = ag.indice_oni_trimestral || {};
    const munis = [...(corte.municipios || [])].sort((a, b) => (b.icr ?? -1) - (a.icr ?? -1));
    const conteo = munis.reduce((acc, m) => { acc[m.nivel_alerta] = (acc[m.nivel_alerta] || 0) + 1; return acc; }, {});

    const ctx = {
      oni: oni.oni_anomalia ?? ag.indicador_a1_oni ?? 0,
      trimestre: `${oni.trimestre || ''} ${oni.ano || ''}`.trim(),
      intensidad: oni.intensidad_evento || '',
      n34: ag.indices_semanales?.nino34_anomalia ?? 0,
      idx: ag.indices_semanales || {},
      total: munis.length,
      rojos: conteo.roja || 0,
      naranjas: conteo.naranja || 0,
      conteo,
      poblacion: corte.metadata_corte?.poblacion_en_riesgo_critico
        ?? munis.filter(m => ['roja', 'naranja'].includes(m.nivel_alerta)).reduce((s, m) => s + (m.poblacion || 0), 0),
      fecha: corte.metadata_corte?.fecha_corte || '',
      opcionesMunis: munis.map(m => `<option value="${m.divipola}">${m.nombre} (${m.departamento}) · ICR ${fmt(m.icr, 1)} · ${NIVELES[m.nivel_alerta]?.nombre || ''}</option>`).join('')
    };

    raiz.innerHTML = htmlHero(ctx) + htmlModulo1(ctx) + htmlModulo2(ctx) + htmlModulo3() + htmlModulo4(ctx) + htmlModulo5();

    initSimulador();
    initCadena();
    initSimuladorIcr(munis);
    initExplorador();
    const pintarProtocolo = initProtocolo();
    initDiagnostico(munis, pintarProtocolo);
    initQuiz();
    initNavegacionInterna(raiz);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
