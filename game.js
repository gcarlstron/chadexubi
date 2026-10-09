'use strict';
// =====================================================================
//  O DESAFIO DAS DUAS TORRES  -  jogo de revelacao (Gu & De)
//  Canvas puro, sem dependencias. Abra index.html (ou JOGAR.bat).
//  Testes: index.html?teste=menino | ?teste=menina | &pular=1
// =====================================================================

const VW = 320, VH = 180, TS = 16, W = 48, H = 40;
const params = new URLSearchParams(location.search);

// ---------------- canvas ----------------
const cv = document.getElementById('game');
const out = cv.getContext('2d');
const buf = document.createElement('canvas'); buf.width = VW; buf.height = VH;
const ctx = buf.getContext('2d');
let S = 1, OX = 0, OY = 0;
function resize() {
  cv.width = innerWidth; cv.height = innerHeight;
  let s = Math.min(innerWidth / VW, innerHeight / VH);
  if (s >= 1) s = Math.floor(s);
  S = s; OX = Math.floor((innerWidth - VW * S) / 2); OY = Math.floor((innerHeight - VH * S) / 2);
}
addEventListener('resize', resize); resize();

// ---------------- util ----------------
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// ---------------- segredo ----------------
function lerSegredo() {
  const q = (params.get('teste') || '').toLowerCase();
  if (q === 'menino') return 0;
  if (q === 'menina') return 1;
  const t = window.SEGREDO;
  if (!t || typeof t !== 'string' || t.length !== 32) return null;
  const b = []; for (let i = 0; i < 32; i += 2) b.push(parseInt(t.substr(i, 2), 16));
  let s = 0; for (let i = 0; i < 15; i++) s += b[i];
  const d = ((b[15] - s - 3) % 256 + 512) % 256;
  if (d === 0) return 0;
  if (d === 7) return 1;
  return null;
}
const RESULT = lerSegredo(); // 0 = Valhala (azul), 1 = Lothlorien (rosa), null = sem segredo

// ---------------- sprites ----------------
const PAL = { k: '#1a1a2e', s: '#f2c39b', S: '#d49a6a', h: '#d9772b', H: '#a8501a', g: '#c8d0d8', G: '#7a8490', w: '#f4ead2', b: '#3a6fd8', B: '#23468f', n: '#7a4a2a', N: '#4f2e18', y: '#f5d76e', Y: '#c9a640', p: '#e85a9c', P: '#a83470', e: '#4caf50', E: '#2e7d32', W: '#ffffff', r: '#e53935' };
function mkSprite(rows, pal = PAL) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((row, j) => { [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }); });
  return c;
}
function flipC(c) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; }
function whiteC(c) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return f; }

const SPR = {};
SPR.gu = mkSprite([
  '..w..........w..',
  '..ww.kkkkkk.ww..',
  '...wkggggggkw...',
  '....kGGGGGGk....',
  '....kssssssk....',
  '....kskssksk....',
  '....khsssshk....',
  '...khhhhhhhhk...',
  '..kbbkhhhhkbbk..',
  '.kbbbbkhhkbbbbk.',
  '.ksbbbbbbbbbbsk.',
  '.kskNNNNNNNNksk.',
  '..kkBBBBBBBBkk..',
  '...kBBBkkBBBk...',
  '...knnnk.knnnk..',
  '...kkkkk.kkkkk..']);
SPR.de = mkSprite([
  '................',
  '.....kkkkkk.....',
  '....kyyyyyyk....',
  '...kyyyyyyyyk...',
  '..kyyssssssyyk..',
  '.skyskssssksyks.',
  '..kysssppsssyk..',
  '..kyyksssskyyk..',
  '.kyypkeeeekpyyk.',
  '.kyppeeeeeeppyk.',
  '.kppseeeeeespPk.',
  '.kpPkNNNNNNkpPk.',
  '..kPPEEEEEEPPk..',
  '...kPEEkkEEPk...',
  '....knnk.knnk...',
  '....kkkk.kkkk...']);
SPR.slime = mkSprite([
  '................', '................', '................', '................', '................', '................',
  '......kkkk......',
  '....kkeeeekk....',
  '...keeeeeeeek...',
  '..keeWeeeeWeek..',
  '..keekeeeekeek..',
  '.keeeeeeeeeeeek.',
  '.keEEEEEEEEEEek.',
  '.kEEEEEEEEEEEEk.',
  '..kkkkkkkkkkkk..',
  '................']);
SPR.skel = mkSprite([
  '................',
  '.....kkkkkk.....',
  '....kWWWWWWk....',
  '...kWWWWWWWWk...',
  '...kWkkWWkkWk...',
  '...kWkrWWkrWk...',
  '...kWWWkkWWWk...',
  '....kWkWkWkk....',
  '.....kkkkkk.....',
  '...kkWkWWkWkk...',
  '..kW.kWWWWk.Wk..',
  '..kW.kWkkWk.Wk..',
  '.....kWWWWk.....',
  '.....kWkkWk.....',
  '.....kWk.kWk....',
  '....kkkk.kkkk...']);
SPR.heart = mkSprite(['.kk.kk.', 'krrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...']);
SPR.heartE = mkSprite(['.kk.kk.', 'k..k..k', 'k.....k', '.k...k.', '..k.k..', '...k...']);
for (const k of ['gu', 'de', 'slime', 'skel']) { SPR[k + 'L'] = flipC(SPR[k]); SPR[k + 'W'] = whiteC(SPR[k]); }

