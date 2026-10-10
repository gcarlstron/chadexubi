'use strict';
// =====================================================================
//  mechanics/signs.js — placas de aviso: chegar perto e apertar o botao de
//  acao (A/B, Espaco, K) para ler LV.signs['x,y']. Perto da placa aparece "A".
// =====================================================================
function signInFront(h) {
  const c = center(h);
  for (const k in LV.signs || {}) {
    const [sx, sy] = unkey(k);
    if (dist(c.x, c.y, sx * TS + 8, sy * TS + 8) < 22) return k;
  }
  return null;
}
function tryReadSign(h) {
  const k = signInFront(h); if (!k) return false;
  SFX.sw(); say(LV.signs[k]); return true;
}
