'use strict';
// =====================================================================
//  mechanics/locks.js — portas trancadas 'L'
//  A chave e um item carregavel: o heroi leva ate a porta e aperta acao.
//  LV.lockNeed {'x,y': n} = quantas chaves a porta pede (padrao 1).
//  Tiles 'L' grudados formam UMA porta (compartilham as chaves colocadas).
// =====================================================================
let lockKeys = {};   // 'x,y' -> chaves ja colocadas naquela porta
onLevelLoad(() => { lockKeys = {}; });

defineTile('L', {
  solid: true,
  draw: (T, x, y, sx, sy) => {
    ctx.drawImage(T.lock, sx, sy);
    const n = lockKeys[tkey(x, y)] || 0;
    for (let i = 0; i < n; i++) { R(sx + 3 + i * 6, sy + 1, 4, 3, '#ffd54f'); R(sx + 4 + i * 6, sy + 4, 2, 2, '#ffd54f'); }
  },
});
function lockGroup(x, y) {
  const seen = new Set(), st = [[x, y]], out = [];
  while (st.length) { const [a, b] = st.pop(), k = tkey(a, b); if (seen.has(k) || !M[b] || M[b][a] !== 'L') continue; seen.add(k); out.push([a, b]); st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
  return out;
}
function nearestLock(h) {
  const c = center(h); let best = null, bd = 24;
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (M[ty][tx] === 'L') { const d = dist(c.x, c.y, tx * TS + 8, ty * TS + 8); if (d < bd) { bd = d; best = [tx, ty]; } }
  return best;
}
defineReceiver({
  kind: 'key',
  find: nearestLock,
  place(h, it, [x, y]) {
    const group = lockGroup(x, y), need = (LV.lockNeed && LV.lockNeed[tkey(x, y)]) || 1;
    const n = (lockKeys[tkey(x, y)] || 0) + 1;
    group.forEach(([a, b]) => lockKeys[tkey(a, b)] = n);
    SFX.unlock(); burst(x * TS + 8, y * TS + 8, 10, ['#ffd54f', '#fff'], 50, 0.4);
    if (n >= need) openLocks(group);
    else say(heroName(h) + ' encaixou uma chave! Falta' + (need - n > 1 ? 'm mais ' + (need - n) + ' chaves.' : ' mais uma chave.'));
  },
});
// aviso ao chegar perto de porta trancada sem ninguem carregando chave
function updateLocks() {
  if (heroes.some(h => h.carry && h.carry.kind === 'key')) return;
  for (const h of active()) if (nearestLock(h) && cd('lock', 8)) { say('Uma porta trancada. Tragam uma chave até aqui e apertem o botão de ação.'); return; }
}
function openLocks(group) {
  shakeT = 0.3; SFX.door();
  for (const [a, b] of group) { M[b][a] = '_'; burst(a * TS + 8, b * TS + 8, 12, ['#ffd54f', '#6b4423', '#fff'], 60, 0.5); }
  say('Click! A porta se abriu.');
}
