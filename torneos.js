// ============================================================
//  TORNEOS.JS · catálogo de torneos, inicio, inscripción,
//  tablas por torneo y estadísticas según el juego.
//  LDV NECOCHENSE (LIGA DE VIRGOS)
// ============================================================

// ---------- Helpers ----------
let TORNEO_CUPOS = {};      // con Supabase: { idTorneo: { cupo, anotados, estado } }
let FILTRO_JUEGO = "";      // juego elegido en el filtro del inicio / torneos
const torneoById = id => TORNEOS.find(t => t.id === id);
const juegoDe = t => JUEGOS[(t && t.juego) || "eafc27"] || JUEGOS.eafc27;
const juegoDeLiga = id => juegoDe(torneoById(id));
const nombreLiga = id => { const t = torneoById(id); return t ? t.nombre : "Sin torneo"; };
const statsDe = J => STATS_JUEGO[J.stats] || STATS_JUEGO.futbol;
const conEquipos = t => !!t && t.equipos === "sorteo";
const ESTADO_TXT = { abierto: "Inscripción abierta", completo: "Cupo completo", en_curso: "En juego", finalizado: "Finalizado" };

// Equipo de un jugador. Si todavía no tiene (sorteo pendiente) o el juego no usa equipos,
// se arma una "insignia" con el color del juego y las iniciales del jugador.
function equipoDe(p) {
  const real = p && EQUIPOS.find(e => e.id === p.equipoId); if (real) return real;
  const tor = torneoById(p && p.liga), J = juegoDe(tor), sorteo = conEquipos(tor);
  const ini = String((p && p.nombre) || "?").replace(/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ ]/g, "").trim().slice(0, 2).toUpperCase() || "?";
  return { id: 0, nombre: sorteo ? "Equipo por sorteo" : J.nombre, estrellas: 0, c1: J.color, c2: "#0a1530", precio: 0, iniciales: sorteo ? "?" : ini, sinEquipo: true };
}

// Cupo y estado de un torneo (con Supabase sale de la base; en modo ejemplo, de data.js)
function cupoInfo(t) {
  let anotados = 0, cupo = t.cupo, estado = "abierto";
  if (LIVE) { const c = TORNEO_CUPOS[t.id]; if (c) { anotados = c.anotados; cupo = c.cupo; estado = c.estado || "abierto"; } }
  else anotados = (t.demo || 0) + getInscriptos().filter(x => x.liga === t.id).length;
  const completo = anotados >= cupo;
  const estadoVis = estado !== "abierto" ? estado : completo ? "completo" : "abierto";
  return { anotados, cupo, estado, estadoVis, completo, abierto: estado === "abierto" && !completo, libres: Math.max(0, cupo - anotados), pct: Math.min(100, Math.round(anotados / (cupo || 1) * 100)) };
}
const precioInscTxt = t => t.inscripcion.tipo === "fija" ? $money(t.inscripcion.monto) : `${$money(precioPorEstrellas(3))} (3★) a ${$money(precioPorEstrellas(5))} (5★)`;
const precioDesde = t => t.inscripcion.tipo === "fija" ? t.inscripcion.monto : precioPorEstrellas(3);
const totalPremios = t => t.premios.reduce((a, p) => a + p[1], 0);

