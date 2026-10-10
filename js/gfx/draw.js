'use strict';
// =====================================================================
//  gfx/draw.js — primitivas de desenho e figuras grandes (torres, portal, bebe)
//  R/tri desenham no buffer pixel-art; txt() enfileira texto nitido (UI).
// =====================================================================
function R(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function tri(x1, y1, x2, y2, x3, y3, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); }

// ---- texto (desenhado depois, em alta resolucao) ----
const UI = [];
const FONT = '"Lucida Console","Courier New",monospace';
function txt(s, x, y, size = 8, col = '#fff', align = 'left', stroke = null) { UI.push({ s, x, y, size, col, align, stroke }); }
function measure(s, size) { out.font = `bold ${size * S}px ${FONT}`; return out.measureText(s).width / S; }
function wrap(s, size, maxW) { const words = s.split(' '); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
function flushText() {
  for (const u of UI) {
    out.font = `bold ${Math.round(u.size * S)}px ${FONT}`; out.textAlign = u.align; out.textBaseline = 'top';
    const x = OX + u.x * S, y = OY + u.y * S;
    if (u.stroke) { out.lineJoin = 'round'; out.lineWidth = Math.max(2, u.size * S / 5); out.strokeStyle = u.stroke; out.strokeText(u.s, x, y); }
    out.fillStyle = u.col; out.fillText(u.s, x, y);
  }
  UI.length = 0;
}

function drawGem(x, y, col) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < 9; j++) { const w = j < 4 ? j + 1 : 8 - j; R(x - w, y - 4 + j, w * 2, 1, j < 4 ? '#ffffff' : col); }
  R(x - 3, y - 3, 6, 4, col); R(x - 2, y - 2, 1, 2, '#fff');
}
function drawPortal(x, y) {
  for (let i = 0; i < 4; i++) { ctx.strokeStyle = ['#7c4dff', '#b388ff', '#e1bee7', '#fff'][i]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, 7 - i * 1.5 + Math.sin(time * 6 + i) * 0.8), Math.max(1, 7 - i * 1.5), time * 2 + i, 0, Math.PI * 2); ctx.stroke(); }
}
// mood: 'happy' (com chupeta) | 'cry' (chorando, lagrimas) | outro = normal
function drawBaby(x, y, col, col2, mood) {
  x = Math.round(x); y = Math.round(y);
  const shake = mood === 'cry' ? Math.round(Math.sin(time * 30)) : 0; x += shake;
  ctx.fillStyle = col2; ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y + 5, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  disc(ctx, x, y - 2, 5, mood === 'cry' ? '#f4a99b' : '#f2c39b');
  if (mood === 'cry') {
    R(x - 4, y - 3, 3, 1, '#1a1a2e'); R(x + 2, y - 3, 3, 1, '#1a1a2e');                 // olhos apertados
    R(x - 2, y, 4, 3, '#8e2430'); R(x - 1, y + 1, 2, 1, '#e57373');                       // boca aberta
    for (let i = 0; i < 2; i++) { const t = (time * 1.5 + i * 0.5) % 1; R(x - 5 - t * 4, y - 2 + t * 10, 1, 2, '#81d4fa'); R(x + 5 + t * 4, y - 2 + t * 10, 1, 2, '#81d4fa'); } // lagrimas
    if (Math.floor(time * 2) % 4 === 0 && !drawBaby.cried) { drawBaby.cried = true; SFX.cry && SFX.cry(); } else if (Math.floor(time * 2) % 4 !== 0) drawBaby.cried = false;
  } else {
    R(x - 3, y - 2, 2, 1, '#1a1a2e'); R(x + 2, y - 2, 2, 1, '#1a1a2e');
    if (mood === 'happy') { R(x - 3, y + 1, 6, 2, '#ffd54f'); R(x - 1, y + 3, 2, 1, '#f9a825'); R(x - 4, y - 3, 1, 1, '#f48fb1'); R(x + 4, y - 3, 1, 1, '#f48fb1'); } // chupeta dourada + bochechas
    else R(x - 1, y + 1, 2, 1, '#e57373');
  }
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 3, 0, Math.PI, 0); ctx.fill();
}
// Torre 0 = Valhala (azul) | 1 = Lothlorien (rosa). (px,py) = canto do pe da torre (5x6 tiles)
function drawTower(i, px, py, open) {
  const x = Math.round(px), y = Math.round(py);
  R(x + 4, y + 92, 72, 6, 'rgba(0,0,0,0.25)');
  if (i === 0) {
    tri(x + 40, y - 42, x + 4, y + 6, x + 76, y + 6, '#1d3570'); tri(x + 40, y - 42, x + 40, y + 6, x + 76, y + 6, '#16295a');
    R(x + 39, y - 54, 2, 13, '#4f2e18'); R(x + 41, y - 54, 10, 6, '#64b5f6'); R(x + 41, y - 51, 10, 1, '#fff');
    R(x + 8, y + 10, 64, 86, '#3b5ba5'); R(x + 8, y + 10, 5, 86, '#2c4785'); R(x + 67, y + 10, 5, 86, '#5577c4');
    for (let yy = y + 16, r = 0; yy < y + 94; yy += 7, r++) { R(x + 13, yy, 54, 1, '#2f4b8c'); for (let xx = x + 13 + (r % 2) * 6; xx < x + 67; xx += 12) R(xx, yy - 6, 1, 6, '#2f4b8c'); }
    R(x + 4, y + 2, 72, 10, '#4a6cbf'); R(x + 4, y + 11, 72, 2, '#2c4785');
    for (let k = 0; k < 6; k++) R(x + 6 + k * 12, y - 2, 7, 5, '#4a6cbf');
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 40, y + 40, 8, 0, Math.PI * 2); ctx.stroke();
    R(x + 40, y + 30, 1, 20, '#ffd54f'); R(x + 33, y + 40, 15, 1, '#ffd54f');
    R(x + 20, y + 24, 7, 11, '#10183a'); R(x + 53, y + 24, 7, 11, '#10183a'); R(x + 21, y + 25, 5, 3, '#64b5f6'); R(x + 54, y + 25, 5, 3, '#64b5f6');
    R(x + 28, y + 70, 24, 26, '#1a2850');
  } else {
    ctx.fillStyle = '#c2185b'; ctx.beginPath(); ctx.ellipse(x + 40, y + 2, 34, 30, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e85a9c'; ctx.beginPath(); ctx.ellipse(x + 40, y + 2, 30, 27, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.ellipse(x + 30, y - 6, 8, 12, -0.4, 0, Math.PI * 2); ctx.fill();
    tri(x + 40, y - 46, x + 34, y - 24, x + 46, y - 24, '#ffd54f'); R(x + 39, y - 50, 2, 6, '#ffd54f');
    for (const [lx, ly] of [[16, -4], [62, -6], [26, -18], [54, -16]]) { R(x + lx, y + ly, 4, 3, '#4caf50'); R(x + lx + 1, y + ly - 1, 2, 1, '#81c784'); }
    R(x + 8, y + 4, 64, 92, '#efe4ec'); R(x + 8, y + 4, 5, 92, '#d6c1d0'); R(x + 67, y + 4, 5, 92, '#fff7fb');
    for (const by of [14, 52, 88]) { R(x + 8, y + by, 64, 3, '#e85a9c'); R(x + 8, y + by + 3, 64, 1, '#a83470'); }
    for (let k = 0; k < 9; k++) { const vy = y + 18 + k * 8; R(x + 12 + (k % 2) * 2, vy, 2, 4, '#4caf50'); R(x + 64 - (k % 2) * 2, vy + 3, 2, 4, '#4caf50'); }
    ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(x + 40, y + 36, 5, 9, 0.5, 0, Math.PI * 2); ctx.fill(); R(x + 39, y + 30, 1, 14, '#2e7d32');
    ctx.fillStyle = '#7a3b5e'; for (const wx of [24, 56]) { ctx.beginPath(); ctx.ellipse(x + wx, y + 26, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); } R(x + 22, y + 24, 4, 3, '#f8bbd0'); R(x + 54, y + 24, 4, 3, '#f8bbd0');
    ctx.fillStyle = '#a83470'; ctx.beginPath(); ctx.ellipse(x + 40, y + 78, 12, 12, 0, Math.PI, 0); ctx.fill(); R(x + 28, y + 78, 24, 18, '#a83470');
  }
  const dx = x + 32, dy = y + 76;
  if (open) { R(dx, dy, 16, 20, '#05050a'); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 6); R(dx + 2, dy + 2, 12, 18, i === 0 ? '#bbdefb' : '#fce4ec'); ctx.globalAlpha = 1; }
  else { R(dx, dy, 16, 20, i === 0 ? '#6b4423' : '#8d5a8a'); for (let k = 0; k < 4; k++) R(dx + 3 + k * 4, dy, 1, 20, i === 0 ? '#4f2e18' : '#6d3f6a'); R(dx, dy + 5, 16, 2, '#37373f'); R(dx, dy + 14, 16, 2, '#37373f'); R(dx + 12, dy + 10, 2, 2, '#ffd54f'); }
}
