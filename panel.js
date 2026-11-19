// ============================================================
//  PANEL.JS · Conexión con Supabase, cuentas, panel del jugador
//  y administración de la liga.
//  Sin Supabase conectado (config.js sin completar) la página
//  funciona en modo ejemplo, igual que antes.
// ============================================================

// ---------- Conexión ----------
// Deja la URL en su forma correcta (https://XXXX.supabase.co), sin barras ni rutas de más
function normalizarUrlSupabase(u) {
  u = String(u || "").trim().replace(/^["']|["']$/g, "");
  const dash = u.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dash) return "https://" + dash[1].toLowerCase() + ".supabase.co";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { return new URL(u).origin; } catch (e) { return u; }
}
let sb = null;
if (window.supabase && typeof SUPABASE_URL !== "undefined" && SUPABASE_URL && !SUPABASE_URL.startsWith("PEGAR")) {
  try { sb = window.supabase.createClient(normalizarUrlSupabase(SUPABASE_URL), String(SUPABASE_ANON_KEY).trim()); } catch (e) { sb = null; }
}

// ---------- Estado ----------
let USER = null, ES_ADMIN = false, ADMIN_EMAIL = "", ADMIN_ERR = "";
let MI_PERFIL = null, MI_INSCS = [];
let ADM = { profiles: [], insc: [] };
let LOAD_ERR = "";
let ULTIMO_SORTEO = null;

// ---------- Utilidades ----------
function toast(msg, tipo = "ok") {
  const t = document.createElement("div");
  t.className = "toast " + tipo; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.classList.add("out"), 3400); setTimeout(() => t.remove(), 3900);
}
function msgErr(err) {
  const m = String(err && (err.message || err) || "").toLowerCase(), code = err && err.code;
  if (m.includes("cupo completo") || m.includes("cupo_completo")) return "El cupo de este torneo ya se completó.";
  if (m.includes("inscripcion cerrada") || m.includes("inscripcion_cerrada")) return "Este torneo ya no recibe inscripciones.";
  if (code === "23505" || m.includes("duplicate key")) {
    if (m.includes("user_torneo")) return "Ya estás anotado en este torneo.";
    if (m.includes("torneo_equipo")) return "Ese equipo ya fue asignado a otro jugador de este torneo.";
    if (m.includes("nombre")) return "Ese nombre de jugador ya está en uso. Elegí otro.";
    return "Ese dato ya existe (está duplicado).";
  }
  if (code === "42P01" || code === "PGRST205" || code === "42703" || m.includes("does not exist") || m.includes("could not find the") || m.includes("schema cache")) return "Falta ejecutar el archivo supabase-3-torneos.sql en Supabase (SQL Editor).";
  if (code === "42501" || m.includes("row-level security") || m.includes("permission denied")) return "No tenés permiso para hacer eso.";
  if (m.includes("failed to fetch") || m.includes("network")) return "No se pudo conectar con Supabase. Revisá tu conexión.";
  return "Error: " + (err && err.message ? err.message : err);
}
function explicarErrorLogin(err) {
  const m = String(err && err.message || err || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos. Si todavía no tenés cuenta, creala en «Crear cuenta».";
  if (m.includes("email not confirmed")) return "Tu email todavía no está confirmado. Revisá tu casilla (y spam) y tocá el link de confirmación.";
  if (m.includes("api key") || m.includes("apikey") || m.includes("jwt")) return "La clave de config.js es incorrecta. Volvé a copiar la anon public key.";
  if (m.includes("invalid path")) return "La URL de config.js está mal. Tiene que ser solo https://TU-PROYECTO.supabase.co, sin nada después de .co.";
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) return "No se pudo conectar con Supabase. Revisá la URL de config.js.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.";
  return "Error de Supabase: " + (err && err.message ? err.message : err);
}
function waLink(num) {
  let d = String(num || "").replace(/\D/g, ""); if (!d) return "";
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "549" + d;
  return "https://wa.me/" + d;
}
const aInputFecha = iso => { if (!iso) return ""; const d = new Date(iso), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const mesAnio = iso => { if (!iso) return "—"; const s = new Date(iso).toLocaleDateString("es-AR", { month: "long", year: "numeric" }); return s.charAt(0).toUpperCase() + s.slice(1); };
const optsPlataforma = sel => ["PlayStation 5", "PlayStation 4", "Xbox Series", "Nintendo Switch", "PC"].map(o => `<option ${o === sel ? "selected" : ""}>${o}</option>`).join("");
function bannerErrorDatos() {
  return LOAD_ERR ? `<div class="wrap" style="padding-top:20px"><div class="warn" style="margin:0"><b>No se pudieron cargar los datos.</b> ${esc(LOAD_ERR)}</div></div>` : "";
}

// ---------- Carga de datos ----------
function mapPartido(r) {
  const st = r.stats || {}, jugado = r.estado === "jugado" && st.ft;
  return { id: r.id, liga: r.torneo, jornada: r.jornada, a: r.jugador_a, b: r.jugador_b, estado: r.estado, fecha: r.fecha, ft: jugado ? st.ft : null, ht: jugado && st.ht ? st.ht : null };
}
function rachaDe(res) {
  let w = 0; for (let i = res.length - 1; i >= 0 && res[i] === "G"; i--) w++;
  if (w >= 3) return `Racha de ${w} victorias`;
  let u = 0; for (let i = res.length - 1; i >= 0 && res[i] !== "P"; i--) u++;
  return u >= 3 ? `Invicto en ${u} partidos` : "";
}
// Arma las estadísticas de cada participante sumando los partidos jugados (los mismos datos que da el juego).
// Un "participante" es una inscripción aprobada: una misma persona puede estar en varios torneos.
function calcularJugadores(pubs, partidos) {
  const n = v => Number(v) || 0;
  const SUMA = ["tiros", "tirosArco", "pases", "entradas", "faltas", "offsides", "corners", "amarillas", "rojas", "atajadas"];
  const jugados = partidos.filter(esJugado).sort((a, b) => a.jornada - b.jornada);
  return pubs.map(u => {
    const J = juegoDeLiga(u.liga), futbol = J.stats === "futbol", extras = statsDe(J).slice(1).map(x => x[0]);
    const p = { id: u.id, nombre: u.nombre || "Jugador", equipoId: u.equipo_id || 0, liga: u.liga || "", plataforma: u.plataforma || "—", ciudad: "Necochea", desde: mesAnio(u.desde),
      pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0, forma: [], posesion: 0, precision: 0, racha: "", extra: {} };
    SUMA.forEach(k => p[k] = 0); extras.forEach(k => p.extra[k] = 0);
    let posSum = 0, pasesOk = 0; const res = [];
    jugados.forEach(m => {
      if (!u.liga || m.liga !== u.liga || (m.a !== u.id && m.b !== u.id)) return;
      const mi = m.a === u.id ? m.ft.a : m.ft.b, su = m.a === u.id ? m.ft.b : m.ft.a;
      p.pj++; p.gf += n(mi.goles); p.gc += n(su.goles);
      const r = n(mi.goles) > n(su.goles) ? "G" : n(mi.goles) === n(su.goles) ? "E" : "P";
      res.push(r); if (r === "G") p.g++; else if (r === "E") p.e++; else p.p++;
      if (futbol) { SUMA.forEach(k => p[k] += n(mi[k])); posSum += n(mi.pos); pasesOk += n(mi.pases) * n(mi.precision) / 100; }
      else extras.forEach(k => p.extra[k] += n(mi[k]));
    });
    p.dg = p.gf - p.gc; p.pts = p.g * J.pv + p.e * J.pe;
    p.posesion = p.pj ? Math.round(posSum / p.pj) : 0;
    p.precision = p.pases ? Math.round(pasesOk / p.pases * 100) : 0;
    p.forma = res.slice(-5); p.racha = rachaDe(res);
    return p;
  });
}
const normInsc = i => ({ ...i, equipoId: i.equipo_id || 0, liga: i.torneo, prefs: i.prefs || [], precio: Number(i.precio) || 0 });
function armarInscriptosAdmin() {
  return ADM.insc.map(i => {
    const pr = ADM.profiles.find(x => x.id === i.user_id) || {};
    return { id: i.id, userId: i.user_id, nombre: pr.nombre || "(sin nombre)", gamertag: pr.gamertag || "", whatsapp: pr.whatsapp || "", plataforma: pr.plataforma || "—", email: pr.email || "",
      equipoId: i.equipo_id || 0, prefs: i.prefs || [], precio: Number(i.precio) || 0, disp: pr.disp || [], ts: new Date(i.created_at).getTime(), estado: i.estado, pagado: !!i.pagado, liga: i.torneo || "", nota: i.nota || "", demo: false };
  });
}
async function cargarSesion() {
  USER = null; ES_ADMIN = false; ADMIN_EMAIL = ""; ADMIN_ERR = "";
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    USER = data && data.session ? data.session.user : null;
    if (!USER) return;
    // Es administrador solo si su email está en la tabla "admins"
    const r = await sb.from("admins").select("email").eq("email", USER.email).maybeSingle();
    if (r.error) ADMIN_ERR = r.error.message || "error desconocido";
    else if (r.data) { ES_ADMIN = true; ADMIN_EMAIL = USER.email; }
  } catch (e) { ADMIN_ERR = String(e && e.message || e); }
}
async function cargarDatos() {
  LOAD_ERR = "";
  if (!sb) return;
  try {
    const [pubs, parts, cupos] = await Promise.all([
      sb.from("jugadores_publicos").select("*"),
      sb.from("partidos").select("*").order("jornada", { ascending: false }),
      sb.from("cupos_torneos").select("*"),
    ]);
    const err = pubs.error || parts.error || cupos.error; if (err) throw err;
    TORNEO_CUPOS = {}; (cupos.data || []).forEach(c => TORNEO_CUPOS[c.id] = { cupo: Number(c.cupo), anotados: Number(c.anotados) || 0, estado: c.estado || "abierto" });
    PARTIDOS = (parts.data || []).map(mapPartido);
    JUGADORES = calcularJugadores(pubs.data || [], PARTIDOS);
    MI_PERFIL = null; MI_INSCS = [];
    if (USER) {
      const [pr, ins] = await Promise.all([
        sb.from("profiles").select("*").eq("id", USER.id).maybeSingle(),
        sb.from("inscripciones").select("*").eq("user_id", USER.id),
      ]);
      if (pr.error || ins.error) throw (pr.error || ins.error);
      MI_PERFIL = pr.data; MI_INSCS = (ins.data || []).map(normInsc);
    }
    if (ES_ADMIN) {
      const [ap, ai] = await Promise.all([sb.from("profiles").select("*"), sb.from("inscripciones").select("*")]);
      if (ap.error || ai.error) throw (ap.error || ai.error);
      ADM = { profiles: ap.data || [], insc: ai.data || [] };
      LIVE_INSCRIPTOS = armarInscriptosAdmin();
    } else {
      ADM = { profiles: [], insc: [] };
      LIVE_INSCRIPTOS = [];
    }
  } catch (e) { LOAD_ERR = msgErr(e); }
}
async function refrescar(mantenerScroll = true) { KEEP_SCROLL = mantenerScroll; await cargarDatos(); render(); }

