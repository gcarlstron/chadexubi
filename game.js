'use strict';
// =====================================================================
//  O DESAFIO DAS DUAS TORRES — Gu & De
//  game.js — logica, entrada, cutscenes e render
//  Testes: index.html?teste=menino|menina  &fase=1|2|3
// =====================================================================

// ---------------- segredo ----------------
function lerSegredo() {
  const q = (params.get('teste') || '').toLowerCase();
  if (q === 'menino') return 0;
  if (q === 'menina') return 1;
  const t = window.SEGREDO;
  if (!t || typeof t !== 'string' || t.length !== 32) return null;
  const b = []; for (let i = 0; i < 32; i += 2) b.push(parseInt(t.substr(i, 2), 16));
  let s = 0; for (let i = 0; i < 15; i++) s += b[i];
  const d = ((b[15] - s - 3) % 256 + 512) % 256;
  if (d === 0) return 0;
  if (d === 7) return 1;
  return null;
}
const RESULT = lerSegredo(); // 0 = Valhala (azul), 1 = Lothlorien (rosa)
const TOTAL_CHUPETAS = 5;

// ---------------- estado global ----------------
let LV = null, M = null, W = 0, H = 0;
let state = 'title', paused = false, time = 0, mode = 1, padHero = 0, menuSel = 0;
const cam = { x: 0, y: 0 }; let camFocus = null;
let shakeT = 0, fade = 0, fadeCol = '0,0,0', toast = null, banner = null;
let hearts = 5, maxH = 5, inv = 0, chupetas = 0, keysHeld = 0;
const heroes = [
  { name: 'GU', key: 'gu', x: 0, y: 0, fx: 0, fy: -1, face: 1, walk: 0, atk: 0, cd: 0, anchored: false, kb: null },
  { name: 'DE', key: 'de', x: 0, y: 0, fx: 0, fy: -1, face: -1, walk: 0, atk: 0, cd: 0, anchored: false, kb: null },
];
let lead = 0, trail = [];
let enemies = [], arrows = [], parts = [], drops = [], timers = [], items = [], fireworks = [];
let flags = {}, hits = {}, crystalOn = {}, timedOn = {}, pressed = {}, seqNext = 1;
let relicCount = 0, altarPlaced = false, towersGone = false, towerShake = 0;
let suspense = null, doorOpen = false, revealT = 0;
let signNear = {}, msgCD = {}, inputLock = 0;
let cut = null, crow = null, scrollFx = null, boss = null;
const RELIC_NAMES = ['a Runa de Odin', 'a Lágrima Élfica', 'o Cálice dos Reis'];
const RELIC_COL = ['#ffd54f', '#4dd0e1', '#ce93d8'];

function later(t, fn) { timers.push({ t, fn }); }
function showToast(s, t = 2.5) { toast = { s, t }; }
const L = () => heroes[lead];
const F = () => heroes[1 - lead];
const center = e => e.type === 'boss' ? { x: e.x + 16, y: e.y + 20 } : { x: e.x + 8, y: e.y + 10 };
const active = () => mode === 1 ? [L()] : heroes;
const tkey = (x, y) => x + ',' + y;

// ---------------- carregar fase ----------------
function loadLevel(n) {
  LV = LEVELS[n](); M = LV.M; W = LV.W; H = LV.H;
  enemies = []; arrows = []; drops = []; timers = []; fireworks = [];
  flags = {}; hits = {}; crystalOn = {}; timedOn = {}; pressed = {}; seqNext = 1;
  relicCount = 0; altarPlaced = false; towersGone = false; suspense = null; doorOpen = false; keysHeld = 0;
  cut = null; crow = null; scrollFx = null; boss = null; signNear = {}; msgCD = {}; camFocus = null;
  items = LV.items.map(i => Object.assign({ taken: false }, i));
  for (const [t, x, y] of LV.enemies) spawn(t, x, y);
  placeHeroes(LV.start);
  LV.respawnPt = LV.start;
  const h = L(); cam.x = clamp(h.x + 8 - VW / 2, 0, W * TS - VW); cam.y = clamp(h.y + 8 - VH / 2, 0, H * TS - VH);
  playSong(LV.song);
  banner = { s1: 'FASE ' + LV.n, s2: LV.name, t: 3.5 };
}
function placeHeroes(pts) {
  heroes.forEach((h, i) => { h.x = pts[i][0] * TS; h.y = pts[i][1] * TS; h.anchored = false; h.kb = null; h.atk = 0; });
  trail = [];
}
const EN = {
  slime: { hp: 2, sp: 20 }, slimeI: { hp: 2, sp: 22 }, slimeF: { hp: 3, sp: 22 },
  skel: { hp: 3, sp: 30, chase: 95 }, orc: { hp: 4, sp: 34, chase: 110 }, bat: { hp: 1, sp: 46, chase: 120, fly: true },
  boss: { hp: 14, sp: 26 },
};
function spawn(type, tx, ty) {
  const e = { type, x: tx * TS, y: ty * TS, hp: EN[type].hp, t: rnd(), dx: 0, dy: 0, flash: 0, kb: null, face: 1 };
  if (!EN[type].fly && blocked(e)) return;
  enemies.push(e); return e;
}

// ---------------- colisao ----------------
function solidAt(tx, ty, fly) {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
  const c = M[ty][tx];
  if (fly && (c === '~' || c === 'b' || c === 'v')) return false;
  switch (c) {
    case 'T': case '~': case 'b': case 'v': case '#': case 'W': case 'R': case 'B': case 'C': case 'J': case 'L':
    case 'X': case 'D': case 'E': case 'A': case 'I': case 'H': return true;
    case 'G': return !gateOpen(LV.gates[tkey(tx, ty)], tx, ty);
    default: return false;
  }
}
function hb(e) { return e.type === 'boss' ? { x: e.x + 7, y: e.y + 20, w: 18, h: 10 } : { x: e.x + 3, y: e.y + 9, w: 10, h: 6 }; }
function body(e) { return e.type === 'boss' ? { x: e.x + 4, y: e.y + 4, w: 24, h: 26 } : { x: e.x + 2, y: e.y + 4, w: 12, h: 12 }; }
function blocked(e) {
  const b = hb(e), fly = e.type && EN[e.type] && EN[e.type].fly;
  const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS), y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solidAt(x, y, fly)) return true;
  return false;
}
function tryMove(e, dx, dy) {
  let moved = false;
  for (const [ax, ay] of [[dx, 0], [0, dy]]) {
    if (!ax && !ay) continue;
    e.x += ax; e.y += ay;
    if (!blocked(e)) { moved = true; continue; }
    e.x -= ax; e.y -= ay;
    for (let o = 1; o <= 6; o++) {
      let done = false;
      for (const s of [-1, 1]) {
        const qx = ay ? s * o : 0, qy = ax ? s * o : 0;
        e.x += qx + ax; e.y += qy + ay; const ok = !blocked(e); e.x -= qx + ax; e.y -= qy + ay;
        if (ok) { const sx = ay ? s : 0, sy = ax ? s : 0; e.x += sx; e.y += sy; if (blocked(e)) { e.x -= sx; e.y -= sy; } else moved = true; done = true; break; }
      }
      if (done) break;
    }
  }
  return moved;
}
function heroTile(h) { const b = hb(h); return [Math.floor((b.x + b.w / 2) / TS), Math.floor((b.y + b.h / 2) / TS)]; }
function gateOpen(group, tx, ty) {
  const r = LV.gateRules[group]; if (!r) return false;
  if (r.flag && flags[r.flag]) return true;
  if (r.mode === 'hold' && Object.keys(LV.plates).some(k => LV.plates[k] === group && pressed[k])) return true;
  if (r.mode === 'all' && flags['all_' + group]) return true;
  const g = { x: tx * TS, y: ty * TS, w: TS, h: TS };
  return heroes.some(h => overlap(hb(h), g));
}

