// ============================================================
//  LÓGICA DE LA PÁGINA (versión 2: diseño nuevo + admin)
//  Los datos siguen siendo de ejemplo hasta conectar Supabase.
// ============================================================
const app = document.getElementById("app");
const $money = n => "$" + Math.round(Number(n)).toLocaleString("es-AR");
const stars = n => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
const EQUIPO_DESCONOCIDO = { id: 0, nombre: "Sin equipo", estrellas: 0, c1: "#33415f", c2: "#111a33", precio: 0, iniciales: "?" };
const teamById = id => EQUIPOS.find(t => t.id === id) || EQUIPO_DESCONOCIDO;
const teamByName = n => EQUIPOS.find(t => t.nombre === n);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Datos que usan las vistas. En modo demo son de ejemplo; con Supabase conectado
// panel.js los reemplaza por los datos reales (LIVE = true).
let KEEP_SCROLL = false;
let LIVE = false;
let JUGADORES = PARTICIPANTES;
let PARTIDOS = [...PARTIDOS_DEMO, ...PARTIDOS_PROG_DEMO];
let LIVE_INSCRIPTOS = [];
const EJEMPLO = _q; // QuichaProPlayer, el jugador de ejemplo de la portada
const jugadorOr = id => jugadorById(id) || { id, nombre: "Jugador retirado", equipoId: 0, liga: "", plataforma: "" };
const esJugado = m => !!(m && m.ft);
function isLight(hex) {
  const h = hex.replace("#", ""); const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}
const crest = (t, cls = "", extra = "") =>
  `<span class="crest ${cls}" style="background:linear-gradient(135deg,${t.c1},${t.c2});${isLight(t.c1) ? "color:#111;" : ""}${extra}">${t.iniciales}</span>`;

let TIMERS = [];
function clearTimers() { TIMERS.forEach(t => clearInterval(t)); TIMERS = []; }

