'use strict';
// =====================================================================
//  mechanics/levers.js — alavanca 'J' (machado do Gu) e o COMBO
//  LV.levers {'x,y': id}  -> ao bater, timedOn[id] = 7s
//  LV.combo {a, b, flag, msg} -> se a e b estiverem acesos juntos, flags[flag] = true
// =====================================================================
defineTile('J', {
  solid: true,
  img: (T, x, y) => T.lever[timedOn[LV.levers[tkey(x, y)]] > 0 ? 1 : 0],
  axe: (x, y) => { const id = LV.levers[tkey(x, y)]; timedOn[id] = TIMED_SECONDS; SFX.unlock(); burst(x * TS + 8, y * TS + 4, 10, ['#ffd54f', '#fff'], 50, 0.4); checkCombo(); },
});
function checkCombo() {
  const c = LV.combo; if (!c || flags[c.flag]) return;
  if (timedOn[c.a] > 0 && timedOn[c.b] > 0) { flags[c.flag] = true; SFX.door(); shakeT = 0.5; say(c.msg); }
  else if (!flags.comboHint) { flags.comboHint = 1; showToast('Rápido! Agora o outro, antes de apagar!', 3); }
}
