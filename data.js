// ============================================================
//  DATOS DE LDV NECOCHENSE (LIGA DE VIRGOS) · datos de ejemplo
//  Más adelante estos datos van a venir de Supabase.
//  Las estrellas son aproximadas: podés corregirlas acá.
// ============================================================


// Precio de inscripción según estrellas del equipo
function precioPorEstrellas(estrellas) {
  if (estrellas <= 3) return 10000;
  if (estrellas <= 4) return 20000;
  if (estrellas <= 4.5) return 50000;
  return 100000; // 5 estrellas
}

// [nombre, estrellas, color1, color2]
const EQUIPOS_RAW = [
  ["Real Madrid", 5, "#ffffff", "#1d4ed8"],
  ["Manchester City", 5, "#6cabdd", "#1c2c5b"],
  ["FC Barcelona", 5, "#a50044", "#004d98"],
  ["París Saint-Germain", 5, "#004170", "#da291c"],
  ["Bayern Múnich", 5, "#dc052d", "#0066b2"],
  ["Liverpool", 5, "#c8102e", "#00b2a9"],
  ["Arsenal", 4.5, "#ef0107", "#063672"],
  ["Inter", 4.5, "#0068a8", "#111111"],
  ["Atlético de Madrid", 4.5, "#cb3524", "#272e61"],
  ["Chelsea", 4.5, "#034694", "#dba111"],
  ["Manchester United", 4.5, "#da291c", "#fbe122"],
  ["Juventus", 4.5, "#111111", "#ffffff"],
  ["AC Milan", 4.5, "#fb090b", "#111111"],
  ["Borussia Dortmund", 4.5, "#fde100", "#111111"],
  ["Napoli", 4, "#12a0d7", "#003c82"],
  ["Tottenham", 4, "#132257", "#ffffff"],
  ["Newcastle", 4, "#241f20", "#ffffff"],
  ["Aston Villa", 4, "#670e36", "#95bfe5"],
  ["Roma", 4, "#8e1f2f", "#f0bc42"],
  ["Atalanta", 4, "#1e71b8", "#111111"],
  ["Bayer Leverkusen", 4, "#e32221", "#111111"],
  ["River Plate", 4, "#ffffff", "#e30613"],
  ["Boca Juniors", 3.5, "#0a2a66", "#f5c518"],
  ["Racing Club", 3.5, "#6cb4e4", "#ffffff"],
  ["Independiente", 3.5, "#cf142b", "#ffffff"],
  ["San Lorenzo", 3.5, "#0b2a5b", "#c8102e"],
  ["Everton", 3.5, "#003399", "#ffffff"],
  ["Sevilla", 3.5, "#d4001f", "#ffffff"],
  ["Estudiantes", 3, "#d10024", "#ffffff"],
  ["Vélez Sarsfield", 3, "#003a8c", "#ffffff"],
  ["Talleres", 3, "#0a2a66", "#ffffff"],
  ["Rosario Central", 3, "#1a4aa0", "#f5c518"],
  ["Newell's Old Boys", 3, "#c8102e", "#111111"],
  ["Lanús", 3, "#8b1a2b", "#ffffff"],
  ["Gimnasia (LP)", 2.5, "#1c3f94", "#ffffff"],
  ["Platense", 2.5, "#6b3a1e", "#ffffff"],
  ["Huracán", 2.5, "#ffffff", "#c8102e"],
  ["Banfield", 2, "#1a7a3a", "#ffffff"],
  ["Argentinos Juniors", 2, "#c8102e", "#ffffff"],
  ["Defensa y Justicia", 2, "#f5c518", "#1a7a3a"],
];

const EQUIPOS = EQUIPOS_RAW.map(([nombre, estrellas, c1, c2], i) => ({
  id: i + 1, nombre, estrellas, c1, c2, precio: precioPorEstrellas(estrellas),
  iniciales: nombre.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
}));


