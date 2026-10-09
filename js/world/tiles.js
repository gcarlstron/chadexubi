'use strict';
// =====================================================================
//  world/tiles.js — REGISTRO DE TILES
//  Cada caractere do mapa e definido uma vez com defineTile(chars, def):
//    solid   : true/false ou (tx,ty) => bool       (bloqueia andar)
//    liquid  : true -> morcegos voam e flechas passam por cima
//    img     : (T, tx, ty, v) => canvas             (T = TILESETS do tema; v = variacao)
//    draw    : (T, tx, ty, sx, sy) => void          (desenho customizado)
//    axe     : (tx, ty, heroi) => void              (o que o machado do Gu faz)
//    arrowHint: true -> flecha bate e sugere usar o Gu
//  Mecanicas (mechanics/*.js) registram seus proprios tiles.
// =====================================================================
const TILE = {};
function defineTile(chars, def) { for (const c of chars) TILE[c] = Object.assign({ solid: false, liquid: false }, def); }

// ---- tiles basicos ----
defineTile('.', { img: (T, x, y, v) => T.ground[v % 3] });
defineTile(',', { img: (T, x, y, v) => T.deco[v % 2] });
defineTile(':', { img: (T, x, y, v) => T.path[v % 2] });
defineTile('_dexX', { img: T => T.floor });                     // piso (d/e = portas abertas das torres)
defineTile('DE', { solid: true, img: T => T.floor });           // portas fechadas (desenhadas pela torre)
defineTile('#', { solid: true, img: T => T.wall });
defineTile('T', { solid: true, img: (T, x, y, v) => T.tree[v % 2] });
defineTile('~', { solid: true, liquid: true, img: (T, x) => T.liq[(Math.floor(time * 3) + x) % 4] });
defineTile('=', { img: T => T.bridgeH });
defineTile('|', { img: T => T.bridgeV });
defineTile('H', { solid: true, img: T => T.gate });                // portao grande (abre por evento da fase)
defineTile('I', { solid: true, img: T => T.sign });                // placa de aviso (texto em LV.signs)
defineTile('O', { draw: (T, x, y, sx, sy) => { ctx.drawImage(T.floor, sx, sy); drawPortal(sx + 8, sy + 8); } }); // portal p/ proxima fase
defineTile('A', {                                                   // altar (2 tiles de largura)
  solid: true,
  draw: (T, x, y, sx, sy) => { ctx.drawImage(T.floor, sx, sy); if (M[y][x - 1] !== 'A') { ctx.drawImage(T.floor, sx + 16, sy); ctx.drawImage(T.altar, sx, sy); } },
});
TILE['X'].solid = true; // pe das torres

function tileDef(tx, ty) { return TILE[M[ty][tx]] || TILE['.']; }
function solidAt(tx, ty, fly) {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
  const d = tileDef(tx, ty);
  if (fly && d.liquid) return false;
  return typeof d.solid === 'function' ? d.solid(tx, ty) : d.solid;
}
function drawTile(tx, ty, sx, sy) {
  const T = TILESETS[LV.theme], d = tileDef(tx, ty);
  if (d.draw) return d.draw(T, tx, ty, sx, sy);
  const v = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  ctx.drawImage(d.img(T, tx, ty, v), sx, sy);
}
