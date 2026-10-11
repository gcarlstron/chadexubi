'use strict';
// =====================================================================
//  core/input.js — teclado + controles, mapeados por heroi
//  Resultado por frame:
//    hin[0] (Gu) e hin[1] (De): { mx, my, atk, sw, st, atkP, swP, stP }  (P = acabou de apertar)
//    ui: { atkP, stP, upP, downP } — qualquer dispositivo (menus e dialogos)
//  Modos: 1 jogador -> todos os dispositivos controlam o heroi ativo
//         2 jogadores -> controle 1 = padHero, teclado (+controle 2) = o outro
// =====================================================================
const keys = {}, latch = {};
addEventListener('keydown', e => {
  keys[e.code] = true; if (!e.repeat) latch[e.code] = true;
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
  audioInit();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('mousedown', audioInit);
addEventListener('gamepadconnected', () => showToast('Controle conectado!'));

// layouts de teclado
const KB_ALL = { l: ['ArrowLeft', 'KeyA'], r: ['ArrowRight', 'KeyD'], u: ['ArrowUp', 'KeyW'], d: ['ArrowDown', 'KeyS'], atk: ['Space', 'KeyJ', 'KeyZ', 'KeyK', 'Enter', 'KeyF'], sw: ['KeyQ', 'Tab', 'KeyX', 'ShiftLeft', 'KeyL', 'KeyE'], st: ['Escape', 'KeyP', 'Backspace'] };
const KB_A = { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], atk: ['Space', 'KeyF'], sw: ['KeyQ', 'KeyE'], st: ['Escape', 'KeyP'] };      // 2P sem controle: jogador 1
const KB_B = { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], atk: ['KeyK', 'Enter', 'Numpad0', 'KeyJ'], sw: ['KeyL', 'ShiftRight'], st: ['Backspace'] }; // jogador 2
const NONE = { mx: 0, my: 0, atk: false, sw: false, st: false };

function kbRead(sp) {
  const K = c => keys[c] || latch[c], any = a => a.some(K);
  return { mx: (any(sp.r) ? 1 : 0) - (any(sp.l) ? 1 : 0), my: (any(sp.d) ? 1 : 0) - (any(sp.u) ? 1 : 0), atk: any(sp.atk), sw: any(sp.sw), st: any(sp.st) };
}
// Mapeamento "standard" do Gamepad API (8BitDo em modo XInput)
// 0/1 = botoes de baixo/direita (ataque) | 2/3/4/5 = Y, X, LB, RB (troca) | 8/9 = select/start | 12-15 = d-pad
function padRead(gp) {
  if (!gp) return NONE;
  const B = i => gp.buttons[i] && gp.buttons[i].pressed;
  let mx = 0, my = 0; const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if (Math.abs(ax) > 0.4) mx += Math.sign(ax); if (Math.abs(ay) > 0.4) my += Math.sign(ay);
  if (B(14)) mx -= 1; if (B(15)) mx += 1; if (B(12)) my -= 1; if (B(13)) my += 1;
  const r = { mx, my, atk: B(0) || B(1), sw: B(2) || B(3) || B(4) || B(5), st: B(9) || B(8) };
  if (r.atk || r.st) audioInit();
  return r;
}
function merge(...ds) { const r = { mx: 0, my: 0, atk: false, sw: false, st: false }; for (const d of ds) { r.mx += d.mx; r.my += d.my; r.atk = r.atk || d.atk; r.sw = r.sw || d.sw; r.st = r.st || d.st; } r.mx = clamp(r.mx, -1, 1); r.my = clamp(r.my, -1, 1); return r; }

const hin = [{}, {}], hprev = [{}, {}], ui = {}, uiPrev = {};
function readInput() {
  const pads = (navigator.getGamepads ? [...navigator.getGamepads()] : []).filter(Boolean).map(padRead);
  const all = merge(kbRead(KB_ALL), ...pads);
  let c0, c1;
  if (mode === 1) { c0 = lead === 0 ? all : NONE; c1 = lead === 1 ? all : NONE; }
  else if (pads.length) {
    const padC = pads[0], kbC = merge(kbRead(KB_ALL), ...(pads.slice(1)));
    if (padHero === 0) { c0 = padC; c1 = kbC; } else { c0 = kbC; c1 = padC; }
  } else { c0 = kbRead(KB_A); c1 = kbRead(KB_B); }
  [c0, c1].forEach((c, i) => { const p = hprev[i]; hin[i] = Object.assign({}, c, { atkP: c.atk && !p.atk, swP: c.sw && !p.sw, stP: c.st && !p.st }); });
  // 1P: o "anterior" e do dispositivo, nao do heroi — senao o heroi que acabou de assumir ve o botao segurado como novo e destroca
  (mode === 1 ? [all, all] : [c0, c1]).forEach((c, i) => { hprev[i] = { atk: c.atk, sw: c.sw, st: c.st }; });
  ui.atkP = all.atk && !uiPrev.atk; ui.stP = all.st && !uiPrev.st; ui.upP = all.my < 0 && !uiPrev.up; ui.downP = all.my > 0 && !uiPrev.down;
  uiPrev.atk = all.atk; uiPrev.st = all.st; uiPrev.up = all.my < 0; uiPrev.down = all.my > 0;
  for (const k in latch) delete latch[k];
}