// ---------------- tiles ----------------
function tileCanvas(draw, w = TS, h = TS) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); return c; }
function px(g, x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
function specks(g, r, n, col, w = 16, h = 16) { for (let i = 0; i < n; i++) px(g, (r() * w) | 0, (r() * h) | 0, col); }
function disc(g, cx, cy, rad, col) { g.fillStyle = col; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.6) g.fillRect(cx + x, cy + y, 1, 1); }
const TR = mulberry(7);
const T = {};
function grassBase(g) { g.fillStyle = '#5aa83c'; g.fillRect(0, 0, 16, 16); specks(g, TR, 9, '#4c9432'); specks(g, TR, 5, '#6cbf4a'); }
T.grass = [0, 1, 2].map(() => tileCanvas(grassBase));
T.flower = [0, 1].map(() => tileCanvas(g => { grassBase(g); const cols = ['#ffffff', '#ffeb3b', '#f48fb1', '#90caf9']; for (let i = 0; i < 3; i++) { const x = 2 + (TR() * 12) | 0, y = 2 + (TR() * 12) | 0, c = cols[(TR() * 4) | 0]; px(g, x, y - 1, c); px(g, x - 1, y, c); px(g, x + 1, y, c); px(g, x, y + 1, c); px(g, x, y, '#ffd54f'); } }));
T.path = [0, 1].map(() => tileCanvas(g => { g.fillStyle = '#c9a66b'; g.fillRect(0, 0, 16, 16); specks(g, TR, 10, '#b48f55'); specks(g, TR, 4, '#dcbd85'); }));
T.floor = tileCanvas(g => { g.fillStyle = '#9a9aa8'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#82828f'; g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 8); specks(g, TR, 6, '#8a8a97'); specks(g, TR, 4, '#acacb9'); });
T.wall = tileCanvas(g => { g.fillStyle = '#6b6b7b'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#4a4a58'; for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); for (let r = 0; r < 4; r++) { const o = r % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) g.fillRect(x, r * 4, 1, 3); } g.fillStyle = '#85859a'; g.fillRect(0, 0, 16, 1); specks(g, TR, 5, '#5c5c6b'); });
T.tree = [0, 1].map(v => tileCanvas(g => { grassBase(g); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(3, 13, 10, 3); g.fillStyle = '#6d4424'; g.fillRect(6, 10, 4, 5); disc(g, 8, 7, 7, '#1f5e24'); disc(g, 8, 6, 6, v ? '#2e7d32' : '#33873a'); disc(g, 6, 4, 3, '#43a047'); px(g, 5, 3, '#66bb6a'); specks(g, TR, 4, '#1f5e24', 14, 12); }));
T.water = [0, 1, 2, 3].map(f => tileCanvas(g => { g.fillStyle = '#2f6fc6'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#5b95e0'; for (const [y, o] of [[3, 0], [8, 6], [13, 11]]) { const x = (o + f * 2) % 16; g.fillRect(x, y, 4, 1); g.fillRect((x + 8) % 16, y + 1, 3, 1); } }));
T.bridge = tileCanvas(g => { g.fillStyle = '#2f6fc6'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#a0703c'; g.fillRect(0, 2, 16, 12); g.fillStyle = '#7a5228'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 2, 1, 12); g.fillRect(0, 2, 16, 1); g.fillRect(0, 13, 16, 1); });
T.rock = tileCanvas(g => { grassBase(g); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 12, 13, 3); disc(g, 8, 8, 6, '#5d5d68'); disc(g, 8, 8, 5, '#8d8d99'); disc(g, 6, 6, 2, '#a9a9b5'); g.fillStyle = '#33333d'; g.fillRect(8, 4, 1, 3); g.fillRect(9, 7, 1, 2); g.fillRect(8, 9, 1, 3); g.fillRect(10, 8, 2, 1); });
T.crystal = [0, 1].map(on => tileCanvas(g => { grassBase(g); g.fillStyle = '#6b6b7b'; g.fillRect(4, 12, 8, 4); g.fillStyle = '#85859a'; g.fillRect(4, 12, 8, 1); const c1 = on ? '#b2ffff' : '#2a7f8a', c2 = on ? '#4dd0e1' : '#1f5f68'; for (let y = 0; y < 11; y++) { const w = y < 5 ? y : 10 - y; g.fillStyle = y < 5 ? c1 : c2; g.fillRect(8 - w, 1 + y, w * 2 + 1, 1); } if (on) { px(g, 7, 3, '#fff'); px(g, 7, 4, '#fff'); } }));
T.plate = [0, 1].map(on => tileCanvas(g => { const r = mulberry(3); g.fillStyle = '#c9a66b'; g.fillRect(0, 0, 16, 16); specks(g, r, 8, '#b48f55'); g.fillStyle = '#5d5d68'; g.fillRect(1, 1, 14, 14); g.fillStyle = on ? '#ffd54f' : '#8a8a96'; g.fillRect(3, 3, 10, 10); g.fillStyle = on ? '#fff59d' : '#a0a0ac'; g.fillRect(3, 3, 10, 1); g.fillStyle = on ? '#f9a825' : '#6d6d78'; g.fillRect(6, 6, 4, 4); }));
T.gate = tileCanvas(g => { g.fillStyle = '#9a9aa8'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#20202a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#a7a7b3'; for (let x = 1; x < 16; x += 4) g.fillRect(x, 0, 2, 16); g.fillRect(0, 3, 16, 2); g.fillRect(0, 11, 16, 2); g.fillStyle = '#d4d4de'; for (let x = 1; x < 16; x += 4) px(g, x, 0, '#d4d4de'); });
T.sign = tileCanvas(g => { grassBase(g); g.fillStyle = '#6d4424'; g.fillRect(7, 9, 2, 7); g.fillStyle = '#4f2e18'; g.fillRect(2, 2, 12, 8); g.fillStyle = '#b5834a'; g.fillRect(3, 3, 10, 6); g.fillStyle = '#7a5228'; g.fillRect(4, 4, 8, 1); g.fillRect(4, 6, 6, 1); });
T.altar = tileCanvas(g => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 13, 30, 3); g.fillStyle = '#7d7d8a'; g.fillRect(3, 5, 26, 10); g.fillStyle = '#9e9eab'; g.fillRect(4, 6, 24, 8); g.fillStyle = '#c5c5d2'; g.fillRect(1, 2, 30, 4); g.fillStyle = '#e0e0ea'; g.fillRect(1, 2, 30, 1); g.fillStyle = '#4a4a58'; for (const x of [8, 16, 24]) g.fillRect(x - 2, 3, 4, 2); g.fillStyle = '#ffd54f'; g.fillRect(14, 9, 4, 1); g.fillRect(15, 8, 2, 3); }, 32, 16);

// ---------------- mapa ----------------
const M = []; for (let y = 0; y < H; y++) M.push(Array(W).fill('.'));
function set(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) M[y][x] = c; }
function rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c); }
function outline(x, y, w, h, c) { for (let i = x; i < x + w; i++) { set(i, y, c); set(i, y + h - 1, c); } for (let j = y; j < y + h; j++) { set(x, j, c); set(x + w - 1, j, c); } }
(function buildMap() {
  const r = mulberry(2026);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (r() < 0.06) M[y][x] = ',';
  rect(0, 0, W, 2, 'T'); rect(0, H - 2, W, 2, 'T'); rect(0, 0, 2, H, 'T'); rect(W - 2, 0, 2, H, 'T');
  // praca das torres
  outline(12, 2, 24, 12, '#'); rect(13, 3, 22, 10, '_');
  set(23, 13, 'H'); set(24, 13, 'H');
  rect(15, 3, 5, 6, 'X'); set(17, 8, 'D');
  rect(28, 3, 5, 6, 'X'); set(30, 8, 'E');
  // caminhos
  rect(23, 14, 2, 23, ':');
  rect(19, 16, 10, 6, ':');
  set(23, 18, 'A'); set(24, 18, 'A');
  rect(5, 22, 29, 2, ':');
  // oeste: bosque fechado (reliquia 1)
  outline(2, 14, 8, 7, 'T'); rect(3, 15, 6, 5, '.');
  set(5, 20, 'R'); set(6, 20, 'R'); rect(5, 21, 2, 1, ':');
  set(8, 21, 'I');
  // leste: lago e ilha (reliquia 2)
  rect(34, 14, 12, 15, '~'); rect(39, 19, 5, 7, '.');
  set(39, 22, 'C'); rect(34, 23, 5, 1, 'b');
  set(32, 21, 'I');
  // sudeste: ruinas (reliquia 3)
  rect(25, 29, 12, 2, ':');
  outline(30, 31, 13, 7, '#'); rect(31, 32, 11, 5, '_');
  set(36, 31, 'G'); set(28, 29, 'P'); set(27, 28, 'I');
  // arvores aleatorias
  const keep = [[3, 15, 6, 5], [39, 19, 5, 7], [19, 29, 10, 9], [18, 15, 12, 8], [8, 24, 8, 8], [12, 26, 10, 9], [36, 3, 9, 10]];
  const inKeep = (x, y) => keep.some(([a, b, w, h]) => x >= a && x < a + w && y >= b && y < b + h);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (!'.,'.includes(M[y][x]) || inKeep(x, y) || r() > 0.11) continue;
    let ok = true;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!'.,T'.includes(M[y + j][x + i])) ok = false;
    if (ok) M[y][x] = 'T';
  }
  // algumas arvores decorativas no canto nordeste
  for (const [x, y] of [[38, 4], [42, 6], [40, 10], [44, 3]]) set(x, y, 'T');
})();

const SIGNS = {
  '8,21': ['Pedras rachadas bloqueiam o bosque...', 'Dizem que só o machado de um viking consegue quebrá-las.'],
  '32,21': ['Um cristal antigo brilha na ilha do lago.', 'Só uma flecha élfica alcança tão longe. Mirem para a direita!'],
  '27,28': ['A placa antiga abre o portão das ruínas...', '...mas só enquanto alguém estiver em cima dela. Quem fica, espera!'],
};

// ---------------- estado ----------------
const RELIC_NAMES = ['a Runa de Odin', 'a Lágrima Élfica', 'o Cálice dos Reis'];
const RELIC_COL = ['#ffd54f', '#4dd0e1', '#ce93d8'];
let state = 'title', paused = false, time = 0;
const cam = { x: 0, y: 0 };
let shakeT = 0, fade = 0, fadeCol = '0,0,0', toast = null;
let hearts = 5; const MAXH = 5; let inv = 0;
const heroes = [
  { name: 'GU', key: 'gu', x: 23 * TS, y: 34 * TS, fx: 0, fy: -1, face: 1, walk: 0, atk: 0, cd: 0, anchored: false, kb: null },
  { name: 'DE', key: 'de', x: 24 * TS, y: 35 * TS, fx: 0, fy: -1, face: 1, walk: 0, atk: 0, cd: 0, anchored: false, kb: null },
];
let lead = 0; let trail = [];
const relics = [
  { id: 0, x: 5 * TS + 8, y: 16 * TS + 8, taken: false },
  { id: 1, x: 41 * TS + 8, y: 22 * TS + 8, taken: false },
  { id: 2, x: 36 * TS + 8, y: 35 * TS + 8, taken: false },
];
let relicCount = 0, altarPlaced = false, plazaOpen = false, crystalOn = false, plateDown = false;
let suspense = null, doorOpen = false, revealT = 0;
const rockHits = {};
const enemies = [], arrows = [], parts = [], drops = [], timers = [];
let fireworks = [];
const hinted = {};
let signNear = null, altarMsgCD = 0, plazaMsgCD = 0, inputLock = 0;

function spawn(type, tx, ty) { enemies.push({ type, x: tx * TS, y: ty * TS, hp: type === 'skel' ? 3 : 2, t: rnd(), dx: 0, dy: 0, flash: 0, kb: null, face: 1 }); }
[[11, 26], [13, 18], [9, 31], [15, 34], [30, 18], [28, 25], [42, 34 - 1]].forEach(([x, y], i) => spawn(i === 6 ? 'skel' : 'slime', x, y));
spawn('skel', 33, 34); spawn('skel', 39, 33); spawn('skel', 41, 9);
// garante que inimigos nao nasçam dentro de algo solido
for (const e of enemies) { if (blocked(e)) { M[Math.floor((e.y + 12) / TS)][Math.floor((e.x + 8) / TS)] = '.'; } }

function later(t, fn) { timers.push({ t, fn }); }
function showToast(s, t = 2.5) { toast = { s, t }; }

// ---------------- colisao ----------------
function solidAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
  switch (M[ty][tx]) {
    case 'T': case '~': case 'b': case '#': case 'R': case 'C': case 'X': case 'D': case 'E': case 'A': case 'I': case 'H': return true;
    case 'G': return !ruinGateOpen();
    default: return false;
  }
}
function hb(e) { return { x: e.x + 3, y: e.y + 9, w: 10, h: 6 }; }
function blocked(e) {
  const b = hb(e);
  const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS), y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solidAt(x, y)) return true;
  return false;
}
function tryMove(e, dx, dy) {
  let moved = false;
  for (const [ax, ay] of [[dx, 0], [0, dy]]) {
    if (!ax && !ay) continue;
    e.x += ax; e.y += ay;
    if (!blocked(e)) { moved = true; continue; }
    e.x -= ax; e.y -= ay;
    // desliza nas quinas
    for (let o = 1; o <= 6; o++) {
      let done = false;
      for (const s of [-1, 1]) {
        const px_ = ay ? s * o : 0, py_ = ax ? s * o : 0;
        e.x += px_ + ax; e.y += py_ + ay; const ok = !blocked(e); e.x -= px_ + ax; e.y -= py_ + ay;
        if (ok) { const sx = ay ? s : 0, sy = ax ? s : 0; e.x += sx; e.y += sy; if (blocked(e)) { e.x -= sx; e.y -= sy; } else moved = true; done = true; break; }
      }
      if (done) break;
    }
  }
  return moved;
}
function heroOnTile(h, tx, ty) { const b = hb(h); const cx = b.x + b.w / 2, cy = b.y + b.h / 2; return Math.floor(cx / TS) === tx && Math.floor(cy / TS) === ty; }
function ruinGateOpen() {
  if (relics[2].taken || plateDown) return true;
  const g = { x: 36 * TS, y: 31 * TS, w: TS, h: TS };
  return heroes.some(h => overlap(hb(h), g));
}

