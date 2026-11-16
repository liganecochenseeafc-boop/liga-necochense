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
  { id: "A", nombre: "Liga A", desc: "La élite. Los mejores jugadores de Necochea.", color: "#00ff87" },
  { id: "B", nombre: "Liga B", desc: "Alto nivel y mucha pelea por el ascenso.", color: "#3b82f6" },
  { id: "C", nombre: "Liga C", desc: "Intermedia, pareja y muy picante.", color: "#8b5cf6" },
  { id: "D", nombre: "Liga D", desc: "Para los que vienen creciendo.", color: "#ffc83d" },
  { id: "E", nombre: "Liga E", desc: "Puerta de entrada a la competencia.", color: "#ff4d6d" },
];

// Jugadores de ejemplo (nombre de usuario, equipo)
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

// Arma 8 participantes por liga con tabla de ejemplo
const PARTICIPANTES = [];
const PJ_DEMO = 10;
(function () {
  const r = rng(27);
  // Equipos asignados de forma ordenada por estrellas a cada liga
  const orden = [...EQUIPOS].sort((a, b) => b.estrellas - a.estrellas);
  let n = 0;
  LIGAS.forEach((liga, li) => {
    for (let k = 0; k < 8; k++) {
      const equipo = orden[n % orden.length];
      const nombre = NOMBRES_DEMO[n % NOMBRES_DEMO.length];
      n++;
      // Fuerza: la primera de la liga A es QuichaProPlayer
      let fuerza = r();
      if (nombre === "QuichaProPlayer") fuerza = 0.97;
      let g = Math.round(fuerza * 8 + r() * 2);
      g = Math.min(nombre === "QuichaProPlayer" ? PJ_DEMO : 7, g);
      let e = Math.min(PJ_DEMO - g, Math.floor(r() * 3));
      const p = PJ_DEMO - g - e;
      const gf = g * 2 + e + Math.floor(r() * 6);
      const gc = p * 2 + e + Math.floor(r() * 5);
      const forma = [];
      for (let f = 0; f < 5; f++) { const x = r(); forma.push(x < fuerza * .75 ? "G" : x < fuerza * .75 + .15 ? "E" : "P"); }
      PARTICIPANTES.push({
        id: nombre.toLowerCase(), nombre, equipoId: equipo.id, liga: liga.id,
        pj: PJ_DEMO, g, e, p, gf, gc, dg: gf - gc, pts: g * 3 + e, forma,
        pases: Math.round(300 + r() * 250), tiros: Math.round(8 + r() * 12), posesion: Math.round(42 + r() * 20)
      });
    }
  });
})();

// Perfil completo de ejemplo
const PERFIL_QUICHA = {
  id: "quichaproplayer",
  nombre: "QuichaProPlayer",
  ciudad: "Necochea",
  plataforma: "PlayStation 5",
  posicionFav: "Delantero (DC)",
  ovr: 91,
  desde: "Octubre 2026",
  racha: "Racha de 6 victorias",
  stats: {
    partidos: 10, victorias: 9, empates: 1, derrotas: 0,
    goles: 34, golesContra: 8, asistencias: 17, mvp: 6, vallasInvictas: 5,
    tiros: 142, tirosAlArco: 91, precisionTiros: 64,
    pases: 4120, pasesCompletados: 3590, precisionPases: 87,
    pasesClave: 63, pasesProgresivos: 211,
    regates: 118, regatesExitosos: 84,
    posesion: 61, recuperaciones: 167, intercepciones: 92, entradas: 74,
    faltasCometidas: 38, faltasRecibidas: 71, amarillas: 3, rojas: 0,
    corners: 58, golesDeTiroLibre: 4, golesDePenal: 5, golesDeCabeza: 3,
    xG: 29.4, minutosJugados: 900
  },
  habilidades: [
    ["Definición", 94], ["Pase", 87], ["Regate", 89], ["Posicionamiento", 91],
    ["Defensa", 62], ["Físico", 78], ["Velocidad", 90], ["Mentalidad", 93]
  ],
  partidos: [
    { j: 10, rival: "ElZurdoLoco", res: "4-1", r: "G", goles: 2, asist: 1 },
    { j: 9, rival: "MaxiCrack10", res: "3-0", r: "G", goles: 1, asist: 2 },
    { j: 8, rival: "LaBestiaSur", res: "2-2", r: "E", goles: 1, asist: 0 },
    { j: 7, rival: "TitoFC", res: "5-2", r: "G", goles: 3, asist: 1 },
    { j: 6, rival: "NecocheaGamer", res: "2-0", r: "G", goles: 2, asist: 0 },
    { j: 5, rival: "FranGol99", res: "3-1", r: "G", goles: 1, asist: 1 },
  ]
};
// El equipo de Quicha en el ejemplo
const _q = PARTICIPANTES.find(p => p.nombre === "QuichaProPlayer");
if (_q) { _q.equipoId = EQUIPOS.find(t => t.nombre === "Real Madrid").id; _q.liga = "A";
  _q.pj = 10; _q.g = 9; _q.e = 1; _q.p = 0; _q.gf = 34; _q.gc = 8; _q.dg = 26; _q.pts = 28; _q.forma = ["G","G","G","E","G"]; }

// Cuántos inscriptos "reales" hay (en la versión 1 es de ejemplo)
const META_INSCRIPTOS = 40;
