'use strict';
// =====================================================================
//  mechanics/locks.js — portas trancadas 'L' e chaves
//  Chegar perto com chaves suficientes abre a porta (e as 'L' grudadas nela).
//  LV.lockNeed {'x,y': n} define quantas chaves a porta pede (padrao 1).
// =====================================================================
let keysHeld = 0;
onLevelLoad(() => { keysHeld = 0; });

defineTile('L', { solid: true, img: T => T.lock });
function updateLocks() {
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (M[ty][tx] === 'L' && anyNear(tx * TS + 8, ty * TS + 8, 21)) {
    const need = (LV.lockNeed && LV.lockNeed[tkey(tx, ty)]) || 1;
    if (keysHeld >= need) { keysHeld -= need; openLocks(tx, ty); }
    else if (cd('lock', 5)) say(need > 1 ? 'Esta porta tem ' + need + ' fechaduras. (Chaves: ' + keysHeld + '/' + need + ')' : 'Uma porta trancada. Precisam de uma chave.');
  }
}
function openLocks(x, y) {
  const st = [[x, y]]; SFX.unlock(); shakeT = 0.3;
  while (st.length) { const [a, b] = st.pop(); if (M[b] && M[b][a] === 'L') { M[b][a] = '_'; burst(a * TS + 8, b * TS + 8, 12, ['#ffd54f', '#6b4423', '#fff'], 60, 0.5); st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } }
  say('Click! A porta se abriu.');
}
