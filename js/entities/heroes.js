'use strict';
// =====================================================================
//  entities/heroes.js — Gu (viking, machado) e De (elfa, arco)
//  Modo 1: um heroi ativo (lead); o outro segue o rastro (trail) ou espera numa placa.
//  Modo 2: os dois andam ao mesmo tempo; o botao de troca "chama" o parceiro.
//  Para mudar o que cada heroi faz no ataque, veja HERO_ATTACK.
// =====================================================================
const heroes = [
  { name: 'GU', key: 'gu', x: 0, y: 0, fx: 0, fy: -1, face: 1, walk: 0, atk: 0, cd: 0, anchored: false, kb: null },
  { name: 'DE', key: 'de', x: 0, y: 0, fx: 0, fy: -1, face: -1, walk: 0, atk: 0, cd: 0, anchored: false, kb: null },
];
let lead = 0, trail = [], arrows = [];
const HERO_SPEED = 74;
const L = () => heroes[lead];
const F = () => heroes[1 - lead];
const partner = h => heroes[1 - heroes.indexOf(h)];
const active = () => mode === 1 ? [L()] : heroes;   // herois que interagem com o mundo
const heroName = h => h.name === 'GU' ? 'Gu' : 'De';
function anyNear(x, y, r) { return active().some(h => { const c = center(h); return dist(c.x, c.y, x, y) < r; }); }
function anyIn(x0, y0, x1, y1) { return active().find(h => { const [tx, ty] = heroTile(h); return tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1; }); }
onLevelLoad(() => { arrows = []; });

function placeHeroes(pts) {
  heroes.forEach((h, i) => { h.x = pts[i][0] * TS; h.y = pts[i][1] * TS; h.anchored = false; h.kb = null; h.atk = 0; });
  trail = [];
}

// ---------------- ataques ----------------
const HERO_ATTACK = {
  gu: { anim: 0.22, cooldown: 0.32, run: axeHit },
  de: { anim: 0.18, cooldown: 0.36, run: shootArrow },
};
function axeHit(h) {
  const c = center(h); const box = { x: c.x + h.fx * 12 - 9, y: c.y + h.fy * 12 - 9, w: 18, h: 18 };
  let any = false;
  for (const e of enemies) if (!e.dead && overlap(box, body(e))) { damageEnemy(e, c, false); any = true; }
  // tile com acao de machado mais proximo da frente do heroi
  const tx0 = Math.floor(box.x / TS), tx1 = Math.floor((box.x + box.w) / TS), ty0 = Math.floor(box.y / TS), ty1 = Math.floor((box.y + box.h) / TS);
  let best = null;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (!M[ty] || !M[ty][tx] || !tileDef(tx, ty).axe) continue;
    const d = dist(tx * TS + 8, ty * TS + 8, c.x + h.fx * 12, c.y + h.fy * 12);
    if (!best || d < best[2]) best = [tx, ty, d];
  }
  if (best) { tileDef(best[0], best[1]).axe(best[0], best[1], h); any = true; }
  if (!any) SFX.swing();
}
function shootArrow(h) {
  const c = center(h); SFX.arrow();
  let fx = h.fx, fy = h.fy; if (!fx && !fy) fx = h.face;
  arrows.push({ x: c.x, y: c.y - 2, vx: fx * 200, vy: fy * 200, t: 0.8 });
}
function updateArrows(dt) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i]; a.t -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
    let dead = a.t <= 0 || arrowHitsCrystal(a);
    if (!dead) for (const e of enemies) if (!e.dead && overlap({ x: a.x - 3, y: a.y - 3, w: 6, h: 6 }, body(e))) { damageEnemy(e, { x: a.x - a.vx, y: a.y - a.vy }, true); dead = true; break; }
    if (!dead) {
      const tx = Math.floor(a.x / TS), ty = Math.floor(a.y / TS);
      if (M[ty] && M[ty][tx] && solidAt(tx, ty) && !tileDef(tx, ty).liquid) {
        dead = true; SFX.tink(); burst(a.x, a.y, 4, ['#fff', '#bcaaa4'], 40, 0.2);
        if (tileDef(tx, ty).arrowHint && !flags.hintArrow) { flags.hintArrow = 1; say('As flechas de De não quebram isso... é trabalho para o machado do Gu!'); }
      }
    }
    if (dead) arrows.splice(i, 1);
  }
}

