'use strict';
// =====================================================================
//  mechanics/carry.js — itens CARREGAVEIS (chaves, reliquias)
//  Nao vao para inventario: o heroi pega com o botao de acao, leva o item
//  em cima da cabeca e coloca no lugar certo (so quem carrega pode colocar).
//  Cada heroi carrega UM item por vez. Carregando, o botao de acao
//  coloca no receptor proximo ou solta no chao (nao ataca).
//
//  Receptores: defineReceiver({ kind, find(h) -> alvo|null, place(h, item, alvo) })
//  A fase tambem pode ter LV.receivers = [ ...mesmo formato... ].
//  Itens carregaveis: defineItem(kind, { carry: true, name, hint, draw })
// =====================================================================
const RECEIVERS = [];
function defineReceiver(r) { RECEIVERS.push(r); }
onLevelLoad(() => { heroes.forEach(h => { h.carry = null; }); });

function carriableNear(h) {
  const c = center(h);
  let best = null, bd = 20;
  for (const it of items) {
    if (it.taken || !ITEM[it.kind].carry) continue;
    const d = dist(c.x, c.y, it.x, it.y);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}
function receiverFor(h) {
  if (!h.carry) return null;
  for (const r of RECEIVERS.concat(LV.receivers || [])) {
    if (r.kind !== h.carry.kind) continue;
    const t = r.find(h); if (t) return { r, t };
  }
  return null;
}
function pickUp(h, it) {
  it.taken = true; h.carry = it; SFX.key(); burst(it.x, it.y, 12, ['#ffd54f', '#fff'], 50, 0.4);
  const def = ITEM[it.kind];
  if (def.onPick) def.onPick(it, h);
  if (!it.seen) { it.seen = true; say(heroName(h) + ' pegou ' + def.name(it) + '! ' + def.hint); }
}
function placeOrDrop(h) {
  const it = h.carry, rv = receiverFor(h);
  if (rv) { h.carry = null; rv.r.place(h, it, rv.t); return; }
  // solta no chao, na frente do heroi (se for lugar livre)
  const c = center(h); let x = c.x + h.fx * 12, y = c.y + h.fy * 12;
  if (solidAt(Math.floor(x / TS), Math.floor(y / TS))) { x = c.x; y = c.y; }
  it.x = x; it.y = y; it.taken = false; h.carry = null; SFX.sw();
}
// chamado pelo botao de acao; retorna true se usou o botao (nao ataca)
function tryCarryAction(h) {
  if (h.carry) { placeOrDrop(h); return true; }
  const it = carriableNear(h);
  if (it) { pickUp(h, it); return true; }
  return false;
}
// mostra o botao "A" em cima do heroi quando da para interagir
function canInteract(h) { return !!(h.carry ? receiverFor(h) : (carriableNear(h) || signInFront(h))); }
function drawCarried(h, sx, sy) {
  if (!h.carry) return;
  ITEM[h.carry.kind].draw(h.carry, sx + 8, sy - 7);
}