// ============================================================
//  JUEGOS Y TORNEOS  (editá esto para cambiar premios, cupos, precios...)
//  Cada torneo es una "liga" donde la gente se anota.
// ============================================================
const JUEGOS = {
  eafc27:  { id: "eafc27",  nombre: "EA FC 27",        deporte: "Fútbol",         color: "#2bd97c", stats: "futbol", marcador: "Goles",  ht: true,  pv: 3, pe: 1, empates: true },
  pes6:    { id: "pes6",    nombre: "PES 6",           deporte: "Fútbol retro",   color: "#3d8bff", stats: "futbol", marcador: "Goles",  ht: true,  pv: 3, pe: 1, empates: true },
  nba2k27: { id: "nba2k27", nombre: "NBA 2K27",        deporte: "Básquet",        color: "#ff8a3d", stats: "nba",    marcador: "Puntos", ht: true,  pv: 2, pe: 0, empates: false },
  mk1:     { id: "mk1",     nombre: "Mortal Kombat 1", deporte: "Lucha",          color: "#ff3b4e", stats: "mk",     marcador: "Rondas", ht: false, pv: 3, pe: 0, empates: false },
  mk3:     { id: "mk3",     nombre: "Mortal Kombat 3", deporte: "Lucha retro",    color: "#ffd23d", stats: "mk",     marcador: "Rondas", ht: false, pv: 3, pe: 0, empates: false },
  f1:      { id: "f1",      nombre: "F1 2027",         deporte: "Automovilismo",  color: "#ff5a4d", stats: "f1",     marcador: "Puntos", ht: false, pv: 3, pe: 0, empates: false },
};
// Estadísticas que se cargan en cada tipo de juego: [campo, etiqueta, sufijo, "menos es mejor"]
// El primero de la lista siempre es el marcador.
const STATS_JUEGO = {
  futbol: [["goles", "Goles"], ["pos", "Posesión", "%"], ["tiros", "Tiros"], ["tirosArco", "Tiros al arco"], ["pases", "Pases"], ["precision", "Precisión de pases", "%"],
    ["entradas", "Entradas"], ["faltas", "Faltas", "", 1], ["offsides", "Offsides", "", 1], ["corners", "Córners"], ["amarillas", "Tarjetas amarillas", "", 1], ["rojas", "Tarjetas rojas", "", 1], ["atajadas", "Atajadas"]],
  nba: [["goles", "Puntos"], ["reb", "Rebotes"], ["ast", "Asistencias"], ["rob", "Robos"], ["tap", "Tapones"], ["tri", "Triples"], ["per", "Pérdidas", "", 1], ["fal", "Faltas", "", 1]],
  mk: [["goles", "Rondas ganadas"]],
  f1: [["goles", "Puntos"]],
};

