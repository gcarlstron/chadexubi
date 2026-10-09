'use strict';
// =====================================================================
//  world/level.js — construtor de mapas (Grid), registro e carga de fases
//
//  Uma fase e registrada em levels/faseN.js com registerLevel(n, () => ({...})).
//  Campos usados pelo motor (todos opcionais exceto mapa/start):
//    n, name, theme ('forest'|'snow'|'volcano'), song, W, H, M, start [[x,y],[x,y]]
//    intro [linhas], items [{kind, x, y, ...}], enemies [[tipo, tx, ty]], signs {'x,y': [linhas]}
//    plates {'x,y': grupo}, gates {'x,y': grupo}, gateRules {grupo: {mode:'hold'|'all'|'flag', flag}}
//    crystals {'x,y': {bridge|seq|timed, ...}}, seqBridge, levers {'x,y': id}, combo, lockNeed {'x,y': n}
//    towers {y, fake, plazaY}
//  Ganchos da fase (opcionais):
//    update(dt)          — gatilhos proprios (cenas, altar...)
//    onFakeTowers()      — o que acontece depois do suspense das torres falsas
//    onBossDefeated(e), onScroll()
// =====================================================================
const LEVELS = {};
function registerLevel(n, build) { LEVELS[n] = build; }

function Grid(W, H, seed) {
  const M = []; for (let y = 0; y < H; y++) M.push(Array(W).fill('.'));
  const r = mulberry(seed);
  const g = {
    W, H, M, r,
    set(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) M[y][x] = c; },
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(i, j, c); },
    outline(x, y, w, h, c) { for (let i = x; i < x + w; i++) { g.set(i, y, c); g.set(i, y + h - 1, c); } for (let j = y; j < y + h; j++) { g.set(x, j, c); g.set(x + w - 1, j, c); } },
    deco(p) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (M[y][x] === '.' && r() < p) M[y][x] = ','; },
    border() { g.rect(0, 0, W, 2, 'T'); g.rect(0, H - 2, W, 2, 'T'); g.rect(0, 0, 2, H, 'T'); g.rect(W - 2, 0, 2, H, 'T'); },
    // arvores aleatorias fora das areas protegidas (keep = [[x,y,w,h],...])
    trees(p, keep) {
      const inKeep = (x, y) => keep.some(([a, b, w, h]) => x >= a && x < a + w && y >= b && y < b + h);
      for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (!'.,'.includes(M[y][x]) || inKeep(x, y) || r() > p) continue;
        let ok = true;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!'.,T'.includes(M[y + j][x + i])) ok = false;
        if (ok) M[y][x] = 'T';
      }
    },
  };
  return g;
}
const tc = (x, y) => ({ x: x * TS + 8, y: y * TS + 8 }); // centro do tile em pixels

function loadLevel(n) {
  LV = LEVELS[n](); M = LV.M; W = LV.W; H = LV.H;
  drops = []; timers = []; flags = {}; camFocus = null;
  items = LV.items.map(i => Object.assign({ taken: false }, i));
  LEVEL_LOAD_HOOKS.forEach(f => f());
  for (const [t, x, y] of LV.enemies) spawn(t, x, y);
  placeHeroes(LV.start);
  LV.respawnPt = LV.start;
  const h = L(); cam.x = clamp(h.x + 8 - VW / 2, 0, W * TS - VW); cam.y = clamp(h.y + 8 - VH / 2, 0, H * TS - VH);
  playSong(LV.song);
  banner = { s1: 'FASE ' + LV.n, s2: LV.name, t: 3.5 };
}
function nextLevel() {
  if (state === 'trans') return;
  state = 'trans'; SFX.portal(); fadeCol = '0,0,0';
  const n = LV.n + 1;
  later(1.0, () => { loadLevel(n); fade = 1; state = 'play'; say(LV.intro); });
}
function updatePortals() {
  for (const h of active()) { const [tx, ty] = heroTile(h); if (M[ty][tx] === 'O') { nextLevel(); return true; } }
  return false;
}