// ---------------- troca / chamar / dano ----------------
function switchHero() {
  const old = L(); const [tx, ty] = heroTile(old);
  old.anchored = M[ty][tx] === 'P';           // quem fica numa placa espera la
  lead = 1 - lead; L().anchored = false; trail = [];
  const n = L(), o = F();
  if (!o.anchored && dist(n.x, n.y, o.x, o.y) > 140) { burst(o.x + 8, o.y + 8, 10, ['#fff', '#ffd54f']); o.x = n.x; o.y = n.y; }
  SFX.sw(); burst(n.x + 8, n.y + 4, 8, ['#fff', n.key === 'gu' ? '#90caf9' : '#f48fb1'], 40, 0.4);
  if (o.anchored) showToast(heroName(o) + ' ficou esperando na placa');
}
function callPartner(h) {
  const o = partner(h);
  burst(o.x + 8, o.y + 8, 12, ['#fff', '#ffd54f']); o.x = h.x; o.y = h.y; o.kb = null; burst(o.x + 8, o.y + 8, 12, ['#fff', '#ffd54f']);
  SFX.sw(); showToast(heroName(o) + ' veio correndo!');
}
function hurtHero(h, src) {
  if (inv > 0 || state !== 'play') return;
  hearts--; inv = 1.2; SFX.hurt(); shakeT = 0.2;
  const c = center(h), s = center(src); const a = Math.atan2(c.y - s.y, c.x - s.x);
  h.kb = { vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, t: 0.15 };
  if (hearts <= 0) { state = 'faint'; fade = 0; fadeCol = '0,0,0'; later(1.6, respawn); }
}
function respawn() {
  hearts = maxH; inv = 1.5; placeHeroes(LV.respawnPt);
  state = 'play'; fade = 1;
  say('Gu e De descansaram um pouquinho... e voltaram com tudo!');
}

// ---------------- movimento ----------------
function moveHero(h, c, dt) {
  if (h.kb) { tryMove(h, h.kb.vx * dt, 0); tryMove(h, 0, h.kb.vy * dt); h.kb.t -= dt; if (h.kb.t <= 0) h.kb = null; }
  let mx = c.mx || 0, my = c.my || 0;
  if (inputLock > 0) { mx = 0; my = 0; }
  if (mx || my) {
    const n = Math.hypot(mx, my), sp = HERO_SPEED * dt;
    if (Math.abs(mx) >= Math.abs(my)) { h.fx = Math.sign(mx); h.fy = 0; } else { h.fy = Math.sign(my); h.fx = 0; }
    if (mx) h.face = Math.sign(mx);
    const ox = h.x, oy = h.y;
    tryMove(h, mx / n * sp, my / n * sp);
    if (mode === 2) { // um nao pode sair da tela do outro
      const o = partner(h);
      const spread = (a, b) => Math.max(Math.abs(a.x - b.x) - (VW - 40), Math.abs(a.y - b.y) - (VH - 44));
      if (spread(h, o) > 0 && spread(h, o) > spread({ x: ox, y: oy }, o)) { h.x = ox; h.y = oy; }
    }
    if (h.x !== ox || h.y !== oy) { h.walk += dt; if (mode === 1) { trail.push({ x: h.x, y: h.y, face: h.face }); if (trail.length > 80) trail.shift(); } }
    else h.walk = 0;
  } else h.walk = 0;
  h.cd -= dt; h.atk -= dt;
  if (c.atkP && inputLock <= 0) {
    // botao de acao: carregar/colocar item > ler placa > atacar
    if (tryCarryAction(h) || tryReadSign(h)) { h.cd = 0.25; }
    else if (h.cd <= 0) { const A = HERO_ATTACK[h.key]; h.atk = A.anim; h.cd = A.cooldown; A.run(h); }
  }
  if (c.swP && inputLock <= 0) { if (mode === 1) switchHero(); else callPartner(h); }
}
function followLeader(dt) {
  const f = F(), h = L();
  if (f.anchored) { f.walk = 0; return; }
  const LAG = 16;
  if (trail.length > LAG) {
    const p = trail[trail.length - 1 - LAG], d = dist(f.x, f.y, p.x, p.y);
    if (d > 0.5) { const sp = Math.min(d, 130 * dt); f.x += (p.x - f.x) / d * sp; f.y += (p.y - f.y) / d * sp; f.walk += dt; f.face = p.face; } else f.walk = 0;
  } else f.walk = 0;
  if (dist(f.x, f.y, h.x, h.y) > 160) { f.x = h.x; f.y = h.y; trail = []; }
}
function updateHeroes(dt) {
  if (mode === 1) { moveHero(L(), hin[lead], dt); followLeader(dt); }
  else heroes.forEach((h, i) => moveHero(h, hin[i], dt));
}

