/**
 * CANAL CIUDADANO — Vigía El Niño · Acueductos (CRA)
 * Lee SOLO window.VIGIA_CIUDADANO (js/vista.js, generado por ingesta/canal_ciudadano.py).
 * RNF-CIU-02: no accede a data.js ni al corte interno.
 * Todos los textos visibles vienen de la vista (config.canal_ciudadano) o son rótulos de interfaz.
 */
(function () {
  'use strict';

  const V = window.VIGIA_CIUDADANO;
  const $ = id => document.getElementById(id);
  const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!V || !V.metadata) {
    $('ficha').innerHTML = '<div class="vacio-ficha"><h2 class="titular" style="margin:0 auto">No pudimos cargar la información</h2><p class="apoyo" style="margin:12px auto 0">Intente de nuevo en unos minutos.</p></div>';
    return;
  }
  const md = V.metadata;

  /* ---------------------------------------------------------------- utilidades */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 1) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
  const sinTildes = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const NIVELES = ['Bajo', 'Medio', 'Alto', 'Muy alto'];
  const SIN_INFO = 'Sin información';
  const claseNivel = t => ({ 'Bajo': 'bajo', 'Medio': 'medio', 'Alto': 'alto', 'Muy alto': 'muy-alto' }[t] || 'sin');
  const COLOR = { bajo: '#2E7D4F', medio: '#F2C200', alto: '#E07A10', 'muy-alto': '#B3261E', sin: '#B9C4CC' };

  const municipios = (V.departamentos || []).flatMap(d => d.municipios.map(m => ({ ...m, cod_depto: d.cod_depto })));
  const porDivipola = new Map(municipios.map(m => [m.divipola, m]));

  function pieDato(d) {
    if (!d) return '';
    const partes = [d.fuente, d.periodo].filter(Boolean).map(esc).join(' · ');
    return `<p class="dato-pie">Fuente: ${partes || 'sin fecha'}${d.advertencia ? `<span class="adv">⚠ ${esc(d.advertencia)}</span>` : ''}</p>`;
  }

  /* ------------------------------------------------- compuerta y encabezado */
  if (md.estado !== 'publicable') {
    $('banda-previa').hidden = false;
    $('motivos-previa').innerHTML = (md.motivos_no_publicable || []).map(m => `<li>${esc(m)}</li>`).join('');
  } else {
    $('meta-robots').setAttribute('content', 'index, follow');
  }
  $('corte-chip').textContent = `Análisis del ${fechaLarga(md.fecha_corte)}`;
  $('aviso-alcance').textContent = md.aviso;
  $('pie-version').textContent = `Análisis del ${fechaLarga(md.fecha_corte)} · versión ${md.version_canal}`;

  function fechaLarga(iso) {
    if (!iso) return 'fecha no disponible';
    const [a, m, d] = iso.split('-').map(Number);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${d} de ${meses[m - 1]} de ${a}`;
  }

  /* ------------------------------------------------------------- buscador */
  const input = $('buscar');
  const lista = $('sugerencias');
  let activo = -1;
  let resultados = [];

  function abrirLista(abrir) {
    lista.hidden = !abrir;
    input.setAttribute('aria-expanded', String(abrir));
  }

  function pintarSugerencias() {
    const q = sinTildes(input.value);
    if (!q) { abrirLista(false); return; }
    resultados = municipios.filter(m => sinTildes(m.municipio).includes(q) || sinTildes(m.departamento).includes(q)).slice(0, 8);
    activo = resultados.length ? 0 : -1;
    lista.innerHTML = resultados.length
      ? resultados.map((m, i) => `<li role="option" id="op-${i}" data-div="${esc(m.divipola)}" aria-selected="${i === activo}">
          <span>${esc(m.municipio)}</span><small>${esc(m.departamento)}</small></li>`).join('')
      : `<li class="vacio" role="option" aria-disabled="true">${esc(md.municipio_fuera_de_muestra)}</li>`;
    input.setAttribute('aria-activedescendant', activo >= 0 ? `op-${activo}` : '');
    abrirLista(true);
  }

  function moverActivo(paso) {
    if (!resultados.length) return;
    activo = (activo + paso + resultados.length) % resultados.length;
    lista.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-selected', String(i === activo)));
    input.setAttribute('aria-activedescendant', `op-${activo}`);
  }

  input.addEventListener('input', pintarSugerencias);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moverActivo(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moverActivo(-1); }
    else if (e.key === 'Enter' && activo >= 0) { e.preventDefault(); elegir(resultados[activo].divipola); }
    else if (e.key === 'Escape') abrirLista(false);
  });
  lista.addEventListener('mousedown', e => {
    const li = e.target.closest('li[data-div]');
    if (li) { e.preventDefault(); elegir(li.dataset.div); }
  });
  input.addEventListener('blur', () => setTimeout(() => abrirLista(false), 120));

  // Ejemplos: un municipio por nivel, del más alto al más bajo
  const ejemplos = [...NIVELES].reverse().map(n => municipios.find(m => m.nivel_riesgo?.texto === n)).filter(Boolean).slice(0, 3);
  $('atajos').innerHTML = ejemplos.length
    ? `<span style="align-self:center">Ejemplos:</span>` + ejemplos.map(m => `<button type="button" data-div="${esc(m.divipola)}">${esc(m.municipio)}</button>`).join('')
    : '';
  $('atajos').addEventListener('click', e => { const b = e.target.closest('button[data-div]'); if (b) elegir(b.dataset.div); });

  function elegir(divipola, desplazar = true) {
    const m = porDivipola.get(divipola);
    abrirLista(false);
    if (!m) return;
    input.value = m.municipio;
    pintarFicha(m);
    try { history.replaceState(null, '', `?m=${encodeURIComponent(divipola)}`); } catch (_) { /* file:// */ }
    if (desplazar) $('seccion-ficha').scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------------------------------------------------- ficha municipal */
  function pintarFicha(m) {
    const nivel = m.nivel_riesgo?.texto || SIN_INFO;
    const cls = claseNivel(nivel);
    const desc = (md.descripcion_nivel || {})[nivel] || '';
    $('ficha').innerHTML = `
      <div class="ficha-cabeza">
        <div>
          <span class="eyebrow">${esc(m.departamento)}</span>
          <h2 class="titular" id="titulo-ficha">${esc(m.municipio)}</h2>
          ${m.zona_hidrografica ? `<p class="zona">Cuenca: ${esc(m.zona_hidrografica)}</p>` : ''}
        </div>
        <button type="button" class="btn-sec" id="btn-otro">Consultar otro municipio</button>
      </div>
      <div class="bento">
        <article class="casilla c-nivel" aria-labelledby="h-nivel">
          <span class="etiqueta">Riesgo de desabastecimiento</span>
          <h3 id="h-nivel">Nivel de riesgo</h3>
          <div class="grafico" style="flex-direction:column">
            ${svgMedidor(nivel)}
            <div class="nivel-grande tx-${cls}">${esc(nivel)}</div>
            ${desc ? `<p class="nivel-desc">${esc(desc)}</p>` : ''}
            ${m.nivel_riesgo?.razon ? `<p class="razon">${esc(m.nivel_riesgo.razon)}</p>` : ''}
          </div>
          ${pieDato(m.nivel_riesgo)}
        </article>

        <article class="casilla c-horas" aria-labelledby="h-horas">
          <span class="etiqueta">Continuidad</span>
          <h3 id="h-horas">Horas de agua al día</h3>
          <div class="grafico">${svgReloj(m.horas_servicio?.valor)}</div>
          ${pieDato(m.horas_servicio)}
        </article>

        <article class="casilla c-calidad" aria-labelledby="h-calidad">
          <span class="etiqueta">Calidad</span>
          <h3 id="h-calidad">¿El agua es apta para el consumo?</h3>
          <div class="grafico" style="flex-direction:column;align-items:stretch">${escalaCalidad(m.calidad_agua)}</div>
          ${pieDato(m.calidad_agua)}
        </article>

        <article class="casilla c-racion" aria-labelledby="h-racion">
          <span class="etiqueta">Racionamiento</span>
          <h3 id="h-racion">¿Hay racionamiento?</h3>
          <div class="grafico" style="justify-content:flex-start">${estadoBinario(m.racionamiento)}</div>
          ${pieDato(m.racionamiento)}
        </article>

        <article class="casilla c-calamidad" aria-labelledby="h-calamidad">
          <span class="etiqueta">Calamidad pública</span>
          <h3 id="h-calamidad">¿Hay calamidad pública declarada?</h3>
          <div class="grafico" style="justify-content:flex-start">${estadoBinario(m.calamidad_publica)}</div>
          ${pieDato(m.calamidad_publica)}
        </article>
      </div>
    `;
    $('btn-otro').addEventListener('click', () => { input.value = ''; input.focus(); window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' }); });
    // Animar al estado final (los SVG nacen en reposo y se mueven en el siguiente cuadro)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll('[data-final-transform]').forEach(el => { el.style.transform = el.dataset.finalTransform; });
      document.querySelectorAll('[data-final-offset]').forEach(el => { el.style.strokeDashoffset = el.dataset.finalOffset; });
      document.querySelectorAll('[data-final-left]').forEach(el => { el.style.left = el.dataset.finalLeft; });
    }));
  }

  /** Medidor semicircular de 4 niveles; la aguja señala el nivel. */
  function svgMedidor(nivel) {
    const cx = 200, cy = 200, r = 150;
    const punto = t => [cx - r * Math.cos(t), cy - r * Math.sin(t)];
    const idx = NIVELES.indexOf(nivel);
    const seg = NIVELES.map((n, i) => {
      const t0 = i * Math.PI / 4 + 0.02, t1 = (i + 1) * Math.PI / 4 - 0.02;
      const [x0, y0] = punto(t0), [x1, y1] = punto(t1);
      const c = claseNivel(n);
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="url(#gm-${c})" stroke-width="${i === idx ? 52 : 40}" fill="none" opacity="${idx < 0 || i === idx ? 1 : .35}"/>`;
    }).join('');
    const grads = NIVELES.map(n => {
      const c = claseNivel(n);
      return `<linearGradient id="gm-${c}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLOR[c]}" stop-opacity=".75"/><stop offset="1" stop-color="${COLOR[c]}"/></linearGradient>`;
    }).join('');
    const etiquetas = NIVELES.map((n, i) => {
      const t = (i + .5) * Math.PI / 4;
      const x = cx - (r + 42) * Math.cos(t), y = cy - (r + 42) * Math.sin(t);
      return `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" text-anchor="middle" font-size="15" font-weight="${i === idx ? 900 : 600}" fill="${i === idx ? '#1F2A36' : '#6F7C86'}">${esc(n)}</text>`;
    }).join('');
    const angulo = idx < 0 ? 0 : -67.5 + idx * 45;
    const aguja = idx < 0 ? '' : `
      <g class="aguja" style="transform:rotate(-90deg)" data-final-transform="rotate(${angulo}deg)">
        <path d="M196 200 L200 70 L204 200 Z" fill="#1F2A36"/>
      </g>
      <circle cx="200" cy="200" r="14" fill="#1F2A36"/><circle cx="200" cy="200" r="5" fill="#FFF"/>`;
    const sin = idx < 0 ? `<text x="200" y="190" text-anchor="middle" font-size="18" font-weight="800" fill="#6F7C86">Sin información</text>` : '';
    return `<svg class="medidor" viewBox="-40 0 480 230" role="img" aria-label="Nivel de riesgo: ${esc(nivel)}, en una escala de cuatro: bajo, medio, alto y muy alto">
      <defs>${grads}<pattern id="rayas" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="#B9C4CC"/></pattern></defs>
      ${idx < 0 ? `<path d="M50 200 A150 150 0 0 1 350 200" stroke="url(#rayas)" stroke-width="40" fill="none"/>` : seg}
      ${etiquetas}${aguja}${sin}
    </svg>`;
  }

  /** Reloj de 24 h llenado con las horas de servicio. */
  function svgReloj(horas) {
    const r = 80, C = 2 * Math.PI * r;
    const tiene = typeof horas === 'number';
    const fin = tiene ? C * (1 - Math.min(24, horas) / 24) : C;
    const marcas = Array.from({ length: 24 }, (_, i) => {
      const a = i / 24 * 2 * Math.PI - Math.PI / 2;
      const r1 = i % 6 === 0 ? 94 : 98;
      return `<line x1="${(100 + r1 * Math.cos(a)).toFixed(1)}" y1="${(100 + r1 * Math.sin(a)).toFixed(1)}" x2="${(100 + 104 * Math.cos(a)).toFixed(1)}" y2="${(100 + 104 * Math.sin(a)).toFixed(1)}" stroke="#B9C4CC" stroke-width="${i % 6 === 0 ? 2.5 : 1.2}"/>`;
    }).join('');
    return `<svg class="reloj" viewBox="-10 -10 220 220" role="img" aria-label="${tiene ? `${num(horas)} de 24 horas de servicio al día` : 'Sin información de horas de servicio'}">
      <defs><linearGradient id="g-reloj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#43B2D7"/><stop offset="1" stop-color="#003189"/></linearGradient></defs>
      ${marcas}
      <circle cx="100" cy="100" r="${r}" fill="none" stroke="#EEF2F5" stroke-width="22"/>
      ${tiene ? `<circle class="arco" cx="100" cy="100" r="${r}" fill="none" stroke="url(#g-reloj)" stroke-width="22" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(1)}" style="stroke-dashoffset:${C.toFixed(1)}" data-final-offset="${fin.toFixed(1)}" transform="rotate(-90 100 100)"/>` : ''}
      <text x="100" y="${tiene ? 100 : 106}" text-anchor="middle" font-size="${tiene ? 40 : 15}" font-weight="900" fill="#1F2A36">${tiene ? esc(num(horas)) : 'Sin información'}</text>
      ${tiene ? `<text x="100" y="126" text-anchor="middle" font-size="14" fill="#5B5B5B">de 24 horas</text>` : ''}
    </svg>`;
  }

  /** Escala de calidad del agua (bandas de la Res. 2115 de 2007 desde la configuración). */
  function escalaCalidad(d) {
    const bandas = md.bandas_calidad_agua || [];
    const colores = ['#2E7D4F', '#F2C200', '#E07A10', '#B3261E', '#6B1A15'];
    const v = d?.valor;
    let pos = null;
    if (typeof v === 'number' && bandas.length) {
      let desde = 0;
      for (let i = 0; i < bandas.length; i++) {
        if (v <= bandas[i].hasta || i === bandas.length - 1) {
          const frac = Math.max(0, Math.min(1, (v - desde) / (bandas[i].hasta - desde || 1)));
          pos = (i + frac) / bandas.length * 100;
          break;
        }
        desde = bandas[i].hasta;
      }
    }
    return `<div class="escala" role="img" aria-label="Calidad del agua: ${esc(d?.texto || 'sin información')}${typeof v === 'number' ? `, índice ${num(v)} de 100` : ''}">
      <div class="calidad-txt">${esc(d?.texto || 'Sin información verificada')}</div>
      <div class="escala-barra">${bandas.map((b, i) => `<span style="background:${colores[i] || '#999'}"></span>`).join('')}</div>
      <div class="escala-marca">${pos === null ? '' : `<i style="left:0%" data-final-left="${pos.toFixed(1)}%"></i>`}</div>
      <div class="escala-etq">${bandas.map(b => `<span>${esc(b.texto)}</span>`).join('')}</div>
      ${typeof v === 'number' ? `<p style="text-align:center;font-size:13px;margin-top:8px">Índice de riesgo de la calidad del agua: <strong>${esc(num(v))}</strong> de 100 (menos es mejor)</p>` : ''}
    </div>`;
  }

  /** Sí / No / Sin información, con su icono. «Sin información» nunca se pinta como «no». */
  function estadoBinario(d) {
    const v = d?.valor;
    const tipo = v === 1 ? 'si' : v === 0 ? 'no' : 'sin';
    const icono = { si: '!', no: '✓', sin: '?' }[tipo];
    return `<div class="estado-bin ${tipo}"><span class="icono" aria-hidden="true">${icono}</span>
      <div><strong>${esc(d?.texto || 'Sin información verificada')}</strong></div></div>`;
  }

  /* ------------------------------------------------------------ El Niño y embalses */
  function pintarPais() {
    const nino = V.nacional?.estado_el_nino || {};
    const s = nino.semanal;
    const casN = $('casilla-nino');
    if (s && typeof s.valor === 'number') {
      const pos = Math.max(0, Math.min(100, s.valor / 4 * 100));
      const umbral = 0.5 / 4 * 100;
      casN.innerHTML = `
        <span class="etiqueta">Océano Pacífico</span>
        <h3>Temperatura sobre lo normal</h3>
        <div style="margin-top:14px">
          <div class="cifra-gigante">${s.valor > 0 ? '+' : ''}${esc(num(s.valor))} °C</div>
          <div class="tendencia">Intensidad: ${esc(s.nivel || '—')} · ${esc(textoTendencia(s.tendencia))}</div>
        </div>
        <svg class="oceano" viewBox="0 0 400 74" role="img" aria-label="Escala de 0 a 4 grados sobre lo normal; El Niño empieza en 0,5 grados; hoy: ${esc(num(s.valor))} grados">
          <defs><linearGradient id="g-oc" x1="0" x2="1"><stop offset="0" stop-color="#43B2D7"/><stop offset=".35" stop-color="#F2C200"/><stop offset=".7" stop-color="#E07A10"/><stop offset="1" stop-color="#B3261E"/></linearGradient></defs>
          <rect x="0" y="20" width="400" height="16" rx="8" fill="url(#g-oc)"/>
          <line x1="${umbral * 4}" y1="12" x2="${umbral * 4}" y2="44" stroke="#1F2A36" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="${umbral * 4 + 4}" y="60" font-size="12" fill="#5B5B5B">Inicio de El Niño (+0,5 °C)</text>
          <circle cx="${pos * 4}" cy="28" r="12" fill="#FFF" stroke="#1F2A36" stroke-width="3"/>
          <text x="0" y="12" font-size="11" fill="#6F7C86">0 °C</text><text x="400" y="12" font-size="11" fill="#6F7C86" text-anchor="end">+4 °C</text>
        </svg>
        <p style="font-size:14px;margin:6px 0 12px">${esc(nino.remision || '')}</p>
        ${pieDato(s)}`;
    } else {
      casN.innerHTML = `<span class="etiqueta">Océano Pacífico</span><h3>Temperatura sobre lo normal</h3><p style="margin:16px 0">Sin información verificada.</p>${pieDato(s)}`;
    }

    const emb = V.nacional?.embalses || {};
    const opciones = [['nacional', 'País'], ['bogota', 'Bogotá']].filter(([k]) => emb[k]);
    const casE = $('casilla-embalses');
    if (!opciones.length) {
      casE.innerHTML = `<span class="etiqueta">Embalses</span><h3>¿Cuánta agua guardan?</h3><p style="margin:16px 0">Sin información verificada.</p>`;
      return;
    }
    casE.innerHTML = `
      <span class="etiqueta">Embalses</span>
      <h3>¿Cuánta agua guardan?</h3>
      <div class="conmutador" role="group" aria-label="Elegir embalses">
        ${opciones.map(([k, t], i) => `<button type="button" data-emb="${k}" aria-pressed="${i === 0}">${t}</button>`).join('')}
      </div>
      <div class="tanque-wrap" style="margin-top:16px">
        <svg class="tanque" viewBox="0 0 150 190" role="img" id="tanque-svg" aria-label="">
          <defs>
            <clipPath id="clip-tq"><rect x="12" y="12" width="126" height="166" rx="18"/></clipPath>
            <linearGradient id="g-tq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43B2D7"/><stop offset="1" stop-color="#003189"/></linearGradient>
            <linearGradient id="g-vidrio" x1="0" x2="1"><stop offset="0" stop-color="#FFF" stop-opacity=".55"/><stop offset=".3" stop-color="#FFF" stop-opacity="0"/></linearGradient>
          </defs>
          <rect x="12" y="12" width="126" height="166" rx="18" fill="#F4F6F8" stroke="#D9D9D9" stroke-width="2"/>
          <g clip-path="url(#clip-tq)">
            <g class="nivel-agua" id="tq-nivel" style="transform:translateY(166px)">
              <path class="ola" d="M0 12 Q30 4 60 12 T120 12 T180 12 T240 12 T300 12 V200 H0Z" fill="url(#g-tq)"/>
            </g>
          </g>
          <rect x="12" y="12" width="126" height="166" rx="18" fill="url(#g-vidrio)"/>
        </svg>
        <div style="min-width:0;flex:1">
          <div class="cifra-gigante agua" id="tq-cifra">—</div>
          <div class="tendencia" id="tq-tend"></div>
          <p style="font-size:14px;margin-top:10px" id="tq-texto"></p>
        </div>
      </div>
      <p style="font-size:13px;margin:12px 0">${esc(emb.nota || md.embalses_nota || '')}</p>
      <div id="tq-pie"></div>`;

    const mostrar = k => {
      const d = emb[k];
      casE.querySelectorAll('[data-emb]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.emb === k)));
      const pct = typeof d.valor === 'number' ? d.valor : null;
      $('tq-cifra').textContent = pct === null ? 'Sin información' : `${num(pct)} %`;
      $('tq-tend').textContent = `${d.nivel || ''}${d.tendencia ? ' · ' + textoTendencia(d.tendencia) : ''}`;
      $('tq-texto').textContent = d.texto || '';
      $('tq-pie').innerHTML = pieDato(d);
      $('tanque-svg').setAttribute('aria-label', pct === null ? 'Sin información' : `Embalses al ${num(pct)} % de su volumen útil`);
      const y = pct === null ? 166 : 12 + 166 * (1 - pct / 100) - 12;
      requestAnimationFrame(() => { $('tq-nivel').style.transform = `translateY(${y.toFixed(1)}px)`; });
    };
    casE.querySelector('.conmutador').addEventListener('click', e => { const b = e.target.closest('[data-emb]'); if (b) mostrar(b.dataset.emb); });
    mostrar(opciones[0][0]);
  }

  function textoTendencia(t) {
    return { mejora: 'mejora frente a la semana anterior', empeora: 'empeora frente a la semana anterior', estable: 'estable frente a la semana anterior' }[t] || '';
  }

  /* ------------------------------------------------------------- departamentos */
  function pintarDeptos() {
    const todos = [...NIVELES, SIN_INFO];
    $('leyenda').innerHTML = todos.map(n => `<span><i class="bg-${claseNivel(n)}"></i>${esc(n)}</span>`).join('');
    const deptos = [...(V.departamentos || [])].sort((a, b) => peso(b) - peso(a) || a.departamento.localeCompare(b.departamento, 'es'));
    $('deptos').innerHTML = deptos.map(d => {
      const total = d.municipios.length;
      const conteo = d.municipios_por_nivel || {};
      const barra = [...todos].reverse().map(n => conteo[n] ? `<span class="bg-${claseNivel(n)}" style="width:${conteo[n] / total * 100}%" title="${esc(n)}: ${conteo[n]}"></span>` : '').join('');
      const resumen = todos.filter(n => conteo[n]).map(n => `${conteo[n]} ${n.toLowerCase()}`).join(', ');
      return `<article class="depto">
        <button type="button" class="depto-toggle" aria-expanded="false">
          <strong>${esc(d.departamento)}</strong>
          <small>${total} ${total === 1 ? 'municipio analizado' : 'municipios analizados'}: ${esc(resumen)}</small>
          <span class="barra-niveles" role="img" aria-label="${esc(resumen)}">${barra}</span>
        </button>
        <div class="depto-munis">${d.municipios.map(m => `<button type="button" class="chip-muni" data-div="${esc(m.divipola)}"><i class="bg-${claseNivel(m.nivel_riesgo?.texto)}" aria-hidden="true"></i>${esc(m.municipio)} <span class="sr-only">(nivel ${esc(m.nivel_riesgo?.texto || SIN_INFO)})</span></button>`).join('')}</div>
      </article>`;
    }).join('');
    $('deptos').addEventListener('click', e => {
      const chip = e.target.closest('.chip-muni');
      if (chip) { elegir(chip.dataset.div); return; }
      const t = e.target.closest('.depto-toggle');
      if (t) t.setAttribute('aria-expanded', String(t.getAttribute('aria-expanded') !== 'true'));
    });
  }
  function peso(d) {
    const c = d.municipios_por_nivel || {};
    return (c['Muy alto'] || 0) * 1000 + (c['Alto'] || 0) * 100 + (c['Medio'] || 0) * 10 + (c['Bajo'] || 0);
  }

  /* -------------------------------------------------------------- a quién acudo */
  function pintarAcudir() {
    const iconos = {
      suministro: '<path d="M12 2.7c-3 4-6 7.3-6 11a6 6 0 0 0 12 0c0-3.7-3-7-6-11z"/>',
      emergencias: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
      clima: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
      quejas: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
    };
    const titulos = md.titulos_remision || {};
    $('acudir').innerHTML = Object.entries(md.remisiones || {}).map(([k, txt]) => `
      <article data-reveal>
        <div class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${iconos[k] || ''}</svg></div>
        <h3>${esc(titulos[k] || k)}</h3>
        <p>${esc(txt)}</p>
      </article>`).join('');
  }

  /* ---------------------------------------------------------------- revelado */
  function activarRevelado() {
    const els = document.querySelectorAll('[data-reveal]');
    if (reducido || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('visible')); return; }
    const io = new IntersectionObserver(entradas => {
      entradas.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(el); });
  }

  /* ------------------------------------------------------------------- inicio */
  pintarPais();
  pintarDeptos();
  pintarAcudir();
  activarRevelado();
  const inicial = new URLSearchParams(location.search).get('m');
  if (inicial && porDivipola.has(inicial)) elegir(inicial, false);
  else if (inicial) {
    $('ficha').innerHTML = `<div class="vacio-ficha"><h2 class="titular" style="margin:0 auto">${esc(md.municipio_fuera_de_muestra)}</h2><p class="apoyo" style="margin:12px auto 0">Consulte la lista por departamento.</p></div>`;
  }
})();