// ---------------- input ----------------
const keys = {}, latch = {};
addEventListener('keydown', e => { keys[e.code] = true; if (!e.repeat) latch[e.code] = true; if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); audioInit(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('mousedown', audioInit);
addEventListener('gamepadconnected', e => showToast('Controle conectado!'));
const prev = {}; const inp = { mx: 0, my: 0 };
function readInput() {
  let mx = 0, my = 0, atk = false, sw = false, st = false;
  const K = c => keys[c] || latch[c];
  if (keys.ArrowLeft || keys.KeyA) mx -= 1; if (keys.ArrowRight || keys.KeyD) mx += 1;
  if (keys.ArrowUp || keys.KeyW) my -= 1; if (keys.ArrowDown || keys.KeyS) my += 1;
  atk = K('Space') || K('KeyJ') || K('KeyZ'); sw = K('KeyQ') || K('Tab') || K('KeyX') || K('ShiftLeft') || K('KeyK'); st = K('Enter') || K('Escape');
  for (const k in latch) delete latch[k];
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (Math.abs(ax) > 0.4) mx += Math.sign(ax); if (Math.abs(ay) > 0.4) my += Math.sign(ay);
    const B = i => gp.buttons[i] && gp.buttons[i].pressed;
    if (B(14)) mx -= 1; if (B(15)) mx += 1; if (B(12)) my -= 1; if (B(13)) my += 1;
    if (B(0) || B(1)) atk = true;
    if (B(2) || B(3) || B(4) || B(5)) sw = true;
    if (B(9) || B(8)) st = true;
    if (B(0) || B(1) || B(9)) audioInit();
  }
  inp.mx = clamp(mx, -1, 1); inp.my = clamp(my, -1, 1);
  inp.atkP = atk && !prev.atk; inp.swP = sw && !prev.sw; inp.stP = st && !prev.st;
  prev.atk = atk; prev.sw = sw; prev.st = st;
}

// ---------------- audio ----------------
let AC = null, master = null;
function audioInit() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, dur, type = 'square', vol = 0.12, when = 0, slide = 0) {
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(dur, vol = 0.2, when = 0, freq = 1000) {
  if (!AC || AC.state !== 'running') return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + when, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
const SFX = {
  swing: () => noise(0.12, 0.25, 0, 2500),
  arrow: () => tone(1100, 0.15, 'triangle', 0.12, 0, 0.4),
  hit: () => { tone(260, 0.1, 'square', 0.14, 0, 0.5); noise(0.08, 0.2, 0, 800); },
  tink: () => tone(1800, 0.08, 'square', 0.06),
  kill: () => { tone(500, 0.2, 'square', 0.1, 0, 0.2); noise(0.2, 0.15, 0, 600); },
  break: () => { noise(0.35, 0.4, 0, 300); tone(90, 0.3, 'sawtooth', 0.12, 0, 0.5); },
  hurt: () => tone(320, 0.3, 'sawtooth', 0.14, 0, 0.3),
  heart: () => [660, 880].forEach((f, i) => tone(f, 0.1, 'square', 0.08, i * 0.06)),
  relic: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.09, i * 0.09)),
  chime: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.5, 'triangle', 0.12, i * 0.12)),
  door: () => { tone(70, 1.0, 'sawtooth', 0.18, 0, 0.6); noise(0.9, 0.3, 0, 150); },
  tick: f => tone(f, 0.07, 'square', 0.1),
  sw: () => tone(700, 0.06, 'square', 0.07),
  pop: () => { noise(0.35, 0.22, 0, 900); tone(200, 0.2, 'triangle', 0.08, 0, 0.3); },
  launch: () => tone(300, 0.4, 'triangle', 0.04, 0, 3),
  text: () => tone(1200, 0.02, 'square', 0.025),
};
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  explore: { bpm: 128, mel: [69, 0, 72, 76, 74, 72, 71, 72, 69, 0, 0, 67, 69, 71, 72, 0, 76, 0, 79, 77, 76, 74, 72, 74, 76, 0, 71, 0, 69, 0, 0, 0, 72, 0, 74, 76, 77, 76, 74, 72, 71, 0, 67, 0, 71, 72, 74, 0, 72, 71, 69, 71, 72, 74, 76, 0, 74, 0, 71, 0, 69, 0, 0, 0], bass: [45, 0, 52, 0, 45, 0, 52, 0, 41, 0, 48, 0, 43, 0, 50, 0, 48, 0, 55, 0, 43, 0, 50, 0, 40, 0, 47, 0, 45, 0, 52, 0, 41, 0, 48, 0, 41, 0, 48, 0, 43, 0, 50, 0, 43, 0, 50, 0, 45, 0, 52, 0, 48, 0, 55, 0, 40, 0, 47, 0, 45, 0, 45, 0] },
  reveal: { bpm: 140, mel: [72, 76, 79, 84, 79, 76, 79, 0, 77, 81, 84, 81, 79, 0, 0, 0, 76, 79, 84, 88, 86, 84, 83, 84, 79, 0, 76, 0, 72, 0, 0, 0], bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 57, 0, 55, 0, 59, 0, 48, 0, 55, 0, 52, 0, 55, 0, 43, 0, 47, 0, 48, 0, 48, 0] },
};
let song = null, songStep = 0, songNext = 0;
function playSong(name) { song = name ? SONGS[name] : null; songStep = 0; songNext = AC ? AC.currentTime + 0.1 : 0; }
function updateMusic() {
  if (!song || !AC || AC.state !== 'running') return;
  const step = 60 / song.bpm / 2;
  if (songNext < AC.currentTime) songNext = AC.currentTime + 0.05;
  while (songNext < AC.currentTime + 0.2) {
    const i = songStep % song.mel.length, m = song.mel[i], b = song.bass[i % song.bass.length], w = songNext - AC.currentTime;
    if (m) tone(midi(m), step * 0.9, 'square', 0.035, w);
    if (b) tone(midi(b), step * 1.6, 'triangle', 0.09, w);
    songStep++; songNext += step;
  }
}