// ---------------- entrada ----------------
const keys = {}, latch = {};
addEventListener('keydown', e => { keys[e.code] = true; if (!e.repeat) latch[e.code] = true; if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault(); audioInit(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('mousedown', audioInit);
addEventListener('gamepadconnected', () => showToast('Controle conectado!'));
const KB_ALL = { l: ['ArrowLeft', 'KeyA'], r: ['ArrowRight', 'KeyD'], u: ['ArrowUp', 'KeyW'], d: ['ArrowDown', 'KeyS'], atk: ['Space', 'KeyJ', 'KeyZ', 'KeyK', 'Enter', 'KeyF'], sw: ['KeyQ', 'Tab', 'KeyX', 'ShiftLeft', 'KeyL', 'KeyE'], st: ['Escape', 'KeyP', 'Backspace'] };
const KB_A = { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], atk: ['Space', 'KeyF'], sw: ['KeyQ', 'KeyE'], st: ['Escape', 'KeyP'] };
const KB_B = { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], atk: ['KeyK', 'Enter', 'Numpad0', 'KeyJ'], sw: ['KeyL', 'ShiftRight'], st: ['Backspace'] };
const NONE = { mx: 0, my: 0, atk: false, sw: false, st: false };
function kbRead(sp) {
  const K = c => keys[c] || latch[c], any = a => a.some(K);
  return { mx: (any(sp.r) ? 1 : 0) - (any(sp.l) ? 1 : 0), my: (any(sp.d) ? 1 : 0) - (any(sp.u) ? 1 : 0), atk: any(sp.atk), sw: any(sp.sw), st: any(sp.st) };
}
function padRead(gp) {
  if (!gp) return NONE;
  const B = i => gp.buttons[i] && gp.buttons[i].pressed;
  let mx = 0, my = 0; const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if (Math.abs(ax) > 0.4) mx += Math.sign(ax); if (Math.abs(ay) > 0.4) my += Math.sign(ay);
  if (B(14)) mx -= 1; if (B(15)) mx += 1; if (B(12)) my -= 1; if (B(13)) my += 1;
  const r = { mx, my, atk: B(0) || B(1), sw: B(2) || B(3) || B(4) || B(5), st: B(9) || B(8) };
  if (r.atk || r.st) audioInit();
  return r;
}
function merge(...ds) { const r = { mx: 0, my: 0, atk: false, sw: false, st: false }; for (const d of ds) { r.mx += d.mx; r.my += d.my; r.atk = r.atk || d.atk; r.sw = r.sw || d.sw; r.st = r.st || d.st; } r.mx = clamp(r.mx, -1, 1); r.my = clamp(r.my, -1, 1); return r; }
const hin = [{}, {}], hprev = [{}, {}], ui = {}, uiPrev = {};
function readInput() {
  const pads = (navigator.getGamepads ? [...navigator.getGamepads()] : []).filter(Boolean).map(padRead);
  const all = merge(kbRead(KB_ALL), ...pads);
  let c0, c1;
  if (mode === 1) { c0 = lead === 0 ? all : NONE; c1 = lead === 1 ? all : NONE; }
  else if (pads.length) {
    const padC = pads[0], kbC = merge(kbRead(KB_ALL), ...(pads.slice(1)));
    if (padHero === 0) { c0 = padC; c1 = kbC; } else { c0 = kbC; c1 = padC; }
  } else { c0 = kbRead(KB_A); c1 = kbRead(KB_B); }
  [c0, c1].forEach((c, i) => { const p = hprev[i]; hin[i] = Object.assign({}, c, { atkP: c.atk && !p.atk, swP: c.sw && !p.sw, stP: c.st && !p.st }); hprev[i] = { atk: c.atk, sw: c.sw, st: c.st }; });
  ui.atkP = all.atk && !uiPrev.atk; ui.stP = all.st && !uiPrev.st; ui.upP = all.my < 0 && !uiPrev.up; ui.downP = all.my > 0 && !uiPrev.down;
  uiPrev.atk = all.atk; uiPrev.st = all.st; uiPrev.up = all.my < 0; uiPrev.down = all.my > 0;
  for (const k in latch) delete latch[k];
}

// ---------------- dialogo ----------------
let dlg = null;
function say(lines, onDone) {
  if (typeof lines === 'string') lines = [lines];
  if (dlg) { dlg.lines.push(...lines); if (onDone) { const p = dlg.onDone; dlg.onDone = () => { p && p(); onDone(); }; } }
  else dlg = { lines: lines.slice(), i: 0, t: 0, onDone };
}
function updateDialog(dt) {
  const len = dlg.lines[dlg.i].length, before = Math.floor(dlg.t * 45);
  dlg.t += dt; const now = Math.floor(dlg.t * 45);
  if (now > before && before < len && now % 3 === 0) SFX.text();
  if (ui.atkP || ui.stP) {
    if (dlg.t * 45 < len) dlg.t = 999;
    else { dlg.i++; dlg.t = 0; if (dlg.i >= dlg.lines.length) { const f = dlg.onDone; dlg = null; inputLock = 0.25; f && f(); } }
  }
}

// ---------------- cutscenes ----------------
function runCut(steps) { cut = { steps, i: 0, t: 0, started: false }; state = 'cut'; }
function updateCut(dt) {
  if (dlg) { updateDialog(dt); return; }
  const s = cut.steps[cut.i];
  if (!s) { cut = null; camFocus = null; if (state === 'cut') state = 'play'; return; }
  if (!cut.started) { cut.started = true; cut.t = 0; if (s.do) s.do(); if (s.say) say(s.say); return; }
  cut.t += dt;
  let done = !dlg;
  if (s.wait) done = done && cut.t >= s.wait;
  if (s.until) done = done && s.until();
  if (done) { cut.i++; cut.started = false; }
}
function crowTo(x, y, sp = 120) { if (!crow) crow = { x: x, y: y - 140, tx: x, ty: y, sp, carry: false, face: 1 }; crow.tx = x; crow.ty = y; crow.sp = sp; }
function crowArrived() { return crow && dist(crow.x, crow.y, crow.tx, crow.ty) < 2; }
function updateCrow(dt) {
  if (!crow) return;
  const d = dist(crow.x, crow.y, crow.tx, crow.ty);
  if (d > 0.5) { const s = Math.min(d, crow.sp * dt); if (crow.tx !== crow.x) crow.face = Math.sign(crow.tx - crow.x); crow.x += (crow.tx - crow.x) / d * s; crow.y += (crow.ty - crow.y) / d * s; }
}

// ---------------- particulas ----------------
function burst(x, y, n, cols, spd = 60, life = 0.5, g = 0, size = 1) {
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, s = spd * (0.3 + rnd() * 0.7); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + rnd() * 0.6), max: life, col: cols[(rnd() * cols.length) | 0], g, size }); }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; }
}
function smoke(x, y, n = 30) { burst(x, y, n, ['#ffffff', '#e0e0e0', '#bdbdbd', '#9e9e9e'], 70, 1.0, -20, 2); }