// inscripcion: { tipo: "fija", monto } o { tipo: "estrellas" } (el precio depende de las estrellas del equipo)
// equipos: "sorteo" = el jugador elige hasta 3 equipos y se asignan por sorteo cuando se completa el cupo
//          "ninguno" = no hay equipo fijo (se elige en cada partido)
// demo: cuántos anotados muestra la versión de ejemplo (sin Supabase)
const TORNEOS = [
  { id: "trimestral", nombre: "Liga Trimestral", juego: "eafc27", formato: "Liga · todos contra todos", cupo: 30, unidad: "equipos", duracion: "3 meses",
    inscripcion: { tipo: "fija", monto: 100000 }, porFecha: { monto: 5000, txt: "por fecha" }, premios: [["Campeón", 1500000], ["Subcampeón", 500000]],
    equipos: "sorteo", destacado: true, demo: 23, desc: "La liga grande de la ciudad: 3 meses de competencia y el premio más alto." },
  { id: "finde", nombre: "Liga de Fin de Semana", juego: "eafc27", formato: "Liga · todos contra todos", cupo: 20, unidad: "equipos", duracion: "2 días",
    inscripcion: { tipo: "fija", monto: 50000 }, porFecha: { monto: 5000, txt: "por partido" }, premios: [["Campeón", 500000], ["Subcampeón", 250000]],
    equipos: "sorteo", demo: 14, desc: "Todo se define en un fin de semana. Rápida, intensa y con premio." },
  { id: "premier", nombre: "Premier League", juego: "eafc27", formato: "Liga · todos contra todos", cupo: 20, unidad: "equipos", duracion: "2 meses",
    inscripcion: { tipo: "estrellas" }, porFecha: null, premios: [["Campeón", 500000]],
    equipos: "sorteo", demo: 17, desc: "Cuanto mejor el equipo, más cuesta anotarse: de $10.000 (3★) a $100.000 (5★)." },
  { id: "copa", nombre: "Copa Necochea", juego: "eafc27", formato: "Eliminación directa", cupo: 32, unidad: "equipos", duracion: "1 mes",
    inscripcion: { tipo: "fija", monto: 30000 }, porFecha: null, premios: [["Campeón", 600000], ["Subcampeón", 200000]],
    equipos: "sorteo", demo: 21, desc: "Perdés y te vas. Cruces directos hasta la gran final." },
  { id: "champions", nombre: "Champions Virgos", juego: "eafc27", formato: "Grupos + eliminatorias", cupo: 32, unidad: "equipos", duracion: "6 semanas",
    inscripcion: { tipo: "fija", monto: 40000 }, porFecha: { monto: 3000, txt: "por partido" }, premios: [["Campeón", 800000], ["Subcampeón", 300000]],
    equipos: "sorteo", demo: 9, desc: "Fase de grupos y llaves a lo Champions, con sorteo y todo." },
  { id: "relampago", nombre: "Torneo Relámpago", juego: "eafc27", formato: "Eliminación directa", cupo: 16, unidad: "equipos", duracion: "1 día",
    inscripcion: { tipo: "fija", monto: 20000 }, porFecha: null, premios: [["Campeón", 200000], ["Subcampeón", 80000]],
    equipos: "sorteo", demo: 11, desc: "16 jugadores, un solo día, un solo campeón." },
  { id: "novatos", nombre: "Liga Novatos", juego: "eafc27", formato: "Liga · todos contra todos", cupo: 16, unidad: "equipos", duracion: "6 semanas",
    inscripcion: { tipo: "fija", monto: 10000 }, porFecha: { monto: 2000, txt: "por fecha" }, premios: [["Campeón", 150000]],
    equipos: "sorteo", maxEstrellas: 3, demo: 6, desc: "Solo equipos de hasta 3 estrellas: parejo y barato para arrancar." },
  { id: "nba", nombre: "Liga NBA 2K27", juego: "nba2k27", formato: "Liga · todos contra todos", cupo: 16, unidad: "jugadores", duracion: "6 semanas",
    inscripcion: { tipo: "fija", monto: 30000 }, porFecha: { monto: 2000, txt: "por fecha" }, premios: [["Campeón", 400000], ["Subcampeón", 150000]],
    equipos: "ninguno", demo: 9, desc: "Básquet virtual: puntos, rebotes, asistencias y triples." },
  { id: "mk1", nombre: "Torneo Mortal Kombat 1", juego: "mk1", formato: "Eliminación directa", cupo: 32, unidad: "jugadores", duracion: "2 días",
    inscripcion: { tipo: "fija", monto: 15000 }, porFecha: null, premios: [["Campeón", 250000], ["Subcampeón", 100000]],
    equipos: "ninguno", demo: 18, desc: "Llaves directas, mejor de 3 rondas. Que gane el más letal." },
  { id: "mk3", nombre: "Copa Mortal Kombat 3", juego: "mk3", formato: "Eliminación directa", cupo: 16, unidad: "jugadores", duracion: "1 día",
    inscripcion: { tipo: "fija", monto: 10000 }, porFecha: null, premios: [["Campeón", 120000], ["Subcampeón", 50000]],
    equipos: "ninguno", demo: 12, desc: "El clásico de los 90 en una sola jornada." },
  { id: "pes6", nombre: "Liga PES 6 Retro", juego: "pes6", formato: "Liga · todos contra todos", cupo: 12, unidad: "jugadores", duracion: "2 meses",
    inscripcion: { tipo: "fija", monto: 20000 }, porFecha: { monto: 2000, txt: "por fecha" }, premios: [["Campeón", 250000], ["Subcampeón", 100000]],
    equipos: "ninguno", demo: 5, desc: "Para nostálgicos: el mejor juego de fútbol de todos los tiempos." },
  { id: "f1", nombre: "Campeonato F1 2027", juego: "f1", formato: "Campeonato · 10 carreras", cupo: 20, unidad: "pilotos", duracion: "2 meses",
    inscripcion: { tipo: "fija", monto: 25000 }, porFecha: { monto: 3000, txt: "por carrera" }, premios: [["Campeón", 400000], ["Subcampeón", 150000], ["Tercero", 75000]],
    equipos: "ninguno", demo: 7, desc: "Diez Grandes Premios, puntos por posición y un solo campeón del año." },
];
TORNEOS.forEach(t => { t.color = JUEGOS[t.juego].color; });
const LIGAS = TORNEOS; // el resto del código llama "liga" a cada torneo
const PREMIO = Math.max(...TORNEOS.map(t => t.premios[0][1])); // el premio más alto

