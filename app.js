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
let EQUIPOS_OCUPADOS = new Set();
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
  return [...DEMO_INSCRIPTOS.map(x => ({ ...x, demo: true })), ...getInscriptos().map(x => ({ ...x, demo: false }))];
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
  const A = jugadorOr(m.a), B = jugadorOr(m.b), tA = teamById(A.equipoId), tB = teamById(B.equipoId);
  return `<a class="scorebug" href="#/partido/${m.id}"><span class="sb-tag">LIGA ${m.liga} · FECHA ${m.jornada}</span>
    <div class="sb-team">${crest(tA)}<div><b>${esc(A.nombre)}</b><small>${tA.nombre}</small></div></div>
    <div class="sb-score"><b>${m.ft.a.goles}</b><i>-</i><b>${m.ft.b.goles}</b></div>
    <div class="sb-team r">${crest(tB)}<div><b>${esc(B.nombre)}</b><small>${tB.nombre}</small></div></div>
    <div class="sb-ver">${m.ht ? `Entretiempo ${m.ht.a.goles}-${m.ht.b.goles} · ` : ""}Ver estadísticas →</div></a>`;
}
const fechaCorta = iso => iso ? new Date(iso).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "A coordinar";

// ============================================================
//  VISTAS
// ============================================================
function slidesHTML() {
  const insc = totalInscriptos();
  const rm = teamByName("Real Madrid");
  const q = EJEMPLO;
  const cloud = [
    ["Real Madrid", "left:6%;top:4%;width:120px;height:120px;font-size:44px;animation-delay:-1s"],
    ["Manchester City", "left:50%;top:0;width:96px;height:96px;font-size:36px;animation-delay:-3s"],
    ["FC Barcelona", "left:68%;top:30%;width:130px;height:130px;font-size:48px;animation-delay:-2s"],
    ["París Saint-Germain", "left:22%;top:38%;width:100px;height:100px;font-size:38px;animation-delay:-4s"],
    ["Bayern Múnich", "left:2%;top:68%;width:92px;height:92px;font-size:34px;animation-delay:-5s"],
    ["Liverpool", "left:46%;top:64%;width:116px;height:116px;font-size:42px;animation-delay:-1.5s"],
  ].map(([n, st]) => { const t = teamByName(n); return `<span>${crest(t, "", "position:absolute;border-radius:24px;" + st)}</span>`; }).join("");
  const tiers = [[3, "Hasta 3★", "Equipos chicos"], [4, "3.5 a 4★", "Equipos medios"], [4.5, "4.5★", "Equipos top"], [5, "5★", "Los mejores del juego"]]
    .map(([s2, t, d]) => `<div class="t"><span class="s">${stars(s2)}</span><b>${$money(precioPorEstrellas(s2))}</b><small>${t} · ${d}</small></div>`).join("");
  const lig = LIGAS.map(l => { const tb = tablaLiga(l.id), lead = tb[0];
    return `<a class="league-row" style="--c:${l.color}" href="#/liga/${l.id}"><span class="L" style="background:${l.color}">${l.id}</span><div><b>${l.nombre}</b><small>${lead ? "Líder: " + esc(lead.nombre) : "Sin jugadores todavía"}</small></div><span class="r">${lead ? lead.pts + " pts" : tb.length + " jug."}</span></a>`; }).join("");

  return `
  <div class="slide s1 active">${faroSVG()}<div class="wrap grid">
    <div>
      <span class="pill reveal-in">Temporada 1 · Inscripciones abiertas</span>
      <h1 class="reveal-in">El campeón<br>se lleva</h1>
      <div class="bignum reveal-in" data-count="${PREMIO}" data-money="1">${$money(PREMIO)}</div>
      <p class="lead reveal-in">La liga de EA FC 27 de Necochea. 5 ligas, tablas al día y las estadísticas de cada partido, del entretiempo al final.</p>
      <div class="reveal-in"><div class="cd-label">Arranca en</div><div class="countdown" id="cd"></div>
      <div class="btns"><a class="btn primary" href="#/inscripcion">Quiero participar</a><a class="btn" href="#/liga/A">Ver tabla Liga A</a></div></div>
    </div>
    <div class="stage">
      <div class="glow"></div><div class="ring"></div>${playerSVG("h")}
      <div class="chip c1"><b>${q.gf}</b><span>Goles a favor</span></div>
      <div class="chip c2"><b>${q.precision}%</b><span>Precisión de pases</span></div>
      <div class="chip c3"><b>${q.g}V · ${q.e}E</b><span>Invicto</span></div>
      ${trophySVG("trophy-mini")}
    </div>
  </div></div>

  <div class="slide s2"><div class="wrap grid">
    <div>
      <span class="pill reveal-in">${insc} jugadores ya se anotaron</span>
      <h1 class="reveal-in">Elegí tu equipo.<br>Pagás por estrellas.</h1>
      <p class="lead reveal-in">Cuantas más estrellas tiene tu equipo, más sale la inscripción. Todos compiten por el mismo premio.</p>
      <div class="tiers4 reveal-in">${tiers}</div>
      <div class="btns reveal-in"><a class="btn primary" href="#/inscripcion">Elegir mi equipo</a><a class="btn" href="#/equipos">Ver todos</a></div>
    </div>
    <div class="crest-cloud">${cloud}</div>
  </div></div>

  <div class="slide s3"><div class="wrap grid">
    <div>
      <span class="pill reveal-in">Como en el juego</span>
      <h1 class="reveal-in">Entretiempo.<br>Final. Todo.</h1>
      <p class="lead reveal-in">Cargamos las mismas estadísticas que muestra el juego: goles, posesión, tiros, pases, faltas, córners y más. Mirá el ejemplo de QuichaProPlayer.</p>
      <div class="stat4 reveal-in">
        <div><b data-count="${q.gf}">${q.gf}</b><span>Goles a favor</span></div><div><b data-count="${q.gc}">${q.gc}</b><span>Goles en contra</span></div>
        <div><b data-count="${q.posesion}" data-suf="%">${q.posesion}%</b><span>Posesión</span></div><div><b data-count="${q.precision}" data-suf="%">${q.precision}%</b><span>Precisión de pases</span></div>
      </div>
      <div class="btns reveal-in">${LIVE
        ? `<a class="btn primary" href="#/ligas">Ver las ligas</a><a class="btn" href="#/inscripcion">Quiero participar</a>`
        : `<a class="btn primary" href="#/jugador/quichaproplayer">Ver perfil</a><a class="btn" href="#/partido/p10">Ver una ficha de partido</a>`}</div>
      ${LIVE ? `<p class="muted" style="margin-top:12px;font-size:13px">* La carta y los números de esta diapositiva son de un jugador de ejemplo.</p>` : ""}
    </div>
    <div class="stage" style="place-items:center">
      <div class="fcard">
        <div class="top"><div><div class="ovr2">${q.pts}</div><div class="pos2">PTS</div>${crest(rm, "mini-crest")}</div><div class="pos2" style="text-align:right">NEC<br>LIGA A</div></div>
        ${playerSVG("f")}
        <div class="nm">${q.nombre}</div>
        <div class="fs"><span><b>${q.gf}</b>GF</span><span><b>${q.gc}</b>GC</span><span><b>${q.posesion}</b>POS</span><span><b>${q.precision}</b>PAS</span><span><b>${q.tiros}</b>TIR</span><span><b>${q.pj}</b>PJ</span></div>
      </div>
    </div>
  </div></div>

  <div class="slide s4"><div class="wrap grid">
    <div>
      <span class="pill reveal-in">5 ligas · 1 solo campeón</span>
      <h1 class="reveal-in">De la Liga E<br>a la Liga A</h1>
      <p class="lead reveal-in">Jugás contra gente de tu nivel y peleás por subir. Ascensos, descensos y un premio de ${$money(PREMIO)}.</p>
      <div class="btns reveal-in"><a class="btn primary" href="#/ligas">Ver las ligas</a></div>
    </div>
    <div class="league-list reveal-in">${lig}</div>
  </div></div>`;
}