// ---------------- dialogo ----------------
let dlg = null;
function say(lines, onDone) {
  if (typeof lines === 'string') lines = [lines];
  if (dlg) { dlg.lines.push(...lines); if (onDone) { const p = dlg.onDone; dlg.onDone = () => { p && p(); onDone(); }; } }
  else dlg = { lines: lines.slice(), i: 0, t: 0, onDone };
}
function updateDialog(dt) {
  const len = dlg.lines[dlg.i].length, before = Math.floor(dlg.t * 45);
  dlg.t += dt; const now = Math.floor(dlg.t * 45);
  if (now > before && before < len && now % 3 === 0) SFX.text();
  if (inp.atkP || inp.stP) {
    if (dlg.t * 45 < len) dlg.t = 999;
    else { dlg.i++; dlg.t = 0; if (dlg.i >= dlg.lines.length) { const f = dlg.onDone; dlg = null; inputLock = 0.2; f && f(); } }
  }
}

// ---------------- particulas ----------------
function burst(x, y, n, cols, spd = 60, life = 0.5, g = 0, size = 1) {
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, s = spd * (0.3 + rnd() * 0.7); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + rnd() * 0.6), max: life, col: cols[(rnd() * cols.length) | 0], g, size }); }
}
function updateParts(arr, dt) {
  for (let i = arr.length - 1; i >= 0; i--) { const p = arr[i]; p.life -= dt; if (p.life <= 0) { arr.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; }
}

// ---------------- jogo ----------------
function L() { return heroes[lead]; }
function F() { return heroes[1 - lead]; }
function center(e) { return { x: e.x + 8, y: e.y + 10 }; }

function switchHero() {
  const old = L();
  old.anchored = M[Math.floor((old.y + 12) / TS)][Math.floor((old.x + 8) / TS)] === 'P';
  lead = 1 - lead; L().anchored = false; trail = [];
  const n = L(), o = F();
  if (!o.anchored && dist(n.x, n.y, o.x, o.y) > 140) { burst(o.x + 8, o.y + 8, 10, ['#fff', '#ffd54f']); o.x = n.x; o.y = n.y; }
  SFX.sw(); burst(n.x + 8, n.y + 4, 8, ['#fff', n.key === 'gu' ? '#90caf9' : '#f48fb1'], 40, 0.4);
  if (o.anchored) showToast((o.name === 'GU' ? 'Gu' : 'De') + ' ficou esperando na placa');
}

function hurtHero(src) {
  if (inv > 0) return;
  hearts--; inv = 1.2; SFX.hurt(); shakeT = 0.2;
  const h = L(), c = center(h), s = center(src); const a = Math.atan2(c.y - s.y, c.x - s.x);
  h.kb = { vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, t: 0.15 };
  if (hearts <= 0) { state = 'faint'; fade = 0; fadeCol = '0,0,0'; later(1.6, respawn); }
}
function respawn() {
  hearts = MAXH; inv = 1.5;
  heroes[0].x = 23 * TS; heroes[0].y = 20 * TS; heroes[1].x = 24 * TS; heroes[1].y = 20 * TS; heroes.forEach(h => { h.anchored = false; h.kb = null; }); trail = [];
  state = 'play'; fade = 1;
  say('Gu e De descansaram um pouquinho... e voltaram com tudo!');
}

function damageEnemy(e, from, dmg = 1) {
  e.hp -= dmg; e.flash = 0.15; SFX.hit();
  const c = center(e), s = from; const a = Math.atan2(c.y - s.y, c.x - s.x);
  e.kb = { vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, t: 0.15 };
  burst(c.x, c.y, 5, ['#fff', '#ffeb3b'], 50, 0.25);
  if (e.hp <= 0) {
    e.dead = true; SFX.kill(); burst(c.x, c.y, 16, e.type === 'slime' ? ['#4caf50', '#81c784', '#fff'] : ['#fff', '#cfd8dc', '#90a4ae'], 70, 0.5);
    if (hearts < MAXH && rnd() < 0.5) drops.push({ x: c.x - 4, y: c.y - 4, t: 0 });
  }
}

function axeHit(h) {
  const c = center(h); const box = { x: c.x + h.fx * 12 - 9, y: c.y + h.fy * 12 - 9, w: 18, h: 18 };
  let any = false;
  for (const e of enemies) if (!e.dead && overlap(box, { x: e.x + 2, y: e.y + 6, w: 12, h: 10 })) { damageEnemy(e, c); any = true; }
  const tx0 = Math.floor(box.x / TS), tx1 = Math.floor((box.x + box.w) / TS), ty0 = Math.floor(box.y / TS), ty1 = Math.floor((box.y + box.h) / TS);
  let rockDone = false;
  for (let ty = ty0; ty <= ty1 && !rockDone; ty++) for (let tx = tx0; tx <= tx1 && !rockDone; tx++) {
    if (M[ty] && M[ty][tx] === 'R') {
      const k = tx + ',' + ty; rockHits[k] = (rockHits[k] || 0) + 1; rockDone = true; shakeT = 0.1;
      if (rockHits[k] >= 2) { M[ty][tx] = ':'; SFX.break(); burst(tx * TS + 8, ty * TS + 8, 18, ['#8d8d99', '#5d5d68', '#a9a9b5'], 80, 0.6, 120); }
      else { SFX.tink(); burst(tx * TS + 8, ty * TS + 8, 6, ['#fff', '#a9a9b5'], 50, 0.3); }
    }
  }
  if (!any && !rockDone) SFX.swing();
}

function shootArrow(h) {
  const c = center(h); SFX.arrow();
  let fx = h.fx, fy = h.fy; if (!fx && !fy) fx = h.face;
  arrows.push({ x: c.x, y: c.y - 2, vx: fx * 200, vy: fy * 200, t: 0.75 });
}

function updateArrows(dt) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i]; a.t -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
    let dead = a.t <= 0;
    // cristal
    const ccx = 39 * TS + 8, ccy = 22 * TS + 8;
    if (!dead && !crystalOn && Math.abs(a.x - ccx) < 9 && Math.abs(a.y - ccy) < 20) { activateCrystal(); dead = true; }
    if (!dead) for (const e of enemies) if (!e.dead && overlap({ x: a.x - 3, y: a.y - 3, w: 6, h: 6 }, { x: e.x + 2, y: e.y + 4, w: 12, h: 12 })) { damageEnemy(e, { x: a.x - a.vx, y: a.y - a.vy }); dead = true; break; }
    if (!dead) {
      const tx = Math.floor(a.x / TS), ty = Math.floor(a.y / TS); const ch = M[ty] && M[ty][tx];
      if (ch && !'~b=._:,PdeG'.includes(ch) && solidAt(tx, ty)) {
        dead = true; SFX.tink(); burst(a.x, a.y, 4, ['#fff', '#bcaaa4'], 40, 0.2);
        if (ch === 'R' && !hinted.rockArrow) { hinted.rockArrow = 1; say('As flechas de De não quebram pedra... Troquem para o Gu! (botão Y ou X)'); }
      }
    }
    if (dead) arrows.splice(i, 1);
  }
}

function activateCrystal() {
  crystalOn = true; M[22][39] = 'C'; SFX.chime(); shakeT = 0.3;
  burst(39 * TS + 8, 22 * TS + 6, 30, ['#b2ffff', '#4dd0e1', '#fff'], 90, 0.8);
  for (let i = 0; i < 5; i++) later(0.4 + i * 0.18, () => { const x = 38 - i; M[23][x] = '='; SFX.tick(400 + i * 80); burst(x * TS + 8, 23 * TS + 8, 8, ['#a0703c', '#fff', '#5b95e0'], 50, 0.4); });
  later(1.5, () => say('O cristal brilhou! Uma ponte surgiu sobre o lago!'));
}