// ---------- Menú (cambia según quién esté logueado) ----------
function renderMenu(activa) {
  const m = document.getElementById("menu"); if (!m) return;
  const A = (r, txt, cls = "") => `<a href="#/${r}" data-r="${r}" class="${cls} ${activa === r ? "active" : ""}">${txt}</a>`;
  let h = A("", "Inicio") + A("torneos", "Torneos") + A("equipos", "Equipos") + A("jugadores", "Jugadores");
  if (!sb) h += A("panel", "Mi panel");
  if (USER) { h += A("panel", "Mi panel"); if (ES_ADMIN) h += A("admin", "Admin"); h += `<a href="#/" data-act="salir">Salir</a>`; }
  else h += A("ingresar", "Ingresar");
  h += A("inscripcion", "Inscribite", "cta");
  m.innerHTML = h;
}

// ============================================================
//  CUENTAS: crear cuenta e ingresar
// ============================================================
function vistaAuth(modo, aviso) {
  const reg = modo === "registro";
  if (USER && !aviso) {
    return `<div class="wrap fade"><div class="formbox" style="max-width:520px"><h2>Ya <span class="grad">ingresaste</span></h2>
      <p class="muted" style="margin-top:8px">Estás conectado como <b>${esc(USER.email)}</b>.</p>
      <div class="btns"><a class="btn primary" href="#/panel">Mi panel</a>${ES_ADMIN ? `<a class="btn" href="#/admin">Administración</a>` : ""}<a class="btn" href="#/" data-act="salir">Salir</a></div></div></div>`;
  }
  return `<div class="wrap fade"><div class="formbox" style="max-width:520px">
    <div class="seg"><a class="${reg ? "" : "on"}" href="#/ingresar">Ingresar</a><a class="${reg ? "on" : ""}" href="#/registro">Crear cuenta</a></div>
    <h2>${reg ? 'Creá tu <span class="grad">cuenta</span>' : 'Ingresá a tu <span class="grad">panel</span>'}</h2>
    <p class="muted" style="margin-top:8px">${reg ? "Con tu cuenta te inscribís, ves tus estadísticas, tus próximos rivales y todo lo de tu liga." : "Jugadores y organización ingresan desde acá."}</p>
    ${aviso ? `<div class="warn">${esc(aviso)}</div>` : ""}
    ${sb ? "" : `<div class="warn">Todavía falta conectar Supabase: completá el archivo <b>config.js</b> con la URL y la clave de tu proyecto. Hasta entonces el ingreso no funciona.</div>`}
    <form id="auth" data-modo="${reg ? "registro" : "ingresar"}">
      ${reg ? `<label class="lb">Nombre de jugador (el que va a verse en las tablas)</label><input name="nombre" required minlength="3" maxlength="24" placeholder="Ej: QuichaProPlayer" autocomplete="nickname">` : ""}
      <label class="lb">Email</label>
      <input name="email" type="email" required autocomplete="username" placeholder="tu-email@gmail.com">
      <label class="lb">Contraseña</label>
      <input name="password" type="password" required minlength="6" autocomplete="${reg ? "new-password" : "current-password"}" placeholder="${reg ? "Mínimo 6 caracteres" : "Tu contraseña"}">
      ${reg ? `<label class="lb">Repetir contraseña</label><input name="password2" type="password" required minlength="6" autocomplete="new-password" placeholder="Repetí la contraseña">` : ""}
      <button class="btn primary" style="width:100%;margin-top:18px" type="submit" ${sb ? "" : "disabled"}>${reg ? "Crear mi cuenta" : "Entrar"}</button>
      <button class="btn" style="width:100%;margin-top:10px;opacity:.5;cursor:not-allowed" type="button" disabled>Continuar con Google (próximamente)</button>
      <div id="auth-msg"></div>
    </form></div></div>`;
}
function iniciarAuth() {
  const f = document.getElementById("auth"); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const out = document.getElementById("auth-msg"), reg = f.dataset.modo === "registro";
    if (!sb) { out.innerHTML = `<div class="msg err">Supabase todavía no está conectado.</div>`; return; }
    const d = Object.fromEntries(new FormData(f)); d.email = d.email.trim();
    out.innerHTML = `<div class="msg">Un momento...</div>`;
    if (reg) {
      if (d.password !== d.password2) { out.innerHTML = `<div class="msg err">Las contraseñas no coinciden.</div>`; return; }
      const { data, error } = await sb.auth.signUp({ email: d.email, password: d.password, options: { data: { nombre: d.nombre.trim() } } });
      if (error) {
        const m = String(error.message || "").toLowerCase();
        out.innerHTML = `<div class="msg err">${m.includes("already") ? "Ese email ya tiene una cuenta. Ingresá desde la pestaña «Ingresar»." : m.includes("password") ? "La contraseña es muy débil. Usá al menos 6 caracteres." : explicarErrorLogin(error)}</div>`; return;
      }
      if (!data.session) { out.innerHTML = `<div class="msg">¡Cuenta creada! Te mandamos un email a <b>${esc(d.email)}</b> para confirmarla. Después de confirmar, ingresá desde «Ingresar».</div>`; return; }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email: d.email, password: d.password });
      if (error) { out.innerHTML = `<div class="msg err">${esc(explicarErrorLogin(error))}</div>`; return; }
    }
    await cargarSesion(); await cargarDatos();
    toast(reg ? "¡Bienvenido a la liga!" : "Ingresaste correctamente");
    const quiere = PENDING_TORNEO; PENDING_TORNEO = "";
    location.hash = quiere && !ES_ADMIN ? "#/inscripcion/" + quiere : reg ? "#/inscripcion" : (ES_ADMIN ? "#/admin" : "#/panel");
    render();
  });
}

