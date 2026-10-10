'use strict';
// =====================================================================
//  ui/hud.js — coracoes, chaves, reliquias, retrato, chefao, avisos
// =====================================================================
function drawHUD() {
  for (let i = 0; i < maxH; i++) ctx.drawImage(i < hearts ? SPR.heart : SPR.heartE, 4 + i * 9, 4);
  // chupetas NAO aparecem no HUD (segredo: so se descobre no final)
  if (LV.n > 1) { ctx.drawImage(SPR.key, 4, 15); txt('x' + keysHeld, 16, 14, 6, '#ffd54f'); }
  if (LV.n === 1) for (let i = 0; i < 3; i++) { const x = VW / 2 - 18 + i * 14; R(x - 1, 2, 12, 12, '#101833'); R(x, 3, 10, 10, '#26305a'); if (flags['relic' + i]) drawGem(x + 5, 8, RELIC_COL[i]); }
  if (mode === 1) {
    const h = L(), f = F();
    R(VW - 64, 2, 62, 20, 'rgba(16,24,51,0.85)'); R(VW - 64, 2, 62, 1, '#e8e8ff');
    ctx.drawImage(SPR[h.key], VW - 62, 4); ctx.globalAlpha = 0.45; ctx.drawImage(SPR[f.key], VW - 19, 4); ctx.globalAlpha = 1;
    txt(h.name, VW - 44, 4, 7, h.key === 'gu' ? '#90caf9' : '#f8bbd0'); txt('Y: troca', VW - 44, 14, 5, '#c5cae9');
  } else {
    R(VW - 74, 2, 72, 20, 'rgba(16,24,51,0.85)'); R(VW - 74, 2, 72, 1, '#e8e8ff');
    ctx.drawImage(SPR.gu, VW - 72, 4); ctx.drawImage(SPR.de, VW - 38, 4);
    txt(padHero === 0 ? 'ctrl' : 'tecl', VW - 55, 9, 5, '#90caf9'); txt(padHero === 0 ? 'tecl' : 'ctrl', VW - 21, 9, 5, '#f8bbd0');
  }
  if (boss) { R(VW / 2 - 60, VH - 14, 120, 8, '#000'); R(VW / 2 - 59, VH - 13, Math.round(118 * Math.max(0, boss.hp) / boss.max), 6, '#e53935'); txt('CHEFE ORC', VW / 2, VH - 24, 6, '#ffcdd2', 'center', '#000'); }
  if (toast) { const w = measure(toast.s, 6) + 10; R(VW / 2 - w / 2, 24, w, 11, 'rgba(16,24,51,0.88)'); txt(toast.s, VW / 2, 26, 6, '#fff', 'center'); }
  if (banner && !dlg) { const a = Math.min(1, banner.t); ctx.globalAlpha = a * 0.8; R(0, 60, VW, 44, '#0b0f24'); ctx.globalAlpha = 1; txt(banner.s1, VW / 2, 64, 9, '#ffd54f', 'center', '#000'); txt(banner.s2, VW / 2, 80, 13, '#fff', 'center', '#000'); }
}