// ---------------- herois ----------------
function switchHero() {
  if (mode === 2) return;
  const old = L(); const [tx, ty] = heroTile(old);
  old.anchored = M[ty][tx] === 'P';
  lead = 1 - lead; L().anchored = false; trail = [];
  const n = L(), o = F();
  if (!o.anchored && dist(n.x, n.y, o.x, o.y) > 140) { burst(o.x + 8, o.y + 8, 10, ['#fff', '#ffd54f']); o.x = n.x; o.y = n.y; }
  SFX.sw(); burst(n.x + 8, n.y + 4, 8, ['#fff', n.key === 'gu' ? '#90caf9' : '#f48fb1'], 40, 0.4);
  if (o.anchored) showToast((o.name === 'GU' ? 'Gu' : 'De') + ' ficou esperando na placa');
}
function callPartner(h) {
  const o = heroes[1 - heroes.indexOf(h)];
  burst(o.x + 8, o.y + 8, 12, ['#fff', '#ffd54f']); o.x = h.x; o.y = h.y; o.kb = null; burst(o.x + 8, o.y + 8, 12, ['#fff', '#ffd54f']);
  SFX.sw(); showToast((o.name === 'GU' ? 'Gu' : 'De') + ' veio correndo!');
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
function damageEnemy(e, from, dmg = 1, byArrow = false) {
  if (e.type === 'boss') return damageBoss(e, from, byArrow);
  e.hp -= dmg; e.flash = 0.15; SFX.hit();
  const c = center(e), a = Math.atan2(c.y - from.y, c.x - from.x);
  e.kb = { vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, t: 0.15 };
  burst(c.x, c.y, 5, ['#fff', '#ffeb3b'], 50, 0.25);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  const c = center(e); e.dead = true; SFX.kill();
  const cols = { slime: ['#4caf50', '#81c784'], slimeI: ['#81d4fa', '#e1f5fe'], slimeF: ['#ff8a65', '#ffccbc'], orc: ['#8bc34a', '#795548'], bat: ['#7e57c2', '#b39ddb'] }[e.type] || ['#fff', '#cfd8dc'];
  burst(c.x, c.y, 16, cols.concat(['#fff']), 70, 0.5);
  if (hearts < maxH && rnd() < 0.45) drops.push({ x: c.x - 4, y: c.y - 4, t: 0 });
}

function axeHit(h) {
  const c = center(h); const box = { x: c.x + h.fx * 12 - 9, y: c.y + h.fy * 12 - 9, w: 18, h: 18 };
  let any = false;
  for (const e of enemies) if (!e.dead && overlap(box, body(e))) { damageEnemy(e, c); any = true; }
  const tx0 = Math.floor(box.x / TS), tx1 = Math.floor((box.x + box.w) / TS), ty0 = Math.floor(box.y / TS), ty1 = Math.floor((box.y + box.h) / TS);
  const cand = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (M[ty] && 'RWBJ'.includes(M[ty][tx])) cand.push([tx, ty, dist(tx * TS + 8, ty * TS + 8, c.x + h.fx * 12, c.y + h.fy * 12)]);
  cand.sort((a, b) => a[2] - b[2]);
  if (cand.length) {
    const [tx, ty] = cand[0], ch = M[ty][tx], k = tkey(tx, ty);
    shakeT = 0.08; any = true;
    if (ch === 'J') { pullLever(tx, ty); }
    else if (ch === 'B') { M[ty][tx] = '.'; SFX.cut(); burst(tx * TS + 8, ty * TS + 8, 14, THEMES[LV.theme].bush, 70, 0.5, 60); if (hearts < maxH && rnd() < 0.25) drops.push({ x: tx * TS + 4, y: ty * TS + 4, t: 0 }); }
    else {
      const need = ch === 'R' ? 2 : 3; hits[k] = (hits[k] || 0) + 1;
      if (hits[k] >= need) {
        M[ty][tx] = ch === 'R' ? ':' : '_'; SFX.break(); burst(tx * TS + 8, ty * TS + 8, 18, ['#8d8d99', '#5d5d68', '#a9a9b5'], 80, 0.6, 120);
        if (ch === 'W') { later(0.3, () => SFX.secret()); showToast('Uma passagem secreta!', 3); }
      } else { SFX.tink(); burst(tx * TS + 8, ty * TS + 8, 6, ['#fff', '#a9a9b5'], 50, 0.3); }
    }
  }
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
    let dead = a.t <= 0;
    if (!dead) for (const k in LV.crystals) {
      const [cx, cy] = k.split(',').map(Number), px_ = cx * TS + 8, py_ = cy * TS + 8;
      const ok = a.vx ? (Math.abs(a.x - px_) < 9 && Math.abs(a.y - py_) < 20) : (Math.abs(a.x - px_) < 11 && Math.abs(a.y - py_) < 9);
      if (ok) { hitCrystal(k); dead = true; break; }
    }
    if (!dead) for (const e of enemies) if (!e.dead && overlap({ x: a.x - 3, y: a.y - 3, w: 6, h: 6 }, body(e))) { damageEnemy(e, { x: a.x - a.vx, y: a.y - a.vy }, 1, true); dead = true; break; }
    if (!dead) {
      const tx = Math.floor(a.x / TS), ty = Math.floor(a.y / TS); const ch = M[ty] && M[ty][tx];
      if (ch && !'~bv'.includes(ch) && solidAt(tx, ty)) {
        dead = true; SFX.tink(); burst(a.x, a.y, 4, ['#fff', '#bcaaa4'], 40, 0.2);
        if ('RWB'.includes(ch) && !flags.hintArrow) { flags.hintArrow = 1; say('As flechas de De não quebram isso... é trabalho para o machado do Gu!'); }
      }
    }
    if (dead) arrows.splice(i, 1);
  }
}
function hitCrystal(k) {
  const c = LV.crystals[k], [cx, cy] = k.split(',').map(Number);
  const fx = () => burst(cx * TS + 8, cy * TS + 6, 24, ['#b2ffff', '#4dd0e1', '#fff'], 80, 0.7);
  if (c.timed) { crystalOn[k] = true; timedOn[c.timed] = 7; SFX.chime(); fx(); checkCombo(); return; }
  if (crystalOn[k]) { SFX.tink(); return; }
  if (c.seq) {
    if (c.seq === seqNext) {
      crystalOn[k] = true; seqNext++; SFX.tick(400 + c.seq * 200); fx();
      if (seqNext > 3) { SFX.chime(); shakeT = 0.3; raiseBridge(LV.seqBridge.bridge, LV.seqBridge.msg); }
    } else {
      SFX.wrong(); shakeT = 0.2; seqNext = 1;
      for (const kk in LV.crystals) if (LV.crystals[kk].seq) crystalOn[kk] = false;
      showToast('Ordem errada! Sigam as marcas douradas.', 3);
    }
    return;
  }
  crystalOn[k] = true; SFX.chime(); shakeT = 0.3; fx();
  if (c.bridge) raiseBridge(c.bridge, c.msg);
}
function raiseBridge(list, msg) {
  list.forEach(([x, y], i) => later(0.3 + i * 0.12, () => { M[y][x] = M[y][x] === 'v' ? '|' : '='; SFX.tick(400 + (i % 6) * 70); burst(x * TS + 8, y * TS + 8, 6, ['#a0703c', '#fff', '#5b95e0'], 50, 0.4); }));
  later(0.6 + list.length * 0.12, () => say(msg));
}
function pullLever(tx, ty) {
  const id = LV.levers[tkey(tx, ty)]; timedOn[id] = 7; SFX.unlock(); burst(tx * TS + 8, ty * TS + 4, 10, ['#ffd54f', '#fff'], 50, 0.4);
  checkCombo();
}
function checkCombo() {
  const c = LV.combo; if (!c || flags[c.flag]) return;
  if (timedOn[c.a] > 0 && timedOn[c.b] > 0) { flags[c.flag] = true; SFX.door(); shakeT = 0.5; say(c.msg); }
  else if (!flags.comboHint) { flags.comboHint = 1; showToast('Rápido! Agora o outro, antes de apagar!', 3); }
}

// ---------------- update herois ----------------
function moveHero(h, c, dt) {
  if (h.kb) { tryMove(h, h.kb.vx * dt, 0); tryMove(h, 0, h.kb.vy * dt); h.kb.t -= dt; if (h.kb.t <= 0) h.kb = null; }
  let mx = c.mx || 0, my = c.my || 0;
  if (inputLock > 0) { mx = 0; my = 0; }
  if (mx || my) {
    const n = Math.hypot(mx, my), sp = 74 * dt;
    if (Math.abs(mx) >= Math.abs(my)) { h.fx = Math.sign(mx); h.fy = 0; } else { h.fy = Math.sign(my); h.fx = 0; }
    if (mx) h.face = Math.sign(mx);
    const ox = h.x, oy = h.y;
    tryMove(h, mx / n * sp, my / n * sp);
    if (mode === 2) { // um nao pode sair da tela do outro
      const o = heroes[1 - heroes.indexOf(h)];
      const spread = (a, b) => Math.max(Math.abs(a.x - b.x) - (VW - 40), Math.abs(a.y - b.y) - (VH - 44));
      if (spread(h, o) > 0 && spread(h, o) > spread({ x: ox, y: oy }, o)) { h.x = ox; h.y = oy; }
    }
    if (h.x !== ox || h.y !== oy) { h.walk += dt; if (mode === 1) { trail.push({ x: h.x, y: h.y, face: h.face }); if (trail.length > 80) trail.shift(); } }
    else h.walk = 0;
  } else h.walk = 0;
  h.cd -= dt; h.atk -= dt;
  if (c.atkP && inputLock <= 0 && h.cd <= 0) {
    if (h.key === 'gu') { h.atk = 0.22; h.cd = 0.32; axeHit(h); }
    else { h.atk = 0.18; h.cd = 0.36; shootArrow(h); }
  }
  if (c.swP && inputLock <= 0) { if (mode === 1) switchHero(); else callPartner(h); }
}
function updateHeroes(dt) {
  if (mode === 1) {
    moveHero(L(), hin[lead], dt);
    const f = F(), h = L();
    if (!f.anchored) {
      const LAG = 16;
      if (trail.length > LAG) {
        const p = trail[trail.length - 1 - LAG], d = dist(f.x, f.y, p.x, p.y);
        if (d > 0.5) { const sp = Math.min(d, 130 * dt); f.x += (p.x - f.x) / d * sp; f.y += (p.y - f.y) / d * sp; f.walk += dt; f.face = p.face; } else f.walk = 0;
      } else f.walk = 0;
      if (dist(f.x, f.y, h.x, h.y) > 160) { f.x = h.x; f.y = h.y; trail = []; }
    } else f.walk = 0;
  } else heroes.forEach((h, i) => moveHero(h, hin[i], dt));
  pressed = {};
  for (const h of heroes) { const [tx, ty] = heroTile(h); if (M[ty][tx] === 'P') pressed[tkey(tx, ty)] = true; }
  for (const g in LV.gateRules) {
    const r = LV.gateRules[g];
    if (r.mode === 'all' && !flags['all_' + g]) {
      const ks = Object.keys(LV.plates).filter(k => LV.plates[k] === g);
      if (ks.length && ks.every(k => pressed[k])) { flags['all_' + g] = true; SFX.door(); shakeT = 0.4; say('As duas placas afundaram juntas... o portão se abriu de vez!'); }
    }
  }
}