// Jugadores de ejemplo (nombre de usuario)
const NOMBRES_DEMO = [
  "QuichaProPlayer", "ElPibeDeLaCosta", "TitoFC", "MaxiCrack10", "NecocheaGamer", "LaBestiaSur",
  "FranGol99", "ElCholo_Nqn", "SantiSniper", "BrunoTheWall", "LucasMagic", "DaniDribbler",
  "ToroSalvaje", "PabloPase", "GeroGoleador", "NachoFC", "ElZurdoLoco", "JuanPro23",
  "TomiTurbo", "MateoMVP", "FedeFantasma", "CoquitoGamer", "MarcosMuro", "IvanImparable",
  "LeoLaPulga_", "ChinoCrack", "RamiRayo", "AgusAsist", "BautiBomba", "NicoNinja",
  "TeoTitan", "SeboSniper", "LautaroLazo", "KevinKing", "EzeElegante", "GastonGuante",
  "PipaPro", "MartinMonstruo", "CarlosCañon", "OriOro"
];

// Generador pseudo-aleatorio fijo (así los datos de ejemplo no cambian en cada recarga)
function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

// ============================================================
//  ESTADÍSTICAS: son las que muestra el juego en el entretiempo
//  y al final del partido. Acumuladas por jugador en la tabla:
//   gf / gc (goles a favor y en contra), posesion (% promedio),
//   tiros, tirosArco, pases, precision (% de pases), entradas,
//   faltas, offsides, corners, amarillas, rojas, atajadas
// ============================================================
const PARTICIPANTES = [];
const PJ_DEMO = 10;
(function () {
  const r = rng(27);
  const orden = [...EQUIPOS].sort((a, b) => b.estrellas - a.estrellas);
  let n = 0;
  LIGAS.slice(0, 5).forEach(liga => {
    for (let k = 0; k < 8; k++) {
      const equipo = orden[n % orden.length];
      const nombre = NOMBRES_DEMO[n % NOMBRES_DEMO.length];
      n++;
      let fuerza = r();
      if (nombre === "QuichaProPlayer") fuerza = 0.97;
      let g = Math.round(fuerza * 8 + r() * 2);
      g = Math.min(nombre === "QuichaProPlayer" ? PJ_DEMO : 7, g);
      const e = Math.min(PJ_DEMO - g, Math.floor(r() * 3));
      const p = PJ_DEMO - g - e;
      const gf = g * 2 + e + Math.floor(r() * 6);
      const gc = p * 2 + e + Math.floor(r() * 5);
      const forma = [];
      for (let f = 0; f < 5; f++) { const x = r(); forma.push(x < fuerza * .75 ? "G" : x < fuerza * .75 + .15 ? "E" : "P"); }
      const tiros = Math.round(gf * 3.4 + PJ_DEMO * 2 + r() * 20);
      PARTICIPANTES.push({
        id: nombre.toLowerCase(), nombre, equipoId: equipo.id, liga: liga.id,
        pj: PJ_DEMO, g, e, p, gf, gc, dg: gf - gc, pts: g * 3 + e, forma,
        posesion: Math.round(42 + fuerza * 14 + r() * 6),
        tiros, tirosArco: Math.min(tiros, Math.round(gf * 1.9 + PJ_DEMO * 1.2 + r() * 8)),
        pases: Math.round(PJ_DEMO * (230 + r() * 140)), precision: Math.round(68 + fuerza * 14 + r() * 6),
        entradas: Math.round(PJ_DEMO * (6 + r() * 6)), faltas: Math.round(PJ_DEMO * (2 + r() * 3)),
        offsides: Math.round(PJ_DEMO * (0.5 + r() * 1.5)), corners: Math.round(PJ_DEMO * (3 + r() * 3)),
        amarillas: Math.floor(r() * 7), rojas: r() < 0.12 ? 1 : 0, atajadas: Math.round(PJ_DEMO * (2 + r() * 3)),
        ciudad: "Necochea", plataforma: "PlayStation 5", desde: "Octubre 2026"
      });
    }
  });
})();

