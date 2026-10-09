'use strict';
// =====================================================================
//  story/cutscene.js — cenas roteirizadas
//  runCut([ passo, passo, ... ]). Cada passo pode ter:
//    do: () => {...}     executa uma vez ao entrar no passo
//    say: [linhas]       mostra dialogo e espera fechar
//    wait: segundos      espera um tempo
//    until: () => bool   espera a condicao (ex.: crowArrived)
//  Durante a cena os herois e inimigos ficam parados.
//  Tambem aqui: o pergaminho na tela (scrollFx) usado na fase 2.
// =====================================================================
let cut = null, scrollFx = null;
onLevelLoad(() => { cut = null; scrollFx = null; });

function runCut(steps) { cut = { steps, i: 0, t: 0, started: false }; state = 'cut'; }
function updateCut(dt) {
  if (dlg) { updateDialog(dt); return; }
  const s = cut.steps[cut.i];
  if (!s) { cut = null; camFocus = null; if (state === 'cut') state = 'play'; return; }
  if (!cut.started) { cut.started = true; cut.t = 0; if (s.do) s.do(); if (s.say) say(s.say); return; }
  cut.t += dt;
  let done = !dlg;
  if (s.wait) done = done && cut.t >= s.wait;
  if (s.until) done = done && s.until();
  if (done) { cut.i++; cut.started = false; }
}

// ---- pergaminho: linha 1 rapida, linha 2 devagar (suspense) ----
function showScroll(line1, line2, cps1 = 14, cps2 = 2.2) { scrollFx = { lines: [line1, line2], t: 0, cps: [cps1, cps2] }; }
function scrollDone() {
  if (!scrollFx) return true;
  const a = scrollFx.lines[0].length / scrollFx.cps[0];
  return scrollFx.t > a + 0.6 + scrollFx.lines[1].length / scrollFx.cps[1];
}
function drawScroll() {
  const x = VW / 2 - 90, y = 26;
  R(x - 4, y - 3, 188, 7, '#8d6e63'); R(x - 4, y + 77, 188, 7, '#8d6e63');
  R(x, y, 180, 80, '#f4ead2'); R(x, y, 180, 2, '#e0d2b4'); R(x, y + 78, 180, 2, '#d7c49e');
  const t = scrollFx.t, a = scrollFx.lines[0], b = scrollFx.lines[1];
  txt(a.slice(0, Math.floor(t * scrollFx.cps[0])), VW / 2, y + 14, 8, '#4e342e', 'center');
  const tb = t - a.length / scrollFx.cps[0] - 0.6;
  if (tb > 0) {
    const nb = Math.min(b.length, Math.floor(tb * scrollFx.cps[1]));
    if (scrollFx.lastB !== nb) { scrollFx.lastB = nb; if (nb > 0) SFX.tick(300 + nb * 60); }
    txt(b.slice(0, nb) + (nb >= b.length && Math.floor(time * 4) % 2 ? '...' : ''), VW / 2, y + 36, 18, '#c62828', 'center');
  }
}