// ---------------- inimigos ----------------
function nearestHero(c) { let best = null, bd = 1e9; for (const h of active()) { const hc = center(h), d = dist(c.x, c.y, hc.x, hc.y); if (d < bd) { bd = d; best = h; } } return [best, bd]; }
function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    const ec = center(e);
    if (e.type !== 'boss' && (Math.abs(ec.x - (cam.x + VW / 2)) > 260 || Math.abs(ec.y - (cam.y + VH / 2)) > 180)) continue;
    e.flash -= dt;
    if (e.kb) { tryMove(e, e.kb.vx * dt, 0); tryMove(e, 0, e.kb.vy * dt); e.kb.t -= dt; if (e.kb.t <= 0) e.kb = null; continue; }
    const [h, d] = nearestHero(ec); if (!h) continue; const hc = center(h);
    if (e.type === 'boss') updateBoss(e, h, hc, dt);
    else {
      e.t -= dt;
      const def = EN[e.type];
      if (def.chase && d < def.chase && d > 0) {
        e.dx = (hc.x - ec.x) / d; e.dy = (hc.y - ec.y) / d;
        if (e.type === 'bat') { e.dx += Math.sin(time * 6 + e.x) * 0.8; e.dy += Math.cos(time * 5 + e.y) * 0.8; }
      } else if (e.t <= 0) { e.t = 0.8 + rnd() * 1.4; if (rnd() < 0.3) { e.dx = 0; e.dy = 0; } else { const a = rnd() * Math.PI * 2; e.dx = Math.cos(a); e.dy = Math.sin(a); } }
      const sp = def.sp * dt;
      if (e.dx) e.face = Math.sign(e.dx);
      tryMove(e, e.dx * sp, e.dy * sp);
    }
    for (const hh of active()) if (overlap(hb(hh), e.type === 'boss' ? { x: e.x + 6, y: e.y + 10, w: 20, h: 20 } : { x: e.x + 3, y: e.y + 7, w: 10, h: 8 })) hurtHero(hh, e);
  }
  enemies = enemies.filter(e => !e.dead);
}

// ---------------- chefao ----------------
function updateBoss(e, h, hc, dt) {
  const ec = center(e);
  e.face = hc.x < ec.x ? -1 : 1;
  if (e.stun > 0) { e.stun -= dt; return; }
  e.ct = (e.ct || 0) - dt;
  if (e.charge > 0) { e.charge -= dt; tryMove(e, e.cdx * 120 * dt, e.cdy * 120 * dt); return; }
  if (e.tell > 0) { e.tell -= dt; if (e.tell <= 0) { e.charge = 0.7; const d = dist(ec.x, ec.y, hc.x, hc.y) || 1; e.cdx = (hc.x - ec.x) / d; e.cdy = (hc.y - ec.y) / d; SFX.boss(); } return; }
  if (e.ct <= 0) { e.ct = 4 + rnd() * 1.5; e.tell = 0.6; return; }
  const d = dist(ec.x, ec.y, hc.x, hc.y) || 1;
  tryMove(e, (hc.x - ec.x) / d * EN.boss.sp * dt, (hc.y - ec.y) / d * EN.boss.sp * dt);
}
function damageBoss(e, from, byArrow) {
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
  if (e.hp <= 0) { e.dead = true; bossDefeated(e); }
}

// ---------------- pickups ----------------
function updatePickups(dt) {
  for (const h of active()) {
    const b = hb(h);
    for (const it of items) {
      if (it.taken) continue;
      if (!overlap(b, { x: it.x - 9, y: it.y - 7, w: 18, h: 16 })) continue;
      it.taken = true; burst(it.x, it.y, 20, ['#ffd54f', '#fff'], 70, 0.6);
      if (it.kind === 'relic') {
        relicCount++; flags['relic' + it.id] = true; SFX.relic(); shakeT = 0.15;
        const msg = ['Vocês encontraram ' + RELIC_NAMES[it.id] + '! (' + relicCount + '/3)'];
        if (relicCount === 3) msg.push('As três relíquias estão reunidas! Levem-nas ao altar no centro e o segredo será revelado!');
        say(msg);
      } else if (it.kind === 'key') { keysHeld++; SFX.key(); say('Vocês pegaram uma chave!'); }
      else if (it.kind === 'chupeta') { chupetas++; SFX.secret(); say('Uma CHUPETA DOURADA secreta! (' + chupetas + '/' + TOTAL_CHUPETAS + ')'); }
      else if (it.kind === 'heartC') { maxH++; hearts = maxH; SFX.secret(); say('Um Coração Dourado! Gu e De ganharam mais um coração!'); }
      else if (it.kind === 'scroll') { SFX.relic(); scrollPicked(); }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (overlap(b, { x: d.x, y: d.y, w: 8, h: 8 })) { hearts = Math.min(maxH, hearts + 1); SFX.heart(); drops.splice(i, 1); }
    }
  }
  for (let i = drops.length - 1; i >= 0; i--) { drops[i].t += dt; if (drops[i].t > 12) drops.splice(i, 1); }
}

// ---------------- gatilhos ----------------
function cd(k, t) { if ((msgCD[k] || 0) > time) return false; msgCD[k] = time + t; return true; }
function anyNear(x, y, r) { return active().some(h => { const c = center(h); return dist(c.x, c.y, x, y) < r; }); }
function anyIn(x0, y0, x1, y1) { return active().find(h => { const [tx, ty] = heroTile(h); return tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1; }); }
function updateTriggers(dt) {
  for (const k in LV.signs) {
    const [sx, sy] = k.split(',').map(Number), near = anyNear(sx * TS + 8, sy * TS + 8, 22);
    if (near && !signNear[k]) say(LV.signs[k]);
    signNear[k] = near;
  }
  for (const id in timedOn) { if (timedOn[id] > 0) { timedOn[id] -= dt; if (timedOn[id] <= 0) { for (const k in LV.crystals) if (LV.crystals[k].timed === id) crystalOn[k] = false; } } }
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (M[ty][tx] === 'L' && anyNear(tx * TS + 8, ty * TS + 8, 21)) {
    const need = (LV.lockNeed && LV.lockNeed[tkey(tx, ty)]) || 1;
    if (keysHeld >= need) { keysHeld -= need; openLocks(tx, ty); }
    else if (cd('lock', 5)) say(need > 1 ? 'Esta porta tem ' + need + ' fechaduras. (Chaves: ' + keysHeld + '/' + need + ')' : 'Uma porta trancada. Precisam de uma chave.');
  }
  for (const h of active()) { const [tx, ty] = heroTile(h); if (M[ty][tx] === 'O') { nextLevel(); return; } }
  if (LV.altar && !altarPlaced && anyNear(LV.altar.x, LV.altar.y, 28)) {
    if (relicCount >= LV.altar.need) {
      altarPlaced = true; SFX.chime(); shakeT = 0.4; burst(LV.altar.x, LV.altar.y - 8, 40, RELIC_COL.concat(['#fff']), 100, 1);
      LV.respawnPt = [[23, 20], [24, 20]];
      say(['As três relíquias brilham sobre o altar...', 'Uma voz ecoa pela floresta: "O GRANDE SEGREDO SERÁ REVELADO AGORA!"', 'O portão das Duas Torres se abriu! Corram!'], () => {
        LV.altar.gate.forEach(([x, y]) => M[y][x] = '_'); SFX.door(); shakeT = 0.6; burst(24 * TS, 13 * TS + 8, 30, ['#9a9aa8', '#fff'], 80, 0.7, 60);
      });
    } else if (cd('altar', 6)) say('Um altar antigo com 3 encaixes vazios... (' + relicCount + '/3 relíquias)');
  }
  const T = LV.towers;
  if (T && !suspense && !towersGone && M[T.plazaY][23] !== 'H' && anyIn(13, 0, 34, T.plazaY - 1)) {
    if (!T.fake && RESULT === null) { if (cd('oraculo', 8)) say(['As torres aguardam em silêncio...', 'O Oráculo ainda não revelou o segredo. (Falta o arquivo segredo.js na pasta do jogo.)']); }
    else startSuspense();
  }
  if (doorOpen) {
    const dx = RESULT === 0 ? 17 : 30, dy = T.y + 5;
    if (active().some(h => overlap(hb(h), { x: dx * TS + 2, y: dy * TS, w: 12, h: 18 }))) startReveal();
  }
  if (LV.temple && !flags.temple) { const t = LV.temple; if (anyIn(t.x0, t.y0, t.x1, t.y1)) { flags.temple = 1; templeCut(); } }
  if (LV.arena && !flags.arena) { const a = LV.arena; const h = anyIn(a.x0, a.y0, a.x1, a.y1); if (h) { flags.arena = 1; arenaCut(h); } }
}
function openLocks(x, y) {
  const st = [[x, y]]; SFX.unlock(); shakeT = 0.3;
  while (st.length) { const [a, b] = st.pop(); if (M[b] && M[b][a] === 'L') { M[b][a] = '_'; burst(a * TS + 8, b * TS + 8, 12, ['#ffd54f', '#6b4423', '#fff'], 60, 0.5); st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } }
  say('Click! A porta se abriu.');
}

