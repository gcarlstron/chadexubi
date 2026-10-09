'use strict';
// =====================================================================
//  ui/screens.js — tela de titulo (menu), pausa e tela da revelacao
// =====================================================================
const MENU_OPTS = ['1 JOGADOR  (um controle, trocando)', '2 JOGADORES  (Gu: controle / De: teclado)', '2 JOGADORES  (De: controle / Gu: teclado)'];

function drawTitle() {
  ctx.fillStyle = 'rgba(5,8,25,0.6)'; ctx.fillRect(0, 0, VW, VH);
  txt('O DESAFIO DAS', VW / 2, 12, 12, '#ffd54f', 'center', '#3e2723');
  txt('DUAS TORRES', VW / 2, 27, 20, '#ffffff', 'center', '#1a1a2e');
  ctx.drawImage(SPR.gu, VW / 2 - 30, 60 - Math.abs(Math.sin(time * 4)) * 3); ctx.drawImage(SPR.deL, VW / 2 + 14, 60 - Math.abs(Math.sin(time * 4 + 1)) * 3);
  txt('&', VW / 2, 64, 9, '#fff', 'center', '#000');
  MENU_OPTS.forEach((o, i) => { const sel = i === menuSel; if (sel) R(28, 94 + i * 16, VW - 56, 13, 'rgba(255,213,79,0.18)'); txt((sel ? '> ' : '  ') + o, VW / 2, 96 + i * 16, 7, sel ? '#ffd54f' : '#c5cae9', 'center', '#000'); });
  if (Math.floor(time * 2) % 2) txt('Escolha com o direcional e aperte A', VW / 2, 148, 7, '#fff', 'center', '#000');
  if (RESULT === null) txt('(sem segredo.js: o final ficará trancado)', VW / 2, 166, 5, '#ffab91', 'center', '#000');
  else if (params.get('teste')) txt('MODO TESTE: ' + params.get('teste'), VW / 2, 166, 5, '#ffab91', 'center', '#000');
}
function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, VW, VH);
  txt('PAUSA', VW / 2, 22, 16, '#ffd54f', 'center', '#000');
  const L1 = mode === 1 ? ['Controle: analógico anda, A/B ataca, Y/X troca de herói', 'Teclado: setas/WASD, Espaço ataca, Q troca'] :
    ['Controle: analógico anda, A/B ataca, Y/X chama o parceiro', 'Teclado: setas anda, K/Enter ataca, L chama o parceiro'];
  L1.concat(['Gu: machado quebra pedras, arbustos e paredes rachadas', 'De: flecha acerta cristais e quebra escudos mágicos', 'START / Esc: continuar']).forEach((s, i) => txt(s, VW / 2, 56 + i * 15, 6, '#fff', 'center'));
  txt('Chupetas douradas: ' + chupetas + '/' + TOTAL_CHUPETAS, VW / 2, 150, 7, '#fff59d', 'center');
}
function drawReveal() {
  const boy = RESULT === 0;
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#060818'); g.addColorStop(1, boy ? '#15306b' : '#5a1a48'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const sr = mulberry(9); for (let i = 0; i < 60; i++) { const x = sr() * VW | 0, y = sr() * 120 | 0; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + i)); R(x, y, 1, 1, '#fff'); } ctx.globalAlpha = 1;
  for (const p of parts) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.8)); R(p.x, p.y, p.size, p.size, p.col); } ctx.globalAlpha = 1;
  for (const f of fireworks) R(f.x, f.y, 1, 3, '#fff8e1');
  ctx.save(); ctx.globalAlpha = 0.9; drawTower(boy ? 0 : 1, VW / 2 - 40, 64, true); ctx.restore();
  R(0, 158, VW, 22, '#3f7a2c'); R(0, 158, VW, 2, '#5aa83c');
  const jb = o => Math.abs(Math.sin(time * 5 + o)) * 10;
  ctx.drawImage(SPR.gu, VW / 2 - 60, 143 - jb(0)); ctx.drawImage(SPR.deL, VW / 2 + 44, 143 - jb(1.2));
  drawBaby(VW / 2, 146 - Math.abs(Math.sin(time * 3)) * 3, boy ? '#64b5f6' : '#f48fb1', boy ? '#1e88e5' : '#ec407a');
  if (revealT > 1.0) { const k = Math.min(1, (revealT - 1.0) / 0.5), sc = 1 + 0.25 * Math.sin(k * Math.PI) + 0.03 * Math.sin(time * 4); txt(boy ? 'É MENINO!' : 'É MENINA!', VW / 2, 18, 28 * sc, boy ? '#64b5f6' : '#f48fb1', 'center', '#fff'); }
  if (revealT > 2.5) txt(boy ? 'Um pequeno guerreiro de Valhala está a caminho!' : 'Uma pequena guerreira de Lothlórien está a caminho!', VW / 2, 52, 7, '#fff', 'center', '#000');
  if (revealT > 4) txt('Chupetas douradas encontradas: ' + chupetas + '/' + TOTAL_CHUPETAS, VW / 2, 166, 6, '#fff59d', 'center', '#000');
}
