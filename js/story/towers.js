'use strict';
// =====================================================================
//  story/towers.js — as Duas Torres: suspense, porta que abre e revelacao
//  LV.towers = { y: linha do topo das torres, fake: bool, plazaY: linha do portao }
//  Torres falsas (fake): o suspense termina e chama LV.onFakeTowers().
//  Torres verdadeiras: abre a porta da torre do RESULT; entrar = revelacao.
//  Torre 0 (Valhala, azul) fica em x=15..19 e porta x=17; torre 1 (Lothlorien) x=28..32, porta x=30.
// =====================================================================
let suspense = null, doorOpen = false, towersGone = false, towerShake = 0, revealT = 0, fireworks = [];
onLevelLoad(() => { suspense = null; doorOpen = false; towersGone = false; towerShake = 0; });
const TOWER_X = [15, 28], DOOR_X = [17, 30];

function updateTowers() {
  const T = LV.towers; if (!T) return;
  if (!suspense && !towersGone && M[T.plazaY][23] !== 'H' && anyIn(13, 0, 34, T.plazaY - 1)) {
    if (!T.fake && RESULT === null) { if (cd('oraculo', 8)) say(['As torres aguardam em silêncio...', 'O Oráculo ainda não revelou o segredo. (Falta o arquivo segredo.js na pasta do jogo.)']); }
    else startSuspense();
  }
  if (doorOpen) {
    const dx = DOOR_X[RESULT], dy = T.y + 5;
    if (active().some(h => overlap(hb(h), { x: dx * TS + 2, y: dy * TS, w: 12, h: 18 }))) startReveal();
  }
}
function startSuspense() {
  const fake = LV.towers.fake;
  const target = fake ? (rnd() < 0.5 ? 0 : 1) : RESULT;
  suspense = { t: 0, times: [], i: 0, hl: -1, opened: false, fake };
  let t = 1.0, iv = 0.08; const lim = fake ? 0.55 : 0.7;
  while (iv < lim) { suspense.times.push(t); t += iv; iv *= 1.12; }          // pisca cada vez mais devagar
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
  if (s.fake && s.t >= s.end) { s.hl = -1; state = 'play'; LV.onFakeTowers(); return; }
  if (!s.opened && s.t >= s.end) {
    s.opened = true; doorOpen = true; const dx = DOOR_X[RESULT]; M[ty + 5][dx] = RESULT === 0 ? 'd' : 'e';
    SFX.door(); shakeT = 0.8;
    burst(dx * TS + 8, (ty + 5) * TS + 6, 50, RESULT === 0 ? ['#64b5f6', '#fff', '#ffd54f'] : ['#f48fb1', '#fff', '#ffd54f'], 110, 1.1);
  }
  if (s.opened && s.t >= s.end + 1.8) { state = 'play'; playSong(LV.song); say('Uma das torres se abriu! Entrem nela...'); }
}
// some com as torres (usado pela fase 1)
function vanishTowers() {
  towersGone = true;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('XDE'.includes(M[y][x])) M[y][x] = '_';
  smoke(17 * TS + 8, (LV.towers.y + 3) * TS, 60); smoke(30 * TS + 8, (LV.towers.y + 3) * TS, 60);
}
function drawTowers(cx, cy) {
  const T = LV.towers; if (!T || towersGone) return;
  const sh = towerShake > 0 ? (rnd() * 4 - 2) : 0;
  const opened = i => doorOpen && RESULT === i;
  drawTower(0, TOWER_X[0] * TS - cx + sh, T.y * TS - cy, opened(0)); drawTower(1, TOWER_X[1] * TS - cx - sh, T.y * TS - cy, opened(1));
  if (suspense && suspense.hl >= 0 && !suspense.opened && state === 'suspense') { const bx = TOWER_X[suspense.hl] * TS - cx; ctx.globalAlpha = 0.35; R(bx + 4, -cy - 80, 72, T.y * TS + 180, suspense.hl === 0 ? '#bbdefb' : '#fce4ec'); ctx.globalAlpha = 1; }
  if (towerShake > 0) { ctx.globalAlpha = Math.min(0.6, (1.6 - towerShake) * 0.4); R(TOWER_X[0] * TS - cx, T.y * TS - cy - 50, 80, 150, '#fff'); R(TOWER_X[1] * TS - cx, T.y * TS - cy - 50, 80, 150, '#fff'); ctx.globalAlpha = 1; }
  if (doorOpen) { const bx = DOOR_X[RESULT] * TS - cx; ctx.globalAlpha = 0.18 + 0.1 * Math.sin(time * 4); R(bx - 8, -cy, 32, (T.y + 6) * TS, '#fff'); ctx.globalAlpha = 1; }
}

// ---------------- revelacao final ----------------
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
