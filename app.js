// ============================================================
//  LÓGICA DE LA PÁGINA (versión 1 con datos de ejemplo)
// ============================================================
const app = document.getElementById("app");
const $money = n => "$" + Number(n).toLocaleString("es-AR");
const stars = n => {
  const full = Math.floor(n), half = n % 1 ? "½" : "";
  return "★".repeat(full) + half;
};
const teamById = id => EQUIPOS.find(t => t.id === id);
const crest = (t, cls = "") =>
  `<span class="crest ${cls}" style="background:linear-gradient(135deg,${t.c1},${t.c2});${isLight(t.c1) ? "color:#111;" : ""}">${t.iniciales}</span>`;
function isLight(hex) {
  const h = hex.replace("#", ""); const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}

// Inscripciones de ejemplo guardadas en el navegador (en la versión 2 pasan a Supabase)
function getInscriptos() { try { return JSON.parse(localStorage.getItem("inscriptos") || "[]"); } catch (e) { return []; } }
function addInscripto(x) { const a = getInscriptos(); a.push(x); try { localStorage.setItem("inscriptos", JSON.stringify(a)); } catch (e) {} }

function tablaLiga(id) {
  return PARTICIPANTES.filter(p => p.liga === id)
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

/* ---------- VISTAS ---------- */
function vistaInicio() {
  const inscriptos = 17 + getInscriptos().length; // número de ejemplo
  const pct = Math.min(100, Math.round(inscriptos / META_INSCRIPTOS * 100));
  const goleadores = [...PARTICIPANTES].sort((a, b) => b.gf - a.gf).slice(0, 5);
  return `
  <section class="hero"><div class="wrap grid fade">
    <div>
      <span class="pill">🔴 Inscripciones abiertas · Temporada 1</span>
      <h1>La liga de <span class="grad">EA FC 27</span> de Necochea</h1>
      <p class="lead">Elegí tu equipo, competí en 5 ligas y peleá por <b>${$money(PREMIO)}</b> para el campeón. Estadísticas completas de cada partido.</p>
      <div class="btns">
        <a class="btn primary" href="#/inscripcion">Quiero participar</a>
        <a class="btn" href="#/liga/A">Ver tabla Liga A</a>
      </div>
      <div style="margin-top:26px;max-width:460px">
        <div style="display:flex;justify-content:space-between;font-size:14px"><span><b>${inscriptos}</b> inscriptos</span><span class="muted">Meta: ${META_INSCRIPTOS} jugadores</span></div>
        <div class="progress"><i style="width:${pct}%"></i></div>
      </div>
    </div>
    <div class="trophy">
      <svg viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs>
        <path d="M60 30h80v40c0 28-18 48-40 52-22-4-40-24-40-52z" fill="url(#g)"/>
        <path d="M60 40H38c0 28 12 42 30 46M140 40h22c0 28-12 42-30 46" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round"/>
        <rect x="92" y="120" width="16" height="28" fill="url(#g)"/><rect x="66" y="148" width="68" height="14" rx="5" fill="url(#g)"/>
        <circle cx="100" cy="68" r="14" fill="#fff3b8" opacity=".7"/></svg>
      <div class="prize"><b>${$money(PREMIO)}</b><span>Premio al campeón</span></div>
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="stats-row">
      <div class="stat"><b>5</b><span>Ligas (A a la E)</span></div>
      <div class="stat"><b>${EQUIPOS.length}</b><span>Equipos disponibles</span></div>
      <div class="stat"><b>${inscriptos}</b><span>Jugadores inscriptos</span></div>
      <div class="stat"><b>${$money(PREMIO)}</b><span>Premio campeón</span></div>
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="sec-title"><h2>Elegí tu liga</h2><a href="#/ligas">Ver todas →</a></div>
    <div class="cards">${LIGAS.map(l => `
      <a class="card hover league-card" href="#/liga/${l.id}" style="border-top:3px solid ${l.color}">
        <span class="big">${l.id}</span><h3>${l.nombre}</h3><p class="muted">${l.desc}</p>
        <p style="margin-top:10px;font-weight:600">8 jugadores →</p></a>`).join("")}</div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="sec-title"><h2>Cuánto sale inscribirse</h2><a href="#/equipos">Ver equipos →</a></div>
    <div class="tier">
      ${[[3, "Hasta 3 estrellas"], [4, "3.5 a 4 estrellas"], [4.5, "4.5 estrellas"], [5, "5 estrellas"]].map(([s, t]) => `
        <div class="card"><div class="stars">${stars(s === 3 ? 3 : s)}</div><div class="muted">${t}</div>
        <div class="price">${$money(precioPorEstrellas(s))}</div></div>`).join("")}
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="sec-title"><h2>Máximos goleadores</h2></div>
    <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">Equipo</th><th>Liga</th><th>Goles</th></tr></thead><tbody>
      ${goleadores.map((p, i) => { const t = teamById(p.equipoId); return `<tr class="${i === 0 ? "top" : ""}"><td><span class="pos">${i + 1}</span></td>
        <td class="l"><a href="#/jugador/${p.id}"><b>${p.nombre}</b></a></td><td class="l"><div class="team-cell">${crest(t)}${t.nombre}</div></td>
        <td>${p.liga}</td><td class="pts">${p.gf}</td></tr>`; }).join("")}
    </tbody></table></div>
    <p class="muted" style="margin-top:10px;font-size:13px">* Datos de ejemplo hasta que arranque la temporada.</p>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;background:linear-gradient(135deg,#0f2a3d,#13203a)">
      <div><h3 style="font-size:30px">Mirá cómo es un perfil completo</h3><p class="muted">Pases, goles, regates, posesión y mucho más. Ejemplo: QuichaProPlayer.</p></div>
      <a class="btn primary" href="#/jugador/quichaproplayer">Ver perfil de ejemplo</a>
    </div>
  </div></section>`;
}

function vistaLigas() {
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Las 5 ligas</h2></div>
  <div class="cards">${LIGAS.map(l => {
    const t = tablaLiga(l.id)[0];
    return `<a class="card hover league-card" href="#/liga/${l.id}" style="border-top:3px solid ${l.color}">
      <span class="big">${l.id}</span><h3>${l.nombre}</h3><p class="muted">${l.desc}</p>
      <p style="margin-top:12px" class="muted">Líder: <b style="color:var(--txt)">${t.nombre}</b> (${t.pts} pts)</p></a>`; }).join("")}</div></div>`;
}

function vistaLiga(id) {
  const liga = LIGAS.find(l => l.id === id) || LIGAS[0];
  const tabla = tablaLiga(liga.id);
  return `<div class="wrap fade" style="padding-top:40px">
    <div class="sec-title"><h2>${liga.nombre} · Tabla de posiciones</h2></div>
    <div class="tabs">${LIGAS.map(l => `<a class="tab ${l.id === liga.id ? "active" : ""}" href="#/liga/${l.id}">${l.nombre}</a>`).join("")}</div>
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
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Equipos disponibles</h2><a href="#/inscripcion">Elegir mi equipo →</a></div>
    ${grupos.map(([s, nom]) => `<h3 class="sub" style="margin-top:26px"><span style="color:var(--gold)">${stars(s)}</span> ${nom} · ${$money(precioPorEstrellas(s))}</h3>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${lista(s).map(t => `
      <div class="card hover" style="text-align:center">${crest(t, "lg")}<h3 style="margin-top:10px;font-size:20px">${t.nombre}</h3>
      <div class="muted">${stars(t.estrellas)} · ${$money(t.precio)}</div></div>`).join("")}</div>`).join("")}</div>`;
}

function vistaJugadores() {
  const lista = [...PARTICIPANTES].sort((a, b) => b.pts - a.pts);
  return `<div class="wrap fade" style="padding-top:40px"><div class="sec-title"><h2>Jugadores</h2></div>
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
      <p class="muted" style="margin:20px 0">El perfil completo con todas las estadísticas está en construcción. Mirá el de ejemplo: <a href="#/jugador/quichaproplayer" style="color:var(--green)">QuichaProPlayer</a>.</p></div>`;
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

function vistaInscripcion() {
  return `<div class="wrap fade"><div class="formbox">
    <h2 style="font-size:42px">Inscribite a la liga</h2>
    <p class="muted">Completá tus datos y elegí con qué equipo querés jugar. El precio depende de las estrellas del equipo.</p>
    <form id="form">
      <label>Nombre de jugador (el que va a verse en la tabla)</label>
      <input name="nombre" required minlength="3" maxlength="24" placeholder="Ej: QuichaProPlayer">
      <label>Tu ID de jugador en EA FC / PSN / Xbox / EA ID</label>
      <input name="gamertag" required placeholder="Tu usuario en la consola">
      <label>WhatsApp (para coordinar partidos)</label>
      <input name="whatsapp" required placeholder="Ej: 2262 123456">
      <label>Plataforma</label>
      <select name="plataforma"><option>PlayStation 5</option><option>PlayStation 4</option><option>Xbox Series</option><option>PC</option></select>
      <label>Elegí tu equipo</label>
      <select id="filtro"><option value="0">Todos los equipos</option><option value="5">5 estrellas</option><option value="4.5">4.5 estrellas</option><option value="4">4 estrellas</option><option value="3.5">3.5 estrellas</option><option value="3">3 estrellas o menos</option></select>
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
    const lista = EQUIPOS.filter(t => !f || (f === 3 ? t.estrellas <= 3 : t.estrellas === f));
    picker.innerHTML = lista.map(t => `<div class="pick ${elegido === t.id ? "sel" : ""}" data-id="${t.id}">${crest(t)}<b>${t.nombre}</b><small>${stars(t.estrellas)}</small><em>${$money(t.precio)}</em></div>`).join("");
  };
  picker.addEventListener("click", e => {
    const el = e.target.closest(".pick"); if (!el) return;
    elegido = Number(el.dataset.id); const t = teamById(elegido);
    document.getElementById("sel-nombre").textContent = t.nombre + " " + stars(t.estrellas);
    document.getElementById("sel-precio").textContent = $money(t.precio);
    pintar();
  });
  document.getElementById("filtro").addEventListener("change", pintar);
  pintar();
  document.getElementById("form").addEventListener("submit", e => {
    e.preventDefault();
    const out = document.getElementById("resultado");
    if (!elegido) { out.innerHTML = `<div class="msg" style="border-color:var(--red);background:rgba(255,77,109,.1)">Elegí un equipo primero.</div>`; return; }
    const d = Object.fromEntries(new FormData(e.target)); const t = teamById(elegido);
    addInscripto({ ...d, equipoId: elegido });
    out.innerHTML = `<div class="msg">¡Listo, <b>${d.nombre}</b>! Quedaste anotado con <b>${t.nombre}</b>. Inscripción: <b>${$money(t.precio)}</b>. (Por ahora es una demostración: todavía no se guarda en la base de datos.)</div>`;
    e.target.reset(); elegido = null; pintar();
  });
}

/* ---------- ROUTER ---------- */
function render() {
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
    default: html = vistaInicio();
  }
  app.innerHTML = html;
  if (ruta === "inscripcion") iniciarInscripcion();
  document.querySelectorAll("#menu a").forEach(a => a.classList.toggle("active", a.dataset.r === (ruta === "liga" ? "ligas" : ruta === "jugador" ? "jugadores" : ruta)));
  window.scrollTo(0, 0);
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll(".bar i[data-w]").forEach(b => b.style.width = b.dataset.w + "%"), 60));
}
window.addEventListener("hashchange", render);
render();
