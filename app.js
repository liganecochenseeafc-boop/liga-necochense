// ============================================================
//  LÓGICA DE LA PÁGINA (versión 2: diseño nuevo + admin)
//  Los datos siguen siendo de ejemplo hasta conectar Supabase.
// ============================================================
const app = document.getElementById("app");
const $money = n => "$" + Math.round(Number(n)).toLocaleString("es-AR");
const stars = n => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
const teamById = id => EQUIPOS.find(t => t.id === id);
const teamByName = n => EQUIPOS.find(t => t.nombre === n);
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
  return [...DEMO_INSCRIPTOS.map(x => ({ ...x, demo: true })), ...getInscriptos().map(x => ({ ...x, demo: false }))];
}
function tablaLiga(id) {
  return PARTICIPANTES.filter(p => p.liga === id).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

// ---------- Ilustraciones propias (SVG) ----------
function playerSVG(p = "a") {
  return `<svg viewBox="0 0 400 520" class="player-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jugador ilustrado de la liga">
  <defs>
    <linearGradient id="${p}j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d4a39"/><stop offset="1" stop-color="#04130f"/></linearGradient>
    <linearGradient id="${p}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3a97c"/><stop offset="1" stop-color="#c78556"/></linearGradient>
    <clipPath id="${p}c"><path d="M30 520C30 420 90 372 200 362C310 372 370 420 370 520Z"/></clipPath>
  </defs>
  <text x="200" y="330" text-anchor="middle" font-size="380" font-family="Barlow Condensed,Arial" font-weight="800" font-style="italic" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2">10</text>
  <path d="M30 520C30 420 90 372 200 362C310 372 370 420 370 520Z" fill="url(#${p}j)"/>
  <g clip-path="url(#${p}c)"><path d="M-20 420L420 340L420 392L-20 472Z" fill="#00ff87"/><path d="M-20 486L420 406L420 420L-20 500Z" fill="#fff" opacity=".85"/></g>
  <path d="M168 366L200 414L232 366Z" fill="#04130f"/><path d="M160 364L200 422L240 364" stroke="#00ff87" stroke-width="6" fill="none" stroke-linejoin="round"/>
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
  <path d="M133 232C126 124 274 124 267 232" fill="none" stroke="#00ff87" stroke-width="2" opacity=".7"/>
  <rect x="110" y="214" width="32" height="68" rx="15" fill="#0a101d" stroke="#00ff87" stroke-width="4"/>
  <rect x="258" y="214" width="32" height="68" rx="15" fill="#0a101d" stroke="#00ff87" stroke-width="4"/>
  <path d="M122 276q-4 44 42 52" stroke="#0a101d" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="166" cy="328" r="8" fill="#00ff87"/>
  <text x="200" y="508" text-anchor="middle" font-size="64" font-family="Barlow Condensed,Arial" font-weight="800" font-style="italic" fill="#04130f" opacity=".85">10</text>
  </svg>`;
}
function trophySVG(cls = "") {
  return `<svg class="${cls}" viewBox="0 0 200 200"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs>
  <path d="M60 30h80v40c0 28-18 48-40 52-22-4-40-24-40-52z" fill="url(#tg)"/>
  <path d="M60 40H38c0 28 12 42 30 46M140 40h22c0 28-12 42-30 46" fill="none" stroke="url(#tg)" stroke-width="9" stroke-linecap="round"/>
  <rect x="92" y="120" width="16" height="28" fill="url(#tg)"/><rect x="66" y="148" width="68" height="14" rx="5" fill="url(#tg)"/>
  <circle cx="100" cy="68" r="14" fill="#fff3b8" opacity=".7"/></svg>`;
}

// ============================================================
//  VISTAS
// ============================================================
function slidesHTML() {
  const insc = todasInscripciones().length;
  const rm = teamByName("Real Madrid");
  const q = PERFIL_QUICHA, s = q.stats;
  const cloud = [
    ["Real Madrid", "left:6%;top:4%;width:120px;height:120px;font-size:44px;animation-delay:-1s"],
    ["Manchester City", "left:50%;top:0;width:96px;height:96px;font-size:36px;animation-delay:-3s"],
    ["FC Barcelona", "left:68%;top:30%;width:130px;height:130px;font-size:48px;animation-delay:-2s"],
    ["París Saint-Germain", "left:22%;top:38%;width:100px;height:100px;font-size:38px;animation-delay:-4s"],
    ["Bayern Múnich", "left:2%;top:68%;width:92px;height:92px;font-size:34px;animation-delay:-5s"],
    ["Liverpool", "left:46%;top:64%;width:116px;height:116px;font-size:42px;animation-delay:-1.5s"],
  ].map(([n, st]) => { const t = teamByName(n); return `<span>${crest(t, "", "position:absolute;border-radius:28px;" + st)}</span>`; }).join("");
  const tiers = [[3, "Hasta 3★", "Equipos chicos"], [4, "3.5 a 4★", "Equipos medios"], [4.5, "4.5★", "Equipos top"], [5, "5★", "Los mejores del juego"]]
    .map(([s2, t, d]) => `<div class="t"><span class="s">${stars(s2 === 4 ? 4 : s2)}</span><b>${$money(precioPorEstrellas(s2))}</b><small>${t} · ${d}</small></div>`).join("");
  const lig = LIGAS.map(l => { const lead = tablaLiga(l.id)[0]; return `<a class="league-row" href="#/liga/${l.id}"><span class="L" style="background:${l.color}">${l.id}</span><div><b>${l.nombre}</b><small>Líder: ${lead.nombre}</small></div><span class="r">${lead.pts} pts</span></a>`; }).join("");

  return `
  <div class="slide s1 active"><div class="wrap grid">
    <div>
      <span class="pill reveal-in">Temporada 1 · Inscripciones abiertas</span>
      <h1 class="reveal-in">El campeón<br>se lleva</h1>
      <div class="bignum reveal-in" data-count="${PREMIO}" data-money="1">${$money(PREMIO)}</div>
      <p class="lead reveal-in">La liga de EA FC 27 de Necochea. 5 ligas, tablas en vivo y estadísticas de cada pase y cada gol.</p>
      <div class="reveal-in"><div class="cd-label">Arranca en</div><div class="countdown" id="cd"></div>
      <div class="btns"><a class="btn primary" href="#/inscripcion">Quiero participar</a><a class="btn" href="#/liga/A">Ver tabla Liga A</a></div></div>
    </div>
    <div class="stage">
      <div class="glow"></div><div class="ring"></div>${playerSVG("h")}
      <div class="chip c1"><b>${s.goles}</b><span>Goles</span></div>
      <div class="chip c2 gold"><b>${s.precisionPases}%</b><span>Precisión de pases</span></div>
      <div class="chip c3"><b>${s.victorias}V · ${s.empates}E</b><span>Invicto</span></div>
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
      <span class="pill reveal-in">Estadísticas completas</span>
      <h1 class="reveal-in">Cada pase.<br>Cada gol.</h1>
      <p class="lead reveal-in">Perfil de jugador con goles, asistencias, pases, regates, posesión, tarjetas y más. Mirá el de ejemplo.</p>
      <div class="stat4 reveal-in">
        <div><b data-count="${s.goles}">${s.goles}</b><span>Goles</span></div><div><b data-count="${s.asistencias}">${s.asistencias}</b><span>Asistencias</span></div>
        <div><b data-count="${s.pases}">${s.pases}</b><span>Pases</span></div><div><b data-count="${s.precisionPases}" data-suf="%">${s.precisionPases}%</b><span>Precisión de pases</span></div>
      </div>
      <div class="btns reveal-in"><a class="btn primary" href="#/jugador/quichaproplayer">Ver perfil completo</a></div>
    </div>
    <div class="stage" style="place-items:center">
      <div class="fcard">
        <div class="top"><div><div class="ovr2">${q.ovr}</div><div class="pos2">DC</div>${crest(rm, "mini-crest")}</div><div class="pos2" style="text-align:right">NEC<br>LIGA A</div></div>
        ${playerSVG("f")}
        <div class="nm">${q.nombre}</div>
        <div class="fs"><span><b>${s.goles}</b>GOL</span><span><b>${s.asistencias}</b>AST</span><span><b>${s.precisionPases}</b>PAS</span><span><b>${q.habilidades[2][1]}</b>REG</span><span><b>${q.habilidades[6][1]}</b>VEL</span><span><b>${q.habilidades[1][1]}</b>PAC</span></div>
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
  const insc = todasInscripciones().length;
  const pct = Math.min(100, Math.round(insc / META_INSCRIPTOS * 100));
  const goleadores = [...PARTICIPANTES].sort((a, b) => b.gf - a.gf).slice(0, 5);
  return `
  <div class="carousel" id="carousel">
    ${slidesHTML()}
    <div class="ctrls"><div class="wrap">
      <div class="dots"><button class="dot on">Premio</button><button class="dot">Inscripción</button><button class="dot">Stats</button><button class="dot">Ligas</button></div>
      <div class="arrows"><button class="arrow" id="prev" aria-label="Anterior">‹</button><button class="arrow" id="next" aria-label="Siguiente">›</button></div>
    </div></div>
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
    <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>Liga</th><th>Goles</th></tr></thead><tbody>
      ${goleadores.map((p, i) => { const t = teamById(p.equipoId); return `<tr class="${i === 0 ? "top" : ""}"><td><span class="pos">${i + 1}</span></td>
        <td class="l"><a href="#/jugador/${p.id}"><b>${p.nombre}</b></a></td><td class="l"><div class="team-cell">${crest(t)}${t.nombre}</div></td>
        <td>${p.liga}</td><td class="pts">${p.gf}</td></tr>`; }).join("")}
    </tbody></table></div>
    <p class="muted" style="margin-top:10px;font-size:13px">* Datos de ejemplo hasta que arranque la temporada.</p>
  </div></section>

  <section class="block reveal"><div class="wrap">
    <div class="cta-band"><div style="position:relative;z-index:1"><h3>¿Listo para jugar?</h3><p class="muted" style="margin-top:6px">Anotate hoy y elegí tus horarios. Quedan ${Math.max(0, META_INSCRIPTOS - insc)} cupos.</p></div>
    <a class="btn primary" style="position:relative;z-index:1" href="#/inscripcion">Inscribirme ahora</a></div>
  </div></section>`;
}

function vistaLigas() {
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Las 5 <em>ligas</em></h2></div>
  <div class="cards">${LIGAS.map(l => {
    const t = tablaLiga(l.id)[0];
    return `<a class="card hover league-card" href="#/liga/${l.id}" style="border-top:3px solid ${l.color}">
      <span class="big">${l.id}</span><h3>${l.nombre}</h3><p class="muted">${l.desc}</p>
      <p style="margin-top:12px" class="muted">Líder: <b style="color:var(--txt)">${t.nombre}</b> (${t.pts} pts)</p></a>`; }).join("")}</div></div>`;
}

function vistaLiga(id) {
  const liga = LIGAS.find(l => l.id === id) || LIGAS[0];
  const tabla = tablaLiga(liga.id);
  const pod = [tabla[1], tabla[0], tabla[2]];
  const cls = ["p2", "p1", "p3"], nums = ["2º", "1º", "3º"];
  return `<div class="wrap fade" style="padding-top:40px">
    <div class="sec-title"><h2>${liga.nombre} · <em>Posiciones</em></h2></div>
    <div class="tabs">${LIGAS.map(l => `<a class="tab ${l.id === liga.id ? "active" : ""}" href="#/liga/${l.id}">${l.nombre}</a>`).join("")}</div>
    <div class="podium">${pod.map((p, i) => { const t = teamById(p.equipoId); return `<a class="pod ${cls[i]}" href="#/jugador/${p.id}"><div class="m">${nums[i]}</div>${crest(t, "lg")}<b style="margin-top:8px">${p.nombre}</b><small>${t.nombre}</small><div class="pp">${p.pts} pts</div></a>`; }).join("")}</div>
    <div class="table-wrap"><table><thead><tr>
      <th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pases</th><th>Tiros</th><th>Pos %</th><th>Forma</th><th>Pts</th></tr></thead><tbody>
      ${tabla.map((p, i) => { const t = teamById(p.equipoId);
        return `<tr class="${i < 2 ? "top" : i === tabla.length - 1 ? "last" : ""}"><td><span class="pos">${i + 1}</span></td>
        <td class="l"><a href="#/jugador/${p.id}"><b>${p.nombre}</b></a></td>
        <td class="l"><div class="team-cell">${crest(t)}<span>${t.nombre}<small>${stars(t.estrellas)}</small></span></div></td>
        <td>${p.pj}</td><td>${p.g}</td><td>${p.e}</td><td>${p.p}</td><td>${p.gf}</td><td>${p.gc}</td><td>${p.dg > 0 ? "+" : ""}${p.dg}</td>
        <td>${p.pases}</td><td>${p.tiros}</td><td>${p.posesion}</td>
        <td><div class="form">${p.forma.map(f => `<i class="${f}">${f}</i>`).join("")}</div></td><td class="pts">${p.pts}</td></tr>`; }).join("")}
    </tbody></table></div>
    <p class="muted" style="margin-top:10px;font-size:13px">Verde: zona de ascenso · Rojo: zona de descenso · Datos de ejemplo.</p></div>`;
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
  const lista = [...PARTICIPANTES].sort((a, b) => b.pts - a.pts);
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2><em>Jugadores</em></h2></div>
  <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${lista.map(p => { const t = teamById(p.equipoId);
    return `<a class="card hover" href="#/jugador/${p.id}" style="display:flex;gap:12px;align-items:center">${crest(t)}<div><b>${p.nombre}</b><div class="muted" style="font-size:13px">${t.nombre} · Liga ${p.liga}</div></div></a>`; }).join("")}</div></div>`;
}

function bar(label, val, max = 100, sufijo = "") {
  return `<div class="bar-row"><div class="top"><span>${label}</span><b>${val}${sufijo}</b></div><div class="bar"><i data-w="${Math.min(100, val / max * 100)}"></i></div></div>`;
}

function vistaJugador(id) {
  const p = PARTICIPANTES.find(x => x.id === id);
  if (!p) return `<div class="wrap" style="padding:80px 20px"><h2>Jugador no encontrado</h2><a class="btn" href="#/jugadores">Volver</a></div>`;
  const t = teamById(p.equipoId);
  if (id !== PERFIL_QUICHA.id) {
    return `<div class="wrap fade"><div class="profile-head">${crest(t, "lg")}<div><h1>${p.nombre}</h1>
      <div class="badges"><span class="badge g">Liga ${p.liga}</span><span class="badge y">${t.nombre} ${stars(t.estrellas)}</span></div></div></div>
      <div class="kpis"><div class="kpi"><b>${p.pj}</b><span>Partidos</span></div><div class="kpi"><b>${p.g}</b><span>Ganados</span></div><div class="kpi"><b>${p.gf}</b><span>Goles</span></div><div class="kpi"><b>${p.pts}</b><span>Puntos</span></div></div>
      <p class="muted" style="margin:20px 0">El perfil completo está en construcción. Mirá el de ejemplo: <a href="#/jugador/quichaproplayer" style="color:var(--green)">QuichaProPlayer</a>.</p></div>`;
  }
  const q = PERFIL_QUICHA, s = q.stats;
  return `<div class="wrap fade">
    <div class="profile-head">${crest(t, "lg")}
      <div><span class="pill">Líder · Liga A</span><h1 style="margin-top:8px">${q.nombre}</h1>
        <div class="badges"><span class="badge y">${t.nombre} ${stars(t.estrellas)}</span><span class="badge">${q.posicionFav}</span><span class="badge">${q.plataforma}</span><span class="badge">${q.ciudad}</span><span class="badge g">${q.racha}</span><span class="badge">Desde ${q.desde}</span></div></div>
      <div class="ovr"><b>${q.ovr}</b><span>NIVEL</span></div></div>

    <div class="kpis">
      <div class="kpi"><b>${s.partidos}</b><span>Partidos</span></div><div class="kpi"><b style="color:var(--green)">${s.victorias}</b><span>Victorias</span></div>
      <div class="kpi"><b>${s.empates}</b><span>Empates</span></div><div class="kpi"><b>${s.derrotas}</b><span>Derrotas</span></div>
      <div class="kpi"><b style="color:var(--gold)">${s.goles}</b><span>Goles</span></div><div class="kpi"><b>${s.asistencias}</b><span>Asistencias</span></div>
      <div class="kpi"><b>${s.mvp}</b><span>MVP</span></div><div class="kpi"><b>${s.vallasInvictas}</b><span>Vallas invictas</span></div>
    </div>

    <div class="pgrid" style="margin-top:20px">
      <div class="card"><h3 class="sub">Habilidades</h3>${q.habilidades.map(([n, v]) => bar(n, v)).join("")}</div>
      <div class="card"><h3 class="sub">Ataque</h3>
        ${bar("Precisión de tiros", s.precisionTiros, 100, "%")}${bar("Tiros al arco", s.tirosAlArco, s.tiros)}
        ${bar("Regates exitosos", s.regatesExitosos, s.regates)}
        <div class="kpis" style="margin-top:14px"><div class="kpi"><b>${s.tiros}</b><span>Tiros</span></div><div class="kpi"><b>${s.xG}</b><span>Goles esperados (xG)</span></div><div class="kpi"><b>${s.golesDeCabeza}</b><span>De cabeza</span></div><div class="kpi"><b>${s.golesDePenal}</b><span>De penal</span></div><div class="kpi"><b>${s.golesDeTiroLibre}</b><span>Tiro libre</span></div></div></div>
      <div class="card"><h3 class="sub">Pases</h3>
        ${bar("Precisión de pases", s.precisionPases, 100, "%")}${bar("Pases completados", s.pasesCompletados, s.pases)}
        <div class="kpis" style="margin-top:14px"><div class="kpi"><b>${s.pases}</b><span>Pases</span></div><div class="kpi"><b>${s.pasesClave}</b><span>Pases clave</span></div><div class="kpi"><b>${s.pasesProgresivos}</b><span>Progresivos</span></div></div></div>
      <div class="card"><h3 class="sub">Defensa y disciplina</h3>
        ${bar("Posesión media", s.posesion, 100, "%")}
        <div class="kpis" style="margin-top:14px"><div class="kpi"><b>${s.recuperaciones}</b><span>Recuperaciones</span></div><div class="kpi"><b>${s.intercepciones}</b><span>Intercepciones</span></div><div class="kpi"><b>${s.entradas}</b><span>Entradas</span></div><div class="kpi"><b>${s.faltasCometidas}</b><span>Faltas</span></div><div class="kpi"><b style="color:var(--gold)">${s.amarillas}</b><span>Amarillas</span></div><div class="kpi"><b style="color:var(--red)">${s.rojas}</b><span>Rojas</span></div></div></div>
    </div>

    <h3 class="sub" style="margin-top:26px">Últimos partidos</h3>
    <div class="table-wrap"><table><thead><tr><th>Fecha</th><th class="l">Rival</th><th>Resultado</th><th></th><th>Goles</th><th>Asist.</th></tr></thead><tbody>
      ${q.partidos.map(m => `<tr><td>${m.j}</td><td class="l"><b>${m.rival}</b></td><td>${m.res}</td><td><div class="form"><i class="${m.r}">${m.r}</i></div></td><td>${m.goles}</td><td>${m.asist}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="margin:12px 0 0;font-size:13px">* Perfil de ejemplo con datos ficticios.</p></div>`;
}

// ---------- INSCRIPCIÓN ----------
const ICONO_TURNO = { "Mañana": "☀️", "Tarde": "🌤️", "Noche": "🌙" };
const HORA_TURNO = { "Mañana": "8 a 13 h", "Tarde": "13 a 19 h", "Noche": "19 a 24 h" };
function vistaInscripcion() {
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
      <div class="avail">
        <span></span>${TURNOS.map(tn => `<div class="h">${ICONO_TURNO[tn]} ${tn}<br><span style="font-weight:500;letter-spacing:0">${HORA_TURNO[tn]}</span></div>`).join("")}
        ${DIAS.map(d => `<div class="d">${d}</div>${TURNOS.map(tn => `<label><input type="checkbox" name="disp" value="${d}|${tn}"><span class="c">${tn}</span></label>`).join("")}`).join("")}
      </div>

      <label class="lb">Elegí tu equipo</label>
      <div class="row2"><input id="buscar" placeholder="Buscar equipo..."><select id="filtro"><option value="0">Todas las estrellas</option><option value="5">5 estrellas</option><option value="4.5">4.5 estrellas</option><option value="4">4 estrellas</option><option value="3.5">3.5 estrellas</option><option value="3">3 estrellas o menos</option></select></div>
      <div class="team-pick" id="picker" style="margin-top:10px"></div>
      <div class="summary"><div><span class="muted">Equipo elegido</span><div id="sel-nombre" style="font-weight:700">Ninguno</div></div><div style="text-align:right"><span class="muted">Inscripción</span><br><b id="sel-precio">$0</b></div></div>
      <button class="btn primary" style="width:100%;margin-top:18px" type="submit">Anotarme</button>
      <div id="resultado"></div>
    </form></div></div>`;
}

function iniciarInscripcion() {
  let elegido = null;
  const picker = document.getElementById("picker");
  const pintar = () => {
    const f = parseFloat(document.getElementById("filtro").value);
    const b = document.getElementById("buscar").value.trim().toLowerCase();
    const lista = EQUIPOS.filter(t => (!f || (f === 3 ? t.estrellas <= 3 : t.estrellas === f)) && (!b || t.nombre.toLowerCase().includes(b)));
    picker.innerHTML = lista.length ? lista.map(t => `<div class="pick ${elegido === t.id ? "sel" : ""}" data-id="${t.id}">${crest(t)}<b>${t.nombre}</b><small>${stars(t.estrellas)}</small><em>${$money(t.precio)}</em></div>`).join("")
      : `<p class="muted">No hay equipos con ese filtro.</p>`;
  };
  picker.addEventListener("click", e => {
    const el = e.target.closest(".pick"); if (!el) return;
    elegido = Number(el.dataset.id); const t = teamById(elegido);
    document.getElementById("sel-nombre").textContent = t.nombre + " " + stars(t.estrellas);
    document.getElementById("sel-precio").textContent = $money(t.precio);
    pintar();
  });
  document.getElementById("filtro").addEventListener("change", pintar);
  document.getElementById("buscar").addEventListener("input", pintar);
  pintar();
  document.getElementById("form").addEventListener("submit", e => {
    e.preventDefault();
    const out = document.getElementById("resultado");
    const disp = [...e.target.querySelectorAll('input[name="disp"]:checked')].map(x => x.value);
    if (!elegido) { out.innerHTML = `<div class="msg err">Elegí un equipo primero.</div>`; return; }
    if (!disp.length) { out.innerHTML = `<div class="msg err">Marcá al menos un día y horario en que puedas jugar.</div>`; return; }
    const d = Object.fromEntries(new FormData(e.target)); const t = teamById(elegido);
    addInscripto({ nombre: d.nombre, gamertag: d.gamertag, whatsapp: d.whatsapp, plataforma: d.plataforma, equipoId: elegido, disp, ts: Date.now() });
    out.innerHTML = `<div class="msg">¡Listo, <b>${d.nombre}</b>! Quedaste anotado con <b>${t.nombre}</b>. Inscripción: <b>${$money(t.precio)}</b>. Elegiste ${disp.length} horarios. (Por ahora es una demostración: todavía no se guarda en la base de datos.)</div>`;
    e.target.reset(); elegido = null;
    document.getElementById("sel-nombre").textContent = "Ninguno"; document.getElementById("sel-precio").textContent = "$0";
    pintar();
  });
}

// ---------- ADMIN ----------
function vistaAdmin() {
  const all = todasInscripciones();
  const n = all.length;
  const conEq = all.map(x => ({ ...x, t: teamById(x.equipoId) }));
  const total = conEq.reduce((a, x) => a + x.t.precio, 0);
  const cubre = Math.round(total / PREMIO * 100);
  const prom = n ? total / n : 0;

  // categorías de precio
  const cats = [[10000, "Hasta 3★"], [20000, "3.5 a 4★"], [50000, "4.5★"], [100000, "5★"]].map(([pr, nom]) => {
    const c = conEq.filter(x => x.t.precio === pr).length; return { nom, c, plata: c * pr };
  });
  const maxCat = Math.max(1, ...cats.map(c => c.c));

  // plataformas
  const plats = {}; all.forEach(x => plats[x.plataforma] = (plats[x.plataforma] || 0) + 1);
  const platList = Object.entries(plats).sort((a, b) => b[1] - a[1]);
  const colores = ["#00ff87", "#3b82f6", "#8b5cf6", "#ffc83d", "#ff4d6d"];
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
      return `<div class="${best ? "best" : ""}" style="background:rgba(0,255,135,${(0.05 + a * 0.8).toFixed(2)});color:${a > 0.55 ? "#04101f" : "var(--txt)"}">${c}</div>`; }).join("")).join("");
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

  return `<div class="wrap fade" style="padding-top:40px">
    <div class="sec-title"><h2>Panel de <em>administrador</em></h2><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">${ADMIN_EMAIL}</span><button class="btn small" id="csv">⬇ Exportar CSV</button><button class="btn small" id="salir">Cerrar sesión</button></div></div>
    <div class="kpis">
      <div class="kpi"><b style="color:var(--green)">${n}</b><span>Inscriptos (${reales} reales + ${n - reales} de ejemplo)</span></div>
      <div class="kpi"><b class="gold">${$money(total)}</b><span>Recaudación total</span></div>
      <div class="kpi"><b>${cubre}%</b><span>del premio cubierto (${$money(PREMIO)})</span></div>
      <div class="kpi"><b>${$money(prom)}</b><span>Ticket promedio</span></div>
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
        <div style="display:flex;align-items:flex-end;gap:8px;height:150px">${dias7.map(d => `<div style="flex:1;text-align:center"><div style="height:${Math.max(4, d.c / max7 * 110)}px;background:linear-gradient(180deg,var(--green),var(--blue));border-radius:8px 8px 3px 3px"></div><b style="font-size:13px">${d.c}</b><div class="muted" style="font-size:10px">${d.l}</div></div>`).join("")}</div>
      </div>
    </div>

    <h3 class="sub" style="margin-top:28px">Todos los inscriptos</h3>
    <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>Estrellas</th><th>Inscripción</th><th>Plataforma</th><th>WhatsApp</th><th class="l">Horarios</th></tr></thead><tbody>
      ${conEq.map((x, i) => `<tr><td>${i + 1}</td><td class="l"><b>${x.nombre}</b>${x.demo ? ' <span class="badge">ejemplo</span>' : ""}</td><td class="l"><div class="team-cell">${crest(x.t)}${x.t.nombre}</div></td><td class="gold">${stars(x.t.estrellas)}</td><td class="pts">${$money(x.t.precio)}</td><td>${x.plataforma}</td><td>${x.whatsapp || "—"}</td><td class="l muted" style="white-space:normal;min-width:220px;font-size:12px">${resumenDisp(x.disp)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="warn">Los datos de este panel todavía son de ejemplo. En el próximo paso las inscripciones se guardan en Supabase y solo el administrador puede leerlas.</div>
  </div>`;
}
function resumenDisp(disp) {
  return DIAS.map(d => { const ts = TURNOS.filter(tn => disp.includes(d + "|" + tn)); return ts.length ? `<b>${d.slice(0, 3)}</b> ${ts.map(t => t[0]).join("/")}` : ""; }).filter(Boolean).join(" · ");
}
function iniciarAdmin() {
  const so = document.getElementById("salir"); if (so) so.addEventListener("click", cerrarSesion);
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
//  LOGIN DE ADMINISTRADOR (Supabase Auth)
//  La contraseña NO está en el código: vive en Supabase.
// ============================================================
let sb = null;
if (window.supabase && typeof SUPABASE_URL !== "undefined" && SUPABASE_URL && !SUPABASE_URL.startsWith("PEGAR")) {
  try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) { sb = null; }
}
let ES_ADMIN = false, ADMIN_EMAIL = "";

async function verificarAdmin() {
  ES_ADMIN = false; ADMIN_EMAIL = "";
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    const user = data && data.session && data.session.user;
    if (!user) return;
    // Solo es admin si su email está en la tabla "admins"
    const r = await sb.from("admins").select("email").eq("email", user.email).maybeSingle();
    if (r.data) { ES_ADMIN = true; ADMIN_EMAIL = user.email; }
  } catch (e) { ES_ADMIN = false; }
}

function vistaLogin() {
  return `<div class="wrap fade"><div class="formbox" style="max-width:480px">
    <span class="pill">Acceso restringido</span>
    <h2 style="margin-top:12px">Ingreso <span class="grad">admin</span></h2>
    <p class="muted" style="margin-top:8px">Solo para la organización de la liga.</p>
    ${sb ? "" : `<div class="warn">Todavía falta conectar Supabase: completá el archivo <b>config.js</b> con la URL y la clave de tu proyecto. Hasta entonces el panel no se puede abrir.</div>`}
    <form id="login">
      <label class="lb">Email</label>
      <input name="email" type="email" required autocomplete="username" placeholder="tu-email@gmail.com">
      <label class="lb">Contraseña</label>
      <input name="password" type="password" required autocomplete="current-password" placeholder="Tu contraseña">
      <button class="btn primary" style="width:100%;margin-top:18px" type="submit" ${sb ? "" : "disabled"}>Entrar</button>
      <button class="btn" style="width:100%;margin-top:10px;opacity:.5;cursor:not-allowed" type="button" disabled>Continuar con Google (próximamente)</button>
      <div id="login-msg"></div>
    </form></div></div>`;
}

function iniciarLogin() {
  const f = document.getElementById("login"); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const out = document.getElementById("login-msg");
    if (!sb) { out.innerHTML = `<div class="msg err">Supabase todavía no está conectado.</div>`; return; }
    const d = Object.fromEntries(new FormData(f));
    out.innerHTML = `<div class="msg">Verificando...</div>`;
    const { error } = await sb.auth.signInWithPassword({ email: d.email.trim(), password: d.password });
    if (error) { out.innerHTML = `<div class="msg err">Email o contraseña incorrectos.</div>`; return; }
    await verificarAdmin();
    if (!ES_ADMIN) {
      await sb.auth.signOut();
      out.innerHTML = `<div class="msg err">Esa cuenta no tiene permisos de administrador.</div>`; return;
    }
    location.hash = "#/admin"; render();
  });
}

async function cerrarSesion() {
  if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
  ES_ADMIN = false; ADMIN_EMAIL = "";
  location.hash = "#/"; render();
}

// ============================================================
//  ROUTER
// ============================================================
function render() {
  clearTimers();
  const hash = location.hash.replace(/^#\/?/, "");
  const [ruta, param] = hash.split("/");
  let html = "";
  switch (ruta) {
    case "": html = vistaInicio(); break;
    case "ligas": html = vistaLigas(); break;
    case "liga": html = vistaLiga((param || "A").toUpperCase()); break;
    case "equipos": html = vistaEquipos(); break;
    case "jugadores": html = vistaJugadores(); break;
    case "jugador": html = vistaJugador(param); break;
    case "inscripcion": html = vistaInscripcion(); break;
    case "admin": html = ES_ADMIN ? vistaAdmin() : vistaLogin(); break;
    case "login": html = ES_ADMIN ? vistaAdmin() : vistaLogin(); break;
    default: html = vistaInicio();
  }
  app.innerHTML = html;
  if (ruta === "inscripcion") iniciarInscripcion();
  if (ruta === "admin" || ruta === "login") { if (ES_ADMIN) iniciarAdmin(); else iniciarLogin(); }
  if (!ruta || !["ligas", "liga", "equipos", "jugadores", "jugador", "inscripcion", "admin", "login"].includes(ruta)) { iniciarCarrusel(); iniciarCuentaRegresiva(); countUp(app.querySelector(".slide.active")); }
  document.querySelectorAll("#menu a").forEach(a => a.classList.toggle("active", a.dataset.r === (ruta === "liga" ? "ligas" : ruta === "jugador" ? "jugadores" : ruta)));
  window.scrollTo(0, 0);
  iniciarReveal();
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll(".bar i[data-w]").forEach(b => b.style.width = b.dataset.w + "%"), 60));
}
window.addEventListener("hashchange", render);
render();
// Al cargar, revisamos si ya hay una sesión de administrador abierta
verificarAdmin().then(() => { if (/^#\/(admin|login)/.test(location.hash)) render(); });