function updateHeroes(dt) {
  const h = L();
  if (h.kb) { tryMove(h, h.kb.vx * dt, 0); tryMove(h, 0, h.kb.vy * dt); h.kb.t -= dt; if (h.kb.t <= 0) h.kb = null; }
  let mx = inp.mx, my = inp.my;
  if (inputLock > 0) { mx = 0; my = 0; }
  if (mx || my) {
    const n = Math.hypot(mx, my), sp = 74 * dt;
    if (Math.abs(mx) >= Math.abs(my)) { h.fx = Math.sign(mx); h.fy = 0; } else { h.fy = Math.sign(my); h.fx = 0; }
    if (mx) h.face = Math.sign(mx);
    const ox = h.x, oy = h.y;
    tryMove(h, mx / n * sp, my / n * sp);
    if (h.x !== ox || h.y !== oy) { h.walk += dt; trail.push({ x: h.x, y: h.y, face: h.face }); if (trail.length > 80) trail.shift(); }
  } else h.walk = 0;
  h.cd -= dt; h.atk -= dt;
  if (inp.atkP && inputLock <= 0 && h.cd <= 0) {
    if (h.key === 'gu') { h.atk = 0.22; h.cd = 0.32; axeHit(h); }
    else { h.atk = 0.18; h.cd = 0.38; shootArrow(h); }
  }
  if (inp.swP && inputLock <= 0) switchHero();
  // seguidor
  const f = F();
  if (!f.anchored) {
    const LAG = 16;
    if (trail.length > LAG) {
      const p = trail[trail.length - 1 - LAG];
      const d = dist(f.x, f.y, p.x, p.y);
      if (d > 0.5) { const sp = Math.min(d, 130 * dt); f.x += (p.x - f.x) / d * sp; f.y += (p.y - f.y) / d * sp; f.walk += dt; f.face = p.face; } else f.walk = 0;
    } else f.walk = 0;
    if (dist(f.x, f.y, h.x, h.y) > 160) { f.x = h.x; f.y = h.y; trail = []; }
  } else f.walk = 0;
  // placa
  plateDown = heroes.some(x => heroOnTile(x, 28, 29));
}

function updateEnemies(dt) {
  const h = L(), hc = center(h);
  for (const e of enemies) {
    if (e.dead) continue;
    const ec = center(e);
    if (Math.abs(ec.x - (cam.x + VW / 2)) > 260 || Math.abs(ec.y - (cam.y + VH / 2)) > 180) continue;
    e.flash -= dt;
    if (e.kb) { tryMove(e, e.kb.vx * dt, 0); tryMove(e, 0, e.kb.vy * dt); e.kb.t -= dt; if (e.kb.t <= 0) e.kb = null; continue; }
    e.t -= dt;
    const d = dist(ec.x, ec.y, hc.x, hc.y);
    if (e.type === 'skel' && d < 95) { e.dx = (hc.x - ec.x) / d; e.dy = (hc.y - ec.y) / d; }
    else if (e.t <= 0) { e.t = 0.8 + rnd() * 1.4; if (rnd() < 0.3) { e.dx = 0; e.dy = 0; } else { const a = rnd() * Math.PI * 2; e.dx = Math.cos(a); e.dy = Math.sin(a); } }
    const sp = (e.type === 'skel' ? 30 : 20) * dt;
    if (e.dx) e.face = Math.sign(e.dx);
    tryMove(e, e.dx * sp, e.dy * sp);
    if (overlap(hb(h), { x: e.x + 3, y: e.y + 7, w: 10, h: 8 })) hurtHero(e);
  }
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
}

function updatePickups(dt) {
  const h = L(), b = hb(h);
  for (const r of relics) {
    if (r.taken) continue;
    if (overlap(b, { x: r.x - 9, y: r.y - 7, w: 18, h: 16 })) {
      r.taken = true; relicCount++; SFX.relic(); shakeT = 0.15;
      burst(r.x, r.y, 26, [RELIC_COL[r.id], '#fff', '#ffd54f'], 80, 0.8);
      const msg = ['Vocês encontraram ' + RELIC_NAMES[r.id] + '! (' + relicCount + '/3)'];
      if (relicCount === 3) msg.push('As três relíquias estão reunidas! Levem-nas ao altar no centro do reino.');
      say(msg);
    }
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.t += dt;
    if (overlap(b, { x: d.x, y: d.y, w: 8, h: 8 })) { hearts = Math.min(MAXH, hearts + 1); SFX.heart(); drops.splice(i, 1); }
    else if (d.t > 12) drops.splice(i, 1);
  }
}

function updateTriggers(dt) {
  const h = L(), c = center(h);
  altarMsgCD -= dt; plazaMsgCD -= dt;
  // placas de aviso
  let near = null;
  for (const k in SIGNS) { const [sx, sy] = k.split(',').map(Number); if (dist(c.x, c.y, sx * TS + 8, sy * TS + 8) < 22) near = k; }
  if (near && near !== signNear) say(SIGNS[near]);
  signNear = near;
  // altar
  if (!altarPlaced && dist(c.x, c.y, 24 * TS, 18 * TS + 8) < 26) {
    if (relicCount === 3) {
      altarPlaced = true; SFX.chime(); shakeT = 0.4;
      burst(24 * TS, 18 * TS, 40, RELIC_COL.concat(['#fff']), 100, 1);
      say(['As três relíquias brilham sobre o altar...', 'Um estrondo ecoa! O grande portão ao norte se abriu!'], () => {
        set(23, 13, '_'); set(24, 13, '_'); SFX.door(); shakeT = 0.6; burst(24 * TS, 13 * TS + 8, 30, ['#9a9aa8', '#fff'], 80, 0.7, 60);
      });
    } else if (altarMsgCD <= 0) {
      altarMsgCD = 6; say('Um altar antigo com 3 encaixes vazios... (' + relicCount + '/3 relíquias)');
    }
  }
  plazaOpen = M[13][23] === '_';
  // entrada na praca das torres
  if (plazaOpen && !suspense && c.y < 13 * TS - 2) {
    if (RESULT === null) {
      if (plazaMsgCD <= 0) { plazaMsgCD = 8; say(['As torres aguardam em silêncio...', 'O Oráculo ainda não revelou o segredo. (Falta o arquivo segredo.js na pasta do jogo.)']); }
    } else startSuspense();
  }
  // porta aberta
  if (doorOpen) {
    const dx = RESULT === 0 ? 17 : 30;
    if (overlap(hb(h), { x: dx * TS + 2, y: 8 * TS, w: 12, h: 18 })) startReveal();
  }
}

function startSuspense() {
  suspense = { t: 0, times: [], i: 0, hl: -1, opened: false };
  let t = 1.0, iv = 0.08;
  while (iv < 0.6) { suspense.times.push(t); t += iv; iv *= 1.12; }
  if ((suspense.times.length - 1) % 2 !== RESULT) { suspense.times.push(t); t += iv; }
  suspense.end = t + 0.9;
  state = 'suspense'; playSong(null); trail = [];
  showToast('As duas torres começam a brilhar...', 5);
}
function updateSuspense(dt) {
  const s = suspense; s.t += dt;
  cam.x += ((24 * TS - VW / 2) - cam.x) * Math.min(1, dt * 3); cam.y += (0 - cam.y) * Math.min(1, dt * 3);
  while (s.i < s.times.length && s.t >= s.times[s.i]) { s.hl = s.i % 2; SFX.tick(s.hl ? 784 : 523); s.i++; }
  if (!s.opened && s.t >= s.end) {
    s.opened = true; doorOpen = true; M[8][RESULT === 0 ? 17 : 30] = RESULT === 0 ? 'd' : 'e';
    SFX.door(); shakeT = 0.8;
    const x = (RESULT === 0 ? 17 : 30) * TS + 8;
    burst(x, 8 * TS + 6, 50, RESULT === 0 ? ['#64b5f6', '#fff', '#ffd54f'] : ['#f48fb1', '#fff', '#ffd54f'], 110, 1.1);
  }
  if (s.opened && s.t >= s.end + 1.8) { state = 'play'; playSong('explore'); say('Uma das torres se abriu! Entrem nela...'); }
}