// ---------------- cena: fase 1 (torres falsas) ----------------
function fakeTowersCut() {
  const cx = 24 * TS, cy = 7 * TS;
  runCut([
    { do: () => { camFocus = { x: cx, y: cy }; towerShake = 1.6; SFX.boss(); }, wait: 1.6 },
    { do: () => { SFX.poof(); fade = 0.9; fadeCol = '255,255,255'; towersGone = true; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('XDE'.includes(M[y][x])) M[y][x] = '_'; smoke(17 * TS + 8, 6 * TS, 60); smoke(30 * TS + 8, 6 * TS, 60); }, wait: 1.2 },
    { do: () => { crowTo(cx, cy - 10, 90); SFX.crow(); }, until: crowArrived },
    { say: ['Corvo: CRÁ-CRÁ-CRÁ! Caíram direitinho!', 'Corvo: Essas torres eram só uma ilusão minha! Hahaha!', 'Corvo: O segredo verdadeiro está muito bem guardado... depois das Montanhas Geladas!', 'Corvo: Duvido que cheguem lá! CRÁ!'] },
    { do: () => { crowTo(cx + 40, cy - 200, 160); SFX.crow(); }, wait: 1.2 },
    { do: () => { crow = null; }, say: ['Gu: Ah, não acredito! Era tudo de mentira?!', 'De: Calma, Gu. Vamos atrás daquele corvo!'] },
    { do: () => { M[6][23] = 'O'; M[6][24] = 'O'; SFX.portal(); burst(cx, 6 * TS + 8, 40, ['#b388ff', '#fff', '#7c4dff'], 90, 1); }, say: 'Um portal mágico surgiu no meio da praça!' },
  ]);
}

// ---------------- cena: fase 2 (pergaminho roubado) ----------------
function templeCut() {
  const cx = 24 * TS, cy = 4 * TS;
  playSong(null);
  runCut([
    { do: () => { camFocus = { x: cx, y: cy + 30 }; }, say: ['O Templo do Oráculo!', 'Uma voz antiga ecoa: "Vocês chegaram longe... agora o segredo SERÁ revelado!"', 'Um pergaminho brilhante se abre sobre o altar...'] },
    { do: () => { SFX.chime(); scrollFx = { lines: ['O bebê de Gu e De é...', 'É MENIN'], t: 0, cps: [14, 2.2] }; }, until: scrollDone },
    { wait: 1.6 },
    { do: () => { crowTo(cam.x + VW / 2, cam.y + VH / 2 - 10, 260); crow.x = cam.x + VW + 20; crow.y = cam.y + 30; SFX.crow(); }, until: crowArrived },
    { do: () => { scrollFx = null; crow.carry = true; SFX.crow(); shakeT = 0.3; crowTo(cam.x - 60, cam.y + 20, 220); }, wait: 1.0 },
    { do: () => { crowTo(cx, cy + 12, 160); }, until: crowArrived },
    { say: ['Corvo: CRÁ-CRÁ! Esse pergaminho agora é MEU!', 'Corvo: Se quiserem saber o final, venham buscar na Fortaleza dos Orcs...', 'Corvo: ...se tiverem coragem! CRÁ-CRÁ-CRÁ!'] },
    { do: () => { crowTo(cx + 30, cy - 200, 170); }, wait: 1.0 },
    { do: () => { crow = null; }, say: ['De: Ele levou bem na hora!!', 'Gu: "É MENIN..." — menino ou menina?! Atrás dele!'] },
    { do: () => { M[5][20] = 'O'; SFX.portal(); burst(20 * TS + 8, 5 * TS + 8, 40, ['#b388ff', '#fff', '#7c4dff'], 90, 1); playSong(LV.song); }, say: 'Um portal mágico se abriu no canto do templo!' },
  ]);
}
function scrollDone() {
  if (!scrollFx) return true;
  const a = scrollFx.lines[0].length / scrollFx.cps[0];
  return scrollFx.t > a + 0.6 + scrollFx.lines[1].length / scrollFx.cps[1];
}

// ---------------- cena: fase 3 (chefao) ----------------
function arenaCut(h) {
  const a = LV.arena;
  const o = heroes[1 - heroes.indexOf(h)]; o.x = h.x + (o === heroes[0] ? -16 : 16); o.y = h.y; if (blocked(o)) { o.x = h.x; o.y = h.y; }
  o.anchored = false; trail = [];
  for (const hh of heroes) hh.y = Math.min(hh.y, 16 * TS + 8);
  LV.respawnPt = [[23, 16], [24, 16]];
  playSong(null);
  runCut([
    { do: () => { a.door.forEach(([x, y]) => M[y][x] = '#'); SFX.door(); shakeT = 0.5; camFocus = { x: 24 * TS, y: 13 * TS }; }, wait: 0.8 },
    { do: () => { crowTo(24 * TS, 11 * TS, 120); SFX.crow(); }, until: crowArrived },
    { say: ['Corvo: CRÁ! Chegaram até aqui?', 'Corvo: O pergaminho está comigo... e o segredo também!', 'Corvo: CHEFE ORC! Acabe com eles!'] },
    { do: () => { crowTo(24 * TS, -40, 150); smoke(a.boss[0] * TS + 16, a.boss[1] * TS + 16, 50); SFX.boss(); shakeT = 0.6; boss = spawnBoss(a.boss[0], a.boss[1]); }, wait: 1.2 },
    { do: () => { crow = null; playSong('boss'); }, say: ['Chefe Orc: GRRROOOAAARRR!', 'Dica: o machado do Gu bate forte, e a flecha da De quebra escudos mágicos!'] },
  ]);
}
function spawnBoss(tx, ty) { const e = { type: 'boss', x: tx * TS, y: ty * TS, hp: EN.boss.hp, max: EN.boss.hp, t: 0, dx: 0, dy: 0, flash: 0, kb: null, face: 1, ct: 2.5 }; enemies.push(e); return e; }
function bossDefeated(e) {
  const c = center(e); boss = null; playSong(null);
  for (let i = 0; i < 6; i++) later(i * 0.25, () => { burst(c.x + rnd() * 30 - 15, c.y + rnd() * 30 - 15, 20, ['#ff7043', '#ffd54f', '#fff'], 90, 0.7); SFX.kill(); shakeT = 0.3; });
  later(1.6, () => {
    runCut([
      { do: () => { smoke(c.x, c.y, 60); SFX.poof(); camFocus = { x: c.x, y: c.y }; }, wait: 1.0 },
      { do: () => { crowTo(c.x + 20, c.y - 20, 140); SFX.crow(); }, until: crowArrived },
      { say: ['Corvo: Nããão! Meu Chefe Orc!', 'Corvo: Tá bom, tá bom... vocês venceram. O pergaminho é de vocês. CRÁ...'] },
      { do: () => { items.push({ kind: 'scroll', x: c.x, y: c.y + 4, taken: false }); SFX.key(); crowTo(c.x + 60, -60, 160); }, wait: 1.0 },
      { do: () => { crow = null; LV.arena.door.forEach(([x, y]) => M[y][x] = '_'); playSong(LV.song); }, say: 'O Corvo deixou cair o pergaminho! Peguem!' },
    ]);
  });
}
function scrollPicked() {
  say(['O pergaminho diz: "As Duas Torres VERDADEIRAS guardam o segredo no topo da fortaleza."', 'Desta vez não tem truque. O portão do norte se abriu!'], () => {
    LV.arena.gate.forEach(([x, y]) => M[y][x] = '_'); SFX.door(); shakeT = 0.6; burst(24 * TS, 9 * TS + 8, 30, ['#9a9aa8', '#fff'], 80, 0.7, 60);
  });
}