// ---------------- desenho ----------------
function drawHero(h, sx, sy) {
  const bob = h.walk > 0 ? (Math.floor(h.walk * 8) % 2) : 0;
  R(sx + 3, sy + 14, 10, 2, 'rgba(0,0,0,0.3)');
  if (inv > 0 && Math.floor(time * 20) % 2 && active().includes(h)) return;
  ctx.drawImage(SPR[h.key + (h.face < 0 ? 'L' : '')], sx, sy - bob);
  if (h.key === 'gu') {
    if (h.atk > 0) {
      const c = { x: sx + 8 + h.fx * 11, y: sy + 9 + h.fy * 11 };
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
      const base = Math.atan2(h.fy, h.fx || (h.fy ? 0 : h.face)); const p = 1 - h.atk / HERO_ATTACK.gu.anim;
      ctx.arc(sx + 8, sy + 9, 12, base - 1.2, base - 1.2 + 2.4 * p); ctx.stroke();
      R(c.x - 3, c.y - 3, 6, 6, '#b0bec5'); R(c.x - 2, c.y - 2, 4, 4, '#eceff1');
    } else { const ax = h.face > 0 ? sx + 13 : sx - 1; R(ax, sy + 6 - bob, 2, 8, '#6d4424'); R(ax - 1 + (h.face > 0 ? 1 : -1), sy + 5 - bob, 4, 4, '#b0bec5'); }
  } else {
    const ax = h.face > 0 ? sx + 13 : sx; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ax + 1, sy + 9 - bob, 5, h.face > 0 ? -1.3 : 1.84, h.face > 0 ? 1.3 : 4.44); ctx.stroke();
  }
  if (h.anchored) R(sx + 6, sy - 6, 4, 4, '#ffd54f');
  drawCarried(h, sx, sy - bob);
  if (active().includes(h) && canInteract(h) && state === 'play' && !dlg) { const by = sy - (h.carry ? 22 : 12); R(sx + 4, by, 9, 8, '#fff'); R(sx + 4, by + 8, 9, 1, '#9e9e9e'); txt('A', sx + 8.5, by + 1, 6, '#1a1a2e', 'center'); }
  if (mode === 2) tri(sx + 5, sy - 5, sx + 11, sy - 5, sx + 8, sy - 2, h.key === 'gu' ? '#90caf9' : '#f8bbd0');
}
function drawArrows(cx, cy) {
  for (const a of arrows) { const x = Math.round(a.x - cx), y = Math.round(a.y - cy); if (a.vx) { R(x - 5, y, 10, 1, '#8d6e63'); R(a.vx > 0 ? x + 4 : x - 6, y - 1, 2, 3, '#eceff1'); } else { R(x, y - 5, 1, 10, '#8d6e63'); R(x - 1, a.vy > 0 ? y + 4 : y - 6, 3, 2, '#eceff1'); } }
}
