'use strict';
// =====================================================================
//  world/collision.js — caixas de colisao e movimento com deslize nas quinas
//  hb(e)   = caixa dos pes (colide com o mapa)
//  body(e) = caixa do corpo (recebe golpes)
//  Inimigos podem definir hb/body proprios no registro (ex.: chefao).
// =====================================================================
function hb(e) { const d = e.type && ENEMY[e.type]; if (d && d.hb) return d.hb(e); return { x: e.x + 3, y: e.y + 9, w: 10, h: 6 }; }
function body(e) { const d = e.type && ENEMY[e.type]; if (d && d.body) return d.body(e); return { x: e.x + 2, y: e.y + 4, w: 12, h: 12 }; }
function center(e) { const d = e.type && ENEMY[e.type]; if (d && d.center) return d.center(e); return { x: e.x + 8, y: e.y + 10 }; }
function blocked(e) {
  const b = hb(e), fly = e.type && ENEMY[e.type] && ENEMY[e.type].fly;
  const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS), y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solidAt(x, y, fly)) return true;
  return false;
}
function tryMove(e, dx, dy) {
  let moved = false;
  for (const [ax, ay] of [[dx, 0], [0, dy]]) {
    if (!ax && !ay) continue;
    e.x += ax; e.y += ay;
    if (!blocked(e)) { moved = true; continue; }
    e.x -= ax; e.y -= ay;
    for (let o = 1; o <= 6; o++) { // escorrega ate 6px para passar em quinas/portas
      let done = false;
      for (const s of [-1, 1]) {
        const qx = ay ? s * o : 0, qy = ax ? s * o : 0;
        e.x += qx + ax; e.y += qy + ay; const ok = !blocked(e); e.x -= qx + ax; e.y -= qy + ay;
        if (ok) { const sx = ay ? s : 0, sy = ax ? s : 0; e.x += sx; e.y += sy; if (blocked(e)) { e.x -= sx; e.y -= sy; } else moved = true; done = true; break; }
      }
      if (done) break;
    }
  }
  return moved;
}
function heroTile(h) { const b = hb(h); return [Math.floor((b.x + b.w / 2) / TS), Math.floor((b.y + b.h / 2) / TS)]; }
