'use strict';
// =====================================================================
//  world/state.js — estado compartilhado do jogo
//  Estado GLOBAL (vale para o jogo todo) e estado da FASE (zerado em loadLevel).
//  Modulos que guardam estado proprio por fase registram onLevelLoad(fn).
// =====================================================================

// ---- global ----
let state = 'title';      // title | play | cut | suspense | reveal | faint | trans
let paused = false, time = 0;
let mode = 1;             // 1 = um jogador trocando de heroi | 2 = dois jogadores
let padHero = 0;          // em 2P: 0 = Gu no controle, 1 = De no controle
let menuSel = 0;
let hearts = 5, maxH = 5, inv = 0, chupetas = 0;
const cam = { x: 0, y: 0 }; let camFocus = null;
let shakeT = 0, fade = 0, fadeCol = '0,0,0', toast = null, banner = null, inputLock = 0;

// ---- da fase atual ----
let LV = null, M = null, W = 0, H = 0;   // definicao da fase e mapa (M[y][x] = char do tile)
let flags = {};                           // marcadores livres da fase (ex.: flags.relic0, flags.jaula)
let items = [], drops = [], timers = [], parts = [];

const LEVEL_LOAD_HOOKS = [];
function onLevelLoad(fn) { LEVEL_LOAD_HOOKS.push(fn); }

// ---- utilidades de estado ----
function later(t, fn) { timers.push({ t, fn }); }
function updateTimers(dt) { for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers[i].fn; timers.splice(i, 1); f(); } } }
function showToast(s, t = 2.5) { toast = { s, t }; }
const msgCD = {};
function cd(k, t) { if ((msgCD[k] || 0) > time) return false; msgCD[k] = time + t; return true; }

// ---- particulas ----
function burst(x, y, n, cols, spd = 60, life = 0.5, g = 0, size = 1) {
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, s = spd * (0.3 + rnd() * 0.7); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + rnd() * 0.6), max: life, col: cols[(rnd() * cols.length) | 0], g, size }); }
}
function smoke(x, y, n = 30) { burst(x, y, n, ['#ffffff', '#e0e0e0', '#bdbdbd', '#9e9e9e'], 70, 1.0, -20, 2); }
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; }
}
