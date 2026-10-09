'use strict';
// =====================================================================
//  gfx/tiles.js — temas (floresta, neve, vulcao) e imagens 16x16 dos tiles
//  TILESETS[tema].<nome> -> canvas. O comportamento de cada tile fica em
//  world/tiles.js (registro defineTile).
// =====================================================================
function tileCanvas(draw, w = TS, h = TS) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); return c; }
function px(g, x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
function specks(g, r, n, col, w = 16, h = 16) { for (let i = 0; i < n; i++) px(g, (r() * w) | 0, (r() * h) | 0, col); }
function disc(g, cx, cy, rad, col) { g.fillStyle = col; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.6) g.fillRect(cx + x, cy + y, 1, 1); }

const THEMES = {
  forest: { g: ['#5aa83c', '#4c9432', '#6cbf4a'], deco: ['#ffffff', '#ffeb3b', '#f48fb1', '#90caf9'], path: ['#c9a66b', '#b48f55', '#dcbd85'], floor: ['#9a9aa8', '#82828f', '#acacb9'], wall: ['#6b6b7b', '#4a4a58', '#85859a'], tree: 'round', liq: ['#2f6fc6', '#5b95e0'], bush: ['#2e7d32', '#43a047', '#1b5e20'] },
  snow: { g: ['#e3edf5', '#cbd9e6', '#ffffff'], deco: ['#90caf9', '#b3e5fc', '#ffffff'], path: ['#b4c6d6', '#a0b4c6', '#c8d8e6'], floor: ['#a9bccf', '#8fa3b8', '#bccde0'], wall: ['#5f7590', '#435670', '#8aa0ba'], tree: 'pine', liq: ['#3d7fb8', '#a9d4f5'], bush: ['#2e6b55', '#4f9478', '#1b4d3e'] },
  volcano: { g: ['#4a3b3b', '#3a2d2d', '#5a4848'], deco: ['#ff7043', '#ffab40', '#ff5722'], path: ['#6d5a4a', '#5d4a3c', '#7d6a5a'], floor: ['#5a5560', '#45404a', '#6a6570'], wall: ['#3a3340', '#241f29', '#57505e'], tree: 'spire', liq: ['#e65100', '#ffb300'], bush: ['#5d4037', '#795548', '#3e2723'] },
};
function buildTheme(P) {
  const R = mulberry(7), T = {};
  const base = g => { g.fillStyle = P.g[0]; g.fillRect(0, 0, 16, 16); specks(g, R, 9, P.g[1]); specks(g, R, 5, P.g[2]); };
  T.base = base;
  T.ground = [0, 1, 2].map(() => tileCanvas(base));
  T.deco = [0, 1].map(() => tileCanvas(g => { base(g); for (let i = 0; i < 3; i++) { const x = 2 + (R() * 12) | 0, y = 2 + (R() * 12) | 0, c = P.deco[(R() * P.deco.length) | 0]; if (P.tree === 'round') { px(g, x, y - 1, c); px(g, x - 1, y, c); px(g, x + 1, y, c); px(g, x, y + 1, c); px(g, x, y, '#ffd54f'); } else { px(g, x, y, c); px(g, x + 1, y + 1, c); } } }));
  T.path = [0, 1].map(() => tileCanvas(g => { g.fillStyle = P.path[0]; g.fillRect(0, 0, 16, 16); specks(g, R, 10, P.path[1]); specks(g, R, 4, P.path[2]); }));
  T.floor = tileCanvas(g => { g.fillStyle = P.floor[0]; g.fillRect(0, 0, 16, 16); g.fillStyle = P.floor[1]; g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 8); specks(g, R, 6, P.floor[1]); specks(g, R, 4, P.floor[2]); });
  const wall = (g, crack) => { g.fillStyle = P.wall[0]; g.fillRect(0, 0, 16, 16); g.fillStyle = P.wall[1]; for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); for (let r = 0; r < 4; r++) { const o = r % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) g.fillRect(x, r * 4, 1, 3); } g.fillStyle = P.wall[2]; g.fillRect(0, 0, 16, 1); if (crack) { g.fillStyle = '#111'; [[8, 3], [7, 4], [7, 5], [8, 6], [9, 7], [9, 8], [8, 9], [7, 10], [8, 11], [10, 8], [11, 9], [6, 5]].forEach(([x, y]) => g.fillRect(x, y, 1, 1)); } };
  T.wall = tileCanvas(g => wall(g, false));
  T.wallCrack = tileCanvas(g => wall(g, true));
  T.tree = [0, 1].map(v => tileCanvas(g => {
    base(g); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(3, 13, 10, 3);
    if (P.tree === 'round') { g.fillStyle = '#6d4424'; g.fillRect(6, 10, 4, 5); disc(g, 8, 7, 7, '#1f5e24'); disc(g, 8, 6, 6, v ? '#2e7d32' : '#33873a'); disc(g, 6, 4, 3, '#43a047'); px(g, 5, 3, '#66bb6a'); }
    else if (P.tree === 'pine') { g.fillStyle = '#5d4037'; g.fillRect(7, 12, 2, 4); for (const [y0, w0] of [[1, 2], [4, 4], [7, 6]]) for (let j = 0; j < 5; j++) { const w = Math.min(7, w0 + j); g.fillStyle = j === 0 ? '#ffffff' : (v ? '#1b4d3e' : '#2e6b55'); g.fillRect(8 - w, y0 + j, w * 2, 1); } }
    else { g.fillStyle = '#2b2228'; for (let j = 0; j < 14; j++) { const w = Math.floor(1 + j * 0.45); g.fillRect(8 - w, 1 + j, w * 2, 1); } g.fillStyle = '#3d3238'; for (let j = 2; j < 14; j++) g.fillRect(8 - Math.floor(j * 0.45), 1 + j, 2, 1); px(g, 8, 8, '#ff7043'); px(g, 7, 9, '#ff7043'); px(g, 9, 11, '#ffab40'); }
  }));
  T.liq = [0, 1, 2, 3].map(f => tileCanvas(g => { g.fillStyle = P.liq[0]; g.fillRect(0, 0, 16, 16); g.fillStyle = P.liq[1]; for (const [y, o] of [[3, 0], [8, 6], [13, 11]]) { const x = (o + f * 2) % 16; g.fillRect(x, y, 4, 1); g.fillRect((x + 8) % 16, y + 1, 3, 1); } }));
  T.bridgeH = tileCanvas(g => { g.fillStyle = P.liq[0]; g.fillRect(0, 0, 16, 16); g.fillStyle = '#a0703c'; g.fillRect(0, 2, 16, 12); g.fillStyle = '#7a5228'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 2, 1, 12); g.fillRect(0, 2, 16, 1); g.fillRect(0, 13, 16, 1); });
  T.bridgeV = tileCanvas(g => { g.fillStyle = P.liq[0]; g.fillRect(0, 0, 16, 16); g.fillStyle = P.tree === 'spire' ? '#757575' : '#a0703c'; g.fillRect(1, 0, 14, 16); g.fillStyle = P.tree === 'spire' ? '#424242' : '#7a5228'; for (let y = 0; y < 16; y += 4) g.fillRect(1, y, 14, 1); g.fillRect(1, 0, 1, 16); g.fillRect(14, 0, 1, 16); });
  T.rock = tileCanvas(g => { base(g); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 12, 13, 3); disc(g, 8, 8, 6, '#5d5d68'); disc(g, 8, 8, 5, '#8d8d99'); disc(g, 6, 6, 2, '#a9a9b5'); g.fillStyle = '#33333d'; g.fillRect(8, 4, 1, 3); g.fillRect(9, 7, 1, 2); g.fillRect(8, 9, 1, 3); g.fillRect(10, 8, 2, 1); });
  T.bush = tileCanvas(g => { base(g); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 12, 12, 3); disc(g, 8, 9, 6, P.bush[2]); disc(g, 8, 8, 5, P.bush[0]); disc(g, 6, 6, 2, P.bush[1]); px(g, 10, 7, P.bush[1]); px(g, 5, 10, P.bush[1]); });
  T.crystal = (on, inLiq, mark) => tileCanvas(g => {
    if (inLiq) { g.fillStyle = P.liq[0]; g.fillRect(0, 0, 16, 16); } else base(g);
    g.fillStyle = '#6b6b7b'; g.fillRect(3, 11, 10, 5); g.fillStyle = '#85859a'; g.fillRect(3, 11, 10, 1);
    const c1 = on ? '#b2ffff' : '#2a7f8a', c2 = on ? '#4dd0e1' : '#1f5f68';
    for (let y = 0; y < 10; y++) { const w = y < 5 ? y : 9 - y; g.fillStyle = y < 5 ? c1 : c2; g.fillRect(8 - w, 1 + y, w * 2 + 1, 1); }
    if (on) { px(g, 7, 3, '#fff'); px(g, 7, 4, '#fff'); }
    for (let i = 0; i < (mark || 0); i++) { g.fillStyle = '#ffd54f'; g.fillRect(8 - mark * 2 + 1 + i * 4, 13, 2, 2); }
  });
  T.plate = [0, 1].map(on => tileCanvas(g => { const r = mulberry(3); g.fillStyle = P.path[0]; g.fillRect(0, 0, 16, 16); specks(g, r, 8, P.path[1]); g.fillStyle = '#5d5d68'; g.fillRect(1, 1, 14, 14); g.fillStyle = on ? '#ffd54f' : '#8a8a96'; g.fillRect(3, 3, 10, 10); g.fillStyle = on ? '#fff59d' : '#a0a0ac'; g.fillRect(3, 3, 10, 1); g.fillStyle = on ? '#f9a825' : '#6d6d78'; g.fillRect(6, 6, 4, 4); }));
  T.gate = tileCanvas(g => { g.fillStyle = '#20202a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#a7a7b3'; for (let x = 1; x < 16; x += 4) g.fillRect(x, 0, 2, 16); g.fillRect(0, 3, 16, 2); g.fillRect(0, 11, 16, 2); });
  T.lock = tileCanvas(g => { g.fillStyle = '#6b4423'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#4f2e18'; for (let x = 3; x < 16; x += 4) g.fillRect(x, 0, 1, 16); g.fillStyle = '#37373f'; g.fillRect(0, 2, 16, 2); g.fillRect(0, 12, 16, 2); g.fillStyle = '#ffd54f'; g.fillRect(5, 5, 6, 6); g.fillStyle = '#1a1a2e'; g.fillRect(7, 7, 2, 3); });
  T.sign = tileCanvas(g => { base(g); g.fillStyle = '#6d4424'; g.fillRect(7, 9, 2, 7); g.fillStyle = '#4f2e18'; g.fillRect(2, 2, 12, 8); g.fillStyle = '#b5834a'; g.fillRect(3, 3, 10, 6); g.fillStyle = '#7a5228'; g.fillRect(4, 4, 8, 1); g.fillRect(4, 6, 6, 1); });
  T.lever = [0, 1].map(on => tileCanvas(g => { base(g); g.fillStyle = '#5d5d68'; g.fillRect(3, 10, 10, 6); g.fillStyle = '#8a8a96'; g.fillRect(3, 10, 10, 1); g.fillStyle = '#6d4424'; if (on) { for (let i = 0; i < 7; i++) g.fillRect(8 + i, 9 - i, 2, 2); disc(g, 14, 3, 2, '#e53935'); } else { for (let i = 0; i < 7; i++) g.fillRect(7 - i, 9 - i, 2, 2); disc(g, 2, 3, 2, '#8d8d99'); } }));
  T.altar = tileCanvas(g => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 13, 30, 3); g.fillStyle = '#7d7d8a'; g.fillRect(3, 5, 26, 10); g.fillStyle = '#9e9eab'; g.fillRect(4, 6, 24, 8); g.fillStyle = '#c5c5d2'; g.fillRect(1, 2, 30, 4); g.fillStyle = '#e0e0ea'; g.fillRect(1, 2, 30, 1); g.fillStyle = '#4a4a58'; for (const x of [8, 16, 24]) g.fillRect(x - 2, 3, 4, 2); g.fillStyle = '#ffd54f'; g.fillRect(14, 9, 4, 1); g.fillRect(15, 8, 2, 3); }, 32, 16);
  return T;
}
const TILESETS = {}; for (const k in THEMES) TILESETS[k] = buildTheme(THEMES[k]);
const CRYSTAL_CACHE = {};
function crystalTile(theme, on, inLiq, mark) { const k = theme + on + inLiq + mark; if (!CRYSTAL_CACHE[k]) CRYSTAL_CACHE[k] = TILESETS[theme].crystal(on, inLiq, mark); return CRYSTAL_CACHE[k]; }
