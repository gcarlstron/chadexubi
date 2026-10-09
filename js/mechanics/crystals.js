'use strict';
// =====================================================================
//  mechanics/crystals.js — cristais acertados pela flecha da De
//  Tipos (em LV.crystals['x,y']):
//    { bridge: [[x,y]...], msg }   acende e levanta uma ponte escondida
//    { seq: 1|2|3, mark }          sequencia: acertar na ordem das marcas -> LV.seqBridge
//    { timed: 'id' }               acende por 7s (usado no combo com alavanca)
//  Pontes escondidas: 'b' (horizontal) e 'v' (vertical) viram '=' e '|'.
// =====================================================================
let crystalOn = {}, seqNext = 1, timedOn = {};
onLevelLoad(() => { crystalOn = {}; seqNext = 1; timedOn = {}; });
const TIMED_SECONDS = 7;

defineTile('bv', { solid: true, liquid: true, img: (T, x) => T.liq[(Math.floor(time * 3) + x) % 4] });
defineTile('C', {
  solid: true,
  img: (T, x, y) => { const k = tkey(x, y), c = LV.crystals[k] || {}; return crystalTile(LV.theme, !!crystalOn[k], !!c.inLiq, c.mark || 0); },
});

// chamado para cada flecha a cada frame; retorna true se acertou um cristal
function arrowHitsCrystal(a) {
  for (const k in LV.crystals || {}) {
    const [cx, cy] = unkey(k), px_ = cx * TS + 8, py_ = cy * TS + 8;
    const ok = a.vx ? (Math.abs(a.x - px_) < 9 && Math.abs(a.y - py_) < 20) : (Math.abs(a.x - px_) < 11 && Math.abs(a.y - py_) < 9);
    if (ok) { hitCrystal(k); return true; }
  }
  return false;
}
function hitCrystal(k) {
  const c = LV.crystals[k], [cx, cy] = unkey(k);
  const fx = () => burst(cx * TS + 8, cy * TS + 6, 24, ['#b2ffff', '#4dd0e1', '#fff'], 80, 0.7);
  if (c.timed) { crystalOn[k] = true; timedOn[c.timed] = TIMED_SECONDS; SFX.chime(); fx(); checkCombo(); return; }
  if (crystalOn[k]) { SFX.tink(); return; }
  if (c.seq) {
    if (c.seq === seqNext) {
      crystalOn[k] = true; seqNext++; SFX.tick(400 + c.seq * 200); fx();
      if (seqNext > 3) { SFX.chime(); shakeT = 0.3; raiseBridge(LV.seqBridge.bridge, LV.seqBridge.msg); }
    } else {
      SFX.wrong(); shakeT = 0.2; seqNext = 1;
      for (const kk in LV.crystals) if (LV.crystals[kk].seq) crystalOn[kk] = false;
      showToast('Ordem errada! Sigam as marcas douradas.', 3);
    }
    return;
  }
  crystalOn[k] = true; SFX.chime(); shakeT = 0.3; fx();
  if (c.bridge) raiseBridge(c.bridge, c.msg);
}
function raiseBridge(list, msg) {
  list.forEach(([x, y], i) => later(0.3 + i * 0.12, () => { M[y][x] = M[y][x] === 'v' ? '|' : '='; SFX.tick(400 + (i % 6) * 70); burst(x * TS + 8, y * TS + 8, 6, ['#a0703c', '#fff', '#5b95e0'], 50, 0.4); }));
  later(0.6 + list.length * 0.12, () => say(msg));
}
// contagem regressiva dos cristais/alavancas temporizados
function updateTimed(dt) {
  for (const id in timedOn) if (timedOn[id] > 0) {
    timedOn[id] -= dt;
    if (timedOn[id] <= 0) for (const k in LV.crystals) if (LV.crystals[k].timed === id) crystalOn[k] = false;
  }
}
function drawTimedBars(cx, cy) {
  for (const id in timedOn) if (timedOn[id] > 0) {
    const spots = [];
    for (const k in LV.crystals || {}) if (LV.crystals[k].timed === id) spots.push(k);
    for (const k in LV.levers || {}) if (LV.levers[k] === id) spots.push(k);
    for (const k of spots) { const [x, y] = unkey(k); const w = Math.round(14 * timedOn[id] / TIMED_SECONDS); R(x * TS + 1 - cx, y * TS - 4 - cy, 14, 3, '#000'); R(x * TS + 1 - cx, y * TS - 4 - cy, w, 3, '#ffd54f'); }
  }
}
