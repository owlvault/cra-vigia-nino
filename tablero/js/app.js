/**
 * LÓGICA PRINCIPAL — TABLERO VIGÍA EL NIÑO · ACUEDUCTOS (CRA)
 * Vistas implementadas: V-01 a V-07 según specs/tablero-ui.md
 * + Instrumento de Recorrido Ejecutivo (Modo Historia en 5 Actos)
 * + Mapa Territorial Profesional Cartográfico (Leaflet + DANE MGN 2018)
 */

/* =========================================================================
   CATÁLOGO DE DIVULGACIÓN CIUDADANA Y EXPLICACIONES PARA PÚBLICO NO TÉCNICO (RF-DIV-01)
   ========================================================================= */
const CATALOGO_DIVULGACION_CIUDADANA = {
  "A-1": {
    titulo_sencillo: "Temperatura del Océano Pacífico (El Niño)",
    que_mide: "Mide cuántos grados por encima de lo normal se ha calentado la superficie del mar en el Pacífico.",
    por_que_importa: "El sobrecalentamiento del mar frena los vientos y nubes que traen lluvias a Colombia, desatando sequías en nuestras cuencas.",
    cuando_hay_alerta: "Valores superiores a +1.5 °C indican El Niño Fuerte y sobre +2.0 °C anticipan un evento histórico con sequías severas."
  },
  "A-2": {
    titulo_sencillo: "Riesgo de Evento Histórico Extremo",
    que_mide: "La certeza científica (probabilidad %) de que El Niño alcance una fuerza extrema o destructiva en los próximos trimestres.",
    por_que_importa: "Permite que los alcaldes y acueductos preparen pozos de respaldo y carrotanques con meses de anticipación.",
    cuando_hay_alerta: "Probabilidades superiores al 60 % exigen activar de inmediato los planes de contingencia municipal."
  },
  "A-3": {
    titulo_sencillo: "Falta de Lluvia en el Último Mes",
    que_mide: "Compara la lluvia caída en los últimos 30 días con el promedio histórico que solía llover en el municipio para esta época.",
    por_que_importa: "Si deja de llover, las quebradas y ríos que surten la planta pierden caudal y los tanques no alcanzan a llenarse.",
    cuando_hay_alerta: "Déficits negativos del -40 % o -60 % indican que la sequía está castigando duramente al territorio."
  },
  "A-4": {
    titulo_sencillo: "Días Seguidos sin Caer Agua del Cielo",
    que_mide: "Cuántos días consecutivos lleva el municipio sin recibir una lluvia significativa (menos de 1 mm diario).",
    por_que_importa: "La tierra se seca como una esponja y los riachuelos dejan de fluir hacia las bocatomas del acueducto.",
    cuando_hay_alerta: "Más de 20 días secos enciende vigilancia preventiva; más de 30 días genera crisis de suministro."
  },
  "A-5": {
    titulo_sencillo: "Focos de Incendios en Cuencas Hídricas (7 días)",
    que_mide: "Puntos de calor e incendios forestales detectados vía satélite en las montañas del municipio en la última semana.",
    por_que_importa: "El fuego destruye la vegetación que almacena el agua y llena los ríos de cenizas, taponando los filtros de la planta.",
    cuando_hay_alerta: "Más de 10 focos activos representan una amenaza crítica para la calidad y disponibilidad del agua."
  },
  "H-1": {
    titulo_sencillo: "Nivel de Agua en el Río o Bocatoma",
    que_mide: "El porcentaje de agua viva que corre hoy por el río de donde se capta el agua, comparado con su volumen habitual.",
    por_que_importa: "Si el río baja a menos de la mitad, las bombas de captación no pueden succionar agua y la planta debe parar.",
    cuando_hay_alerta: "Caudales bajo el 50 % activan alerta naranja; menores al 30 % provocan racionamientos forzados."
  },
  "H-2": {
    titulo_sencillo: "Fragilidad Natural de la Cuenca en Sequía",
    que_mide: "Evaluación oficial del IDEAM sobre qué tan propensa a secarse es la cuenca del municipio en temporadas secas.",
    por_que_importa: "Zonas deforestadas o con suelos frágiles tienen muy poca capacidad de retener agua cuando no llueve.",
    cuando_hay_alerta: "Niveles 'Alto' o 'Muy Alto' significan que el municipio tiene muy poco margen de resistencia natural."
  },
  "H-3": {
    titulo_sencillo: "Presión Humana sobre el Río",
    que_mide: "Qué porcentaje del agua disponible en el río consumen los cultivos, fincas, industrias y el acueducto.",
    por_que_importa: "Si demasiados usuarios sacan agua del mismo río casi seco, no queda suficiente líquido para los hogares.",
    cuando_hay_alerta: "Presiones 'Altas' significan que la demanda humana casi supera el caudal total que el río puede aportar."
  },
  "H-4": {
    titulo_sencillo: "Horas de Reserva en los Tanques del Pueblo",
    que_mide: "Cuántas horas puede suministrar agua el acueducto si la captación en el río se interrumpe hoy mismo.",
    por_que_importa: "Es el colchón de seguridad de la comunidad para no quedarse sin agua de inmediato ante una falla o sequía extrema.",
    cuando_hay_alerta: "Menos de 12 horas es crítico; menos de 6 horas significa desabastecimiento inmediato ante cualquier imprevisto."
  },
  "H-5": {
    titulo_sencillo: "Llenado de Represas y Embalses",
    que_mide: "El porcentaje de agua guardado en los grandes embalses o lagos artificiales que surten a las ciudades.",
    por_que_importa: "Un embalse bajo obliga a ordenar turnos y racionamientos obligatorios por barrios para estirar las reservas.",
    cuando_hay_alerta: "Niveles inferiores al 35 % activan ahorro forzoso; bajo 25 % se declara emergencia hídrica inmediata."
  },
  "S-1": {
    titulo_sencillo: "Horas de Agua al Día en tu Llave",
    que_mide: "El promedio de horas al día que realmente tienes agua en el grifo de tu casa durante el último mes.",
    por_que_importa: "Lo digno y seguro son 24 horas continuas. Menos horas obliga a juntar agua en baldes y altera la rutina familiar.",
    cuando_hay_alerta: "Menos de 18 horas/día entra en vigilancia amarilla; menos de 12 horas/día es alerta roja por racionamiento crónico."
  },
  "S-2": {
    titulo_sencillo: "Pureza y Seguridad del Agua para Beber (IRCA)",
    que_mide: "Exámenes oficiales del INS que certifican si el agua tratada está libre de bacterias y químicos nocivos.",
    por_que_importa: "En sequía los ríos vienen más turbios; si el acueducto no la purifica bien, puede enfermar a niños y adultos.",
    cuando_hay_alerta: "De 0 a 5 % es agua potable sin riesgo. Más de 14 % exige hervirla; más de 35 % no es apta para consumo humano."
  },
  "S-3": {
    titulo_sencillo: "Hogares con Conexión Formal de Tubería",
    que_mide: "La proporción de viviendas del casco urbano que están conectadas formalmente a la red de acueducto con medidor.",
    por_que_importa: "Los barrios no conectados sufren el doble en sequía porque dependen de mangueras improvisadas o agua cara en camiones.",
    cuando_hay_alerta: "Coberturas bajo el 85 % o 70 % reflejan que gran parte de la población está en alta vulnerabilidad."
  },
  "S-4": {
    titulo_sencillo: "Fugas y Agua Desperdiciada bajo Tierra",
    que_mide: "El porcentaje de agua limpia que se pierde por tuberías rotas o conexiones ilegales antes de llegar a las casas.",
    por_que_importa: "En sequía botar agua limpia por tubos rotos es crítico: se pierde el esfuerzo de la planta y acelera los cortes.",
    cuando_hay_alerta: "Pérdidas superiores al 40 % o 50 % indican redes viejas que desperdician agua desesperadamente necesaria."
  },
  "S-5": {
    titulo_sencillo: "Quejas Ciudadanas por Cortes de Agua (PQR)",
    que_mide: "El incremento en los reclamos formales interpuestos por usuarios ante la empresa por fallas en el servicio.",
    por_que_importa: "Es la voz directa de los vecinos: cuando los cortes se agravan, los reclamos se disparan antes que las estadísticas.",
    cuando_hay_alerta: "Aumentos de más del 50 % o 100 % frente al año anterior demuestran que la comunidad ya no tolera las fallas del servicio."
  },
  "S-6": {
    titulo_sencillo: "Consumo Mensual de Agua en Casa",
    que_mide: "La cantidad de metros cúbicos de agua que consume al mes en promedio cada vivienda conectada.",
    por_que_importa: "Permite verificar si los ciudadanos están ahorrando solidariamente o si persiste el derroche en jardines y lavado.",
    cuando_hay_alerta: "Gastos por encima del límite regulado acarrean cobros con recargo (tarifa de desincentivo CRA)."
  },
  "R-1": {
    titulo_sencillo: "Protocolo de Emergencia del Acueducto (PEC)",
    que_mide: "Si la empresa de acueducto tiene listo y aprobado por el Estado su plan oficial para responder ante la sequía.",
    por_que_importa: "Un acueducto sin plan improvisa en la crisis, tardando días en conseguir carrotanques o reparar bombas.",
    cuando_hay_alerta: "Si el plan NO está vigente o radicado (valor NO / 0), el municipio queda desprotegido ante la emergencia."
  },
  "R-2": {
    titulo_sencillo: "Reparto de Agua de Emergencia en Carrotanques",
    que_mide: "Si la UNGRD, Bomberos o Cruz Roja ya están operando carrotanques para repartir agua en barrios sin servicio.",
    por_que_importa: "Ver carrotanques en las calles confirma que las tuberías colapsaron y el sistema entró en asistencia humanitaria.",
    cuando_hay_alerta: "Un reporte confirmado (SÍ / 1) sitúa automáticamente al municipio en condición de emergencia visible."
  },
  "R-3": {
    titulo_sencillo: "Cortes Programados y Racionamiento Oficial",
    que_mide: "Si la Alcaldía o el acueducto impusieron formalmente turnos de cortes de agua porque el río no alcanza.",
    por_que_importa: "Significa que no habrá agua en ciertas horas o días de la semana, paralizando comercios, escuelas y hogares.",
    cuando_hay_alerta: "Racionamiento confirmado (SÍ / 1) sitúa automáticamente al municipio en Alerta Naranja o Roja."
  },
  "R-4": {
    titulo_sencillo: "Decreto Municipal de Calamidad Pública",
    que_mide: "El acto administrativo formal expedido por el Alcalde cuando la sequía desbordó la capacidad local.",
    por_que_importa: "Es el paso legal indispensable para que el Gobierno Nacional envíe carrotanques, plantas y subsidios urgentes.",
    cuando_hay_alerta: "Una declaratoria vigente (SÍ / 1) ubica al municipio en la máxima prioridad de auxilio del Estado."
  },
  "NINO-12": {
    titulo_sencillo: "Región Niño 1+2 (Costa del Pacífico Oriental)",
    que_mide: "Mide el calentamiento de las aguas marinas justo frente a las costas de Ecuador, Perú y el sur de Colombia.",
    por_que_importa: "Modifica los vientos costeros y frena el ingreso de humedad hacia el suroccidente y los Andes colombianos.",
    cuando_hay_alerta: "Anomalías sobre +2.0 °C indican 'Niño Costero' extremo con impacto directo en el clima del país."
  },
  "NINO-3": {
    titulo_sencillo: "Región Niño 3 (Pacífico Oriental)",
    que_mide: "Monitorea la temperatura superficial del mar en la franja este del océano Pacífico ecuatorial.",
    por_que_importa: "A medida que se calienta, el calor se expande y consolida el bloqueo prolongado de lluvias en el país.",
    cuando_hay_alerta: "Anomalías superiores a +1.5 °C indican fuerte expansión del fenómeno hacia el continente."
  },
  "NINO-34": {
    titulo_sencillo: "Región Niño 3.4 (Termómetro Rector Mundial)",
    que_mide: "La zona clave internacional que define oficialmente la presencia e intensidad del fenómeno El Niño.",
    por_que_importa: "Es el motor que debilita los vientos alisios y corta las lluvias en las cuencas de los ríos Magdalena y Cauca.",
    cuando_hay_alerta: "Valores sobre +1.5 °C catalogan El Niño Fuerte y sobre +2.0 °C anuncian un evento histórico."
  },
  "NINO-4": {
    titulo_sencillo: "Región Niño 4 (Pacífico Central y Occidental)",
    que_mide: "Mide el calentamiento hacia la zona más profunda y occidental de la cuenca del Pacífico.",
    por_que_importa: "Confirma que la ola de calor cubre de extremo a extremo todo el océano, prolongando la sequía.",
    cuando_hay_alerta: "Anomalías positivas sostenidas confirman que el evento abarca la totalidad de la cuenca marina."
  },
  "ICR": {
    titulo_sencillo: "Índice de Capacidad y Riesgo Municipal (ICR)",
    que_mide: "Calificación sintética de 0 a 100 puntos que evalúa el peligro de desabastecimiento de agua en el municipio.",
    por_que_importa: "Puntajes altos alertan que el acueducto no resistirá la sequía sin aplicar racionamientos o auxilio externo.",
    cuando_hay_alerta: "Verde (<40 pts) normal; Amarillo (40-60) vigilancia; Naranja (60-75) alerta alta; Rojo (≥75) riesgo crítico de colapso."
  }
};

const CATALOGO_INDICADORES_MASTER = [
  { codigo: "A-1", capa: "A", nombre: "Anomalía de Temperatura Superficial del Mar (Niño 3.4 / ONI)", unidad: "°C", fuente: "NOAA CPC", escala: "Global / Cuenca Pacífico", formula: "SST_observada - SST_climatologia_30a (Media móvil trimestral centrado)", dir: "↑", en_icr: true, umbrales: { optimo: "0.5", amarilla: "1.0", naranja: "1.5", roja: "2.0", extremo: "2.5" } },
  { codigo: "A-2", capa: "A", nombre: "Probabilidad Multimodelo de Evento El Niño Extremo", unidad: "%", fuente: "NOAA CPC / IRI", escala: "Global", formula: "N_modelos(RONI >= 2.0 °C) / Total_modelos_ensamble * 100", dir: "↑", en_icr: true, umbrales: { optimo: "30", amarilla: "50", naranja: "65", roja: "80", extremo: "95" } },
  { codigo: "A-3", capa: "A", nombre: "Anomalía de Precipitación Acumulada 30 Días", unidad: "%", fuente: "IDEAM DHIME", escala: "Municipio / Estación", formula: "((P_acum_30d - P_media_historica) / P_media_historica) * 100", dir: "↓", en_icr: true, umbrales: { optimo: "-10", amarilla: "-25", naranja: "-45", roja: "-65", extremo: "-85" } },
  { codigo: "A-4", capa: "A", nombre: "Días Secos Consecutivos (Precipitación < 1.0 mm/día)", unidad: "días", fuente: "IDEAM", escala: "Municipio", formula: "Max_consecutivos(días con P_diaria < 1.0 mm)", dir: "↑", en_icr: true, umbrales: { optimo: "7", amarilla: "15", naranja: "25", roja: "40", extremo: "60" } },
  { codigo: "A-5", capa: "A", nombre: "Focos de Calor e Incendios en Microcuencas Abastecedoras (7d)", unidad: "focos", fuente: "NASA FIRMS / VIIRS", escala: "Microcuenca municipal", formula: "Count(anomalias_termicas_VIIRS_375m en buffer cuenca aportante)", dir: "↑", en_icr: false, umbrales: { optimo: "0", amarilla: "3", naranja: "8", roja: "18", extremo: "35" } },
  { codigo: "H-1", capa: "H", nombre: "Caudal Observado en Bocatoma vs. Caudal Medio Histórico", unidad: "%", fuente: "IDEAM / Operador", escala: "Punto de Captación", formula: "(Q_observado_diario / Q_medio_mensual_historico) * 100", dir: "↓", en_icr: true, umbrales: { optimo: "70", amarilla: "55", naranja: "40", roja: "25", extremo: "15" } },
  { codigo: "H-2", capa: "H", nombre: "Índice de Vulnerabilidad al Desabastecimiento Hídrico (IVH)", unidad: "adimensional", fuente: "IDEAM ENA", escala: "Subzona Hidrográfica (SZH)", formula: "Modelo multicriterio ENA: Oferta neta, regulación natural y demanda consuntiva", dir: "↑", en_icr: true, umbrales: { optimo: "0.20", amarilla: "0.40", naranja: "0.60", roja: "0.75", extremo: "0.90" } },
  { codigo: "H-3", capa: "H", nombre: "Índice de Uso del Agua Superficial (IUA)", unidad: "%", fuente: "IDEAM ENA", escala: "Cuenca / Municipio", formula: "(Demanda_total_consuntiva / Oferta_disponible_ano_seco) * 100", dir: "↑", en_icr: true, umbrales: { optimo: "15", amarilla: "30", naranja: "50", roja: "70", extremo: "90" } },
  { codigo: "H-4", capa: "H", nombre: "Autonomía de Almacenamiento en Tanques de Distribución", unidad: "horas", fuente: "SSPD SUI", escala: "Sistema de Acueducto", formula: "Capacidad_util_tanques_m3 / (Consumo_medio_horario_m3_h)", dir: "↓", en_icr: true, umbrales: { optimo: "24", amarilla: "16", naranja: "10", roja: "6", extremo: "2" } },
  { codigo: "H-5", capa: "H", nombre: "Nivel de Almacenamiento Útil de Embalses Abastecedores", unidad: "%", fuente: "XM Sinergox", escala: "Sistema / Embalse", formula: "(Volumen_util_actual_Mm3 / Capacidad_util_maxima_Mm3) * 100", dir: "↓", en_icr: true, umbrales: { optimo: "60", amarilla: "45", naranja: "32", roja: "22", extremo: "12" } },
  { codigo: "S-1", capa: "S", nombre: "Continuidad del Servicio de Acueducto", unidad: "horas/día", fuente: "SSPD SUI", escala: "Municipio", formula: "Horas/día promedio mensual ponderado por suscriptores conectados", dir: "↓", en_icr: true, umbrales: { optimo: "22", amarilla: "18", naranja: "14", roja: "10", extremo: "4" } },
  { codigo: "S-2", capa: "S", nombre: "Índice de Riesgo de la Calidad del Agua para Consumo Humano (IRCA)", unidad: "%", fuente: "INS SIVICAP", escala: "Municipio", formula: "Ponderado normativo de muestras fisicoquímicas y microbiológicas (Res. 2115/2007)", dir: "↑", en_icr: true, umbrales: { optimo: "5", amarilla: "14", naranja: "35", roja: "80", extremo: "100" } },
  { codigo: "S-3", capa: "S", nombre: "Cobertura de Acueducto Urbana Efectiva", unidad: "%", fuente: "SSPD SUI / DANE", escala: "Municipio", formula: "(Viviendas_conectadas_con_medidor / Total_viviendas_cabecera) * 100", dir: "↓", en_icr: true, umbrales: { optimo: "95", amarilla: "85", naranja: "70", roja: "50", extremo: "30" } },
  { codigo: "S-4", capa: "S", nombre: "Índice de Agua No Contabilizada (IANC)", unidad: "%", fuente: "SSPD SUI", escala: "Municipio", formula: "((Volumen_suministrado_red - Volumen_facturado) / Volumen_suministrado_red) * 100", dir: "↑", en_icr: true, umbrales: { optimo: "30", amarilla: "40", naranja: "55", roja: "70", extremo: "85" } },
  { codigo: "S-5", capa: "S", nombre: "Variación de Reclamos por Fallas en Suministro (PQR)", unidad: "%", fuente: "SSPD SUI", escala: "Municipio", formula: "((PQR_mes_actual - PQR_mes_ano_anterior) / PQR_mes_ano_anterior) * 100", dir: "↑", en_icr: true, umbrales: { optimo: "5", amarilla: "25", naranja: "50", roja: "100", extremo: "200" } },
  { codigo: "S-6", capa: "S", nombre: "Consumo Medio Residencial por Suscriptor", unidad: "m³/suscr/mes", fuente: "SSPD SUI", escala: "Municipio", formula: "Volumen_facturado_residencial_m3 / Numero_suscriptores_residenciales", dir: "◆", en_icr: false, umbrales: { optimo: "11", amarilla: "16", naranja: "20", roja: "25", extremo: "32" } },
  { codigo: "R-1", capa: "R", nombre: "Plan de Emergencia y Contingencia (PEC) Vigente y Radicado", unidad: "binario (1/0)", fuente: "SSPD SUI / CRA", escala: "Municipio / Prestador", formula: "1 si está adoptado, actualizado y radicado ante SSPD; 0 si no cuenta con plan", dir: "↓", en_icr: true, umbrales: { optimo: "1", amarilla: "1", naranja: "0", roja: "0", extremo: "0" } },
  { codigo: "R-2", capa: "R", nombre: "Distribución de Agua en Carrotanques de Emergencia Activa", unidad: "binario (1/0)", fuente: "UNGRD / CMGRD", escala: "Municipio", formula: "1 si opera operativo de suministro alterno por camiones cisterna; 0 en caso contrario", dir: "↑", en_icr: true, umbrales: { optimo: "0", amarilla: "0", naranja: "1", roja: "1", extremo: "1" } },
  { codigo: "R-3", capa: "R", nombre: "Racionamiento Oficial Declarado / Turnos Sectorizados", unidad: "binario (1/0)", fuente: "MinVivienda / Alcaldía", escala: "Municipio", formula: "1 si existe decreto municipal o resolución del prestador con esquema de cortes; 0 no", dir: "↑", en_icr: true, umbrales: { optimo: "0", amarilla: "0", naranja: "1", roja: "1", extremo: "1" } },
  { codigo: "R-4", capa: "R", nombre: "Declaratoria de Calamidad Pública por Sequía Vigente", unidad: "binario (1/0)", fuente: "UNGRD / Alcaldía", escala: "Municipio", formula: "1 si el municipio cuenta con Decreto de Calamidad Pública por Ley 1523; 0 sin decreto", dir: "↑", en_icr: true, umbrales: { optimo: "0", amarilla: "0", naranja: "1", roja: "1", extremo: "1" } }
];

function escaparHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escaparUrl(url) {
  if (!url) return '#';
  const limpia = String(url).trim();
  if (/^https?:\/\//i.test(limpia)) {
    return escaparHtml(limpia);
  }
  return '#';
}

function getExplicacionCiudadana(codigo) {
  if (!codigo) return null;
  const codNormalizado = String(codigo).toUpperCase().trim();
  return CATALOGO_DIVULGACION_CIUDADANA[codNormalizado] || {
    titulo_sencillo: codigo,
    que_mide: "Indicador oficial de vigilancia sectorial para el seguimiento de la sequía.",
    por_que_importa: "Monitorea la oferta de agua o la calidad del servicio en el territorio.",
    cuando_hay_alerta: "Valores fuera del rango normal indican aumento del riesgo de desabastecimiento."
  };
}

function generarHtmlExplicacion(codigo) {
  const exp = getExplicacionCiudadana(codigo);
  if (!exp) return '';
  return `
    <div class="exp-card-inner">
      <div class="exp-header-row">
        <span class="exp-badge">💡 Guía Ciudadana</span>
        <button type="button" class="btn-cerrar-exp" title="Cerrar explicación">✕</button>
      </div>
      <strong class="exp-titulo">${escaparHtml(exp.titulo_sencillo)}</strong>
      <div class="exp-bloque">
        <span class="exp-item-label">¿Qué nos dice?</span>
        <p class="exp-item-text">${escaparHtml(exp.que_mide)}</p>
      </div>
      <div class="exp-bloque">
        <span class="exp-item-label">¿Por qué te afecta?</span>
        <p class="exp-item-text">${escaparHtml(exp.por_que_importa)}</p>
      </div>
      <div class="exp-bloque exp-alerta">
        <span class="exp-item-label">¿Cuándo hay alerta?</span>
        <p class="exp-item-text">${escaparHtml(exp.cuando_hay_alerta)}</p>
      </div>
    </div>
  `;
}

// Exponer globalmente en window para accesibilidad y pruebas
window.escaparHtml = escaparHtml;
window.escaparUrl = escaparUrl;
window.CATALOGO_DIVULGACION_CIUDADANA = CATALOGO_DIVULGACION_CIUDADANA;
window.CATALOGO_INDICADORES_MASTER = CATALOGO_INDICADORES_MASTER;
window.getExplicacionCiudadana = getExplicacionCiudadana;
window.generarHtmlExplicacion = generarHtmlExplicacion;