// ============================================================
//  PANEL DEL JUGADOR
// ============================================================
const badgeEstado = e => e === "aprobada" ? `<span class="badge g">Aprobada</span>` : e === "rechazada" ? `<span class="badge r">Rechazada</span>` : `<span class="badge y">Pendiente de aprobación</span>`;

function contextoPanel(sel) {
  if (!LIVE) {
    const q = EJEMPLO, T = TORNEOS[0];
    const insc = { id: q.id, estado: "aprobada", pagado: true, liga: T.id, equipoId: q.equipoId, prefs: [], precio: precioInsc(T, q.equipoId) };
    return { demo: true, perfil: { nombre: q.nombre, gamertag: "QuichaPro_NQN", whatsapp: "2262 123456", plataforma: q.plataforma, disp: ["Lunes|Noche", "Miércoles|Noche", "Viernes|Noche", "Sábado|Tarde", "Sábado|Noche"] },
      lista: [insc], insc, p: q, proximos: PARTIDOS.filter(m => !esJugado(m) && (m.a === q.id || m.b === q.id)) };
  }
  const lista = MI_INSCS, insc = lista.find(i => i.liga === sel) || lista[0] || null;
  const proximos = insc ? PARTIDOS.filter(m => !esJugado(m) && (m.a === insc.id || m.b === insc.id))
    .sort((a, b) => (a.fecha ? new Date(a.fecha) : 9e15) - (b.fecha ? new Date(b.fecha) : 9e15) || a.jornada - b.jornada) : [];
  return { demo: false, perfil: MI_PERFIL || { nombre: USER.email, disp: [] }, lista, insc, p: insc ? JUGADORES.find(x => x.id === insc.id) || null : null, proximos };
}