// ---------------- suspense / revelacao ----------------
function startSuspense() {
  const fake = LV.towers.fake;
  const target = fake ? (rnd() < 0.5 ? 0 : 1) : RESULT;
  suspense = { t: 0, times: [], i: 0, hl: -1, opened: false, fake };
  let t = 1.0, iv = 0.08; const lim = fake ? 0.55 : 0.7;
  while (iv < lim) { suspense.times.push(t); t += iv; iv *= 1.12; }
  if ((suspense.times.length - 1) % 2 !== target) { suspense.times.push(t); t += iv; }
  suspense.end = t + (fake ? 0.4 : 0.9);
  state = 'suspense'; playSong(null); trail = [];
  showToast(fake ? 'As duas torres começam a brilhar...' : 'As Duas Torres verdadeiras começam a brilhar...', 5);
}
function updateSuspense(dt) {
  const s = suspense; s.t += dt;
  const ty = LV.towers.y;
  cam.x += ((24 * TS - VW / 2) - cam.x) * Math.min(1, dt * 3); cam.y += (clamp((ty + 3) * TS - VH / 2, 0, H * TS - VH) - cam.y) * Math.min(1, dt * 3);
  while (s.i < s.times.length && s.t >= s.times[s.i]) { s.hl = s.i % 2; SFX.tick(s.hl ? 784 : 523); s.i++; }
  if (s.fake && s.t >= s.end) { s.hl = -1; state = 'play'; fakeTowersCut(); return; }
  if (!s.opened && s.t >= s.end) {
    s.opened = true; doorOpen = true; const dx = RESULT === 0 ? 17 : 30; M[ty + 5][dx] = RESULT === 0 ? 'd' : 'e';
    SFX.door(); shakeT = 0.8;
    burst(dx * TS + 8, (ty + 5) * TS + 6, 50, RESULT === 0 ? ['#64b5f6', '#fff', '#ffd54f'] : ['#f48fb1', '#fff', '#ffd54f'], 110, 1.1);
  }
  if (s.opened && s.t >= s.end + 1.8) { state = 'play'; playSong(LV.song); say('Uma das torres se abriu! Entrem nela...'); }
}
function startReveal() {
  state = 'reveal'; revealT = 0; playSong(null); fade = 1; fadeCol = '255,255,255'; fireworks = []; parts = [];
  SFX.door();
  later(0.8, () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.35, 'square', 0.1, i * 0.12)); });
  later(2.0, () => playSong('reveal'));
}
function updateReveal(dt) {
  revealT += dt;
  if (rnd() < dt * (revealT < 6 ? 3.2 : 2)) {
    const cols = RESULT === 0 ? ['#64b5f6', '#90caf9', '#1e88e5', '#ffffff', '#ffd54f'] : ['#f48fb1', '#f06292', '#ec407a', '#ffffff', '#ffd54f'];
    fireworks.push({ x: 30 + rnd() * (VW - 60), y: VH, vy: -130 - rnd() * 50, ty: 25 + rnd() * 70, col: cols[(rnd() * cols.length) | 0], cols });
    SFX.launch();
  }
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const f = fireworks[i];
    f.y += f.vy * dt; if (rnd() < 0.6) parts.push({ x: f.x, y: f.y + 2, vx: 0, vy: 10, life: 0.3, max: 0.3, col: '#ffe082', g: 0, size: 1 });
    if (f.y <= f.ty) {
      fireworks.splice(i, 1); SFX.pop();
      const n = 40 + (rnd() * 20 | 0);
      for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, sp = 50 + rnd() * 30; parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.4 + rnd() * 0.6, max: 2, col: rnd() < 0.7 ? f.col : f.cols[(rnd() * f.cols.length) | 0], g: 45, size: rnd() < 0.3 ? 2 : 1 }); }
    }
  }
}

// ---------------- troca de fase ----------------
function nextLevel() {
  if (state === 'trans') return;
  state = 'trans'; SFX.portal(); fadeCol = '0,0,0';
  const n = LV.n + 1;
  later(1.0, () => { loadLevel(n); fade = 1; state = 'play'; say(LV.intro); });
}
function updateCamera(dt) {
  let tx, ty;
  if (camFocus) { tx = camFocus.x - VW / 2; ty = camFocus.y - VH / 2; }
  else if (mode === 2) { tx = (heroes[0].x + heroes[1].x) / 2 + 8 - VW / 2; ty = (heroes[0].y + heroes[1].y) / 2 + 8 - VH / 2; }
  else { tx = L().x + 8 - VW / 2; ty = L().y + 8 - VH / 2; }
  tx = clamp(tx, 0, W * TS - VW); ty = clamp(ty, 0, H * TS - VH);
  cam.x += (tx - cam.x) * Math.min(1, dt * 8); cam.y += (ty - cam.y) * Math.min(1, dt * 8);
}

// ---------------- loop ----------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  readInput(); update(dt); render();
  requestAnimationFrame(frame);
}
function startGame() {
  audioInit(); mode = menuSel === 0 ? 1 : 2; padHero = menuSel === 2 ? 1 : 0; lead = 0;
  const startN = clamp(parseInt(params.get('fase') || '1', 10) || 1, 1, 3);
  loadLevel(startN); state = 'play'; inputLock = 0.3; fade = 1;
  const ctl = mode === 1 ? ['Um controle só: troquem de herói com Y ou X (ou LB/RB). A ou B ataca. START pausa.']
    : (padHero === 0 ? ['Gu joga no CONTROLE. De joga no TECLADO: setas para andar, K ou Enter para atirar, L para chamar o Gu.'] : ['De joga no CONTROLE. Gu joga no TECLADO: setas para andar, K ou Enter para atacar, L para chamar a De.']);
  if (mode === 2) ctl.push('Se alguém ficar preso, aperte o botão de troca para chamar o parceiro até você.');
  say(LV.intro.concat(ctl, ['Boa sorte, Gu e De!']));
}
function update(dt) {
  updateMusic();
  for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers[i].fn; timers.splice(i, 1); f(); } }
  if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
  if (banner && !dlg) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  shakeT = Math.max(0, shakeT - dt); towerShake = Math.max(0, towerShake - dt);
  inputLock = Math.max(0, inputLock - dt);
  if (state === 'faint' || state === 'trans') { fade = Math.min(1, fade + dt * 1.5); return; }
  fade = Math.max(0, fade - dt * (state === 'reveal' ? 0.7 : 1.5));
  updateParts(dt); updateCrow(dt);
  if (state === 'title') {
    if (ui.upP) { menuSel = (menuSel + 2) % 3; SFX.sw(); }
    if (ui.downP) { menuSel = (menuSel + 1) % 3; SFX.sw(); }
    if (ui.atkP) startGame();
    return;
  }
  if (scrollFx) scrollFx.t += dt;
  if (state === 'cut') { updateCut(dt); updateCamera(dt); return; }
  if (dlg) { updateDialog(dt); if (state !== 'suspense') return; }
  if (state === 'suspense') { updateSuspense(dt); return; }
  if (state === 'reveal') { updateReveal(dt); return; }
  if (ui.stP) { paused = !paused; SFX.sw(); }
  if (paused) return;
  inv = Math.max(0, inv - dt);
  updateHeroes(dt); updateArrows(dt); updateEnemies(dt); updatePickups(dt);
  if (state === 'play' && !dlg) updateTriggers(dt);
  updateCamera(dt);
}

