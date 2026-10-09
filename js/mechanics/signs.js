'use strict';
// =====================================================================
//  mechanics/signs.js — placas de aviso: chegar perto mostra LV.signs['x,y']
// =====================================================================
let signNear = {};
onLevelLoad(() => { signNear = {}; });
function updateSigns() {
  for (const k in LV.signs || {}) {
    const [sx, sy] = unkey(k), near = anyNear(sx * TS + 8, sy * TS + 8, 22);
    if (near && !signNear[k]) say(LV.signs[k]);
    signNear[k] = near;
  }
}
