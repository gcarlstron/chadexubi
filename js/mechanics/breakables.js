'use strict';
// =====================================================================
//  mechanics/breakables.js — coisas que o machado do Gu quebra
//  R pedra rachada (2 golpes) | W parede rachada secreta (3 golpes) | B arbusto (1 golpe)
// =====================================================================
let hits = {};
onLevelLoad(() => { hits = {}; });

function breakTile(tx, ty, need, becomes, onBreak) {
  const k = tkey(tx, ty); hits[k] = (hits[k] || 0) + 1; shakeT = 0.08;
  if (hits[k] >= need) {
    M[ty][tx] = becomes; SFX.break(); burst(tx * TS + 8, ty * TS + 8, 18, ['#8d8d99', '#5d5d68', '#a9a9b5'], 80, 0.6, 120);
    onBreak && onBreak();
  } else { SFX.tink(); burst(tx * TS + 8, ty * TS + 8, 6, ['#fff', '#a9a9b5'], 50, 0.3); }
}
defineTile('R', { solid: true, arrowHint: true, img: T => T.rock, axe: (x, y) => breakTile(x, y, 2, ':') });
defineTile('W', {
  solid: true, arrowHint: true, img: T => T.wallCrack,
  axe: (x, y) => breakTile(x, y, 3, '_', () => { later(0.3, () => SFX.secret()); showToast('Uma passagem secreta!', 3); }),
});
defineTile('B', {
  solid: true, arrowHint: true, img: T => T.bush,
  axe: (x, y) => {
    M[y][x] = '.'; SFX.cut(); burst(x * TS + 8, y * TS + 8, 14, THEMES[LV.theme].bush, 70, 0.5, 60);
    if (hearts < maxH && rnd() < 0.25) drops.push({ x: x * TS + 4, y: y * TS + 4, t: 0 });
  },
});