// ---------- Ilustraciones por juego (propias, sin logos) ----------
function juegoArtSVG(j, uid) {
  const g = "g" + uid;
  const base = (c1, c2, inner) => `<svg class="tart-svg" viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="170" fill="url(#${g})"/>${inner}</svg>`;
  const ball = (x, y, r) => `<g transform="translate(${x} ${y}) scale(${r / 38})"><circle r="38" fill="#fff"/><path d="M0-14L13-4L8 12H-8L-13-4Z" fill="#111"/><path d="M0-14V-37M13-4L35-12M8 12L22 31M-8 12L-22 31M-13-4L-35-12" stroke="#111" stroke-width="3" fill="none"/></g>`;
  switch (j) {
    case "pes6":
      return base("#0b2c6e", "#030a22", `<g stroke="rgba(255,255,255,.07)">${Array.from({ length: 17 }, (_, i) => `<line x1="0" y1="${i * 10}" x2="400" y2="${i * 10}"/>`).join("")}</g>
        <g fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"><rect x="20" y="14" width="360" height="142"/><line x1="200" y1="14" x2="200" y2="156"/><circle cx="200" cy="85" r="32"/><rect x="20" y="48" width="52" height="74"/><rect x="328" y="48" width="52" height="74"/></g>${ball(338, 66, 32)}`);
    case "nba2k27":
      return base("#8a3300", "#1c0a00", `<g fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"><rect x="16" y="12" width="368" height="146"/><rect x="16" y="52" width="110" height="66"/><circle cx="126" cy="85" r="26"/><path d="M16 22Q190 85 16 148"/></g>
        <g transform="translate(338 68) scale(.8)"><circle r="38" fill="#ff8a3d"/><g stroke="#5a2200" stroke-width="3" fill="none"><path d="M-38 0H38M0-38V38"/><path d="M-27-26Q-9 0 -27 26M27-26Q9 0 27 26"/></g></g>`);
    case "mk1": case "mk3": {
      const c = j === "mk1" ? "#ff3b4e" : "#ffd23d", bg = j === "mk1" ? ["#4a0610", "#12020a"] : ["#3a2e00", "#120d00"];
      return base(bg[0], bg[1], `<g fill="${c}"><path d="M250-10L292-10L196 182L154 182Z" opacity=".95"/><path d="M300-10L330-10L240 182L210 182Z" opacity=".65"/><path d="M345-10L362-10L282 182L265 182Z" opacity=".4"/></g>
        <circle cx="120" cy="85" r="46" fill="none" stroke="${c}" stroke-width="3" opacity=".6"/><text x="120" y="104" text-anchor="middle" font-family="Barlow Condensed,Arial" font-weight="800" font-style="italic" font-size="58" fill="${c}">VS</text>`);
    }
    case "f1":
      return base("#1b1b26", "#07070c", `<path d="M20 142C20 60 120 36 190 70S310 118 380 44" stroke="rgba(255,255,255,.2)" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M20 142C20 60 120 36 190 70S310 118 380 44" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-dasharray="10 12" fill="none"/>
        <g>${Array.from({ length: 12 }, (_, i) => `<rect x="${296 + (i % 6) * 14}" y="${12 + Math.floor(i / 6) * 14}" width="14" height="14" fill="${(i + Math.floor(i / 6)) % 2 ? "#fff" : "#111"}"/>`).join("")}</g>
        <g transform="translate(120 128)"><path d="M-62 12L-40 0H18L62 7V16H-62Z" fill="#ff5a4d"/><path d="M-8-6L6-12H22L18 0H-8Z" fill="#fff" opacity=".9"/><rect x="48" y="-3" width="18" height="6" fill="#ff5a4d"/><rect x="-70" y="-4" width="18" height="20" fill="#111"/><circle cx="-38" cy="16" r="10" fill="#111"/><circle cx="34" cy="16" r="10" fill="#111"/></g>`);
    default: // eafc27 y fútbol general
      return base("#0c6a42", "#031a10", `<path d="M0 0L130 0L50 170L-80 170Z" fill="rgba(255,255,255,.05)"/><path d="M230 0L360 0L280 170L150 170Z" fill="rgba(255,255,255,.05)"/>
        <g fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2"><rect x="20" y="14" width="360" height="142"/><line x1="200" y1="14" x2="200" y2="156"/><circle cx="200" cy="85" r="32"/><rect x="20" y="48" width="52" height="74"/><rect x="328" y="48" width="52" height="74"/></g>${ball(338, 66, 32)}`);
  }
}

// ---------- Tarjeta de torneo ----------
function tarjetaTorneo(t) {
  const J = juegoDe(t), c = cupoInfo(t), ins = t.inscripcion;
  const filas = [
    [t.unidad === "equipos" ? "Equipos" : t.unidad === "pilotos" ? "Pilotos" : "Jugadores", `${t.cupo} ${t.unidad}`],
    ["Duración", t.duracion],
    ["Inscripción", ins.tipo === "fija" ? $money(ins.monto) : `desde ${$money(precioPorEstrellas(3))} (3★) hasta ${$money(precioPorEstrellas(5))} (5★)`],
    ...(t.porFecha ? [["Cada " + t.porFecha.txt.replace("por ", ""), $money(t.porFecha.monto)]] : []),
  ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  const prem = t.premios.map(([k, v]) => `<li class="pr"><span>${k}</span><b>${$money(v)}</b></li>`).join("");
  const boton = c.abierto
    ? `<a class="btn primary small" href="#/inscripcion/${t.id}">Inscribirme</a>`
    : `<span class="btn small off">${ESTADO_TXT[c.estadoVis]}</span>`;
  return `<article class="tcard ${t.destacado ? "big" : ""}" style="--c:${J.color}" data-juego="${t.juego}">
    <a class="tart" href="#/torneo/${t.id}">${juegoArtSVG(t.juego, t.id)}
      <span class="tj">${J.nombre}</span><span class="tdep">${J.deporte}</span>
      <div class="tt"><h3>${esc(t.nombre)}</h3><small>${t.formato}</small></div></a>
    <div class="tbody">
      <ul class="tdet">${filas}</ul>
      <ul class="tdet prem">${prem}</ul>
      <div class="tcupo"><div class="tc-top"><span><b>${c.anotados}</b> / ${c.cupo} anotados</span><em>${c.abierto ? c.libres + " lugares libres" : ESTADO_TXT[c.estadoVis]}</em></div>
        <div class="progress"><i style="width:${c.pct}%"></i></div>
        <p class="tnote">Cuando se completa el cupo, el torneo arranca.</p></div>
      <div class="tbtns">${boton}<a class="btn small" href="#/torneo/${t.id}">Ver detalles</a></div>
    </div></article>`;
}
function chipsJuegosHTML(sel) {
  const usados = Object.values(JUEGOS).filter(j => TORNEOS.some(t => t.juego === j.id));
  return `<div class="fj" id="fj"><button class="fchip ${!sel ? "on" : ""}" data-fj="">Todos <i>${TORNEOS.length}</i></button>${usados.map(j =>
    `<button class="fchip ${sel === j.id ? "on" : ""}" style="--c:${j.color}" data-fj="${j.id}"><span class="fdot"></span>${j.nombre} <i>${TORNEOS.filter(t => t.juego === j.id).length}</i></button>`).join("")}</div>`;
}
const gridTorneosHTML = sel => {
  const lista = TORNEOS.filter(t => !sel || t.juego === sel);
  return lista.map(tarjetaTorneo).join("") || `<div class="card"><p class="muted">No hay torneos de ese juego todavía.</p></div>`;
};
function iniciarFiltroTorneos() {
  const fj = document.getElementById("fj"), grid = document.getElementById("tgrid"); if (!fj || !grid) return;
  const aplicar = v => {
    FILTRO_JUEGO = v;
    fj.querySelectorAll("[data-fj]").forEach(b => b.classList.toggle("on", b.dataset.fj === v));
    grid.innerHTML = gridTorneosHTML(v);
  };
  fj.addEventListener("click", e => { const b = e.target.closest("[data-fj]"); if (b) aplicar(b.dataset.fj); });
  window.aplicarFiltroJuego = aplicar;
}
// Botones que bajan hasta una sección o filtran por juego (los usa el carrusel)
document.addEventListener("click", e => {
  const g = e.target.closest("[data-gofj]");
  if (g) { e.preventDefault(); if (window.aplicarFiltroJuego) window.aplicarFiltroJuego(g.dataset.gofj); const el = document.getElementById("torneos"); if (el) el.scrollIntoView({ behavior: "smooth" }); return; }
  const s = e.target.closest("[data-scroll]");
  if (s) { e.preventDefault(); const el = document.getElementById(s.dataset.scroll); if (el) el.scrollIntoView({ behavior: "smooth" }); }
});

// ============================================================
//  INICIO
// ============================================================
function heroHTML() {
  const mayor = [...TORNEOS].sort((a, b) => b.premios[0][1] - a.premios[0][1])[0];
  const juegosBadges = Object.values(JUEGOS).map(j => `<button class="gbadge" style="--c:${j.color}" data-gofj="${j.id}"><span class="gi">${juegoArtMini(j.id)}</span><b>${j.nombre}</b><small>${j.deporte}</small></button>`).join("");
  return `<section class="hero2" id="carousel" aria-roledescription="carrusel" aria-label="Novedades de LDV Necochense">
    <div class="htrack" id="htrack">
      <article class="hs hs1"><div class="wrap hgrid">
        <div><span class="pill">Inscripciones abiertas</span>
          <h1>Competí. Ganá.<br>Hacete <em>leyenda</em>.</h1>
          <p class="lead">Torneos de videojuegos de Necochea con premios en efectivo. El campeón de la ${esc(mayor.nombre)} se lleva</p>
          <div class="hbig" data-count="${mayor.premios[0][1]}" data-money="1">${$money(mayor.premios[0][1])}</div>
          <div class="btns" style="margin-top:14px"><button class="btn primary small" data-scroll="torneos">Ver torneos</button><a class="btn small" href="#/inscripcion">Inscribirme</a></div></div>
        <div class="hart">${trophySVG("htrophy")}<div class="hring"></div></div></div></article>
      <article class="hs hs2"><div class="wrap hgrid">
        <div><span class="pill">${Object.keys(JUEGOS).length} juegos · ${TORNEOS.length} torneos</span>
          <h1>Elegí tu <em>juego</em></h1>
          <p class="lead">Fútbol, básquet, lucha y autos. Tocá un juego para ver sus torneos.</p></div>
        <div class="gbadges">${juegosBadges}</div></div></article>
      <article class="hs hs3"><div class="wrap hgrid">
        <div><span class="pill">Sorteo justo</span>
          <h1>Anotarte primero<br>no te <em>ayuda</em></h1>
          <p class="lead">Los equipos no se reservan al inscribirte. Elegís hasta 3 y, cuando se completa el cupo, se sortea el orden de elección. Todos tienen la misma chance de quedarse con los mejores.</p></div>
        <div class="hsteps"><div><b>1</b><span>Elegís hasta 3 equipos</span></div><div><b>2</b><span>Se completa el cupo</span></div><div><b>3</b><span>Sorteo del orden y asignación</span></div></div></div></article>
      <article class="hs hs4"><div class="wrap hgrid">
        <div><span class="pill">Estadísticas reales</span>
          <h1>Entretiempo.<br>Final. <em>Todo.</em></h1>
          <p class="lead">Cargamos lo mismo que muestra cada juego: goles, posesión, tiros, pases y más. Tu perfil, tus rivales y tu tabla, siempre al día.</p>
          <div class="btns" style="margin-top:14px">${LIVE ? `<a class="btn primary small" href="#/panel">Mi panel</a>` : `<a class="btn primary small" href="#/jugador/quichaproplayer">Ver perfil de ejemplo</a>`}</div></div>
        <div class="hart"><div class="hstats"><div><b>${statsDe(JUEGOS.eafc27).length}</b><span>estadísticas por partido en fútbol</span></div><div><b>2</b><span>fichas: entretiempo y final</span></div></div></div></div></article>
    </div>
    <button class="harrow l" id="prev" aria-label="Anterior">‹</button><button class="harrow r" id="next" aria-label="Siguiente">›</button>
    <div class="hdots">${[1, 2, 3, 4].map((n, k) => `<button class="hdot ${k ? "" : "on"}" aria-label="Ir a la diapositiva ${n}"></button>`).join("")}</div>
    <div class="cprog"><i></i></div></section>`;
}
// Iconito del juego para los botones del carrusel
function juegoArtMini(id) {
  const d = {
    eafc27: `<circle cx="16" cy="16" r="12" fill="#fff"/><path d="M16 9l5 4-2 6h-6l-2-6z" fill="#111"/>`,
    pes6: `<circle cx="16" cy="16" r="12" fill="#fff"/><path d="M16 9l5 4-2 6h-6l-2-6z" fill="#0b2c6e"/>`,
    nba2k27: `<circle cx="16" cy="16" r="12" fill="#ff8a3d"/><path d="M4 16h24M16 4v24M8 7q6 9 0 18M24 7q-6 9 0 18" stroke="#5a2200" stroke-width="1.6" fill="none"/>`,
    mk1: `<path d="M20 2l6 0-10 28-6 0z" fill="#ff3b4e"/><path d="M27 2l3 0-8 28-3 0z" fill="#ff3b4e" opacity=".6"/>`,
    mk3: `<path d="M20 2l6 0-10 28-6 0z" fill="#ffd23d"/><path d="M27 2l3 0-8 28-3 0z" fill="#ffd23d" opacity=".6"/>`,
    f1: `<path d="M3 20l5-4h12l9 2v3H3z" fill="#ff5a4d"/><circle cx="9" cy="23" r="3" fill="#111"/><circle cx="23" cy="23" r="3" fill="#111"/>`,
  }[id] || "";
  return `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">${d}</svg>`;
}

function vistaInicio() {
  const insc = TORNEOS.reduce((a, t) => a + cupoInfo(t).anotados, 0);
  const premios = TORNEOS.reduce((a, t) => a + totalPremios(t), 0);
  const jugados = PARTIDOS.filter(esJugado).slice(0, 4);
  const primero = TORNEOS[0];
  return `
  ${heroHTML()}

  <section class="block reveal" id="torneos"><div class="wrap">
    <div class="sec-title"><h2>Torneos <em>abiertos</em></h2><a href="#/torneos">Ver todos →</a></div>
    ${chipsJuegosHTML(FILTRO_JUEGO)}
    <div class="tgrid" id="tgrid">${gridTorneosHTML(FILTRO_JUEGO)}</div>
    <p class="muted" style="margin-top:14px;font-size:13px">Cada torneo arranca apenas se completa su cupo. El organizador te avisa por WhatsApp.${LIVE ? "" : " Los números de cupo de esta versión son de ejemplo."}</p>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="fair"><div><span class="pill">Sorteo justo de equipos</span>
      <h2>Nadie queda con lo que sobra</h2>
      <p class="muted">En los torneos de fútbol con equipos, elegir primero no te da ventaja. Tu equipo <b>no se reserva</b> al inscribirte: elegís hasta tres, por orden de preferencia, y cuando se completa el cupo se sortea el orden. Cada jugador recibe la mejor opción que siga libre. Así anotarte el último de la lista tiene exactamente la misma chance que anotarte el primero.</p></div>
      <ol class="fair-steps"><li><b>Elegís 3 equipos</b><span>En orden de preferencia, sin que nadie te los saque.</span></li><li><b>Se completa el cupo</b><span>Recién ahí se hace el sorteo.</span></li><li><b>Sorteo del orden</b><span>Se asigna a cada uno su mejor opción disponible.</span></li></ol></div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="stats-row">
      <div class="stat"><b data-count="${TORNEOS.length}">${TORNEOS.length}</b><span>Torneos</span></div>
      <div class="stat"><b data-count="${Object.keys(JUEGOS).length}">${Object.keys(JUEGOS).length}</b><span>Juegos</span></div>
      <div class="stat"><b data-count="${insc}">${insc}</b><span>Jugadores anotados</span></div>
      <div class="stat"><b>${$money(premios)}</b><span>En premios</span></div>
    </div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Últimos <em>resultados</em></h2><a href="#/torneo/${primero.id}">Ver ${esc(primero.nombre)} →</a></div>
    ${jugados.length
      ? `<div class="sbs">${jugados.map(scorebug).join("")}</div>${LIVE ? "" : `<p class="muted" style="margin-top:10px;font-size:13px">* Resultados de ejemplo. Entrá a cada partido para ver el entretiempo y el final.</p>`}`
      : `<div class="card"><p class="muted">Todavía no se jugó ningún partido. Los resultados van a aparecer acá apenas arranque el primer torneo.</p></div>`}
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Cómo <em>funciona</em></h2></div>
    <div class="steps">
      <div class="step"><div class="n">01</div><h3>Registrate</h3><p class="muted">Creás tu cuenta con tu nombre de jugador y tu ID de consola.</p></div>
      <div class="step"><div class="n">02</div><h3>Elegí torneo</h3><p class="muted">Filtrás por juego y te anotás donde quieras. Podés jugar varios.</p></div>
      <div class="step"><div class="n">03</div><h3>Pagá y confirmá</h3><p class="muted">Pagás la inscripción y el organizador aprueba tu lugar.</p></div>
      <div class="step"><div class="n">04</div><h3>Jugá y ganá</h3><p class="muted">Cuando se completa el cupo arranca. Seguí tu tabla y tus rivales desde tu panel.</p></div>
    </div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="cta-band"><div style="position:relative;z-index:1"><h3>¿Listo para competir?</h3><p class="muted" style="margin-top:6px">Elegí tu juego, anotate y mirá cómo se va llenando el cupo.</p></div>
    <button class="btn primary" style="position:relative;z-index:1" data-scroll="torneos">Elegir torneo</button></div>
  </div></section>`;
}

// ============================================================
//  TORNEOS (lista) y detalle de un torneo
// ============================================================
function vistaTorneos() {
  return `<div class="wrap fade" style="padding-top:40px" id="torneos"><div class="sec-title"><h2>Todos los <em>torneos</em></h2></div>
    ${chipsJuegosHTML(FILTRO_JUEGO)}<div class="tgrid" id="tgrid">${gridTorneosHTML(FILTRO_JUEGO)}</div></div>`;
}

function vistaTorneo(id) {
  const t = torneoById(id);
  if (!t) return `<div class="wrap" style="padding:80px 20px"><h2>Torneo no encontrado</h2><a class="btn" href="#/torneos">Ver torneos</a></div>`;
  const J = juegoDe(t), c = cupoInfo(t), tb = tablaLiga(t.id), jugados = PARTIDOS.filter(m => m.liga === t.id && esJugado(m)).slice(0, 4);
  const reglas = [
    `<li><b>Formato:</b> ${t.formato}.</li>`,
    `<li><b>Arranque:</b> el torneo empieza apenas se completa el cupo de ${t.cupo} ${t.unidad}.</li>`,
    `<li><b>Duración:</b> ${t.duracion}.</li>`,
    t.equipos === "sorteo"
      ? `<li><b>Equipos:</b> sorteo justo. Elegís hasta 3 equipos y, con el cupo completo, se sortea el orden de elección y cada uno recibe su mejor opción libre.${t.maxEstrellas ? ` En este torneo solo se pueden elegir equipos de hasta ${t.maxEstrellas} estrellas.` : ""}</li>`
      : `<li><b>Equipos / personajes:</b> libres. Se elige en cada partido, como prefieras.</li>`,
    `<li><b>Pagos:</b> inscripción de ${precioInscTxt(t)}${t.porFecha ? ` y ${$money(t.porFecha.monto)} ${t.porFecha.txt}` : ""}. El organizador confirma tu lugar cuando recibe el pago.</li>`,
    `<li><b>Premios:</b> ${t.premios.map(([k, v]) => `${k.toLowerCase()} ${$money(v)}`).join(", ")}.</li>`,
  ].join("");
  const tiers = t.inscripcion.tipo === "estrellas"
    ? `<h3 class="sub" style="margin-top:26px">Cuánto sale según el equipo</h3><div class="tier">${[[3, "Hasta 3 estrellas"], [4, "3.5 a 4 estrellas"], [4.5, "4.5 estrellas"], [5, "5 estrellas"]].map(([s, tx]) => `<div class="card ${s === 5 ? "best" : ""}"><div class="stars">${stars(s)}</div><div class="muted">${tx}</div><div class="price">${$money(precioPorEstrellas(s))}</div></div>`).join("")}</div>` : "";
  const anotados = JUGADORES.filter(p => p.liga === t.id);
  return `<div class="wrap fade">
    <div class="thero" style="--c:${J.color}">
      <div class="tart big-art">${juegoArtSVG(t.juego, "d" + t.id)}<span class="tj">${J.nombre}</span><span class="tdep">${J.deporte}</span></div>
      <div class="thead"><span class="pill">${ESTADO_TXT[c.estadoVis]}</span><h1>${esc(t.nombre)}</h1><p class="lead muted">${t.desc}</p>
        <div class="badges"><span class="badge">${t.formato}</span><span class="badge">${t.duracion}</span><span class="badge">${t.cupo} ${t.unidad}</span></div></div>
      <div class="tpanel card">
        <div class="tprizes">${t.premios.map(([k, v], i) => `<div class="${i ? "" : "main"}"><span>${k}</span><b>${$money(v)}</b></div>`).join("")}</div>
        <div class="tc-top" style="margin-top:14px"><span><b>${c.anotados}</b> / ${c.cupo} anotados</span><em>${c.abierto ? c.libres + " libres" : ESTADO_TXT[c.estadoVis]}</em></div><div class="progress"><i style="width:${c.pct}%"></i></div>
        <p class="tnote">Cuando se completa el cupo, el torneo arranca.</p>
        ${c.abierto ? `<a class="btn primary" style="width:100%;text-align:center;margin-top:14px" href="#/inscripcion/${t.id}">Inscribirme · ${t.inscripcion.tipo === "fija" ? $money(t.inscripcion.monto) : "desde " + $money(precioDesde(t))}</a>` : `<span class="btn off" style="width:100%;text-align:center;margin-top:14px">${ESTADO_TXT[c.estadoVis]}</span>`}
      </div>
    </div>
    <div class="pgrid" style="margin-top:20px"><div class="card"><h3 class="sub">Cómo funciona</h3><ul class="reglas">${reglas}</ul></div>
      <div class="card"><h3 class="sub">Anotados</h3>${anotados.length
        ? `<div class="chips-list">${anotados.slice(0, 40).map(p => { const e = equipoDe(p); return `<a class="plchip" href="#/jugador/${p.id}">${crest(e)}<span>${esc(p.nombre)}</span></a>`; }).join("")}</div>`
        : `<p class="muted">${c.anotados ? `Hay ${c.anotados} ${c.anotados === 1 ? "persona anotada" : "personas anotadas"}. Los nombres aparecen cuando el organizador aprueba cada inscripción.` : "Todavía no se anotó nadie. ¡Podés ser el primero!"}</p>`}</div></div>
    ${tiers}
    ${tb.length ? `<div class="sec-title" style="margin-top:34px"><h2>Posiciones <em>${LIVE ? "" : "(ejemplo)"}</em></h2><a href="#/liga/${t.id}">Tabla completa y estadísticas →</a></div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th>PJ</th><th>G</th><th>P</th><th>DG</th><th>Pts</th></tr></thead><tbody>
      ${tb.slice(0, 5).map((p, i) => `<tr class="${i < t.premios.length ? "top" : ""}"><td><span class="pos">${i + 1}</span></td><td class="l"><a href="#/jugador/${p.id}"><b>${esc(p.nombre)}</b></a></td><td>${p.pj}</td><td>${p.g}</td><td>${p.p}</td><td>${p.dg > 0 ? "+" : ""}${p.dg}</td><td class="pts">${p.pts}</td></tr>`).join("")}</tbody></table></div>` : ""}
    ${jugados.length ? `<div class="sec-title" style="margin-top:34px"><h2>Últimos <em>partidos</em></h2></div><div class="sbs">${jugados.map(scorebug).join("")}</div>` : ""}
    <div class="btns"><a class="btn" href="#/torneos">← Todos los torneos</a></div>
  </div>`;
}

// ============================================================
//  TABLA Y ESTADÍSTICAS DE UN TORNEO  (#/liga/<torneo>)
// ============================================================
function vistaLiga(id, modo) {
  const liga = torneoById(id) || TORNEOS[0], J = juegoDe(liga), stats = modo === "stats", futbol = J.stats === "futbol", M = J.marcador;
  const tabla = tablaLiga(liga.id);
  const mismos = TORNEOS.filter(t => t.juego === liga.juego);
  const tabs = mismos.length > 1 ? `<div class="tabs">${mismos.map(l => `<a class="tab ${l.id === liga.id ? "active" : ""}" href="#/liga/${l.id}${stats ? "/stats" : ""}">${esc(l.nombre)}</a>`).join("")}</div>` : "";
  const titulo = `<div class="sec-title"><h2>${esc(liga.nombre)} · <em>${stats ? "Estadísticas" : "Posiciones"}</em></h2><a href="#/torneo/${liga.id}">Detalles e inscripción →</a></div>`;
  if (!tabla.length) {
    return `<div class="wrap fade" style="padding-top:40px">${titulo}${tabs}
      <div class="card"><p class="muted">Todavía no hay jugadores aprobados en este torneo. Las posiciones van a aparecer cuando arranque.</p><div class="btns"><a class="btn primary" href="#/inscripcion/${liga.id}">Quiero participar</a></div></div></div>`;
  }
  const best = (fn, asc) => [...tabla].sort((a, b) => asc ? fn(a) - fn(b) : fn(b) - fn(a))[0];
  const L = (futbol ? [
    ["Mejor ataque", best(p => p.gf), p => p.gf + " goles"],
    ["Mejor defensa", best(p => p.gc, true), p => p.gc + " en contra"],
    ["Más posesión", best(p => p.posesion), p => p.posesion + "%"],
    ["Mejor pase", best(p => p.precision), p => p.precision + "% de pases"],
    ["Más tiros", best(p => p.tiros), p => p.tiros + " tiros"],
  ] : [
    ["Mejor ataque", best(p => p.gf), p => p.gf + " " + M.toLowerCase()],
    ["Mejor defensa", best(p => p.gc, true), p => p.gc + " en contra"],
    ["Más victorias", best(p => p.g), p => p.g + " ganados"],
  ]).map(([t, p, f]) => `<a class="leader" href="#/jugador/${p.id}"><small>${t}</small><b>${f(p)}</b><span>${esc(p.nombre)}</span></a>`).join("");
  const partidos = PARTIDOS.filter(m => m.liga === liga.id && esJugado(m));
  const ex = statsDe(J).slice(1), conEq = conEquipos(liga) || futbol;
  let cabeza, filaFn;
  if (futbol && stats) {
    cabeza = `<th>#</th><th class="l">Jugador</th><th>PJ</th><th>Tiros</th><th>Al arco</th><th>Pases</th><th>Pas %</th><th>Entradas</th><th>Faltas</th><th>Offs.</th><th>Córners</th><th>Amar.</th><th>Rojas</th><th>Atajadas</th>`;
    filaFn = (p, i, nom) => `<tr><td><span class="pos">${i + 1}</span></td>${nom}<td>${p.pj}</td><td>${p.tiros}</td><td>${p.tirosArco}</td><td>${p.pases}</td><td>${p.precision}%</td><td>${p.entradas}</td><td>${p.faltas}</td><td>${p.offsides}</td><td>${p.corners}</td><td>${p.amarillas}</td><td>${p.rojas}</td><td>${p.atajadas}</td></tr>`;
  } else if (futbol) {
    cabeza = `<th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pos %</th><th>Pas %</th><th>Forma</th><th>Pts</th>`;
    filaFn = (p, i, nom) => { const t = equipoDe(p);
      return `<tr class="${i < liga.premios.length ? "top" : ""}"><td><span class="pos">${i + 1}</span></td>${nom}
        <td class="l"><div class="team-cell">${crest(t)}<span>${t.nombre}<small>${stars(t.estrellas)}</small></span></div></td>
        <td>${p.pj}</td><td>${p.g}</td><td>${p.e}</td><td>${p.p}</td><td>${p.gf}</td><td>${p.gc}</td><td>${p.dg > 0 ? "+" : ""}${p.dg}</td><td>${p.posesion}</td><td>${p.precision}</td>
        <td><div class="form">${p.forma.map(f => `<i class="${f}">${f}</i>`).join("")}</div></td><td class="pts">${p.pts}</td></tr>`; };
  } else if (stats) {
    cabeza = `<th>#</th><th class="l">Jugador</th><th>PJ</th><th>${M} a favor</th><th>En contra</th>${ex.map(([, et]) => `<th>${et}</th>`).join("")}`;
    filaFn = (p, i, nom) => `<tr><td><span class="pos">${i + 1}</span></td>${nom}<td>${p.pj}</td><td>${p.gf}</td><td>${p.gc}</td>${ex.map(([k]) => `<td>${(p.extra && p.extra[k]) || 0}</td>`).join("")}</tr>`;
  } else {
    cabeza = `<th>#</th><th class="l">Jugador</th>${conEq ? `<th class="l">Equipo</th>` : ""}<th>PJ</th><th>G</th>${J.empates ? "<th>E</th>" : ""}<th>P</th><th>${M[0]}F</th><th>${M[0]}C</th><th>DG</th><th>Forma</th><th>Pts</th>`;
    filaFn = (p, i, nom) => { const t = equipoDe(p);
      return `<tr class="${i < liga.premios.length ? "top" : ""}"><td><span class="pos">${i + 1}</span></td>${nom}${conEq ? `<td class="l"><div class="team-cell">${crest(t)}<span>${t.nombre}</span></div></td>` : ""}
        <td>${p.pj}</td><td>${p.g}</td>${J.empates ? `<td>${p.e}</td>` : ""}<td>${p.p}</td><td>${p.gf}</td><td>${p.gc}</td><td>${p.dg > 0 ? "+" : ""}${p.dg}</td>
        <td><div class="form">${p.forma.map(f => `<i class="${f}">${f}</i>`).join("")}</div></td><td class="pts">${p.pts}</td></tr>`; };
  }
  const filas = tabla.map((p, i) => filaFn(p, i, `<td class="l"><a href="#/jugador/${p.id}"><b>${esc(p.nombre)}</b></a></td>`)).join("");
  let podio = "";
  if (!stats && tabla.length >= 3) {
    const pod = [tabla[1], tabla[0], tabla[2]], cls = ["p2", "p1", "p3"], nums = ["2º", "1º", "3º"];
    podio = `<div class="podium">${pod.map((p, i) => { const t = equipoDe(p); return `<a class="pod ${cls[i]}" href="#/jugador/${p.id}"><div class="m">${nums[i]}</div>${crest(t, "lg")}<b style="margin-top:8px">${esc(p.nombre)}</b><small>${t.nombre}</small><div class="pp">${p.pts} pts</div></a>`; }).join("")}</div>`;
  }
  return `<div class="wrap fade" style="padding-top:40px">${titulo}${tabs}${podio}
    <div class="leaders">${L}</div>
    <div class="seg"><a class="${stats ? "" : "on"}" href="#/liga/${liga.id}">Posiciones</a><a class="${stats ? "on" : ""}" href="#/liga/${liga.id}/stats">Estadísticas</a></div>
    <div class="table-wrap"><table><thead><tr>${cabeza}</tr></thead><tbody>${filas}</tbody></table></div>
    <p class="muted" style="margin-top:10px;font-size:13px">${stats ? "Acumulado del torneo, con los datos que muestra el juego." : "Dorado: puestos con premio."}${LIVE ? "" : " Datos de ejemplo."}</p>
    ${partidos.length ? `<div class="sec-title" style="margin-top:36px"><h2>Últimos <em>partidos</em></h2></div><div class="sbs">${partidos.map(scorebug).join("")}</div>` : ""}
  </div>`;
}

// Perfil de un jugador en juegos que no son de fútbol
function perfilStatsGenerico(p, J) {
  const pj = p.pj || 0, M = J.marcador, ex = statsDe(J).slice(1);
  const k = (n, l, st = "") => `<div class="kpi"><b ${st}>${n}</b><span>${l}</span></div>`;
  return `<div class="kpis">${k(p.pj, "Jugados")}${k(p.g, "Ganados", 'style="color:var(--win)"')}${J.empates ? k(p.e, "Empatados") : ""}${k(p.p, "Perdidos", 'style="color:var(--red)"')}
      ${k(p.gf, M + " a favor", 'class="accent"')}${k(p.gc, M + " en contra")}${k((p.dg > 0 ? "+" : "") + p.dg, "Diferencia")}${k(pm(p.gf, pj), M + " por partido")}</div>
    ${pj ? "" : `<p class="muted" style="margin:12px 0 0">Todavía no jugó partidos: las estadísticas se van a completar apenas se carguen los resultados.</p>`}
    ${ex.length ? `<div class="card" style="margin-top:16px"><h3 class="sub">Totales y promedios</h3><div class="kpis">${ex.map(([key, et]) => { const tot = (p.extra && p.extra[key]) || 0; return k(tot, et + " (total)") + k(pm(tot, pj), et + " por partido"); }).join("")}</div></div>` : ""}`;
}

// ============================================================
//  RESUMEN DEL ADMINISTRADOR
// ============================================================
function precioInsc(t, equipoId) {
  if (!t) return 0;
  if (t.inscripcion.tipo === "fija") return t.inscripcion.monto;
  const e = EQUIPOS.find(x => x.id === equipoId);
  return e ? e.precio : precioPorEstrellas(3);
}
function adminResumen() {
  const todas = todasInscripciones(), all = todas.filter(x => x.estado !== "rechazada"), n = all.length;
  const tor = x => torneoById(x.liga);
  const cobrables = LIVE ? all.filter(x => x.pagado) : all;
  const cobrado = cobrables.reduce((a, x) => a + (x.precio || 0), 0);
  const porCobrar = LIVE ? all.filter(x => !x.pagado).reduce((a, x) => a + (x.precio || 0), 0) : 0;
  const completos = TORNEOS.filter(t => cupoInfo(t).completo).length;
  const prom = cobrables.length ? cobrado / cobrables.length : 0;

  const porTorneo = TORNEOS.map(t => {
    const xs = all.filter(x => x.liga === t.id), c = cupoInfo(t);
    const cob = (LIVE ? xs.filter(x => x.pagado) : xs).reduce((a, x) => a + (x.precio || 0), 0);
    return { t, c, n: xs.length, apr: xs.filter(x => x.estado === "aprobada").length, cob, prem: totalPremios(t) };
  });
  const maxT = Math.max(1, ...porTorneo.map(x => x.n));

  const plats = {}; all.forEach(x => plats[x.plataforma] = (plats[x.plataforma] || 0) + 1);
  const platList = Object.entries(plats).sort((a, b) => b[1] - a[1]);
  const colores = ["#ffc531", "#3ee6ff", "#8b7bff", "#35e08a", "#ff4d5e"];
  let acc = 0;
  const conic = platList.map(([, c], i) => { const a = acc / (n || 1) * 100; acc += c; return `${colores[i % 5]} ${a}% ${acc / (n || 1) * 100}%`; }).join(",");

  const porEq = {};
  all.forEach(x => { const id = x.equipoId || (x.prefs && x.prefs[0]); const e = EQUIPOS.find(y => y.id === id); if (e) porEq[e.nombre] = (porEq[e.nombre] || 0) + 1; });
  const topEq = Object.entries(porEq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cnt = {}; let maxH = 1;
  all.forEach(x => (x.disp || []).forEach(k => { cnt[k] = (cnt[k] || 0) + 1; maxH = Math.max(maxH, cnt[k]); }));
  const slots = [];
  DIAS.forEach(d => TURNOS.forEach(tn => slots.push({ d, tn, c: cnt[d + "|" + tn] || 0 })));
  const mejores = [...slots].sort((a, b) => b.c - a.c).slice(0, 3);
  const heat = `<div class="hh"></div>${TURNOS.map(tn => `<div class="hh">${ICONO_TURNO[tn]} ${tn}</div>`).join("")}` +
    DIAS.map(d => `<div class="hd">${d}</div>` + TURNOS.map(tn => {
      const c = cnt[d + "|" + tn] || 0, a = c / maxH, best = mejores[0].c > 0 && mejores[0].d === d && mejores[0].tn === tn;
      return `<div class="${best ? "best" : ""}" style="background:rgba(255,197,49,${(0.05 + a * 0.8).toFixed(2)});color:${a > 0.55 ? "#04101f" : "var(--txt)"}">${c}</div>`; }).join("")).join("");
  const turnoTot = TURNOS.map(tn => ({ tn, c: slots.filter(s => s.tn === tn).reduce((a, s) => a + s.c, 0) }));
  const maxTurno = Math.max(1, ...turnoTot.map(x => x.c));
  const diaTot = DIAS.map(d => ({ d, c: slots.filter(s => s.d === d).reduce((a, s) => a + s.c, 0) }));
  const maxDia = Math.max(1, ...diaTot.map(x => x.c));

  const dias7 = [];
  for (let i = 6; i >= 0; i--) {
    const ini = new Date(); ini.setHours(0, 0, 0, 0); ini.setDate(ini.getDate() - i);
    const fin = ini.getTime() + 86400000;
    dias7.push({ l: ini.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }), c: all.filter(x => x.ts >= ini.getTime() && x.ts < fin).length });
  }
  const max7 = Math.max(1, ...dias7.map(d => d.c));
  const reales = all.filter(x => !x.demo).length;

  return `<div>
    <div class="kpis">
      <div class="kpi"><b style="color:var(--win)">${n}</b><span>${LIVE ? "Inscripciones" : `Inscripciones (${reales} reales + ${n - reales} de ejemplo)`}</span></div>
      ${LIVE ? `<div class="kpi"><b>${all.filter(x => x.estado === "pendiente").length}</b><span>Pendientes de aprobar</span></div>` : ""}
      <div class="kpi"><b class="gold">${$money(cobrado)}</b><span>${LIVE ? "Cobrado (marcado como pagado)" : "Recaudación total"}</span></div>
      ${LIVE ? `<div class="kpi"><b>${$money(porCobrar)}</b><span>Por cobrar</span></div>` : ""}
      <div class="kpi"><b>${$money(prom)}</b><span>Ticket promedio</span></div>
      <div class="kpi"><b>${completos}</b><span>Torneos con cupo completo</span></div>
    </div>

    <h3 class="sub" style="margin-top:26px">Torneos: cupos y plata</h3>
    <div class="table-wrap"><table><thead><tr><th class="l">Torneo</th><th>Anotados</th><th>Aprobados</th><th>Cobrado</th><th>Premios</th><th>Estado</th></tr></thead><tbody>
      ${porTorneo.map(x => `<tr><td class="l"><b>${esc(x.t.nombre)}</b><small class="muted" style="display:block">${juegoDe(x.t).nombre}</small></td><td>${x.c.anotados} / ${x.c.cupo}</td><td>${x.apr}</td><td class="pts">${$money(x.cob)}</td><td>${$money(x.prem)}</td><td><span class="badge ${x.c.estadoVis === "abierto" ? "y" : x.c.estadoVis === "completo" ? "g" : ""}">${ESTADO_TXT[x.c.estadoVis]}</span></td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="font-size:13px;margin-top:6px">Los premios los ponés vos: la tabla te muestra cuánto se juntó de inscripciones en cada torneo para que veas si cubre.</p>

    <div class="adm-grid">
      <div class="card"><h3 class="sub">Mejores horarios para jugar</h3>
        <div class="heat">${heat}</div>
        <p class="muted" style="font-size:12px;margin-top:8px">Cada celda es la cantidad de inscriptos que puede ese día y turno. Borde dorado: el mejor.</p>
        <div class="top3">${mejores.map((m, i) => `<div><b>#${i + 1} ${m.d}</b><span class="muted">${m.tn} · ${m.c} jugadores</span></div>`).join("")}</div>
      </div>
      <div class="card"><h3 class="sub">Disponibilidad por turno y por día</h3>
        ${turnoTot.map(x => `<div class="hbar"><span>${ICONO_TURNO[x.tn]} ${x.tn}</span><div class="track"><i style="width:${x.c / maxTurno * 100}%"></i></div><b>${x.c}</b></div>`).join("")}
        <div style="height:10px"></div>
        ${diaTot.map(x => `<div class="hbar"><span>${x.d}</span><div class="track"><i style="width:${x.c / maxDia * 100}%"></i></div><b>${x.c}</b></div>`).join("")}
      </div>
      <div class="card"><h3 class="sub">Inscriptos por torneo</h3>
        ${porTorneo.map(x => `<div class="hbar"><span>${esc(x.t.nombre)}</span><div class="track"><i style="width:${x.n / maxT * 100}%"></i></div><b>${x.n}</b></div>`).join("")}
      </div>
      <div class="card"><h3 class="sub">Equipos más pedidos (1.ª opción)</h3>
        ${topEq.map(([nom, c]) => { const t = teamByName(nom); return `<div class="hbar"><span class="team-cell">${crest(t)}</span><div><b style="font-size:14px">${nom}</b><div class="track" style="margin-top:4px"><i style="width:${c / topEq[0][1] * 100}%"></i></div></div><b>${c}</b></div>`; }).join("") || "<p class='muted'>Sin datos</p>"}
      </div>
      <div class="card"><h3 class="sub">Plataformas</h3>
        <div class="donut"><div class="ring2" style="background:conic-gradient(${conic || "#1f2e4c 0 100%"})"></div>
        <div>${platList.map(([nom, c], i) => `<div class="lg-item"><i style="background:${colores[i % 5]}"></i>${nom}: <b>${c}</b> (${Math.round(c / (n || 1) * 100)}%)</div>`).join("")}</div></div>
      </div>
      <div class="card"><h3 class="sub">Inscripciones por día</h3>
        <div style="display:flex;align-items:flex-end;gap:8px;height:150px">${dias7.map(d => `<div style="flex:1;text-align:center"><div style="height:${Math.max(4, d.c / max7 * 110)}px;background:linear-gradient(180deg,var(--accent),var(--sea));border-radius:3px 3px 0 0"></div><b style="font-size:13px">${d.c}</b><div class="muted" style="font-size:10px">${d.l}</div></div>`).join("")}</div>
      </div>
    </div>

    <h3 class="sub" style="margin-top:28px">Todos los inscriptos</h3>
    <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">Torneo</th><th class="l">Equipo</th><th>Inscripción</th><th>Plataforma</th><th>WhatsApp</th><th class="l">Horarios</th></tr></thead><tbody>
      ${all.map((x, i) => { const e = equipoDe(x), pend = !EQUIPOS.some(y => y.id === x.equipoId), prefTxt = (x.prefs || []).map(id => teamById(id).nombre).join(", ");
        return `<tr><td>${i + 1}</td><td class="l"><b>${esc(x.nombre)}</b>${x.demo ? ' <span class="badge">ejemplo</span>' : ""}${LIVE ? ` <span class="badge ${x.estado === "aprobada" ? "g" : "y"}">${x.estado}</span>` : ""}</td>
        <td class="l">${esc(nombreLiga(x.liga))}</td>
        <td class="l">${pend ? `<span class="muted" style="font-size:12px">${conEquipos(tor(x)) ? "Por sorteo" + (prefTxt ? "<br>Pidió: " + esc(prefTxt) : "") : "—"}</span>` : `<div class="team-cell">${crest(e)}${e.nombre}</div>`}</td>
        <td class="pts">${$money(x.precio || 0)}</td><td>${esc(x.plataforma)}</td><td>${esc(x.whatsapp) || "—"}</td><td class="l muted" style="white-space:normal;min-width:220px;font-size:12px">${resumenDisp(x.disp || [])}</td></tr>`; }).join("")}
    </tbody></table></div>
    ${LIVE ? "" : `<div class="warn">Los datos de este panel son de ejemplo. Cuando conectes Supabase se van a ver los inscriptos reales.</div>`}
  </div>`;
}

// ============================================================
//  INSCRIPCIÓN A UN TORNEO  (#/inscripcion/<torneo>)
// ============================================================
let PENDING_TORNEO = ""; // torneo que quería la persona antes de crear cuenta
function vistaInscripcion(id) {
  const t = torneoById(id);
  if (!t) return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>¿En qué torneo te <em>anotás</em>?</h2></div>${chipsJuegosHTML(FILTRO_JUEGO)}<div class="tgrid" id="tgrid">${gridTorneosHTML(FILTRO_JUEGO)}</div></div>`;
  const J = juegoDe(t), c = cupoInfo(t), ins = t.inscripcion;
  const cab = `<a class="muted" href="#/inscripcion" style="font:700 14px 'Barlow Condensed';letter-spacing:2px;text-transform:uppercase">← Cambiar de torneo</a>
    <div class="insc-top" style="--c:${J.color}"><div class="tart mini">${juegoArtSVG(t.juego, "i" + t.id)}</div><div><span class="pill">${J.nombre}</span><h2>Inscribite a <span class="grad">${esc(t.nombre)}</span></h2>
      <p class="muted">${t.formato} · ${t.duracion} · ${t.cupo} ${t.unidad}</p></div></div>
    <div class="tcupo" style="margin:14px 0 4px"><div class="tc-top"><span><b>${c.anotados}</b> / ${c.cupo} anotados</span><em>${c.abierto ? c.libres + " lugares libres" : ESTADO_TXT[c.estadoVis]}</em></div><div class="progress"><i style="width:${c.pct}%"></i></div>
      <p class="tnote">Cuando se completa el cupo, el torneo arranca.</p></div>`;
  if (LIVE && !USER) {
    PENDING_TORNEO = t.id;
    return `<div class="wrap fade"><div class="formbox">${cab}<h3 class="sub" style="margin-top:20px">Primero, tu cuenta</h3>
      <p class="muted" style="margin-top:8px">Para anotarte necesitás una cuenta. Así ves tu panel, tus estadísticas y tus próximos rivales.</p>
      <div class="btns"><a class="btn primary" href="#/registro">Crear cuenta</a><a class="btn" href="#/ingresar">Ya tengo cuenta</a></div></div></div>`;
  }
  const ya = LIVE ? (MI_INSCS || []).find(i => i.liga === t.id) : null;
  if (ya) return `<div class="wrap fade"><div class="formbox">${cab}<h3 class="sub" style="margin-top:20px">Ya estás anotado</h3><p class="muted" style="margin-top:8px">Tu inscripción está <b>${ya.estado}</b>. Mirá el detalle en tu panel.</p>
    <div class="btns"><a class="btn primary" href="#/panel/${t.id}">Ir a mi panel</a></div></div></div>`;
  if (!c.abierto) return `<div class="wrap fade"><div class="formbox">${cab}<h3 class="sub" style="margin-top:20px">${ESTADO_TXT[c.estadoVis]}</h3><p class="muted" style="margin-top:8px">Este torneo ya no recibe inscripciones. Mirá los otros torneos abiertos.</p>
    <div class="btns"><a class="btn primary" href="#/inscripcion">Ver torneos</a></div></div></div>`;
  const pr = (LIVE && MI_PERFIL) || {};
  const estr = ins.tipo === "estrellas";
  const equiposHTML = !conEquipos(t) ? `<div class="msg" style="margin-top:18px">En este torneo no hay equipos fijos: elegís en cada partido.</div>` : `
      <label class="lb">Elegí hasta 3 equipos, en orden de preferencia</label>
      <div class="fairbox"><b>Sorteo justo.</b> Tu equipo no se reserva al anotarte. Cuando se completa el cupo se sortea el orden y cada jugador recibe la mejor de sus opciones que siga libre. Anotarte primero o último no cambia nada.</div>
      ${estr ? `<label class="lb">Categoría del equipo (define lo que pagás)</label><select id="tier"><option value="0">Elegí la categoría...</option>${[[3, "Hasta 3 estrellas"], [4, "3.5 a 4 estrellas"], [4.5, "4.5 estrellas"], [5, "5 estrellas"]].map(([s, tx]) => `<option value="${precioPorEstrellas(s)}">${tx} · ${$money(precioPorEstrellas(s))}</option>`).join("")}</select>` : ""}
      <div class="row2" style="margin-top:12px${estr ? ";grid-template-columns:1fr" : ""}"><input id="buscar" placeholder="Buscar equipo..."><select id="filtro" ${estr ? 'style="display:none"' : ""}><option value="0">Todas las estrellas</option><option value="5">5 estrellas</option><option value="4.5">4.5 estrellas</option><option value="4">4 estrellas</option><option value="3.5">3.5 estrellas</option><option value="3">3 estrellas o menos</option></select></div>
      <div class="slots" id="slots"></div>
      <div class="team-pick" id="picker" style="margin-top:10px"></div>`;
  return `<div class="wrap fade"><div class="formbox">${cab}
    <form id="form" data-torneo="${t.id}">
      <label class="lb">Nombre de jugador (el que va a verse en las tablas)</label>
      <input name="nombre" required minlength="3" maxlength="24" placeholder="Ej: QuichaProPlayer" value="${esc(pr.nombre || "")}">
      <div class="row2">
        <div><label class="lb">Tu ID en la consola (PSN / Xbox / EA ID / Steam)</label><input name="gamertag" required placeholder="Tu usuario" value="${esc(pr.gamertag || "")}"></div>
        <div><label class="lb">WhatsApp (para coordinar partidos)</label><input name="whatsapp" required placeholder="Ej: 2262 123456" value="${esc(pr.whatsapp || "")}"></div>
      </div>
      <label class="lb">Plataforma</label>
      <select name="plataforma">${optsPlataforma(pr.plataforma)}</select>
      <label class="lb">¿Qué día y horario te queda mejor? (marcá todos los que puedas)</label>
      ${availGridHTML(pr.disp || [])}
      ${equiposHTML}
      <div class="summary"><div><span class="muted">${conEquipos(t) ? "Tus opciones" : "Torneo"}</span><div id="sel-nombre" style="font-weight:700">${conEquipos(t) ? "Ninguna todavía" : esc(t.nombre)}</div></div>
        <div style="text-align:right"><span class="muted">Inscripción${t.porFecha ? " + " + $money(t.porFecha.monto) + " " + t.porFecha.txt : ""}</span><br><b id="sel-precio">${estr ? "—" : $money(ins.monto)}</b></div></div>
      <button class="btn primary" style="width:100%;margin-top:18px" type="submit">Anotarme</button>
      <div id="resultado"></div>
    </form></div></div>`;
}

// Elección de hasta 3 equipos. Devuelve { get(), precio(), reset() }
function montarPrefs(t) {
  const picker = document.getElementById("picker"); if (!picker) return null;
  const estr = t.inscripcion.tipo === "estrellas", MAX = 3, prefs = [];
  let tier = 0;
  const lista = () => {
    const f = parseFloat(document.getElementById("filtro").value), b = document.getElementById("buscar").value.trim().toLowerCase();
    return EQUIPOS.filter(e => (!t.maxEstrellas || e.estrellas <= t.maxEstrellas) && (!estr || (tier && e.precio === tier))
      && (estr || !f || (f === 3 ? e.estrellas <= 3 : e.estrellas === f)) && (!b || e.nombre.toLowerCase().includes(b)));
  };
  const pintar = () => {
    const l = lista();
    picker.innerHTML = estr && !tier ? `<p class="muted">Elegí primero la categoría para ver los equipos.</p>` : l.length ? l.map(e => { const k = prefs.indexOf(e.id);
      return `<div class="pick ${k >= 0 ? "sel" : ""}" data-id="${e.id}">${k >= 0 ? `<span class="pn">${k + 1}</span>` : ""}${crest(e)}<b>${e.nombre}</b><small>${stars(e.estrellas)}</small>${estr ? "" : `<em>${$money(e.precio)}</em>`}</div>`; }).join("") : `<p class="muted">No hay equipos con ese filtro.</p>`;
    document.getElementById("slots").innerHTML = [0, 1, 2].map(i => { const e = prefs[i] && teamById(prefs[i]);
      return `<div class="slot ${e ? "full" : ""}"><span class="sn">${i + 1}.ª</span>${e ? `${crest(e)}<b>${e.nombre}</b><button type="button" class="slx" data-rm="${e.id}" aria-label="Quitar">×</button>` : `<em>${i === 0 ? "Tu opción principal" : "Opción de reserva (opcional)"}</em>`}</div>`; }).join("");
    document.getElementById("sel-nombre").textContent = prefs.length ? prefs.map(id => teamById(id).nombre).join(" · ") : "Ninguna todavía";
    document.getElementById("sel-precio").textContent = estr ? (tier ? $money(tier) : "—") : $money(t.inscripcion.monto);
  };
  const quitar = id => { const k = prefs.indexOf(id); if (k >= 0) prefs.splice(k, 1); pintar(); };
  picker.addEventListener("click", ev => {
    const el = ev.target.closest(".pick"); if (!el) return;
    const id = Number(el.dataset.id);
    if (prefs.includes(id)) return quitar(id);
    if (prefs.length >= MAX) { toast("Ya elegiste 3 equipos. Sacá uno para cambiarlo.", "err"); return; }
    prefs.push(id); pintar();
  });
  document.getElementById("slots").addEventListener("click", ev => { const x = ev.target.closest("[data-rm]"); if (x) quitar(Number(x.dataset.rm)); });
  document.getElementById("filtro").addEventListener("change", pintar);
  document.getElementById("buscar").addEventListener("input", pintar);
  const tierEl = document.getElementById("tier");
  if (tierEl) tierEl.addEventListener("change", () => { tier = Number(tierEl.value); prefs.length = 0; pintar(); });
  pintar();
  return { get: () => prefs.slice(), precio: () => estr ? tier : t.inscripcion.monto, reset: () => { prefs.length = 0; pintar(); } };
}

async function guardarInscripcion(t, d, disp, prefs, precio) {
  if (!LIVE) {
    addInscripto({ nombre: d.nombre, gamertag: d.gamertag, whatsapp: d.whatsapp, plataforma: d.plataforma, liga: t.id, prefs, equipoId: null, precio, disp, ts: Date.now(), estado: "pendiente" });
    return;
  }
  let r = await sb.from("profiles").upsert({ id: USER.id, email: USER.email, nombre: d.nombre.trim(), gamertag: d.gamertag.trim(), whatsapp: d.whatsapp.trim(), plataforma: d.plataforma, disp });
  if (r.error) throw r.error;
  r = await sb.from("inscripciones").insert({ user_id: USER.id, torneo: t.id, precio, prefs });
  if (r.error) throw r.error;
}
function iniciarInscripcion(id) {
  const t = torneoById(id), f = document.getElementById("form");
  if (!t || !f) { iniciarFiltroTorneos(); return; }
  const sel = conEquipos(t) ? montarPrefs(t) : null;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const out = document.getElementById("resultado"), btn = f.querySelector('button[type="submit"]');
    const err = m => { out.innerHTML = `<div class="msg err">${m}</div>`; };
    const disp = [...f.querySelectorAll('input[name="disp"]:checked')].map(x => x.value);
    const prefs = sel ? sel.get() : [], precio = sel ? sel.precio() : t.inscripcion.monto;
    if (sel && t.inscripcion.tipo === "estrellas" && !precio) return err("Elegí la categoría de tu equipo.");
    if (sel && !prefs.length) return err("Elegí al menos un equipo (hasta tres, en orden de preferencia).");
    if (!disp.length) return err("Marcá al menos un día y horario en que puedas jugar.");
    if (!cupoInfo(t).abierto) return err("El cupo de este torneo ya se completó.");
    const d = Object.fromEntries(new FormData(f));
    btn.disabled = true; out.innerHTML = `<div class="msg">Guardando tu inscripción...</div>`;
    try { await guardarInscripcion(t, d, disp, prefs, precio); }
    catch (ex) { await cargarDatos(); err(esc(msgErr(ex))); btn.disabled = false; return; }
    if (LIVE) { await cargarDatos(); toast("¡Inscripción enviada!"); location.hash = "#/panel/" + t.id; render(); return; }
    out.innerHTML = `<div class="msg">¡Listo, <b>${esc(d.nombre)}</b>! Quedaste anotado en <b>${esc(t.nombre)}</b> (${$money(precio)}).${prefs.length ? " Elegiste: " + prefs.map(i => teamById(i).nombre).join(", ") + ". El equipo se asigna por sorteo cuando se completa el cupo." : ""} (Por ahora es una demostración: todavía no se guarda en la base de datos.)</div>`;
    f.reset(); if (sel) sel.reset(); btn.disabled = false;
  });
}

