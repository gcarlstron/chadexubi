'use strict';
// =====================================================================
//  mechanics/plates.js — placas de pressao 'P' e grades 'G'
//  LV.plates {'x,y': grupo}, LV.gates {'x,y': grupo}
//  LV.gateRules[grupo].mode:
//    'hold' -> aberta enquanto alguem estiver numa placa do grupo (ou flags[rule.flag])
//    'all'  -> todas as placas do grupo apertadas juntas: abre de vez
//    'flag' -> abre quando flags[rule.flag] for true (ex.: combo)
//  A grade nunca fecha em cima de um heroi.
// =====================================================================
let pressed = {}, gateWasOpen = {};
onLevelLoad(() => { pressed = {}; gateWasOpen = {}; });

defineTile('P', { img: (T, x, y) => T.plate[pressed[tkey(x, y)] ? 1 : 0] });
defineTile('G', {
  solid: (x, y) => !gateOpen(LV.gates[tkey(x, y)], x, y),
  img: (T, x, y) => gateOpen(LV.gates[tkey(x, y)], x, y) ? T.floor : T.gate,
});
function gateOpen(group, tx, ty) {
  const r = LV.gateRules[group]; if (!r) return false;
  if (r.flag && flags[r.flag]) return true;
  if (r.mode === 'hold' && Object.keys(LV.plates).some(k => LV.plates[k] === group && pressed[k])) return true;
  if (r.mode === 'all' && flags['all_' + group]) return true;
  // so continua aberta se ja estava aberta e tem alguem embaixo (nao esmaga ninguem)
  if (!gateWasOpen[tkey(tx, ty)]) return false;
  const g = { x: tx * TS, y: ty * TS, w: TS, h: TS };
  return heroes.some(h => overlap(hb(h), g));
}
function updatePlates() {
  pressed = {};
  for (const h of heroes) { const [tx, ty] = heroTile(h); if (M[ty][tx] === 'P') pressed[tkey(tx, ty)] = true; }
  for (const k in LV.gates || {}) { const [x, y] = unkey(k); gateWasOpen[k] = M[y][x] === 'G' && gateOpen(LV.gates[k], x, y); }
  for (const g in LV.gateRules || {}) {
    const r = LV.gateRules[g];
    if (r.mode === 'all' && !flags['all_' + g]) {
      const ks = Object.keys(LV.plates).filter(k => LV.plates[k] === g);
      if (ks.length && ks.every(k => pressed[k])) { flags['all_' + g] = true; SFX.door(); shakeT = 0.4; say('As duas placas afundaram juntas... o portão se abriu de vez!'); }
    }
  }
}
