'use strict';
// =====================================================================
//  entities/boss.js — Chefe Orc (fase 3)
//  Ciclo: anda atras do heroi -> pisca vermelho -> investida.
//  A cada 3 golpes levanta ESCUDO: machado nao passa; flecha da De quebra
//  e ele fica tonto 3s (golpes do Gu valem 2 nesse tempo).
//  Ao morrer chama LV.onBossDefeated(e).
// =====================================================================
let boss = null;
onLevelLoad(() => { boss = null; });

defineEnemy('boss', {
  hp: 14, sp: 26, alwaysActive: true, cols: ['#ff7043', '#ffd54f'],
  hb: e => ({ x: e.x + 7, y: e.y + 20, w: 18, h: 10 }),
  body: e => ({ x: e.x + 4, y: e.y + 4, w: 24, h: 26 }),
  center: e => ({ x: e.x + 16, y: e.y + 20 }),
  contact: e => ({ x: e.x + 6, y: e.y + 10, w: 20, h: 20 }),
  update(e, h, d, dt) {
    const ec = center(e), hc = center(h);
    e.face = hc.x < ec.x ? -1 : 1;
    if (e.stun > 0) { e.stun -= dt; return; }
    e.ct = (e.ct || 0) - dt;
    if (e.charge > 0) { e.charge -= dt; tryMove(e, e.cdx * 120 * dt, e.cdy * 120 * dt); return; }
    if (e.tell > 0) { e.tell -= dt; if (e.tell <= 0) { e.charge = 0.7; const dd = dist(ec.x, ec.y, hc.x, hc.y) || 1; e.cdx = (hc.x - ec.x) / dd; e.cdy = (hc.y - ec.y) / dd; SFX.boss(); } return; }
    if (e.ct <= 0) { e.ct = 4 + rnd() * 1.5; e.tell = 0.6; return; }
    const dd = dist(ec.x, ec.y, hc.x, hc.y) || 1;
    tryMove(e, (hc.x - ec.x) / dd * ENEMY.boss.sp * dt, (hc.y - ec.y) / dd * ENEMY.boss.sp * dt);
  },
  damage(e, from, byArrow) {
    const c = center(e);
    if (e.shield) {
      if (byArrow) { e.shield = false; e.stun = 3; e.hitsSinceShield = 0; SFX.break(); shakeT = 0.3; burst(c.x, c.y, 24, ['#80deea', '#fff'], 90, 0.6); showToast('Escudo quebrado! Agora, Gu!', 2.5); }
      else { SFX.shield(); burst(c.x, c.y, 6, ['#80deea', '#fff'], 50, 0.3); if (!flags.hintShield) { flags.hintShield = 1; say('O Chefe Orc está com um escudo mágico! Só uma flecha da De consegue quebrá-lo!'); } }
      return;
    }
    const dmg = e.stun > 0 && !byArrow ? 2 : 1;
    e.hp -= dmg; e.flash = 0.15; SFX.hit(); shakeT = 0.15;
    burst(c.x, c.y, 8, ['#fff', '#ffeb3b'], 60, 0.3);
    if (!(e.stun > 0)) { e.hitsSinceShield = (e.hitsSinceShield || 0) + 1; if (e.hitsSinceShield >= 3 && e.hp > 0) { e.shield = true; SFX.shield(); } }
    if (e.hp <= 0) { e.dead = true; boss = null; LV.onBossDefeated && LV.onBossDefeated(e); }
  },
  draw(e, sx, sy) {
    R(sx + 4, sy + 28, 24, 4, 'rgba(0,0,0,0.35)');
    ctx.drawImage(SPR['boss' + (e.face < 0 ? 'L' : '') + (e.flash > 0 ? 'W' : '')], sx + (e.tell > 0 ? Math.round(rnd() * 2 - 1) : 0), sy);
    R(sx + 9, sy - 3, 14, 3, '#ffd54f'); R(sx + 9, sy - 6, 2, 3, '#ffd54f'); R(sx + 15, sy - 6, 2, 3, '#ffd54f'); R(sx + 21, sy - 6, 2, 3, '#ffd54f'); // coroa
    if (e.tell > 0) { ctx.globalAlpha = 0.4; R(sx, sy, 32, 32, '#f44336'); ctx.globalAlpha = 1; }
    if (e.shield) { ctx.strokeStyle = '#80deea'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time * 10); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 19, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    if (e.stun > 0) for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; R(sx + 16 + Math.cos(a) * 10, sy - 2 + Math.sin(a) * 3, 2, 2, '#ffeb3b'); }
  },
});
function spawnBoss(tx, ty) { const e = { type: 'boss', x: tx * TS, y: ty * TS, hp: ENEMY.boss.hp, max: ENEMY.boss.hp, t: 0, dx: 0, dy: 0, flash: 0, kb: null, face: 1, ct: 2.5 }; enemies.push(e); boss = e; return e; }
