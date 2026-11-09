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

/* -------------------------------------------------------------------------
   Configuración del ICR publicada por el pipeline (data/config/parametros_icr.json → data.js).
   Es la fuente única de capas, pesos, pertenencia al ICR y puntos de quiebre: el catálogo
   de arriba solo aporta nombres, fórmulas y fuentes. Corre antes que aula.js, que lo reutiliza.
   ------------------------------------------------------------------------- */
const CONFIG_ICR = (window.VIGIA_DATA && window.VIGIA_DATA.config_icr) || null;
// Bandas de la escala 0-100: el valor del indicador que corresponde a cada puntaje de quiebre
const PUNTOS_BANDA = { optimo: 0, amarilla: 40, naranja: 60, roja: 75, extremo: 100 };

function bandaDePuntaje(p) {
  if (p >= 100) return 'extremo';
  if (p >= 75) return 'roja';
  if (p >= 60) return 'naranja';
  if (p >= 40) return 'amarilla';
  return 'optimo';
}

(function alinearCatalogoConConfig() {
  if (!CONFIG_ICR || !CONFIG_ICR.capas) return;
  const capaDe = {};
  Object.entries(CONFIG_ICR.capas).forEach(([k, c]) => (c.indicadores || []).forEach(cod => { capaDe[cod] = k; }));
  const quiebres = CONFIG_ICR.quiebres || {};
  const binarios = CONFIG_ICR.puntaje_binario || {};
  const categorias = CONFIG_ICR.puntaje_categorico || {};
  const capitalizar = s => s.charAt(0).toUpperCase() + s.slice(1);

  CATALOGO_INDICADORES_MASTER.forEach(ind => {
    const cod = ind.codigo;
    ind.en_icr = Boolean(capaDe[cod]);
    if (capaDe[cod]) ind.capa = capaDe[cod];
    const vacio = { optimo: '—', amarilla: '—', naranja: '—', roja: '—', extremo: '—' };

    if (quiebres[cod]) {
      const u = { ...vacio };
      Object.entries(PUNTOS_BANDA).forEach(([banda, pts]) => {
        const par = quiebres[cod].find(([, p]) => p === pts);
        if (par) u[banda] = String(par[0]).replace('.', ',');
      });
      ind.umbrales = u;
      ind.umbrales_origen = 'config';
    } else if (binarios[cod]) {
      const u = { ...vacio };
      const b = binarios[cod];
      u[bandaDePuntaje(b.inactivo)] = '0';
      u[bandaDePuntaje(b.activo)] = '1';
      ind.umbrales = u;
      ind.umbrales_origen = 'config';
    } else if (ind.en_icr && Object.keys(categorias).length) {
      // Indicadores categóricos del ENA (H-2, H-3): primera categoría de cada banda
      const u = { ...vacio };
      Object.entries(categorias).forEach(([cat, p]) => {
        const banda = bandaDePuntaje(p);
        if (u[banda] === '—') u[banda] = capitalizar(cat);
      });
      ind.umbrales = u;
      ind.umbrales_origen = 'config';
    } else {
      // No pondera en el ICR: sus umbrales son de referencia y no generan puntaje
      ind.umbrales_origen = 'referencia';
    }
  });
})();

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

  // Pesos, nombres de capa y umbrales de nivel: de la config publicada (respaldo: v1.2.0-20261108)
  const PESOS_ICR = CONFIG_ICR
    ? Object.fromEntries(Object.entries(CONFIG_ICR.capas).map(([k, c]) => [k, c.peso]))
    : { A: 0.30, H: 0.30, S: 0.25, R: 0.15 };
  const NOMBRE_CAPA = CONFIG_ICR
    ? Object.fromEntries(Object.entries(CONFIG_ICR.capas).map(([k, c]) => [k, c.nombre]))
    : { A: 'Amenaza hidroclimática', H: 'Vulnerabilidad de la oferta', S: 'Desempeño del servicio', R: 'Respuesta e impacto' };
  const NIVELES_ICR = (CONFIG_ICR && CONFIG_ICR.niveles_alerta) ||
    [{ nivel: 'sin_alerta', icr_desde: 0 }, { nivel: 'amarilla', icr_desde: 40 }, { nivel: 'naranja', icr_desde: 60 }, { nivel: 'roja', icr_desde: 75 }];
  const pctPeso = k => `${Math.round((PESOS_ICR[k] || 0) * 100)} %`;
  const VARIABLE_MAPA_COD = { s1: 'S-1', a3: 'A-3', s2: 'S-2' };
  // RF-UI-03: rutas del enlace profundo (#/municipio/44847 y #/territorio/44 se resuelven aparte)
  const RUTA_DE_VISTA = { 'V-01': 'resumen', 'V-02': 'amenaza', 'V-03': 'territorio', 'V-05': 'indicadores', 'V-06': 'alertas', 'V-07': 'fuentes', 'AULA': 'aula' };
  const VISTA_DE_RUTA = Object.fromEntries(Object.entries(RUTA_DE_VISTA).map(([v, r]) => [r, v]));
  const HEX_NIVEL = { roja: '#B3261E', naranja: '#E07A10', amarilla: '#F2C200', sin_alerta: '#2E7D4F', sin_dato: '#B9C4CC' };
  const PESOS_ICR_TEXTO = Object.entries(PESOS_ICR).map(([k, v]) => `${String(v.toFixed(2)).replace('.', ',')} × ${k}`).join(' + ');
  const COLOR_NIVEL = { roja: 'var(--alerta-roja)', naranja: 'var(--alerta-naranja)', amarilla: 'var(--alerta-amarilla)', sin_alerta: 'var(--alerta-sin)', sin_dato: 'var(--alerta-sin-dato)' };
  const NOMBRE_NIVEL = { roja: 'Roja', naranja: 'Naranja', amarilla: 'Amarilla', sin_alerta: 'Sin alerta', sin_dato: 'Sin dato' };


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
    hashListo: false,
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

  // RF-UI-03: enlace profundo. Se aplica la ruta inicial y luego cada cambio (atrás/adelante o enlace pegado)
  aplicarRutaDesdeHash();
  state.hashListo = true;
  window.addEventListener('hashchange', aplicarRutaDesdeHash);

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

  /* -------------------------------------------------------------------------
     RF-UI-03 — Enlace profundo: #/municipio/44847, #/territorio/44, #/amenaza, …
     ------------------------------------------------------------------------- */

  function actualizarHash(ruta) {
    if (!state.hashListo) return;            // durante el arranque manda la URL recibida
    const nuevo = `#/${ruta}`;
    if (location.hash !== nuevo) history.pushState(null, '', nuevo);
  }

  function aplicarRutaDesdeHash() {
    const [seccion, id] = location.hash.replace(/^#\/?/, '').split('/');
    if (!seccion) return;
    const previo = state.hashListo;
    state.hashListo = false;                 // aplicar la ruta no debe reescribirla
    try {
      if (seccion === 'municipio' && id && state.corte.municipios.some(m => m.divipola === id)) {
        abrirFichaMunicipal(id);
      } else if (seccion === 'territorio') {
        cambiarVista('V-03');
        const sel = document.getElementById('select-filtro-depto');
        const existe = id && state.corte.departamentos.some(d => d.cod_depto === id);
        state.filtroDepto = existe ? id : 'TODOS';
        if (sel) sel.value = state.filtroDepto;
        renderTablaTerritorio();
        if (existe) setTimeout(() => hacerZoomDepartamento(id), 200);
      } else if (VISTA_DE_RUTA[seccion]) {
        cambiarVista(VISTA_DE_RUTA[seccion]);
      }
    } finally {
      state.hashListo = previo;
    }
  }

  function cambiarVista(idVista) {
    if (idVista === 'STORY') {
      mostrarModoStory();
      return;
    }

    if (idVista === 'V-04') actualizarHash(`municipio/${state.municipioSeleccionadoId}`);
    else if (idVista === 'V-03' && state.filtroDepto && state.filtroDepto !== 'TODOS') actualizarHash(`territorio/${state.filtroDepto}`);
    else if (RUTA_DE_VISTA[idVista]) actualizarHash(RUTA_DE_VISTA[idVista]);

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

    const R = resumenCorte();
    const munis = state.corte.municipios;

    if (paso === 1) {
      // ACTO I: LA AMENAZA MACRO (ENSO) — cifras de amenaza_global del corte
      const regiones = [
        { nombre: 'Niño 1+2', zona: 'Costa de Sudamérica', anom: R.sem.nino12_anomalia, sst: R.sem.nino12_sst },
        { nombre: 'Niño 3', zona: 'Pacífico oriental', anom: R.sem.nino3_anomalia, sst: R.sem.nino3_sst },
        { nombre: 'Niño 3.4', zona: 'Referencia oficial', anom: R.sem.nino34_anomalia, sst: R.sem.nino34_sst, ref: true },
        { nombre: 'Niño 4', zona: 'Pacífico occidental', anom: R.sem.nino4_anomalia, sst: R.sem.nino4_sst }
      ];
      const maxAnom = Math.max(1, ...regiones.map(r => Number(r.anom) || 0));
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto I · La amenaza</span>
              <h3 class="story-chapter-title">El Pacífico está ${escaparHtml(fmtSigno(R.nino34, 1))} °C más caliente</h3>
              <div class="story-narrative-text">
                <p>La región <strong>Niño 3.4</strong> marca ${escaparHtml(fmtSigno(R.nino34, 1))} °C sobre lo normal (semana ${escaparHtml(R.fechaSemana)}).
                El ONI del trimestre ${escaparHtml(R.oniTrimestre)} es ${escaparHtml(fmtSigno(R.oni, 2))} °C: evento <strong>${escaparHtml(R.intensidad)}</strong>.</p>
              </div>
              <div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Lectura para la CRA
                </div>
                El calor del océano tarda semanas en llegar a las fuentes de agua. Este es el tiempo para preparar a los prestadores.
              </div>
            </div>
            <div class="story-kpi-grid">
              ${kpiPill(fmtSigno(R.nino34, 1) + ' °C', 'Anomalía Niño 3.4')}
              ${kpiPill(fmtSigno(R.oni, 2) + ' °C', 'ONI ' + R.oniTrimestre)}
              ${kpiPill(R.probMuyFuerte == null ? 'Sin dato' : fmt(R.probMuyFuerte, 0) + ' %', 'Probabilidad evento muy fuerte')}
              ${kpiPill(R.a3.n ? fmtSigno(R.a3.mediana, 1) + ' %' : 'Sin dato', 'Lluvia 30 días (mediana)')}
            </div>
          </div>
          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Anomalía de temperatura por región del Pacífico</span>
              <span style="font-size:12px;color:var(--cra-cian-texto);font-weight:700">Fuente: ${escaparHtml(R.fuenteEnso)} · semana ${escaparHtml(R.fechaSemana)}</span>
            </div>
            <div class="story-visual-content">
              <div class="story-termometros" role="img" aria-label="${escaparHtml(regiones.map(r => r.nombre + ' ' + fmtSigno(r.anom, 1) + ' grados').join(', '))}">
                ${regiones.map(r => `
                  <div class="story-termo ${r.ref ? 'ref' : ''}">
                    <div class="story-termo-tubo"><div class="story-termo-relleno" style="height:${Math.max(4, Math.round((Number(r.anom) || 0) / maxAnom * 100))}%"></div></div>
                    <div class="story-termo-val">${escaparHtml(fmtSigno(r.anom, 1))} °C</div>
                    <div class="story-termo-nom">${escaparHtml(r.nombre)}</div>
                    <div class="story-termo-zona">${escaparHtml(r.zona)} · ${escaparHtml(fmt(r.sst, 1))} °C</div>
                  </div>`).join('')}
              </div>
              <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:16px;margin-top:16px">
                <h4 style="font-size:14px;font-weight:800;margin-bottom:10px;color:var(--texto-fuerte)">Pico del ONI frente a los grandes Niños</h4>
                ${barraHist('1997-98', 2.4, false)}
                ${barraHist('2015-16', 2.6, false)}
                ${barraHist('2026-27 (' + R.oniTrimestre + ')', R.oni, true)}
                <p style="font-size:11px;color:var(--texto-claro);margin-top:8px">Picos históricos del ONI publicados por NOAA CPC. El valor actual es el último trimestre del corte, no el pico final del evento.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 2) {
      // ACTO II: DÓNDE SE CONCENTRA EL RIESGO — municipios y departamentos del corte
      const criticos = R.criticos;
      const deptoTop = R.deptosCriticos[0];
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto II · Dónde</span>
              <h3 class="story-chapter-title">${escaparHtml(criticos.length)} de ${escaparHtml(R.total)} municipios en riesgo alto</h3>
              <div class="story-narrative-text">
                <p>${criticos.length
                  ? `Están en nivel naranja o rojo: ${criticos.map(m => `<strong>${escaparHtml(m.nombre)}</strong> (${escaparHtml(m.departamento)}, ICR ${escaparHtml(fmt(m.icr, 1))})`).join(', ')}.`
                  : 'Ningún municipio monitoreado está en nivel naranja o rojo.'}</p>
                ${deptoTop ? `<p><strong>${escaparHtml(deptoTop.departamento)}</strong> concentra la mayor población en riesgo alto: ${escaparHtml(fmt(deptoTop.poblacion_naranja_roja, 0))} habitantes.</p>` : ''}
              </div>
            </div>
            <div class="story-kpi-grid">
              ${kpiPill(fmt(R.niveles.roja || 0, 0), 'Municipios en rojo', 'var(--alerta-roja)')}
              ${kpiPill(fmt(R.niveles.naranja || 0, 0), 'Municipios en naranja', 'var(--alerta-naranja)')}
              ${kpiPill(fmt(R.niveles.amarilla || 0, 0), 'Municipios en amarillo', '#8A6D00')}
              ${kpiPill(fmt(R.niveles.sin_alerta || 0, 0), 'Sin alerta', 'var(--alerta-sin)')}
            </div>
          </div>
          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Municipios en nivel naranja y rojo</span>
              ${criticos[0] ? `<button class="btn-secundario" onclick="window.verEnMapaDesdeStory('${escaparHtml(criticos[0].divipola)}')" style="font-size:11px;padding:4px 10px">Ver en el mapa ➔</button>` : ''}
            </div>
            <div class="story-visual-content">
              ${barraNiveles(R.niveles, R.total)}
              <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-top:16px">
                ${criticos.map(m => `
                  <div class="story-muni-card ${escaparHtml(m.nivel_alerta)}">
                    <div style="min-width:0">
                      <strong style="font-size:15px;color:var(--texto-fuerte)">${escaparHtml(m.nombre)}</strong>
                      <span style="font-size:12px;color:var(--texto-claro)">(${escaparHtml(m.departamento)})</span>
                      <div style="font-size:12px;color:var(--texto);margin-top:3px">
                        Servicio: <strong>${escaparHtml(conUnidad(fmtInd(m, 'S-1', 1), 'h/día'))}</strong> · Lluvia 30 días: <strong>${escaparHtml(conUnidad(fmtInd(m, 'A-3', 1, true), '%'))}</strong> · <strong>${escaparHtml(fmt(m.poblacion, 0))}</strong> hab.
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                      <div style="text-align:right">
                        <div style="font-size:18px;font-weight:900;color:var(--texto-fuerte)">${escaparHtml(fmt(m.icr, 1))}</div>
                        <span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">${escaparHtml(nombreNivel(m.nivel_alerta))}</span>
                      </div>
                      <button class="btn-secundario" onclick="window.verEnMapaDesdeStory('${escaparHtml(m.divipola)}')" style="padding:4px 8px;font-size:11px">Localizar</button>
                    </div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 3) {
      // ACTO III: POR QUÉ — las 4 capas del ICR con pesos de la configuración vigente
      const alto = R.icrMax, bajo = R.icrMin;
      const capas = [
        { k: 'amenaza_A', capa: 'A', nombre: 'Amenaza' },
        { k: 'vulnerabilidad_H', capa: 'H', nombre: 'Vulnerabilidad de la oferta' },
        { k: 'servicio_S', capa: 'S', nombre: 'Desempeño del servicio' },
        { k: 'respuesta_R', capa: 'R', nombre: 'Respuesta e impacto' }
      ];
      let brecha = null;
      if (alto && bajo) {
        capas.forEach(c => {
          const a = alto.subindices_capa?.[c.k], b = bajo.subindices_capa?.[c.k];
          if (a == null || b == null) return;
          if (!brecha || Math.abs(a - b) > Math.abs(brecha.a - brecha.b)) brecha = { ...c, a, b };
        });
      }
      const tarjeta = (m, tono) => !m ? '' : `
        <div class="story-compara ${tono}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
            <strong style="font-size:15px;color:var(--texto-fuerte)">${escaparHtml(m.nombre)} <span style="font-weight:600;color:var(--texto-claro);font-size:12px">(${escaparHtml(m.departamento)})</span></strong>
            <span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">ICR ${escaparHtml(fmt(m.icr, 1))}</span>
          </div>
          ${capas.map(c => {
            const v = m.subindices_capa?.[c.k];
            return `<div style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>${escaparHtml(c.nombre)} (${c.capa})</span><span>${v == null ? 'Sin dato' : escaparHtml(fmt(v, 1)) + ' pts'}</span></div>
              <div class="story-barra"><div style="width:${v == null ? 0 : Math.min(100, v)}%;background:${colorPuntaje(v)}"></div></div>
            </div>`;
          }).join('')}
        </div>`;
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto III · Por qué</span>
              <h3 class="story-chapter-title">La sequía sola no explica el riesgo</h3>
              <div class="story-narrative-text">
                <p>El ICR suma cuatro capas. Con la misma amenaza, el riesgo cambia según la fuente, el servicio y la respuesta de cada municipio.</p>
                <p class="story-formula">ICR = ${PESOS_ICR_TEXTO}</p>
              </div>
              ${brecha ? `<div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  Qué separa a los dos extremos
                </div>
                La mayor diferencia entre ${escaparHtml(alto.nombre)} y ${escaparHtml(bajo.nombre)} está en la capa <strong>${escaparHtml(brecha.nombre)}</strong>: ${escaparHtml(fmt(brecha.a, 1))} frente a ${escaparHtml(fmt(brecha.b, 1))} puntos.
              </div>` : ''}
            </div>
            <div class="story-kpi-grid">
              ${capas.map(c => kpiPill(fmt(PESOS_ICR[c.capa] * 100, 0) + ' %', 'Peso ' + c.nombre.toLowerCase())).join('')}
            </div>
          </div>
          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Mayor y menor ICR del corte, capa por capa</span>
              <span style="font-size:12px;color:var(--texto-claro)">Configuración ${escaparHtml(R.versionConfig)}</span>
            </div>
            <div class="story-visual-content">
              <div class="story-compara-grid">${tarjeta(alto, 'alto')}${tarjeta(bajo, 'bajo')}</div>
              <p style="font-size:11px;color:var(--texto-claro);margin-top:10px">Puntaje de 0 (sin riesgo) a 100 (riesgo máximo) por capa.</p>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 4) {
      // ACTO IV: A QUIÉN AFECTA — población por nivel, racionamiento y calamidad verificados
      const pctCritica = R.pobTotal ? R.pobCritica / R.pobTotal * 100 : 0;
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto IV · A quién afecta</span>
              <h3 class="story-chapter-title">${escaparHtml(fmt(R.pobCritica, 0))} personas viven en municipios de riesgo alto</h3>
              <div class="story-narrative-text">
                <p>Es el ${escaparHtml(fmt(pctCritica, 1))} % de los ${escaparHtml(fmt(R.pobTotal, 0))} habitantes de los ${escaparHtml(R.total)} municipios monitoreados (proyección DANE).</p>
                <p>${R.racionamiento.length
                  ? `Racionamiento reportado con soporte: ${R.racionamiento.map(m => `<strong>${escaparHtml(m.nombre)}</strong>`).join(', ')}.`
                  : 'Ningún municipio tiene racionamiento reportado con soporte.'}
                ${R.calamidad.length ? ` Calamidad pública vigente: ${R.calamidad.map(m => `<strong>${escaparHtml(m.nombre)}</strong>`).join(', ')}.` : ''}</p>
              </div>
              <div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Cobertura del dato
                </div>
                Racionamiento: ${escaparHtml(R.r3ConDato)} de ${escaparHtml(R.total)} municipios con dato. Calamidad: ${escaparHtml(R.r4ConDato)} de ${escaparHtml(R.total)}. Sin dato no significa que no ocurra.
              </div>
            </div>
            <div class="story-kpi-grid">
              ${kpiPill(fmt(R.pobCritica, 0), 'Habitantes en naranja y rojo', 'var(--alerta-roja)')}
              ${kpiPill(fmt(pctCritica, 1) + ' %', 'De la población monitoreada')}
              ${kpiPill(fmt(R.racionamiento.length, 0), 'Con racionamiento reportado', 'var(--alerta-naranja)')}
              ${kpiPill(fmt(R.calamidad.length, 0), 'Con calamidad pública')}
            </div>
          </div>
          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Habitantes por nivel de riesgo</span>
              <span style="font-size:12px;color:var(--texto-claro)">${escaparHtml(R.fuentePoblacion)}</span>
            </div>
            <div class="story-visual-content">
              ${['roja', 'naranja', 'amarilla', 'sin_alerta', 'sin_dato'].filter(n => R.pobPorNivel[n] > 0).map(n => `
                <div style="margin-bottom:10px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:var(--texto-fuerte)">
                    <span><span class="chip-alerta ${n}">${escaparHtml(nombreNivel(n))}</span></span>
                    <span>${escaparHtml(fmt(R.pobPorNivel[n], 0))} hab. (${escaparHtml(fmt(R.pobTotal ? R.pobPorNivel[n] / R.pobTotal * 100 : 0, 1))} %)</span>
                  </div>
                  <div class="story-barra grande"><div style="width:${R.pobTotal ? R.pobPorNivel[n] / R.pobTotal * 100 : 0}%;background:${COLOR_NIVEL[n]}"></div></div>
                </div>`).join('')}
              <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;margin-top:12px">
                <h4 style="font-size:13px;font-weight:800;color:var(--texto-fuerte);margin-bottom:8px">Horas de servicio en los municipios de riesgo alto</h4>
                ${R.criticos.map(m => {
                  const h = m.indicadores?.['S-1']?.valor;
                  return `<div style="display:grid;grid-template-columns:minmax(110px,1fr) 3fr auto;gap:10px;align-items:center;font-size:12px;margin-bottom:6px">
                    <strong>${escaparHtml(m.nombre)}</strong>
                    <div class="story-barra"><div style="width:${h == null ? 0 : h / 24 * 100}%;background:var(--cra-cian)"></div></div>
                    <span>${h == null ? 'Sin dato' : escaparHtml(fmt(h, 1)) + ' de 24 h'}</span>
                  </div>`;
                }).join('') || '<p style="font-size:12px">Sin municipios en riesgo alto.</p>'}
                <p style="font-size:11px;color:var(--texto-claro);margin-top:6px">Continuidad SSPD SUI, periodo ${escaparHtml(R.fechaS1)}.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (paso === 5) {
      // ACTO V: QUÉ HACER — opciones para evaluar, priorizadas con el corte (no son decisiones adoptadas)
      const deptos = [...new Set(R.criticos.map(m => m.departamento))];
      const primero = R.criticos[0];
      const opciones = [
        { titulo: 'Seguimiento a los municipios en riesgo alto', borde: 'var(--alerta-roja)',
          texto: `${R.criticos.length} municipios en naranja y rojo${deptos.length ? ' (' + deptos.join(', ') + ')' : ''}: revisar con la SSPD y los prestadores sus planes de emergencia y contingencia.` },
        { titulo: 'Abastecimiento alterno', borde: 'var(--alerta-naranja)',
          texto: `${R.racionamiento.length} municipios reportan racionamiento con soporte. Evaluar el tratamiento de costos de fuentes alternas (carrotanques, pozos).` },
        { titulo: 'Desincentivo al consumo excesivo', borde: 'var(--cra-cian)',
          texto: 'Evaluar la aplicación de las medidas regulatorias de consumo excesivo en los municipios con riesgo alto.' },
        { titulo: 'Calidad del agua durante el racionamiento', borde: 'var(--bandera-azul)',
          texto: `El IRCA disponible es de ${R.anioIrca}. Coordinar con las autoridades de salud la vigilancia donde hay racionamiento.` }
      ];
      container.innerHTML = `
        <div class="story-chapter-body">
          <div class="story-narrative-panel">
            <div>
              <span class="chapter-number-pill">Acto V · Qué hacer</span>
              <h3 class="story-chapter-title">Cuatro frentes para priorizar</h3>
              <div class="story-narrative-text">
                <p>El corte del ${escaparHtml(R.fechaCorte)} ordena dónde actuar primero. Las opciones son para evaluar; no son decisiones adoptadas por la Comisión.</p>
              </div>
              <div class="story-insight-box">
                <div class="story-insight-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Alcance
                </div>
                Vigía es un análisis técnico de la CRA. No reemplaza las alertas del IDEAM ni las declaratorias de la UNGRD.
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
              <button class="btn-iniciar-story" onclick="window.print()" style="width:100%;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimir informe de situación
              </button>
            </div>
          </div>
          <div class="story-visual-panel">
            <div class="story-visual-header">
              <span class="story-visual-title">Opciones de respuesta para evaluar</span>
              <span style="font-size:12px;color:var(--texto-claro);font-weight:700">Priorizadas con el corte ${escaparHtml(R.fechaCorte)}</span>
            </div>
            <div class="story-visual-content">
              <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px">
                ${opciones.map((o, i) => `
                  <div style="background:#FFFFFF;border:1px solid var(--linea);border-radius:var(--radio-md);padding:14px;border-left:4px solid ${o.borde}">
                    <strong style="color:var(--texto-fuerte);font-size:14px">${i + 1}. ${escaparHtml(o.titulo)}</strong>
                    <p style="font-size:12px;color:var(--texto);margin-top:4px">${escaparHtml(o.texto)}</p>
                  </div>`).join('')}
              </div>
              ${primero ? `<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
                <button class="btn-secundario" onclick="window.verEnMapaDesdeStory('${escaparHtml(primero.divipola)}')">Explorar el mapa</button>
                <button class="btn-secundario" onclick="window.abrirFichaDesdeMapa('${escaparHtml(primero.divipola)}')">Abrir ficha de ${escaparHtml(primero.nombre)}</button>
              </div>` : ''}
            </div>
          </div>
        </div>
      `;
    }
  }

  /* =========================================================================
     RESUMEN DEL CORTE: única fuente de las cifras narrativas
     (Recorrido Ejecutivo, cadena causal y textos de V-01)
     ========================================================================= */
  function nombreNivel(n) { return NOMBRE_NIVEL[n] || n; }

  /** Número en formato es-CO (coma decimal, punto de miles). */
  function fmt(v, dec = 1) {
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) return 'Sin dato';
    return Number(v).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtSigno(v, dec = 1) {
    if (v === null || v === undefined || isNaN(Number(v))) return 'Sin dato';
    return (Number(v) > 0 ? '+' : '') + fmt(v, dec);
  }
  function fmtInd(m, cod, dec = 1, signo = false) {
    const v = m.indicadores?.[cod]?.valor;
    if (v === null || v === undefined) return 'Sin dato';
    return signo ? fmtSigno(v, dec) : fmt(v, dec);
  }
  function conUnidad(txt, unidad) { return txt === 'Sin dato' ? txt : `${txt} ${unidad}`; }
  function colorPuntaje(v) {
    if (v == null) return 'var(--alerta-sin-dato)';
    if (v >= 75) return 'var(--alerta-roja)';
    if (v >= 60) return 'var(--alerta-naranja)';
    if (v >= 40) return 'var(--alerta-amarilla)';
    return 'var(--alerta-sin)';
  }
  function kpiPill(val, lbl, color) {
    return `<div class="story-kpi-pill"><div class="val"${color ? ` style="color:${color}"` : ''}>${escaparHtml(val)}</div><div class="lbl">${escaparHtml(lbl)}</div></div>`;
  }
  function barraHist(etiqueta, oni, actual) {
    const pct = Math.min(100, (Number(oni) || 0) / 3 * 100);
    return `<div style="display:grid;grid-template-columns:minmax(120px,1fr) 3fr auto;gap:10px;align-items:center;font-size:12px;margin-bottom:6px">
      <strong style="color:${actual ? 'var(--cra-cian-texto)' : 'var(--texto-fuerte)'}">${escaparHtml(etiqueta)}</strong>
      <div class="story-barra"><div style="width:${pct}%;background:${actual ? 'var(--cra-cian)' : 'var(--texto-claro)'}"></div></div>
      <span>${escaparHtml(fmtSigno(oni, 2))} °C</span>
    </div>`;
  }
  function barraNiveles(niveles, total) {
    const orden = ['roja', 'naranja', 'amarilla', 'sin_alerta', 'sin_dato'].filter(n => niveles[n] > 0);
    return `<div class="story-niveles-barra" role="img" aria-label="${escaparHtml(orden.map(n => niveles[n] + ' ' + nombreNivel(n)).join(', '))}">
      ${orden.map(n => `<div class="seg ${n}" style="flex:${niveles[n]}" title="${escaparHtml(nombreNivel(n))}: ${niveles[n]}"><span>${niveles[n]}</span></div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--texto-claro);margin-top:4px"><span>Más riesgo</span><span>${escaparHtml(total)} municipios</span><span>Menos riesgo</span></div>`;
  }

  function resumenCorte() {
    const c = state.corte;
    const meta = c.metadata_corte || {};
    const am = c.amenaza_global || {};
    const sem = am.indices_semanales || {};
    const oni = am.indice_oni_trimestral || {};
    const M = c.municipios || [];
    const conValor = cod => M.filter(m => typeof m.indicadores?.[cod]?.valor === 'number');
    const mediana = arr => {
      if (!arr.length) return null;
      const s = [...arr].sort((a, b) => a - b), k = Math.floor(s.length / 2);
      return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
    };
    const a3 = conValor('A-3');
    const a3Peor = a3.slice().sort((x, y) => x.indicadores['A-3'].valor - y.indicadores['A-3'].valor)[0];
    const s4 = conValor('S-4');
    const h4 = conValor('H-4');
    const criticos = M.filter(m => m.nivel_alerta === 'roja' || m.nivel_alerta === 'naranja').sort((a, b) => (b.icr || 0) - (a.icr || 0));
    const conIcr = M.filter(m => typeof m.icr === 'number').sort((a, b) => b.icr - a.icr);
    const pobPorNivel = {};
    M.forEach(m => { pobPorNivel[m.nivel_alerta] = (pobPorNivel[m.nivel_alerta] || 0) + (m.poblacion || 0); });
    const fechas = cod => [...new Set(M.map(m => m.indicadores?.[cod]?.fecha_dato).filter(Boolean))].sort();
    const fuentesPob = [...new Set(M.map(m => m.fuente_poblacion).filter(Boolean))];
    const irca = fechas('S-2');
    return {
      fechaCorte: meta.fecha_corte,
      versionConfig: meta.version_configuracion || '—',
      total: M.length,
      niveles: meta.conteo_niveles_nacional || {},
      sem,
      nino34: sem.nino34_anomalia,
      nino12: sem.nino12_anomalia,
      fechaSemana: sem.fecha_semana || '—',
      oni: oni.oni_anomalia,
      oniTrimestre: [oni.trimestre, oni.ano].filter(Boolean).join(' ') || '—',
      intensidad: oni.intensidad_evento || 'sin clasificar',
      probMuyFuerte: am.indicador_a2_probabilidad_muy_fuerte_pct ?? null,
      fuenteEnso: am.fuente || 'NOAA CPC',
      a3: {
        n: a3.length,
        mediana: mediana(a3.map(m => m.indicadores['A-3'].valor)),
        peor: a3Peor ? { nombre: a3Peor.nombre, valor: a3Peor.indicadores['A-3'].valor } : null,
        fecha: fechas('A-3').pop() || '—',
        desactualizado: a3.some(m => m.indicadores['A-3'].frescura === 'desactualizado')
      },
      s4: { n: s4.length, mediana: mediana(s4.map(m => m.indicadores['S-4'].valor)) },
      h4: { n: h4.length, mediana: mediana(h4.map(m => m.indicadores['H-4'].valor)) },
      criticos,
      icrMax: conIcr[0] || null,
      icrMin: conIcr[conIcr.length - 1] || null,
      pobCritica: meta.poblacion_en_riesgo_critico ?? criticos.reduce((s, m) => s + (m.poblacion || 0), 0),
      pobTotal: M.reduce((s, m) => s + (m.poblacion || 0), 0),
      pobPorNivel,
      fuentePoblacion: fuentesPob.length === 1 ? fuentesPob[0] : 'DANE',
      racionamiento: M.filter(m => m.indicadores?.['R-3']?.valor === 1),
      calamidad: M.filter(m => m.indicadores?.['R-4']?.valor === 1),
      r3ConDato: conValor('R-3').length,
      r4ConDato: conValor('R-4').length,
      s1Criticos: criticos.map(m => m.indicadores?.['S-1']?.valor).filter(v => typeof v === 'number'),
      fechaS1: fechas('S-1').pop() || '—',
      anioIrca: irca.length ? irca[irca.length - 1].slice(0, 4) : 'sin fecha',
      deptosCriticos: (c.departamentos || []).filter(d => d.poblacion_naranja_roja > 0).sort((a, b) => b.poblacion_naranja_roja - a.poblacion_naranja_roja)
    };
  }

  /* =========================================================================
     3. CADENA CAUSAL DEL RIESGO EN V-01 (RESUMEN) — derivada del corte
     ========================================================================= */
  function initCadenaCausal() {
    const grid = document.getElementById('grid-cadena-causal');
    const drawer = document.getElementById('cadena-detalle-drawer');
    if (!grid || !drawer) return;

    const R = resumenCorte();
    const s1 = R.s1Criticos;
    const eslabones = [
      {
        num: 'Eslabón 1', titulo: 'El océano se calienta',
        valor: fmtSigno(R.nino34, 1) + ' °C', desc: 'Anomalía Niño 3.4',
        detalle: `Semana ${R.fechaSemana}. ONI ${R.oniTrimestre}: ${fmtSigno(R.oni, 2)} °C (${R.intensidad}). Probabilidad de evento muy fuerte: ${R.probMuyFuerte == null ? 'sin dato' : fmt(R.probMuyFuerte, 0) + ' %'}.`,
        indicador: 'A-1 y A-2 · ' + R.fuenteEnso, impacto: 'Amenaza de origen oceánico'
      },
      {
        num: 'Eslabón 2', titulo: 'Llueve menos',
        valor: R.a3.n ? fmtSigno(R.a3.mediana, 1) + ' %' : 'Sin dato', desc: 'Lluvia 30 días (mediana)',
        detalle: R.a3.n
          ? `Mediana de ${R.a3.n} de ${R.total} municipios con dato. El mayor déficit está en ${R.a3.peor.nombre} (${fmtSigno(R.a3.peor.valor, 1)} %). Dato al ${R.a3.fecha}${R.a3.desactualizado ? ', marcado como desactualizado' : ''}.`
          : 'Ningún municipio tiene dato de lluvia en este corte.',
        indicador: 'A-3 · IDEAM', impacto: 'Menos agua en las fuentes'
      },
      {
        num: 'Eslabón 3', titulo: 'La red pierde agua',
        valor: R.s4.n ? fmt(R.s4.mediana, 0) + ' %' : 'Sin dato', desc: 'Agua no contabilizada (mediana)',
        detalle: `Mediana del IANC en ${R.s4.n} municipios. La autonomía de almacenamiento mediana es de ${R.h4.n ? fmt(R.h4.mediana, 0) + ' horas' : 'sin dato'}: poco margen si la fuente baja.`,
        indicador: 'S-4 y H-4 · SSPD SUI', impacto: 'Menos margen ante la sequía'
      },
      {
        num: 'Eslabón 4', titulo: 'El servicio se recorta',
        valor: s1.length ? `${fmt(Math.min(...s1), 1)}–${fmt(Math.max(...s1), 1)} h` : 'Sin dato', desc: 'Horas al día en riesgo alto',
        detalle: `Continuidad en los ${R.criticos.length} municipios en naranja y rojo (periodo ${R.fechaS1}). Racionamiento con soporte en ${R.racionamiento.length}: ${R.racionamiento.map(m => m.nombre).join(', ') || 'ninguno'}.`,
        indicador: 'S-1 y R-3', impacto: 'Hogares con menos horas de agua'
      },
      {
        num: 'Eslabón 5', titulo: 'Personas expuestas',
        valor: fmt(R.pobCritica, 0), desc: 'Habitantes en naranja y rojo',
        detalle: `Equivale al ${fmt(R.pobTotal ? R.pobCritica / R.pobTotal * 100 : 0, 1)} % de los ${fmt(R.pobTotal, 0)} habitantes de los ${R.total} municipios monitoreados.`,
        indicador: 'Población DANE del corte', impacto: 'Prioridad de seguimiento'
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
    document.getElementById('kpi-poblacion-riesgo').textContent = fmt(meta.poblacion_en_riesgo_critico, 0);
    const bannerDesc = document.getElementById('story-banner-desc');
    if (bannerDesc) bannerDesc.textContent = `Cinco actos, del océano al grifo: ${fmt(meta.poblacion_en_riesgo_critico, 0)} habitantes viven hoy en municipios de riesgo alto.`;

    // Actualizar Tarjeta NOAA Global
    if (amenaza && amenaza.indices_semanales) {
      const sem = amenaza.indices_semanales;
      document.getElementById('noaa-nino12-anom').textContent = `${fmtSigno(sem.nino12_anomalia, 1)} °C`;
      document.getElementById('noaa-nino12-sst').textContent = `${fmt(sem.nino12_sst, 1)} °C`;

      document.getElementById('noaa-nino3-anom').textContent = `${fmtSigno(sem.nino3_anomalia, 1)} °C`;
      document.getElementById('noaa-nino3-sst').textContent = `${fmt(sem.nino3_sst, 1)} °C`;

      document.getElementById('noaa-nino34-anom').textContent = `${fmtSigno(sem.nino34_anomalia, 1)} °C`;
      document.getElementById('noaa-nino34-sst').textContent = `${fmt(sem.nino34_sst, 1)} °C`;

      document.getElementById('noaa-nino4-anom').textContent = `${fmtSigno(sem.nino4_anomalia, 1)} °C`;
      document.getElementById('noaa-nino4-sst').textContent = `${fmt(sem.nino4_sst, 1)} °C`;

      if (amenaza.indice_oni_trimestral) {
        document.getElementById('noaa-oni-resumen').innerHTML = `
          Trimestre ${escaparHtml(amenaza.indice_oni_trimestral.trimestre)} ${escaparHtml(amenaza.indice_oni_trimestral.ano)}: 
          <strong>${escaparHtml(fmtSigno(amenaza.indice_oni_trimestral.oni_anomalia, 2))} °C</strong> (${escaparHtml(amenaza.indice_oni_trimestral.intensidad_evento)})
        `;
      }

      const descBanner = document.getElementById('noaa-resumen-desc');
      if (descBanner) {
        const prob = amenaza.indicador_a2_probabilidad_muy_fuerte_pct != null ? fmt(amenaza.indicador_a2_probabilidad_muy_fuerte_pct, 0) : 'sin dato';
        descBanner.innerHTML = `Anomalía en la región <strong>Niño 3.4 a ${escaparHtml(fmtSigno(sem.nino34_anomalia, 1))} °C</strong> (Niño 1+2: ${escaparHtml(fmtSigno(sem.nino12_anomalia, 1))} °C). Probabilidad de evento muy fuerte: <strong>${escaparHtml(prob)} %</strong>.`;
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
      const contHoras = fmtInd(m, 'S-1', 1) === 'Sin dato' ? '<span class="sin-dato-txt">Sin dato</span>' : `${escaparHtml(fmtInd(m, 'S-1', 1))} h/día`;
      const r3 = m.indicadores['R-3']?.valor;
      const racionamiento = r3 === 1 ? '<span style="color:var(--alerta-roja);font-weight:800">Sí, con soporte</span>'
        : r3 === 0 ? '<span style="color:var(--texto)">No (verificado)</span>'
        : '<span class="sin-dato-txt">Sin dato</span>';

      return `
        <tr data-abrir-municipio="${escaparHtml(m.divipola)}">
          <td>
            <strong>${escaparHtml(m.nombre)}</strong> <span style="color:var(--texto-claro)">(${escaparHtml(m.departamento)})</span>
          </td>
          <td><span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">${escaparHtml(nombreNivel(m.nivel_alerta))}</span></td>
          <td><strong style="font-size:15px;color:var(--texto-fuerte)">${escaparHtml(fmt(m.icr, 1))}</strong></td>
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
          if (r.anom === null || r.anom === undefined) {
            return `<div style="margin-bottom:14px;font-size:13px;font-weight:700">${r.nombre}: <span class="sin-dato-txt">Sin dato</span></div>`;
          }
          const pctWidth = Math.max(0, Math.min((r.anom / 6.0) * 100, 100));
          return `
            <div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:4px">
                <span>${r.nombre}</span>
                <span style="color:${r.anom >= 0.5 ? 'var(--alerta-naranja)' : 'var(--texto)'}">${fmtSigno(r.anom, 1)} °C <span style="color:var(--texto-claro);font-weight:400">(${fmt(r.sst, 1)} °C)</span></span>
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

    // Diagnóstico por región: solo con municipios que tienen dato (RF-UI-05: sin dato nunca es 0)
    const cont = document.getElementById('v02-diagnostico-regional');
    if (cont && state.corte.municipios) {
      const munis = state.corte.municipios;
      const valores = (lista, cod) => lista.map(m => m.indicadores?.[cod]?.valor).filter(v => typeof v === 'number');
      const mediana = arr => {
        const s = [...arr].sort((a, b) => a - b);
        return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
      };
      const dato = (arr, n, texto) => arr.length
        ? `${texto(arr)} <span class="dato-cobertura">(${arr.length} de ${n} con dato)</span>`
        : '<span class="sin-dato-txt">Sin dato</span>';

      const regiones = [...new Set(munis.map(m => m.region).filter(Boolean))];
      const tarjetas = regiones.map(reg => {
        const lista = munis.filter(m => m.region === reg);
        const n = lista.length;
        const a3 = valores(lista, 'A-3'), a4 = valores(lista, 'A-4'), a5 = valores(lista, 'A-5');
        return `
          <div class="v02-region">
            <h4>${escaparHtml(reg)} <span>${n} ${n === 1 ? 'municipio' : 'municipios'}</span></h4>
            <dl>
              <dt>Lluvia de 30 días frente a lo normal (A-3, mediana)</dt>
              <dd>${dato(a3, n, arr => `<strong>${fmtSigno(mediana(arr), 1)} %</strong>`)}</dd>
              <dt>Días seguidos sin lluvia (A-4, mediana)</dt>
              <dd>${dato(a4, n, arr => `<strong>${fmt(mediana(arr), 0)} días</strong>`)}</dd>
              <dt>Focos de calor en 7 días (A-5, suma)</dt>
              <dd>${dato(a5, n, arr => `<strong>${fmt(arr.reduce((s, v) => s + v, 0), 0)}</strong>`)}</dd>
            </dl>
          </div>`;
      }).join('');

      const prob = amenaza.indicador_a2_probabilidad_muy_fuerte_pct;
      const probTxt = typeof prob === 'number'
        ? `<strong>${fmt(prob, 0)} %</strong> de probabilidad de que El Niño alcance intensidad muy fuerte o superior en los próximos tres trimestres`
        : '<span class="sin-dato-txt">Sin dato</span> de probabilidad de intensidad muy fuerte';
      const boletin = amenaza.fecha_boletin_enso ? ` Boletín ENSO del ${escaparHtml(amenaza.fecha_boletin_enso)}.` : '';

      cont.innerHTML = `${tarjetas}
        <div class="v02-region">
          <h4>Pronóstico NOAA CPC / IRI <span>A-2 · contexto, no pondera en el ICR</span></h4>
          <p>${probTxt}.${boletin}</p>
        </div>`;
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
        actualizarHash(state.filtroDepto !== 'TODOS' ? `territorio/${state.filtroDepto}` : 'territorio');
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
    select.innerHTML = `<option value="TODOS">Todos los departamentos (${deptos.length})</option>` +
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
    }
    // S-1, A-3 y S-2: color por el puntaje 0-100 del indicador, con los mismos quiebres del ICR (config)
    const cod = VARIABLE_MAPA_COD[variable];
    const p = cod ? muni.indicadores?.[cod]?.puntaje : null;
    if (typeof p !== 'number') return '#B9C4CC';
    return HEX_NIVEL[nivelDePuntaje(p)];
  }

  // Nivel de un puntaje 0-100 según los umbrales de nivel de la config
  function nivelDePuntaje(p) {
    if (typeof p !== 'number') return 'sin_dato';
    let nivel = 'sin_alerta';
    NIVELES_ICR.forEach(n => { if (p >= n.icr_desde) nivel = n.nivel; });
    return nivel;
  }

  // Leyenda del mapa según la variable activa, con cortes de la config y conteo de municipios (RF-UI-02)
  function renderLeyendaMapa(municipios) {
    const cont = document.getElementById('mapa-leyenda-dinamica');
    if (!cont) return;
    const variable = state.variableMapa;
    const cod = VARIABLE_MAPA_COD[variable];
    const conteo = { roja: 0, naranja: 0, amarilla: 0, sin_alerta: 0, sin_dato: 0 };
    municipios.forEach(m => {
      const nivel = cod ? nivelDePuntaje(m.indicadores?.[cod]?.puntaje) : (m.nivel_alerta || 'sin_dato');
      conteo[nivel in conteo ? nivel : 'sin_dato']++;
    });

    const orden = [...NIVELES_ICR].sort((a, b) => b.icr_desde - a.icr_desde);
    const cat = cod ? getInfoIndicador(cod) : null;
    const banda = { roja: 'roja', naranja: 'naranja', amarilla: 'amarilla', sin_alerta: 'optimo' };
    const rango = (n, i) => {
      if (!cat) {
        const hasta = i > 0 ? orden[i - 1].icr_desde : null;
        return hasta === null ? `ICR ≥ ${n.icr_desde}` : (n.icr_desde === 0 ? `ICR < ${hasta}` : `${n.icr_desde}–${hasta - 1}`);
      }
      const v = cat.umbrales?.[banda[n.nivel]];
      if (n.nivel === 'sin_alerta') return `antes de ${cat.umbrales?.amarilla ?? '—'} ${cat.unidad}`;
      return `desde ${v ?? '—'} ${cat.unidad}`;
    };
    const titulo = cod ? `${cod} · ${cat?.nombre || ''}` : 'Nivel por ICR';
    cont.innerHTML = `<span class="leyenda-titulo-mapa">${escaparHtml(titulo)}</span>` +
      orden.map((n, i) => `
        <div class="leyenda-item">
          <span class="leyenda-box" style="background-color:${HEX_NIVEL[n.nivel]}"></span>
          <span>${escaparHtml(nombreNivel(n.nivel))} (${escaparHtml(rango(n, i))}) <strong>(${conteo[n.nivel]})</strong></span>
        </div>`).join('') + `
        <div class="leyenda-item">
          <span class="leyenda-box" style="background-color:${HEX_NIVEL.sin_dato}"></span>
          <span>Sin dato <strong>(${conteo.sin_dato})</strong></span>
        </div>`;
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

      const s1Val = escaparHtml(conUnidad(fmtInd(m, 'S-1', 1), 'h/día'));
      const a3Val = escaparHtml(conUnidad(fmtInd(m, 'A-3', 1, true), '%'));
      const s2Val = escaparHtml(conUnidad(fmtInd(m, 'S-2', 1), '%'));
      const nivelLabel = escaparHtml(nombreNivel(m.nivel_alerta));

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
            <span class="val" style="color:${HEX_NIVEL[m.nivel_alerta] || HEX_NIVEL.sin_dato}">${typeof m.icr === 'number' ? escaparHtml(fmt(m.icr, 1)) + ' pts' : 'Sin dato'}</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Población del municipio:</span>
            <span class="val">${typeof m.poblacion === 'number' ? escaparHtml(fmt(m.poblacion, 0)) + ' hab.' : 'Sin dato'}</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Continuidad de Agua (S-1):</span>
            <span class="val">${s1Val}</span>
          </div>
          <div class="cra-map-metric-row">
            <span>Lluvia 30 días vs. normal (A-3):</span>
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

    renderLeyendaMapa(municipios);
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

    // Celda de indicador con fuente, fecha y frescura al pasar el cursor (RF-UI-05)
    const celdaInd = (m, cod, unidad, dec = 1, signo = false) => {
      const i = m.indicadores?.[cod];
      if (!i || typeof i.valor !== 'number') return '<td><span class="sin-dato-txt">Sin dato</span></td>';
      const txt = signo ? fmtSigno(i.valor, dec) : fmt(i.valor, dec);
      const tip = `${cod} · ${i.fuente || 'sin fuente'} · ${i.fecha_dato || 'sin fecha'} · ${i.frescura || 'sin evaluar'}`;
      return `<td title="${escaparHtml(tip)}">${escaparHtml(txt)} ${unidad}</td>`;
    };
    const celdaR3 = m => {
      const v = m.indicadores?.['R-3']?.valor;
      if (v === 1) return '<td><strong>Sí</strong></td>';
      if (v === 0) return '<td>No</td>';
      return '<td><span class="sin-dato-txt">Sin dato</span></td>';
    };

    tbody.innerHTML = filtrados.map(m => `
      <tr data-abrir-municipio="${escaparHtml(m.divipola)}" class="${m.divipola === state.municipioSeleccionadoId ? 'selected' : ''}">
        <td><span style="font-family:monospace;font-weight:700;color:var(--cra-cian-texto)">${escaparHtml(m.divipola)}</span></td>
        <td><button type="button" class="link-muni" data-abrir-municipio="${escaparHtml(m.divipola)}" title="Abrir la ficha municipal">${escaparHtml(m.nombre)}</button></td>
        <td>${escaparHtml(m.departamento)}</td>
        <td><span class="chip-alerta ${escaparHtml(m.nivel_alerta)}">${escaparHtml(nombreNivel(m.nivel_alerta))}</span></td>
        <td><strong style="font-size:14px;color:var(--texto-fuerte)">${typeof m.icr === 'number' ? fmt(m.icr, 1) : '<span class="sin-dato-txt">Sin dato</span>'}</strong></td>
        ${celdaInd(m, 'S-1', 'h')}
        ${celdaInd(m, 'A-3', '%', 1, true)}
        ${celdaInd(m, 'S-2', '%')}
        ${celdaR3(m)}
        <td style="font-variant-numeric:tabular-nums">${typeof m.poblacion === 'number' ? fmt(m.poblacion, 0) : '<span class="sin-dato-txt">Sin dato</span>'}</td>
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
    badgeNivel.textContent = `Nivel: ${nombreNivel(muni.nivel_alerta)}`;
    if (muni.nivel_por_regla) {
      badgeNivel.textContent += ' (piso por impacto confirmado)';
    }

    const icrValEl = document.getElementById('ficha-icr-val');
    icrValEl.textContent = typeof muni.icr === 'number' ? fmt(muni.icr, 1) : 'Sin dato';
    icrValEl.style.color = COLOR_NIVEL[muni.nivel_alerta] || COLOR_NIVEL.sin_dato;

    // Subíndices de las 4 Capas (nombre y peso de la config)
    const capas = muni.subindices_capa || {};
    renderCapaBox('capa-a', `${NOMBRE_CAPA.A} (A) · ${pctPeso('A')}`, capas.amenaza_A, 'var(--cra-cian)');
    renderCapaBox('capa-h', `${NOMBRE_CAPA.H} (H) · ${pctPeso('H')}`, capas.vulnerabilidad_H, '#17729A');
    renderCapaBox('capa-s', `${NOMBRE_CAPA.S} (S) · ${pctPeso('S')}`, capas.servicio_S, 'var(--bandera-azul)');
    renderCapaBox('capa-r', `${NOMBRE_CAPA.R} (R) · ${pctPeso('R')}`, capas.respuesta_R, 'var(--alerta-roja)');

    // RF-UI-03: la URL refleja el municipio abierto
    actualizarHash(`municipio/${muni.divipola}`);

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
    const hay = typeof valor === 'number';
    const valText = hay ? fmt(valor, 1) : 'Sin dato';
    const pct = hay ? Math.min(valor, 100) : 0;
    el.innerHTML = `
      <div class="capa-titulo">
        <span>${escaparHtml(titulo)}</span>
        <span>${hay ? valText + ' pts' : ''}</span>
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
      // Sin dato y contexto se cuentan aparte: nunca como "normales" (RF-UI-05)
      const n = { roja: 0, naranja: 0, amarilla: 0, sin_alerta: 0, sin_dato: 0, contexto: 0 };
      Object.entries(indicadores).forEach(([cod, ind]) => {
        if (ind.valor === null || ind.valor === undefined) n.sin_dato++;
        else if (typeof ind.puntaje !== 'number') n.contexto++;
        else n[nivelDePuntaje(ind.puntaje)]++;
      });

      resumenContainer.innerHTML = `
        <span class="sev-chip sev-roja" title="Puntaje ≥ 75">🔴 ${n.roja} en rojo</span>
        <span class="sev-chip sev-naranja" title="Puntaje 60 a 74">🟠 ${n.naranja} en naranja</span>
        <span class="sev-chip sev-amarilla" title="Puntaje 40 a 59">🟡 ${n.amarilla} en amarillo</span>
        <span class="sev-chip sev-sin" title="Puntaje menor a 40">🟢 ${n.sin_alerta} sin alerta</span>
        <span class="sev-chip sev-sindato" title="Indicadores sin valor en este corte">${n.sin_dato} sin dato</span>
        <span class="sev-chip sev-sindato" title="Con valor, pero no ponderan en el ICR">${n.contexto} de contexto</span>
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

      const sinValor = ind.valor === null || ind.valor === undefined;
      const valText = sinValor ? 'Sin dato' : (typeof ind.valor === 'number' ? fmt(ind.valor, 1) : `${ind.valor}`);
      const unidadText = sinValor ? '' : (ind.unidad || '');
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
        diagText = sinValor ? 'Sin dato en este corte' : 'Contexto: no pondera en el ICR';
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
                <span class="ind-progress-ring-sub">pts</span>
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
              <div class="spectrum-pin-wrap" ${puntaje === null ? 'hidden' : ''}>
                <div class="spectrum-pin" style="left:${pct}%" title="Posición municipal actual: ${escaparHtml(puntajeText)} pts">
                  <div class="spectrum-pin-arrow"></div>
                  <div class="spectrum-pin-label">${puntaje !== null ? fmt(puntaje, 1) : ''}</div>
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
    } else if (muni.nivel_alerta === 'sin_dato') {
      acciones = [
        "Completar la información faltante antes de clasificar el municipio: el ICR no alcanza la cobertura mínima de datos.",
        "Revisar en el monitor de fuentes qué indicadores no llegaron en este corte y solicitar el dato a la entidad responsable."
      ];
    } else {
      acciones = [
        "Mantenimiento de monitoreo ordinario en el ciclo diario del sistema Vigía.",
        "Seguimiento preventivo a niveles de micromedición y preservación de fuentes hídricas."
      ];
    }

    // Son opciones para el análisis de la CRA, no decisiones adoptadas
    container.innerHTML = `
      <h4>Opciones de respuesta para evaluar (nivel ${escaparHtml(nombreNivel(muni.nivel_alerta))}):</h4>
      <ul>
        ${acciones.map(a => `<li>${a}</li>`).join('')}
      </ul>
    `;
  }

  function abrirFichaMunicipal(divipola) {
    if (state.corte.municipios.some(m => m.divipola === divipola)) state.municipioSeleccionadoId = divipola;
    cambiarVista('V-04');
    initFichaV04(divipola);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* =========================================================================
     GRÁFICOS ANALÍTICOS ECHARTS — FICHA MUNICIPAL (RADAR 4D Y VELOCÍMETRO ICR)
     ========================================================================= */
  function calcularPromediosNacionales() {
    // Promedio de cada capa solo entre los municipios que tienen dato en esa capa
    const munis = state.corte.municipios || [];
    const prom = campo => {
      const v = munis.map(m => m.subindices_capa?.[campo]).filter(x => typeof x === 'number');
      return v.length ? +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(1) : '-';
    };
    return { A: prom('amenaza_A'), H: prom('vulnerabilidad_H'), S: prom('servicio_S'), R: prom('respuesta_R'), n: munis.length };
  }

  function valorRadar(v) { return typeof v === 'number' ? v : '-'; }
  function textoRadar(v) { return typeof v === 'number' ? `${fmt(v, 1)} pts` : 'Sin dato'; }

  function renderGraficosFichaECharts(muni) {
    if (typeof echarts === 'undefined') {
      console.warn("Apache ECharts no está cargado");
      return;
    }

    const promedios = calcularPromediosNacionales();
    const colorAlerta = muni.nivel_alerta === 'roja' ? '#B3261E' :
      (muni.nivel_alerta === 'naranja' ? '#E07A10' :
        (muni.nivel_alerta === 'amarilla' ? '#C79E00' :
          (muni.nivel_alerta === 'sin_dato' ? '#8C9BA5' : '#2E7D4F')));
    const colorArea = muni.nivel_alerta === 'roja' ? 'rgba(179, 38, 30, 0.32)' :
      (muni.nivel_alerta === 'naranja' ? 'rgba(224, 122, 16, 0.32)' :
        (muni.nivel_alerta === 'amarilla' ? 'rgba(242, 194, 0, 0.32)' :
          (muni.nivel_alerta === 'sin_dato' ? 'rgba(140, 155, 165, 0.2)' : 'rgba(46, 125, 79, 0.32)')));

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
                <span style="color:#E6F5FA">• ${escaparHtml(NOMBRE_CAPA.A)} (A):</span><b>${textoRadar(vals[0])}</b>
                <span style="color:#E6F5FA">• ${escaparHtml(NOMBRE_CAPA.H)} (H):</span><b>${textoRadar(vals[1])}</b>
                <span style="color:#E6F5FA">• ${escaparHtml(NOMBRE_CAPA.S)} (S):</span><b>${textoRadar(vals[2])}</b>
                <span style="color:#E6F5FA">• ${escaparHtml(NOMBRE_CAPA.R)} (R):</span><b>${textoRadar(vals[3])}</b>
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
            ...['A', 'H', 'S', 'R'].map(k => ({ name: `${k} · ${NOMBRE_CAPA[k].replace(/^(\S+ \S+) /, '$1\n')}`, max: 100 }))
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
                valorRadar(muni.subindices_capa?.amenaza_A),
                valorRadar(muni.subindices_capa?.vulnerabilidad_H),
                valorRadar(muni.subindices_capa?.servicio_S),
                valorRadar(muni.subindices_capa?.respuesta_R)
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
              name: `Promedio de los ${promedios.n} municipios analizados`,
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

      const icrVal = typeof muni.icr === 'number' ? muni.icr : 0;
      // Bandas del medidor con los umbrales de nivel de la config
      const ordenN = [...NIVELES_ICR].sort((a, b) => a.icr_desde - b.icr_desde);
      const bandasGauge = ordenN.map((n, i) => [i + 1 < ordenN.length ? ordenN[i + 1].icr_desde / 100 : 1, HEX_NIVEL[n.nivel]]);
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
                color: bandasGauge
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
                if (typeof muni.icr !== 'number') return '{score|Sin dato}\n{desc|COBERTURA INSUFICIENTE}';
                return '{score|' + fmt(value, 1) + '}{unit| pts}\n{desc|NIVEL ' + nombreNivel(muni.nivel_alerta).toUpperCase() + '}';
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
    actualizarResumenCatalogo();
    renderCatalogoV05();
  }

  // Contadores y nombres de capa del catálogo, derivados del catálogo alineado con la config
  function actualizarResumenCatalogo() {
    const cat = data.catalogoIndicadores || CATALOGO_INDICADORES_MASTER;
    const enIcr = cat.filter(i => i.en_icr).length;
    const capaDe = i => (i.capa || i.codigo[0]).toUpperCase();
    const kpis = document.querySelectorAll('.grid-kpis-catalogo .card-kpi-cat');
    const fijar = (idx, num, titulo, sub) => {
      const k = kpis[idx];
      if (!k) return;
      k.querySelector('.cat-kpi-num').textContent = num;
      if (titulo) k.querySelector('.cat-kpi-text strong').textContent = titulo;
      if (sub) k.querySelector('.cat-kpi-text span').textContent = sub;
    };
    fijar(0, cat.length, 'Indicadores del catálogo', 'Escala municipal, departamental o nacional');
    fijar(1, enIcr, 'Ponderados en el ICR', ['A', 'H', 'S', 'R'].map(k => `${k}: ${pctPeso(k)}`).join(' | '));
    fijar(2, cat.length - enIcr, 'De contexto', cat.filter(i => !i.en_icr).map(i => i.codigo).join(', '));
    const fuentes = data.fuentes || [];
    fijar(3, fuentes.length, 'Conectores con bitácora', fuentes.length ? 'Ver detalle en Fuentes' : 'Sin bitácora de capturas publicada');

    document.querySelectorAll('#filtro-catalogo-capas .pill-capa-btn').forEach(btn => {
      const f = btn.getAttribute('data-filtro');
      const badge = btn.querySelector('.pill-badge');
      if (!badge) return;
      if (f === 'TODOS') badge.textContent = cat.length;
      else if (f === 'ICR') badge.textContent = enIcr;
      else {
        badge.textContent = cat.filter(i => capaDe(i) === f).length;
        // Nombre de la capa desde la config, conservando el punto de color y el contador
        const nodoTexto = [...btn.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
        if (nodoTexto && NOMBRE_CAPA[f]) nodoTexto.textContent = ` Capa ${f} · ${NOMBRE_CAPA[f]} `;
      }
    });
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
          const capaNombre = NOMBRE_CAPA[capaKey.toUpperCase()] || `Capa ${capaKey.toUpperCase()}`;

          // Pertenencia y peso en el ICR (config)
          let icrTag = '';
          if (ind.en_icr) {
            icrTag = `<span class="ind-meta-pill" style="background:#E8EEF9;color:#003189;font-weight:800">ICR · capa ${capaKey.toUpperCase()} (${pctPeso(capaKey.toUpperCase())})</span>`;
          } else {
            icrTag = `<span class="ind-meta-pill" style="background:#FFF3E0;color:#9A4F00;font-weight:800">Contexto: no pondera en el ICR</span>`;
          }
          const origenUmbral = ind.umbrales_origen === 'config'
            ? 'Configuración del ICR'
            : 'Referencia (no genera puntaje)';

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
                    <span>Puntos de quiebre (0 · 40 · 60 · 75 · 100 pts)</span>
                    <span style="font-size:10px;color:var(--cra-cian-texto)">${escaparHtml(origenUmbral)}</span>
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
    const K = capaKey.toUpperCase();

    // 1. Textos y Cabecera
    document.getElementById('modal-ind-cod').textContent = ind.codigo;
    document.getElementById('modal-ind-capa').textContent = `Capa ${K} · ${NOMBRE_CAPA[K] || ''}`;
    document.getElementById('modal-ind-capa').className = `modal-capa-badge capa-${capaKey}`;
    document.getElementById('modal-ind-icr').textContent = ind.en_icr ? `Ponderado en el ICR (capa ${K}: ${pctPeso(K)})` : 'Contexto: no pondera en el ICR';
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
              <span class="lbl-roj">75 pts · Roja</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.roja}</strong>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end">
              <span class="lbl-ext">100 pts · Máximo</span>
              <strong style="color:var(--texto-fuerte)">${ind.umbrales.extremo}</strong>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Distribución Territorial en los Municipios Monitoreados
    const munis = state.corte.municipios || [];
    let cRoja = 0, cNaranja = 0, cAmarilla = 0, cSin = 0, cSinDato = 0;
    const listaAfectados = [];

    munis.forEach(m => {
      const itm = m.indicadores ? m.indicadores[codigo] : null;
      if (itm) {
        const p = itm.puntaje;
        const nivel = itm.valor === null || itm.valor === undefined ? 'sin_dato'
          : (typeof p === 'number' ? nivelDePuntaje(p) : 'contexto');
        if (nivel === 'roja') cRoja++;
        else if (nivel === 'naranja') cNaranja++;
        else if (nivel === 'amarilla') cAmarilla++;
        else if (nivel === 'sin_alerta') cSin++;
        else if (nivel === 'sin_dato') cSinDato++;

        listaAfectados.push({
          divipola: m.divipola,
          nombre: m.nombre,
          departamento: m.departamento,
          valor: itm.valor,
          unidad: itm.unidad,
          puntaje: itm.puntaje,
          nivel
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
          <div class="dist-pct">${((cRoja / tot) * 100).toFixed(1)} % de los municipios</div>
        </div>
        <div class="dist-card dist-naranja">
          <div class="dist-count" style="color:var(--alerta-naranja)">${cNaranja}</div>
          <div class="dist-label" style="color:var(--alerta-naranja)">Nivel Naranja (Alto)</div>
          <div class="dist-pct">${((cNaranja / tot) * 100).toFixed(1)} % de los municipios</div>
        </div>
        <div class="dist-card dist-amarilla">
          <div class="dist-count" style="color:#826600">${cAmarilla}</div>
          <div class="dist-label" style="color:#826600">Nivel Amarillo (Medio)</div>
          <div class="dist-pct">${((cAmarilla / tot) * 100).toFixed(1)} % de los municipios</div>
        </div>
        <div class="dist-card dist-sin">
          <div class="dist-count" style="color:var(--alerta-sin)">${cSin}</div>
          <div class="dist-label" style="color:var(--alerta-sin)">Sin alerta</div>
          <div class="dist-pct">${((cSin / tot) * 100).toFixed(1)} % de los municipios</div>
        </div>
        <div class="dist-card dist-sin">
          <div class="dist-count" style="color:var(--texto-claro)">${cSinDato}</div>
          <div class="dist-label" style="color:var(--texto-claro)">Sin dato</div>
          <div class="dist-pct">${((cSinDato / tot) * 100).toFixed(1)} % de los municipios</div>
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
          <td>${m.valor !== null && m.valor !== undefined ? `<strong>${escaparHtml(typeof m.valor === 'number' ? fmt(m.valor, 1) : m.valor)}</strong> <span style="font-size:11px;color:var(--texto-claro)">${escaparHtml(m.unidad)}</span>` : '<span class="sin-dato-txt">Sin dato</span>'}</td>
          <td>${typeof m.puntaje === 'number' ? `<strong>${fmt(m.puntaje, 1)}</strong> / 100` : '—'}</td>
          <td><span class="chip-alerta ${escaparHtml(m.nivel === 'contexto' ? 'sin_dato' : m.nivel)}">${escaparHtml(m.nivel === 'contexto' ? 'Contexto' : nombreNivel(m.nivel))}</span></td>
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
        orientacionTexto = `<strong>Opciones para evaluar (capa de servicio):</strong> Si este indicador supera los 60 puntos (naranja) o 75 puntos (roja), la CRA puede evaluar con la SSPD la revisión de turnos de bombeo sectorizados, costos transitorios de distribución alternativa (carrotanques/plantas portátiles) y la pertinencia de medidas tarifarias de contingencia, previa verificación jurídica del marco vigente.`;
      } else if (capaKey === 'a') {
        orientacionTexto = `<strong>Opciones para evaluar (capa de amenaza):</strong> Este indicador mide la presión hidrometeorológica externa. Superar el umbral naranja es una señal para llevar el caso a la coordinación interinstitucional con IDEAM y la UNGRD, anticipando la probabilidad de sequía y declaratorias formales de desabastecimiento.`;
      } else if (capaKey === 'h') {
        orientacionTexto = `<strong>Opciones para evaluar (capa de oferta):</strong> Monitorea la capacidad de resiliencia del ecosistema y la infraestructura. Ante valores críticos se puede pedir a los prestadores evaluar fuentes subterráneas de respaldo, tanques de compensación y reducir el consumo no autorizado en la red de aducción.`;
      } else {
        orientacionTexto = `<strong>Opciones para evaluar (capa de respuesta):</strong> Verifica si el municipio cuenta con Plan de Emergencia y Contingencia (PEC) y si ha declarado formalmente calamidad pública. La ausencia de PEC en municipios de alta amenaza es un caso prioritario para el seguimiento con la SSPD.`;
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
        <td><span class="chip-alerta ${escaparHtml(alt.nivel)}">${escaparHtml(nombreNivel(alt.nivel))}</span></td>
        <td>${typeof alt.icr === 'number' ? `<strong>${escaparHtml(fmt(alt.icr, 1))}</strong> pts` : '<span class="sin-dato-txt">Sin dato</span>'}</td>
        <td style="font-size:12px">${escaparHtml(alt.motivo)}</td>
        <td><span style="background:${alt.prioridad === 'ALTA' ? '#FFEBEE' : '#FFF8E1'};color:${alt.prioridad === 'ALTA' ? 'var(--alerta-roja)' : '#7A5C00'};padding:2px 6px;border-radius:3px;font-weight:800;font-size:11px">${escaparHtml(alt.prioridad)}</span></td>
        <td><span style="font-size:11px;font-weight:700;color:var(--cra-cian-texto)">${escaparHtml(String(alt.estado_revision || '').replace(/_/g, ' ').toLowerCase())}</span></td>
        <td><button class="btn-secundario" style="padding:4px 8px;font-size:11px" data-abrir-municipio="${escaparHtml(alt.divipola)}">Revisar</button></td>
      </tr>
    `).join('');
  }

  /* =========================================================================
     10. VISTA V-07: MONITOR DE FUENTES Y FRESCURA
     ========================================================================= */
  function initFuentesV07() {
    const munis = state.corte.municipios || [];
    const total = munis.length;
    const catalogo = data.catalogoIndicadores || CATALOGO_INDICADORES_MASTER;

    // 1. Cobertura por indicador, calculada sobre el corte vigente
    const cobertura = catalogo.map(ind => {
      const c = { cod: ind.codigo, nombre: ind.nombre, en_icr: ind.en_icr, fuentes: new Set(), con: 0, vigente: 0, desactualizado: 0 };
      munis.forEach(m => {
        const i = m.indicadores?.[ind.codigo];
        if (!i) return;
        if (i.fuente) c.fuentes.add(i.fuente);
        if (i.valor !== null && i.valor !== undefined) {
          c.con++;
          if (i.frescura === 'vigente') c.vigente++;
          else if (i.frescura === 'desactualizado') c.desactualizado++;
        }
      });
      return c;
    });

    const tbodyCob = document.getElementById('tbody-cobertura-indicadores');
    if (tbodyCob) {
      tbodyCob.innerHTML = cobertura.map(c => {
        const pct = total ? Math.round((c.con / total) * 100) : 0;
        const tono = c.con === 0 ? 'nula' : (pct < 60 ? 'baja' : 'ok');
        const fres = c.con === 0 ? '<span class="sin-dato-txt">Sin dato</span>'
          : [c.vigente ? `<span class="fres fres-ok">${c.vigente} vigente${c.vigente > 1 ? 's' : ''}</span>` : '',
             c.desactualizado ? `<span class="fres fres-viejo">${c.desactualizado} desactualizado${c.desactualizado > 1 ? 's' : ''}</span>` : ''].join(' ');
        return `
          <tr>
            <td><span class="ind-cod-badge">${escaparHtml(c.cod)}</span> ${escaparHtml(c.nombre)}</td>
            <td style="font-size:12px">${escaparHtml([...c.fuentes].join(' · ') || '—')}</td>
            <td>
              <div class="cob-barra cob-${tono}" role="img" aria-label="${c.con} de ${total} municipios con dato">
                <span style="width:${pct}%"></span>
              </div>
              <span class="cob-txt">${c.con} de ${total}</span>
            </td>
            <td>${fres}</td>
            <td>${c.en_icr ? 'Pondera' : '<span style="color:var(--texto-claro)">Contexto</span>'}</td>
          </tr>`;
      }).join('');
    }

    // 2. Bitácora de conectores (publicada por el pipeline desde data/ops/capturas.json)
    const fuentes = data.fuentes || [];
    const tbody = document.getElementById('tbody-monitor-fuentes');
    const fecha = iso => (iso ? String(iso).replace('T', ' ').slice(0, 16) + ' UTC' : '—');
    const ESTADO = { exitosa: ['Exitosa', 'est-ok'], sin_cambios: ['Sin cambios', 'est-ok'], fallida: ['Fallida', 'est-falla'] };
    if (tbody) {
      tbody.innerHTML = fuentes.length ? fuentes.map(f => {
        const u = f.ultima || {};
        const v = f.ultima_valida;
        const [estTxt, estCls] = ESTADO[u.estado] || [u.estado || '—', 'est-otro'];
        const hash = v && v.hash_sha256 ? v.hash_sha256 : '';
        return `
          <tr>
            <td><span style="font-family:monospace;font-weight:800;color:var(--cra-cian-texto)">${escaparHtml(f.id_fuente)}</span></td>
            <td style="font-size:12px;white-space:nowrap">${escaparHtml(fecha(u.capturado_en))}</td>
            <td><span class="est-pill ${estCls}">${escaparHtml(estTxt)}</span><div class="v07-msg">${escaparHtml(u.mensaje || '')}</div></td>
            <td style="font-size:12px;white-space:nowrap">${v ? escaparHtml(fecha(v.capturado_en)) : '<span class="sin-dato-txt">Ninguno</span>'}</td>
            <td style="font-variant-numeric:tabular-nums">${v && typeof v.filas_procesadas === 'number' ? fmt(v.filas_procesadas, 0) : '—'}</td>
            <td><span style="font-family:monospace;font-size:11px" title="${escaparHtml(hash)}">${hash ? escaparHtml(hash.slice(0, 12)) + '…' : '—'}</span></td>
            <td style="font-size:12px">${fmt(f.total_capturas, 0)} ${f.total_capturas === 1 ? 'ejecución' : 'ejecuciones'}${f.fallidas ? ` · <span style="color:var(--alerta-roja);font-weight:700">${fmt(f.fallidas, 0)} ${f.fallidas === 1 ? 'fallida' : 'fallidas'}</span>` : ''}</td>
          </tr>`;
      }).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px"><span class="sin-dato-txt">Sin bitácora de capturas publicada.</span> Ejecute el pipeline para generarla.</td></tr>`;
    }

    // 3. Resumen superior
    const kpis = document.getElementById('v07-kpis');
    if (kpis) {
      const sinNada = cobertura.filter(c => c.con === 0).map(c => c.cod);
      const enIcr = cobertura.filter(c => c.en_icr);
      const completos = enIcr.filter(c => c.con === total).length;
      const fallando = fuentes.filter(f => f.ultima && f.ultima.estado === 'fallida').map(f => f.id_fuente);
      const tarjeta = (num, txt, sub, tono = '') => `
        <div class="v07-kpi ${tono}"><strong>${num}</strong><span>${escaparHtml(txt)}</span>${sub ? `<small>${escaparHtml(sub)}</small>` : ''}</div>`;
      kpis.innerHTML =
        tarjeta(`${completos}/${enIcr.length}`, 'indicadores del ICR con dato en todos los municipios', '') +
        tarjeta(sinNada.length, 'indicadores sin ningún dato', sinNada.join(', '), sinNada.length ? 'v07-alerta' : '') +
        tarjeta(fuentes.length - fallando.length + '/' + fuentes.length, 'conectores con última ejecución sin falla', fallando.join(', '), fallando.length ? 'v07-alerta' : '') +
        tarjeta(escaparHtml(state.corte.metadata_corte?.fecha_corte || '—'), 'fecha del corte', state.corte.metadata_corte?.estado_calidad === 'PUBLICADO_VALIDO' ? 'Pasó la compuerta de calidad' : (state.corte.metadata_corte?.estado_calidad || ''));
    }
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