// ============================================================
//  CARRUSEL DE LA PORTADA: chico, se mueve solo y también a mano
//  (flechas, puntitos, arrastrando con el mouse o deslizando con el dedo)
// ============================================================
function iniciarCarrusel() {
  const root = document.getElementById("carousel"); if (!root) return;
  const tr = root.querySelector(".htrack"), slides = [...tr.children], dots = [...root.querySelectorAll(".hdot")], prog = root.querySelector(".cprog i");
  const reducir = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, timer = null, pausa = false, tScroll = null;
  const w = () => tr.clientWidth || 1;
  const barra = () => { prog.style.animation = "none"; void prog.offsetWidth; prog.style.animation = ""; prog.style.animationPlayState = pausa ? "paused" : "running"; };
  const marcar = n => { if (n === i) return; i = n; dots.forEach((d, k) => d.classList.toggle("on", k === i)); countUp(slides[i]); barra(); };
  const ir = n => { n = (n + slides.length) % slides.length; tr.scrollTo({ left: n * w(), behavior: "smooth" }); marcar(n); };
  const parar = () => { clearInterval(timer); };
  const arrancar = () => { parar(); if (reducir) return; timer = setInterval(() => { if (!pausa && !document.hidden) ir(i + 1); }, 6500); TIMERS.push(timer); };
  tr.addEventListener("scroll", () => { clearTimeout(tScroll); tScroll = setTimeout(() => marcar(Math.max(0, Math.min(slides.length - 1, Math.round(tr.scrollLeft / w())))), 90); }, { passive: true });
  dots.forEach((d, k) => d.addEventListener("click", () => { ir(k); arrancar(); }));
  root.querySelector("#prev").addEventListener("click", () => { ir(i - 1); arrancar(); });
  root.querySelector("#next").addEventListener("click", () => { ir(i + 1); arrancar(); });
  // pausa mientras el mouse o el dedo están encima
  root.addEventListener("mouseenter", () => { pausa = true; prog.style.animationPlayState = "paused"; });
  root.addEventListener("mouseleave", () => { pausa = false; prog.style.animationPlayState = "running"; });
  root.addEventListener("touchstart", () => { pausa = true; prog.style.animationPlayState = "paused"; }, { passive: true });
  root.addEventListener("touchend", () => { setTimeout(() => { pausa = false; prog.style.animationPlayState = "running"; }, 2500); }, { passive: true });
  // arrastrar con el mouse (en pantallas táctiles ya funciona deslizando)
  let down = false, x0 = 0, s0 = 0, movio = false;
  tr.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.target.closest("button,a")) return; down = true; movio = false; x0 = e.clientX; s0 = tr.scrollLeft; tr.classList.add("drag"); });
  window.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) movio = true; tr.scrollLeft = s0 - dx; });
  window.addEventListener("pointerup", e => { if (!down) return; down = false; tr.classList.remove("drag"); const n = Math.round(tr.scrollLeft / w()); ir(movio ? n : i); arrancar(); });
  window.addEventListener("resize", () => { tr.scrollTo({ left: i * w(), behavior: "auto" }); });
  countUp(slides[0]); barra(); arrancar();
}