function vistaPanel(sel) {
  if (sb && !USER) return vistaAuth("ingresar", "Ingresá para ver tu panel de jugador.");
  const c = contextoPanel(sel);
  if (!c.insc) {
    return `<div class="wrap fade"><div class="formbox" style="max-width:600px"><h2>Todavía no te <span class="grad">inscribiste</span></h2>
      <p class="muted" style="margin-top:8px">Hola <b>${esc(c.perfil.nombre)}</b>. Para aparecer en las tablas y ver tus estadísticas, anotate en un torneo.</p>
      <div class="btns"><a class="btn primary" href="#/torneos">Ver torneos</a>${ES_ADMIN ? `<a class="btn" href="#/admin">Ir a administración</a>` : ""}</div></div></div>`;
  }
  const { perfil, insc, p, proximos, lista } = c;
  const T = torneoById(insc.liga) || TORNEOS[0], J = juegoDe(T), cup = cupoInfo(T);
  const yo = p || { id: insc.id, nombre: perfil.nombre, liga: insc.liga, equipoId: insc.equipoId };
  const t = equipoDe(yo), precio = insc.precio || 0;
  const activo = insc.estado === "aprobada" && !!p;
  const tb = activo ? tablaLiga(insc.liga) : [], pos = activo ? tb.findIndex(x => x.id === p.id) + 1 : 0;
  const pideEq = conEquipos(T), sinEq = pideEq && !insc.equipoId;
  const pedidos = (insc.prefs || []).map(id => teamById(id).nombre).join(", ");

  let aviso = "";
  if (insc.estado === "pendiente") {
    aviso = `<div class="card" style="border-left:4px solid var(--accent);margin-top:16px"><h3 class="sub">Tu inscripción está pendiente</h3>
      <p>El organizador la va a revisar y aprobar cuando reciba el pago de <b class="accent">${$money(precio)}</b>${T.porFecha ? ` (después, ${$money(T.porFecha.monto)} ${T.porFecha.txt})` : ""}.</p>
      <p class="muted" style="margin-top:8px">${esc(typeof PAGO_INFO !== "undefined" ? PAGO_INFO : "")}</p>
      <div class="btns">${typeof WHATSAPP_ORGANIZADOR !== "undefined" && WHATSAPP_ORGANIZADOR ? `<a class="btn primary small" target="_blank" rel="noopener" href="https://wa.me/${esc(WHATSAPP_ORGANIZADOR)}">Avisar por WhatsApp</a>` : ""}
      ${c.demo ? "" : `<button class="btn small" data-act="cancelar" data-id="${insc.id}">Cancelar inscripción</button>`}</div></div>`;
  } else if (insc.estado === "rechazada") {
    aviso = `<div class="card" style="border-left:4px solid var(--red);margin-top:16px"><h3 class="sub">Tu inscripción fue rechazada</h3>
      <p class="muted">${insc.nota ? esc(insc.nota) : "Si creés que es un error, hablá con el organizador."}</p></div>`;
  } else if (activo && sinEq) {
    aviso = `<div class="card" style="border-left:4px solid var(--win);margin-top:16px"><h3 class="sub">¡Estás aprobado!</h3>
      <p class="muted">Tu equipo se asigna por sorteo cuando se completa el cupo (${cup.anotados} de ${cup.cupo} anotados). Tus opciones: <b style="color:var(--txt)">${esc(pedidos || "—")}</b>.</p></div>`;
  }
  if (insc.estado === "aprobada" && !insc.pagado) aviso += `<div class="warn">Tu pago de ${$money(precio)} todavía no figura como recibido. ${esc(typeof PAGO_INFO !== "undefined" ? PAGO_INFO : "")}</div>`;
  if (insc.estado === "pendiente" && pideEq && pedidos) aviso += `<p class="muted" style="margin-top:10px;font-size:14px">Equipos que pediste (en orden): <b style="color:var(--txt)">${esc(pedidos)}</b>. Se asignan por sorteo cuando se completa el cupo.</p>`;

  const prox = !activo ? "" : `<h3 class="sub" style="margin-top:26px">Próximos rivales</h3>` + (proximos.length ? `<div class="sbs">${proximos.map(m => {
    const rivalId = m.a === p.id ? m.b : m.a, rv = jugadorOr(rivalId), tr = equipoDe(rv);
    return `<div class="scorebug" style="grid-template-columns:minmax(0,1fr) auto"><span class="sb-tag">FECHA ${m.jornada} · ${esc(T.nombre)}</span>
      <div class="sb-team">${crest(tr)}<div><b>${esc(rv.nombre)}</b><small>${tr.nombre} ${stars(tr.estrellas)}</small></div></div>
      <div style="text-align:right"><b class="accent" style="font:800 20px 'Barlow Condensed'">${fechaCorta(m.fecha)}</b></div>
      <div class="sb-ver" style="text-align:left">${c.demo ? "Acá vas a ver el WhatsApp de tu rival para coordinar" : `<span id="ct-${m.id}"><button class="btn small" data-act="contacto" data-id="${m.id}">Ver WhatsApp del rival</button></span>`}</div></div>`; }).join("")}</div>`
    : `<div class="card"><p class="muted">Todavía no tenés partidos programados. Apenas el organizador arme el fixture, los vas a ver acá.</p></div>`);

  const mini = !activo || !tb.length ? "" : `<h3 class="sub" style="margin-top:26px">Tu torneo · ${esc(T.nombre)}</h3>
    <div class="table-wrap"><table><thead><tr><th>#</th><th class="l">Jugador</th><th class="l">${pideEq ? "Equipo" : "Juego"}</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead><tbody>
      ${tb.slice(0, 12).map((x, i) => { const tt = equipoDe(x); return `<tr class="${x.id === p.id ? "me" : ""}"><td><span class="pos">${i + 1}</span></td><td class="l"><a href="#/jugador/${x.id}"><b>${esc(x.nombre)}</b></a></td><td class="l"><div class="team-cell">${crest(tt)}${tt.nombre}</div></td><td>${x.pj}</td><td>${x.dg > 0 ? "+" : ""}${x.dg}</td><td class="pts">${x.pts}</td></tr>`; }).join("")}
    </tbody></table></div><p style="margin-top:8px"><a class="accent" href="#/liga/${insc.liga}">Ver tabla completa y estadísticas →</a></p>`;

  const tabs = lista.length > 1 || !c.demo ? `<div class="tabs" style="margin-top:20px">${lista.map(i => `<a class="tab ${i.liga === insc.liga ? "active" : ""}" href="#/panel/${i.liga}">${esc(nombreLiga(i.liga))}</a>`).join("")}<a class="tab" href="#/torneos">＋ Otro torneo</a></div>` : "";

  return `<div class="wrap fade">
    ${c.demo ? `<div class="warn" style="margin-top:20px">Vista de ejemplo: así ve su panel cada jugador. Con Supabase conectado, cada uno ve sus propios datos.</div>` : ""}
    ${tabs}
    <div class="profile-head">${crest(t, "lg")}
      <div><span class="pill">${esc(T.nombre)}</span><h1 style="margin-top:8px">${esc(perfil.nombre)}</h1>
        <div class="badges"><span class="badge y">${t.nombre} ${stars(t.estrellas)}</span><span class="badge">${J.nombre}</span><span class="badge">${esc(perfil.plataforma || "—")}</span>${badgeEstado(insc.estado)}${insc.pagado ? `<span class="badge g">Pago recibido</span>` : `<span class="badge">Pago pendiente</span>`}${activo && p.racha ? `<span class="badge g">${p.racha}</span>` : ""}</div></div>
      <div class="ovr"><b>${activo ? p.pts : "—"}</b><span>PUNTOS</span></div></div>
    ${aviso}
    ${activo ? `<div class="kpis" style="margin-top:16px"><div class="kpi"><b class="accent">${pos}º</b><span>Puesto de ${tb.length}</span></div><div class="kpi"><b>${p.pts}</b><span>Puntos</span></div><div class="kpi"><b>${p.pj}</b><span>Partidos jugados</span></div><div class="kpi"><b>${proximos.length}</b><span>Partidos por jugar</span></div>
      <div class="kpi"><div class="form" style="margin:6px 0">${p.forma.length ? p.forma.map(f => `<i class="${f}">${f}</i>`).join("") : "—"}</div><span>Últimos resultados</span></div></div>` : ""}
    ${prox}
    ${activo ? `<h3 class="sub" style="margin-top:26px">Mis estadísticas</h3>${perfilStats(p)}<h3 class="sub" style="margin-top:26px">Mis últimos partidos</h3>${perfilPartidos(p.id)}` : ""}
    ${mini}
    <h3 class="sub" style="margin-top:30px">Mis datos</h3>
    <div class="card"><form id="f-datos" data-demo="${c.demo ? 1 : 0}">
      <div class="row2"><div><label class="lb">Mi ID de consola</label><input name="gamertag" value="${esc(perfil.gamertag || "")}" required></div>
      <div><label class="lb">WhatsApp</label><input name="whatsapp" value="${esc(perfil.whatsapp || "")}" required></div></div>
      <label class="lb">Plataforma</label><select name="plataforma">${optsPlataforma(perfil.plataforma)}</select>
      <label class="lb">Días y horarios en que puedo jugar</label>${availGridHTML(perfil.disp || [])}
      <button class="btn primary small" style="margin-top:16px" type="submit">Guardar cambios</button>
    </form></div>
  </div>`;
}
function iniciarPanel() {
  const f = document.getElementById("f-datos"); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    if (f.dataset.demo === "1") { toast("En la vista de ejemplo no se guardan cambios", "err"); return; }
    const d = Object.fromEntries(new FormData(f));
    const disp = [...f.querySelectorAll('input[name="disp"]:checked')].map(x => x.value);
    if (!disp.length) { toast("Marcá al menos un horario", "err"); return; }
    const { error } = await sb.from("profiles").update({ gamertag: d.gamertag.trim(), whatsapp: d.whatsapp.trim(), plataforma: d.plataforma, disp }).eq("id", USER.id);
    if (error) { toast(msgErr(error), "err"); return; }
    toast("Datos guardados"); await refrescar();
  });
}

// ============================================================
//  ADMINISTRACIÓN
// ============================================================
function vistaAdminShell(tab, sub, sub2) {
  if (!sb) return vistaAuth("ingresar", "El panel de administración necesita Supabase.");
  if (!USER) return vistaAuth("ingresar", "Ingresá con tu cuenta de administrador.");
  if (!ES_ADMIN) {
    return `<div class="wrap fade"><div class="formbox" style="max-width:600px"><h2>Sin <span class="grad">permisos</span></h2>
      <p class="muted" style="margin-top:8px">La cuenta <b>${esc(USER.email)}</b> no figura como administradora.</p>
      ${ADMIN_ERR ? `<div class="warn">No se pudo verificar el permiso (${esc(ADMIN_ERR)}). Probablemente falta ejecutar supabase-1-admin.sql.</div>` : ""}
      <div class="btns"><a class="btn primary" href="#/panel">Ir a mi panel</a></div></div></div>`;
  }
  tab = tab || "resumen";
  const pend = LIVE_INSCRIPTOS.filter(x => x.estado === "pendiente").length;
  const tabs = [["resumen", "Resumen"], ["solicitudes", "Solicitudes" + (pend ? ` (${pend})` : "")], ["torneos", "Torneos"], ["partidos", "Partidos"]];
  const activa = tab === "resultado" ? "partidos" : tab;
  let cuerpo;
  switch (tab) {
    case "solicitudes": cuerpo = admSolicitudes(sub, sub2); break;
    case "torneos": cuerpo = admTorneos(); break;
    case "partidos": cuerpo = admPartidos(sub); break;
    case "resultado": cuerpo = admResultado(sub); break;
    default: cuerpo = adminResumen();
  }
  return `<div class="wrap fade" style="padding-top:40px">
    <div class="sec-title"><h2>Administración de <em>LDV</em></h2><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">${esc(ADMIN_EMAIL)}</span><button class="btn small" id="csv">⬇ Exportar CSV</button><button class="btn small" data-act="salir">Cerrar sesión</button></div></div>
    <div class="seg" style="flex-wrap:wrap">${tabs.map(([k, n]) => `<a class="${activa === k ? "on" : ""}" href="#/admin${k === "resumen" ? "" : "/" + k}">${n}</a>`).join("")}</div>
    ${cuerpo}</div>`;
}

