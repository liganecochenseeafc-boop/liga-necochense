// ============================================================
//  DATOS DE LA LIGA (versión 1 con datos de ejemplo)
//  Más adelante estos datos van a venir de Supabase.
//  Las estrellas son aproximadas: podés corregirlas acá.
// ============================================================

const PREMIO = 1000000;

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


const LIGAS = [
  { id: "A", nombre: "Liga A", desc: "La élite. Los mejores jugadores de Necochea.", color: "#ffc531" },
  { id: "B", nombre: "Liga B", desc: "Alto nivel y mucha pelea por el ascenso.", color: "#3ee6ff" },
  { id: "C", nombre: "Liga C", desc: "Intermedia, pareja y muy picante.", color: "#8b7bff" },
  { id: "D", nombre: "Liga D", desc: "Para los que vienen creciendo.", color: "#ff8a3d" },
  { id: "E", nombre: "Liga E", desc: "Puerta de entrada a la competencia.", color: "#ff4d5e" },
];

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
  LIGAS.forEach(liga => {
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
  equipoId: EQUIPOS.find(t => t.nombre === "Real Madrid").id, liga: "A",
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
    return { id, jornada, liga: "A", a, b, ft: { a: A, b: B }, ht: { a: hA, b: hB } };
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