function startReveal() {
  state = 'reveal'; revealT = 0; playSong(null); fade = 1; fadeCol = '255,255,255'; fireworks = [];
  SFX.door();
  later(0.8, () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.35, 'square', 0.1, i * 0.12)); });
  later(2.0, () => playSong('reveal'));
}
function updateReveal(dt) {
  revealT += dt;
  if (rnd() < dt * (revealT < 6 ? 3.2 : 2)) {
    const cols = RESULT === 0 ? ['#64b5f6', '#90caf9', '#1e88e5', '#ffffff', '#ffd54f'] : ['#f48fb1', '#f06292', '#ec407a', '#ffffff', '#ffd54f'];
    fireworks.push({ x: 30 + rnd() * (VW - 60), y: VH, vy: -130 - rnd() * 50, ty: 25 + rnd() * 70, col: cols[(rnd() * cols.length) | 0], cols, rocket: true });
    SFX.launch();
  }
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const f = fireworks[i];
    if (f.rocket) {
      f.y += f.vy * dt; if (rnd() < 0.6) parts.push({ x: f.x, y: f.y + 2, vx: 0, vy: 10, life: 0.3, max: 0.3, col: '#ffe082', g: 0, size: 1, sky: true });
      if (f.y <= f.ty) {
        fireworks.splice(i, 1); SFX.pop();
        const n = 40 + (rnd() * 20 | 0);
        for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, sp = 50 + rnd() * 30; parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.4 + rnd() * 0.6, max: 2, col: rnd() < 0.7 ? f.col : f.cols[(rnd() * f.cols.length) | 0], g: 45, size: rnd() < 0.3 ? 2 : 1, sky: true }); }
      }
    }
  }
}

function updateCamera(dt) {
  const h = L();
  const tx = clamp(h.x + 8 - VW / 2, 0, W * TS - VW), ty = clamp(h.y + 8 - VH / 2, 0, H * TS - VH);
  cam.x += (tx - cam.x) * Math.min(1, dt * 8); cam.y += (ty - cam.y) * Math.min(1, dt * 8);
}

// ---------------- loop ----------------
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  readInput();
  update(dt);
  render();
  requestAnimationFrame(frame);
}
function update(dt) {
  updateMusic();
  for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers[i].fn; timers.splice(i, 1); f(); } }
  if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
  shakeT = Math.max(0, shakeT - dt);
  inputLock = Math.max(0, inputLock - dt);
  if (state === 'faint') { fade = Math.min(1, fade + dt * 1.2); return; }
  fade = Math.max(0, fade - dt * (state === 'reveal' ? 0.7 : 2));
  updateParts(parts, dt);
  if (state === 'title') {
    cam.x = 24 * TS - VW / 2; cam.y = 0;
    if (inp.atkP || inp.stP) {
      audioInit(); state = 'play'; inputLock = 0.3; playSong('explore');
      say(['Num reino distante, uma nova vida está a caminho...',
        'Duas torres guardam o grande segredo: Valhala, a torre azul, e Lothlórien, a torre rosa.',
        'Só quem reunir as 3 relíquias sagradas e levá-las ao altar verá qual delas vai se abrir.',
        'Gu, o viking, quebra pedras com seu machado. De, a elfa, acerta alvos distantes com seu arco.',
        'Botão Y ou X: trocar de herói.  Botão A ou B: atacar.  START: pausa.  Boa sorte, Gu e De!']);
      if (params.get('pular')) { relics.forEach(r => r.taken = true); relicCount = 3; heroes[0].x = 23 * TS; heroes[0].y = 20 * TS; heroes[1].x = 24 * TS; heroes[1].y = 20 * TS; }
    }
    return;
  }
  if (dlg) { updateDialog(dt); if (state !== 'suspense') return; }
  if (state === 'suspense') { updateSuspense(dt); return; }
  if (state === 'reveal') { updateReveal(dt); return; }
  if (inp.stP) { paused = !paused; SFX.sw(); }
  if (paused) return;
  inv = Math.max(0, inv - dt);
  updateHeroes(dt);
  updateArrows(dt);
  updateEnemies(dt);
  updatePickups(dt);
  updateTriggers(dt);
  updateCamera(dt);
}

// ---------------- render ----------------
const UI = [];
function txt(s, x, y, size = 8, col = '#fff', align = 'left', stroke = null) { UI.push({ s, x, y, size, col, align, stroke }); }
const FONT = '"Lucida Console","Courier New",monospace';
function measure(s, size) { out.font = `bold ${size * S}px ${FONT}`; return out.measureText(s).width / S; }
function wrap(s, size, maxW) { const words = s.split(' '); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }

function drawTile(tx, ty, sx, sy) {
  const ch = M[ty][tx], v = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  let img;
  switch (ch) {
    case '.': img = T.grass[v % 3]; break;
    case ',': img = T.flower[v % 2]; break;
    case ':': img = T.path[v % 2]; break;
    case '_': case 'X': case 'D': case 'E': case 'd': case 'e': img = T.floor; break;
    case '#': img = T.wall; break;
    case 'T': img = T.tree[v % 2]; break;
    case '~': case 'b': img = T.water[(Math.floor(time * 3) + tx) % 4]; break;
    case '=': img = T.bridge; break;
    case 'R': img = T.rock; break;
    case 'C': img = T.crystal[crystalOn ? 1 : 0]; break;
    case 'P': img = T.plate[plateDown ? 1 : 0]; break;
    case 'G': img = ruinGateOpen() ? T.floor : T.gate; break;
    case 'H': img = T.gate; break;
    case 'I': img = T.sign; break;
    case 'A': ctx.drawImage(T.path[0], sx, sy); if (M[ty][tx - 1] !== 'A') { ctx.drawImage(T.path[0], sx + 16, sy); ctx.drawImage(T.altar, sx, sy); } return;
    default: img = T.grass[0];
  }
  ctx.drawImage(img, sx, sy);
}