// Jugador de ejemplo: QuichaProPlayer (Real Madrid, Liga A)
const _q = PARTICIPANTES.find(p => p.nombre === "QuichaProPlayer");
Object.assign(_q, {
  equipoId: EQUIPOS.find(t => t.nombre === "Real Madrid").id, liga: TORNEOS[0].id,
  pj: 10, g: 9, e: 1, p: 0, gf: 34, gc: 8, dg: 26, pts: 28, forma: ["G", "G", "E", "G", "G"],
  posesion: 61, tiros: 142, tirosArco: 91, pases: 4120, precision: 87, entradas: 74,
  faltas: 38, offsides: 9, corners: 58, amarillas: 3, rojas: 0, atajadas: 23,
  plataforma: "PlayStation 5", racha: "Invicto en 10 partidos"
});

// ============================================================
//  PARTIDOS DE EJEMPLO con ficha del entretiempo (ht) y del final (ft)
//  "a" y "b" son los ids de los jugadores (nombre en minúsculas)
// ============================================================
const PARTIDOS_DEMO = (function () {
  const r = rng(555);
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  function lado(g, pos) {
    const tiros = g * 3 + 5 + Math.floor(r() * 6);
    return {
      goles: g, pos, tiros, tirosArco: Math.max(g, Math.min(tiros, g + 2 + Math.floor(r() * 4))),
      pases: Math.round(150 + pos * 4.2 + r() * 60), precision: cl(Math.round(66 + pos / 4 + r() * 14), 60, 93),
      entradas: 6 + Math.floor(r() * 10), faltas: 1 + Math.floor(r() * 6), offsides: Math.floor(r() * 4),
      corners: Math.floor(r() * 8), amarillas: r() < 0.35 ? 1 : 0, rojas: 0, atajadas: 0
    };
  }
  function mitad(S, gH) {
    const arco = Math.max(gH, Math.floor(S.tirosArco * 0.5));
    return {
      goles: gH, pos: cl(S.pos + Math.round((r() - 0.5) * 6), 30, 72), tiros: Math.max(arco, Math.floor(S.tiros * 0.5)), tirosArco: arco,
      pases: Math.floor(S.pases * 0.48), precision: cl(S.precision + Math.round((r() - 0.5) * 4), 55, 95),
      entradas: Math.floor(S.entradas * 0.5), faltas: Math.floor(S.faltas * 0.5), offsides: Math.floor(S.offsides * 0.5),
      corners: Math.floor(S.corners * 0.5), amarillas: Math.floor(S.amarillas * 0.5), rojas: 0, atajadas: 0
    };
  }
  function mk(id, jornada, a, b, ga, gb, ha, hb, posA) {
    const A = lado(ga, posA), B = lado(gb, 100 - posA);
    A.atajadas = Math.max(0, B.tirosArco - B.goles); B.atajadas = Math.max(0, A.tirosArco - A.goles);
    const hA = mitad(A, ha), hB = mitad(B, hb);
    hB.pos = 100 - hA.pos;
    hA.atajadas = Math.max(0, hB.tirosArco - hB.goles); hB.atajadas = Math.max(0, hA.tirosArco - hA.goles);
    return { id, jornada, liga: TORNEOS[0].id, a, b, ft: { a: A, b: B }, ht: { a: hA, b: hB } };
  }
  return [
    mk("p10", 10, "quichaproplayer", "elcholo_nqn", 4, 1, 2, 0, 63),
    mk("p9", 9, "maxicrack10", "quichaproplayer", 0, 3, 0, 2, 42),
    mk("p8", 8, "quichaproplayer", "labestiasur", 2, 2, 1, 1, 58),
    mk("p7", 7, "quichaproplayer", "titofc", 5, 2, 3, 1, 60),
    mk("p6", 6, "necocheagamer", "quichaproplayer", 0, 2, 0, 1, 40),
    mk("p5", 5, "quichaproplayer", "frangol99", 3, 1, 1, 0, 62),
  ];
})();

