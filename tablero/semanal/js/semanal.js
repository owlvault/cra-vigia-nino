/* =============================================================================
   Comparativo semanal El Niño en Colombia (V-08) — Vigía El Niño · Acueductos
   Spec: context-lake/specs/comparativo-semanal.md
   Datos: GET /api/semanal/datos (servidor_tablero.py) o copia estática data/comparativo_semanal.json
   ============================================================================= */
(() => {
  "use strict";

  const API = { datos: "/api/semanal/datos", estado: "/api/semanal/estado", actualizar: "/api/semanal/actualizar" };
  const ESTATICO = "data/comparativo_semanal.json";
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const GRUPOS = { amenaza: "Amenaza oceánica · NOAA", colombia: "Efecto observado en Colombia", riesgo: "Riesgo para acueductos · Vigía" };
  const COLOR = {
    cian: "#43B2D7", cianTexto: "#17729A", azul: "#003189", texto: "#5B5B5B", fuerte: "#1F2A36", linea: "#D9D9D9",
    sin: "#2E7D4F", amarilla: "#F2C200", naranja: "#E07A10", roja: "#B3261E", grises: ["#003189", "#6E7B88", "#A3AEB8"],
  };
  const TXT_TENDENCIA = { empeora: "Empeora", mejora: "Mejora", estable: "Estable", sin_dato: "Sin dato para comparar" };

  const estado = {
    datos: null, foco: null, ref: "1", grupo: "todas", analogoVar: "NINO34_SSTA", alinear: "evento",
    modo: "completo", api: false, sondeo: null, graficos: {}, sparks: [],
  };
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------ utilidades
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (v, dec = 1) => v == null || Number.isNaN(v) ? null
    : new Intl.NumberFormat("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  const fmtSigno = (v, dec = 1) => v == null ? null : (v > 0 ? "+" : v < 0 ? "−" : "±") + fmt(Math.abs(v), dec);
  const isoInicio = (s) => {
    const y = +s.slice(0, 4), w = +s.slice(6, 8);
    const ene4 = new Date(Date.UTC(y, 0, 4));
    const lunes = new Date(ene4); lunes.setUTCDate(ene4.getUTCDate() - ((ene4.getUTCDay() + 6) % 7) + (w - 1) * 7);
    return lunes;
  };
  const semanasEntre = (a, b) => Math.round((isoInicio(b) - isoInicio(a)) / 6048e5);
  const isoSemana = (fecha) => {
    const t = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3); // jueves de la semana
    const y = t.getUTCFullYear(), jueves1 = new Date(Date.UTC(y, 0, 4));
    jueves1.setUTCDate(jueves1.getUTCDate() - ((jueves1.getUTCDay() + 6) % 7) + 3);
    return `${y}-W${String(1 + Math.round((t - jueves1) / 6048e5)).padStart(2, "0")}`;
  };
  const desplazar = (s, n) => { const d = isoInicio(s); d.setUTCDate(d.getUTCDate() + 7 * n); return isoSemana(d); };
  const fechaCorta = (d) => `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
  const rangoSemana = (s) => {
    const i = isoInicio(s), f = new Date(i); f.setUTCDate(i.getUTCDate() + 6);
    return `${fechaCorta(i)} – ${fechaCorta(f)} ${f.getUTCFullYear()}`;
  };
  const nSem = (s) => +s.slice(6, 8);
  const fechaDato = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return `${d} ${MESES[m - 1]} ${y}`;
  };
  const fechaHora = (iso) => iso ? new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";
  const varPorCodigo = (c) => estado.datos.variables.find((v) => v.codigo === c);
  const fila = (cod, s, ref = estado.ref) => estado.datos.fct_variable_semana[ref]?.[cod]?.[s];
  const obs = (cod, s) => estado.datos.series[cod]?.find((o) => o.semana_iso === s);
  const valorTxt = (v, variable) => fmt(v, variable.decimales);

  function toast(msg, tipo = "ok", ms = 4200) {
    const t = $("toast"); t.className = `toast toast--${tipo}`; t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms);
  }

  // ------------------------------------------------------------------ carga
  async function cargarDatos() {
    const intentar = async (url) => { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error(r.status); return r.json(); };
    try { estado.datos = await intentar(API.datos); estado.api = true; }
    catch { estado.datos = await intentar(ESTATICO); estado.api = false; }
    const semanas = estado.datos.dim_semana.map((d) => d.semana_iso);
    if (!estado.foco || !semanas.includes(estado.foco)) estado.foco = estado.datos.metadata.semana_vigente;
  }

  // ------------------------------------------------------------------ render general
  function renderTodo() {
    renderEncabezado(); renderHero(); renderLectura(); renderTarjetas(); renderAnalogos();
    renderMatriz(); renderRegiones(); renderImpacto(); renderDeptos(); renderFuentes();
  }

  function renderEncabezado() {
    const m = estado.datos.metadata;
    $("meta-generado").textContent = fechaHora(m.generado_en);
    $("pie-version").textContent = `Config ${m.version_config} · hash ${m.hash_entradas.slice(0, 10)}`;
    const horas = (Date.now() - new Date(m.generado_en)) / 36e5;
    const pill = $("pill-frescura"), vieja = horas > m.frescura_horas_aviso;
    pill.className = `pill-frescura ${vieja ? "vieja" : "ok"}`;
    pill.querySelector("span").textContent = vieja ? `Hace ${Math.round(horas)} h` : "Al día";
    const aviso = $("aviso-frescura");
    aviso.hidden = !vieja;
    if (vieja) aviso.textContent = `El corte semanal tiene más de ${m.frescura_horas_aviso} horas (generado ${fechaHora(m.generado_en)}). Pulse «Actualizar datos» para traer la información más reciente.`;
    $("met-umbral").textContent = fmtSigno(m.deteccion_evento.umbral_inicio_c, 1);
    $("met-consec").textContent = m.deteccion_evento.semanas_consecutivas_inicio;
  }

  function renderHero() {
    const d = estado.datos, s = estado.foco, semanas = d.dim_semana.map((x) => x.semana_iso);
    const h = $("hero-semana");
    h.style.opacity = 0;
    requestAnimationFrame(() => { h.textContent = `Semana ${nSem(s)} · ${s.slice(0, 4)}`; h.style.opacity = 1; });
    $("hero-rango").textContent = rangoSemana(s) + (s === d.metadata.semana_actual ? " · semana en curso" : "");
    const i = semanas.indexOf(s);
    $("btn-semana-prev").disabled = i <= 0;
    $("btn-semana-next").disabled = i >= semanas.length - 1;
    const sel = $("sel-semana");
    if (sel.options.length !== semanas.length) {
      sel.innerHTML = semanas.slice().reverse().map((x) => `<option value="${x}">Semana ${nSem(x)} · ${rangoSemana(x)}</option>`).join("");
    }
    sel.value = s;

    const dim = d.dim_semana.find((x) => x.semana_iso === s);
    const chips = [];
    const ev = d.evento_vigente;
    if (ev.inicio_semana && dim.semana_evento > 0) chips.push(`<span class="chip">Semana <b>${dim.semana_evento}</b> del evento · inicio sem. ${nSem(ev.inicio_semana)} de ${ev.inicio_semana.slice(0, 4)}</span>`);
    else chips.push(`<span class="chip">Sin evento El Niño detectado en esta semana</span>`);
    const oni = fila("ONI", s);
    if (oni?.valor != null) chips.push(`<span class="chip">ONI ${esc(obs("ONI", s)?.etiqueta_periodo || "")} <b>${fmtSigno(oni.valor, 2)} °C</b> <span class="chip-nivel chip-nivel--${oni.nivel_riesgo}">${esc(oni.nivel_etiqueta)}</span></span>`);
    if (ev.pico) chips.push(`<span class="chip">Pico Niño 3.4 del evento: <b>${fmtSigno(ev.pico.valor)} °C</b> (sem. ${nSem(ev.pico.semana_iso)})</span>`);
    const ref = desplazar(s, -Number(estado.ref));
    chips.push(`<span class="chip">Referencia: <b>semana ${nSem(ref)}</b> · ${rangoSemana(ref)}</span>`);
    $("hero-chips").innerHTML = chips.join("");
  }

  // ------------------------------------------------------------------ lectura y balance
  function renderLectura() {
    const d = estado.datos, s = estado.foco, ref = desplazar(s, -Number(estado.ref));
    const conteo = { empeora: 0, mejora: 0, estable: 0, sin_dato: 0 };
    const filas = d.variables.map((v) => ({ v, f: fila(v.codigo, s) })).filter((x) => x.f);
    filas.forEach(({ f }) => { conteo[f.tendencia]++; });
    $("balance").innerHTML = Object.entries(conteo).map(([k, n]) =>
      `<div class="balance__item balance__item--${k}"><b>${n}</b><span>${k === "sin_dato" ? "Sin dato" : TXT_TENDENCIA[k]}</span></div>`).join("");

    const partes = [];
    const comparables = filas.length - conteo.sin_dato;
    partes.push(`En la <strong>semana ${nSem(s)}</strong> (${rangoSemana(s)}), frente a la semana ${nSem(ref)}, ${comparables
      ? `<strong>${conteo.empeora}</strong> de ${comparables} variables comparables empeoran y <strong>${conteo.mejora}</strong> mejoran.`
      : "no hay variables con dato en ambas semanas para comparar."}`);

    const n34 = fila("NINO34_SSTA", s);
    if (n34?.valor != null) {
      const dl = n34.delta_abs != null ? `, ${n34.delta_abs > 0 ? "sube" : n34.delta_abs < 0 ? "baja" : "se mantiene"} ${fmt(Math.abs(n34.delta_abs))} °C` : "";
      partes.push(`La anomalía Niño 3.4 es <strong>${fmtSigno(n34.valor)} °C</strong> (${esc(n34.nivel_etiqueta)})${dl}.`);
    } else {
      const ult = d.series.NINO34_SSTA.filter((o) => o.valor != null && o.semana_iso <= s).pop();
      if (ult) partes.push(`NOAA aún no publica Niño 3.4 para esta semana; último dato <strong>${fmtSigno(ult.valor)} °C</strong> (semana ${nSem(ult.semana_iso)}).`);
    }
    const dim = d.dim_semana.find((x) => x.semana_iso === s);
    if (dim.semana_evento > 0 && d.analogos.length) {
      const comps = d.analogos.map((a) => {
        const p = a.series.NINO34_SSTA.find((x) => x.semana_evento === dim.semana_evento);
        return p ? `${esc(a.id_evento)}: ${fmtSigno(p.valor)} °C` : null;
      }).filter(Boolean);
      if (comps.length) partes.push(`En la misma semana del evento (${dim.semana_evento}), los análogos registraban ${comps.join(" · ")}.`);
    }
    const emb = fila("EMBALSES_NAL_PCT", s), icr = fila("ICR_NACIONAL", s);
    if (emb?.valor != null) partes.push(`Embalses en <strong>${fmt(emb.valor)} %</strong> (${esc(emb.nivel_etiqueta)}).`);
    if (icr?.valor != null) partes.push(`ICR nacional <strong>${fmt(icr.valor)}</strong> (${esc(icr.nivel_etiqueta)}).`);
    const peor = filas.filter((x) => x.f.tendencia === "empeora" && x.f.delta_pct != null).sort((a, b) => Math.abs(b.f.delta_pct) - Math.abs(a.f.delta_pct))[0];
    if (peor) partes.push(`Mayor deterioro relativo: <strong>${esc(peor.v.nombre)}</strong> (${fmtSigno(peor.f.delta_pct)} %).`);
    $("lectura-texto").innerHTML = partes.join(" ");
  }

  // ------------------------------------------------------------------ tarjetas
  function renderTarjetas() {
    estado.sparks.forEach((c) => c.dispose()); estado.sparks = [];
    const d = estado.datos, s = estado.foco;
    const vars = d.variables.filter((v) => estado.grupo === "todas" || v.grupo === estado.grupo);
    const nMat = d.metadata.semanas_matriz;
    $("tarjetas").innerHTML = vars.map((v, i) => {
      const f = fila(v.codigo, s) || {}, o = obs(v.codigo, s) || {};
      const valor = f.valor != null
        ? `<div class="tarjeta__valor num">${v.unidad === "°C" ? fmtSigno(f.valor, v.decimales) : valorTxt(f.valor, v)}<small>${esc(v.unidad)}</small></div>`
        : `<div><span class="tarjeta__valor tarjeta__valor--sindato">Sin dato</span></div>`;
      const flecha = { empeora: v.direccion === "sube_empeora" ? "▲" : "▼", mejora: v.direccion === "sube_empeora" ? "▼" : "▲", estable: "●", sin_dato: "–" }[f.tendencia || "sin_dato"];
      const dTxt = f.delta_abs != null ? `${fmtSigno(f.delta_abs, v.decimales)} ${esc(v.unidad)}${f.delta_pct != null ? ` (${fmtSigno(f.delta_pct)} %)` : ""}` : "";
      const refTxt = f.valor_referencia != null ? `vs ${v.unidad === "°C" ? fmtSigno(f.valor_referencia, v.decimales) : valorTxt(f.valor_referencia, v)} en sem. ${nSem(f.semana_referencia)}` : `sem. ${nSem(f.semana_referencia || s)} sin dato`;
      const nivel = f.nivel_etiqueta ? `<span class="chip-nivel chip-nivel--${f.nivel_riesgo}">${esc(f.nivel_etiqueta)}</span>` : f.valor == null ? `<span class="chip-nivel chip-nivel--sindato">Sin dato</span>` : "";
      const arrastre = f.estado_dato === "arrastre" ? ` <span class="etiqueta-arrastre" title="Valor de publicación no semanal repetido hasta la nueva publicación">Último publicado</span>` : "";
      const muestra = o.ambito === "muestra" && o.tamano_muestra ? ` · muestra ${o.tamano_muestra}` : "";
      return `<article class="tarjeta ${f.nivel_riesgo ? "tarjeta--" + f.nivel_riesgo : ""}" style="animation-delay:${i * 40}ms" title="${esc(v.descripcion)}">
        <div class="tarjeta__cab"><span class="tarjeta__nombre">${esc(v.nombre)}${arrastre}</span>${nivel}</div>
        ${valor}
        <div class="delta delta--${f.tendencia || "sin_dato"}"><span class="delta__flecha" aria-hidden="true">${flecha}</span>
          <span>${TXT_TENDENCIA[f.tendencia || "sin_dato"]}${dTxt ? " · " + dTxt : ""}</span></div>
        <div class="delta__ref" style="font-size:12px">${refTxt}</div>
        <div class="tarjeta__spark" id="spark-${v.codigo}" aria-hidden="true"></div>
        <div class="tarjeta__pie"><span>${esc(v.fuente)}${muestra}</span><span>Dato: ${fechaDato(o.fecha_dato)}</span></div>
      </article>`;
    }).join("");

    const semanas = ventanaSemanas(nMat);
    vars.forEach((v) => {
      const el = $(`spark-${v.codigo}`); if (!el) return;
      const c = echarts.init(el, null, { renderer: "svg" });
      const datos = semanas.map((x) => obs(v.codigo, x)?.valor ?? null);
      c.setOption({
        animationDuration: 700, grid: { left: 2, right: 2, top: 4, bottom: 2 },
        xAxis: { type: "category", show: false, data: semanas }, yAxis: { type: "value", show: false, scale: true },
        tooltip: { trigger: "axis", confine: true, textStyle: { fontSize: 11 }, formatter: (p) => `Sem. ${nSem(p[0].axisValue)}: ${p[0].value == null ? "Sin dato" : fmt(p[0].value, v.decimales) + " " + v.unidad}` },
        series: [{
          type: "line", data: datos, smooth: .3, symbol: "circle", symbolSize: (val, p) => p.dataIndex === datos.length - 1 ? 7 : 0, connectNulls: false,
          lineStyle: { width: 2, color: COLOR.cian }, itemStyle: { color: COLOR.cianTexto },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(67,178,215,.28)" }, { offset: 1, color: "rgba(67,178,215,0)" }]) }
        }],
      });
      estado.sparks.push(c);
    });
  }

  function ventanaSemanas(n) {
    const semanas = estado.datos.dim_semana.map((x) => x.semana_iso);
    const i = semanas.indexOf(estado.foco);
    return semanas.slice(Math.max(0, i - n + 1), i + 1);
  }

  // ------------------------------------------------------------------ análogos
  function renderAnalogos() {
    const d = estado.datos, cod = estado.analogoVar, v = varPorCodigo(cod);
    const sel = $("sel-analogo-var");
    if (!sel.options.length) sel.innerHTML = d.variables.filter((x) => x.en_analogos).map((x) => `<option value="${x.codigo}">${esc(x.nombre)}</option>`).join("");
    sel.value = cod;
    const porEvento = estado.alinear === "evento";
    $("analogos-desc").textContent = porEvento
      ? "Alineado por semana desde el inicio de cada evento (semana 1 = inicio). Valores negativos = semanas previas al inicio."
      : "Alineado por semana del año de inicio de cada evento (S1–S52 y año siguiente).";

    const xDe = (p, ev) => porEvento ? p.semana_evento : semanasEntre(`${ev.inicio_semana.slice(0, 4)}-W01`, p.semana_iso) + 1;
    const etiquetaX = (x) => porEvento ? `S${x}` : (x > 52 ? `S${x - 52} (+1)` : `S${x}`);
    const series = [];
    d.analogos.forEach((a, i) => {
      series.push({
        name: a.nombre, type: "line", smooth: .25, showSymbol: false, data: (a.series[cod] || []).map((p) => [xDe(p, a), p.valor, p.semana_iso]),
        lineStyle: { width: 2, color: COLOR.grises[i % 3], type: i === 2 ? "dashed" : "solid" }, itemStyle: { color: COLOR.grises[i % 3] }, z: 2,
      });
    });
    const ev = d.evento_vigente;
    if (ev.inicio_semana) {
      const datos = (ev.series[cod] || []).map((p) => [xDe(p, ev), p.valor, p.semana_iso]);
      const dimFoco = d.dim_semana.find((x) => x.semana_iso === estado.foco);
      const xFoco = porEvento ? dimFoco?.semana_evento : semanasEntre(`${ev.inicio_semana.slice(0, 4)}-W01`, estado.foco) + 1;
      series.push({
        name: "El Niño 2026-27 (vigente)", type: "line", smooth: .25, data: datos, symbol: "circle", symbolSize: 5, z: 5,
        lineStyle: { width: 4, color: COLOR.cian, shadowColor: "rgba(67,178,215,.45)", shadowBlur: 10 }, itemStyle: { color: COLOR.cianTexto },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(67,178,215,.25)" }, { offset: 1, color: "rgba(67,178,215,0)" }]) },
        markLine: xFoco != null ? {
          symbol: "none", silent: true, label: { formatter: `Semana foco ${nSem(estado.foco)}`, color: COLOR.azul, fontWeight: 700, fontFamily: "Nunito Sans" },
          lineStyle: { color: COLOR.azul, type: "dashed", width: 1.5 }, data: [{ xAxis: xFoco }]
        } : undefined,
      });
    }
    const bandas = [[0.5, 1, "Débil", COLOR.amarilla], [1, 1.5, "Moderado", COLOR.naranja], [1.5, 2, "Fuerte", COLOR.roja], [2, 9, "Muy fuerte", COLOR.roja]];
    series.push({
      type: "line", data: [], silent: true, markArea: {
        silent: true, data: bandas.map(([a, b, n, c], k) => [{ yAxis: a, name: n, itemStyle: { color: c, opacity: .05 + k * .02 }, label: { color: COLOR.texto, fontSize: 11, position: "insideLeft", fontFamily: "Nunito Sans" } }, { yAxis: b }]),
      },
    });

    const c = grafico("graf-analogos");
    c.setOption({
      animationDuration: 900, textStyle: { fontFamily: "Nunito Sans" },
      grid: { left: 48, right: 20, top: 48, bottom: 56 },
      legend: { top: 4, left: 0, icon: "roundRect", itemWidth: 16, itemHeight: 4, textStyle: { color: COLOR.fuerte, fontWeight: 600 } },
      tooltip: {
        trigger: "axis", backgroundColor: "#fff", borderColor: COLOR.linea, textStyle: { color: COLOR.fuerte },
        formatter: (ps) => `<b>${etiquetaX(ps[0].value[0])}</b><br>` + ps.filter((p) => p.seriesName).map((p) => `${p.marker}${esc(p.seriesName)}: <b>${fmtSigno(p.value[1])} °C</b> <span style="color:#888">(${p.value[2]})</span>`).join("<br>")
      },
      xAxis: {
        type: "value", min: porEvento ? -8 : 1, max: porEvento ? 80 : 90, axisLabel: { formatter: etiquetaX, color: COLOR.texto }, splitLine: { show: false },
        name: porEvento ? "Semanas desde el inicio del evento" : "Semana del año de inicio", nameLocation: "middle", nameGap: 32, nameTextStyle: { color: COLOR.texto }
      },
      yAxis: { type: "value", name: `${v.nombre} (°C)`, nameTextStyle: { color: COLOR.texto, align: "left" }, axisLabel: { color: COLOR.texto, formatter: (x) => fmt(x, 1) }, splitLine: { lineStyle: { color: "#EEF0F2" } } },
      dataZoom: [{ type: "inside" }],
      series,
    }, true);

    const tarjetas = [];
    if (ev.inicio_semana) {
      const u = (ev.series[cod] || []).filter((p) => p.semana_evento >= 1).pop();
      tarjetas.push(`<div class="analogo analogo--vigente"><i style="background:${COLOR.cian}"></i><div><strong>El Niño 2026-27</strong>Inicio sem. ${nSem(ev.inicio_semana)} de ${ev.inicio_semana.slice(0, 4)} · último ${u ? fmtSigno(u.valor) + " °C (S" + u.semana_evento + ")" : "—"}</div></div>`);
    }
    d.analogos.forEach((a, i) => {
      const pts = (a.series[cod] || []).filter((p) => p.semana_evento >= 1);
      const pico = pts.reduce((m, p) => (!m || p.valor > m.valor ? p : m), null);
      tarjetas.push(`<div class="analogo" title="${esc(a.nota)}"><i style="background:${COLOR.grises[i % 3]}"></i><div><strong>${esc(a.nombre)}</strong>Inicio ${a.inicio_semana} · pico ${pico ? fmtSigno(pico.valor) + " °C en S" + pico.semana_evento : "—"} · ONI pico ${fmt(a.oni_pico, 1)}</div></div>`);
    });
    $("analogos-resumen").innerHTML = tarjetas.join("");
  }

  function grafico(id) {
    if (!estado.graficos[id]) estado.graficos[id] = echarts.init($(id), null, { renderer: "canvas" });
    return estado.graficos[id];
  }

  // ------------------------------------------------------------------ matriz
  function renderMatriz() {
    const d = estado.datos, semanas = ventanaSemanas(d.metadata.semanas_matriz);
    let html = `<thead><tr><th scope="col">Variable</th>${semanas.map((s) => `<th scope="col" class="semana ${s === estado.foco ? "foco" : ""}">S${nSem(s)}<small>${fechaCorta(isoInicio(s))}</small></th>`).join("")}</tr></thead><tbody>`;
    Object.entries(GRUPOS).forEach(([g, nombre]) => {
      const vars = d.variables.filter((v) => v.grupo === g);
      if (!vars.length) return;
      html += `<tr class="grupo-fila"><td colspan="${semanas.length + 1}">${nombre}</td></tr>`;
      vars.forEach((v) => {
        html += `<tr><th scope="row" style="background:#fff;font-weight:400;border-bottom:1px solid #EEF0F2"><span class="var-nombre">${esc(v.nombre)}</span><span class="var-meta">${esc(v.unidad)} · ${esc(v.fuente)}</span></th>`;
        semanas.forEach((s) => {
          const f = fila(v.codigo, s, "1") || {}, o = obs(v.codigo, s) || {};
          const foco = s === estado.foco ? " foco" : "";
          if (f.valor == null) { html += `<td class="celda${foco}"><div class="celda__in celda__in--sindato" title="Sin dato · ${esc(v.nombre)} · semana ${nSem(s)}">Sin dato</div></td>`; return; }
          const cls = f.nivel_riesgo ? `celda__in--${f.nivel_riesgo}` : "celda__in--neutro";
          const fl = { empeora: ["▲", COLOR.roja], mejora: ["▼", COLOR.sin], estable: ["●", COLOR.texto], sin_dato: ["", COLOR.texto] }[f.tendencia];
          const flecha = f.tendencia === "empeora" || f.tendencia === "mejora"
            ? ((f.delta_abs > 0) ? "▲" : "▼") : fl[0];
          const tip = `${v.nombre} · semana ${nSem(s)}\nValor: ${fmt(f.valor, v.decimales)} ${v.unidad}${f.nivel_etiqueta ? " (" + f.nivel_etiqueta + ")" : ""}\nVs semana previa: ${f.delta_abs != null ? fmtSigno(f.delta_abs, v.decimales) + " · " + TXT_TENDENCIA[f.tendencia] : "sin dato"}\nFuente: ${v.fuente} · dato ${fechaDato(o.fecha_dato)}${f.estado_dato === "arrastre" ? "\nÚltimo publicado (arrastre)" : ""}`;
          html += `<td class="celda${foco}"><div class="celda__in ${cls}" title="${esc(tip)}">${v.unidad === "°C" ? fmtSigno(f.valor, v.decimales) : compacto(f.valor, v)}${f.estado_dato === "arrastre" ? ' <span class="arr">↻</span>' : ""}<small style="color:${fl[1]}">${flecha}${f.delta_abs != null && f.tendencia !== "estable" ? " " + compacto(Math.abs(f.delta_abs), v) : ""}</small></div></td>`;
        });
        html += "</tr>";
      });
    });
    $("matriz").innerHTML = html + "</tbody>";
  }

  const compacto = (x, v) => Math.abs(x) >= 1e6 ? fmt(x / 1e6, 2) + " M" : Math.abs(x) >= 1e4 ? fmt(x / 1e3, 0) + " k" : fmt(x, v.decimales);

  function exportarCSV() {
    const d = estado.datos, semanas = ventanaSemanas(d.metadata.semanas_matriz);
    const num = (x) => x == null ? "Sin dato" : String(x).replace(".", ",");
    const filas = [["codigo", "variable", "unidad", "fuente", ...semanas.flatMap((s) => [`${s} valor`, `${s} delta_vs_previa`, `${s} tendencia`, `${s} nivel`])]];
    d.variables.forEach((v) => {
      filas.push([v.codigo, v.nombre, v.unidad, v.fuente, ...semanas.flatMap((s) => {
        const f = fila(v.codigo, s, "1") || {};
        return [num(f.valor), f.delta_abs == null ? "" : num(f.delta_abs), f.tendencia || "sin_dato", f.nivel_etiqueta || ""];
      })]);
    });
    filas.push([]); filas.push([`Generado ${d.metadata.generado_en}`, `Config ${d.metadata.version_config}`, "Uso interno CRA"]);
    const csv = "\uFEFF" + filas.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `comparativo_semanal_${estado.foco}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("CSV exportado");
  }

  // ------------------------------------------------------------------ regiones e impacto
  function renderRegiones() {
    const semanas = ventanaSemanas(16);
    const regiones = [["NINO34_SSTA", COLOR.cian, 4], ["NINO12_SSTA", COLOR.azul, 2], ["NINO3_SSTA", "#6E7B88", 2], ["NINO4_SSTA", "#A3AEB8", 2]];
    grafico("graf-regiones").setOption({
      animationDuration: 800, textStyle: { fontFamily: "Nunito Sans" },
      grid: { left: 40, right: 12, top: 40, bottom: 28 },
      legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 14, itemHeight: 4, textStyle: { color: COLOR.fuerte } },
      tooltip: { trigger: "axis", valueFormatter: (x) => x == null ? "Sin dato" : fmtSigno(x) + " °C" },
      xAxis: { type: "category", data: semanas, axisLabel: { formatter: (s) => "S" + nSem(s), color: COLOR.texto } },
      yAxis: { type: "value", axisLabel: { formatter: (x) => fmt(x, 1), color: COLOR.texto }, splitLine: { lineStyle: { color: "#EEF0F2" } } },
      series: regiones.map(([cod, col, w]) => ({
        name: varPorCodigo(cod).nombre.replace("Anomalía ", ""), type: "line", smooth: .2, connectNulls: false, symbolSize: 4,
        data: semanas.map((s) => obs(cod, s)?.valor ?? null), lineStyle: { width: w, color: col }, itemStyle: { color: col },
        markLine: cod === "NINO34_SSTA" ? { symbol: "none", silent: true, lineStyle: { color: COLOR.naranja, type: "dotted" }, label: { formatter: "+0,5 °C", color: COLOR.texto, fontSize: 10 }, data: [{ yAxis: 0.5 }] } : undefined,
      })),
    }, true);
  }

  function renderImpacto() {
    const semanas = ventanaSemanas(16);
    grafico("graf-impacto").setOption({
      animationDuration: 800, textStyle: { fontFamily: "Nunito Sans" },
      grid: { left: 44, right: 44, top: 40, bottom: 28 },
      legend: { top: 0, left: 0, textStyle: { color: COLOR.fuerte } },
      tooltip: { trigger: "axis", formatter: (ps) => `<b>Semana ${nSem(ps[0].axisValue)}</b><br>` + ps.map((p) => `${p.marker}${p.seriesName}: <b>${p.value == null ? "Sin dato" : fmt(p.value, 1)}</b>`).join("<br>") },
      xAxis: { type: "category", data: semanas, axisLabel: { formatter: (s) => "S" + nSem(s), color: COLOR.texto } },
      yAxis: [
        { type: "value", name: "Embalses %", min: 0, max: 100, nameTextStyle: { color: COLOR.texto }, axisLabel: { color: COLOR.texto }, splitLine: { lineStyle: { color: "#EEF0F2" } } },
        { type: "value", name: "ICR", min: 0, max: 100, nameTextStyle: { color: COLOR.texto }, axisLabel: { color: COLOR.texto }, splitLine: { show: false } },
      ],
      series: [
        {
          name: "Embalses (% vol. útil)", type: "bar", barMaxWidth: 22, data: semanas.map((s) => obs("EMBALSES_NAL_PCT", s)?.valor ?? null),
          itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: COLOR.cian }, { offset: 1, color: "#A6DCEE" }]) },
          markLine: { symbol: "none", silent: true, lineStyle: { color: COLOR.roja, type: "dotted" }, label: { formatter: "Crítico 40 %", fontSize: 10, color: COLOR.texto }, data: [{ yAxis: 40 }] }
        },
        {
          name: "ICR nacional", type: "line", yAxisIndex: 1, connectNulls: false, symbol: "circle", symbolSize: 8, data: semanas.map((s) => obs("ICR_NACIONAL", s)?.valor ?? null),
          lineStyle: { width: 3, color: COLOR.azul }, itemStyle: { color: COLOR.azul }
        },
      ],
    }, true);
  }

  // ------------------------------------------------------------------ departamentos
  function renderDeptos() {
    const d = estado.datos, s = estado.foco, ref = desplazar(s, -Number(estado.ref));
    const foco = d.fct_depto_semana.filter((x) => x.semana_iso === s);
    const prev = Object.fromEntries(d.fct_depto_semana.filter((x) => x.semana_iso === ref).map((x) => [x.cod_depto, x]));
    const tabla = $("tabla-deptos");
    $("deptos-desc").textContent = foco.length
      ? `Corte oro del ${fechaDato(foco[0].fecha_corte)} vs ${prev[foco[0].cod_depto] ? "corte del " + fechaDato(prev[foco[0].cod_depto].fecha_corte) : "semana " + nSem(ref) + " (sin corte publicado)"}.`
      : "Último corte oro publicado en cada semana.";
    if (!foco.length) { tabla.innerHTML = `<tbody><tr><td class="vacio">No hay corte oro publicado en la semana ${nSem(s)}. Seleccione otra semana o actualice los datos.</td></tr></tbody>`; return; }
    const nivFoco = d.niveles_municipio[s] || {}, nivRef = d.niveles_municipio[ref] || {};
    const orden = { sin_alerta: 0, sin_dato: -1, amarilla: 1, naranja: 2, roja: 3 };
    const nivelIcr = (x) => x == null ? ["sindato", "Sin dato"] : x >= 75 ? ["roja", "Roja"] : x >= 60 ? ["naranja", "Naranja"] : x >= 40 ? ["amarilla", "Amarilla"] : ["sin", "Sin alerta"];
    const filas = foco.sort((a, b) => (b.icr_medio_ponderado ?? -1) - (a.icr_medio_ponderado ?? -1)).map((x) => {
      const p = prev[x.cod_depto];
      const dIcr = p && x.icr_medio_ponderado != null && p.icr_medio_ponderado != null ? x.icr_medio_ponderado - p.icr_medio_ponderado : null;
      const dPob = p ? x.poblacion_naranja_roja - p.poblacion_naranja_roja : null;
      let peor = 0, mejor = 0;
      Object.entries(nivFoco).filter(([, m]) => m.cod_depto === x.cod_depto).forEach(([div, m]) => {
        const r = nivRef[div]; if (!r) return;
        const dd = (orden[m.nivel] ?? -1) - (orden[r.nivel] ?? -1);
        if (dd > 0) peor++; else if (dd < 0) mejor++;
      });
      const [cls, et] = nivelIcr(x.icr_medio_ponderado);
      const cn = x.conteo_niveles || {};
      const colorD = (v, inv) => v == null || v === 0 ? COLOR.texto : (v > 0) !== inv ? COLOR.roja : COLOR.sin;
      return `<tr>
        <td><strong style="color:${COLOR.fuerte}">${esc(x.departamento)}</strong> <span style="font-size:11px">${esc(x.cod_depto)}</span></td>
        <td class="n"><span class="chip-nivel chip-nivel--${cls}">${et}</span> <b style="color:${COLOR.fuerte}">${fmt(x.icr_medio_ponderado)}</b><span class="barra-icr"><i style="width:${x.icr_medio_ponderado || 0}%;background:var(--alerta-${cls === "sin" ? "sin" : cls === "sindato" ? "sin-dato" : cls})"></i></span></td>
        <td class="n">${p ? fmt(p.icr_medio_ponderado) : '<span class="chip-nivel chip-nivel--sindato">Sin dato</span>'}</td>
        <td class="n" style="color:${colorD(dIcr)};font-weight:700">${dIcr == null ? "—" : fmtSigno(dIcr)}</td>
        <td class="n">${fmt(x.poblacion_naranja_roja, 0)}</td>
        <td class="n" style="color:${colorD(dPob)};font-weight:700">${dPob == null ? "—" : fmtSigno(dPob, 0)}</td>
        <td class="n">${cn.roja ?? 0} / ${cn.naranja ?? 0} / ${cn.amarilla ?? 0} / ${cn.sin_alerta ?? 0}</td>
        <td class="n">${p ? `<span style="color:${COLOR.roja};font-weight:700">▲ ${peor}</span> · <span style="color:${COLOR.sin};font-weight:700">▼ ${mejor}</span>` : "—"}</td>
      </tr>`;
    });
    tabla.innerHTML = `<thead><tr><th>Departamento</th><th class="n">ICR sem. ${nSem(s)}</th><th class="n">ICR sem. ${nSem(ref)}</th><th class="n">Δ ICR</th><th class="n">Población naranja+roja</th><th class="n">Δ población</th><th class="n">Mun. R / N / A / S</th><th class="n">Cambios de nivel</th></tr></thead><tbody>${filas.join("")}</tbody>`;
  }

  // ------------------------------------------------------------------ fuentes
  function renderFuentes() {
    const aviso = estado.datos.metadata.frescura_horas_aviso;
    $("fuentes").innerHTML = estado.datos.fuentes.map((f) => {
      const [cls, et] = f.frescura_horas == null ? ["sindato", "Sin captura"] : f.frescura_horas <= aviso ? ["sin", "Al día"] : ["amarilla", "Desactualizada"];
      return `<div class="fuente"><strong>${esc(f.fuente)}</strong><span class="chip-nivel chip-nivel--${cls}">${et}</span>
        <dl><dt>Último dato</dt><dd>${fechaDato(f.ultima_fecha_dato)}</dd><dt>Última captura</dt><dd>${fechaHora(f.ultima_captura)}</dd>
        <dt>Antigüedad</dt><dd>${f.frescura_horas == null ? "—" : fmt(f.frescura_horas, 0) + " h"}</dd><dt>Capturas</dt><dd>${f.capturas}</dd></dl></div>`;
    }).join("");
  }

  // ------------------------------------------------------------------ actualizar (RF-SEM-05)
  async function actualizar() {
    if (!estado.api) {
      toast("La actualización requiere el servidor del tablero (iniciar_tablero.ps1).", "error", 6000);
      return;
    }
    const btn = $("btn-actualizar");
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Requested-With": "Vigia-Client"
      };
      const adminToken = window.localStorage?.getItem("VIGIA_ADMIN_TOKEN");
      if (adminToken) {
        headers["X-Vigia-Auth-Token"] = adminToken;
      }
      const r = await fetch(API.actualizar, { method: "POST", headers, body: JSON.stringify({ modo: estado.modo }) });
      const j = await r.json();
      if (r.status === 409) { toast("Ya hay una actualización en curso. Mostrando su progreso.", "error"); }
      else if (!r.ok) throw new Error(j.error || r.status);
      btn.disabled = true; btn.classList.add("girando");
      mostrarProgreso(j); sondear();
    } catch (e) {
      toast("No pudimos iniciar la actualización. Intenta de nuevo en unos minutos; si persiste, avisa a TI.", "error", 6000);
    }
  }

  function sondear() {
    clearInterval(estado.sondeo);
    estado.sondeo = setInterval(async () => {
      try {
        const j = await (await fetch(API.estado, { cache: "no-store" })).json();
        mostrarProgreso(j);
        if (j.estado !== "en_ejecucion") {
          clearInterval(estado.sondeo);
          const btn = $("btn-actualizar"); btn.disabled = false; btn.classList.remove("girando");
          if (j.estado === "fallido") { toast(`La actualización falló: ${j.mensaje}. Se conserva el último corte publicado.`, "error", 8000); return; }
          const fuePrevio = estado.foco === estado.datos.metadata.semana_vigente;
          await cargarDatos();
          if (fuePrevio) estado.foco = estado.datos.metadata.semana_vigente;
          renderTodo();
          toast(j.estado === "parcial" ? "Datos actualizados con algunas fuentes fallidas (ver progreso)." : `Datos actualizados · semana vigente ${nSem(estado.datos.metadata.semana_vigente)}.`, j.estado === "parcial" ? "error" : "ok", 6000);
          if (j.estado === "exitoso") setTimeout(() => { $("panel-progreso").hidden = true; }, 5000);
        }
      } catch { /* servidor ocupado: se reintenta en el siguiente ciclo */ }
    }, 1200);
  }

  function mostrarProgreso(j) {
    const panel = $("panel-progreso");
    panel.hidden = false;
    panel.classList.toggle("activo", j.estado === "en_ejecucion");
    const titulos = { en_ejecucion: "Actualizando datos del tablero…", exitoso: "Actualización completada", parcial: "Actualización completada con fuentes fallidas", fallido: "La actualización falló" };
    $("progreso-titulo").textContent = titulos[j.estado] || "Actualización";
    $("progreso-sub").textContent = j.estado === "en_ejecucion"
      ? `Modo ${j.modo === "completo" ? "captura completa" : "solo recalcular"} · iniciada ${fechaHora(j.inicio)}. Puede seguir consultando el tablero.`
      : (j.mensaje || "") + (j.fin ? ` · ${fechaHora(j.fin)}` : "");
    const pasos = j.pasos || [];
    const total = j.modo === "completo" ? 9 : 2;
    const hechos = pasos.filter((p) => p.estado !== "en_ejecucion").length;
    $("progreso-barra").style.width = j.estado === "en_ejecucion" ? `${Math.min(95, Math.max(6, (hechos / total) * 100))}%` : "100%";
    const etq = { en_ejecucion: "En curso", exitosa: "Exitosa", sin_cambios: "Sin cambios", fallida: "Fallida" };
    $("progreso-pasos").innerHTML = pasos.map((p) => `<li><span class="estado-ico estado-ico--${p.estado}">${p.estado === "fallida" ? "!" : p.estado === "en_ejecucion" ? "" : "✓"}</span>
      <div><strong>${esc(p.paso)} · ${etq[p.estado] || esc(p.estado)}</strong><small title="${esc(p.mensaje)}">${esc(p.mensaje)}</small></div></li>`).join("");
  }

  // ------------------------------------------------------------------ eventos
  function irA(s) { estado.foco = s; renderTodo(); }
  function enlazar() {
    $("btn-actualizar").addEventListener("click", actualizar);
    const menu = $("menu-modo"), btnModo = $("btn-modo");
    btnModo.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; btnModo.setAttribute("aria-expanded", String(!menu.hidden)); });
    document.addEventListener("click", () => { menu.hidden = true; btnModo.setAttribute("aria-expanded", "false"); });
    menu.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      estado.modo = b.dataset.modo;
      menu.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      $("btn-actualizar").querySelector("span").textContent = estado.modo === "completo" ? "Actualizar datos" : "Recalcular";
    }));
    $("btn-cerrar-progreso").addEventListener("click", () => { $("panel-progreso").hidden = true; });
    $("btn-semana-prev").addEventListener("click", () => { const ss = estado.datos.dim_semana.map((x) => x.semana_iso); irA(ss[ss.indexOf(estado.foco) - 1]); });
    $("btn-semana-next").addEventListener("click", () => { const ss = estado.datos.dim_semana.map((x) => x.semana_iso); irA(ss[ss.indexOf(estado.foco) + 1]); });
    $("sel-semana").addEventListener("change", (e) => irA(e.target.value));
    document.querySelectorAll("[data-ref]").forEach((b) => b.addEventListener("click", () => {
      estado.ref = b.dataset.ref;
      document.querySelectorAll("[data-ref]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      renderHero(); renderLectura(); renderTarjetas(); renderDeptos();
    }));
    document.querySelectorAll("[data-grupo]").forEach((b) => b.addEventListener("click", () => {
      estado.grupo = b.dataset.grupo;
      document.querySelectorAll("[data-grupo]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      renderTarjetas();
    }));
    document.querySelectorAll("[data-alinear]").forEach((b) => b.addEventListener("click", () => {
      estado.alinear = b.dataset.alinear;
      document.querySelectorAll("[data-alinear]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      renderAnalogos();
    }));
    $("sel-analogo-var").addEventListener("change", (e) => { estado.analogoVar = e.target.value; renderAnalogos(); });
    $("btn-exportar").addEventListener("click", exportarCSV);
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("select, input")) return;
      if (e.key === "ArrowLeft" && !$("btn-semana-prev").disabled) $("btn-semana-prev").click();
      if (e.key === "ArrowRight" && !$("btn-semana-next").disabled) $("btn-semana-next").click();
    });
    let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { Object.values(estado.graficos).forEach((c) => c.resize()); estado.sparks.forEach((c) => c.resize()); }, 150); });
  }

  async function iniciar() {
    enlazar();
    try {
      await cargarDatos();
      renderTodo();
      if (estado.api) {
        const j = await (await fetch(API.estado, { cache: "no-store" })).json();
        if (j.estado === "en_ejecucion") { $("btn-actualizar").disabled = true; $("btn-actualizar").classList.add("girando"); mostrarProgreso(j); sondear(); }
      }
    } catch (e) {
      console.error(e);
      $("contenido").innerHTML = `<section class="bloque vacio"><h2 class="titulo-bloque">No pudimos cargar los datos.</h2><p>Intenta de nuevo en unos minutos; si persiste, avisa a TI.</p><button class="btn btn--primario" onclick="location.reload()">Reintentar</button></section>`;
    }
  }
  document.addEventListener("DOMContentLoaded", iniciar);
})();
