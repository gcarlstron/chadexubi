'use strict';
// =====================================================================
//  entities/crow.js — o Corvo Trapaceiro (so aparece em cenas)
//  crowTo(x, y, vel) faz ele voar ate o ponto; crowArrived() p/ esperar na cena.
// =====================================================================
let crow = null;
onLevelLoad(() => { crow = null; });
function crowTo(x, y, sp = 120) { if (!crow) crow = { x: x, y: y - 140, tx: x, ty: y, sp, carry: false, face: 1 }; crow.tx = x; crow.ty = y; crow.sp = sp; }
function crowArrived() { return crow && dist(crow.x, crow.y, crow.tx, crow.ty) < 2; }
function updateCrow(dt) {
  if (!crow) return;
  const d = dist(crow.x, crow.y, crow.tx, crow.ty);
  if (d > 0.5) { const s = Math.min(d, crow.sp * dt); if (crow.tx !== crow.x) crow.face = Math.sign(crow.tx - crow.x); crow.x += (crow.tx - crow.x) / d * s; crow.y += (crow.ty - crow.y) / d * s; }
}
function drawCrow(cx, cy) {
  if (!crow) return;
  const fl = Math.floor(time * 10) % 2, x = Math.round(crow.x - cx - 8), y = Math.round(crow.y - cy - 8 + (fl ? -1 : 0));
  ctx.drawImage(crow.face > 0 ? SPR.crowL : SPR.crow, x, y);
  if (crow.carry) ctx.drawImage(SPR.scroll, x + 2, y + 12);
}
