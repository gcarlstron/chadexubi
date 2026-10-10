'use strict';
// =====================================================================
//  mechanics/items.js — REGISTRO DE ITENS coletaveis
//  defineItem(kind, { draw(it, x, y), pickup(it) })          -> pega so de encostar
//  defineItem(kind, { carry: true, name(it), hint, draw })    -> carregavel (ver carry.js)
//  Itens da fase ficam em LV.items [{kind, x, y, ...}] (x,y = centro em pixels).
//  Coracoes soltos por inimigos ficam em `drops`.
// =====================================================================
const ITEM = {};
function defineItem(kind, def) { ITEM[kind] = def; }
function glow(x, y, c) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 5); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

const RELIC_NAMES = ['a Runa de Odin', 'a Lágrima Élfica', 'o Cálice dos Reis'];
const RELIC_COL = ['#ffd54f', '#4dd0e1', '#ce93d8'];
defineItem('relic', {
  carry: true, name: it => RELIC_NAMES[it.id], hint: 'Levem até o altar no centro do reino e apertem o botão de ação.',
  onPick: it => { flags['relic' + it.id] = true; SFX.relic(); },
  draw: (it, x, y) => { glow(x, y, RELIC_COL[it.id]); drawGem(x, y, RELIC_COL[it.id]); },
});
defineItem('key', {
  carry: true, name: () => 'uma chave', hint: 'Levem até a porta trancada e apertem o botão de ação.',
  draw: (it, x, y) => { glow(x, y, '#ffd54f'); ctx.drawImage(SPR.key, Math.round(x - 5), Math.round(y - 3)); },
});
defineItem('chupeta', {
  draw: (it, x, y) => { glow(x, y, '#fff59d'); ctx.drawImage(SPR.chupeta, Math.round(x - 5), Math.round(y - 5)); },
  pickup: () => { chupetas++; SFX.secret(); say('Uma CHUPETA DOURADA secreta! Guardem bem... o bebê vai adorar.'); },
});
defineItem('heartC', {
  draw: (it, x, y) => { glow(x, y, '#ff8a80'); ctx.drawImage(SPR.heartC, Math.round(x - 4), Math.round(y - 3)); },
  pickup: () => { maxH++; hearts = maxH; SFX.secret(); say('Um Coração Dourado! Gu e De ganharam mais um coração!'); },
});
defineItem('scroll', {
  draw: (it, x, y) => { glow(x, y, '#fff8e1'); ctx.drawImage(SPR.scroll, Math.round(x - 6), Math.round(y - 5)); },
  pickup: () => { SFX.relic(); LV.onScroll && LV.onScroll(); },
});

function updatePickups(dt) {
  for (const h of active()) {
    const b = hb(h);
    for (const it of items) {
      if (it.taken || ITEM[it.kind].carry || !overlap(b, { x: it.x - 9, y: it.y - 7, w: 18, h: 16 })) continue;
      it.taken = true; burst(it.x, it.y, 20, ['#ffd54f', '#fff'], 70, 0.6);
      ITEM[it.kind].pickup(it);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (overlap(b, { x: d.x, y: d.y, w: 8, h: 8 })) { hearts = Math.min(maxH, hearts + 1); SFX.heart(); drops.splice(i, 1); }
    }
  }
  for (let i = drops.length - 1; i >= 0; i--) { drops[i].t += dt; if (drops[i].t > 12) drops.splice(i, 1); }
}
function drawItems(cx, cy) {
  for (const it of items) if (!it.taken) ITEM[it.kind].draw(it, it.x - cx, it.y - cy + Math.sin(time * 3 + it.x) * 2);
  for (const d of drops) { if (d.t > 9 && Math.floor(time * 10) % 2) continue; ctx.drawImage(SPR.heart, Math.round(d.x - cx), Math.round(d.y - cy + Math.sin(d.t * 5))); }
}