function tri(x1, y1, x2, y2, x3, y3, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); }
function R(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

function drawTower(i, px, py, open) {
  const x = Math.round(px), y = Math.round(py);
  R(x + 4, y + 92, 72, 6, 'rgba(0,0,0,0.25)');
  if (i === 0) { // VALHALA
    tri(x + 40, y - 42, x + 4, y + 6, x + 76, y + 6, '#1d3570');
    tri(x + 40, y - 42, x + 40, y + 6, x + 76, y + 6, '#16295a');
    for (let k = 0; k < 4; k++) R(x + 20 + k * 3, y - 20 + k * 6, 40 - k * 6 > 0 ? 2 : 0, 1, '#2c4785');
    R(x + 39, y - 54, 2, 13, '#4f2e18'); R(x + 41, y - 54, 10, 6, '#64b5f6'); R(x + 41, y - 51, 10, 1, '#fff');
    R(x + 8, y + 10, 64, 86, '#3b5ba5'); R(x + 8, y + 10, 5, 86, '#2c4785'); R(x + 67, y + 10, 5, 86, '#5577c4');
    for (let yy = y + 16, r = 0; yy < y + 94; yy += 7, r++) { R(x + 13, yy, 54, 1, '#2f4b8c'); for (let xx = x + 13 + (r % 2) * 6; xx < x + 67; xx += 12) R(xx, yy - 6, 1, 6, '#2f4b8c'); }
    R(x + 4, y + 2, 72, 10, '#4a6cbf'); R(x + 4, y + 11, 72, 2, '#2c4785');
    for (let k = 0; k < 6; k++) R(x + 6 + k * 12, y - 2, 7, 5, '#4a6cbf');
    // runa
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 40, y + 40, 8, 0, Math.PI * 2); ctx.stroke();
    R(x + 40, y + 30, 1, 20, '#ffd54f'); R(x + 33, y + 40, 15, 1, '#ffd54f');
    R(x + 20, y + 24, 7, 11, '#10183a'); R(x + 53, y + 24, 7, 11, '#10183a'); R(x + 21, y + 25, 5, 3, '#64b5f6'); R(x + 54, y + 25, 5, 3, '#64b5f6');
    R(x + 28, y + 70, 24, 26, '#1a2850');
  } else { // LOTHLORIEN
    ctx.fillStyle = '#c2185b'; ctx.beginPath(); ctx.ellipse(x + 40, y + 2, 34, 30, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e85a9c'; ctx.beginPath(); ctx.ellipse(x + 40, y + 2, 30, 27, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.ellipse(x + 30, y - 6, 8, 12, -0.4, 0, Math.PI * 2); ctx.fill();
    tri(x + 40, y - 46, x + 34, y - 24, x + 46, y - 24, '#ffd54f');
    R(x + 39, y - 50, 2, 6, '#ffd54f');
    for (const [lx, ly] of [[16, -4], [62, -6], [26, -18], [54, -16]]) { R(x + lx, y + ly, 4, 3, '#4caf50'); R(x + lx + 1, y + ly - 1, 2, 1, '#81c784'); }
    R(x + 8, y + 4, 64, 92, '#efe4ec'); R(x + 8, y + 4, 5, 92, '#d6c1d0'); R(x + 67, y + 4, 5, 92, '#fff7fb');
    for (const by of [14, 52, 88]) { R(x + 8, y + by, 64, 3, '#e85a9c'); R(x + 8, y + by + 3, 64, 1, '#a83470'); }
    for (let k = 0; k < 9; k++) { const vy = y + 18 + k * 8; R(x + 12 + (k % 2) * 2, vy, 2, 4, '#4caf50'); R(x + 64 - (k % 2) * 2, vy + 3, 2, 4, '#4caf50'); }
    // folha emblema
    ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(x + 40, y + 36, 5, 9, 0.5, 0, Math.PI * 2); ctx.fill(); R(x + 39, y + 30, 1, 14, '#2e7d32');
    ctx.fillStyle = '#7a3b5e'; for (const wx of [24, 56]) { ctx.beginPath(); ctx.ellipse(x + wx, y + 26, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); } R(x + 22, y + 24, 4, 3, '#f8bbd0'); R(x + 54, y + 24, 4, 3, '#f8bbd0');
    ctx.fillStyle = '#a83470'; ctx.beginPath(); ctx.ellipse(x + 40, y + 78, 12, 12, 0, Math.PI, 0); ctx.fill(); R(x + 28, y + 78, 24, 18, '#a83470');
  }
  // porta
  const dx = x + 32, dy = y + 76;
  if (open) {
    R(dx, dy, 16, 20, '#05050a');
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 6); R(dx + 2, dy + 2, 12, 18, i === 0 ? '#bbdefb' : '#fce4ec'); ctx.globalAlpha = 1;
  } else {
    R(dx, dy, 16, 20, i === 0 ? '#6b4423' : '#8d5a8a');
    for (let k = 0; k < 4; k++) R(dx + 3 + k * 4, dy, 1, 20, i === 0 ? '#4f2e18' : '#6d3f6a');
    R(dx, dy + 5, 16, 2, '#37373f'); R(dx, dy + 14, 16, 2, '#37373f'); R(dx + 12, dy + 10, 2, 2, '#ffd54f');
  }
}

function drawHero(h, sx, sy, alpha = 1) {
  const bob = h.walk > 0 ? (Math.floor(h.walk * 8) % 2) : 0;
  R(sx + 3, sy + 14, 10, 2, 'rgba(0,0,0,0.3)');
  const isL = h === L();
  if (isL && inv > 0 && Math.floor(time * 20) % 2) return;
  ctx.globalAlpha = alpha;
  let img = SPR[h.key + (h.face < 0 ? 'L' : '')];
  ctx.drawImage(img, sx, sy - bob);
  // arma
  if (h.key === 'gu') {
    const swing = h.atk > 0;
    if (swing) {
      const c = { x: sx + 8 + h.fx * 11, y: sy + 9 + h.fy * 11 };
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
      const base = Math.atan2(h.fy, h.fx || (h.fy ? 0 : h.face)); const p = 1 - h.atk / 0.22;
      ctx.arc(sx + 8, sy + 9, 12, base - 1.2, base - 1.2 + 2.4 * p); ctx.stroke();
      R(c.x - 3, c.y - 3, 6, 6, '#b0bec5'); R(c.x - 2, c.y - 2, 4, 4, '#eceff1');
    } else { const ax = h.face > 0 ? sx + 13 : sx - 1; R(ax, sy + 6 - bob, 2, 8, '#6d4424'); R(ax - 1 + (h.face > 0 ? 1 : -1), sy + 5 - bob, 4, 4, '#b0bec5'); }
  } else {
    const ax = h.face > 0 ? sx + 13 : sx; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ax + 1, sy + 9 - bob, 5, h.face > 0 ? -1.3 : 1.84, h.face > 0 ? 1.3 : 4.44); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (h.anchored) { R(sx + 6, sy - 6, 4, 4, '#ffd54f'); }
}

function drawGem(x, y, col, s = 1) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < 9; j++) { const w = j < 4 ? j + 1 : 8 - j; R(x - w, y - 4 + j, w * 2, 1, j < 4 ? '#ffffff' : col); }
  R(x - 3, y - 3, 6, 4, col); R(x - 2, y - 2, 1, 2, '#fff');
}

function drawWorld() {
  let sxo = 0, syo = 0; if (shakeT > 0) { sxo = (rnd() * 4 - 2) | 0; syo = (rnd() * 4 - 2) | 0; }
  const cx = Math.round(cam.x) + sxo, cy = Math.round(cam.y) + syo;
  const tx0 = Math.max(0, Math.floor(cx / TS)), ty0 = Math.max(0, Math.floor(cy / TS));
  for (let ty = ty0; ty <= Math.min(H - 1, ty0 + 12); ty++) for (let tx = tx0; tx <= Math.min(W - 1, tx0 + 21); tx++) drawTile(tx, ty, tx * TS - cx, ty * TS - cy);
  // torres
  const opened = i => doorOpen && RESULT === i;
  drawTower(0, 15 * TS - cx, 3 * TS - cy, opened(0));
  drawTower(1, 28 * TS - cx, 3 * TS - cy, opened(1));
  if (suspense && suspense.hl >= 0 && !suspense.opened) {
    const bx = (suspense.hl === 0 ? 15 : 28) * TS - cx;
    ctx.globalAlpha = 0.35; R(bx + 4, -cy - 60, 72, 3 * TS + 160, suspense.hl === 0 ? '#bbdefb' : '#fce4ec'); ctx.globalAlpha = 1;
  }
  if (doorOpen) { const bx = (RESULT === 0 ? 17 : 30) * TS - cx; ctx.globalAlpha = 0.18 + 0.1 * Math.sin(time * 4); R(bx - 8, -cy, 32, 9 * TS, '#fff'); ctx.globalAlpha = 1; }
  // altar gemas
  if (altarPlaced) RELIC_COL.forEach((c, i) => drawGem(23 * TS + 8 + i * 8 - cx, 18 * TS - 1 - cy + Math.sin(time * 3 + i) * 1.5, c));
  // reliquias
  for (const r of relics) if (!r.taken) {
    const yy = r.y - cy + Math.sin(time * 3 + r.id) * 2;
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 5); ctx.fillStyle = RELIC_COL[r.id]; ctx.beginPath(); ctx.arc(r.x - cx, yy, 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawGem(r.x - cx, yy, RELIC_COL[r.id]);
  }
  for (const d of drops) { if (d.t > 9 && Math.floor(time * 10) % 2) continue; ctx.drawImage(SPR.heart, Math.round(d.x - cx), Math.round(d.y - cy + Math.sin(d.t * 5))); }
  // entidades por y
  const ents = [];
  for (const e of enemies) ents.push({ y: e.y, f: () => { const sx = Math.round(e.x - cx), sy = Math.round(e.y - cy); R(sx + 3, sy + 14, 10, 2, 'rgba(0,0,0,0.3)'); const sq = e.type === 'slime' ? Math.floor(time * 4 + e.x) % 2 : 0; const img = e.flash > 0 ? SPR[e.type + 'W'] : SPR[e.type + (e.face < 0 ? 'L' : '')]; ctx.drawImage(img, sx, sy + sq); } });
  for (const h of heroes) ents.push({ y: h.y + (h === L() ? 0.1 : 0), f: () => drawHero(h, Math.round(h.x - cx), Math.round(h.y - cy)) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  for (const a of arrows) { const x = Math.round(a.x - cx), y = Math.round(a.y - cy); if (a.vx) { R(x - 5, y, 10, 1, '#8d6e63'); R(a.vx > 0 ? x + 4 : x - 6, y - 1, 2, 3, '#eceff1'); } else { R(x, y - 5, 1, 10, '#8d6e63'); R(x - 1, a.vy > 0 ? y + 4 : y - 6, 3, 2, '#eceff1'); } }
  for (const p of parts) if (!p.sky) { ctx.globalAlpha = Math.min(1, p.life / p.max * 2); R(p.x - cx, p.y - cy, p.size, p.size, p.col); } ctx.globalAlpha = 1;
}

function drawHUD() {
  if (state === 'title') return;
  for (let i = 0; i < MAXH; i++) ctx.drawImage(i < hearts ? SPR.heart : SPR.heartE, 4 + i * 9, 4);
  // reliquias
  for (let i = 0; i < 3; i++) { const x = VW / 2 - 18 + i * 14; R(x - 1, 2, 12, 12, '#101833'); R(x, 3, 10, 10, '#26305a'); if (relics[i].taken) drawGem(x + 5, 8, RELIC_COL[i]); }
  // retrato
  const h = L(), f = F();
  R(VW - 64, 2, 62, 20, 'rgba(16,24,51,0.85)'); R(VW - 64, 2, 62, 1, '#e8e8ff');
  ctx.drawImage(SPR[h.key], VW - 62, 4);
  ctx.globalAlpha = 0.45; ctx.drawImage(SPR[f.key], VW - 19, 4); ctx.globalAlpha = 1;
  txt(h.name, VW - 44, 4, 7, h.key === 'gu' ? '#90caf9' : '#f8bbd0', 'left');
  txt('Y: troca', VW - 44, 14, 5, '#c5cae9', 'left');
  if (toast) { const w = measure(toast.s, 6) + 10; R(VW / 2 - w / 2, 18, w, 11, 'rgba(16,24,51,0.85)'); txt(toast.s, VW / 2, 20, 6, '#fff', 'center'); }
}

function drawDialog() {
  R(8, 126, 304, 50, 'rgba(12,18,40,0.94)'); R(8, 126, 304, 1, '#e8e8ff'); R(8, 175, 304, 1, '#e8e8ff'); R(8, 126, 1, 50, '#e8e8ff'); R(311, 126, 1, 50, '#e8e8ff');
  const full = dlg.lines[dlg.i], n = Math.floor(dlg.t * 45);
  const lines = wrap(full, 8, 288);
  let left = n;
  lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length + 1; txt(s, 16, 132 + i * 11, 8, '#fff'); });
  if (n >= full.length && Math.floor(time * 3) % 2) tri(300, 166, 306, 166, 303, 170, '#ffd54f');
}