function vistaInicio() {
  const insc = totalInscriptos();
  const pct = Math.min(100, Math.round(insc / META_INSCRIPTOS * 100));
  const goleadores = [...JUGADORES].filter(p => p.liga).sort((a, b) => b.gf - a.gf).slice(0, 5);
  const jugados = PARTIDOS.filter(esJugado).slice(0, 4);
  return `
  <div class="carousel" id="carousel">
    ${slidesHTML()}
    <div class="ctrls"><div class="wrap">
      <div class="dots"><button class="dot on">Premio</button><button class="dot">Inscripción</button><button class="dot">Stats</button><button class="dot">Ligas</button></div>
      <div class="arrows"><button class="arrow" id="prev" aria-label="Anterior">‹</button><button class="arrow" id="next" aria-label="Siguiente">›</button></div>
    </div></div>
    ${wavesSVG()}
    <div class="cprog"><i></i></div>
  </div>

  <section class="block reveal"><div class="wrap">
    <div class="stats-row">
      <div class="stat"><b data-count="5">5</b><span>Ligas (A a la E)</span></div>
      <div class="stat"><b data-count="${EQUIPOS.length}">${EQUIPOS.length}</b><span>Equipos disponibles</span></div>
      <div class="stat"><b data-count="${insc}">${insc}</b><span>Jugadores inscriptos</span></div>
      <div class="stat"><b>${$money(PREMIO)}</b><span>Premio al campeón</span></div>
    </div>
    <div style="margin-top:18px;max-width:560px"><div style="display:flex;justify-content:space-between;font-size:14px"><span><b>${insc}</b> de ${META_INSCRIPTOS} cupos</span><span class="muted">${pct}% completo</span></div><div class="progress"><i style="width:${pct}%"></i></div></div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Últimos <em>resultados</em></h2><a href="#/liga/A">Ver Liga A →</a></div>
    ${jugados.length
      ? `<div class="sbs">${jugados.map(scorebug).join("")}</div>${LIVE ? "" : `<p class="muted" style="margin-top:10px;font-size:13px">* Resultados de ejemplo. Entrá a cada partido para ver el entretiempo y el final.</p>`}`
      : `<div class="card"><p class="muted">Todavía no se jugó ningún partido. Los resultados van a aparecer acá apenas arranque la temporada.</p></div>`}
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Cómo <em>funciona</em></h2></div>
    <div class="steps">
      <div class="step"><div class="n">01</div><h3>Registrate</h3><p class="muted">Creás tu perfil con tu nombre de jugador y tu ID de consola.</p></div>
      <div class="step"><div class="n">02</div><h3>Elegí equipo</h3><p class="muted">Cuantas más estrellas, más sale la inscripción.</p></div>
      <div class="step"><div class="n">03</div><h3>Elegí tus horarios</h3><p class="muted">Decís qué días y turnos te quedan bien y armamos el fixture.</p></div>
      <div class="step"><div class="n">04</div><h3>Jugá y ganá</h3><p class="muted">Sumá puntos, subí de liga y peleá por el millón.</p></div>
    </div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Elegí tu <em>liga</em></h2><a href="#/ligas">Ver todas →</a></div>
    <div class="cards">${LIGAS.map(l => `
      <a class="card hover league-card" href="#/liga/${l.id}" style="border-top:3px solid ${l.color}">
        <span class="big">${l.id}</span><h3>${l.nombre}</h3><p class="muted">${l.desc}</p>
        <p style="margin-top:10px;font-weight:700;color:${l.color}">Ver tabla →</p></a>`).join("")}</div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Cuánto sale <em>inscribirse</em></h2><a href="#/equipos">Ver equipos →</a></div>
    <div class="tier">
      ${[[3, "Hasta 3 estrellas"], [4, "3.5 a 4 estrellas"], [4.5, "4.5 estrellas"], [5, "5 estrellas"]].map(([s, t]) => `
        <div class="card ${s === 5 ? "best" : ""}"><div class="stars">${stars(s)}</div><div class="muted">${t}</div>
        <div class="price">${$money(precioPorEstrellas(s))}</div></div>`).join("")}
    </div>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="sec-title"><h2>Máximos <em>goleadores</em></h2></div>
    ${goleadores.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>Liga</th><th>Goles a favor</th></tr></thead><tbody>
      ${goleadores.map((p, i) => { const t = teamById(p.equipoId); return `<tr class="${i === 0 ? "top" : ""}"><td><span class="pos">${i + 1}</span></td>
        <td class="l"><a href="#/jugador/${p.id}"><b>${esc(p.nombre)}</b></a></td><td class="l"><div class="team-cell">${crest(t)}${t.nombre}</div></td>
        <td>${p.liga}</td><td class="pts">${p.gf}</td></tr>`; }).join("")}
    </tbody></table></div>${LIVE ? "" : `<p class="muted" style="margin-top:10px;font-size:13px">* Datos de ejemplo hasta que arranque la temporada.</p>`}`
      : `<div class="card"><p class="muted">Todavía no hay jugadores en las ligas.</p></div>`}
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="cta-band"><div style="position:relative;z-index:1"><h3>¿Listo para jugar?</h3><p class="muted" style="margin-top:6px">Anotate hoy y elegí tus horarios. Quedan ${Math.max(0, META_INSCRIPTOS - insc)} cupos.</p></div>
    <a class="btn primary" style="position:relative;z-index:1" href="#/inscripcion">Inscribirme ahora</a></div>
  </div></section>`;
}

function vistaLigas() {
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Las 5 <em>ligas</em></h2></div>
  <div class="cards">${LIGAS.map(l => {
    const tb = tablaLiga(l.id), t = tb[0];
    return `<a class="card hover league-card" href="#/liga/${l.id}" style="border-top:3px solid ${l.color}">
      <span class="big">${l.id}</span><h3>${l.nombre}</h3><p class="muted">${l.desc}</p>
      <p style="margin-top:12px" class="muted">${t ? `Líder: <b style="color:var(--txt)">${esc(t.nombre)}</b> (${t.pts} pts)` : "Todavía sin jugadores"} · ${tb.length} jugadores</p></a>`; }).join("")}</div></div>`;
}

