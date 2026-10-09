'use strict';
// =====================================================================
//  gfx/sprites.js — sprites em pixel art (texto -> canvas)
//  Cada letra = uma cor de PAL; '.' = transparente.
//  Variantes geradas: <nome>L (virado p/ esquerda), <nome>W (branco, flash de dano)
// =====================================================================
const PAL = {
  k: '#1a1a2e', s: '#f2c39b', S: '#d49a6a', h: '#d9772b', H: '#a8501a', g: '#c8d0d8', G: '#7a8490', w: '#f4ead2',
  b: '#3a6fd8', B: '#23468f', n: '#7a4a2a', N: '#4f2e18', y: '#f5d76e', Y: '#c9a640', p: '#e85a9c', P: '#a83470',
  e: '#4caf50', E: '#2e7d32', W: '#ffffff', r: '#e53935', v: '#7e57c2', V: '#4527a0', c: '#263238', C: '#455a64', o: '#ffb300',
  q: '#8bc34a', Q: '#558b2f', u: '#795548', U: '#4e342e', m: '#9e9e9e', i: '#64b5f6', I: '#1e88e5',
};
function mkSprite(rows, pal = PAL) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((row, j) => { [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }); });
  return c;
}
function flipC(c) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; }
function whiteC(c) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return f; }
function scaleC(c, k) { const f = document.createElement('canvas'); f.width = c.width * k; f.height = c.height * k; const x = f.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, f.width, f.height); return f; }

const SPR = {};
SPR.gu = mkSprite([
  '..w..........w..', '..ww.kkkkkk.ww..', '...wkggggggkw...', '....kGGGGGGk....', '....kssssssk....', '....kskssksk....',
  '....khsssshk....', '...khhhhhhhhk...', '..kbbkhhhhkbbk..', '.kbbbbkhhkbbbbk.', '.ksbbbbbbbbbbsk.', '.kskNNNNNNNNksk.',
  '..kkBBBBBBBBkk..', '...kBBBkkBBBk...', '...knnnk.knnnk..', '...kkkkk.kkkkk..']);
SPR.de = mkSprite([
  '................', '.....kkkkkk.....', '....kyyyyyyk....', '...kyyyyyyyyk...', '..kyyssssssyyk..', '.skyskssssksyks.',
  '..kysssppsssyk..', '..kyyksssskyyk..', '.kyypkeeeekpyyk.', '.kyppeeeeeeppyk.', '.kppseeeeeespPk.', '.kpPkNNNNNNkpPk.',
  '..kPPEEEEEEPPk..', '...kPEEkkEEPk...', '....knnk.knnk...', '....kkkk.kkkk...']);
const SLIME = ['................', '................', '................', '................', '................', '................',
  '......kkkk......', '....kkeeeekk....', '...keeeeeeeek...', '..keeWeeeeWeek..', '..keekeeeekeek..', '.keeeeeeeeeeeek.',
  '.keEEEEEEEEEEek.', '.kEEEEEEEEEEEEk.', '..kkkkkkkkkkkk..', '................'];
SPR.slime = mkSprite(SLIME);
SPR.slimeI = mkSprite(SLIME, Object.assign({}, PAL, { e: '#81d4fa', E: '#0288d1' }));
SPR.slimeF = mkSprite(SLIME, Object.assign({}, PAL, { e: '#ff8a65', E: '#d84315' }));
SPR.skel = mkSprite([
  '................', '.....kkkkkk.....', '....kWWWWWWk....', '...kWWWWWWWWk...', '...kWkkWWkkWk...', '...kWkrWWkrWk...',
  '...kWWWkkWWWk...', '....kWkWkWkk....', '.....kkkkkk.....', '...kkWkWWkWkk...', '..kW.kWWWWk.Wk..', '..kW.kWkkWk.Wk..',
  '.....kWWWWk.....', '.....kWkkWk.....', '.....kWk.kWk....', '....kkkk.kkkk...']);
const ORC = [
  '................', '.....kkkkkk.....', '....kQQQQQQk....', '...kQqqqqqqQk...', '...kqrkqqkrqk...', '...kqqqqqqqqk...',
  '...kqWkkkkWqk...', '....kqqqqqqk....', '..kUUkqqqqkUUk..', '.kUuuUkkkkUuuUk.', '.kqUuuuuuuuuUqk.', '.kqkUUUUUUUUkqk.',
  '..kkUuuuuuuUkk..', '...kUuukkuuUk...', '...kUUk..kUUk...', '...kkkk..kkkk...'];
SPR.orc = mkSprite(ORC);
SPR.boss = scaleC(mkSprite(ORC, Object.assign({}, PAL, { q: '#7cb342', Q: '#33691e', u: '#5d4037', U: '#3e2723' })), 2);
SPR.bat = mkSprite([
  '................', '................', '................', '................', '................',
  'kvvk...kk...kvvk', 'kvvvk.kvvk.kvvvk', '.kvvvkvrrvkvvvk.', '..kvvvvvvvvvvk..', '...kk.kvvk.kk...', '.......kk.......',
  '................', '................', '................', '................', '................']);
SPR.crow = mkSprite([
  '................', '................', '................', '......kkkk......', '.....kcccck.....', '....kcWkccck....',
  '..ookccccccck...', '....kcccccccck..', '...kcCCCCccccck.', '..kcCCCCCCcccck.', '...kCCCCCCccck..', '....kkkkkkkkk...',
  '.....o..o.......', '................', '................', '................']);
SPR.heart = mkSprite(['.kk.kk.', 'krrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...']);
SPR.heartE = mkSprite(['.kk.kk.', 'k..k..k', 'k.....k', '.k...k.', '..k.k..', '...k...']);
SPR.heartC = mkSprite(['.oo..oo.', 'orrooRro', 'orrrrrro', 'orrrrrro', '.orrrro.', '..orro..', '...oo...'], Object.assign({}, PAL, { R: '#ffcdd2' }));
SPR.key = mkSprite(['..kkk.....', '.koook....', 'kook.ok...', 'kok..okkkk', 'kook.ooooo', '.koooko.ok', '..kkk.k..k'], Object.assign({}, PAL, { o: '#ffd54f' }));
SPR.chupeta = mkSprite(['...kkkk...', '..kWWWWk..', '..kW..Wk..', '...kWWk...', 'kkkkWWkkkk', 'kppppppppk', 'kpPpWWpPpk', '.kppppppk.', '..kkWWkk..', '....kk....'], Object.assign({}, PAL, { p: '#ffd54f', P: '#f9a825' }));
SPR.scroll = mkSprite(['.kkkkkkkkkk.', 'kwwwwwwwwwwk', 'kNwwwwwwwwNk', '.kwkkkkkwwk.', '.kwwwwwwwwk.', '.kwkkkkwwwk.', '.kwwwwwwwwk.', 'kNwwwwwwwwNk', 'kwwwwwwwwwwk', '.kkkkkkkkkk.']);
for (const k of ['gu', 'de', 'slime', 'slimeI', 'slimeF', 'skel', 'orc', 'bat', 'crow', 'boss']) { SPR[k + 'L'] = flipC(SPR[k]); SPR[k + 'W'] = whiteC(SPR[k]); SPR[k + 'LW'] = whiteC(SPR[k + 'L']); }