// ---------- Solicitudes ----------
const eqTxt = x => { const e = EQUIPOS.find(y => y.id === x.equipoId);
  if (e) return `<div class="team-cell">${crest(e)}<span>${e.nombre}<small>${stars(e.estrellas)}</small></span></div>`;
  return conEquipos(torneoById(x.liga)) ? `<span class="muted" style="font-size:12px">Por sorteo${(x.prefs || []).length ? "<br>Pidió: " + esc(x.prefs.map(i => teamById(i).nombre).join(", ")) : ""}</span>` : `<span class="muted">—</span>`; };
function admSolicitudes(filtro, torneo) {
  filtro = ["pendiente", "aprobada", "rechazada", "todas"].includes(filtro) ? filtro : "pendiente";
  const all = [...LIVE_INSCRIPTOS].filter(x => !torneo || x.liga === torneo).sort((a, b) => b.ts - a.ts);
  const cnt = e => all.filter(x => x.estado === e).length;
  const lista = filtro === "todas" ? all : all.filter(x => x.estado === filtro);
  const q = torneo ? "/" + torneo : "";
  const seg = [["pendiente", `Pendientes (${cnt("pendiente")})`], ["aprobada", `Aprobadas (${cnt("aprobada")})`], ["rechazada", `Rechazadas (${cnt("rechazada")})`], ["todas", `Todas (${all.length})`]];
  const filas = lista.map(x => { const wa = waLink(x.whatsapp);
    const acciones = x.estado === "pendiente"
      ? `<button class="btn ok small" data-act="aprobar" data-id="${x.id}">Aprobar</button><button class="btn danger small" data-act="rechazar" data-id="${x.id}">Rechazar</button>`
      : x.estado === "aprobada"
        ? `<button class="btn small" data-act="pendiente" data-id="${x.id}">Volver a pendiente</button><button class="btn danger small" data-act="eliminar" data-id="${x.id}">Eliminar</button>`
        : `<button class="btn ok small" data-act="aprobar" data-id="${x.id}">Aprobar</button><button class="btn danger small" data-act="eliminar" data-id="${x.id}">Eliminar</button>`;
    return `<tr><td class="l"><b>${esc(x.nombre)}</b><small class="muted" style="display:block">${esc(x.email)}</small><small class="muted">ID: ${esc(x.gamertag) || "—"} · ${esc(x.plataforma)}</small></td>
      <td>${wa ? `<a class="accent" target="_blank" rel="noopener" href="${wa}">${esc(x.whatsapp)}</a>` : "—"}</td>
      <td class="l">${esc(nombreLiga(x.liga))}</td>
      <td class="l">${eqTxt(x)}</td>
      <td class="pts">${$money(x.precio)}</td>
      <td><button class="btn small ${x.pagado ? "ok" : ""}" data-act="pagado" data-id="${x.id}">${x.pagado ? "Pagó ✓" : "No pagó"}</button></td>
      <td>${badgeEstado(x.estado)}</td>
      <td class="l acc-col">${acciones}</td></tr>`; }).join("");
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:6px"><div class="seg" style="flex-wrap:wrap;margin:0">${seg.map(([k, n]) => `<a class="${filtro === k ? "on" : ""}" href="#/admin/solicitudes/${k}${q}">${n}</a>`).join("")}</div>
    <select class="inp-s" style="width:auto;max-width:260px" data-chg="admtor"><option value="">Todos los torneos</option>${TORNEOS.map(t => `<option value="${t.id}" ${torneo === t.id ? "selected" : ""}>${esc(t.nombre)}</option>`).join("")}</select></div>
    ${lista.length ? `<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th class="l">Jugador</th><th>WhatsApp</th><th class="l">Torneo</th><th class="l">Equipo</th><th>Precio</th><th>Pago</th><th>Estado</th><th class="l">Acciones</th></tr></thead><tbody>${filas}</tbody></table></div>
    <p class="muted" style="font-size:13px;margin-top:8px">«Pagó» lo marcás vos cuando ves la transferencia. «Aprobar» confirma el lugar en el torneo.</p>`
      : `<div class="card" style="margin-top:14px"><p class="muted">No hay solicitudes en esta lista.</p></div>`}`;
}

// ---------- Torneos: estado, sorteo de equipos y jugadores ----------
function admTorneos() {
  const pend = LIVE_INSCRIPTOS.filter(x => x.estado === "pendiente").length;
  return `${pend ? `<div class="warn" style="margin-top:0">Hay <b>${pend}</b> solicitudes pendientes. <a class="accent" href="#/admin/solicitudes">Revisarlas →</a></div>` : ""}
    <div class="adm-grid" style="margin-top:14px">${TORNEOS.map(t => {
      const xs = LIVE_INSCRIPTOS.filter(x => x.liga === t.id && x.estado !== "rechazada"), apr = xs.filter(x => x.estado === "aprobada"), c = cupoInfo(t);
      const sinEq = apr.filter(x => !x.equipoId).length, conEq = apr.length - sinEq, estadoDb = (TORNEO_CUPOS[t.id] || {}).estado || "abierto";
      const sorteo = ULTIMO_SORTEO && ULTIMO_SORTEO.id === t.id ? ULTIMO_SORTEO : null;
      return `<div class="card" style="border-top:3px solid ${t.color}"><h3 class="sub">${esc(t.nombre)} <span class="muted" style="font-size:16px">· ${juegoDe(t).nombre}</span></h3>
        <p class="muted" style="font-size:14px">${c.anotados} / ${c.cupo} anotados · ${apr.length} aprobados · ${xs.filter(x => x.pagado).length} pagaron</p>
        <label class="lb" style="margin:12px 0 4px">Estado del torneo</label>
        <select class="inp-s" data-chg="setestado" data-id="${t.id}"><option value="abierto" ${estadoDb === "abierto" ? "selected" : ""}>Inscripción abierta</option><option value="en_curso" ${estadoDb === "en_curso" ? "selected" : ""}>En juego (cierra inscripción)</option><option value="finalizado" ${estadoDb === "finalizado" ? "selected" : ""}>Finalizado</option></select>
        ${conEquipos(t) ? `<div class="plact" style="margin-top:12px"><button class="btn primary small" data-act="sorteo" data-id="${t.id}" ${sinEq ? "" : "disabled"}>Sortear equipos (${sinEq})</button>${conEq ? `<button class="btn danger small" data-act="resetsorteo" data-id="${t.id}">Reiniciar sorteo</button>` : ""}</div>
          <p class="muted" style="font-size:12px;margin-top:6px">Sortea el orden y le da a cada aprobado su mejor opción libre. Hacelo con el cupo completo.</p>` : ""}
        ${sorteo ? `<div class="msg" style="font-size:13px"><b>Resultado del sorteo:</b><br>${sorteo.filas.map(f => `${esc(f[0])} → <b>${esc(f[1])}</b> (${f[2]})`).join("<br>")}</div>` : ""}
        <div style="margin-top:12px">${apr.length ? apr.map(x => `<div class="plrow"><div><b>${esc(x.nombre)}</b><small class="muted" style="display:block">${EQUIPOS.some(e => e.id === x.equipoId) ? teamById(x.equipoId).nombre : (conEquipos(t) ? "Equipo por sorteo" : juegoDe(t).nombre)}${x.pagado ? "" : " · <span class='accent'>sin pagar</span>"}</small></div>
          <div class="plact"><button class="btn danger small" data-act="eliminar" data-id="${x.id}" title="Quitar del torneo">Quitar</button></div></div>`).join("") : `<p class="muted">Sin jugadores aprobados.</p>`}</div>
        <p style="margin-top:10px"><a class="accent" href="#/admin/partidos/${t.id}">Partidos y resultados →</a></p></div>`; }).join("")}
    </div>`;
}

// ---------- Partidos ----------
function roundRobin(ids) {
  const a = ids.slice(); if (a.length % 2) a.push(null);
  const n = a.length, rondas = [];
  for (let r = 0; r < n - 1; r++) {
    const ps = [];
    for (let i = 0; i < n / 2; i++) { const x = a[i], y = a[n - 1 - i]; if (x && y) ps.push(r % 2 ? [y, x] : [x, y]); }
    rondas.push(ps); a.splice(1, 0, a.pop());
  }
  return rondas;
}
function azar(n) { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return Math.floor(a[0] / 4294967296 * n); } catch (e) { return Math.floor(Math.random() * n); } }
function mezclar(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = azar(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const nombreInsc = id => { const x = LIVE_INSCRIPTOS.find(y => y.id === id); return x ? x.nombre : "Jugador retirado"; };

function admPartidos(torneoId) {
  const t = torneoById(torneoId) || TORNEOS[0], J = juegoDe(t), ko = /^Eliminaci/.test(t.formato);
  const sel = `<select class="inp-s" style="width:auto;max-width:340px" data-chg="admpart">${TORNEOS.map(x => `<option value="${x.id}" ${x.id === t.id ? "selected" : ""}>${esc(x.nombre)} · ${juegoDe(x).nombre}</option>`).join("")}</select>`;
  if (J.stats === "f1") {
    return `<div style="margin-top:6px">${sel}</div><div class="card" style="margin-top:14px"><h3 class="sub">Campeonato de F1</h3><p class="muted">La carga de carreras y la tabla de puntos del campeonato de F1 todavía no está lista: las carreras tienen muchos pilotos y funcionan distinto a los duelos. Mientras tanto podés aprobar inscripciones y manejar el torneo desde la pestaña Torneos.</p></div>`;
  }
  const jug = LIVE_INSCRIPTOS.filter(x => x.estado === "aprobada" && x.liga === t.id);
  const ms = PARTIDOS.filter(m => m.liga === t.id).sort((a, b) => a.jornada - b.jornada || (a.fecha || "").localeCompare(b.fecha || ""));
  const opts = jug.map(x => `<option value="${x.id}">${esc(x.nombre)}</option>`).join("");
  const sigue = ms.reduce((m, x) => Math.max(m, x.jornada), 0) + 1;
  const col = ko ? "Ronda" : "Fecha";
  return `<div style="margin-top:6px">${sel}</div>
    <div class="adm-grid" style="margin-top:14px">
      <div class="card"><h3 class="sub">${ko ? "Cruces" : "Fixture automático"}</h3>
        ${ko ? `<p class="muted">Sortea los cruces de la primera ronda entre los ${jug.length} jugadores aprobados. Las rondas siguientes las creás a mano con «Nuevo partido».</p>
          <div class="btns"><button class="btn primary small" data-act="fixtureko" data-liga="${t.id}" ${jug.length < 2 || ms.length ? "disabled" : ""}>Sortear cruces</button></div>`
        : `<p class="muted">Arma todos contra todos entre los ${jug.length} jugadores aprobados. Si ya hay partidos, solo agrega los que faltan.</p>
          <div class="btns"><button class="btn primary small" data-act="fixture" data-liga="${t.id}" ${jug.length < 2 ? "disabled" : ""}>Generar todos contra todos</button></div>`}</div>
      <div class="card"><h3 class="sub">Nuevo partido</h3>
        <form id="f-partido" data-liga="${t.id}">
          <div class="row2"><div><label class="lb">Jugador A</label><select name="a" required>${opts}</select></div><div><label class="lb">Jugador B</label><select name="b" required>${opts}</select></div></div>
          <div class="row2"><div><label class="lb">${col} (número)</label><input name="jornada" type="number" min="1" value="${sigue}" required></div><div><label class="lb">Día y hora (opcional)</label><input name="fecha" type="datetime-local"></div></div>
          <button class="btn primary small" style="margin-top:14px" type="submit" ${jug.length < 2 ? "disabled" : ""}>Crear partido</button></form></div>
    </div>
    <h3 class="sub" style="margin-top:26px">Partidos de ${esc(t.nombre)} (${ms.length})</h3>
    ${ms.length ? `<div class="table-wrap"><table><thead><tr><th>${col}</th><th class="l">Partido</th><th>Día y hora</th><th>Estado</th><th class="l">Acciones</th></tr></thead><tbody>
      ${ms.map(m => `<tr><td>${m.jornada}</td><td class="l"><b>${esc(nombreInsc(m.a))}</b> <span class="muted">vs</span> <b>${esc(nombreInsc(m.b))}</b></td><td>${m.fecha ? fechaCorta(m.fecha) : "—"}</td>
        <td>${esJugado(m) ? `<span class="badge g">${m.ft.a.goles} - ${m.ft.b.goles}</span>` : `<span class="badge y">Programado</span>`}</td>
        <td class="l acc-col"><a class="btn small ${esJugado(m) ? "" : "ok"}" href="#/admin/resultado/${m.id}">${esJugado(m) ? "Editar resultado" : "Cargar resultado"}</a><button class="btn danger small" data-act="delpartido" data-id="${m.id}">Eliminar</button></td></tr>`).join("")}
    </tbody></table></div>` : `<div class="card"><p class="muted">Todavía no hay partidos en este torneo.</p></div>`}`;
}

// ---------- Cargar resultado ----------
function admResultado(id) {
  const m = PARTIDOS.find(x => x.id === id);
  if (!m) return `<div class="card"><p class="muted">Partido no encontrado.</p><a class="btn small" href="#/admin/partidos">Volver</a></div>`;
  const T = torneoById(m.liga) || TORNEOS[0], J = juegoDe(T), campos = statsDe(J);
  const nA = nombreInsc(m.a), nB = nombreInsc(m.b);
  const v = (bloque, lado, k) => { const o = m[bloque]; return o && o[lado] && o[lado][k] != null ? o[lado][k] : ""; };
  const inp = (b, l, k) => `<input class="inp-n" type="number" min="0" step="1" name="${b}_${l}_${k}" value="${v(b, l, k)}">`;
  const mitad = J.stats === "nba" ? "Mitad" : "Entretiempo";
  return `<div class="card" style="margin-top:6px"><h3 class="sub">${esc(nA)} vs ${esc(nB)} · Fecha ${m.jornada} · ${esc(T.nombre)}</h3>
    <p class="muted">${J.stats === "futbol" || J.stats === "nba" ? `Copiá los números de las pantallas del juego. El <b>final</b> es obligatorio; ${J.ht ? `la <b>${mitad.toLowerCase()}</b> es opcional (si la cargás, completala entera).` : ""}` : `Cargá el resultado del partido (${J.marcador.toLowerCase()} de cada jugador).`}</p>
    <form id="f-res" data-id="${m.id}" data-liga="${m.liga}" data-juego="${J.id}">
      <label class="lb">Día y hora del partido (opcional)</label><input type="datetime-local" name="fecha" value="${aInputFecha(m.fecha)}" style="max-width:260px">
      <div class="table-wrap" style="margin-top:14px"><table class="rtable"><thead><tr><th class="l">Estadística</th><th>Final · ${esc(nA)}</th><th>Final · ${esc(nB)}</th>${J.ht ? `<th>${mitad} · ${esc(nA)}</th><th>${mitad} · ${esc(nB)}</th>` : ""}</tr></thead><tbody>
        ${campos.map(([k, et]) => `<tr><td class="l">${k === "goles" ? J.marcador : et}</td><td>${inp("ft", "a", k)}</td><td>${inp("ft", "b", k)}</td>${J.ht ? `<td>${inp("ht", "a", k)}</td><td>${inp("ht", "b", k)}</td>` : ""}</tr>`).join("")}
      </tbody></table></div>
      <div class="btns"><button class="btn primary" type="submit">Guardar resultado</button><a class="btn" href="#/admin/partidos/${m.liga}">Cancelar</a>
      ${esJugado(m) ? `<button class="btn danger" type="button" data-act="borrarres" data-id="${m.id}">Borrar resultado</button>` : ""}</div>
      <div id="res-msg"></div>
    </form></div>`;
}
function leerStats(form, bloque, campos, J) {
  const out = { a: {}, b: {} }; let vacios = 0, total = 0;
  if (bloque === "ht" && !J.ht) return { out, vacios: 1, total: 1 };
  ["a", "b"].forEach(l => campos.forEach(([k]) => {
    const raw = form.elements[`${bloque}_${l}_${k}`].value.trim(); total++;
    if (raw === "") vacios++; else out[l][k] = Math.round(Number(raw));
  }));
  return { out, vacios, total };
}
function iniciarResultado() {
  const f = document.getElementById("f-res"); if (!f) return;
  const J = JUEGOS[f.dataset.juego] || JUEGOS.eafc27, campos = statsDe(J), futbol = J.stats === "futbol";
  // En fútbol, la posesión del rival se completa sola (suma 100)
  if (futbol) ["ft", "ht"].forEach(b => ["a", "b"].forEach(l => {
    const el = f.elements[`${b}_${l}_pos`], otro = f.elements[`${b}_${l === "a" ? "b" : "a"}_pos`];
    el.addEventListener("input", () => { const n = Number(el.value); if (el.value !== "" && n >= 0 && n <= 100 && otro.value === "") otro.value = 100 - n; });
  }));
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const out = document.getElementById("res-msg"), err = t => { out.innerHTML = `<div class="msg err">${t}</div>`; };
    const ft = leerStats(f, "ft", campos, J), ht = leerStats(f, "ht", campos, J);
    if (ft.vacios) return err("Completá todos los datos del final (si es cero, escribí 0).");
    if (ht.vacios && ht.vacios !== ht.total) return err("Cargaste la mitad del partido a medias. Completala entera o dejala vacía.");
    const verif = (S, nom) => {
      if (futbol) {
        for (const l of ["a", "b"]) {
          if (S[l].pos > 100 || S[l].precision > 100) return `${nom}: la posesión y la precisión no pueden pasar de 100.`;
          if (S[l].tirosArco > S[l].tiros) return `${nom}: los tiros al arco no pueden ser más que los tiros.`;
        }
        if (Math.abs(S.a.pos + S.b.pos - 100) > 2) return `${nom}: la posesión de los dos tiene que sumar 100.`;
      }
      return "";
    };
    let msg = verif(ft.out, "Final"); if (msg) return err(msg);
    if (!J.empates && ft.out.a.goles === ft.out.b.goles) return err(`En ${J.nombre} no puede haber empate: cargá quién ganó.`);
    const conHt = !ht.vacios;
    if (conHt) { msg = verif(ht.out, "Mitad"); if (msg) return err(msg);
      if (ht.out.a.goles > ft.out.a.goles || ht.out.b.goles > ft.out.b.goles) return err(`Lo de la mitad no puede ser más que lo del final.`); }
    const fecha = f.elements.fecha.value ? new Date(f.elements.fecha.value).toISOString() : null;
    const stats = { ft: ft.out }; if (conHt) stats.ht = ht.out;
    const { error } = await sb.from("partidos").update({ estado: "jugado", stats, fecha }).eq("id", f.dataset.id);
    if (error) return err(esc(msgErr(error)));
    toast("Resultado guardado"); await cargarDatos(); location.hash = "#/admin/partidos/" + f.dataset.liga; render();
  });
}

// ---------- Inicio de las pantallas de admin ----------
function exportarCSV() {
  const filas = [["Nombre", "Email", "ID consola", "WhatsApp", "Plataforma", "Torneo", "Equipo", "Equipos pedidos", "Precio", "Estado", "Pagado", "Horarios"]];
  todasInscripciones().forEach(x => { const e = EQUIPOS.find(y => y.id === x.equipoId);
    filas.push([x.nombre, x.email || "", x.gamertag || "", x.whatsapp || "", x.plataforma, nombreLiga(x.liga), e ? e.nombre : "", (x.prefs || []).map(i => teamById(i).nombre).join(" / "), x.precio || 0, x.estado || "", x.pagado ? "sí" : "no", (x.disp || []).join(" ")]); });
  const csv = "﻿" + filas.map(f => f.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "inscriptos-ldv.csv"; a.click();
}
function iniciarAdminShell() {
  if (document.getElementById("auth")) return iniciarAuth();
  if (!ES_ADMIN) return;
  const b = document.getElementById("csv"); if (b) b.addEventListener("click", exportarCSV);
  iniciarResultado();
  const fp = document.getElementById("f-partido");
  if (fp) fp.addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(fp));
    if (d.a === d.b) { toast("Elegí dos jugadores distintos", "err"); return; }
    const { error } = await sb.from("partidos").insert({ torneo: fp.dataset.liga, jornada: Number(d.jornada) || 1, jugador_a: d.a, jugador_b: d.b, fecha: d.fecha ? new Date(d.fecha).toISOString() : null });
    if (error) { toast(msgErr(error), "err"); return; }
    toast("Partido creado"); await refrescar();
  });
}

// ============================================================
//  ACCIONES (botones con data-act / selectores con data-chg)
// ============================================================
async function sbUpd(tabla, id, obj) { const { error } = await sb.from(tabla).update(obj).eq("id", id); if (error) throw error; }
const ACCIONES = {
  async salir() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
    USER = null; ES_ADMIN = false; ADMIN_EMAIL = ""; MI_PERFIL = null; MI_INSCS = [];
    await cargarDatos(); location.hash = "#/"; render(); toast("Cerraste sesión");
  },
  async aprobar({ id }) { await sbUpd("inscripciones", id, { estado: "aprobada" }); toast("Inscripción aprobada"); await refrescar(); },
  async rechazar({ id }) { await sbUpd("inscripciones", id, { estado: "rechazada" }); toast("Solicitud rechazada"); await refrescar(); },
  async pendiente({ id }) { await sbUpd("inscripciones", id, { estado: "pendiente" }); toast("Vuelta a pendiente"); await refrescar(); },
  async pagado({ id }) { const x = LIVE_INSCRIPTOS.find(y => y.id === id); await sbUpd("inscripciones", id, { pagado: !(x && x.pagado) }); await refrescar(); },
  async eliminar({ id }) {
    const x = LIVE_INSCRIPTOS.find(y => y.id === id);
    if (!confirm(`¿Quitar a ${x ? x.nombre : "este jugador"} de ${x ? nombreLiga(x.liga) : "el torneo"}? Se borra su inscripción y libera su lugar.`)) return;
    const { error } = await sb.from("inscripciones").delete().eq("id", id); if (error) throw error; toast("Inscripción eliminada"); await refrescar();
  },
  async cancelar({ id }) {
    if (!confirm("¿Cancelar tu inscripción? Vas a poder volver a inscribirte cuando quieras.")) return;
    const { error } = await sb.from("inscripciones").delete().eq("id", id); if (error) throw error; toast("Inscripción cancelada"); location.hash = "#/panel"; await refrescar(false);
  },
  async contacto({ id }) {
    const { data, error } = await sb.rpc("contacto_rival", { p_partido: id }); if (error) throw error;
    const box = document.getElementById("ct-" + id), wa = waLink(data);
    if (box) box.innerHTML = data ? `<a class="btn ok small" target="_blank" rel="noopener" href="${wa}">WhatsApp: ${esc(data)}</a>` : `<span class="muted">Tu rival todavía no cargó su WhatsApp.</span>`;
  },
  // Sorteo justo de equipos: orden al azar; cada uno recibe su mejor opción que siga libre
  async sorteo({ id }) {
    const t = torneoById(id), apr = LIVE_INSCRIPTOS.filter(x => x.liga === id && x.estado === "aprobada");
    const usados = new Set(apr.filter(x => x.equipoId).map(x => x.equipoId)), pend = apr.filter(x => !x.equipoId);
    if (!pend.length) { toast("No hay jugadores sin equipo"); return; }
    if (!confirm(`Se van a sortear los equipos de ${pend.length} jugadores aprobados de ${t.nombre}. ¿Seguimos?`)) return;
    const filas = [], cambios = [];
    for (const x of mezclar(pend)) {
      let eq = (x.prefs || []).find(e => !usados.has(e)), origen = eq ? `${x.prefs.indexOf(eq) + 1}.ª opción` : "";
      if (!eq) {
        const ok = e => !usados.has(e.id) && (!t.maxEstrellas || e.estrellas <= t.maxEstrellas);
        let pool = EQUIPOS.filter(e => ok(e) && (t.inscripcion.tipo !== "estrellas" || e.precio === x.precio));
        if (!pool.length) pool = EQUIPOS.filter(ok);
        if (!pool.length) { filas.push([x.nombre, "SIN EQUIPO LIBRE", "—"]); continue; }
        eq = pool[azar(pool.length)].id; origen = "al azar";
      }
      usados.add(eq); cambios.push([x.id, eq]); filas.push([x.nombre, teamById(eq).nombre, origen]);
    }
    for (const [iid, eq] of cambios) await sbUpd("inscripciones", iid, { equipo_id: eq });
    ULTIMO_SORTEO = { id, filas };
    toast(`Sorteo hecho: ${cambios.length} equipos asignados`); await refrescar();
  },
  async resetsorteo({ id }) {
    const t = torneoById(id);
    if (!confirm(`¿Reiniciar el sorteo de ${t.nombre}? Todos los jugadores aprobados vuelven a quedar sin equipo y se puede sortear de nuevo.`)) return;
    for (const x of LIVE_INSCRIPTOS.filter(y => y.liga === id && y.estado === "aprobada" && y.equipoId)) await sbUpd("inscripciones", x.id, { equipo_id: null });
    ULTIMO_SORTEO = null; toast("Sorteo reiniciado"); await refrescar();
  },
  async fixture({ liga }) {
    const jug = LIVE_INSCRIPTOS.filter(x => x.estado === "aprobada" && x.liga === liga).map(x => x.id);
    if (jug.length < 2) return;
    const yaHay = new Set(PARTIDOS.filter(m => m.liga === liga).map(m => [m.a, m.b].sort().join("|")));
    const filas = [];
    roundRobin(jug).forEach((ps, r) => ps.forEach(([a, b]) => { if (!yaHay.has([a, b].sort().join("|"))) filas.push({ torneo: liga, jornada: r + 1, jugador_a: a, jugador_b: b }); }));
    if (!filas.length) { toast("Ya están todos los cruces creados"); return; }
    if (!confirm(`Se van a crear ${filas.length} partidos en ${nombreLiga(liga)}. ¿Seguimos?`)) return;
    const { error } = await sb.from("partidos").insert(filas); if (error) throw error;
    toast(`${filas.length} partidos creados`); await refrescar();
  },
  async fixtureko({ liga }) {
    const jug = mezclar(LIVE_INSCRIPTOS.filter(x => x.estado === "aprobada" && x.liga === liga).map(x => x.id));
    if (jug.length < 2) return;
    const filas = []; for (let i = 0; i + 1 < jug.length; i += 2) filas.push({ torneo: liga, jornada: 1, jugador_a: jug[i], jugador_b: jug[i + 1] });
    if (!confirm(`Se van a sortear ${filas.length} cruces de la primera ronda${jug.length % 2 ? " (uno pasa libre)" : ""}. ¿Seguimos?`)) return;
    const { error } = await sb.from("partidos").insert(filas); if (error) throw error;
    toast(`${filas.length} cruces creados`); await refrescar();
  },
  async delpartido({ id }) {
    if (!confirm("¿Eliminar este partido? Si ya tenía resultado, se pierde.")) return;
    const { error } = await sb.from("partidos").delete().eq("id", id); if (error) throw error; toast("Partido eliminado"); await refrescar();
  },
  async borrarres({ id }) {
    if (!confirm("¿Borrar el resultado? El partido vuelve a quedar programado.")) return;
    const liga = (PARTIDOS.find(m => m.id === id) || {}).liga || TORNEOS[0].id;
    await sbUpd("partidos", id, { estado: "programado", stats: null }); toast("Resultado borrado"); await cargarDatos(); location.hash = "#/admin/partidos/" + liga; render();
  },
};
const CAMBIOS = {
  async setestado({ id }, el) { await sbUpd("torneos", id, { estado: el.value }); toast("Estado del torneo actualizado"); await refrescar(); },
  admtor(_, el) { const f = (location.hash.replace(/^#\/?/, "").split("/")[2]) || "pendiente"; location.hash = "#/admin/solicitudes/" + f + (el.value ? "/" + el.value : ""); },
  admpart(_, el) { location.hash = "#/admin/partidos/" + el.value; },
};
function enlazarEventos() {
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    e.preventDefault();
    const fn = ACCIONES[el.dataset.act]; if (!fn || el.disabled) return;
    try { await fn(el.dataset, el); } catch (err) { toast(msgErr(err), "err"); }
  });
  document.addEventListener("change", async e => {
    const el = e.target.closest("[data-chg]"); if (!el) return;
    const fn = CAMBIOS[el.dataset.chg]; if (!fn) return;
    try { await fn(el.dataset, el); } catch (err) { toast(msgErr(err), "err"); }
  });
  window.addEventListener("hashchange", render);
}

// ============================================================
//  ARRANQUE
// ============================================================
(async function iniciar() {
  enlazarEventos();
  if (!sb) { LIVE = false; render(); return; }   // sin Supabase: modo ejemplo
  LIVE = true; JUGADORES = []; PARTIDOS = []; LIVE_INSCRIPTOS = []; TORNEO_CUPOS = {};
  app.innerHTML = `<div class="wrap" style="padding:140px 20px;text-align:center"><span class="pill">Cargando LDV Necochense…</span></div>`;
  await cargarSesion(); await cargarDatos(); render();
})();