function drawTitle() {
  ctx.fillStyle = 'rgba(5,8,25,0.55)'; ctx.fillRect(0, 0, VW, VH);
  txt('O DESAFIO DAS', VW / 2, 18, 12, '#ffd54f', 'center', '#3e2723');
  txt('DUAS TORRES', VW / 2, 34, 20, '#ffffff', 'center', '#1a1a2e');
  const b = Math.abs(Math.sin(time * 4)) * 3;
  ctx.drawImage(SPR.gu, VW / 2 - 30, 112 - b); ctx.drawImage(SPR.deL, VW / 2 + 14, 112 - Math.abs(Math.sin(time * 4 + 1)) * 3);
  txt('GU', VW / 2 - 22, 130, 7, '#90caf9', 'center', '#000'); txt('DE', VW / 2 + 22, 130, 7, '#f8bbd0', 'center', '#000');
  txt('&', VW / 2, 116, 9, '#fff', 'center', '#000');
  if (Math.floor(time * 2) % 2) txt('Aperte START ou A', VW / 2, 150, 8, '#fff', 'center', '#000');
  if (RESULT === null) txt('(sem segredo.js: o final ficará trancado)', VW / 2, 168, 5, '#ffab91', 'center', '#000');
  else if (params.get('teste')) txt('MODO TESTE: ' + params.get('teste'), VW / 2, 168, 5, '#ffab91', 'center', '#000');
}

function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VW, VH);
  txt('PAUSA', VW / 2, 40, 16, '#ffd54f', 'center', '#000');
  txt('Analógico / D-pad: andar', VW / 2, 74, 7, '#fff', 'center');
  txt('A ou B: atacar (Gu: machado / De: flecha)', VW / 2, 88, 7, '#fff', 'center');
  txt('Y, X, LB ou RB: trocar de herói', VW / 2, 102, 7, '#fff', 'center');
  txt('START: continuar', VW / 2, 116, 7, '#fff', 'center');
}

function drawBaby(x, y, col, col2) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = col2; ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y + 5, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  disc(ctx, x, y - 2, 5, '#f2c39b'); R(x - 3, y - 2, 2, 1, '#1a1a2e'); R(x + 2, y - 2, 2, 1, '#1a1a2e'); R(x - 1, y + 1, 2, 1, '#e57373');
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 3, 0, Math.PI, 0); ctx.fill();
}

function drawReveal() {
  const boy = RESULT === 0;
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#060818'); g.addColorStop(1, boy ? '#15306b' : '#5a1a48'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const sr = mulberry(9); for (let i = 0; i < 60; i++) { const x = sr() * VW | 0, y = sr() * 120 | 0; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + i)); R(x, y, 1, 1, '#fff'); } ctx.globalAlpha = 1;
  for (const p of parts) if (p.sky) { ctx.globalAlpha = Math.min(1, p.life / 0.8); R(p.x, p.y, p.size, p.size, p.col); } ctx.globalAlpha = 1;
  for (const f of fireworks) R(f.x, f.y, 1, 3, '#fff8e1');
  // torre ao fundo
  ctx.save(); ctx.globalAlpha = 0.9; drawTower(boy ? 0 : 1, VW / 2 - 40, 64, true); ctx.restore();
  R(0, 158, VW, 22, '#3f7a2c'); R(0, 158, VW, 2, '#5aa83c');
  const jb = (o) => Math.abs(Math.sin(time * 5 + o)) * 10;
  ctx.drawImage(SPR.gu, VW / 2 - 60, 143 - jb(0)); ctx.drawImage(SPR.deL, VW / 2 + 44, 143 - jb(1.2));
  drawBaby(VW / 2, 146 - Math.abs(Math.sin(time * 3)) * 3, boy ? '#64b5f6' : '#f48fb1', boy ? '#1e88e5' : '#ec407a');
  if (revealT > 1.0) {
    const k = Math.min(1, (revealT - 1.0) / 0.5), sc = 1 + 0.25 * Math.sin(Math.min(1, k) * Math.PI) + 0.03 * Math.sin(time * 4);
    txt(boy ? 'É MENINO!' : 'É MENINA!', VW / 2, 18, 28 * sc, boy ? '#64b5f6' : '#f48fb1', 'center', '#fff');
  }
  if (revealT > 2.5) txt(boy ? 'Um pequeno guerreiro de Valhala está a caminho!' : 'Uma pequena guerreira de Lothlórien está a caminho!', VW / 2, 52, 7, '#fff', 'center', '#000');
}

function render() {
  UI.length = 0;
  ctx.imageSmoothingEnabled = false;
  if (state === 'reveal') drawReveal();
  else {
    drawWorld(); drawHUD();
    if (state === 'title') drawTitle();
    if (dlg) drawDialog();
    if (paused) drawPause();
  }
  if (fade > 0) { ctx.fillStyle = `rgba(${fadeCol},${fade})`; ctx.fillRect(0, 0, VW, VH); }
  out.imageSmoothingEnabled = false;
  out.fillStyle = '#000'; out.fillRect(0, 0, cv.width, cv.height);
  out.drawImage(buf, 0, 0, VW, VH, OX, OY, VW * S, VH * S);
  for (const u of UI) {
    out.font = `bold ${Math.round(u.size * S)}px ${FONT}`; out.textAlign = u.align; out.textBaseline = 'top';
    const x = OX + u.x * S, y = OY + u.y * S;
    if (u.stroke) { out.lineJoin = 'round'; out.lineWidth = Math.max(2, u.size * S / 5); out.strokeStyle = u.stroke; out.strokeText(u.s, x, y); }
    out.fillStyle = u.col; out.fillText(u.s, x, y);
  }
}

window.__game = { get state() { return state; }, heroes, relics, enemies, M, get lead() { return lead; }, get dlg() { return dlg; }, get crystalOn() { return crystalOn; }, get plateDown() { return plateDown; }, RESULT };
requestAnimationFrame(frame);