function vistaLiga(id, modo) {
  const liga = LIGAS.find(l => l.id === id) || LIGAS[0];
  const stats = modo === "stats";
  const tabla = tablaLiga(liga.id);
  if (!tabla.length) {
    return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>${liga.nombre} · <em>Posiciones</em></h2></div>
      <div class="tabs">${LIGAS.map(l => `<a class="tab ${l.id === liga.id ? "active" : ""}" href="#/liga/${l.id}">${l.nombre}</a>`).join("")}</div>
      <div class="card"><p class="muted">Todavía no hay jugadores en esta liga. Cuando el organizador los asigne, van a aparecer acá.</p><div class="btns"><a class="btn primary" href="#/inscripcion">Quiero participar</a></div></div></div>`;
  }
  const pod = [tabla[1], tabla[0], tabla[2]];
  const cls = ["p2", "p1", "p3"], nums = ["2º", "1º", "3º"];
  const best = (fn, asc) => [...tabla].sort((a, b) => asc ? fn(a) - fn(b) : fn(b) - fn(a))[0];
  const L = [
    ["Mejor ataque", best(p => p.gf), p => p.gf + " goles"],
    ["Mejor defensa", best(p => p.gc, true), p => p.gc + " en contra"],
    ["Más posesión", best(p => p.posesion), p => p.posesion + "%"],
    ["Mejor pase", best(p => p.precision), p => p.precision + "% de pases"],
    ["Más tiros", best(p => p.tiros), p => p.tiros + " tiros"],
  ].map(([t, p, f]) => `<a class="leader" href="#/jugador/${p.id}"><small>${t}</small><b>${f(p)}</b><span>${esc(p.nombre)}</span></a>`).join("");
  const partidos = PARTIDOS.filter(m => m.liga === liga.id && esJugado(m));
  const cabeza = stats
    ? `<th>#</th><th class="l">Jugador</th><th>PJ</th><th>Tiros</th><th>Al arco</th><th>Pases</th><th>Pas %</th><th>Entradas</th><th>Faltas</th><th>Offs.</th><th>Córners</th><th>Amar.</th><th>Rojas</th><th>Atajadas</th>`
    : `<th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pos %</th><th>Pas %</th><th>Forma</th><th>Pts</th>`;
  const filas = tabla.map((p, i) => { const t = teamById(p.equipoId);
    const rc = `class="${!stats && i < 2 ? "top" : !stats && i === tabla.length - 1 ? "last" : ""}"`;
    const nom = `<td class="l"><a href="#/jugador/${p.id}"><b>${p.nombre}</b></a></td>`;
    return stats
      ? `<tr><td><span class="pos">${i + 1}</span></td>${nom}<td>${p.pj}</td><td>${p.tiros}</td><td>${p.tirosArco}</td><td>${p.pases}</td><td>${p.precision}%</td><td>${p.entradas}</td><td>${p.faltas}</td><td>${p.offsides}</td><td>${p.corners}</td><td>${p.amarillas}</td><td>${p.rojas}</td><td>${p.atajadas}</td></tr>`
      : `<tr ${rc}><td><span class="pos">${i + 1}</span></td>${nom}
        <td class="l"><div class="team-cell">${crest(t)}<span>${t.nombre}<small>${stars(t.estrellas)}</small></span></div></td>
        <td>${p.pj}</td><td>${p.g}</td><td>${p.e}</td><td>${p.p}</td><td>${p.gf}</td><td>${p.gc}</td><td>${p.dg > 0 ? "+" : ""}${p.dg}</td>
        <td>${p.posesion}</td><td>${p.precision}</td>
        <td><div class="form">${p.forma.map(f => `<i class="${f}">${f}</i>`).join("")}</div></td><td class="pts">${p.pts}</td></tr>`; }).join("");
  return `<div class="wrap fade" style="padding-top:40px">
    <div class="sec-title"><h2>${liga.nombre} · <em>${stats ? "Estadísticas" : "Posiciones"}</em></h2></div>
    <div class="tabs">${LIGAS.map(l => `<a class="tab ${l.id === liga.id ? "active" : ""}" href="#/liga/${l.id}${stats ? "/stats" : ""}">${l.nombre}</a>`).join("")}</div>
    ${stats ? "" : `<div class="podium">${pod.map((p, i) => { const t = teamById(p.equipoId); return `<a class="pod ${cls[i]}" href="#/jugador/${p.id}"><div class="m">${nums[i]}</div>${crest(t, "lg")}<b style="margin-top:8px">${p.nombre}</b><small>${t.nombre}</small><div class="pp">${p.pts} pts</div></a>`; }).join("")}</div>`}
    <div class="leaders">${L}</div>
    <div class="seg"><a class="${stats ? "" : "on"}" href="#/liga/${liga.id}">Posiciones</a><a class="${stats ? "on" : ""}" href="#/liga/${liga.id}/stats">Estadísticas</a></div>
    <div class="table-wrap"><table><thead><tr>${cabeza}</tr></thead><tbody>${filas}</tbody></table></div>
    <p class="muted" style="margin-top:10px;font-size:13px">${stats ? "Acumulado de la temporada, con los datos que muestra el juego al final de cada partido." : "Dorado: zona de ascenso · Rojo: zona de descenso."}${LIVE ? "" : " Datos de ejemplo."}</p>
    ${partidos.length ? `<div class="sec-title" style="margin-top:36px"><h2>Últimos <em>partidos</em></h2></div><div class="sbs">${partidos.map(scorebug).join("")}</div>` : ""}
  </div>`;
}

function vistaEquipos() {
  const grupos = [[5, "5 estrellas"], [4.5, "4.5 estrellas"], [4, "4 estrellas"], [3.5, "3.5 estrellas"], [3, "3 estrellas o menos"]];
  const lista = s => EQUIPOS.filter(t => s === 3 ? t.estrellas <= 3 : t.estrellas === s);
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Equipos <em>disponibles</em></h2><a href="#/inscripcion">Elegir mi equipo →</a></div>
    ${grupos.map(([s, nom]) => `<h3 class="sub" style="margin-top:26px"><span class="gold">${stars(s)}</span> ${nom} · ${$money(precioPorEstrellas(s))}</h3>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${lista(s).map(t => `
      <div class="card hover" style="text-align:center">${crest(t, "lg")}<h3 style="margin-top:10px;font-size:20px">${t.nombre}</h3>
      <div class="muted">${stars(t.estrellas)} · ${$money(t.precio)}</div></div>`).join("")}</div>`).join("")}</div>`;
}

function vistaJugadores() {
  const lista = [...JUGADORES].sort((a, b) => b.pts - a.pts);
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2><em>Jugadores</em></h2></div>
  ${lista.length ? `<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${lista.map(p => { const t = teamById(p.equipoId);
    return `<a class="card hover" href="#/jugador/${p.id}" style="display:flex;gap:12px;align-items:center">${crest(t)}<div><b>${esc(p.nombre)}</b><div class="muted" style="font-size:13px">${t.nombre} · ${p.liga ? "Liga " + p.liga : "Sin liga"}</div></div></a>`; }).join("")}</div>`
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
  const t = teamById(p.equipoId);
  return `<div class="wrap fade">
    <div class="profile-head">${crest(t, "lg")}
      <div><span class="pill">${p.liga ? "Liga " + p.liga : "Sin liga asignada"}</span><h1 style="margin-top:8px">${esc(p.nombre)}</h1>
        <div class="badges"><span class="badge y">${t.nombre} ${stars(t.estrellas)}</span><span class="badge">${esc(p.plataforma)}</span><span class="badge">${p.ciudad}</span>${p.racha ? `<span class="badge g">${p.racha}</span>` : ""}<span class="badge">Desde ${p.desde}</span></div></div>
      <div class="ovr"><b>${p.pts}</b><span>PUNTOS</span></div></div>
    ${perfilStats(p)}
    <h3 class="sub" style="margin-top:26px">Últimos partidos</h3>
    ${perfilPartidos(id)}
    ${LIVE ? "" : `<p class="muted" style="margin:12px 0 0;font-size:13px">* Perfil de ejemplo con datos ficticios.</p>`}</div>`;
}

// ---------- FICHA DE PARTIDO (entretiempo y final) ----------
function vistaPartido(id, modo) {
  const m = PARTIDOS.find(x => x.id === id);
  if (!m) return `<div class="wrap" style="padding:80px 20px"><h2>Partido no encontrado</h2><a class="btn" href="#/liga/A">Volver</a></div>`;
  const A = jugadorOr(m.a), B = jugadorOr(m.b), tA = teamById(A.equipoId), tB = teamById(B.equipoId);
  const cabecera = (centro) => `<div class="mhead">
      <a class="tm" href="#/jugador/${A.id}">${crest(tA, "lg")}<b>${esc(A.nombre)}</b><small>${tA.nombre}</small></a>
      ${centro}
      <a class="tm" href="#/jugador/${B.id}">${crest(tB, "lg")}<b>${esc(B.nombre)}</b><small>${tB.nombre}</small></a></div>`;
  if (!esJugado(m)) {
    return `<div class="wrap fade">${cabecera(`<div class="res"><div class="sc"><b>vs</b></div><small>Programado · Liga ${m.liga} · Fecha ${m.jornada}</small></div>`)}
      <div class="card" style="max-width:820px;margin:0 auto;text-align:center"><p class="muted">Este partido todavía no se jugó.</p><p style="margin-top:6px"><b>${fechaCorta(m.fecha)}</b></p></div>
      <div style="text-align:center;margin-top:14px"><a class="btn small" href="#/liga/${m.liga}">← Volver a la Liga ${m.liga}</a></div></div>`;
  }
  const ht = modo === "ht" && !!m.ht, S = ht ? m.ht : m.ft;
  // [campo, etiqueta, sufijo, "menos es mejor"]
  const filas = [["pos", "Posesión", "%"], ["tiros", "Tiros"], ["tirosArco", "Tiros al arco"], ["pases", "Pases"], ["precision", "Precisión de pases", "%"],
    ["entradas", "Entradas"], ["faltas", "Faltas", "", 1], ["offsides", "Offsides", "", 1], ["corners", "Córners"], ["amarillas", "Tarjetas amarillas", "", 1], ["rojas", "Tarjetas rojas", "", 1], ["atajadas", "Atajadas"]];
  const rows = filas.map(([k, et, suf = "", menos]) => {
    const a = S.a[k] || 0, b = S.b[k] || 0, tot = (a + b) || 1;
    const gana = a === b ? 0 : (menos ? (a < b ? 1 : 2) : (a > b ? 1 : 2));
    return `<div class="mrow"><div class="v ${gana === 1 ? "w" : ""}">${a}${suf}</div>
      <div><div class="mc">${et}</div><div class="bars"><div class="half l"><i class="${gana === 1 ? "w" : ""}" style="width:${a / tot * 100}%"></i></div><div class="half"><i class="${gana === 2 ? "w" : ""}" style="width:${b / tot * 100}%"></i></div></div></div>
      <div class="v ${gana === 2 ? "w" : ""}">${b}${suf}</div></div>`; }).join("");
  const base = `#/partido/${m.id}`;
  return `<div class="wrap fade">
    ${cabecera(`<div class="res"><div class="sc"><b>${S.a.goles}</b><i>-</i><b>${S.b.goles}</b></div><small>${ht ? "Entretiempo" : "Final"} · Liga ${m.liga} · Fecha ${m.jornada}</small></div>`)}
    ${m.ht ? `<div style="text-align:center"><div class="seg"><a class="${ht ? "" : "on"}" href="${base}">Final</a><a class="${ht ? "on" : ""}" href="${base}/ht">Entretiempo</a></div></div>` : ""}
    <div class="card" style="max-width:820px;margin:0 auto">${rows}</div>
    <p class="muted" style="text-align:center;margin-top:12px;font-size:13px">Estadísticas como las muestra el juego.${LIVE ? "" : " Partido de ejemplo con datos ficticios."}</p>
    <div style="text-align:center;margin-top:14px"><a class="btn small" href="#/liga/${m.liga}">← Volver a la Liga ${m.liga}</a></div>
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
// Buscador + grilla de equipos + resumen con el precio
function equipoPickerHTML() {
  return `<label class="lb">Elegí tu equipo</label>
      <div class="row2"><input id="buscar" placeholder="Buscar equipo..."><select id="filtro"><option value="0">Todas las estrellas</option><option value="5">5 estrellas</option><option value="4.5">4.5 estrellas</option><option value="4">4 estrellas</option><option value="3.5">3.5 estrellas</option><option value="3">3 estrellas o menos</option></select></div>
      <div class="team-pick" id="picker" style="margin-top:10px"></div>
      <div class="summary"><div><span class="muted">Equipo elegido</span><div id="sel-nombre" style="font-weight:700">Ninguno</div></div><div style="text-align:right"><span class="muted">Inscripción</span><br><b id="sel-precio">$0</b></div></div>`;
}
// Activa el selector de equipos. Devuelve { get(), reset() }
function montarSelectorEquipos() {
  let elegido = null;
  const picker = document.getElementById("picker");
  const pintar = () => {
    const f = parseFloat(document.getElementById("filtro").value);
    const b = document.getElementById("buscar").value.trim().toLowerCase();
    const lista = EQUIPOS.filter(t => (!f || (f === 3 ? t.estrellas <= 3 : t.estrellas === f)) && (!b || t.nombre.toLowerCase().includes(b)));
    picker.innerHTML = lista.length ? lista.map(t => { const ocup = EQUIPOS_OCUPADOS.has(t.id);
      return `<div class="pick ${elegido === t.id ? "sel" : ""} ${ocup ? "taken" : ""}" data-id="${t.id}">${crest(t)}<b>${t.nombre}</b><small>${stars(t.estrellas)}</small><em>${ocup ? "Ya elegido" : $money(t.precio)}</em></div>`; }).join("")
      : `<p class="muted">No hay equipos con ese filtro.</p>`;
  };
  picker.addEventListener("click", e => {
    const el = e.target.closest(".pick"); if (!el || el.classList.contains("taken")) return;
    elegido = Number(el.dataset.id); const t = teamById(elegido);
    document.getElementById("sel-nombre").textContent = t.nombre + " " + stars(t.estrellas);
    document.getElementById("sel-precio").textContent = $money(t.precio);
    pintar();
  });
  document.getElementById("filtro").addEventListener("change", pintar);
  document.getElementById("buscar").addEventListener("input", pintar);
  pintar();
  return {
    get: () => elegido,
    reset: () => { elegido = null; document.getElementById("sel-nombre").textContent = "Ninguno"; document.getElementById("sel-precio").textContent = "$0"; pintar(); },
  };
}

function vistaInscripcion() {
  if (LIVE) return vistaInscripcionLive();
  return `<div class="wrap fade"><div class="formbox">
    <h2>Inscribite a la <span class="grad">liga</span></h2>
    <p class="muted" style="margin-top:8px">Completá tus datos, elegí tu equipo y decinos cuándo podés jugar.</p>
    <form id="form">
      <label class="lb">Nombre de jugador (el que va a verse en la tabla)</label>
      <input name="nombre" required minlength="3" maxlength="24" placeholder="Ej: QuichaProPlayer">
      <div class="row2">
        <div><label class="lb">Tu ID en EA FC / PSN / Xbox / EA ID</label><input name="gamertag" required placeholder="Tu usuario en la consola"></div>
        <div><label class="lb">WhatsApp (para coordinar partidos)</label><input name="whatsapp" required placeholder="Ej: 2262 123456"></div>
      </div>
      <label class="lb">Plataforma</label>
      <select name="plataforma"><option>PlayStation 5</option><option>PlayStation 4</option><option>Xbox Series</option><option>PC</option></select>

      <label class="lb">¿Qué día y horario te queda mejor? (marcá todos los que puedas)</label>
      ${availGridHTML()}

      ${equipoPickerHTML()}
      <button class="btn primary" style="width:100%;margin-top:18px" type="submit">Anotarme</button>
      <div id="resultado"></div>
    </form></div></div>`;
}

function iniciarInscripcion() {
  if (LIVE) return iniciarInscripcionLive();
  const sel = montarSelectorEquipos();
  document.getElementById("form").addEventListener("submit", e => {
    e.preventDefault();
    const out = document.getElementById("resultado");
    const disp = [...e.target.querySelectorAll('input[name="disp"]:checked')].map(x => x.value);
    if (!sel.get()) { out.innerHTML = `<div class="msg err">Elegí un equipo primero.</div>`; return; }
    if (!disp.length) { out.innerHTML = `<div class="msg err">Marcá al menos un día y horario en que puedas jugar.</div>`; return; }
    const d = Object.fromEntries(new FormData(e.target)); const t = teamById(sel.get());
    addInscripto({ nombre: d.nombre, gamertag: d.gamertag, whatsapp: d.whatsapp, plataforma: d.plataforma, equipoId: sel.get(), disp, ts: Date.now(), estado: "pendiente" });
    out.innerHTML = `<div class="msg">¡Listo, <b>${esc(d.nombre)}</b>! Quedaste anotado con <b>${t.nombre}</b>. Inscripción: <b>${$money(t.precio)}</b>. Elegiste ${disp.length} horarios. (Por ahora es una demostración: todavía no se guarda en la base de datos.)</div>`;
    e.target.reset(); sel.reset();
  });
}

// ---------- ADMIN ----------
function adminResumen() {
  const all = todasInscripciones().filter(x => x.estado !== "rechazada");
  const n = all.length;
  const conEq = all.map(x => ({ ...x, t: teamById(x.equipoId) }));
  // Con datos reales, la recaudación cuenta solo lo que figura como pagado
  const cobrados = LIVE ? conEq.filter(x => x.pagado) : conEq;
  const total = cobrados.reduce((a, x) => a + x.t.precio, 0);
  const porCobrar = LIVE ? conEq.filter(x => !x.pagado).reduce((a, x) => a + x.t.precio, 0) : 0;
  const cubre = Math.round(total / PREMIO * 100);
  const prom = cobrados.length ? total / cobrados.length : 0;

  // categorías de precio
  const cats = [[10000, "Hasta 3★"], [20000, "3.5 a 4★"], [50000, "4.5★"], [100000, "5★"]].map(([pr, nom]) => {
    const c = conEq.filter(x => x.t.precio === pr).length; return { nom, c, plata: c * pr };
  });
  const maxCat = Math.max(1, ...cats.map(c => c.c));

  // plataformas
  const plats = {}; all.forEach(x => plats[x.plataforma] = (plats[x.plataforma] || 0) + 1);
  const platList = Object.entries(plats).sort((a, b) => b[1] - a[1]);
  const colores = ["#ffc531", "#3ee6ff", "#8b7bff", "#35e08a", "#ff4d5e"];
  let acc = 0;
  const conic = platList.map(([, c], i) => { const a = acc / n * 100; acc += c; return `${colores[i % 5]} ${a}% ${acc / n * 100}%`; }).join(",");

  // equipos más elegidos
  const porEq = {}; conEq.forEach(x => porEq[x.t.nombre] = (porEq[x.t.nombre] || 0) + 1);
  const topEq = Object.entries(porEq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // mapa de calor de disponibilidad
  const cnt = {}; let maxH = 1;
  all.forEach(x => x.disp.forEach(k => { cnt[k] = (cnt[k] || 0) + 1; maxH = Math.max(maxH, cnt[k]); }));
  const slots = [];
  DIAS.forEach(d => TURNOS.forEach(tn => slots.push({ d, tn, c: cnt[d + "|" + tn] || 0 })));
  const mejores = [...slots].sort((a, b) => b.c - a.c).slice(0, 3);
  const heat = `<div class="hh"></div>${TURNOS.map(tn => `<div class="hh">${ICONO_TURNO[tn]} ${tn}</div>`).join("")}` +
    DIAS.map(d => `<div class="hd">${d}</div>` + TURNOS.map(tn => {
      const c = cnt[d + "|" + tn] || 0, a = c / maxH, best = mejores[0].d === d && mejores[0].tn === tn;
      return `<div class="${best ? "best" : ""}" style="background:rgba(255,197,49,${(0.05 + a * 0.8).toFixed(2)});color:${a > 0.55 ? "#04101f" : "var(--txt)"}">${c}</div>`; }).join("")).join("");
  const turnoTot = TURNOS.map(tn => ({ tn, c: slots.filter(s => s.tn === tn).reduce((a, s) => a + s.c, 0) }));
  const maxTurno = Math.max(1, ...turnoTot.map(x => x.c));
  const diaTot = DIAS.map(d => ({ d, c: slots.filter(s => s.d === d).reduce((a, s) => a + s.c, 0) }));
  const maxDia = Math.max(1, ...diaTot.map(x => x.c));

  // inscripciones por día (últimos 7)
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
      <div class="kpi"><b style="color:var(--win)">${n}</b><span>${LIVE ? "Inscriptos" : `Inscriptos (${reales} reales + ${n - reales} de ejemplo)`}</span></div>
      ${LIVE ? `<div class="kpi"><b>${all.filter(x => x.estado === "pendiente").length}</b><span>Pendientes de aprobar</span></div>` : ""}
      <div class="kpi"><b class="gold">${$money(total)}</b><span>${LIVE ? "Cobrado (marcado como pagado)" : "Recaudación total"}</span></div>
      ${LIVE ? `<div class="kpi"><b>${$money(porCobrar)}</b><span>Por cobrar</span></div>` : ""}
      <div class="kpi"><b>${cubre}%</b><span>del premio cubierto (${$money(PREMIO)})</span></div>
      <div class="kpi"><b>${$money(prom)}</b><span>Ticket promedio (cobrado)</span></div>
      <div class="kpi"><b>${Math.max(0, META_INSCRIPTOS - n)}</b><span>Cupos libres de ${META_INSCRIPTOS}</span></div>
    </div>
    <div class="progress" style="margin-top:14px"><i style="width:${Math.min(100, cubre)}%"></i></div>
    <p class="muted" style="font-size:13px;margin-top:6px">${cubre >= 100 ? "La recaudación ya cubre el premio." : "Faltan " + $money(Math.max(0, PREMIO - total)) + " para cubrir el premio con las inscripciones."}</p>

    <div class="adm-grid">
      <div class="card"><h3 class="sub">Mejores horarios para jugar</h3>
        <div class="heat">${heat}</div>
        <p class="muted" style="font-size:12px;margin-top:8px">Cada celda es la cantidad de jugadores que puede ese día y turno. Borde dorado: el mejor.</p>
        <div class="top3">${mejores.map((m, i) => `<div><b>#${i + 1} ${m.d}</b><span class="muted">${m.tn} · ${m.c} jugadores</span></div>`).join("")}</div>
      </div>
      <div class="card"><h3 class="sub">Disponibilidad por turno y por día</h3>
        ${turnoTot.map(x => `<div class="hbar"><span>${ICONO_TURNO[x.tn]} ${x.tn}</span><div class="track"><i style="width:${x.c / maxTurno * 100}%"></i></div><b>${x.c}</b></div>`).join("")}
        <div style="height:10px"></div>
        ${diaTot.map(x => `<div class="hbar"><span>${x.d}</span><div class="track"><i style="width:${x.c / maxDia * 100}%"></i></div><b>${x.c}</b></div>`).join("")}
      </div>
      <div class="card"><h3 class="sub">Inscriptos por categoría</h3>
        ${cats.map(c => `<div class="hbar"><span>${c.nom}</span><div class="track"><i style="width:${c.c / maxCat * 100}%"></i></div><b>${c.c} · ${$money(c.plata)}</b></div>`).join("")}
      </div>
      <div class="card"><h3 class="sub">Equipos más elegidos</h3>
        ${topEq.map(([nom, c]) => { const t = teamByName(nom); return `<div class="hbar"><span class="team-cell">${crest(t)}</span><div><b style="font-size:14px">${nom}</b><div class="track" style="margin-top:4px"><i style="width:${c / topEq[0][1] * 100}%"></i></div></div><b>${c}</b></div>`; }).join("") || "<p class='muted'>Sin datos</p>"}
      </div>
      <div class="card"><h3 class="sub">Plataformas</h3>
        <div class="donut"><div class="ring2" style="background:conic-gradient(${conic || "#1f2e4c 0 100%"})"></div>
        <div>${platList.map(([nom, c], i) => `<div class="lg-item"><i style="background:${colores[i % 5]}"></i>${nom}: <b>${c}</b> (${Math.round(c / n * 100)}%)</div>`).join("")}</div></div>
      </div>
      <div class="card"><h3 class="sub">Inscripciones por día</h3>
        <div style="display:flex;align-items:flex-end;gap:8px;height:150px">${dias7.map(d => `<div style="flex:1;text-align:center"><div style="height:${Math.max(4, d.c / max7 * 110)}px;background:linear-gradient(180deg,var(--accent),var(--sea));border-radius:3px 3px 0 0"></div><b style="font-size:13px">${d.c}</b><div class="muted" style="font-size:10px">${d.l}</div></div>`).join("")}</div>
      </div>
    </div>

    <h3 class="sub" style="margin-top:28px">Todos los inscriptos</h3>
    <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>Estrellas</th><th>Inscripción</th><th>Plataforma</th><th>WhatsApp</th><th class="l">Horarios</th></tr></thead><tbody>
      ${conEq.map((x, i) => `<tr><td>${i + 1}</td><td class="l"><b>${esc(x.nombre)}</b>${x.demo ? ' <span class="badge">ejemplo</span>' : ""}${LIVE ? ` <span class="badge ${x.estado === 'aprobada' ? 'g' : 'y'}">${x.estado}</span>` : ""}</td><td class="l"><div class="team-cell">${crest(x.t)}${x.t.nombre}</div></td><td class="gold">${stars(x.t.estrellas)}</td><td class="pts">${$money(x.t.precio)}</td><td>${esc(x.plataforma)}</td><td>${esc(x.whatsapp) || "—"}</td><td class="l muted" style="white-space:normal;min-width:220px;font-size:12px">${resumenDisp(x.disp)}</td></tr>`).join("")}
    </tbody></table></div>
    ${LIVE ? "" : `<div class="warn">Los datos de este panel son de ejemplo. Cuando conectes Supabase se van a ver los inscriptos reales.</div>`}
  </div>`;
}
function resumenDisp(disp) {
  return DIAS.map(d => { const ts = TURNOS.filter(tn => disp.includes(d + "|" + tn)); return ts.length ? `<b>${d.slice(0, 3)}</b> ${ts.map(t => t[0]).join("/")}` : ""; }).filter(Boolean).join(" · ");
}
function iniciarAdmin() {
  const b = document.getElementById("csv"); if (!b) return;
  b.addEventListener("click", () => {
    const filas = [["Nombre", "ID consola", "WhatsApp", "Plataforma", "Equipo", "Estrellas", "Precio", "Horarios"]];
    todasInscripciones().forEach(x => { const t = teamById(x.equipoId); filas.push([x.nombre, x.gamertag || "", x.whatsapp || "", x.plataforma, t.nombre, t.estrellas, t.precio, x.disp.join(" ")]); });
    const csv = "﻿" + filas.map(f => f.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "inscriptos-liga.csv"; a.click();
  });
}

// ============================================================
//  EFECTOS: carrusel, cuenta regresiva, contadores, reveal
// ============================================================
function iniciarCarrusel() {
  const root = document.getElementById("carousel"); if (!root) return;
  const slides = [...root.querySelectorAll(".slide")], dots = [...root.querySelectorAll(".dot")], prog = root.querySelector(".cprog i");
  let i = 0, timer = null;
  const reiniciarBarra = () => { prog.style.animation = "none"; void prog.offsetWidth; prog.style.animation = ""; };
  const ir = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
    countUp(slides[i]); reiniciarBarra();
  };
  const arrancar = () => { clearInterval(timer); timer = setInterval(() => ir(i + 1), 7000); TIMERS.push(timer); reiniciarBarra(); prog.style.animationPlayState = "running"; };
  const pausar = () => { clearInterval(timer); prog.style.animationPlayState = "paused"; };
  dots.forEach((d, k) => d.addEventListener("click", () => { ir(k); arrancar(); }));
  document.getElementById("prev").addEventListener("click", () => { ir(i - 1); arrancar(); });
  document.getElementById("next").addEventListener("click", () => { ir(i + 1); arrancar(); });
  root.addEventListener("mouseenter", pausar); root.addEventListener("mouseleave", arrancar);
  arrancar();
}

function iniciarCuentaRegresiva() {
  const el = document.getElementById("cd"); if (!el) return;
  const pintar = () => {
    let ms = new Date(INICIO).getTime() - Date.now();
    if (ms <= 0) { el.innerHTML = `<div style="min-width:160px"><b>¡YA ARRANCÓ!</b></div>`; return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
    el.innerHTML = [[d, "Días"], [h, "Horas"], [m, "Min"], [s, "Seg"]].map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
  };
  pintar(); TIMERS.push(setInterval(pintar, 1000));
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
const RUTAS_CON_CARRUSEL = ["", undefined];
function render() {
  clearTimers();
  const hash = location.hash.replace(/^#\/?/, "");
  const [ruta, param, param2, param3] = hash.split("/");
  let html = "", init = null, esInicio = false;
  switch (ruta) {
    case "": html = vistaInicio(); esInicio = true; break;
    case "ligas": html = vistaLigas(); break;
    case "liga": html = vistaLiga((param || "A").toUpperCase(), param2); break;
    case "equipos": html = vistaEquipos(); break;
    case "jugadores": html = vistaJugadores(); break;
    case "jugador": html = vistaJugador(param); break;
    case "partido": html = vistaPartido(param, param2); break;
    case "inscripcion": html = vistaInscripcion(); init = iniciarInscripcion; break;
    case "ingresar": case "registro": case "login": html = vistaAuth(ruta === "registro" ? "registro" : "ingresar"); init = iniciarAuth; break;
    case "panel": html = vistaPanel(); init = iniciarPanel; break;
    case "admin": html = vistaAdminShell(param, param2, param3); init = iniciarAdminShell; break;
    default: html = vistaInicio(); esInicio = true;
  }
  app.innerHTML = (typeof bannerErrorDatos === "function" ? bannerErrorDatos() : "") + html;
  if (init) init();
  if (esInicio) { iniciarCarrusel(); iniciarCuentaRegresiva(); countUp(app.querySelector(".slide.active")); }
  const activa = ruta === "liga" || ruta === "partido" ? "ligas" : ruta === "jugador" ? "jugadores" : (ruta === "registro" || ruta === "login") ? "ingresar" : ruta;
  if (typeof renderMenu === "function") renderMenu(activa);
  if (!KEEP_SCROLL) window.scrollTo(0, 0);
  KEEP_SCROLL = false;
  iniciarReveal();
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll(".bar i[data-w]").forEach(b => b.style.width = b.dataset.w + "%"), 60));
}
// El arranque (cargar datos y llamar a render) está al final de panel.js