// Cuántos inscriptos "reales" hay (en la versión 1 es de ejemplo)
const META_INSCRIPTOS = 40;

// Fecha de arranque de la temporada (cambiala por la real)
const INICIO = "2026-12-07T20:00:00-03:00";

// Disponibilidad horaria
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TURNOS = ["Mañana", "Tarde", "Noche"];

// Inscriptos de EJEMPLO para que el panel de administrador tenga datos.
// Cuando conectemos Supabase, esto se reemplaza por los datos reales.
const DEMO_INSCRIPTOS = (function () {
  const r = rng(99);
  const plat = ["PlayStation 5", "PlayStation 5", "PlayStation 4", "Xbox Series", "PC"];
  const prob = { "Mañana": 0.12, "Tarde": 0.3, "Noche": 0.6 };
  const out = [];
  for (let i = 0; i < 17; i++) {
    const t = EQUIPOS[Math.floor(r() * EQUIPOS.length)];
    const disp = [];
    DIAS.forEach(d => TURNOS.forEach(tn => { if (r() < prob[tn]) disp.push(d + "|" + tn); }));
    if (!disp.length) disp.push("Viernes|Noche");
    out.push({
      nombre: NOMBRES_DEMO[i + 1], gamertag: NOMBRES_DEMO[i + 1], whatsapp: "",
      plataforma: plat[Math.floor(r() * plat.length)], equipoId: t.id, disp,
      ts: Date.now() - Math.floor(r() * 7) * 86400000
    });
  }
  return out;
})();

// Próximos partidos de EJEMPLO (para mostrar cómo se ve el panel del jugador)
const PARTIDOS_PROG_DEMO = (function () {
  const f = (dias, h) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(h, 0, 0, 0); return d.toISOString(); };
  return [
    { id: "pp11", liga: TORNEOS[0].id, jornada: 11, a: "quichaproplayer", b: "elpibedelacosta", estado: "programado", fecha: f(3, 21), ft: null, ht: null },
    { id: "pp12", liga: TORNEOS[0].id, jornada: 12, a: "titofc", b: "quichaproplayer", estado: "programado", fecha: f(7, 22), ft: null, ht: null },
    { id: "pp13", liga: TORNEOS[0].id, jornada: 13, a: "quichaproplayer", b: "maxicrack10", estado: "programado", fecha: f(10, 20), ft: null, ht: null },
  ];
})();