// ---------- Inscripciones (localStorage en esta versión) ----------
function getInscriptos() { try { return JSON.parse(localStorage.getItem("inscriptos") || "[]"); } catch (e) { return []; } }
function addInscripto(x) { const a = getInscriptos(); a.push(x); try { localStorage.setItem("inscriptos", JSON.stringify(a)); } catch (e) {} }
function todasInscripciones() {
  if (LIVE) return LIVE_INSCRIPTOS;
  const dem = DEMO_INSCRIPTOS.map((x, i) => { const liga = TORNEOS[i % 5].id; return { ...x, liga, precio: precioInsc(torneoById(liga), x.equipoId), demo: true }; });
  return [...dem, ...getInscriptos().map(x => ({ ...x, demo: false }))];
}
// Cantidad de inscriptos que se muestra al público (sin contar las rechazadas)
function totalInscriptos() { return todasInscripciones().filter(x => x.estado !== "rechazada").length; }
function tablaLiga(id) {
  return JUGADORES.filter(p => p.liga === id).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

// ---------- Ilustraciones propias (SVG) ----------
function playerSVG(p = "a") {
  return `<svg viewBox="0 0 400 520" class="player-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jugador ilustrado de la liga">
  <defs>
    <linearGradient id="${p}j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14408a"/><stop offset="1" stop-color="#050f24"/></linearGradient>
    <linearGradient id="${p}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3a97c"/><stop offset="1" stop-color="#c78556"/></linearGradient>
    <clipPath id="${p}c"><path d="M30 520C30 420 90 372 200 362C310 372 370 420 370 520Z"/></clipPath>
  </defs>
  <text x="200" y="330" text-anchor="middle" font-size="380" font-family="Barlow Condensed,Arial" font-weight="800" font-style="italic" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2">10</text>
  <path d="M30 520C30 420 90 372 200 362C310 372 370 420 370 520Z" fill="url(#${p}j)"/>
  <g clip-path="url(#${p}c)"><path d="M-20 420L420 340L420 392L-20 472Z" fill="#ffc531"/><path d="M-20 486L420 406L420 420L-20 500Z" fill="#fff" opacity=".85"/></g>
  <path d="M168 366L200 414L232 366Z" fill="#050f24"/><path d="M160 364L200 422L240 364" stroke="#ffc531" stroke-width="6" fill="none" stroke-linejoin="round"/>
  <path d="M170 298h60v72q-30 34-60 0z" fill="url(#${p}s)"/><path d="M170 330q30 24 60 0v14q-30 22-60 0z" fill="#9a6038" opacity=".5"/>
  <ellipse cx="133" cy="246" rx="11" ry="20" fill="#c78556"/><ellipse cx="267" cy="246" rx="11" ry="20" fill="#c78556"/>
  <ellipse cx="200" cy="236" rx="68" ry="82" fill="url(#${p}s)"/>
  <path d="M136 262C146 326 254 326 264 262C250 292 150 292 136 262Z" fill="#1a1210" opacity=".35"/>
  <path d="M134 218C128 138 182 116 216 126C264 134 278 176 266 218C254 182 226 168 200 170C168 172 144 188 134 218Z" fill="#1a1210"/>
  <path d="M164 214q16-11 33-2M236 214q-16-11-33-2" stroke="#1a1210" stroke-width="6" stroke-linecap="round" fill="none"/>
  <ellipse cx="181" cy="234" rx="8" ry="5.5" fill="#fff"/><ellipse cx="219" cy="234" rx="8" ry="5.5" fill="#fff"/>
  <circle cx="183" cy="234" r="3.6" fill="#1a1210"/><circle cx="221" cy="234" r="3.6" fill="#1a1210"/>
  <path d="M200 240q-9 24 5 28" stroke="#a96a41" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M174 282q28 22 54-5" stroke="#7a3f25" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M130 240C120 110 280 110 270 240" fill="none" stroke="#0a101d" stroke-width="15" stroke-linecap="round"/>
  <path d="M133 232C126 124 274 124 267 232" fill="none" stroke="#ffc531" stroke-width="2" opacity=".7"/>
  <rect x="110" y="214" width="32" height="68" rx="15" fill="#0a101d" stroke="#ffc531" stroke-width="4"/>
  <rect x="258" y="214" width="32" height="68" rx="15" fill="#0a101d" stroke="#ffc531" stroke-width="4"/>
  <path d="M122 276q-4 44 42 52" stroke="#0a101d" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="166" cy="328" r="8" fill="#ffc531"/>
  <text x="200" y="508" text-anchor="middle" font-size="64" font-family="Barlow Condensed,Arial" font-weight="800" font-style="italic" fill="#050f24" opacity=".85">10</text>
  </svg>`;
}
function trophySVG(cls = "") {
  return `<svg class="${cls}" viewBox="0 0 200 200"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs>
  <path d="M60 30h80v40c0 28-18 48-40 52-22-4-40-24-40-52z" fill="url(#tg)"/>
  <path d="M60 40H38c0 28 12 42 30 46M140 40h22c0 28-12 42-30 46" fill="none" stroke="url(#tg)" stroke-width="9" stroke-linecap="round"/>
  <rect x="92" y="120" width="16" height="28" fill="url(#tg)"/><rect x="66" y="148" width="68" height="14" rx="5" fill="url(#tg)"/>
  <circle cx="100" cy="68" r="14" fill="#fff3b8" opacity=".7"/></svg>`;
}
// Faro de Quequén con su haz de luz giratorio (la marca de la liga)
function faroSVG() {
  return `<div class="faro" aria-hidden="true"><div class="beam"></div>
  <svg viewBox="0 0 90 300" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="fw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd9f0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#9fb0d4"/></linearGradient></defs>
    <path d="M26 96h38l12 200H14z" fill="url(#fw)"/>
    <path d="M23 132h44l3 28H20zM17 198h56l3 28H14zM13 264h64l1 24H12z" fill="#d62f3f" opacity=".92"/>
    <rect x="20" y="86" width="50" height="10" fill="#1b2c55"/>
    <rect x="30" y="52" width="30" height="34" fill="#ffe28c"/><rect x="30" y="52" width="30" height="34" fill="url(#fw)" opacity=".25"/>
    <path d="M28 52h34l-17-26z" fill="#1b2c55"/><rect x="43" y="14" width="4" height="14" fill="#1b2c55"/>
    <circle cx="45" cy="69" r="10" fill="#fff6c9"/>
  </svg></div>`;
}
function wavesSVG() {
  const p = "M0 30Q150 0 300 30T600 30T900 30T1200 30V60H0Z";
  return `<svg class="wave w2" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="${p}" fill="rgba(62,230,255,.16)"/></svg>
  <svg class="wave w1" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="${p}" fill="#030815"/></svg>`;
}

// ---------- Helpers de estadísticas ----------
const pm = (v, pj) => pj ? (v / pj).toFixed(1).replace(".0", "") : "0";
function resultadoPara(m, id) {
  const soyA = m.a === id, mi = soyA ? m.ft.a.goles : m.ft.b.goles, su = soyA ? m.ft.b.goles : m.ft.a.goles;
  return { rival: soyA ? m.b : m.a, mi, su, r: mi > su ? "G" : mi === su ? "E" : "P" };
}
const jugadorById = id => JUGADORES.find(x => x.id === id);
function scorebug(m) {
  const A = jugadorOr(m.a), B = jugadorOr(m.b), tA = equipoDe(A), tB = equipoDe(B);
  return `<a class="scorebug" href="#/partido/${m.id}"><span class="sb-tag">${esc(nombreLiga(m.liga))} · FECHA ${m.jornada}</span>
    <div class="sb-team">${crest(tA)}<div><b>${esc(A.nombre)}</b><small>${tA.nombre}</small></div></div>
    <div class="sb-score"><b>${m.ft.a.goles}</b><i>-</i><b>${m.ft.b.goles}</b></div>
    <div class="sb-team r">${crest(tB)}<div><b>${esc(B.nombre)}</b><small>${tB.nombre}</small></div></div>
    <div class="sb-ver">${m.ht ? `Entretiempo ${m.ht.a.goles}-${m.ht.b.goles} · ` : ""}Ver estadísticas →</div></a>`;
}
const fechaCorta = iso => iso ? new Date(iso).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "A coordinar";





function vistaEquipos() {
  const grupos = [[5, "5 estrellas"], [4.5, "4.5 estrellas"], [4, "4 estrellas"], [3.5, "3.5 estrellas"], [3, "3 estrellas o menos"]];
  const lista = s => EQUIPOS.filter(t => s === 3 ? t.estrellas <= 3 : t.estrellas === s);
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Equipos <em>disponibles</em></h2><a href="#/torneos">Ver torneos →</a></div>
    <p class="muted" style="margin:-12px 0 6px">Los equipos se usan en los torneos de EA FC. Estos precios por estrellas aplican a la Premier League; en los demás torneos la inscripción es fija.</p>
    ${grupos.map(([s, nom]) => `<h3 class="sub" style="margin-top:26px"><span class="gold">${stars(s)}</span> ${nom} · ${$money(precioPorEstrellas(s))}</h3>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${lista(s).map(t => `
      <div class="card hover" style="text-align:center">${crest(t, "lg")}<h3 style="margin-top:10px;font-size:20px">${t.nombre}</h3>
      <div class="muted">${stars(t.estrellas)} · ${$money(t.precio)}</div></div>`).join("")}</div>`).join("")}</div>`;
}

function vistaJugadores() {
  const lista = [...JUGADORES].sort((a, b) => b.pts - a.pts);
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2><em>Jugadores</em></h2></div>
  ${lista.length ? `<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${lista.map(p => { const t = equipoDe(p);
    return `<a class="card hover" href="#/jugador/${p.id}" style="display:flex;gap:12px;align-items:center">${crest(t)}<div><b>${esc(p.nombre)}</b><div class="muted" style="font-size:13px">${t.nombre} · ${p.liga ? esc(nombreLiga(p.liga)) : "Sin torneo"}</div></div></a>`; }).join("")}</div>`
    : `<div class="card"><p class="muted">Todavía no hay jugadores aprobados. ¡Sé el primero!</p><div class="btns"><a class="btn primary" href="#/inscripcion">Quiero participar</a></div></div>`}</div>`;
}

function bar(label, val, max = 100, sufijo = "") {
  return `<div class="bar-row"><div class="top"><span>${label}</span><b>${val}${sufijo}</b></div><div class="bar"><i data-w="${Math.min(100, val / (max || 1) * 100)}"></i></div></div>`;
}

// Radar de 6 ejes calculado con las estadísticas del juego
function radarSVG(vals) {
  const cx = 150, cy = 150, R = 105, n = vals.length;
  const pt = (i, k) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k]; };
  const ring = k => vals.map((_, i) => pt(i, k).map(x => x.toFixed(1)).join(",")).join(" ");
  const poly = vals.map((v, i) => pt(i, Math.max(0.04, v[1] / 100)).map(x => x.toFixed(1)).join(",")).join(" ");
  const ejes = vals.map((v, i) => { const [x, y] = pt(i, 1.2); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#8fa2c8" font-size="12" font-family="Barlow Condensed,Arial" font-weight="700" letter-spacing="1">${v[0].toUpperCase()}</text>`; }).join("");
  const rayos = vals.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#1b2c55"/>`; }).join("");
  const puntos = vals.map((v, i) => { const [x, y] = pt(i, Math.max(0.04, v[1] / 100)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#ffc531"/>`; }).join("");
  return `<svg viewBox="-50 0 400 300" role="img" aria-label="Radar de rendimiento">
    ${[0.33, 0.66, 1].map(k => `<polygon points="${ring(k)}" fill="none" stroke="#1b2c55"/>`).join("")}${rayos}
    <polygon points="${poly}" fill="rgba(255,197,49,.25)" stroke="#ffc531" stroke-width="2.5" stroke-linejoin="round"/>${puntos}${ejes}</svg>`;
}

// Totales, radar y promedios de un jugador (se usa en el perfil público y en el panel del jugador)
function perfilStats(p) {
  const J = juegoDeLiga(p.liga); if (J.stats !== "futbol") return perfilStatsGenerico(p, J);
  const pj = p.pj || 0, d = pj || 1;
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  const radar = [
    ["Ataque", clamp(p.gf / d / 3.5 * 100)], ["Defensa", pj ? clamp(100 - p.gc / d / 3 * 100) : 0], ["Posesión", clamp(p.posesion)],
    ["Pase", clamp(p.precision)], ["Puntería", p.tiros ? clamp(p.tirosArco / p.tiros * 100) : 0], ["Juego limpio", pj ? clamp(100 - (p.faltas / d * 9 + p.amarillas * 4 + p.rojas * 20)) : 0],
  ];
  return `
    <div class="kpis">
      <div class="kpi"><b>${p.pj}</b><span>Jugados</span></div><div class="kpi"><b style="color:var(--win)">${p.g}</b><span>Ganados</span></div>
      <div class="kpi"><b>${p.e}</b><span>Empatados</span></div><div class="kpi"><b style="color:var(--red)">${p.p}</b><span>Perdidos</span></div>
      <div class="kpi"><b class="accent">${p.gf}</b><span>Goles a favor</span></div><div class="kpi"><b>${p.gc}</b><span>Goles en contra</span></div>
      <div class="kpi"><b>${p.dg > 0 ? "+" : ""}${p.dg}</b><span>Diferencia</span></div><div class="kpi"><b>${pm(p.gf, pj)}</b><span>Goles por partido</span></div>
    </div>
    ${pj ? "" : `<p class="muted" style="margin:12px 0 0">Todavía no jugó partidos: las estadísticas se van a completar apenas se carguen los resultados.</p>`}
    <div class="pgrid" style="margin-top:16px">
      <div class="card"><h3 class="sub">Perfil de juego</h3><div class="radar-wrap">${radarSVG(radar)}</div></div>
      <div class="card"><h3 class="sub">Ataque y posesión</h3>
        ${bar("Posesión media", p.posesion, 100, "%")}${bar("Precisión de pases", p.precision, 100, "%")}${bar("Tiros al arco", p.tirosArco, p.tiros)}
        <div class="kpis" style="margin-top:14px"><div class="kpi"><b>${p.tiros}</b><span>Tiros</span></div><div class="kpi"><b>${p.tirosArco}</b><span>Al arco</span></div><div class="kpi"><b>${p.pases}</b><span>Pases</span></div><div class="kpi"><b>${p.corners}</b><span>Córners</span></div><div class="kpi"><b>${p.offsides}</b><span>Offsides</span></div></div></div>
      <div class="card"><h3 class="sub">Defensa y disciplina</h3>
        <div class="kpis"><div class="kpi"><b>${p.gc}</b><span>Goles en contra</span></div><div class="kpi"><b>${p.atajadas}</b><span>Atajadas</span></div><div class="kpi"><b>${p.entradas}</b><span>Entradas</span></div><div class="kpi"><b>${p.faltas}</b><span>Faltas</span></div><div class="kpi"><b class="accent">${p.amarillas}</b><span>Amarillas</span></div><div class="kpi"><b style="color:var(--red)">${p.rojas}</b><span>Rojas</span></div></div></div>
      <div class="card"><h3 class="sub">Promedio por partido</h3>
        <div class="kpis"><div class="kpi"><b>${pm(p.gf, pj)}</b><span>Goles a favor</span></div><div class="kpi"><b>${pm(p.gc, pj)}</b><span>Goles en contra</span></div><div class="kpi"><b>${pm(p.tiros, pj)}</b><span>Tiros</span></div><div class="kpi"><b>${pm(p.pases, pj)}</b><span>Pases</span></div><div class="kpi"><b>${pm(p.faltas, pj)}</b><span>Faltas</span></div><div class="kpi"><b>${pm(p.corners, pj)}</b><span>Córners</span></div></div></div>
    </div>`;
}

// Tabla de partidos jugados de un jugador
function perfilPartidos(id) {
  const ms = PARTIDOS.filter(m => esJugado(m) && (m.a === id || m.b === id));
  return ms.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th class="l">Rival</th><th>Resultado</th><th></th><th>Entretiempo</th><th></th></tr></thead><tbody>
      ${ms.map(m => { const r = resultadoPara(m, id), soyA = m.a === id, h = m.ht ? (soyA ? [m.ht.a.goles, m.ht.b.goles] : [m.ht.b.goles, m.ht.a.goles]) : null;
        return `<tr><td>${m.jornada}</td><td class="l"><a href="#/jugador/${r.rival}"><b>${esc(jugadorOr(r.rival).nombre)}</b></a></td><td class="pts">${r.mi} - ${r.su}</td><td><div class="form"><i class="${r.r}">${r.r}</i></div></td><td>${h ? h[0] + " - " + h[1] : "—"}</td><td><a class="accent" href="#/partido/${m.id}">Ver ficha →</a></td></tr>`; }).join("")}
    </tbody></table></div>` : `<p class="muted">Todavía no hay partidos cargados para este jugador.</p>`;
}

function vistaJugador(id) {
  const p = jugadorById(id);
  if (!p) return `<div class="wrap" style="padding:80px 20px"><h2>Jugador no encontrado</h2><a class="btn" href="#/jugadores">Volver</a></div>`;
  const t = equipoDe(p);
  return `<div class="wrap fade">
    <div class="profile-head">${crest(t, "lg")}
      <div><span class="pill">${p.liga ? esc(nombreLiga(p.liga)) : "Sin torneo"}</span><h1 style="margin-top:8px">${esc(p.nombre)}</h1>
        <div class="badges"><span class="badge y">${t.nombre} ${stars(t.estrellas)}</span><span class="badge">${juegoDeLiga(p.liga).nombre}</span><span class="badge">${esc(p.plataforma)}</span><span class="badge">${p.ciudad}</span>${p.racha ? `<span class="badge g">${p.racha}</span>` : ""}<span class="badge">Desde ${p.desde}</span></div></div>
      <div class="ovr"><b>${p.pts}</b><span>PUNTOS</span></div></div>
    ${perfilStats(p)}
    <h3 class="sub" style="margin-top:26px">Últimos partidos</h3>
    ${perfilPartidos(id)}
    ${LIVE ? "" : `<p class="muted" style="margin:12px 0 0;font-size:13px">* Perfil de ejemplo con datos ficticios.</p>`}</div>`;
}

// ---------- FICHA DE PARTIDO (entretiempo y final) ----------
function vistaPartido(id, modo) {
  const m = PARTIDOS.find(x => x.id === id);
  if (!m) return `<div class="wrap" style="padding:80px 20px"><h2>Partido no encontrado</h2><a class="btn" href="#/torneos">Volver</a></div>`;
  const A = jugadorOr(m.a), B = jugadorOr(m.b), tA = equipoDe(A), tB = equipoDe(B), J = juegoDeLiga(m.liga), NL = esc(nombreLiga(m.liga));
  const cabecera = (centro) => `<div class="mhead">
      <a class="tm" href="#/jugador/${A.id}">${crest(tA, "lg")}<b>${esc(A.nombre)}</b><small>${tA.nombre}</small></a>
      ${centro}
      <a class="tm" href="#/jugador/${B.id}">${crest(tB, "lg")}<b>${esc(B.nombre)}</b><small>${tB.nombre}</small></a></div>`;
  if (!esJugado(m)) {
    return `<div class="wrap fade">${cabecera(`<div class="res"><div class="sc"><b>vs</b></div><small>Programado · ${NL} · Fecha ${m.jornada}</small></div>`)}
      <div class="card" style="max-width:820px;margin:0 auto;text-align:center"><p class="muted">Este partido todavía no se jugó.</p><p style="margin-top:6px"><b>${fechaCorta(m.fecha)}</b></p></div>
      <div style="text-align:center;margin-top:14px"><a class="btn small" href="#/liga/${m.liga}">← Volver a ${NL}</a></div></div>`;
  }
  const ht = modo === "ht" && !!m.ht && J.ht, S = ht ? m.ht : m.ft;
  // [campo, etiqueta, sufijo, "menos es mejor"] según el juego
  const filas = statsDe(J).slice(1);
  const rows = filas.map(([k, et, suf = "", menos]) => {
    const a = S.a[k] || 0, b = S.b[k] || 0, tot = (a + b) || 1;
    const gana = a === b ? 0 : (menos ? (a < b ? 1 : 2) : (a > b ? 1 : 2));
    return `<div class="mrow"><div class="v ${gana === 1 ? "w" : ""}">${a}${suf}</div>
      <div><div class="mc">${et}</div><div class="bars"><div class="half l"><i class="${gana === 1 ? "w" : ""}" style="width:${a / tot * 100}%"></i></div><div class="half"><i class="${gana === 2 ? "w" : ""}" style="width:${b / tot * 100}%"></i></div></div></div>
      <div class="v ${gana === 2 ? "w" : ""}">${b}${suf}</div></div>`; }).join("");
  const base = `#/partido/${m.id}`;
  return `<div class="wrap fade">
    ${cabecera(`<div class="res"><div class="sc"><b>${S.a.goles}</b><i>-</i><b>${S.b.goles}</b></div><small>${ht ? (J.stats === "nba" ? "Mitad" : "Entretiempo") : "Final"} · ${NL} · Fecha ${m.jornada}</small></div>`)}
    ${m.ht && J.ht ? `<div style="text-align:center"><div class="seg"><a class="${ht ? "" : "on"}" href="${base}">Final</a><a class="${ht ? "on" : ""}" href="${base}/ht">Entretiempo</a></div></div>` : ""}
    <div class="card" style="max-width:820px;margin:0 auto">${rows || `<p class="muted" style="text-align:center">En este juego se registra el marcador de cada partido.</p>`}</div>
    <p class="muted" style="text-align:center;margin-top:12px;font-size:13px">Estadísticas como las muestra el juego.${LIVE ? "" : " Partido de ejemplo con datos ficticios."}</p>
    <div style="text-align:center;margin-top:14px"><a class="btn small" href="#/liga/${m.liga}">← Volver a ${NL}</a></div>
  </div>`;
}

// ---------- INSCRIPCIÓN ----------
const ICONO_TURNO = { "Mañana": "☀️", "Tarde": "🌤️", "Noche": "🌙" };
const HORA_TURNO = { "Mañana": "8 a 13 h", "Tarde": "13 a 19 h", "Noche": "19 a 24 h" };

// Grilla de lunes a sábado × mañana/tarde/noche. "sel" son los valores ya marcados ("Lunes|Noche")
function availGridHTML(sel = []) {
  return `<div class="avail">
    <span></span>${TURNOS.map(tn => `<div class="h">${ICONO_TURNO[tn]} ${tn}<br><span style="font-weight:500;letter-spacing:0">${HORA_TURNO[tn]}</span></div>`).join("")}
    ${DIAS.map(d => `<div class="d">${d}</div>${TURNOS.map(tn => `<label><input type="checkbox" name="disp" value="${d}|${tn}" ${sel.includes(d + "|" + tn) ? "checked" : ""}><span class="c">${tn}</span></label>`).join("")}`).join("")}
  </div>`;
}



function resumenDisp(disp) {
  return DIAS.map(d => { const ts = TURNOS.filter(tn => disp.includes(d + "|" + tn)); return ts.length ? `<b>${d.slice(0, 3)}</b> ${ts.map(t => t[0]).join("/")}` : ""; }).filter(Boolean).join(" · ");
}



function countUp(root) {
  root.querySelectorAll("[data-count]").forEach(el => {
    const fin = Number(el.dataset.count), suf = el.dataset.suf || "", money = el.dataset.money, t0 = performance.now(), dur = 1300;
    const paso = t => {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(fin * (1 - Math.pow(1 - k, 3)));
      el.textContent = money ? $money(v) : v.toLocaleString("es-AR") + suf;
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}

function iniciarReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); countUp(e.target); io.unobserve(e.target); } }), { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

// ============================================================
//  ROUTER
// ============================================================
function render() {
  clearTimers();
  const hash = location.hash.replace(/^#\/?/, "");
  const [ruta, param, param2, param3] = hash.split("/");
  let html = "", init = null, esInicio = false;
  switch (ruta) {
    case "": html = vistaInicio(); esInicio = true; break;
    case "ligas": case "torneos": html = vistaTorneos(); init = iniciarFiltroTorneos; break;
    case "torneo": html = vistaTorneo(param); break;
    case "liga": html = vistaLiga(param, param2); break;
    case "equipos": html = vistaEquipos(); break;
    case "jugadores": html = vistaJugadores(); break;
    case "jugador": html = vistaJugador(param); break;
    case "partido": html = vistaPartido(param, param2); break;
    case "inscripcion": html = vistaInscripcion(param); init = () => iniciarInscripcion(param); break;
    case "ingresar": case "registro": case "login": html = vistaAuth(ruta === "registro" ? "registro" : "ingresar"); init = iniciarAuth; break;
    case "panel": html = vistaPanel(param); init = iniciarPanel; break;
    case "admin": html = vistaAdminShell(param, param2, param3); init = iniciarAdminShell; break;
    default: html = vistaInicio(); esInicio = true;
  }
  app.innerHTML = (typeof bannerErrorDatos === "function" ? bannerErrorDatos() : "") + html;
  if (init) init();
  if (esInicio) { iniciarCarrusel(); iniciarFiltroTorneos(); }
  const activa = ["liga", "partido", "torneo", "ligas"].includes(ruta) ? "torneos" : ruta === "jugador" ? "jugadores" : (ruta === "registro" || ruta === "login") ? "ingresar" : ruta;
  if (typeof renderMenu === "function") renderMenu(activa);
  if (!KEEP_SCROLL) window.scrollTo(0, 0);
  KEEP_SCROLL = false;
  iniciarReveal();
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll(".bar i[data-w]").forEach(b => b.style.width = b.dataset.w + "%"), 60));
}
// El arranque (cargar datos y llamar a render) está al final de panel.js
