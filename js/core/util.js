'use strict';
// =====================================================================
//  core/util.js — constantes, utilitarios e leitura do segredo
// =====================================================================
const VW = 320, VH = 180, TS = 16;          // resolucao interna e tamanho do tile
const params = new URLSearchParams(location.search);
const TOTAL_CHUPETAS = 5;

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const tkey = (x, y) => x + ',' + y;
const unkey = k => k.split(',').map(Number);
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// Segredo gerado pelo segredo.html (window.SEGREDO) ou forçado por ?teste=menino|menina
// 0 = Valhala (azul / menino), 1 = Lothlorien (rosa / menina), null = sem segredo
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
const RESULT = lerSegredo();
