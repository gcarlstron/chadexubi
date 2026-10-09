'use strict';
// =====================================================================
//  story/dialog.js — caixa de dialogo com efeito de digitacao
//  say(linhas, aoTerminar). Linhas que comecam com "Corvo: ", "Gu: ", "De: "
//  ou "Chefe Orc: " ganham etiqueta com o nome de quem fala.
// =====================================================================
let dlg = null;
const SPEAKERS = { Corvo: '#b0bec5', Gu: '#90caf9', De: '#f8bbd0', 'Chefe Orc': '#aed581' };
const SPEAKER_RE = /^(Corvo|Gu|De|Chefe Orc): /;
const TYPE_CPS = 45; // caracteres por segundo

function say(lines, onDone) {
  if (typeof lines === 'string') lines = [lines];
  if (dlg) { dlg.lines.push(...lines); if (onDone) { const p = dlg.onDone; dlg.onDone = () => { p && p(); onDone(); }; } }
  else dlg = { lines: lines.slice(), i: 0, t: 0, onDone };
}
function updateDialog(dt) {
  const len = dlg.lines[dlg.i].length, before = Math.floor(dlg.t * TYPE_CPS);
  dlg.t += dt; const now = Math.floor(dlg.t * TYPE_CPS);
  if (now > before && before < len && now % 3 === 0) SFX.text();
  if (ui.atkP || ui.stP) {
    if (dlg.t * TYPE_CPS < len) dlg.t = 999; // completa a linha
    else { dlg.i++; dlg.t = 0; if (dlg.i >= dlg.lines.length) { const f = dlg.onDone; dlg = null; inputLock = 0.25; f && f(); } }
  }
}
function drawDialog() {
  R(8, 126, 304, 50, 'rgba(12,18,40,0.94)'); R(8, 126, 304, 1, '#e8e8ff'); R(8, 175, 304, 1, '#e8e8ff'); R(8, 126, 1, 50, '#e8e8ff'); R(311, 126, 1, 50, '#e8e8ff');
  let full = dlg.lines[dlg.i]; const n = Math.floor(dlg.t * TYPE_CPS);
  const m = full.match(SPEAKER_RE);
  if (m) { full = full.slice(m[0].length); const who = m[1], col = SPEAKERS[who]; const w = measure(who, 7) + 10; R(14, 117, w, 11, '#0c1228'); R(14, 117, w, 1, col); txt(who, 19, 118, 7, col); }
  const lines = wrap(full, 8, 288); let left = n;
  lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length + 1; txt(s, 16, 132 + i * 11, 8, '#fff'); });
  if (n >= full.length && Math.floor(time * 3) % 2) tri(300, 166, 306, 166, 303, 170, '#ffd54f');
}