document.addEventListener('DOMContentLoaded', () => {
  const data = window.VIGIA_DATA;
  if (!data || !data.corte) {
    console.error("No se encontraron datos en window.VIGIA_DATA");
    return;
  }

  // Asegurar que el catálogo de indicadores esté disponible
  if (!data.catalogoIndicadores || data.catalogoIndicadores.length === 0) {
    data.catalogoIndicadores = CATALOGO_INDICADORES_MASTER;
  }

  // Estado global de la aplicación
  const state = {
    vistaActual: 'V-01',
    corte: data.corte,
    variableMapa: 'icr', // 'icr', 's1', 'a3', 's2'
    filtroDepto: 'TODOS',
    filtroNivel: 'TODOS',
    busqueda: '',
    municipioSeleccionadoId: '44847', // Por defecto Uribia (La Guajira)
    deptoSeleccionadoId: null,
    ordenColumna: 'icr',
    ordenAscendente: false,
    storytelling: {
      activo: false,
      pasoActual: 1,
      totalPasos: 5
    },
    leafletMap: null,
    deptoLayer: null,
    muniLayer: null,
    muniMarkers: {},
    regionActual: 'TODOS',
    // Filtros y estados para ayudas visuales de indicadores
    filtroCatalogoCapa: 'TODOS',
    busquedaCatalogo: '',
    vistaCatalogoModo: 'galeria',
    filtroMuniCapa: 'TODAS',
    indicadorModalSeleccionado: null,
    // Instancias de Apache ECharts
    chartRadar: null,
    chartGauge: null,
    // Estado de Interoperabilidad con ArcGIS Pro Desktop
    arcgis: {
      activo: false,
      layer: null,
      geojsonData: null,
      corteOriginal: null,
      tempParsedData: null
    }
  };

  // Inicialización de componentes
  initNavegacion();
  initExplicacionesCiudadanas();
  initStorytelling();
  initCadenaCausal();
  initResumenV01();
  initAmenazaV02();
  initTerritorioV03();
  initFichaV04(state.municipioSeleccionadoId);
  initCatalogoV05();
  initAlertasV06();
  initFuentesV07();
  initExportaciones();

  // Exponer para interacción desde popups cartográficos
  window.abrirFichaDesdeMapa = function (divipola) {
    cambiarVista('V-04');
    abrirFichaMunicipal(divipola);
  };

  window.verEnMapaDesdeStory = function (divipola) {
    ocultarModoStory();
    cambiarVista('V-03');
    setTimeout(() => {
      if (state.leafletMap && state.muniMarkers[divipola]) {
        const marker = state.muniMarkers[divipola];
        state.leafletMap.flyTo(marker.getLatLng(), 9, { duration: 1.2 });
        setTimeout(() => marker.openPopup(), 1300);
      }
    }, 200);
  };

  /* =========================================================================
     1. NAVEGACIÓN ENTRE VISTAS (V-01 a V-07 + RECORRIDO EJECUTIVO)
     ========================================================================= */
  function initNavegacion() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const vista = tab.getAttribute('data-vista');
        cambiarVista(vista);
      });
    });

    // Botones de inicio de Recorrido Ejecutivo
    const btnHeaderStory = document.getElementById('btn-header-story');
    if (btnHeaderStory) {
      btnHeaderStory.addEventListener('click', () => {
        mostrarModoStory();
      });
    }

    const btnBannerStory = document.getElementById('btn-banner-iniciar-story');
    if (btnBannerStory) {
      btnBannerStory.addEventListener('click', () => {
        mostrarModoStory();
      });
    }

    const btnCerrarStory = document.getElementById('btn-cerrar-story');
    if (btnCerrarStory) {
      btnCerrarStory.addEventListener('click', () => {
        ocultarModoStory();
        cambiarVista('V-01');
      });
    }

    // Delegación para enlaces territoriales rápidos
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('[data-abrir-municipio]');
      if (target) {
        const divipola = target.getAttribute('data-abrir-municipio');
        abrirFichaMunicipal(divipola);
      }
    });
  }

  /* =========================================================================
     GESTIÓN GLOBAL DE EXPLICACIONES CIUDADANAS (GUÍA NO TÉCNICA DESPLEGABLE)
     ========================================================================= */
  function initExplicacionesCiudadanas() {
    document.addEventListener('click', (e) => {
      // 1. Clic en botón cerrar de cualquier panel explicativo
      const btnCerrar = e.target.closest('.btn-cerrar-exp');
      if (btnCerrar) {
        e.stopPropagation();
        const panel = btnCerrar.closest('.panel-exp-desplegable');
        if (panel) {
          panel.style.display = 'none';
          const panelId = panel.id;
          if (panelId) {
            document.querySelectorAll(`[data-panel-id="${panelId}"]`).forEach(b => {
              b.classList.remove('activo');
              b.setAttribute('aria-expanded', 'false');
            });
          }
          if (panelId === 'exp-noaa-box') {
            document.querySelectorAll('.btn-info-noaa').forEach(b => {
              b.classList.remove('activo');
              b.setAttribute('aria-expanded', 'false');
            });
          }
          if (panelId && panelId.startsWith('exp-muni-')) {
            const cod = panelId.replace('exp-muni-', '');
            document.querySelectorAll(`.btn-info-ind[data-codigo="${cod}"]`).forEach(b => {
              b.classList.remove('activo');
              b.setAttribute('aria-expanded', 'false');
            });
          }
        }
        return;
      }

      // 2. Clic en botón de información ciudadana (? o ícono info)
      const btn = e.target.closest('.btn-info-ind, .btn-info-noaa, .btn-info-popover');
      if (!btn) return;

      e.stopPropagation();
      const cod = btn.getAttribute('data-codigo');
      if (!cod) return;

      let panel = null;
      const panelId = btn.getAttribute('data-panel-id');
      if (panelId) {
        panel = document.getElementById(panelId);
      }
      if (!panel && btn.classList.contains('btn-info-noaa')) {
        panel = document.getElementById('exp-noaa-box');
      }
      if (!panel) {
        panel = document.getElementById(`exp-muni-${cod}`) ||
          document.getElementById(`exp-cat-${cod}`) ||
          document.getElementById(`exp-tbl-${cod}`);
      }
      if (!panel) {
        panel = btn.parentElement?.querySelector('.panel-exp-desplegable') ||
          btn.closest('.ind-top-row')?.parentElement?.querySelector('.panel-exp-desplegable') ||
          btn.closest('td')?.querySelector('.panel-exp-desplegable') ||
          btn.closest('th')?.querySelector('.panel-exp-desplegable');
      }

      if (!panel) return;

      const isAbierto = panel.style.display !== 'none' &&
        (!panel.hasAttribute('data-codigo-actual') || panel.getAttribute('data-codigo-actual') === cod);

      if (isAbierto) {
        panel.style.display = 'none';
        btn.classList.remove('activo');
        btn.setAttribute('aria-expanded', 'false');
        if (btn.classList.contains('btn-info-noaa')) {
          document.querySelectorAll('.btn-info-noaa').forEach(b => {
            b.classList.remove('activo');
            b.setAttribute('aria-expanded', 'false');
          });
        }
      } else {
        if (btn.classList.contains('btn-info-noaa')) {
          document.querySelectorAll('.btn-info-noaa').forEach(b => {
            b.classList.remove('activo');
            b.setAttribute('aria-expanded', 'false');
          });
        }
        panel.innerHTML = generarHtmlExplicacion(cod);
        panel.setAttribute('data-codigo-actual', cod);
        panel.style.display = 'block';
        btn.classList.add('activo');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function cambiarVista(idVista) {
    if (idVista === 'STORY') {
      mostrarModoStory();
      return;
    }

    const ejecutarCambio = () => {
      ocultarModoStory();
      state.vistaActual = idVista;

      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-vista') === idVista);
      });

      document.querySelectorAll('.vista-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `vista-${idVista.toLowerCase()}`);
      });

      if (idVista === 'V-03' && state.leafletMap) {
        setTimeout(() => {
          state.leafletMap.invalidateSize();
        }, 120);
      }

      if (idVista === 'V-04') {
        setTimeout(() => {
          if (state.chartRadar) state.chartRadar.resize();
          if (state.chartGauge) state.chartGauge.resize();
        }, 120);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!document.startViewTransition) {
      ejecutarCambio();
    } else {
      document.startViewTransition(() => {
        ejecutarCambio();
      });
    }
  }

  function mostrarModoStory() {
    const ejecutarStory = () => {
      state.storytelling.activo = true;
      document.querySelectorAll('.vista-panel').forEach(panel => panel.classList.remove('active'));
      document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));

      const tabStory = document.getElementById('tab-storytelling');
      if (tabStory) tabStory.classList.add('active');

      const seccionStory = document.getElementById('seccion-storytelling');
      if (seccionStory) seccionStory.classList.add('active');

      renderStoryStep(state.storytelling.pasoActual);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!document.startViewTransition) {
      ejecutarStory();
    } else {
      document.startViewTransition(() => {
        ejecutarStory();
      });
    }
  }

  function ocultarModoStory() {
    state.storytelling.activo = false;
    const seccionStory = document.getElementById('seccion-storytelling');
    if (seccionStory) seccionStory.classList.remove('active');

    const tabStory = document.getElementById('tab-storytelling');
    if (tabStory) tabStory.classList.remove('active');
  }

  /* =========================================================================
     2. INSTRUMENTO DE RECORRIDO EJECUTIVO DE RIESGO
     ========================================================================= */
  function initStorytelling() {
    // Botones del Stepper (Pasos 1 a 5)
    document.querySelectorAll('.step-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const paso = parseInt(btn.getAttribute('data-step'), 10);
        state.storytelling.pasoActual = paso;
        renderStoryStep(paso);
      });
    });

    // Botones Anterior y Siguiente
    const btnPrev = document.getElementById('btn-story-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.storytelling.pasoActual > 1) {
          state.storytelling.pasoActual--;
          renderStoryStep(state.storytelling.pasoActual);
        }
      });
    }

    const btnNext = document.getElementById('btn-story-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (state.storytelling.pasoActual < state.storytelling.totalPasos) {
          state.storytelling.pasoActual++;
          renderStoryStep(state.storytelling.pasoActual);
        } else {
          // Último paso: pasar al tablero
          ocultarModoStory();
          cambiarVista('V-03');
        }
      });
    }

    // Navegación por teclado (Flechas Izquierda / Derecha)
    document.addEventListener('keydown', (e) => {
      if (!state.storytelling.activo) return;
      if (e.key === 'ArrowRight' && state.storytelling.pasoActual < state.storytelling.totalPasos) {
        state.storytelling.pasoActual++;
        renderStoryStep(state.storytelling.pasoActual);
      } else if (e.key === 'ArrowLeft' && state.storytelling.pasoActual > 1) {
        state.storytelling.pasoActual--;
        renderStoryStep(state.storytelling.pasoActual);
      } else if (e.key === 'Escape') {
        ocultarModoStory();
        cambiarVista('V-01');
      }
    });
  }

  function renderStoryStep(paso) {
    // Actualizar estados del Stepper
    document.querySelectorAll('.step-card').forEach(card => {
      const stepNum = parseInt(card.getAttribute('data-step'), 10);
      card.classList.toggle('active', stepNum === paso);
      card.classList.toggle('completed', stepNum < paso);
    });

    // Actualizar botones de navegación inferior
    const btnPrev = document.getElementById('btn-story-prev');
    const btnNext = document.getElementById('btn-story-next');
    const indicator = document.getElementById('story-step-indicator');

    if (btnPrev) btnPrev.disabled = (paso === 1);
    if (btnNext) {
      btnNext.innerHTML = (paso === state.storytelling.totalPasos) ?
        `Explorar Tablero Territorial <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>` :
        `Capítulo Siguiente <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    }
    if (indicator) indicator.textContent = `Capítulo ${paso} de ${state.storytelling.totalPasos}`;

    const container = document.getElementById('story-content-area');
    if (!container) return;

    const meta = state.corte.metadata_corte;
    const amenaza = state.corte.amenaza_global;
    const munis = state.corte.municipios;

    if (paso === 1) {
      // ACTO I: LA AMENAZA MACRO (ENSO)
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto I · La Física de la Amenaza</span>
              <h3 class="story-chapter-title">El Océano Pacífico se Calienta: +3.2 °C en Niño 3.4</h3>
              <div class="story-narrative-text">
                <p>
                  El monitoreo de la <strong>NOAA (Climate Prediction Center)</strong> y del <strong>IDEAM</strong> confirma que el fenómeno El Niño 2026-27 ha ingresado en una fase clasificada como <strong>Muy Fuerte (Histórico)</strong>.
                </p>
                <p>
                  La temperatura superficial del mar en la región <strong>Niño 3.4</strong> exhibe una anomalía de <strong>+3.2 °C</strong> (con picos en la región Niño 1+2 de <strong>+5.3 °C</strong>). El Índice Oceánico El Niño (ONI) para el trimestre julio-septiembre se consolidó en <strong>+2.16 °C</strong>, superando con holgura el umbral de emergencia regulatoria (+0.5 °C).
                </p>
                <p>
                  Los modelos internacionales asignan un <strong>75 % de probabilidad</strong> de que el evento mantenga una severidad extrema hasta el primer trimestre de 2027, trasladando un déficit de lluvias superior al <strong>70 %</strong> a las cuencas abastecedoras de Colombia.
                </p>
              </div>

              <div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Diagnóstico Regulatorio CRA
                </div>
                La inercia térmica oceánica tiene un desfase de 4 a 6 semanas antes de reflejarse en los caudales mínimos de bocatomas. La ventana de prevención para acueductos se cierra en octubre.
              </div>
            </div>

            <div class="story-kpi-grid">
              <div class="story-kpi-pill">
                <div class="val">+3.2 °C</div>
                <div class="lbl">Anomalía Niño 3.4</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">+2.16 °C</div>
                <div class="lbl">Índice ONI Trimestral</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">75.0 %</div>
                <div class="lbl">Probabilidad Muy Fuerte</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">42 días</div>
                <div class="lbl">Secos en Caribe</div>
              </div>
            </div>
          </div>

          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Comparativa Térmica ENSO y Ciclo Histórico de Crisis</span>
              <span style="font-size:12px;color:var(--cra-cian-texto);font-weight:700">Fuente: NOAA CPC 2026-10-08</span>
            </div>
            <div class="story-visual-content">
              <!-- Visualizador de termómetros ENSO -->
              <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;margin-bottom:20px">
                <div style="background:var(--tinte);padding:14px;border-radius:var(--radio-md);text-align:center;border-top:4px solid var(--alerta-roja)">
                  <div style="font-size:11px;font-weight:800;color:var(--texto-claro)">Niño 1+2 (Costa)</div>
                  <div style="font-size:24px;font-weight:900;color:var(--alerta-roja);margin:4px 0">+5.3 °C</div>
                  <div style="font-size:11px;color:var(--texto)">SST: 26.1 °C</div>
                </div>
                <div style="background:var(--tinte);padding:14px;border-radius:var(--radio-md);text-align:center;border-top:4px solid var(--alerta-roja)">
                  <div style="font-size:11px;font-weight:800;color:var(--texto-claro)">Niño 3 (Oriental)</div>
                  <div style="font-size:24px;font-weight:900;color:var(--alerta-roja);margin:4px 0">+4.0 °C</div>
                  <div style="font-size:11px;color:var(--texto)">SST: 29.0 °C</div>
                </div>
                <div style="background:var(--tinte);padding:14px;border-radius:var(--radio-md);text-align:center;border-top:4px solid var(--alerta-naranja)">
                  <div style="font-size:11px;font-weight:800;color:var(--cra-cian-texto)">Niño 3.4 (Referencia)</div>
                  <div style="font-size:24px;font-weight:900;color:var(--alerta-naranja);margin:4px 0">+3.2 °C</div>
                  <div style="font-size:11px;color:var(--texto)">SST: 29.9 °C</div>
                </div>
                <div style="background:var(--tinte);padding:14px;border-radius:var(--radio-md);text-align:center;border-top:4px solid var(--alerta-amarilla)">
                  <div style="font-size:11px;font-weight:800;color:var(--texto-claro)">Niño 4 (Occidental)</div>
                  <div style="font-size:24px;font-weight:900;color:#C79E00;margin:4px 0">+1.2 °C</div>
                  <div style="font-size:11px;color:var(--texto)">SST: 29.9 °C</div>
                </div>
              </div>

              <!-- Tabla de comparación histórica -->
              <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:16px;flex:1">
                <h4 style="font-size:14px;font-weight:800;margin-bottom:10px;color:var(--texto-fuerte)">Comparativa Histórica de Eventos El Niño Mayores</h4>
                <div class="tabla-container">
                  <table class="tabla-vigia">
                    <thead>
                      <tr>
                        <th>Evento / Año</th>
                        <th>Pico ONI</th>
                        <th>Categoría</th>
                        <th>Impacto Acueductos Colombia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>El Niño 1997-98</strong></td>
                        <td>+2.40 °C</td>
                        <td>Super El Niño</td>
                        <td>Racionamiento en más de 200 municipios; crisis severa en Guajira y Boyacá.</td>
                      </tr>
                      <tr>
                        <td><strong>El Niño 2015-16</strong></td>
                        <td>+2.60 °C</td>
                        <td>Histórico</td>
                        <td>Colapso de embalses en Cundinamarca y Caribe; activación decarrotanques en 340 municipios.</td>
                      </tr>
                      <tr style="background:var(--cra-cian-suave);font-weight:700">
                        <td><strong style="color:var(--cra-cian-texto)">El Niño 2026-27 (Actual)</strong></td>
                        <td><span class="chip-alerta roja">+3.20 °C</span></td>
                        <td>Muy Fuerte / Histórico</td>
                        <td>10.9M de personas en riesgo crítico; 5 municipios en Alerta Roja confirmada.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 2) {
      // ACTO II: EL EMBUDO TERRITORIAL (FOCOS CRÍTICOS)
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto II · Geografía del Riesgo</span>
              <h3 class="story-chapter-title">Tres Corredores en Jaque: La Guajira, Bajo Magdalena y Santander</h3>
              <div class="story-narrative-text">
                <p>
                  El impacto territorial es asimétrico. El algoritmo del Vigía detecta que la crisis se canaliza a través de <strong>tres frentes hidrogeográficos críticos</strong>:
                </p>
                <p>
                  <strong>1. Corredor Árido de La Guajira:</strong> <em>Manaure (87.1), Uribia (85.8), Maicao (83.0) y Riohacha (77.2)</em> ocupan 4 de los 5 puestos más vulnerables de Colombia en <strong>Alerta Roja</strong>. Fuentes subterráneas hipersalinas y nula reserva de agua.
                </p>
                <p>
                  <strong>2. Bajo Magdalena y Depresión Momposina:</strong> <em>Plato (71.6), El Carmen de Bolívar (73.9) y Magangué (59.7)</em>. La caída de niveles fluviales a mínimos históricos deja en seco las barcazas de captación superficial.
                </p>
                <p>
                  <strong>3. Foco del Chicamocha y Guanentá:</strong> <em>Barichara (75.4, Roja)</em> enfrenta racionamiento de más de 18 horas diarias por desecamiento de quebradas menores, en contraste con Bucaramanga que cuenta con embalses de regulación.
                </p>
              </div>

              <div class="story-insight-box critico">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Alerta Territorial Prioritaria
                </div>
                5 municipios en Alerta Roja y 12 en Alerta Naranja concentran el 78 % del riesgo nacional. Los sistemas dependientes de fuentes superficiales sin embalse colapsan primero.
              </div>
            </div>

            <div class="story-kpi-grid">
              <div class="story-kpi-pill">
                <div class="val" style="color:var(--alerta-roja)">5 Munis</div>
                <div class="lbl">Alerta Roja Máxima</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val" style="color:var(--alerta-naranja)">12 Munis</div>
                <div class="lbl">Alerta Naranja Alta</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">84.1 pts</div>
                <div class="lbl">ICR Medio en La Guajira</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">&lt; 6 h/d</div>
                <div class="lbl">Continuidad en Puntos Rojos</div>
              </div>
            </div>
          </div>

          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Focos Territoriales en Alerta Roja y Corredores de Sequía</span>
              <button class="btn-secundario" onclick="window.verEnMapaDesdeStory('44847')" style="font-size:11px;padding:4px 10px">Ver en Mapa Completo ➔</button>
            </div>
            <div class="story-visual-content">
              <!-- Tarjetas de los 5 municipios en Alerta Roja -->
              <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px">
                ${munis.filter(m => m.nivel_alerta === 'roja').map(m => `
                  <div style="background:var(--tinte);border:1px solid #FFCDD2;border-left:5px solid var(--alerta-roja);border-radius:var(--radio-md);padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span class="pulse-indicator"></span>
                        <strong style="font-size:15px;color:var(--texto-fuerte)">${escaparHtml(m.nombre)}</strong>
                        <span style="font-size:12px;color:var(--texto-claro)">(${escaparHtml(m.departamento)})</span>
                      </div>
                      <div style="font-size:12px;color:var(--texto);margin-top:3px">
                        Continuidad: <strong>${escaparHtml(m.indicadores['S-1']?.valor ?? '—')} h/d</strong> · Lluvia 30d: <strong>${escaparHtml(m.indicadores['A-3']?.valor ?? '—')} %</strong> · Población: <strong>${Number(m.poblacion || 0).toLocaleString('es-CO')} hab.</strong>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                      <div style="text-align:right">
                        <div style="font-size:18px;font-weight:900;color:var(--alerta-roja)">${Number(m.icr || 0).toFixed(1)}</div>
                        <div style="font-size:10px;text-transform:uppercase;color:var(--texto-claro);font-weight:700">ICR RIESGO</div>
                      </div>
                      <button class="btn-secundario" onclick="window.verEnMapaDesdeStory('${escaparHtml(m.divipola)}')" style="padding:4px 8px;font-size:11px">Localizar</button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--radio-md);padding:12px 14px;font-size:12px;color:#166534">
                <strong>Análisis Espacial CRA:</strong> Los acueductos de La Guajira y el Chicamocha operan sin reservas hídricas de contingencia. La intervención técnica exige carrotanques y pozos de emergencia inmediatos.
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 3) {
      // ACTO III: CAUSALIDAD DEL RIESGO (4 CAPAS DEL ICR)
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto III · Modelo Algorítmico CRA</span>
              <h3 class="story-chapter-title">Por Qué Colapsa el Servicio: La Vulnerabilidad Compuesta</h3>
              <div class="story-narrative-text">
                <p>
                  Un error clásico es culpar exclusivamente a la sequía. El modelo del <strong>Índice Compuesto de Riesgo (ICR)</strong> demuestra que el desabastecimiento surge de la interacción perversa de 4 dimensiones técnicas:
                </p>
                <p>
                  $$ICR = 0.25 \\times A + 0.25 \\times H + 0.35 \\times S + 0.15 \\times G$$
                </p>
                <p>
                  - <strong>Capa A (Amenaza, 25%):</strong> Falta de lluvia y temperatura.<br>
                  - <strong>Capa H (Vulnerabilidad Hídrica, 25%):</strong> Caudal de fuentes y pérdidas en red (IANC).<br>
                  - <strong>Capa S (Servicio al Usuario, 35%):</strong> Horas de continuidad e índice de calidad IRCA.<br>
                  - <strong>Capa G (Gobernanza y Respuesta, 15%):</strong> Planes de contingencia y solvencia del operador.
                </p>
              </div>

              <div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  Caso Testigo de Resiliencia
                </div>
                ¿Por qué Bucaramanga (ICR 31.3) y Barichara (ICR 75.4) tienen resultados opuestos ante el mismo Niño? Bucaramanga posee el Embalse de Tona (>90 días de autonomía) y pérdidas del 28%; Barichara depende de quebradas secas y pierde el 62% del agua tratada.
              </div>
            </div>

            <div class="story-kpi-grid">
              <div class="story-kpi-pill">
                <div class="val">35 %</div>
                <div class="lbl">Peso Capa Servicio (S)</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">25 %</div>
                <div class="lbl">Peso Capa Hídrica (H)</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">25 %</div>
                <div class="lbl">Peso Amenaza (A)</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">15 %</div>
                <div class="lbl">Peso Respuesta (G)</div>
              </div>
            </div>
          </div>

          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Comparador de Vulnerabilidad por Capas: Uribia vs Bucaramanga</span>
              <span style="font-size:12px;color:var(--texto-claro)">Diagnóstico CRA</span>
            </div>
            <div class="story-visual-content">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
                <!-- Tarjeta Uribia -->
                <div style="background:#FFF5F5;border:1px solid #FFCDD2;border-radius:var(--radio-md);padding:16px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <strong style="color:var(--alerta-roja);font-size:15px">Uribia (La Guajira)</strong>
                    <span class="chip-alerta roja">ICR: 85.8</span>
                  </div>
                  <div style="font-size:12px;margin-bottom:10px;color:var(--texto)">Vulnerabilidad Crítica Extrema</div>
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Amenaza (A):</span><span>94.2 pts</span></div>
                    <div style="height:6px;background:#FFEBEE;border-radius:3px;overflow:hidden"><div style="width:94%;height:100%;background:var(--alerta-roja)"></div></div>
                  </div>
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Vulnerabilidad Hídrica (H):</span><span>78.3 pts</span></div>
                    <div style="height:6px;background:#FFEBEE;border-radius:3px;overflow:hidden"><div style="width:78%;height:100%;background:var(--alerta-roja)"></div></div>
                  </div>
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Capacidad de Servicio (S):</span><span>76.2 pts</span></div>
                    <div style="height:6px;background:#FFEBEE;border-radius:3px;overflow:hidden"><div style="width:76%;height:100%;background:var(--alerta-roja)"></div></div>
                  </div>
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Falta de Gobernanza (G):</span><span>100.0 pts</span></div>
                    <div style="height:6px;background:#FFEBEE;border-radius:3px;overflow:hidden"><div style="width:100%;height:100%;background:var(--alerta-roja)"></div></div>
                  </div>
                </div>

                <!-- Tarjeta Bucaramanga -->
                <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--radio-md);padding:16px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <strong style="color:var(--alerta-sin);font-size:15px">Bucaramanga (Santander)</strong>
                    <span class="chip-alerta sin_alerta">ICR: 31.3</span>
                  </div>
                  <div style="font-size:12px;margin-bottom:10px;color:var(--texto)">Alta Resiliencia Estructural</div>
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Amenaza (A):</span><span>42.0 pts</span></div>
                    <div style="height:6px;background:#E8F5E9;border-radius:3px;overflow:hidden"><div style="width:42%;height:100%;background:var(--alerta-sin)"></div></div>
                  </div>
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Vulnerabilidad Hídrica (H):</span><span>28.5 pts</span></div>
                    <div style="height:6px;background:#E8F5E9;border-radius:3px;overflow:hidden"><div style="width:28%;height:100%;background:var(--alerta-sin)"></div></div>
                  </div>
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Capacidad de Servicio (S):</span><span>22.0 pts</span></div>
                    <div style="height:6px;background:#E8F5E9;border-radius:3px;overflow:hidden"><div style="width:22%;height:100%;background:var(--alerta-sin)"></div></div>
                  </div>
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>Falta de Gobernanza (G):</span><span>25.0 pts</span></div>
                    <div style="height:6px;background:#E8F5E9;border-radius:3px;overflow:hidden"><div style="width:25%;height:100%;background:var(--alerta-sin)"></div></div>
                  </div>
                </div>
              </div>

              <div style="background:var(--tinte);border-radius:var(--radio-md);padding:14px;font-size:13px;color:var(--texto-fuerte)">
                <strong>Conclusión Algorítmica:</strong> Las pérdidas físicas de agua en la red (IANC > 60%) y la inexistencia de planes de emergencia (PEC) multiplican por tres el riesgo de desabastecimiento frente al impacto climático puro.
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 4) {
      // ACTO IV: EL IMPACTO HUMANO Y PRESTADORES
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto IV · Costo Social y Operativo</span>
              <h3 class="story-chapter-title">10.9 Millones de Colombianos en Riesgo Operativo</h3>
              <div class="story-narrative-text">
                <p>
                  El impacto del estiaje no es un número estadístico; se traduce en hogares sin suministro continuo y prestadores de servicios al borde de la quiebra operativa:
                </p>
                <p>
                  - <strong>10.870.500 personas</strong> habitan en municipios calificados en niveles Naranja y Rojo.<br>
                  - El <strong>68 % de la población en riesgo</strong> pertenece a los <strong>estratos socioeconómicos 1 y 2</strong>, quienes sufren con mayor dureza los sobrecostos de comprar agua en pimpinas o carro-tanques.<br>
                  - <strong>14 acueductos</strong> ya tienen racionamientos sectorizados activos con menos de 6 horas de suministro al día.<br>
                  - Los prestadores comunitarios y pequeños carecen de flujo de caja para solventar el bombeo diésel continuo de pozos profundos.
                </p>
              </div>

              <div class="story-insight-box critico">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Fragilidad de Prestadores Comunitarios
                </div>
                En menos de 45 días continuos de sequía, los pequeños operadores entran en insolvencia financiera por costos no previstos de combustible y compra de agua en bloque.
              </div>
            </div>

            <div class="story-kpi-grid">
              <div class="story-kpi-pill">
                <div class="val" style="color:var(--alerta-roja)">10.9 M</div>
                <div class="lbl">Población en Naranja y Rojo</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">68 %</div>
                <div class="lbl">Estratos 1 y 2</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val" style="color:var(--alerta-naranja)">14 Munis</div>
                <div class="lbl">Racionamientos Activos</div>
              </div>
              <div class="story-kpi-pill">
                <div class="val">73</div>
                <div class="lbl">Prestadores en Alerta</div>
              </div>
            </div>
          </div>

          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Distribución Poblacional por Nivel de Riesgo y Estrato</span>
              <span style="font-size:12px;color:var(--texto-claro)">DANE / SUI SSPD</span>
            </div>
            <div class="story-visual-content">
              <!-- Barras de población por nivel -->
              <div style="margin-bottom:20px">
                <div style="margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:var(--alerta-roja)">
                    <span>Nivel Rojo (Alerta Máxima)</span>
                    <span>1.480.000 hab. (13.6%)</span>
                  </div>
                  <div style="height:14px;background:#FFEBEE;border-radius:7px;overflow:hidden">
                    <div style="width:13.6%;height:100%;background:var(--alerta-roja)"></div>
                  </div>
                </div>

                <div style="margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:var(--alerta-naranja)">
                    <span>Nivel Naranja (Alerta Alta)</span>
                    <span>9.390.500 hab. (86.4%)</span>
                  </div>
                  <div style="height:14px;background:#FFE8D6;border-radius:7px;overflow:hidden">
                    <div style="width:86.4%;height:100%;background:var(--alerta-naranja)"></div>
                  </div>
                </div>

                <div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:var(--alerta-sin)">
                    <span>Sin Alerta / Resilientes</span>
                    <span>4.120.000 hab. (Estable)</span>
                  </div>
                  <div style="height:14px;background:#E8F5E9;border-radius:7px;overflow:hidden">
                    <div style="width:38%;height:100%;background:var(--alerta-sin)"></div>
                  </div>
                </div>
              </div>

              <!-- Lista de municipios con racionamiento activo -->
              <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;flex:1">
                <h4 style="font-size:13px;font-weight:800;color:var(--texto-fuerte);margin-bottom:8px">Municipios con Esquemas de Racionamiento Declarados:</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
                  <div style="padding:6px 10px;background:var(--tinte);border-radius:4px">🔴 <strong>Uribia:</strong> 4 h/d (Turnos cada 48h)</div>
                  <div style="padding:6px 10px;background:var(--tinte);border-radius:4px">🔴 <strong>Manaure:</strong> 3 h/d (Crítico)</div>
                  <div style="padding:6px 10px;background:var(--tinte);border-radius:4px">🔴 <strong>Barichara:</strong> 6 h/d (Sectorizado)</div>
                  <div style="padding:6px 10px;background:var(--tinte);border-radius:4px">🟠 <strong>Plato:</strong> 8 h/d (Bajo caudal)</div>
                  <div style="padding:6px 10px;background:var(--tinte);border-radius:4px">🟠 <strong>El Carmen de B.:</strong> 7 h/d (Turnos)</div>
                  <div style="padding:6px 10px;background:var(--tinte);border-radius:4px">🟠 <strong>Espinal:</strong> 10 h/d (Presión reducida)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 5) {
      // ACTO V: TABLERO DE COMANDO Y RUTA CRA
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto V · Hoja de Ruta Regulatoria</span>
              <h3 class="story-chapter-title">Decisiones Normativas Inmediatas de la Comisión</h3>
              <div class="story-narrative-text">
                <p>
                  Para contener el desabastecimiento y proteger a los usuarios, la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA) activa cuatro instrumentos normativos y operativos inmediatos:
                </p>
                <p>
                  <strong>1. Desincentivo Económico al Sobreconsumo:</strong> Cobro de tarifa duplicada para consumos que superen el tope de subsistencia (13 m³/mes en clima frío, 16 m³/mes en templado/cálido).<br>
                  <strong>2. Flexibilización para Fuentes Alternas:</strong> Incorporación transitoria de costos de carrotanques y pozos sin modificar el estudio tarifario.<br>
                  <strong>3. Mesa Interinstitucional de Contingencia:</strong> Reporte diario al SNGRD (UNGRD, MinVivienda, SuperServicios).<br>
                  <strong>4. Vigilancia Intensiva de Calidad (SIVICAP):</strong> Prevención de brotes epidemiológicos por concentración de contaminantes.
                </p>
              </div>

              <div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Mandato Regulatorio CRA
                </div>
                El sistema Vigía aporta el sustento probatorio vinculante para motivar las resoluciones de emergencia tarifaria y racionamiento temporal ante los alcaldes y la SSPD.
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
              <button class="btn-iniciar-story" onclick="window.print()" style="width:100%;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Descargar / Imprimir Informe Ejecutivo de Situación
              </button>
            </div>
          </div>

          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Matriz de Acciones Regulatorias Prioritarias CRA</span>
              <span style="font-size:12px;color:var(--alerta-sin);font-weight:800">4 Instrumentos Activos</span>
            </div>
            <div class="story-visual-content">
              <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px">
                <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;border-left:4px solid var(--cra-cian)">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="color:var(--texto-fuerte);font-size:14px">1. Desincentivo al Sobreconsumo (Resolución CRA)</strong>
                    <span style="background:#E6F5FA;color:var(--cra-cian-texto);font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px">VIGENTE</span>
                  </div>
                  <p style="font-size:12px;color:var(--texto);margin-top:4px">
                    Aplica a los 17 municipios en nivel Naranja y Rojo. Recaudo transferido al Fondo Nacional Ambiental para la protección de cuencas abastecedoras.
                  </p>
                </div>

                <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;border-left:4px solid var(--alerta-naranja)">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="color:var(--texto-fuerte);font-size:14px">2. Esquema Transitorio de Abastecimiento Alterno</strong>
                    <span style="background:#FFE8D6;color:var(--alerta-naranja);font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px">PRIORIZADO</span>
                  </div>
                  <p style="font-size:12px;color:var(--texto);margin-top:4px">
                    Reconocimiento de costos de acarreo con carrotanques en La Guajira, Bolívar y Magdalena para evitar la quiebra de pequeños prestadores.
                  </p>
                </div>

                <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;border-left:4px solid var(--alerta-roja)">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="color:var(--texto-fuerte);font-size:14px">3. Mesa de Respuesta Interinstitucional (CRA - UNGRD - SSPD)</strong>
                    <span style="background:#FFEBEE;color:var(--alerta-roja);font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px">DIARIA</span>
                  </div>
                  <p style="font-size:12px;color:var(--texto);margin-top:4px">
                    Reporte diario automatizado con el índice ICR para despacho de plantas potabilizadoras móviles y recursos del FNGRD.
                  </p>
                </div>

                <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;border-left:4px solid var(--bandera-azul)">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="color:var(--texto-fuerte);font-size:14px">4. Supervisión de Calidad Microbiológica (SIVICAP)</strong>
                    <span style="background:#EBF3FF;color:var(--bandera-azul);font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px">ACTIVO</span>
                  </div>
                  <p style="font-size:12px;color:var(--texto);margin-top:4px">
                    Muestreo acelerado semanal de cloro residual e índice IRCA en municipios con racionamiento para impedir contaminación en red por despresurización.
                  </p>
                </div>
              </div>

              <!-- Enlaces rápidos finales -->
              <div style="display:flex;gap:10px;justify-content:flex-end">
                <button class="btn-secundario" onclick="window.verEnMapaDesdeStory('44847')">
                  🗺️ Explorar Mapa Territorial Profesional
                </button>
                <button class="btn-secundario" onclick="window.abrirFichaDesdeMapa('44847')">
                  📑 Abrir Ficha de Uribia (La Guajira)
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  /* =========================================================================
     3. CADENA CAUSAL DEL RIESGO EN V-01 (RESUMEN)
     ========================================================================= */
  function initCadenaCausal() {
    const grid = document.getElementById('grid-cadena-causal');
    const drawer = document.getElementById('cadena-detalle-drawer');
    if (!grid || !drawer) return;

    const eslabones = [
      {
        num: "Eslabón 1",
        titulo: "Amenaza Macro",
        valor: "+3.2 °C",
        desc: "Anomalía Niño 3.4 (Histórico)",
        detalle: "El calentamiento oceánico persistente traslada ondas de calor y estiaje severo a Colombia, con probabilidad del 75% de mantener condición muy fuerte.",
        indicador: "A-1 (ONI +2.16 °C, Niño 3.4 +3.2 °C)",
        impacto: "Amenaza natural de nivel crítico"
      },
      {
        num: "Eslabón 2",
        titulo: "Déficit Lluvias",
        valor: "-78.6 %",
        desc: "Déficit en cuencas Caribe y Andina",
        detalle: "Se registran más de 42 días continuos sin precipitación efectiva en el Caribe y caudales al 45% del promedio en la Región Andina.",
        indicador: "A-3 (Anomalía precipitación 30 días)",
        impacto: "Agotamiento de microcuencas abastecedoras"
      },
      {
        num: "Eslabón 3",
        titulo: "Vulnerabilidad Red",
        valor: "68 %",
        desc: "Pérdidas de agua en red (IANC)",
        detalle: "El 68% del agua tratada se pierde por fugas y tuberías obsoletas, impidiendo que el caudal disponible llegue a los tanques de distribución.",
        indicador: "H-5 (Índice de Agua No Contabilizada IANC)",
        impacto: "Acelerador del colapso operativo"
      },
      {
        num: "Eslabón 4",
        titulo: "Servicio al Usuario",
        valor: "< 6 h/d",
        desc: "Continuidad en zonas rojas",
        detalle: "14 municipios sufren racionamiento estricto, obligando a las familias a almacenar agua en condiciones que incrementan el riesgo sanitario (IRCA).",
        indicador: "S-1 (Continuidad diaria) y S-2 (IRCA)",
        impacto: "Crisis de bienestar y salud pública"
      },
      {
        num: "Eslabón 5",
        titulo: "Población en Riesgo",
        valor: "10.9 M",
        desc: "Habitantes en Naranja y Rojo",
        detalle: "Más de 10.87 millones de colombianos (68% en estratos 1 y 2) dependen de acueductos en riesgo inminente de suspensión o desabastecimiento.",
        indicador: "Población combinada Naranja y Roja",
        impacto: "Emergencia humanitaria y regulatoria"
      }
    ];

    grid.innerHTML = eslabones.map((esl, idx) => `
      <div class="eslabon-card ${idx === 0 ? 'active' : ''}" data-eslabon-idx="${idx}">
        <div class="eslabon-num">${escaparHtml(esl.num)}</div>
        <div class="eslabon-titulo">${escaparHtml(esl.titulo)}</div>
        <div class="eslabon-valor-destacado">${escaparHtml(esl.valor)}</div>
        <div class="eslabon-desc">${escaparHtml(esl.desc)}</div>
      </div>
    `).join('');

    // Mostrar detalle del primer eslabón por defecto
    mostrarDetalleEslabon(eslabones[0]);

    grid.querySelectorAll('.eslabon-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.eslabon-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const idx = parseInt(card.getAttribute('data-eslabon-idx'), 10);
        mostrarDetalleEslabon(eslabones[idx]);
      });
    });

    function mostrarDetalleEslabon(esl) {
      drawer.classList.add('active');
      drawer.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
          <div>
            <span style="font-size:11px;font-weight:800;color:var(--cra-cian-texto);text-transform:uppercase">${escaparHtml(esl.num)} · Diagnóstico Causal</span>
            <h4 style="font-size:16px;font-weight:900;color:var(--texto-fuerte);margin-top:2px">${escaparHtml(esl.titulo)}: ${escaparHtml(esl.desc)}</h4>
            <p style="font-size:13px;color:var(--texto);margin-top:6px;max-width:760px;line-height:1.45">${escaparHtml(esl.detalle)}</p>
          </div>
          <div style="background:var(--superficie);border:1px solid var(--linea);padding:10px 14px;border-radius:var(--radio-md);text-align:right">
            <div style="font-size:11px;color:var(--texto-claro);font-weight:700;text-transform:uppercase">Métrica Regulatoria</div>
            <div style="font-size:13px;font-weight:800;color:var(--cra-cian-texto)">${escaparHtml(esl.indicador)}</div>
            <div style="font-size:11px;font-weight:700;color:var(--alerta-roja);margin-top:2px">${escaparHtml(esl.impacto)}</div>
          </div>
        </div>
      `;
    }
  }

  /* =========================================================================
     4. VISTA V-01: RESUMEN EJECUTIVO NACIONAL
     ========================================================================= */
  function initResumenV01() {
    const meta = state.corte.metadata_corte;
    const niveles = meta.conteo_niveles_nacional;
    const amenaza = state.corte.amenaza_global;

    // Actualizar encabezado superior
    document.getElementById('corte-fecha-val').textContent = meta.fecha_corte;
    document.getElementById('corte-estado-pill').innerHTML = `<span class="frescura-dot"></span> Corte Oficial Validado`;

    // Actualizar KPIs
    document.getElementById('kpi-total-mun').textContent = meta.total_municipios_evaluados;
    document.getElementById('kpi-alerta-roja').textContent = niveles.roja;
    document.getElementById('kpi-alerta-naranja').textContent = niveles.naranja;
    document.getElementById('kpi-alerta-amarilla').textContent = niveles.amarilla;
    document.getElementById('kpi-sin-alerta').textContent = niveles.sin_alerta;
    document.getElementById('kpi-poblacion-riesgo').textContent = `${(meta.poblacion_en_riesgo_critico / 1000000).toFixed(1)} M`;

    // Actualizar Tarjeta NOAA Global
    if (amenaza && amenaza.indices_semanales) {
      const sem = amenaza.indices_semanales;
      document.getElementById('noaa-nino12-anom').textContent = `+${sem.nino12_anomalia.toFixed(1)} °C`;
      document.getElementById('noaa-nino12-sst').textContent = `${sem.nino12_sst.toFixed(1)} °C`;

      document.getElementById('noaa-nino3-anom').textContent = `+${sem.nino3_anomalia.toFixed(1)} °C`;
      document.getElementById('noaa-nino3-sst').textContent = `${sem.nino3_sst.toFixed(1)} °C`;

      document.getElementById('noaa-nino34-anom').textContent = `+${sem.nino34_anomalia.toFixed(1)} °C`;
      document.getElementById('noaa-nino34-sst').textContent = `${sem.nino34_sst.toFixed(1)} °C`;

      document.getElementById('noaa-nino4-anom').textContent = `+${sem.nino4_anomalia.toFixed(1)} °C`;
      document.getElementById('noaa-nino4-sst').textContent = `${sem.nino4_sst.toFixed(1)} °C`;

      if (amenaza.indice_oni_trimestral) {
        document.getElementById('noaa-oni-resumen').innerHTML = `
          Trimestre ${escaparHtml(amenaza.indice_oni_trimestral.trimestre)} ${escaparHtml(amenaza.indice_oni_trimestral.ano)}: 
          <strong>+${Number(amenaza.indice_oni_trimestral.oni_anomalia || 0).toFixed(2)} °C</strong> (${escaparHtml(amenaza.indice_oni_trimestral.intensidad_evento)})
        `;
      }

      const descBanner = document.getElementById('noaa-resumen-desc');
      if (descBanner) {
        const prob = amenaza.indicador_a2_probabilidad_muy_fuerte_pct !== undefined ? Number(amenaza.indicador_a2_probabilidad_muy_fuerte_pct).toFixed(1) : '83.0';
        descBanner.innerHTML = `Anomalía en la región <strong>Niño 3.4 a +${Number(sem.nino34_anomalia || 0).toFixed(1)} °C</strong> (con picos en la región Niño 1+2 de +${Number(sem.nino12_anomalia || 0).toFixed(1)} °C) y una probabilidad del <strong>${escaparHtml(prob)} %</strong> de consolidar un evento de carácter histórico (RONI &ge; +2.5 °C).`;
      }
    }

    const badgeTotal = document.getElementById('badge-total-alertas');
    if (badgeTotal && state.corte.alertas_activas) {
      badgeTotal.textContent = state.corte.alertas_activas.length;
    }

    // Renderizar Top Municipios Críticos en la tabla
    renderTopMunicipiosV01();
  }

  function renderTopMunicipiosV01() {
    const tbody = document.getElementById('tbody-top-municipios');
    if (!tbody) return;

    // Ordenar descendente por ICR y tomar los 10 primeros
    const ordenados = [...state.corte.municipios].sort((a, b) => (b.icr || 0) - (a.icr || 0)).slice(0, 10);

    tbody.innerHTML = ordenados.map(m => {
      const contHoras = m.indicadores['S-1']?.valor !== null && m.indicadores['S-1']?.valor !== undefined ? `${escaparHtml(m.indicadores['S-1'].valor)} h/d` : 'Sin dato';
      const racionamiento = m.indicadores['R-3']?.valor === 1 ? '<span style="color:var(--alerta-roja);font-weight:800">SÍ (Confirmado)</span>' : '<span style="color:var(--alerta-sin)">No reportado</span>';

      return `
        <tr data-abrir-municipio="${escaparHtml(m.divipola)}">
          <td>
            <strong>${escaparHtml(m.nombre)}</strong> <span style="color:var(--texto-claro)">(${escaparHtml(m.departamento)})</span>
          </td>
          <td><span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">${escaparHtml(String(m.nivel_alerta || '').replace('_', ' '))}</span></td>
          <td><strong style="font-size:15px;color:var(--texto-fuerte)">${Number(m.icr || 0).toFixed(1)}</strong></td>
          <td>${contHoras}</td>
          <td>${racionamiento}</td>
          <td>
            <button class="btn-secundario" style="padding:4px 8px;font-size:11px" data-abrir-municipio="${escaparHtml(m.divipola)}">
              Ver Ficha ➔
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* =========================================================================
     5. VISTA V-02: AMENAZA MACRO (ENSO)
     ========================================================================= */
  function initAmenazaV02() {
    const amenaza = state.corte.amenaza_global;
    if (!amenaza) return;

    const sem = amenaza.indices_semanales;
    if (sem) {
      const regiones = [
        { id: '12', nombre: 'Niño 1+2 (Costa)', anom: sem.nino12_anomalia, sst: sem.nino12_sst },
        { id: '3', nombre: 'Niño 3 (Oriental)', anom: sem.nino3_anomalia, sst: sem.nino3_sst },
        { id: '34', nombre: 'Niño 3.4 (Pacífico Central)', anom: sem.nino34_anomalia, sst: sem.nino34_sst },
        { id: '4', nombre: 'Niño 4 (Occidental)', anom: sem.nino4_anomalia, sst: sem.nino4_sst }
      ];

      const contenedorBarras = document.getElementById('barras-anomalia-nino') || document.getElementById('bars-nino-regiones');
      if (contenedorBarras) {
        contenedorBarras.innerHTML = regiones.map(r => {
          const pctWidth = Math.min((r.anom / 6.0) * 100, 100);
          return `
            <div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:4px">
                <span>${r.nombre}</span>
                <span style="color:var(--alerta-naranja)">+${r.anom.toFixed(1)} °C <span style="color:var(--texto-claro);font-weight:400">(${r.sst} °C)</span></span>
              </div>
              <div style="height:14px;background-color:var(--linea-suave);border-radius:7px;overflow:hidden;position:relative">
                <div style="position:absolute;left:${(0.5 / 6.0) * 100}%;top:0;bottom:0;width:2px;background-color:#000;z-index:2" title="Umbral El Niño (+0.5 °C)"></div>
                <div style="width:${pctWidth}%;height:100%;background:linear-gradient(90deg, #F2C200 0%, #E07A10 50%, #B3261E 100%);border-radius:7px"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Actualizar diagnóstico regional dinámico en V-02
    if (state.corte && state.corte.municipios) {
      const munis = state.corte.municipios;
      const caribe = munis.filter(m => m.region === 'Caribe');
      const andina = munis.filter(m => m.region === 'Andina');

      const calcStats = (lista) => {
        if (!lista.length) return { dias: 0, anom: 0, focos: 0 };
        const dias = Math.round(lista.reduce((acc, m) => acc + (m.indicadores?.['A-4']?.valor || 0), 0) / lista.length);
        const anom = (lista.reduce((acc, m) => acc + (m.indicadores?.['A-3']?.valor || 0), 0) / lista.length).toFixed(1);
        const focos = lista.reduce((acc, m) => acc + (m.indicadores?.['A-5']?.valor || 0), 0);
        return { dias, anom, focos };
      };

      const sc = calcStats(caribe);
      const sa = calcStats(andina);
      const probExt = amenaza.indicador_a2_probabilidad_muy_fuerte_pct || 83.0;

      const pCaribe = document.getElementById('v02-desc-caribe');
      if (pCaribe) {
        pCaribe.innerHTML = `Promedio de <strong>${sc.dias} días consecutivos</strong> con precipitación menor a 1 mm. Déficit acumulado de lluvia a 30 días de <strong>${sc.anom} %</strong> frente a la normal histórica. Focos térmicos registrados en cuencas: <strong>${sc.focos}</strong>.`;
      }
      const pAndina = document.getElementById('v02-desc-andina');
      if (pAndina) {
        pAndina.innerHTML = `Promedio de <strong>${sa.dias} días consecutivos sin lluvia</strong>. Déficit acumulado de <strong>${sa.anom} %</strong>. Focos térmicos registrados en cuencas: <strong>${sa.focos}</strong>.`;
      }
      const pCpc = document.getElementById('v02-desc-cpc');
      if (pCpc) {
        pCpc.innerHTML = `Los modelos acoplados Océano-Atmósfera pronostican una probabilidad del <strong>${probExt}%</strong> de mantener anomalías extremas RONI &ge; +2.0 °C.`;
      }
    }
  }

  /* =========================================================================
     6. VISTA V-03: TERRITORIO Y MAPA CARTOGRÁFICO PROFESIONAL (LEAFLET + DANE)
     ========================================================================= */
  function initTerritorioV03() {
    renderFiltrosTerritorio();
    renderMapaColombia();
    renderTablaTerritorio();

    // Controles de variable del mapa
    document.querySelectorAll('.btn-variable').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-variable').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.variableMapa = btn.getAttribute('data-var');
        renderMapaColombia();
      });
    });

    // Filtros rápidos por región geográfica
    document.querySelectorAll('.btn-region-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-region-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const reg = btn.getAttribute('data-region');
        state.regionActual = reg;
        hacerZoomRegion(reg);
      });
    });

    // Búsqueda y filtros de tabla
    const searchInput = document.getElementById('input-busqueda-muni');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.busqueda = e.target.value.toLowerCase().trim();
        renderTablaTerritorio();
      });
    }

    const selectDepto = document.getElementById('select-filtro-depto');
    if (selectDepto) {
      selectDepto.addEventListener('change', (e) => {
        state.filtroDepto = e.target.value;
        renderTablaTerritorio();
        if (state.filtroDepto !== 'TODOS') {
          hacerZoomDepartamento(state.filtroDepto);
        }
      });
    }

    const selectNivel = document.getElementById('select-filtro-nivel');
    if (selectNivel) {
      selectNivel.addEventListener('change', (e) => {
        state.filtroNivel = e.target.value;
        renderTablaTerritorio();
      });
    }
  }

  function renderFiltrosTerritorio() {
    const select = document.getElementById('select-filtro-depto');
    if (!select) return;
    const deptos = state.corte.departamentos;
    select.innerHTML = '<option value="TODOS">Todos los Departamentos (12)</option>' +
    deptos.map(d => `<option value="${escaparHtml(d.cod_depto)}">${escaparHtml(d.departamento)} (${escaparHtml(d.total_municipios)})</option>`).join('');
  }

  function hacerZoomRegion(regionKey) {
    if (!state.leafletMap) return;
    const boundsPorRegion = {
      'TODOS': { center: [4.8, -73.8], zoom: 6 },
      'CARIBE': { center: [10.5, -73.8], zoom: 7 },
      'ANDINA': { center: [5.5, -74.0], zoom: 7 },
      'PACIFICA': { center: [4.2, -77.0], zoom: 7 },
      'ORINOQUIA': { center: [4.8, -70.5], zoom: 6 },
      'AMAZONIA': { center: [-1.2, -72.0], zoom: 6 }
    };

    const target = boundsPorRegion[regionKey] || boundsPorRegion['TODOS'];
    state.leafletMap.flyTo(target.center, target.zoom, { duration: 1.2 });
  }

  function hacerZoomDepartamento(codDepto) {
    if (!state.leafletMap || !state.deptoLayer) return;
    state.deptoLayer.eachLayer(layer => {
      if (layer.feature && layer.feature.properties.DPTO_CCDGO === codDepto) {
        state.leafletMap.flyToBounds(layer.getBounds(), { maxZoom: 8, duration: 1.2 });
      }
    });
  }

  function obtenerColorHexPorVariable(muni, variable) {
    if (variable === 'icr') {
      const col = {
        'roja': '#B3261E',
        'naranja': '#E07A10',
        'amarilla': '#F2C200',
        'sin_alerta': '#2E7D4F',
        'sin_dato': '#B9C4CC'
      };
      return col[muni.nivel_alerta] || '#B9C4CC';
    } else if (variable === 's1') {
      const cont = muni.indicadores['S-1']?.valor;
      if (cont === null || cont === undefined) return '#B9C4CC';
      if (cont >= 22) return '#2E7D4F';
      if (cont >= 18) return '#F2C200';
      if (cont >= 12) return '#E07A10';
      return '#B3261E';
    } else if (variable === 'a3') {
      const anom = muni.indicadores['A-3']?.valor;
      if (anom === null || anom === undefined) return '#B9C4CC';
      if (anom >= -20) return '#2E7D4F';
      if (anom >= -40) return '#F2C200';
      if (anom >= -60) return '#E07A10';
      return '#B3261E';
    } else if (variable === 's2') {
      const irca = muni.indicadores['S-2']?.valor;
      if (irca === null || irca === undefined) return '#B9C4CC';
      if (irca <= 5) return '#2E7D4F';
      if (irca <= 14) return '#F2C200';
      if (irca <= 35) return '#E07A10';
      return '#B3261E';
    }
    return '#B9C4CC';
  }

  function renderMapaColombia() {
    const container = document.getElementById('mapa-colombia-leaflet');
    if (!container) return;

    // Inicializar mapa si no existe
    if (!state.leafletMap) {
      state.leafletMap = L.map('mapa-colombia-leaflet', {
        center: [4.8, -73.8],
        zoom: 6,
        minZoom: 5,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: true
      });

      // CartoDB Positron basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO | República de Colombia · CRA',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(state.leafletMap);
    }

    const municipios = state.corte.municipios;
    const deptosGeo = window.COLOMBIA_GEOJSON;

    // Capa de Departamentos DANE MGN 2018
    if (state.deptoLayer) {
      state.leafletMap.removeLayer(state.deptoLayer);
    }

    if (deptosGeo) {
      state.deptoLayer = L.geoJSON(deptosGeo, {
        style: function (feature) {
          const cod = feature.properties.DPTO_CCDGO;
          const munisDepto = municipios.filter(m => m.cod_depto === cod);

          let fillColor = '#E2E8F0';
          let fillOpacity = 0.45;

          if (munisDepto.length > 0) {
            const icrMedio = munisDepto.reduce((acc, m) => acc + (m.icr || 0), 0) / munisDepto.length;
            if (icrMedio >= 75) { fillColor = '#B3261E'; fillOpacity = 0.55; }
            else if (icrMedio >= 60) { fillColor = '#E07A10'; fillOpacity = 0.50; }
            else if (icrMedio >= 40) { fillColor = '#F2C200'; fillOpacity = 0.45; }
            else { fillColor = '#2E7D4F'; fillOpacity = 0.40; }
          }

          return {
            fillColor: fillColor,
            weight: 1.2,
            opacity: 1,
            color: '#FFFFFF',
            fillOpacity: fillOpacity
          };
        },
        onEachFeature: function (feature, layer) {
          const cod = feature.properties.DPTO_CCDGO;
          const nombre = feature.properties.DPTO_CNMBR;
          const munisDepto = municipios.filter(m => m.cod_depto === cod);
          const count = munisDepto.length;
          const icrMedio = count > 0 ? (munisDepto.reduce((a, b) => a + b.icr, 0) / count).toFixed(1) : null;

          let tooltipContent = `<strong>${nombre}</strong>`;
          if (count > 0) {
            tooltipContent += `<br><span style="font-size:11px">ICR Promedio: <strong>${icrMedio} pts</strong> (${count} munis)</span>`;
          } else {
            tooltipContent += `<br><span style="font-size:11px;color:#A0AEC0">Sin monitoreo en corte actual</span>`;
          }

          layer.bindTooltip(tooltipContent, {
            className: 'cra-depto-tooltip',
            sticky: true
          });

          layer.on({
            mouseover: function (e) {
              const l = e.target;
              l.setStyle({
                weight: 2.8,
                color: '#003189',
                fillOpacity: 0.75
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
              }
            },
            mouseout: function (e) {
              state.deptoLayer.resetStyle(e.target);
            },
            click: function () {
              const select = document.getElementById('select-filtro-depto');
              if (select) {
                select.value = cod;
                state.filtroDepto = cod;
                renderTablaTerritorio();
              }
            }
          });
        }
      }).addTo(state.leafletMap);
    }

    // Capa de Marcadores Municipales con Ondas Radar en Alerta Roja
    if (state.muniLayer) {
      state.leafletMap.removeLayer(state.muniLayer);
    }

    state.muniLayer = L.layerGroup();
    state.muniMarkers = {};

    municipios.forEach(m => {
      if (!m.lat || !m.lon) return;

      const colHex = obtenerColorHexPorVariable(m, state.variableMapa);
      const radio = m.nivel_alerta === 'roja' ? 10 : (m.nivel_alerta === 'naranja' ? 8 : 6);

      // Efecto radar animado para alerta roja
      if (m.nivel_alerta === 'roja') {
        const radarIcon = L.divIcon({
          className: 'radar-pulse-icon',
          html: '<div class="radar-dot"></div><div class="radar-wave"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([m.lat, m.lon], { icon: radarIcon, zIndexOffset: 500 }).addTo(state.muniLayer);
      }

      const circleMarker = L.circleMarker([m.lat, m.lon], {
        radius: radio,
        fillColor: colHex,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
      });

      const s1Val = m.indicadores['S-1']?.valor !== undefined ? `${escaparHtml(m.indicadores['S-1'].valor)} h/d` : 'Sin dato';
      const a3Val = m.indicadores['A-3']?.valor !== undefined ? `${escaparHtml(m.indicadores['A-3'].valor)}%` : 'Sin dato';
      const s2Val = m.indicadores['S-2']?.valor !== undefined ? `${escaparHtml(m.indicadores['S-2'].valor)} pts` : 'Sin dato';
      const nivelLabel = escaparHtml(String(m.nivel_alerta || '').toUpperCase().replace('_', ' '));

      const popupHtml = `
        <div class="cra-map-popup-card">
          <div class="cra-map-popup-header">
            <div>
              <h4>${escaparHtml(m.nombre)}</h4>
              <div class="cra-map-popup-sub">${escaparHtml(m.departamento)} · DIVIPOLA ${escaparHtml(m.divipola)}</div>
            </div>
            <span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">${nivelLabel}</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Índice Compuesto (ICR):</span>
            <span class="val" style="color:${colHex}">${escaparHtml(m.icr)} pts</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Población Afectada:</span>
            <span class="val">${(m.poblacion || 0).toLocaleString('es-CO')} hab.</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Continuidad de Agua (S-1):</span>
            <span class="val">${s1Val}</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Déficit de Lluvias (A-3):</span>
            <span class="val">${a3Val}</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Riesgo Calidad (IRCA S-2):</span>
            <span class="val">${s2Val}</span>
          </div>
          <button class="cra-map-popup-btn" onclick="window.abrirFichaDesdeMapa('${escaparHtml(m.divipola)}')">
            Ver Ficha Municipal Completa ➔
          </button>
        </div>
      `;

      circleMarker.bindPopup(popupHtml, { maxWidth: 300 });

      circleMarker.on('click', () => {
        circleMarker.openPopup();
      });

      circleMarker.addTo(state.muniLayer);
      state.muniMarkers[m.divipola] = circleMarker;
    });

    state.muniLayer.addTo(state.leafletMap);

    // =========================================================================
    // RENDERIZADO DE CAPA POLIGONAL ARCGIS PRO (SI ESTÁ ACTIVA)
    // =========================================================================
    if (state.arcgis && state.arcgis.layer) {
      state.leafletMap.removeLayer(state.arcgis.layer);
      state.arcgis.layer = null;
    }

    if (state.arcgis && state.arcgis.activo && state.arcgis.geojsonData) {
      const geoData = state.arcgis.geojsonData;
      const hasPolygons = geoData.features && geoData.features.some(f =>
        f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
      );

      if (hasPolygons) {
        state.arcgis.layer = L.geoJSON(geoData, {
          filter: function (feature) {
            return feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon');
          },
          style: function (feature) {
            const p = feature.properties || {};
            const divipola = String(p.DIVIPOLA || p.MPIO_CCDGO || p.divipola || '').padStart(5, '0');
            const muni = municipios.find(m => m.divipola === divipola);
            const icr = muni ? muni.icr : (p.ARCGIS_RIESGO ?? p.ICR ?? 50);

            let color = '#2E7D4F';
            if (icr >= 75) color = '#B3261E';
            else if (icr >= 60) color = '#E07A10';
            else if (icr >= 40) color = '#F2C200';

            return {
              fillColor: color,
              weight: 2.4,
              opacity: 1,
              color: '#FFFFFF',
              fillOpacity: 0.72
            };
          },
          onEachFeature: function (feature, layer) {
            const p = feature.properties || {};
            const divipola = String(p.DIVIPOLA || p.MPIO_CCDGO || p.divipola || '').padStart(5, '0');
            const muni = municipios.find(m => m.divipola === divipola);
            const nombre = muni ? muni.nombre : (p.MUNICIPIO || 'Municipio');
            const depto = muni ? muni.departamento : (p.DEPARTAMENTO || '');
            const icr = muni ? muni.icr : (p.ARCGIS_RIESGO ?? p.ICR ?? 'N/A');
            const nivel = muni ? muni.nivel_alerta : (p.NIVEL_ALERTA || 'roja');

            layer.bindTooltip(`<strong>${nombre}</strong> (${depto})<br>ICR ArcGIS: <strong>${icr} pts</strong>${p.CUENCA_APORTANTE ? '<br><span style="font-size:11px;color:#007AC2">Cuenca: ' + p.CUENCA_APORTANTE + '</span>' : ''}`, {
              sticky: true,
              className: 'cra-depto-tooltip'
            });

            layer.on({
              mouseover: function (e) {
                e.target.setStyle({ weight: 3.8, color: '#003189', fillOpacity: 0.90 });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                  e.target.bringToFront();
                }
              },
              mouseout: function (e) {
                if (state.arcgis.layer) {
                  state.arcgis.layer.resetStyle(e.target);
                }
              },
              click: function () {
                if (divipola) {
                  state.municipioSeleccionadoId = divipola;
                  initFichaV04(divipola);
                }
              }
            });

            const popupContent = `
              <div class="cra-map-popup-card">
                <div class="cra-map-popup-header">
                  <div>
                    <h4>${escaparHtml(nombre)}</h4>
                    <div class="cra-map-popup-sub">${escaparHtml(depto)} · DIVIPOLA ${escaparHtml(divipola)}</div>
                  </div>
                  <span class="chip-alerta ${escaparHtml(nivel)}">${escaparHtml(String(nivel).toUpperCase())}</span>
                </div>
                <div class="cra-map-metric-row">
                  <span>Índice Compuesto (ICR):</span>
                  <span class="val" style="color:#B3261E">${escaparHtml(icr)} pts</span>
                </div>
                ${p.POBLACION ? `<div class="cra-map-metric-row"><span>Población:</span><span class="val">${Number(p.POBLACION).toLocaleString('es-CO')} hab.</span></div>` : ''}
                ${p.S1_CONTINUIDAD_H ? `<div class="cra-map-metric-row"><span>Continuidad:</span><span class="val">${escaparHtml(p.S1_CONTINUIDAD_H)} h/d</span></div>` : ''}
                ${p.A3_DEFICIT_LLUVIA_PCT ? `<div class="cra-map-metric-row"><span>Déficit Lluvia:</span><span class="val">${escaparHtml(p.A3_DEFICIT_LLUVIA_PCT)}%</span></div>` : ''}
                
                <div class="cra-arcgis-popup-section">
                  <span class="cra-arcgis-badge-tag">🛰️ Datos Enriquecidos ArcGIS Pro</span>
                  ${p.CUENCA_APORTANTE ? `<div class="cra-map-metric-row"><span>Cuenca:</span><span class="val" style="font-size:11px">${escaparHtml(p.CUENCA_APORTANTE)}</span></div>` : ''}
                  ${p.DIST_EMBALSE_KM ? `<div class="cra-map-metric-row"><span>Dist. Embalse:</span><span class="val">${escaparHtml(p.DIST_EMBALSE_KM)} km</span></div>` : ''}
                  ${p.AREA_AFECTADA_HA ? `<div class="cra-map-metric-row"><span>Área Sequía:</span><span class="val">${Number(p.AREA_AFECTADA_HA).toLocaleString('es-CO')} ha</span></div>` : ''}
                  ${p.FOCOS_EN_CUENCA ? `<div class="cra-map-metric-row"><span>Focos en Cuenca:</span><span class="val">${escaparHtml(p.FOCOS_EN_CUENCA)}</span></div>` : ''}
                  ${p.OBS_SIG ? `<div style="font-size:11px;color:#0369A1;margin-top:5px;font-style:italic">"${escaparHtml(p.OBS_SIG)}"</div>` : ''}
                </div>

                <button class="cra-map-popup-btn" onclick="window.abrirFichaDesdeMapa('${escaparHtml(divipola)}')">
                  Ver Ficha Municipal Completa ➔
                </button>
              </div>
            `;
            layer.bindPopup(popupContent, { maxWidth: 320 });
          }
        }).addTo(state.leafletMap);

        // Ajustar zoom a los polígonos si se acaba de activar
        try {
          const bounds = state.arcgis.layer.getBounds();
          if (bounds.isValid()) {
            state.leafletMap.flyToBounds(bounds, { padding: [20, 20], maxZoom: 9, duration: 1.2 });
          }
        } catch (e) {
          // Ignorar si no hay bounds válidos
        }
      }
    }

    // Actualizar conteos dinámicos en la leyenda
    const counts = { roja: 0, naranja: 0, amarilla: 0, sin_alerta: 0 };
    municipios.forEach(m => {
      if (counts[m.nivel_alerta] !== undefined) counts[m.nivel_alerta]++;
    });

    const elRoja = document.getElementById('leyenda-count-roja');
    const elNar = document.getElementById('leyenda-count-naranja');
    const elAm = document.getElementById('leyenda-count-amarilla');
    const elSin = document.getElementById('leyenda-count-sin');

    if (elRoja) elRoja.textContent = `(${counts.roja})`;
    if (elNar) elNar.textContent = `(${counts.naranja})`;
    if (elAm) elAm.textContent = `(${counts.amarilla})`;
    if (elSin) elSin.textContent = `(${counts.sin_alerta})`;
  }

  function renderTablaTerritorio() {
    const tbody = document.getElementById('tbody-ranking-territorio');
    if (!tbody) return;

    let filtrados = state.corte.municipios.filter(m => {
      if (state.filtroDepto !== 'TODOS' && m.cod_depto !== state.filtroDepto) return false;
      if (state.filtroNivel !== 'TODOS' && m.nivel_alerta !== state.filtroNivel) return false;
      if (state.busqueda) {
        const matchNombre = m.nombre.toLowerCase().includes(state.busqueda);
        const matchDepto = m.departamento.toLowerCase().includes(state.busqueda);
        const matchDivipola = m.divipola.includes(state.busqueda);
        if (!matchNombre && !matchDepto && !matchDivipola) return false;
      }
      return true;
    });

    filtrados.sort((a, b) => {
      let valA = a[state.ordenColumna];
      let valB = b[state.ordenColumna];
      if (valA === null || valA === undefined) valA = -999;
      if (valB === null || valB === undefined) valB = -999;
      if (typeof valA === 'string') return state.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return state.ordenAscendente ? valA - valB : valB - valA;
    });

    const conteoEl = document.getElementById('conteo-resultados-tabla');
    if (conteoEl) {
      conteoEl.textContent = `${filtrados.length} municipios encontrados`;
    }

    tbody.innerHTML = filtrados.map(m => `
      <tr data-abrir-municipio="${escaparHtml(m.divipola)}" class="${m.divipola === state.municipioSeleccionadoId ? 'selected' : ''}">
        <td><span style="font-family:monospace;font-weight:700;color:var(--cra-cian-texto)">${escaparHtml(m.divipola)}</span></td>
        <td><strong>${escaparHtml(m.nombre)}</strong></td>
        <td>${escaparHtml(m.departamento)}</td>
        <td><span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">${escaparHtml(String(m.nivel_alerta || '').replace('_', ' '))}</span></td>
        <td><strong style="font-size:14px;color:var(--texto-fuerte)">${m.icr !== null ? Number(m.icr).toFixed(1) : 'Sin dato'}</strong></td>
        <td>${m.indicadores['S-1']?.valor ? escaparHtml(m.indicadores['S-1'].valor) + ' h' : '—'}</td>
        <td>${m.indicadores['A-3']?.valor ? escaparHtml(m.indicadores['A-3'].valor) + ' %' : '—'}</td>
        <td>${m.indicadores['S-2']?.valor ? escaparHtml(m.indicadores['S-2'].valor) + ' %' : '—'}</td>
        <td>
          <button class="btn-secundario" style="padding:4px 8px;font-size:11px" data-abrir-municipio="${escaparHtml(m.divipola)}">
            Ficha ➔
          </button>
        </td>
      </tr>
    `).join('');

    // Sincronizar hover de filas con marcadores en el mapa
    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('mouseenter', () => {
        const divipola = row.getAttribute('data-abrir-municipio');
        if (state.muniMarkers[divipola] && state.leafletMap) {
          state.muniMarkers[divipola].setStyle({ weight: 4, color: '#003189' });
        }
      });
      row.addEventListener('mouseleave', () => {
        const divipola = row.getAttribute('data-abrir-municipio');
        if (state.muniMarkers[divipola] && state.leafletMap) {
          state.muniMarkers[divipola].setStyle({ weight: 2, color: '#FFFFFF' });
        }
      });
    });
  }

  /* =========================================================================
     7. VISTA V-04: FICHA MUNICIPAL DETALLADA
     ========================================================================= */
  function initFichaV04(divipola) {
    const muni = state.corte.municipios.find(m => m.divipola === divipola) || state.corte.municipios[0];
    if (!muni) return;

    state.municipioSeleccionadoId = muni.divipola;

    // Encabezado Municipal
    document.getElementById('ficha-muni-nombre').textContent = muni.nombre;
    document.getElementById('ficha-muni-depto').textContent = `${muni.departamento} (DIVIPOLA: ${muni.divipola})`;
    document.getElementById('ficha-muni-pob').textContent = `Población: ${muni.poblacion.toLocaleString('es-CO')} hab. | Región: ${muni.region}`;

    // Nivel e ICR
    const badgeNivel = document.getElementById('ficha-muni-nivel-badge');
    badgeNivel.className = `chip-alerta ${muni.nivel_alerta}`;
    badgeNivel.textContent = `Nivel: ${muni.nivel_alerta.replace('_', ' ')}`;
    if (muni.nivel_por_regla) {
      badgeNivel.textContent += ` (Piso por Impacto Confirmado)`;
    }

    const icrValEl = document.getElementById('ficha-icr-val');
    icrValEl.textContent = muni.icr !== null ? muni.icr.toFixed(1) : 'S/D';
    icrValEl.style.color = muni.nivel_alerta === 'roja' ? 'var(--alerta-roja)' :
      (muni.nivel_alerta === 'naranja' ? 'var(--alerta-naranja)' :
        (muni.nivel_alerta === 'amarilla' ? 'var(--alerta-amarilla)' : 'var(--alerta-sin)'));

    // Subíndices de las 4 Capas
    const capas = muni.subindices_capa;
    renderCapaBox('capa-a', 'Amenaza (A) · 30%', capas.amenaza_A, 'var(--cra-cian)');
    renderCapaBox('capa-h', 'Oferta Hídrica (H) · 30%', capas.vulnerabilidad_H, '#17729A');
    renderCapaBox('capa-s', 'Servicio (S) · 25%', capas.servicio_S, 'var(--bandera-azul)');
    renderCapaBox('capa-r', 'Respuesta/Impacto (R) · 15%', capas.respuesta_R, 'var(--alerta-roja)');

    // Batería de los 20 Indicadores
    setupFiltrosCapaMuni(muni);
    renderBateriaIndicadores(muni.indicadores);

    // Acciones Regulatorias Sugeridas para la CRA
    renderAccionesRegulatorias(muni);

    // Gráficos Analíticos ECharts (Radar 4D y Velocímetro de Riesgo ICR)
    renderGraficosFichaECharts(muni);
  }

  function setupFiltrosCapaMuni(muni) {
    const tabs = document.querySelectorAll('#filtro-capas-muni .btn-capa-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.filtroMuniCapa = tab.getAttribute('data-capa');
        renderBateriaIndicadores(muni.indicadores);
      };
    });
  }

  function renderCapaBox(elementId, titulo, valor, color) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const valText = valor !== null ? valor.toFixed(1) : 'S/D';
    const pct = valor !== null ? Math.min(valor, 100) : 0;
    el.innerHTML = `
      <div class="capa-titulo">
        <span>${titulo}</span>
        <span>${valText} pts</span>
      </div>
      <div class="capa-score">${valText}</div>
      <div class="capa-progress">
        <div class="capa-progress-fill" style="width:${pct}%;background-color:${color}"></div>
      </div>
    `;
  }

  /* Helper para obtener metadata regulatoria de cualquier indicador */
  function getInfoIndicador(codigo) {
    const list = (data && data.catalogoIndicadores && data.catalogoIndicadores.length > 0)
      ? data.catalogoIndicadores
      : CATALOGO_INDICADORES_MASTER;
    return list.find(c => c.codigo === codigo) || {};
  }

  /* Renderizado de la Batería de Indicadores Municipales con Herramientas Visuales */
  function renderBateriaIndicadores(indicadores) {
    const grid = document.getElementById('grid-indicadores-muni') || document.getElementById('grid-bateria-indicadores');
    if (!grid) return;

    // 1. Resumen de Severidad Territorial del Municipio
    const resumenContainer = document.getElementById('muni-severidad-resumen');
    if (resumenContainer) {
      let nRoja = 0, nNaranja = 0, nAmarilla = 0, nSin = 0;
      Object.entries(indicadores).forEach(([cod, ind]) => {
        const p = ind.puntaje;
        if (p !== null) {
          if (p >= 75) nRoja++;
          else if (p >= 60) nNaranja++;
          else if (p >= 40) nAmarilla++;
          else nSin++;
        } else {
          nSin++;
        }
      });

      resumenContainer.innerHTML = `
        <span class="sev-chip sev-roja" title="Indicadores en umbral de Alerta Máxima (≥75 pts)">
          🔴 ${nRoja} Críticos
        </span>
        <span class="sev-chip sev-naranja" title="Indicadores en umbral de Alerta Alta (60-75 pts)">
          🟠 ${nNaranja} Alerta Alta
        </span>
        <span class="sev-chip sev-amarilla" title="Indicadores en umbral de Alerta Media (40-60 pts)">
          🟡 ${nAmarilla} Alerta Media
        </span>
        <span class="sev-chip sev-sin" title="Indicadores en operación favorable o estable (<40 pts)">
          🟢 ${nSin} Normales
        </span>
      `;
    }

    // 2. Filtrado por Capa
    const filtroCapa = state.filtroMuniCapa || 'TODAS';
    const entries = Object.entries(indicadores).filter(([cod]) => {
      if (filtroCapa === 'TODAS') return true;
      return cod.startsWith(filtroCapa);
    });

    if (entries.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:32px;background:#FFF;border-radius:8px;border:1px dashed var(--linea)">
          <p style="color:var(--texto-claro);font-weight:700">No hay indicadores en esta dimensión para el municipio seleccionado.</p>
        </div>
      `;
      return;
    }

    // 3. Generación de Tarjetas con Medidores Visuales
    grid.innerHTML = entries.map(([cod, ind]) => {
      const cat = getInfoIndicador(cod);
      const capaKey = cat.capa ? cat.capa.toLowerCase() : cod[0].toLowerCase();

      const valText = ind.valor !== null ? `${ind.valor}` : 'S/D';
      const unidadText = ind.unidad ? ind.unidad : '';
      const puntaje = ind.puntaje !== null ? ind.puntaje : null;
      const puntajeText = puntaje !== null ? puntaje.toFixed(1) : '—';
      const pct = puntaje !== null ? Math.min(Math.max(puntaje, 0), 100) : 0;

      // Determinación de Severidad Cromática y Diagnóstico
      let colorBarra = 'var(--alerta-sin)';
      let diagClass = 'sin';
      let diagText = 'Operación Normal';
      let bordeClass = 'borde-sin';

      if (puntaje !== null) {
        if (puntaje >= 75) {
          colorBarra = 'var(--alerta-roja)';
          diagClass = 'roja';
          diagText = 'Riesgo Crítico';
          bordeClass = 'borde-roja';
        } else if (puntaje >= 60) {
          colorBarra = 'var(--alerta-naranja)';
          diagClass = 'naranja';
          diagText = 'Alerta Alta';
          bordeClass = 'borde-naranja';
        } else if (puntaje >= 40) {
          colorBarra = 'var(--alerta-amarilla)';
          diagClass = 'amarilla';
          diagText = 'Vigilancia Media';
          bordeClass = 'borde-amarilla';
        } else {
          colorBarra = 'var(--alerta-sin)';
          diagClass = 'sin';
          diagText = 'Condición Favorable';
          bordeClass = 'borde-sin';
        }
      } else {
        colorBarra = '#94A3B8';
        diagClass = 'sin';
        diagText = 'Variable de Contexto';
        bordeClass = 'borde-sin';
      }

      // Dirección de Riesgo Visual
      let dirBadgeHtml = '';
      if (cat.dir === '↑') {
        dirBadgeHtml = `<span class="dir-risk-badge dir-sube" title="Mayor valor incrementa el riesgo">▲ Sube riesgo</span>`;
      } else if (cat.dir === '↓') {
        dirBadgeHtml = `<span class="dir-risk-badge dir-baja" title="Menor valor incrementa el riesgo">▼ Baja riesgo</span>`;
      } else {
        dirBadgeHtml = `<span class="dir-risk-badge dir-rango" title="Rango de normalidad">◆ Control rango</span>`;
      }

      // Capa Label
      const nombresCapa = { a: 'Clima', h: 'Hídrica', s: 'Servicio', r: 'Respuesta' };
      const capaNombre = nombresCapa[capaKey] || capaKey.toUpperCase();

      return `
        <div class="card-indicador-muni ${bordeClass}">
          <div>
            <!-- Fila Superior: Código, Capa, Botón Info Ciudadana y Dirección -->
            <div class="ind-top-row">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="ind-cod-badge">${escaparHtml(cod)}</span>
                <span class="capa-badge capa-${escaparHtml(capaKey)}">Capa ${escaparHtml(capaKey.toUpperCase())} · ${escaparHtml(capaNombre)}</span>
                <button type="button" class="btn-info-ind" data-codigo="${escaparHtml(cod)}" title="¿Qué significa este indicador? (Explicación para no técnicos)" aria-expanded="false" aria-label="Ver explicación de ${escaparHtml(cod)}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </button>
              </div>
              ${dirBadgeHtml}
            </div>

            <!-- Desplegable pedagógico para público no técnico -->
            <div class="panel-exp-desplegable" id="exp-muni-${escaparHtml(cod)}" style="display:none;" role="region" aria-label="Explicación pedagógica de ${escaparHtml(cod)}"></div>

            <!-- Nombre Oficial -->
            <div class="ind-nombre-txt">${escaparHtml(ind.nombre)}</div>

            <!-- Centro Visual: Medidor Conic + Valor Físico -->
            <div class="ind-center-visual">
              <div class="ind-progress-ring-wrap" title="Puntaje Normalizado CRA: ${escaparHtml(puntajeText)} / 100 pts">
                <div class="ind-progress-ring" style="--val:${pct};--ring-color:${colorBarra};"></div>
                <span class="ind-progress-ring-val">${puntaje !== null ? puntaje.toFixed(0) : '—'}</span>
                <span class="ind-progress-ring-sub">ICR</span>
              </div>
              <div>
                <div class="ind-val-big">${escaparHtml(valText)} <span class="ind-val-unit">${escaparHtml(unidadText)}</span></div>
                <span class="ind-diag-pill ${diagClass}">${escaparHtml(diagText)}</span>
              </div>
            </div>

            <!-- Herramienta Visual: Barra de Espectro Semafórico con Marcador de Posición -->
            <div class="spectrum-meter">
              <div class="spectrum-track" title="Espectro regulatorio de riesgo (0 a 100 puntos)">
                <div class="spectrum-seg seg-opt" title="Zona Verde: Óptimo / Normal (0-40)"></div>
                <div class="spectrum-seg seg-ama" title="Zona Amarilla: Vigilancia (40-60)"></div>
                <div class="spectrum-seg seg-nar" title="Zona Naranja: Advertencia (60-75)"></div>
                <div class="spectrum-seg seg-roj" title="Zona Roja: Alerta Máxima (75-90)"></div>
                <div class="spectrum-seg seg-ext" title="Zona Carmesí: Extremo (90-100)"></div>
              </div>
              <div class="spectrum-pin-wrap">
                <div class="spectrum-pin" style="left:${pct}%" title="Posición municipal actual: ${escaparHtml(puntajeText)} pts">
                  <div class="spectrum-pin-arrow"></div>
                  <div class="spectrum-pin-label">${puntaje !== null ? puntaje.toFixed(1) : 'S/D'}</div>
                </div>
              </div>
              <div class="spectrum-labels-5">
                <span class="lbl-opt">${escaparHtml(cat.umbrales ? cat.umbrales.optimo : '0')}</span>
                <span class="lbl-ama">${escaparHtml(cat.umbrales ? cat.umbrales.amarilla : '40')}</span>
                <span class="lbl-nar">${escaparHtml(cat.umbrales ? cat.umbrales.naranja : '60')}</span>
                <span class="lbl-roj">${escaparHtml(cat.umbrales ? cat.umbrales.roja : '75')}</span>
                <span class="lbl-ext">${escaparHtml(cat.umbrales ? cat.umbrales.extremo : '100')}</span>
              </div>
            </div>
          </div>

          <!-- Metadata Inferior y Acción de Inspección -->
          <div class="ind-footer-meta">
            <span>${escaparHtml(ind.fuente)} · ${escaparHtml(ind.fecha_dato)}</span>
            <button class="btn-secundario btn-inspeccionar-ind" data-codigo="${escaparHtml(cod)}" style="padding:2px 8px;font-size:11px" title="Ver análisis regulatorio y distribución territorial de este indicador">
              Regulación &rsaquo;
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Listener para los botones de inspección dentro de la ficha
    grid.querySelectorAll('.btn-inspeccionar-ind').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cod = btn.getAttribute('data-codigo');
        abrirModalDetalleIndicador(cod);
      });
    });
  }

  function renderAccionesRegulatorias(muni) {
    const container = document.getElementById('box-acciones-regulatorias');
    if (!container) return;

    let acciones = [];
    if (muni.nivel_alerta === 'roja') {
      acciones = [
        "Priorización inmediata en Mesa Técnica Nacional de Agua (CRA - MinVivienda - UNGRD).",
        "Revisión de costos transitorios para esquemas de abastecimiento alterno (carrotanques, plantas portátiles de potabilización) según marco regulatorio vigente.",
        "Monitoreo diario de continuidad y caudales mínimos en coordinación con la SSPD.",
        "Activación de cláusulas de contingencia tarifaria y exoneración de penalidades por consumo de emergencia."
      ];
    } else if (muni.nivel_alerta === 'naranja') {
      acciones = [
        "Requerimiento de actualización de cronograma de turnos de racionamiento sectorizado al prestador.",
        "Verificación obligatoria de protocolos de desinfección y muestreo intensivo de calidad del agua potable (IRCA).",
        "Inspección de avance físico de obras de contingencia y conexión de pozos profundos de respaldo.",
        "Seguimiento especial al indicador S-4 (reducción acelerada de pérdidas físicas en la red de distribución)."
      ];
    } else if (muni.nivel_alerta === 'amarilla') {
      acciones = [
        "Seguimiento preventivo a la evolución del descenso de caudales en fuentes abastecedoras.",
        "Exigencia de verificación del estado de radicación y aprobación del Plan de Emergencia y Contingencia (PEC).",
        "Campañas de uso eficiente y ahorro del agua dirigidas a suscriptores residenciales y comerciales."
      ];
    } else {
      acciones = [
        "Mantenimiento de monitoreo ordinario en el ciclo diario del sistema Vigía.",
        "Seguimiento preventivo a niveles de micromedición y preservación de fuentes hídricas."
      ];
    }

    container.innerHTML = `
      <h4>Medidas Regulatorias y Operativas Sugeridas (CRA / Nivel ${muni.nivel_alerta.toUpperCase()}):</h4>
      <ul>
        ${acciones.map(a => `<li>${a}</li>`).join('')}
      </ul>
    `;
  }

  function abrirFichaMunicipal(divipola) {
    cambiarVista('V-04');
    initFichaV04(divipola);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* =========================================================================
     GRÁFICOS ANALÍTICOS ECHARTS — FICHA MUNICIPAL (RADAR 4D Y VELOCÍMETRO ICR)
     ========================================================================= */
  function calcularPromediosNacionales() {
    const munis = state.corte.municipios || [];
    if (!munis.length) return { A: 50, H: 50, S: 50, R: 50 };

    let sumA = 0, sumH = 0, sumS = 0, sumR = 0;
    munis.forEach(m => {
      sumA += (m.subindices_capa?.amenaza_A ?? 0);
      sumH += (m.subindices_capa?.vulnerabilidad_H ?? 0);
      sumS += (m.subindices_capa?.servicio_S ?? 0);
      sumR += (m.subindices_capa?.respuesta_R ?? 0);
    });
    const n = munis.length;
    return {
      A: +(sumA / n).toFixed(1),
      H: +(sumH / n).toFixed(1),
      S: +(sumS / n).toFixed(1),
      R: +(sumR / n).toFixed(1)
    };
  }

  function renderGraficosFichaECharts(muni) {
    if (typeof echarts === 'undefined') {
      console.warn("Apache ECharts no está cargado");
      return;
    }

    const promedios = calcularPromediosNacionales();
    const colorAlerta = muni.nivel_alerta === 'roja' ? '#B3261E' :
      (muni.nivel_alerta === 'naranja' ? '#E07A10' :
        (muni.nivel_alerta === 'amarilla' ? '#C79E00' : '#2E7D4F'));
    const colorArea = muni.nivel_alerta === 'roja' ? 'rgba(179, 38, 30, 0.32)' :
      (muni.nivel_alerta === 'naranja' ? 'rgba(224, 122, 16, 0.32)' :
        (muni.nivel_alerta === 'amarilla' ? 'rgba(242, 194, 0, 0.32)' : 'rgba(46, 125, 79, 0.32)'));

    // 1. Radar 4D (Capas A, H, S, R)
    const domRadar = document.getElementById('chart-radar-4d');
    if (domRadar) {
      if (!state.chartRadar) {
        state.chartRadar = echarts.init(domRadar);
      }

      const optionRadar = {
        animationDuration: 750,
        animationEasing: 'cubicOut',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(31, 42, 54, 0.95)',
          borderColor: '#43B2D7',
          borderWidth: 1,
          padding: [10, 14],
          textStyle: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Nunito Sans, sans-serif' },
          formatter: function (params) {
            const vals = params.value;
            const esMuni = params.name === muni.nombre;
            return `
              <div style="font-weight:800;margin-bottom:6px;font-size:13px;color:${esMuni ? '#43B2D7' : '#B9C4CC'}">${params.name}</div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:12px">
                <span style="color:#E6F5FA">• Amenaza (A):</span><b>${vals[0]} pts</b>
                <span style="color:#E6F5FA">• Oferta Hídrica (H):</span><b>${vals[1]} pts</b>
                <span style="color:#E6F5FA">• Falla Servicio (S):</span><b>${vals[2]} pts</b>
                <span style="color:#E6F5FA">• Capacidad Respuesta (R):</span><b>${vals[3]} pts</b>
              </div>
            `;
          }
        },
        legend: {
          bottom: 0,
          itemGap: 20,
          textStyle: { color: '#5B5B5B', fontSize: 11, fontWeight: 700 }
        },
        radar: {
          indicator: [
            { name: 'Amenaza (A)\nClimática', max: 100 },
            { name: 'Oferta Hídrica (H)\nVulnerabilidad', max: 100 },
            { name: 'Falla Servicio (S)\nContinuidad/Calidad', max: 100 },
            { name: 'Capacidad (R)\nRespuesta/Planes', max: 100 }
          ],
          shape: 'polygon',
          radius: '68%',
          center: ['50%', '48%'],
          splitNumber: 4,
          axisName: {
            color: '#1F2A36',
            fontWeight: 800,
            fontSize: 11,
            lineHeight: 14
          },
          splitLine: {
            lineStyle: {
              color: ['#D9D9D9', '#EAEFF2', '#D9D9D9', '#43B2D7'].reverse(),
              width: 1
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['rgba(244, 246, 248, 0.4)', 'rgba(255, 255, 255, 0.8)']
            }
          },
          axisLine: {
            lineStyle: { color: '#D9D9D9' }
          }
        },
        series: [{
          type: 'radar',
          data: [
            {
              value: [
                muni.subindices_capa?.amenaza_A ?? 0,
                muni.subindices_capa?.vulnerabilidad_H ?? 0,
                muni.subindices_capa?.servicio_S ?? 0,
                muni.subindices_capa?.respuesta_R ?? 0
              ],
              name: muni.nombre,
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: { color: colorAlerta },
              lineStyle: { width: 2.5, color: colorAlerta },
              areaStyle: { color: colorArea }
            },
            {
              value: [promedios.A, promedios.H, promedios.S, promedios.R],
              name: 'Promedio Nacional (23 mun.)',
              symbol: 'none',
              lineStyle: { type: 'dashed', width: 2, color: '#8C9BA5' },
              itemStyle: { color: '#8C9BA5' },
              areaStyle: { color: 'rgba(140, 155, 165, 0.12)' }
            }
          ]
        }]
      };

      state.chartRadar.setOption(optionRadar, true);
    }

    // 2. Velocímetro / Gauge de Riesgo ICR
    const domGauge = document.getElementById('chart-gauge-icr');
    if (domGauge) {
      if (!state.chartGauge) {
        state.chartGauge = echarts.init(domGauge);
      }

      const icrVal = muni.icr !== null ? muni.icr : 0;
      const optionGauge = {
        animationDuration: 900,
        animationEasing: 'cubicOut',
        series: [
          {
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 5,
            radius: '90%',
            center: ['50%', '58%'],
            axisLine: {
              lineStyle: {
                width: 14,
                color: [
                  [0.40, '#2E7D4F'],  // Sin Alerta (<40)
                  [0.60, '#F2C200'],  // Amarilla (40-60)
                  [0.75, '#E07A10'],  // Naranja (60-75)
                  [1.00, '#B3261E']   // Roja (>=75)
                ]
              }
            },
            pointer: {
              icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
              length: '62%',
              width: 7,
              offsetCenter: [0, '-8%'],
              itemStyle: {
                color: '#1F2A36'
              }
            },
            axisTick: {
              distance: -14,
              length: 6,
              lineStyle: {
                color: '#FFFFFF',
                width: 1.5
              }
            },
            splitLine: {
              distance: -14,
              length: 14,
              lineStyle: {
                color: '#FFFFFF',
                width: 2
              }
            },
            axisLabel: {
              color: '#8C9BA5',
              distance: 18,
              fontSize: 10,
              fontWeight: 700,
              formatter: function (val) {
                return val.toFixed(0);
              }
            },
            detail: {
              valueAnimation: true,
              formatter: function (value) {
                return '{score|' + value.toFixed(1) + '}{unit| pts}\n{desc|NIVEL ' + muni.nivel_alerta.toUpperCase().replace('_', ' ') + '}';
              },
              rich: {
                score: {
                  fontSize: 28,
                  fontWeight: 900,
                  color: colorAlerta,
                  fontFamily: 'Nunito Sans, sans-serif'
                },
                unit: {
                  fontSize: 12,
                  color: '#8C9BA5',
                  fontWeight: 700,
                  padding: [0, 0, 8, 4]
                },
                desc: {
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#1F2A36',
                  padding: [4, 0, 0, 0],
                  letterSpacing: 0.5
                }
              },
              offsetCenter: [0, '36%']
            },
            data: [
              {
                value: icrVal,
                name: 'ÍNDICE COMPUESTO DE RIESGO'
              }
            ],
            title: {
              offsetCenter: [0, '65%'],
              fontSize: 11,
              fontWeight: 800,
              color: '#8C9BA5'
            }
          }
        ]
      };

      state.chartGauge.setOption(optionGauge, true);
    }
  }

  // Redimensionamiento responsivo de gráficos ECharts
  window.addEventListener('resize', () => {
    if (state.chartRadar) state.chartRadar.resize();
    if (state.chartGauge) state.chartGauge.resize();
  });

  /* =========================================================================
     8. VISTA V-05: CATÁLOGO OFICIAL Y VISUAL DE INDICADORES (20)
     ========================================================================= */
  function initCatalogoV05() {
    // 1. Configurar listeners de filtros por capa
    const pillButtons = document.querySelectorAll('#filtro-catalogo-capas .pill-capa-btn');
    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filtroCatalogoCapa = btn.getAttribute('data-filtro');
        renderCatalogoV05();
      });
    });

    // 2. Configurar listener de búsqueda en tiempo real
    const searchInput = document.getElementById('input-busqueda-catalogo');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.busquedaCatalogo = e.target.value.toLowerCase().trim();
        renderCatalogoV05();
      });
    }

    // 3. Configurar switch de vistas (Galería vs Tabla)
    const btnGaleria = document.getElementById('btn-vista-galeria');
    const btnTabla = document.getElementById('btn-vista-tabla');
    const panelGaleria = document.getElementById('grid-catalogo-visual');
    const panelTabla = document.getElementById('panel-catalogo-tabla');

    if (btnGaleria && btnTabla) {
      btnGaleria.addEventListener('click', () => {
        btnGaleria.classList.add('active');
        btnTabla.classList.remove('active');
        if (panelGaleria) panelGaleria.style.display = 'grid';
        if (panelTabla) panelTabla.style.display = 'none';
        state.vistaCatalogoModo = 'galeria';
      });

      btnTabla.addEventListener('click', () => {
        btnTabla.classList.add('active');
        btnGaleria.classList.remove('active');
        if (panelGaleria) panelGaleria.style.display = 'none';
        if (panelTabla) panelTabla.style.display = 'block';
        state.vistaCatalogoModo = 'tabla';
      });
    }

    // 4. Modal listeners
    initModalIndicadorEvents();

    // 5. Renderizado Inicial
    renderCatalogoV05();
  }

  function renderCatalogoV05() {
    const gridVisual = document.getElementById('grid-catalogo-visual');
    const tbody = document.getElementById('tbody-catalogo-indicadores');
    if (!gridVisual && !tbody) return;

    let items = (data && data.catalogoIndicadores && data.catalogoIndicadores.length > 0)
      ? data.catalogoIndicadores
      : CATALOGO_INDICADORES_MASTER;

    // Filtro por Capa
    const fCapa = state.filtroCatalogoCapa || 'TODOS';
    if (fCapa === 'ICR') {
      items = items.filter(ind => ind.en_icr === true);
    } else if (fCapa !== 'TODOS') {
      items = items.filter(ind => {
        const c = ind.capa || ind.codigo[0];
        return c.toUpperCase() === fCapa.toUpperCase();
      });
    }

    // Filtro por Búsqueda
    const q = state.busquedaCatalogo || '';
    if (q) {
      items = items.filter(ind =>
        ind.codigo.toLowerCase().includes(q) ||
        ind.nombre.toLowerCase().includes(q) ||
        ind.fuente.toLowerCase().includes(q) ||
        ind.formula.toLowerCase().includes(q)
      );
    }

    // --- Render Galería Visual ---
    if (gridVisual) {
      if (items.length === 0) {
        gridVisual.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:40px;background:#FFF;border-radius:12px;border:1px dashed var(--linea)">
            <h4 style="color:var(--texto-fuerte);margin-bottom:6px">No se encontraron indicadores</h4>
            <p style="color:var(--texto-claro);font-size:13px">Pruebe ajustando el término de búsqueda o seleccione otra capa regulatoria.</p>
          </div>
        `;
      } else {
        gridVisual.innerHTML = items.map(ind => {
          const capaKey = ind.capa ? ind.capa.toLowerCase() : ind.codigo[0].toLowerCase();
          const nombresCapa = { a: 'Amenaza Macro/Clima', h: 'Oferta y Vulnerabilidad Hídrica', s: 'Sensibilidad del Servicio', r: 'Respuesta y Daño' };
          const capaNombre = nombresCapa[capaKey] || `Capa ${capaKey.toUpperCase()}`;

          // ICR Weight Tag
          let icrTag = '';
          if (ind.en_icr) {
            const pesos = { a: '30%', h: '30%', s: '25%', r: '15%' };
            const peso = pesos[capaKey] || '';
            icrTag = `<span class="ind-meta-pill" style="background:#E8EEF9;color:#003189;font-weight:800">ICR Capa ${capaKey.toUpperCase()} (${peso})</span>`;
          } else {
            icrTag = `<span class="ind-meta-pill" style="background:#FFF3E0;color:#E07A10;font-weight:800">Contexto / Alerta</span>`;
          }

          // Direction of Risk Tag
          let dirBadge = '';
          let dirExplicacion = '';
          if (ind.dir === '↑') {
            dirBadge = `<span class="dir-risk-badge dir-sube">▲ Sube riesgo</span>`;
            dirExplicacion = `A mayor valor reportado, mayor criticidad regulatoria.`;
          } else if (ind.dir === '↓') {
            dirBadge = `<span class="dir-risk-badge dir-baja">▼ Baja riesgo</span>`;
            dirExplicacion = `A menor valor reportado, mayor déficit o vulnerabilidad.`;
          } else {
            dirBadge = `<span class="dir-risk-badge dir-rango">◆ Control</span>`;
            dirExplicacion = `Zona de control regulatorio y bandas tarifarias.`;
          }

          return `
            <div class="ind-visual-card borde-${escaparHtml(capaKey)}">
              <div>
                <!-- Encabezado con Código, Capa y Ponderación -->
                <div class="ind-card-header">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="ind-card-cod">${escaparHtml(ind.codigo)}</span>
                    <span class="capa-badge capa-${escaparHtml(capaKey)}">${escaparHtml(capaNombre)}</span>
                    <button type="button" class="btn-info-ind" data-codigo="${escaparHtml(ind.codigo)}" data-panel-id="exp-cat-${escaparHtml(ind.codigo)}" title="¿Qué significa este indicador? (Explicación para no técnicos)" aria-expanded="false" aria-label="Ver explicación de ${escaparHtml(ind.codigo)}">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </button>
                  </div>
                  ${dirBadge}
                </div>

                <!-- Desplegable pedagógico para público no técnico -->
                <div class="panel-exp-desplegable" id="exp-cat-${escaparHtml(ind.codigo)}" style="display:none;" role="region" aria-label="Explicación pedagógica de ${escaparHtml(ind.codigo)}"></div>

                <!-- Título -->
                <h3 class="ind-card-title">${escaparHtml(ind.nombre)}</h3>

                <!-- Fórmula Técnica -->
                <div class="ind-card-formula-box">
                  <span class="ind-card-formula-label">Fórmula de Cálculo Oficial</span>
                  <div class="ind-card-formula-txt">${escaparHtml(ind.formula)}</div>
                </div>

                <!-- Pills de Atributos -->
                <div class="ind-card-meta-pills">
                  ${icrTag}
                  <span class="ind-meta-pill" title="Fuente Oficial">${escaparHtml(ind.fuente)}</span>
                  <span class="ind-meta-pill" title="Escala Territorial">Escala: ${escaparHtml(ind.escala || 'Municipio')}</span>
                  <span class="ind-meta-pill" title="Unidad de Medida">Unidad: ${escaparHtml(ind.unidad)}</span>
                </div>

                <!-- Herramienta Visual: Medidor de Espectro Semafórico de Umbrales -->
                <div class="ind-card-spectrum-sec">
                  <div class="ind-spectrum-head">
                    <span>Espectro Semafórico de Puntos de Quiebre</span>
                    <span style="font-size:10px;color:var(--cra-cian-texto)">Regla CRA</span>
                  </div>
                  <div class="spectrum-meter">
                    <div class="spectrum-track" title="0 a 100 puntos normalizados">
                      <div class="spectrum-seg seg-opt" title="Óptimo / Normal (0-40)"></div>
                      <div class="spectrum-seg seg-ama" title="Amarilla: Vigilancia (40-60)"></div>
                      <div class="spectrum-seg seg-nar" title="Naranja: Advertencia (60-75)"></div>
                      <div class="spectrum-seg seg-roj" title="Roja: Alerta Máxima (75-90)"></div>
                      <div class="spectrum-seg seg-ext" title="Extremo: Calamidad (90-100)"></div>
                    </div>
                    <div class="spectrum-labels-5">
                      <span class="lbl-opt" title="Óptimo">${escaparHtml(ind.umbrales.optimo)}</span>
                      <span class="lbl-ama" title="Amarilla">${escaparHtml(ind.umbrales.amarilla)}</span>
                      <span class="lbl-nar" title="Naranja">${escaparHtml(ind.umbrales.naranja)}</span>
                      <span class="lbl-roj" title="Roja">${escaparHtml(ind.umbrales.roja)}</span>
                      <span class="lbl-ext" title="Extremo">${escaparHtml(ind.umbrales.extremo)}</span>
                    </div>
                  </div>
                  <div style="font-size:11px;color:var(--texto-claro);margin-top:6px;font-style:italic">
                    ${escaparHtml(dirExplicacion)}
                  </div>
                </div>
              </div>

              <!-- Pie de Card con Botón de Inspección Territorial -->
              <div class="ind-card-action-row">
                <span style="font-size:11px;color:var(--texto-claro)">Auditado en corte oficial</span>
                <button class="btn-card-inspeccionar" data-codigo="${escaparHtml(ind.codigo)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span>Ver Distribución Territorial</span>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // --- Render Tabla Técnica ---
    if (tbody) {
      tbody.innerHTML = items.map(ind => {
        const capaKey = ind.capa ? ind.capa.toLowerCase() : ind.codigo[0].toLowerCase();
        let dirBadge = ind.dir === '↑' ? `<span class="dir-risk-badge dir-sube">▲ Sube</span>` :
          (ind.dir === '↓' ? `<span class="dir-risk-badge dir-baja">▼ Baja</span>` :
            `<span class="dir-risk-badge dir-rango">◆ Rango</span>`);

        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <strong style="font-family:monospace;font-size:13px;color:var(--cra-cian-texto)">${escaparHtml(ind.codigo)}</strong>
                <button type="button" class="btn-info-ind" data-codigo="${escaparHtml(ind.codigo)}" data-panel-id="exp-tbl-${escaparHtml(ind.codigo)}" title="¿Qué significa este indicador? (Explicación para no técnicos)" aria-expanded="false" aria-label="Ver explicación de ${escaparHtml(ind.codigo)}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </button>
              </div>
              <div class="panel-exp-desplegable" id="exp-tbl-${escaparHtml(ind.codigo)}" style="display:none;" role="region" aria-label="Explicación pedagógica de ${escaparHtml(ind.codigo)}"></div>
            </td>
            <td><span class="capa-badge capa-${escaparHtml(capaKey)}">${escaparHtml(capaKey.toUpperCase())}</span></td>
            <td>
              <strong>${escaparHtml(ind.nombre)}</strong>
              <div style="font-size:11px;color:var(--texto-claro)">Escala: ${escaparHtml(ind.escala || 'Municipio')}</div>
            </td>
            <td style="font-size:12px;color:var(--texto);max-width:260px">${escaparHtml(ind.formula)}</td>
            <td><span class="ind-meta-pill">${escaparHtml(ind.unidad)}</span></td>
            <td><span style="font-size:12px">${escaparHtml(ind.fuente)}</span></td>
            <td style="text-align:center">${dirBadge}</td>
            <td>
              <div class="micro-spectrum-wrap">
                <div class="micro-spectrum-track">
                  <div class="spectrum-seg seg-opt"></div>
                  <div class="spectrum-seg seg-ama"></div>
                  <div class="spectrum-seg seg-nar"></div>
                  <div class="spectrum-seg seg-roj"></div>
                  <div class="spectrum-seg seg-ext"></div>
                </div>
                <div class="micro-spectrum-labels">
                  <span class="lbl-opt">${escaparHtml(ind.umbrales.optimo)}</span>
                  <span class="lbl-ama">${escaparHtml(ind.umbrales.amarilla)}</span>
                  <span class="lbl-nar">${escaparHtml(ind.umbrales.naranja)}</span>
                  <span class="lbl-roj">${escaparHtml(ind.umbrales.roja)}</span>
                  <span class="lbl-ext">${escaparHtml(ind.umbrales.extremo)}</span>
                </div>
              </div>
            </td>
            <td style="text-align:center">
              <button class="btn-secundario btn-inspeccionar-tabla" data-codigo="${escaparHtml(ind.codigo)}" style="padding:4px 10px;font-size:11px">
                Inspeccionar
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Configurar listeners de clic para abrir el modal en ambas vistas
    document.querySelectorAll('.btn-card-inspeccionar, .btn-inspeccionar-tabla').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cod = btn.getAttribute('data-codigo');
        abrirModalDetalleIndicador(cod);
      });
    });
  }

  /* Eventos del Modal de Inspección de Indicador */
  function initModalIndicadorEvents() {
    const modal = document.getElementById('modal-detalle-indicador');
    const btnCerrar = document.getElementById('btn-cerrar-modal-ind');
    if (!modal) return;

    if (btnCerrar) {
      btnCerrar.onclick = () => {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      };
    }

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* Apertura e Inyección Dinámica del Modal de Indicador */
  function abrirModalDetalleIndicador(codigo) {
    const modal = document.getElementById('modal-detalle-indicador');
    if (!modal) return;

    const ind = getInfoIndicador(codigo);
    if (!ind || !ind.codigo) return;

    state.indicadorModalSeleccionado = codigo;

    const capaKey = ind.capa ? ind.capa.toLowerCase() : ind.codigo[0].toLowerCase();
    const nombresCapa = { a: 'Capa A · Amenaza Clima', h: 'Capa H · Oferta Hídrica', s: 'Capa S · Sensibilidad del Servicio', r: 'Capa R · Respuesta y Daño' };
    const pesosCapa = { a: 'Ponderado en ICR (30%)', h: 'Ponderado en ICR (30%)', s: 'Ponderado en ICR (25%)', r: 'Ponderado en ICR (15%)' };

    // 1. Textos y Cabecera
    document.getElementById('modal-ind-cod').textContent = ind.codigo;
    document.getElementById('modal-ind-capa').textContent = nombresCapa[capaKey] || `Capa ${capaKey.toUpperCase()}`;
    document.getElementById('modal-ind-capa').className = `modal-capa-badge capa-${capaKey}`;
    document.getElementById('modal-ind-icr').textContent = ind.en_icr ? (pesosCapa[capaKey] || 'Ponderado en ICR') : 'Variable de Contexto / Alerta Temprana';
    document.getElementById('modal-ind-nombre').textContent = ind.nombre;
    document.getElementById('modal-ind-formula').textContent = ind.formula;

    const fuenteExtCatalogo = {
      'A-1': { url: 'https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for', portal: 'NOAA CPC' },
      'A-2': { url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml', portal: 'NOAA CPC / IRI' },
      'A-3': { url: 'http://dhime.ideam.gov.co/atencionciudadano/', portal: 'IDEAM DHIME' },
      'A-4': { url: 'http://www.ideam.gov.co/web/tiempo-y-clima/clima', portal: 'IDEAM Clima' },
      'A-5': { url: 'https://firms.modaps.eosdis.nasa.gov/map/', portal: 'NASA FIRMS' },
      'H-1': { url: 'http://dhime.ideam.gov.co/atencionciudadano/', portal: 'IDEAM DHIME' },
      'H-2': { url: 'http://www.ideam.gov.co/web/agua/estudio-nacional-del-agua', portal: 'IDEAM ENA' },
      'H-3': { url: 'http://www.ideam.gov.co/web/agua/estudio-nacional-del-agua', portal: 'IDEAM ENA' },
      'H-4': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI' },
      'H-5': { url: 'https://sinergox.xm.com.co/', portal: 'XM Sinergox' },
      'S-1': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI' },
      'S-2': { url: 'https://www.datos.gov.co/Salud-y-Protecci-n-Social/Calidad-del-Agua-para-Consumo-Humano-SIVICAP/nxt2-39c3', portal: 'datos.gov.co / INS SIVICAP' },
      'S-3': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI' },
      'S-4': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI' },
      'S-5': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI' },
      'S-6': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI' },
      'R-1': { url: 'https://www.sui.gov.co/', portal: 'SSPD SUI / MinVivienda' },
      'R-2': { url: 'http://portal.gestiondelriesgo.gov.co/', portal: 'UNGRD' },
      'R-3': { url: 'https://minvivienda.gov.co/viceministerio-de-agua-y-saneamiento-basico', portal: 'MinVivienda' },
      'R-4': { url: 'http://portal.gestiondelriesgo.gov.co/', portal: 'UNGRD' }
    };
    const fInfoModal = fuenteExtCatalogo[codigo] || {};
    const urlFuenteModal = fInfoModal.url || 'https://www.sui.gov.co/';
    const elFuenteModal = document.getElementById('modal-ind-fuente');
    if (elFuenteModal) {
      elFuenteModal.innerHTML = `
        <div>${ind.fuente} · Escala: ${ind.escala || 'Municipio'} · Unidad: ${ind.unidad}</div>
        <div style="margin-top:6px">
          <a href="${urlFuenteModal}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;color:var(--cra-azul);text-decoration:none;background:#E0F2FE;padding:4px 8px;border-radius:4px;border:1px solid #BAE6FD;">
            <span>Ir a la fuente del dato ↗</span>
          </a>
        </div>
      `;
    }

    let dirTexto = '';
    if (ind.dir === '↑') dirTexto = '▲ Mayor valor reportado incrementa el riesgo de colapso o emergencia.';
    else if (ind.dir === '↓') dirTexto = '▼ Menor valor reportado incrementa la vulnerabilidad y déficit del acueducto.';
    else dirTexto = '◆ Control dentro de rangos operativos y metas de uso eficiente del agua.';
    document.getElementById('modal-ind-dir').textContent = dirTexto;

    // Marco normativo específico por tipo de indicador
    const normas = {
      'S-1': 'Resolución CRA 943 de 2021 (Libro 2, Título 1 - Continuidad y Calidad del Servicio).',
      'S-2': 'Resolución Conjunta 2115 de 2007 (MinProtección - MinAmbiente) e INS SIVICAP.',
      'S-3': 'Ley 142 de 1994, Art. 11 y metas de cobertura urbana CONPES 4004 de 2020.',
      'S-4': 'Resolución CRA 688 de 2014 y Res. CRA 825 de 2017 (Índice de Agua No Contabilizada - IANC).',
      'S-5': 'Resolución CRA 943 de 2021, Art. 2.1.1.1.20 y régimen de peticiones, quejas y reclamos.',
      'S-6': 'Resolución CRA 887 de 2019 (Desincentivo al consumo excesivo de agua potable en sequía).',
      'H-1': 'Decreto 1076 de 2015 y metodología de caudales ambientales IDEAM.',
      'H-2': 'Estudio Nacional del Agua (ENA 2022) - Índice de Vulnerabilidad al Desabastecimiento.',
      'H-3': 'Estudio Nacional del Agua (ENA 2022) - Índice de Uso del Agua Superficial (IUA).',
      'H-4': 'Reglamento Técnico del Sector de Agua Potable y Saneamiento Básico (RAS - Título B).',
      'H-5': 'Regulación CREG / XM Sinergox para embalses de abastecimiento y generación hidroeléctrica.',
      'A-1': 'Metodología oficial NOAA CPC para índices El Niño Oscilación del Sur (ENSO).',
      'A-2': 'Boletines de predicción climática probabilística NOAA / IRI Columbia University.',
      'A-3': 'Catálogo Nacional de Estaciones IDEAM (DHIME) y anomalía porcentual histórica 1991-2020.',
      'A-4': 'Índice de Días Secos Consecutivos (CDD) según estándares climáticos OMM / IDEAM.',
      'A-5': 'Sistema NASA FIRMS (Fire Information for Resource Management System - VIIRS 375m).',
      'R-1': 'Decreto 1077 de 2015, Art. 2.3.4.5.1 (Obligatoriedad de Planes de Emergencia y Contingencia).',
      'R-2': 'Ley 1523 de 2012 de Gestión del Riesgo de Desastres y lineamientos UNGRD.',
      'R-3': 'Circular MinVivienda de Monitoreo Sectorial Survey123 y reportes de desabastecimiento.',
      'R-4': 'Declaratoria formal municipal bajo Ley 1523 de 2012 (Calamidad Pública por Sequía).'
    };
    document.getElementById('modal-ind-norma').textContent = normas[codigo] || 'Marco Regulatorio General del Sector de Agua Potable y Saneamiento Básico (CRA / Ley 142 de 1994).';

    // 2. Espectro Visual en Modal
    const spectrumContainer = document.getElementById('modal-ind-spectrum');
    if (spectrumContainer) {
      spectrumContainer.innerHTML = `
        <div class="spectrum-meter">
          <div class="spectrum-track" style="height:14px;border-radius:7px">
            <div class="spectrum-seg seg-opt" style="flex:40"></div>
            <div class="spectrum-seg seg-ama" style="flex:20"></div>
            <div class="spectrum-seg seg-nar" style="flex:15"></div>
            <div class="spectrum-seg seg-roj" style="flex:15"></div>
            <div class="spectrum-seg seg-ext" style="flex:10"></div>
          </div>
          <div class="spectrum-labels-5" style="font-size:12px;margin-top:6px">
            <div style="display:flex;flex-direction:column;align-items:flex-start">
              <span class="lbl-opt">0 pts · Óptimo</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.optimo}</strong>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center">
              <span class="lbl-ama">40 pts · Vigilancia</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.amarilla}</strong>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center">
              <span class="lbl-nar">60 pts · Advertencia</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.naranja}</strong>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center">
              <span class="lbl-roj">75 pts · Máximo Riesgo</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.roja}</strong>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end">
              <span class="lbl-ext">90-100 pts · Extremo</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.extremo}</strong>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Distribución Territorial en los Municipios Monitoreados
    const munis = state.corte.municipios || [];
    let cRoja = 0, cNaranja = 0, cAmarilla = 0, cSin = 0;
    const listaAfectados = [];

    munis.forEach(m => {
      const itm = m.indicadores ? m.indicadores[codigo] : null;
      if (itm) {
        const p = itm.puntaje;
        if (p !== null) {
          if (p >= 75) cRoja++;
          else if (p >= 60) cNaranja++;
          else if (p >= 40) cAmarilla++;
          else cSin++;
        } else {
          cSin++;
        }

        listaAfectados.push({
          divipola: m.divipola,
          nombre: m.nombre,
          departamento: m.departamento,
          valor: itm.valor,
          unidad: itm.unidad,
          puntaje: itm.puntaje,
          nivel: p >= 75 ? 'roja' : (p >= 60 ? 'naranja' : (p >= 40 ? 'amarilla' : 'sin_alerta'))
        });
      }
    });

    const tot = munis.length || 1;
    const distGrid = document.getElementById('modal-ind-distribucion');
    if (distGrid) {
      distGrid.innerHTML = `
        <div class="dist-card dist-roja">
          <div class="dist-count" style="color:var(--alerta-roja)">${cRoja}</div>
          <div class="dist-label" style="color:var(--alerta-roja)">Nivel Rojo (Crítico)</div>
          <div class="dist-pct">${((cRoja / tot) * 100).toFixed(1)} % del territorio</div>
        </div>
        <div class="dist-card dist-naranja">
          <div class="dist-count" style="color:var(--alerta-naranja)">${cNaranja}</div>
          <div class="dist-label" style="color:var(--alerta-naranja)">Nivel Naranja (Alto)</div>
          <div class="dist-pct">${((cNaranja / tot) * 100).toFixed(1)} % del territorio</div>
        </div>
        <div class="dist-card dist-amarilla">
          <div class="dist-count" style="color:#826600">${cAmarilla}</div>
          <div class="dist-label" style="color:#826600">Nivel Amarillo (Medio)</div>
          <div class="dist-pct">${((cAmarilla / tot) * 100).toFixed(1)} % del territorio</div>
        </div>
        <div class="dist-card dist-sin">
          <div class="dist-count" style="color:var(--alerta-sin)">${cSin}</div>
          <div class="dist-label" style="color:var(--alerta-sin)">Normal / Estable</div>
          <div class="dist-pct">${((cSin / tot) * 100).toFixed(1)} % del territorio</div>
        </div>
      `;
    }

    // 4. Tabla de Municipios con Mayor Afectación
    listaAfectados.sort((a, b) => {
      if (a.puntaje !== null && b.puntaje !== null) return b.puntaje - a.puntaje;
      if (typeof a.valor === 'number' && typeof b.valor === 'number') {
        return ind.dir === '↓' ? a.valor - b.valor : b.valor - a.valor;
      }
      return 0;
    });

    const tbodyMunis = document.getElementById('modal-ind-tabla-munis');
    if (tbodyMunis) {
      const topMunis = listaAfectados.slice(0, 6);
      tbodyMunis.innerHTML = topMunis.map(m => `
        <tr>
          <td><strong>${escaparHtml(m.nombre)}</strong> <span style="font-size:11px;color:var(--texto-claro)">(${escaparHtml(m.divipola)})</span></td>
          <td>${escaparHtml(m.departamento)}</td>
          <td><strong>${m.valor !== null ? escaparHtml(m.valor) : 'S/D'}</strong> <span style="font-size:11px;color:var(--texto-claro)">${escaparHtml(m.unidad)}</span></td>
          <td><strong>${m.puntaje !== null ? Number(m.puntaje).toFixed(1) : '—'}</strong> / 100</td>
          <td><span class="chip-alerta ${escaparHtml(m.nivel)}">${escaparHtml(String(m.nivel || '').replace('_', ' '))}</span></td>
          <td>
            <button class="btn-secundario btn-ir-muni-modal" data-divipola="${escaparHtml(m.divipola)}" style="padding:3px 8px;font-size:11px">
              Ver Ficha
            </button>
          </td>
        </tr>
      `).join('');

      tbodyMunis.querySelectorAll('.btn-ir-muni-modal').forEach(b => {
        b.addEventListener('click', () => {
          const divipola = b.getAttribute('data-divipola');
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
          abrirFichaMunicipal(divipola);
        });
      });
    }

    // 5. Orientación Regulatoria para la Comisión
    const orientacionBox = document.getElementById('modal-ind-orientacion');
    if (orientacionBox) {
      let orientacionTexto = '';
      if (capaKey === 's') {
        orientacionTexto = `<strong>Mandato Regulatorio CRA (Dimensión Servicio):</strong> Si este indicador supera los 60 puntos (Naranja) o 75 puntos (Rojo), la CRA y la SSPD deben ordenar la revisión inmediata de turnos de bombeo sectorizados, costos transitorios de distribución alternativa (carrotanques/plantas portátiles) y autorizar la flexibilización tarifaria de contingencia estipulada en el Libro 2 de la Resolución CRA 943 de 2021.`;
      } else if (capaKey === 'a') {
        orientacionTexto = `<strong>Mandato Regulatorio CRA (Dimensión Amenaza Clima):</strong> Este indicador mide la presión exógena hidrometeorológica. La superación del umbral de advertencia activa los comités semanales interinstitucionales con IDEAM y la UNGRD, anticipando la probabilidad de sequía y declaratorias formales de desabastecimiento.`;
      } else if (capaKey === 'h') {
        orientacionTexto = `<strong>Mandato Regulatorio CRA (Dimensión Oferta Hídrica):</strong> Monitorea la capacidad de resiliencia del ecosistema y la infraestructura. Valores críticos exigen a los prestadores activar fuentes subterráneas de respaldo, tanques de compensación y reducir el consumo no autorizado en la red de aducción.`;
      } else {
        orientacionTexto = `<strong>Mandato Regulatorio CRA (Dimensión Respuesta):</strong> Verifica si el municipio cuenta con Plan de Emergencia y Contingencia (PEC) radicado y si ha declarado formalmente Calamidad Pública. La ausencia de PEC en municipios de alta amenaza dispara requerimientos perentorios conjuntos con la Procuraduría Delegada para Asuntos Ambientales.`;
      }
      orientacionBox.innerHTML = orientacionTexto;
    }

    // Mostrar Modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  /* =========================================================================
     9. VISTA V-06: BANDEJA DE ALERTAS Y ESCALAMIENTOS
     ========================================================================= */
  function initAlertasV06() {
    const tbody = document.getElementById('tbody-alertas-activas');
    if (!tbody) return;

    const alertas = state.corte.alertas_activas || [];
    document.getElementById('badge-total-alertas').textContent = alertas.length;

    tbody.innerHTML = alertas.map(alt => `
      <tr data-abrir-municipio="${escaparHtml(alt.divipola)}">
        <td><span style="font-family:monospace;font-weight:700">${escaparHtml(alt.id_alerta)}</span></td>
        <td><strong>${escaparHtml(alt.municipio)}</strong> <span style="color:var(--texto-claro)">(${escaparHtml(alt.departamento)})</span></td>
        <td><span class="chip-alerta ${escaparHtml(alt.nivel)}">${escaparHtml(alt.nivel)}</span></td>
        <td><strong>${escaparHtml(alt.icr)}</strong> pts</td>
        <td style="font-size:12px">${escaparHtml(alt.motivo)}</td>
        <td><span style="background:${alt.prioridad === 'ALTA' ? '#FFEBEE' : '#FFF8E1'};color:${alt.prioridad === 'ALTA' ? 'var(--alerta-roja)' : 'var(--alerta-amarilla)'};padding:2px 6px;border-radius:3px;font-weight:800;font-size:11px">${escaparHtml(alt.prioridad)}</span></td>
        <td><span style="font-size:11px;font-weight:700;color:var(--cra-cian-texto)">${escaparHtml(alt.estado_revision)}</span></td>
        <td><button class="btn-secundario" style="padding:4px 8px;font-size:11px" data-abrir-municipio="${escaparHtml(alt.divipola)}">Revisar</button></td>
      </tr>
    `).join('');
  }

  /* =========================================================================
     10. VISTA V-07: MONITOR DE FUENTES Y FRESCURA
     ========================================================================= */
  function initFuentesV07() {
    const tbody = document.getElementById('tbody-monitor-fuentes');
    if (!tbody) return;

    const fuentes = (data && data.fuentesMonitor && data.fuentesMonitor.length > 0) ? data.fuentesMonitor : [
      { id: "F-01", nombre: "Índices SST Semanales & ONI", entidad: "NOAA CPC", frecuencia: "Semanal", estado: "Al día", ultima_captura: "2026-10-08", latencia: "< 24 h", filas: 1240, hash: "a7f9c2d1" },
      { id: "F-02", nombre: "Estaciones Pluviométricas & Caudales", entidad: "IDEAM DHIME", frecuencia: "Diaria", estado: "Al día", ultima_captura: "2026-10-09", latencia: "< 6 h", filas: 48920, hash: "3e8b19a0" },
      { id: "F-03", nombre: "Focos de Calor VIIRS/MODIS", entidad: "NASA FIRMS", frecuencia: "Tiempo Real", estado: "Al día", ultima_captura: "2026-10-09", latencia: "< 3 h", filas: 3150, hash: "c41f7d82" },
      { id: "F-04", nombre: "Continuidad, IANC & Reclamos PQR", entidad: "SSPD SUI", frecuencia: "Mensual", estado: "Al día", ultima_captura: "2026-10-05", latencia: "< 48 h", filas: 15400, hash: "99b38e21" },
      { id: "F-05", nombre: "Calidad del Agua Potable (IRCA)", entidad: "INS SIVICAP", frecuencia: "Quincenal", estado: "Al día", ultima_captura: "2026-10-07", latencia: "< 24 h", filas: 8930, hash: "fa026d44" },
      { id: "F-06", nombre: "Volumen Útil de Embalses", entidad: "XM Sinergox", frecuencia: "Diaria", estado: "Al día", ultima_captura: "2026-10-09", latencia: "< 4 h", filas: 640, hash: "5b81a70f" },
      { id: "F-07", nombre: "Reportes de Calamidad y Carrotanques", entidad: "UNGRD", frecuencia: "Evento", estado: "Al día", ultima_captura: "2026-10-09", latencia: "< 12 h", filas: 230, hash: "81f09e33" },
      { id: "F-08", nombre: "Marco Geoestadístico Nacional (MGN)", entidad: "DANE", frecuencia: "Anual", estado: "Certificado", ultima_captura: "2026-09-15", latencia: "Oficial", filas: 1122, hash: "e201b87a" }
    ];

    tbody.innerHTML = fuentes.map(f => `
      <tr>
        <td><span style="font-family:monospace;font-weight:800;color:var(--cra-cian-texto)">${escaparHtml(f.id)}</span></td>
        <td><strong>${escaparHtml(f.nombre)}</strong></td>
        <td>${escaparHtml(f.entidad)}</td>
        <td>${escaparHtml(f.frecuencia)}</td>
        <td><span class="frescura-pill" style="font-size:11px"><span class="frescura-dot"></span> ${escaparHtml(f.estado)}</span></td>
        <td style="font-variant-numeric:tabular-nums;font-size:12px">${escaparHtml(f.ultima_captura)}</td>
        <td>${escaparHtml(f.latencia)}</td>
        <td><strong>${Number(f.filas || 0).toLocaleString('es-CO')}</strong></td>
        <td><span style="font-family:monospace;font-size:11px">${escaparHtml(f.hash)}</span></td>
      </tr>
    `).join('');
  }

  /* =========================================================================
     11. EXPORTACIONES (CSV, JSON, IMPRESIÓN PDF) & INTEROPERABILIDAD ARCGIS PRO
     ========================================================================= */
  function initExportaciones() {
    const btnCsv = document.getElementById('btn-exportar-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        exportarTablaCSV();
      });
    }

    const btnJson = document.getElementById('btn-exportar-json');
    if (btnJson) {
      btnJson.addEventListener('click', () => {
        exportarCorteJSON();
      });
    }

    const btnPrint = document.getElementById('btn-imprimir-ficha');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // --- Enlaces del Centro de Interoperabilidad con ArcGIS Pro ---
    const btnArcGIS = document.getElementById('btn-arcgis-hub');
    if (btnArcGIS) {
      btnArcGIS.addEventListener('click', () => {
        abrirModalArcGIS();
      });
    }

    const btnCerrarArcGIS = document.getElementById('btn-cerrar-modal-arcgis');
    if (btnCerrarArcGIS) {
      btnCerrarArcGIS.addEventListener('click', () => {
        cerrarModalArcGIS();
      });
    }

    const modalBackdrop = document.getElementById('modal-arcgis-hub');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          cerrarModalArcGIS();
        }
      });
    }

    const btnDescargarGeoJSON = document.getElementById('btn-descargar-arcgis-geojson');
    if (btnDescargarGeoJSON) {
      btnDescargarGeoJSON.addEventListener('click', () => {
        exportarParaArcGIS('geojson');
      });
    }

    const btnDescargarCSV = document.getElementById('btn-descargar-arcgis-csv');
    if (btnDescargarCSV) {
      btnDescargarCSV.addEventListener('click', () => {
        exportarParaArcGIS('csv');
      });
    }

    // Input de archivo GeoJSON de ArcGIS
    const inputFile = document.getElementById('input-file-arcgis');
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        cargarArchivoArcGIS(e);
      });
    }

    // Dropzone drag & drop
    const dropzone = document.getElementById('arcgis-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (evt) {
            procesarTextoGeoJSONArcGIS(evt.target.result, file.name);
          };
          reader.readAsText(file);
        }
      });
    }

    const btnCargarMuestra = document.getElementById('btn-cargar-muestra-arcgis');
    if (btnCargarMuestra) {
      btnCargarMuestra.addEventListener('click', () => {
        cargarMuestraArcGIS();
      });
    }

    const btnAplicarArcGIS = document.getElementById('btn-aplicar-arcgis');
    if (btnAplicarArcGIS) {
      btnAplicarArcGIS.addEventListener('click', () => {
        aplicarDatosArcGIS();
      });
    }

    const btnCancelarPreview = document.getElementById('btn-cancelar-preview-arcgis');
    if (btnCancelarPreview) {
      btnCancelarPreview.addEventListener('click', () => {
        cancelarPreviewArcGIS();
      });
    }

    const btnRevertirArcGIS = document.getElementById('btn-revertir-arcgis');
    if (btnRevertirArcGIS) {
      btnRevertirArcGIS.addEventListener('click', () => {
        revertirDatosArcGIS();
      });
    }
  }

  // ==========================================================================
  // FUNCIONES DE INTEROPERABILIDAD ARCGIS PRO (DESKTOP)
  // ==========================================================================

  function abrirModalArcGIS() {
    const modal = document.getElementById('modal-arcgis-hub');
    if (modal) {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function cerrarModalArcGIS() {
    const modal = document.getElementById('modal-arcgis-hub');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function exportarParaArcGIS(formato) {
    const municipios = state.corte.municipios;
    const fecha = state.corte.metadata_corte.fecha_corte;

    if (formato === 'geojson') {
      const featureCollection = {
        type: "FeatureCollection",
        name: `vigia_corte_${fecha.replace(/-/g, '')}_arcgis`,
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
        },
        metadata_export: {
          sistema: "Vigía El Niño · Acueductos (CRA)",
          fecha_corte: fecha,
          entidades: municipios.length,
          formato: "Esri-Ready GeoJSON WGS84"
        },
        features: municipios.map(m => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number(m.lon) || 0, Number(m.lat) || 0]
          },
          properties: {
            DIVIPOLA: String(m.divipola).padStart(5, '0'),
            MUNICIPIO: m.nombre,
            DEPARTAMENTO: m.departamento,
            COD_DEPTO: String(m.cod_depto).padStart(2, '0'),
            REGION: m.region || 'Sin definir',
            POBLACION: m.poblacion || 0,
            ICR: m.icr,
            NIVEL_ALERTA: m.nivel_alerta,
            SUB_AMENAZA: m.subindices_capa?.amenaza_A ?? null,
            SUB_VULNERABILIDAD: m.subindices_capa?.vulnerabilidad_H ?? null,
            SUB_SERVICIO: m.subindices_capa?.servicio_S ?? null,
            SUB_RESPUESTA: m.subindices_capa?.respuesta_R ?? null,
            S1_CONTINUIDAD_H: m.indicadores['S-1']?.valor ?? null,
            S2_IRCA_PTS: m.indicadores['S-2']?.valor ?? null,
            A3_DEFICIT_LLUVIA_PCT: m.indicadores['A-3']?.valor ?? null,
            A4_DIAS_SECOS: m.indicadores['A-4']?.valor ?? null,
            A5_FOCOS_CALOR_7D: m.indicadores['A-5']?.valor ?? null,
            H1_CAUDAL_PCT: m.indicadores['H-1']?.valor ?? null,
            H4_AUTONOMIA_H: m.indicadores['H-4']?.valor ?? null,
            R1_PLAN_EMERGENCIA: m.indicadores['R-1']?.valor ?? null,
            R2_ABASTECIMIENTO_ALTERNO: m.indicadores['R-2']?.valor ?? null,
            R3_RACIONAMIENTO: m.indicadores['R-3']?.valor ?? null,
            R4_CALAMIDAD: m.indicadores['R-4']?.valor ?? null,
            FECHA_CORTE: fecha
          }
        }))
      };

      const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json;charset=utf-8;' });
      descargarBlob(blob, `vigia_el_nino_corte_${fecha}_arcgis.geojson`);
    } else if (formato === 'csv') {
      const cabeceras = [
        "DIVIPOLA_TXT", "MUNICIPIO", "DEPARTAMENTO", "COD_DEPTO", "REGION",
        "X_LON", "Y_LAT", "POBLACION", "ICR", "NIVEL_ALERTA",
        "SUB_AMENAZA", "SUB_VULNERABILIDAD", "SUB_SERVICIO", "SUB_RESPUESTA",
        "S1_CONTINUIDAD_H", "S2_IRCA_PTS", "A3_DEFICIT_LLUVIA_PCT", "A4_DIAS_SECOS",
        "A5_FOCOS_CALOR_7D", "H1_CAUDAL_PCT", "R3_RACIONAMIENTO", "R4_CALAMIDAD", "FECHA_CORTE"
      ];

      const filas = municipios.map(m => [
        `"${String(m.divipola).padStart(5, '0')}"`,
        `"${m.nombre.replace(/"/g, '""')}"`,
        `"${m.departamento.replace(/"/g, '""')}"`,
        `"${String(m.cod_depto).padStart(2, '0')}"`,
        `"${m.region || ''}"`,
        m.lon ?? '',
        m.lat ?? '',
        m.poblacion ?? 0,
        m.icr ?? '',
        `"${m.nivel_alerta}"`,
        m.subindices_capa?.amenaza_A ?? '',
        m.subindices_capa?.vulnerabilidad_H ?? '',
        m.subindices_capa?.servicio_S ?? '',
        m.subindices_capa?.respuesta_R ?? '',
        m.indicadores['S-1']?.valor ?? '',
        m.indicadores['S-2']?.valor ?? '',
        m.indicadores['A-3']?.valor ?? '',
        m.indicadores['A-4']?.valor ?? '',
        m.indicadores['A-5']?.valor ?? '',
        m.indicadores['H-1']?.valor ?? '',
        m.indicadores['R-3']?.valor ?? 0,
        m.indicadores['R-4']?.valor ?? 0,
        `"${fecha}"`
      ]);

      const csvContent = "\uFEFF" + [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      descargarBlob(blob, `vigia_el_nino_corte_${fecha}_arcgis_xy.csv`);
    }
  }

  function descargarBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function procesarTextoGeoJSONArcGIS(texto, nombreArchivo) {
    try {
      const geojson = JSON.parse(texto);
      if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        alert("El archivo no corresponde a un FeatureCollection GeoJSON válido de ArcGIS.");
        return;
      }

      state.arcgis.tempParsedData = geojson;

      // Analizar geometrías
      const hasPolygons = geojson.features.some(f =>
        f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
      );
      const hasPoints = geojson.features.some(f =>
        f.geometry && f.geometry.type === 'Point'
      );

      // Analizar campos especiales
      const sampleProps = (geojson.features[0] && geojson.features[0].properties) || {};
      const enrichedFields = [];
      if ('CUENCA_APORTANTE' in sampleProps) enrichedFields.push('Cuenca');
      if ('DIST_EMBALSE_KM' in sampleProps) enrichedFields.push('Dist. Embalse');
      if ('AREA_AFECTADA_HA' in sampleProps) enrichedFields.push('Área Afectada');
      if ('FOCOS_EN_CUENCA' in sampleProps) enrichedFields.push('Focos');
      if ('ARCGIS_RIESGO' in sampleProps || 'ICR' in sampleProps) enrichedFields.push('ICR Recalculado');

      // Actualizar tarjeta de previsualización
      const panel = document.getElementById('arcgis-preview-panel');
      const elNombre = document.getElementById('arcgis-preview-filename');
      const elCount = document.getElementById('arcgis-preview-count');
      const elGeoDesc = document.getElementById('arcgis-preview-geo-desc');
      const elFields = document.getElementById('arcgis-preview-fields');
      const elGeoBadge = document.getElementById('arcgis-preview-geometry-type');

      if (elNombre) elNombre.textContent = nombreArchivo || 'archivo_arcgis.geojson';
      if (elCount) elCount.textContent = geojson.features.length;
      if (elGeoDesc) elGeoDesc.textContent = hasPolygons ? 'Polígonos Municipales Oficiales (DANE MGN)' : (hasPoints ? 'Puntos Georreferenciados' : 'Geometrías Mixtas');
      if (elFields) elFields.textContent = enrichedFields.length > 0 ? enrichedFields.join(', ') : 'Atributos estándar';
      if (elGeoBadge) {
        elGeoBadge.textContent = hasPolygons ? 'Polígonos (MultiPolygon)' : 'Puntos (Point)';
        elGeoBadge.style.backgroundColor = hasPolygons ? '#007AC2' : '#2E7D4F';
      }

      if (panel) panel.style.display = 'block';
    } catch (err) {
      alert("Error al procesar el archivo GeoJSON: " + err.message);
    }
  }

  function cargarArchivoArcGIS(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      procesarTextoGeoJSONArcGIS(e.target.result, file.name);
    };
    reader.readAsText(file);
  }

  function cargarMuestraArcGIS() {
    fetch('data_arcgis_ejemplo.geojson')
      .then(res => {
        if (!res.ok) throw new Error("No se pudo cargar el archivo de muestra.");
        return res.text();
      })
      .then(txt => {
        procesarTextoGeoJSONArcGIS(txt, "data_arcgis_ejemplo.geojson (Guajira / Caribe)");
      })
      .catch(err => {
        alert("Error cargando muestra: " + err.message);
      });
  }

  function aplicarDatosArcGIS() {
    if (!state.arcgis.tempParsedData) return;

    // Respaldar corte original una sola vez para reversibilidad
    if (!state.arcgis.corteOriginal) {
      state.arcgis.corteOriginal = JSON.parse(JSON.stringify(state.corte));
    }

    const geojson = state.arcgis.tempParsedData;
    let actualizados = 0;

    geojson.features.forEach(f => {
      const p = f.properties || {};
      const divipola = String(p.DIVIPOLA || p.MPIO_CCDGO || p.divipola || '').padStart(5, '0');
      if (!divipola) return;

      const muni = state.corte.municipios.find(m => m.divipola === divipola);
      if (muni) {
        if (p.ARCGIS_RIESGO !== undefined && p.ARCGIS_RIESGO !== null) {
          muni.icr = Number(Number(p.ARCGIS_RIESGO).toFixed(1));
        } else if (p.ICR !== undefined && p.ICR !== null) {
          muni.icr = Number(Number(p.ICR).toFixed(1));
        }

        if (p.NIVEL_ALERTA) {
          muni.nivel_alerta = p.NIVEL_ALERTA.toLowerCase();
        } else if (muni.icr >= 75) {
          muni.nivel_alerta = 'roja';
        } else if (muni.icr >= 60) {
          muni.nivel_alerta = 'naranja';
        } else if (muni.icr >= 40) {
          muni.nivel_alerta = 'amarilla';
        } else {
          muni.nivel_alerta = 'sin_alerta';
        }

        if (p.S1_CONTINUIDAD_H !== undefined && muni.indicadores['S-1']) {
          muni.indicadores['S-1'].valor = Number(p.S1_CONTINUIDAD_H);
        }
        if (p.A3_DEFICIT_LLUVIA_PCT !== undefined && muni.indicadores['A-3']) {
          muni.indicadores['A-3'].valor = Number(p.A3_DEFICIT_LLUVIA_PCT);
        }

        // Guardar atributos de ArcGIS para el popup
        muni.arcgis_data = p;
        actualizados++;
      }
    });

    state.arcgis.activo = true;
    state.arcgis.geojsonData = geojson;

    // Mostrar banner de estado
    const banner = document.getElementById('arcgis-status-banner');
    const statusText = document.getElementById('arcgis-status-text');
    if (banner) banner.style.display = 'flex';
    if (statusText) {
      statusText.innerHTML = `<strong>${actualizados} municipios</strong> enriquecidos con geometrías y análisis espacial de <strong>ArcGIS Pro</strong>.`;
    }

    // Cerrar modal
    cerrarModalArcGIS();

    // Re-renderizar mapa, tabla y resúmenes
    renderMapaColombia();
    renderTablaTerritorio();
    initResumenV01();

    console.log(`[ArcGIS Pro] Datos aplicados con éxito. ${actualizados} municipios sincronizados.`);
  }

  function cancelarPreviewArcGIS() {
    state.arcgis.tempParsedData = null;
    const panel = document.getElementById('arcgis-preview-panel');
    if (panel) panel.style.display = 'none';
    const input = document.getElementById('input-file-arcgis');
    if (input) input.value = '';
  }

  function revertirDatosArcGIS() {
    if (!state.arcgis.corteOriginal) return;

    // Restaurar corte original
    state.corte = JSON.parse(JSON.stringify(state.arcgis.corteOriginal));
    state.arcgis.activo = false;
    state.arcgis.geojsonData = null;
    state.arcgis.tempParsedData = null;

    // Remover capa de Leaflet si existe
    if (state.arcgis.layer && state.leafletMap) {
      state.leafletMap.removeLayer(state.arcgis.layer);
      state.arcgis.layer = null;
    }

    // Ocultar banner
    const banner = document.getElementById('arcgis-status-banner');
    if (banner) banner.style.display = 'none';

    // Re-renderizar componentes
    renderMapaColombia();
    renderTablaTerritorio();
    initResumenV01();

    console.log('[ArcGIS Pro] Datos restablecidos al corte oficial base.');
  }

  function exportarTablaCSV() {
    const cabeceras = ["DIVIPOLA", "Municipio", "Departamento", "Nivel_Alerta", "ICR", "Continuidad_h_dia", "Anomalia_Lluvia_pct", "IRCA_pct", "Racionamiento", "Poblacion"];
    const filas = state.corte.municipios.map(m => [
      m.divipola,
      `"${m.nombre}"`,
      `"${m.departamento}"`,
      m.nivel_alerta,
      m.icr !== null ? m.icr : '',
      m.indicadores['S-1']?.valor ?? '',
      m.indicadores['A-3']?.valor ?? '',
      m.indicadores['S-2']?.valor ?? '',
      m.indicadores['R-3']?.valor ?? 0,
      m.poblacion
    ]);

    const csvContent = "\uFEFF" + [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigia_nino_corte_${state.corte.metadata_corte.fecha_corte}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportarCorteJSON() {
    const blob = new Blob([JSON.stringify(state.corte, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigia_nino_corte_${state.corte.metadata_corte.fecha_corte}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
});