// ---------------- render ----------------
const UI = [];
function txt(s, x, y, size = 8, col = '#fff', align = 'left', stroke = null) { UI.push({ s, x, y, size, col, align, stroke }); }
const FONT = '"Lucida Console","Courier New",monospace';
function measure(s, size) { out.font = `bold ${size * S}px ${FONT}`; return out.measureText(s).width / S; }
function wrap(s, size, maxW) { const words = s.split(' '); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
function tri(x1, y1, x2, y2, x3, y3, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); }
function R(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

function drawTile(tx, ty, sx, sy) {
  const T = TILESETS[LV.theme], ch = M[ty][tx], v = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  let img;
  switch (ch) {
    case '.': img = T.ground[v % 3]; break;
    case ',': img = T.deco[v % 2]; break;
    case ':': img = T.path[v % 2]; break;
    case '_': case 'X': case 'D': case 'E': case 'd': case 'e': img = T.floor; break;
    case '#': img = T.wall; break;
    case 'W': img = T.wallCrack; break;
    case 'T': img = T.tree[v % 2]; break;
    case '~': case 'b': case 'v': img = T.liq[(Math.floor(time * 3) + tx) % 4]; break;
    case '=': img = T.bridgeH; break;
    case '|': img = T.bridgeV; break;
    case 'R': img = T.rock; break;
    case 'B': img = T.bush; break;
    case 'C': { const c = LV.crystals[tkey(tx, ty)] || {}; img = crystalTile(LV.theme, !!crystalOn[tkey(tx, ty)], !!c.inLiq, c.mark || 0); break; }
    case 'J': img = T.lever[timedOn[LV.levers[tkey(tx, ty)]] > 0 ? 1 : 0]; break;
    case 'P': img = T.plate[pressed[tkey(tx, ty)] ? 1 : 0]; break;
    case 'G': img = gateOpen(LV.gates[tkey(tx, ty)], tx, ty) ? T.floor : T.gate; break;
    case 'H': img = T.gate; break;
    case 'L': img = T.lock; break;
    case 'I': img = T.sign; break;
    case 'O': ctx.drawImage(T.floor, sx, sy); drawPortal(sx + 8, sy + 8); return;
    case 'A': ctx.drawImage(T.floor, sx, sy); if (M[ty][tx - 1] !== 'A') { ctx.drawImage(T.floor, sx + 16, sy); ctx.drawImage(T.altar, sx, sy); } return;
    default: img = T.ground[0];
  }
  ctx.drawImage(img, sx, sy);
}
function drawPortal(x, y) {
  for (let i = 0; i < 4; i++) { ctx.strokeStyle = ['#7c4dff', '#b388ff', '#e1bee7', '#fff'][i]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, 7 - i * 1.5 + Math.sin(time * 6 + i) * 0.8), Math.max(1, 7 - i * 1.5), time * 2 + i, 0, Math.PI * 2); ctx.stroke(); }
}
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
function drawHero(h, sx, sy) {
  const bob = h.walk > 0 ? (Math.floor(h.walk * 8) % 2) : 0;
  R(sx + 3, sy + 14, 10, 2, 'rgba(0,0,0,0.3)');
  if (inv > 0 && Math.floor(time * 20) % 2 && active().includes(h)) return;
  ctx.drawImage(SPR[h.key + (h.face < 0 ? 'L' : '')], sx, sy - bob);
  if (h.key === 'gu') {
    if (h.atk > 0) {
      const c = { x: sx + 8 + h.fx * 11, y: sy + 9 + h.fy * 11 };
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
      const base = Math.atan2(h.fy, h.fx || (h.fy ? 0 : h.face)); const p = 1 - h.atk / 0.22;
      ctx.arc(sx + 8, sy + 9, 12, base - 1.2, base - 1.2 + 2.4 * p); ctx.stroke();
      R(c.x - 3, c.y - 3, 6, 6, '#b0bec5'); R(c.x - 2, c.y - 2, 4, 4, '#eceff1');
    } else { const ax = h.face > 0 ? sx + 13 : sx - 1; R(ax, sy + 6 - bob, 2, 8, '#6d4424'); R(ax - 1 + (h.face > 0 ? 1 : -1), sy + 5 - bob, 4, 4, '#b0bec5'); }
  } else {
    const ax = h.face > 0 ? sx + 13 : sx; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ax + 1, sy + 9 - bob, 5, h.face > 0 ? -1.3 : 1.84, h.face > 0 ? 1.3 : 4.44); ctx.stroke();
  }
  if (h.anchored) R(sx + 6, sy - 6, 4, 4, '#ffd54f');
  if (mode === 2) tri(sx + 5, sy - 5, sx + 11, sy - 5, sx + 8, sy - 2, h.key === 'gu' ? '#90caf9' : '#f8bbd0');
}
function drawGem(x, y, col) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < 9; j++) { const w = j < 4 ? j + 1 : 8 - j; R(x - w, y - 4 + j, w * 2, 1, j < 4 ? '#ffffff' : col); }
  R(x - 3, y - 3, 6, 4, col); R(x - 2, y - 2, 1, 2, '#fff');
}
function drawItem(it, x, y) {
  const glow = c => { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 5); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; };
  if (it.kind === 'relic') { glow(RELIC_COL[it.id]); drawGem(x, y, RELIC_COL[it.id]); }
  else if (it.kind === 'key') { glow('#ffd54f'); ctx.drawImage(SPR.key, Math.round(x - 5), Math.round(y - 3)); }
  else if (it.kind === 'chupeta') { glow('#fff59d'); ctx.drawImage(SPR.chupeta, Math.round(x - 5), Math.round(y - 5)); }
  else if (it.kind === 'heartC') { glow('#ff8a80'); ctx.drawImage(SPR.heartC, Math.round(x - 4), Math.round(y - 3)); }
  else if (it.kind === 'scroll') { glow('#fff8e1'); ctx.drawImage(SPR.scroll, Math.round(x - 6), Math.round(y - 5)); }
}
function drawWorld() {
  let sxo = 0, syo = 0; if (shakeT > 0) { sxo = (rnd() * 4 - 2) | 0; syo = (rnd() * 4 - 2) | 0; }
  const cx = Math.round(cam.x) + sxo, cy = Math.round(cam.y) + syo;
  const tx0 = Math.max(0, Math.floor(cx / TS)), ty0 = Math.max(0, Math.floor(cy / TS));
  for (let ty = ty0; ty <= Math.min(H - 1, ty0 + 12); ty++) for (let tx = tx0; tx <= Math.min(W - 1, tx0 + 21); tx++) drawTile(tx, ty, tx * TS - cx, ty * TS - cy);
  const T = LV.towers;
  if (T && !towersGone) {
    const sh = towerShake > 0 ? (rnd() * 4 - 2) : 0;
    const opened = i => doorOpen && RESULT === i;
    drawTower(0, 15 * TS - cx + sh, T.y * TS - cy, opened(0)); drawTower(1, 28 * TS - cx - sh, T.y * TS - cy, opened(1));
    if (suspense && suspense.hl >= 0 && !suspense.opened && state === 'suspense') { const bx = (suspense.hl === 0 ? 15 : 28) * TS - cx; ctx.globalAlpha = 0.35; R(bx + 4, -cy - 80, 72, T.y * TS + 180, suspense.hl === 0 ? '#bbdefb' : '#fce4ec'); ctx.globalAlpha = 1; }
    if (towerShake > 0) { ctx.globalAlpha = Math.min(0.6, (1.6 - towerShake) * 0.4); R(15 * TS - cx, T.y * TS - cy - 50, 80, 150, '#fff'); R(28 * TS - cx, T.y * TS - cy - 50, 80, 150, '#fff'); ctx.globalAlpha = 1; }
    if (doorOpen) { const bx = (RESULT === 0 ? 17 : 30) * TS - cx; ctx.globalAlpha = 0.18 + 0.1 * Math.sin(time * 4); R(bx - 8, -cy, 32, (T.y + 6) * TS, '#fff'); ctx.globalAlpha = 1; }
  }
  if (LV.altar && altarPlaced) RELIC_COL.forEach((c, i) => drawGem(23 * TS + 8 + i * 8 - cx, 18 * TS - 1 - cy + Math.sin(time * 3 + i) * 1.5, c));
  for (const it of items) if (!it.taken) drawItem(it, it.x - cx, it.y - cy + Math.sin(time * 3 + it.x) * 2);
  for (const d of drops) { if (d.t > 9 && Math.floor(time * 10) % 2) continue; ctx.drawImage(SPR.heart, Math.round(d.x - cx), Math.round(d.y - cy + Math.sin(d.t * 5))); }
  const ents = [];
  for (const e of enemies) ents.push({ y: e.y + (e.type === 'boss' ? 16 : 0), f: () => drawEnemy(e, Math.round(e.x - cx), Math.round(e.y - cy)) });
  for (const h of heroes) ents.push({ y: h.y + (h === L() ? 0.1 : 0), f: () => drawHero(h, Math.round(h.x - cx), Math.round(h.y - cy)) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  for (const a of arrows) { const x = Math.round(a.x - cx), y = Math.round(a.y - cy); if (a.vx) { R(x - 5, y, 10, 1, '#8d6e63'); R(a.vx > 0 ? x + 4 : x - 6, y - 1, 2, 3, '#eceff1'); } else { R(x, y - 5, 1, 10, '#8d6e63'); R(x - 1, a.vy > 0 ? y + 4 : y - 6, 3, 2, '#eceff1'); } }
  for (const p of parts) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 2)); R(p.x - cx, p.y - cy, p.size, p.size, p.col); } ctx.globalAlpha = 1;
  if (crow) {
    const fl = Math.floor(time * 10) % 2, x = Math.round(crow.x - cx - 8), y = Math.round(crow.y - cy - 8 + (fl ? -1 : 0));
    ctx.drawImage(crow.face > 0 ? SPR.crowL : SPR.crow, x, y);
    if (crow.carry) ctx.drawImage(SPR.scroll, x + 2, y + 12);
  }
  for (const id in timedOn) if (timedOn[id] > 0) {
    const spots = [];
    for (const k in LV.crystals) if (LV.crystals[k].timed === id) spots.push(k);
    for (const k in (LV.levers || {})) if (LV.levers[k] === id) spots.push(k);
    for (const k of spots) { const [x, y] = k.split(',').map(Number); const w = Math.round(14 * timedOn[id] / 7); R(x * TS + 1 - cx, y * TS - 4 - cy, 14, 3, '#000'); R(x * TS + 1 - cx, y * TS - 4 - cy, w, 3, '#ffd54f'); }
  }
}
function drawEnemy(e, sx, sy) {
  if (e.type === 'boss') {
    R(sx + 4, sy + 28, 24, 4, 'rgba(0,0,0,0.35)');
    const img = SPR['boss' + (e.face < 0 ? 'L' : '') + (e.flash > 0 ? 'W' : '')];
    ctx.drawImage(img, sx + (e.tell > 0 ? Math.round(rnd() * 2 - 1) : 0), sy);
    R(sx + 9, sy - 3, 14, 3, '#ffd54f'); R(sx + 9, sy - 6, 2, 3, '#ffd54f'); R(sx + 15, sy - 6, 2, 3, '#ffd54f'); R(sx + 21, sy - 6, 2, 3, '#ffd54f');
    if (e.tell > 0) { ctx.globalAlpha = 0.4; R(sx, sy, 32, 32, '#f44336'); ctx.globalAlpha = 1; }
    if (e.shield) { ctx.strokeStyle = '#80deea'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time * 10); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 19, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    if (e.stun > 0) for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; R(sx + 16 + Math.cos(a) * 10, sy - 2 + Math.sin(a) * 3, 2, 2, '#ffeb3b'); }
    return;
  }
  R(sx + 3, sy + 14, 10, 2, 'rgba(0,0,0,0.3)');
  const fly = e.type === 'bat', sq = e.type.startsWith('slime') ? Math.floor(time * 4 + e.x) % 2 : 0;
  const img = SPR[e.type + (e.face < 0 ? 'L' : '') + (e.flash > 0 ? 'W' : '')];
  ctx.drawImage(img, sx, sy + sq - (fly ? 4 + Math.round(Math.sin(time * 12 + e.x) * 2) : 0));
}
function drawHUD() {
  for (let i = 0; i < maxH; i++) ctx.drawImage(i < hearts ? SPR.heart : SPR.heartE, 4 + i * 9, 4);
  ctx.drawImage(SPR.chupeta, 4, 13); txt('x' + chupetas, 16, 14, 6, '#fff59d');
  if (LV.n > 1) { ctx.drawImage(SPR.key, 34, 15); txt('x' + keysHeld, 46, 14, 6, '#ffd54f'); }
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
function drawDialog() {
  R(8, 126, 304, 50, 'rgba(12,18,40,0.94)'); R(8, 126, 304, 1, '#e8e8ff'); R(8, 175, 304, 1, '#e8e8ff'); R(8, 126, 1, 50, '#e8e8ff'); R(311, 126, 1, 50, '#e8e8ff');
  let full = dlg.lines[dlg.i]; const n = Math.floor(dlg.t * 45);
  const m = full.match(/^(Corvo|Gu|De|Chefe Orc): /);
  if (m) { full = full.slice(m[0].length); const who = m[1], col = { Corvo: '#b0bec5', Gu: '#90caf9', De: '#f8bbd0', 'Chefe Orc': '#aed581' }[who]; const w = measure(who, 7) + 10; R(14, 117, w, 11, '#0c1228'); R(14, 117, w, 1, col); txt(who, 19, 118, 7, col); }
  const lines = wrap(full, 8, 288); let left = n;
  lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length + 1; txt(s, 16, 132 + i * 11, 8, '#fff'); });
  if (n >= full.length && Math.floor(time * 3) % 2) tri(300, 166, 306, 166, 303, 170, '#ffd54f');
}
function drawScroll() {
  const x = VW / 2 - 90, y = 26;
  R(x - 4, y - 3, 188, 7, '#8d6e63'); R(x - 4, y + 77, 188, 7, '#8d6e63');
  R(x, y, 180, 80, '#f4ead2'); R(x, y, 180, 2, '#e0d2b4'); R(x, y + 78, 180, 2, '#d7c49e');
  const t = scrollFx.t, a = scrollFx.lines[0], b = scrollFx.lines[1];
  txt(a.slice(0, Math.floor(t * scrollFx.cps[0])), VW / 2, y + 14, 8, '#4e342e', 'center');
  const tb = t - a.length / scrollFx.cps[0] - 0.6;
  if (tb > 0) {
    const nb = Math.min(b.length, Math.floor(tb * scrollFx.cps[1]));
    if (scrollFx.lastB !== nb) { scrollFx.lastB = nb; if (nb > 0) SFX.tick(300 + nb * 60); }
    txt(b.slice(0, nb) + (nb >= b.length && Math.floor(time * 4) % 2 ? '...' : ''), VW / 2, y + 36, 18, '#c62828', 'center');
  }
}
function drawTitle() {
  ctx.fillStyle = 'rgba(5,8,25,0.6)'; ctx.fillRect(0, 0, VW, VH);
  txt('O DESAFIO DAS', VW / 2, 12, 12, '#ffd54f', 'center', '#3e2723');
  txt('DUAS TORRES', VW / 2, 27, 20, '#ffffff', 'center', '#1a1a2e');
  ctx.drawImage(SPR.gu, VW / 2 - 30, 60 - Math.abs(Math.sin(time * 4)) * 3); ctx.drawImage(SPR.deL, VW / 2 + 14, 60 - Math.abs(Math.sin(time * 4 + 1)) * 3);
  txt('&', VW / 2, 64, 9, '#fff', 'center', '#000');
  const opts = ['1 JOGADOR  (um controle, trocando)', '2 JOGADORES  (Gu: controle / De: teclado)', '2 JOGADORES  (De: controle / Gu: teclado)'];
  opts.forEach((o, i) => { const sel = i === menuSel; if (sel) R(28, 94 + i * 16, VW - 56, 13, 'rgba(255,213,79,0.18)'); txt((sel ? '> ' : '  ') + o, VW / 2, 96 + i * 16, 7, sel ? '#ffd54f' : '#c5cae9', 'center', '#000'); });
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
function drawBaby(x, y, col, col2) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = col2; ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y + 5, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  disc(ctx, x, y - 2, 5, '#f2c39b'); R(x - 3, y - 2, 2, 1, '#1a1a2e'); R(x + 2, y - 2, 2, 1, '#1a1a2e'); R(x - 1, y + 1, 2, 1, '#e57373');
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 3, 0, Math.PI, 0); ctx.fill();
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
function render() {
  UI.length = 0; ctx.imageSmoothingEnabled = false;
  if (state === 'reveal') drawReveal();
  else if (state === 'title') { cam.x = 24 * TS - VW / 2; cam.y = 0; drawWorld(); drawTitle(); }
  else {
    drawWorld(); drawHUD();
    if (scrollFx) drawScroll();
    if (dlg) drawDialog();
    if (paused) drawPause();
  }
  if (fade > 0) { ctx.fillStyle = `rgba(${fadeCol},${fade})`; ctx.fillRect(0, 0, VW, VH); }
  out.imageSmoothingEnabled = false; out.fillStyle = '#000'; out.fillRect(0, 0, cv.width, cv.height);
  out.drawImage(buf, 0, 0, VW, VH, OX, OY, VW * S, VH * S);
  for (const u of UI) {
    out.font = `bold ${Math.round(u.size * S)}px ${FONT}`; out.textAlign = u.align; out.textBaseline = 'top';
    const x = OX + u.x * S, y = OY + u.y * S;
    if (u.stroke) { out.lineJoin = 'round'; out.lineWidth = Math.max(2, u.size * S / 5); out.strokeStyle = u.stroke; out.strokeText(u.s, x, y); }
    out.fillStyle = u.col; out.fillText(u.s, x, y);
  }
}

// tela de titulo usa o mapa da fase 1 como fundo
loadLevel(1); playSong(null); banner = null;
window.__game = {
  get state() { return state; }, get LV() { return LV; }, heroes, get items() { return items; }, get enemies() { return enemies; }, get M() { return M; },
  get lead() { return lead; }, get dlg() { return dlg; }, get flags() { return flags; }, get keys() { return keysHeld; }, get chupetas() { return chupetas; },
  get boss() { return boss; }, get crystalOn() { return crystalOn; }, get mode() { return mode; }, get hearts() { return hearts; }, RESULT, loadLevel, nextLevel,
  setMenu(i) { menuSel = i; }, solidAt,
};
requestAnimationFrame(frame);
