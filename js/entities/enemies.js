'use strict';
// =====================================================================
//  entities/enemies.js — REGISTRO DE INIMIGOS
//  defineEnemy(tipo, {
//    hp, sp (velocidade), chase (raio de perseguicao), fly (voa sobre agua/lava),
//    sprite (nome em SPR), cols (cores ao morrer),
//    // opcionais (ver entities/boss.js): update, damage, draw, hb, body, center, contact
//  })
//  Nas fases: enemies: [['orc', 10, 5], ...]
// =====================================================================
const ENEMY = {};
function defineEnemy(type, def) { ENEMY[type] = Object.assign({ sprite: type, cols: ['#fff', '#cfd8dc'] }, def); }
let enemies = [];
onLevelLoad(() => { enemies = []; });

defineEnemy('slime', { hp: 2, sp: 20, cols: ['#4caf50', '#81c784'] });
defineEnemy('slimeI', { hp: 2, sp: 22, cols: ['#81d4fa', '#e1f5fe'] });   // gelo
defineEnemy('slimeF', { hp: 3, sp: 22, cols: ['#ff8a65', '#ffccbc'] });   // fogo
defineEnemy('skel', { hp: 3, sp: 30, chase: 95 });
defineEnemy('orc', { hp: 4, sp: 34, chase: 110, cols: ['#8bc34a', '#795548'] });
defineEnemy('bat', { hp: 1, sp: 46, chase: 120, fly: true, cols: ['#7e57c2', '#b39ddb'] });

function spawn(type, tx, ty) {
  const d = ENEMY[type];
  const e = { type, x: tx * TS, y: ty * TS, hp: d.hp, max: d.hp, t: rnd(), dx: 0, dy: 0, flash: 0, kb: null, face: 1 };
  if (!d.fly && blocked(e)) return null;
  enemies.push(e); return e;
}
function nearestHero(c) { let best = null, bd = 1e9; for (const h of active()) { const hc = center(h), d = dist(c.x, c.y, hc.x, hc.y); if (d < bd) { bd = d; best = h; } } return [best, bd]; }

// IA padrao: vaga aleatoriamente; persegue se tiver `chase`; morcego zigue-zagueia
function defaultEnemyUpdate(e, h, d, dt) {
  const def = ENEMY[e.type], ec = center(e), hc = center(h);
  e.t -= dt;
  if (def.chase && d < def.chase && d > 0) {
    e.dx = (hc.x - ec.x) / d; e.dy = (hc.y - ec.y) / d;
    if (def.fly) { e.dx += Math.sin(time * 6 + e.x) * 0.8; e.dy += Math.cos(time * 5 + e.y) * 0.8; }
  } else if (e.t <= 0) { e.t = 0.8 + rnd() * 1.4; if (rnd() < 0.3) { e.dx = 0; e.dy = 0; } else { const a = rnd() * Math.PI * 2; e.dx = Math.cos(a); e.dy = Math.sin(a); } }
  if (e.dx) e.face = Math.sign(e.dx);
  tryMove(e, e.dx * def.sp * dt, e.dy * def.sp * dt);
}
function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    const def = ENEMY[e.type], ec = center(e);
    if (!def.alwaysActive && (Math.abs(ec.x - (cam.x + VW / 2)) > 260 || Math.abs(ec.y - (cam.y + VH / 2)) > 180)) continue; // longe da tela: dorme
    e.flash -= dt;
    if (e.kb) { tryMove(e, e.kb.vx * dt, 0); tryMove(e, 0, e.kb.vy * dt); e.kb.t -= dt; if (e.kb.t <= 0) e.kb = null; continue; }
    const [h, d] = nearestHero(ec); if (!h) continue;
    (def.update || defaultEnemyUpdate)(e, h, d, dt);
    const contact = def.contact ? def.contact(e) : { x: e.x + 3, y: e.y + 7, w: 10, h: 8 };
    for (const hh of active()) if (overlap(hb(hh), contact)) hurtHero(hh, e);
  }
  enemies = enemies.filter(e => !e.dead);
}
function damageEnemy(e, from, byArrow) {
  const def = ENEMY[e.type];
  if (def.damage) return def.damage(e, from, byArrow);
  e.hp -= 1; e.flash = 0.15; SFX.hit();
  const c = center(e), a = Math.atan2(c.y - from.y, c.x - from.x);
  e.kb = { vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, t: 0.15 };
  burst(c.x, c.y, 5, ['#fff', '#ffeb3b'], 50, 0.25);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  const c = center(e), def = ENEMY[e.type]; e.dead = true; SFX.kill();
  burst(c.x, c.y, 16, def.cols.concat(['#fff']), 70, 0.5);
  if (hearts < maxH && rnd() < 0.45) drops.push({ x: c.x - 4, y: c.y - 4, t: 0 });
}
function drawEnemy(e, sx, sy) {
  const def = ENEMY[e.type];
  if (def.draw) return def.draw(e, sx, sy);
  R(sx + 3, sy + 14, 10, 2, 'rgba(0,0,0,0.3)');
  const sq = e.type.startsWith('slime') ? Math.floor(time * 4 + e.x) % 2 : 0;
  const lift = def.fly ? 4 + Math.round(Math.sin(time * 12 + e.x) * 2) : 0;
  ctx.drawImage(SPR[def.sprite + (e.face < 0 ? 'L' : '') + (e.flash > 0 ? 'W' : '')], sx, sy + sq - lift);
}
