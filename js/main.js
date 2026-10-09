'use strict';
// =====================================================================
//  main.js — inicio do jogo, loop principal (update + render) e camera
//  Ordem do update na fase:
//    herois -> placas -> flechas -> inimigos -> itens -> gatilhos (avisos,
//    timers, fechaduras, portal, gancho da fase, torres) -> camera
// =====================================================================
function startGame() {
  audioInit(); mode = menuSel === 0 ? 1 : 2; padHero = menuSel === 2 ? 1 : 0; lead = 0;
  const startN = clamp(parseInt(params.get('fase') || '1', 10) || 1, 1, 3);
  loadLevel(startN); state = 'play'; inputLock = 0.3; fade = 1;
  const ctl = mode === 1 ? ['Um controle só: troquem de herói com Y ou X (ou LB/RB). A ou B ataca. START pausa.']
    : (padHero === 0 ? ['Gu joga no CONTROLE. De joga no TECLADO: setas para andar, K ou Enter para atirar, L para chamar o Gu.'] : ['De joga no CONTROLE. Gu joga no TECLADO: setas para andar, K ou Enter para atacar, L para chamar a De.']);
  if (mode === 2) ctl.push('Se alguém ficar preso, aperte o botão de troca para chamar o parceiro até você.');
  say(LV.intro.concat(ctl, ['Boa sorte, Gu e De!']));
}

function updateTriggers(dt) {
  updateSigns();
  updateTimed(dt);
  updateLocks();
  if (updatePortals()) return;
  if (LV.update) LV.update(dt);
  updateTowers();
}
function updateCamera(dt) {
  let tx, ty;
  if (camFocus) { tx = camFocus.x - VW / 2; ty = camFocus.y - VH / 2; }
  else if (mode === 2) { tx = (heroes[0].x + heroes[1].x) / 2 + 8 - VW / 2; ty = (heroes[0].y + heroes[1].y) / 2 + 8 - VH / 2; }
  else { tx = L().x + 8 - VW / 2; ty = L().y + 8 - VH / 2; }
  tx = clamp(tx, 0, W * TS - VW); ty = clamp(ty, 0, H * TS - VH);
  cam.x += (tx - cam.x) * Math.min(1, dt * 8); cam.y += (ty - cam.y) * Math.min(1, dt * 8);
}

function update(dt) {
  updateMusic(); updateTimers(dt);
  if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
  if (banner && !dlg) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  shakeT = Math.max(0, shakeT - dt); towerShake = Math.max(0, towerShake - dt); inputLock = Math.max(0, inputLock - dt);
  if (state === 'faint' || state === 'trans') { fade = Math.min(1, fade + dt * 1.5); return; }
  fade = Math.max(0, fade - dt * (state === 'reveal' ? 0.7 : 1.5));
  updateParts(dt); updateCrow(dt);
  if (state === 'title') {
    if (ui.upP) { menuSel = (menuSel + MENU_OPTS.length - 1) % MENU_OPTS.length; SFX.sw(); }
    if (ui.downP) { menuSel = (menuSel + 1) % MENU_OPTS.length; SFX.sw(); }
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
  updateHeroes(dt); updatePlates(); updateArrows(dt); updateEnemies(dt); updatePickups(dt);
  if (state === 'play' && !dlg) updateTriggers(dt);
  updateCamera(dt);
}

function drawWorld() {
  let sxo = 0, syo = 0; if (shakeT > 0) { sxo = (rnd() * 4 - 2) | 0; syo = (rnd() * 4 - 2) | 0; }
  const cx = Math.round(cam.x) + sxo, cy = Math.round(cam.y) + syo;
  const tx0 = Math.max(0, Math.floor(cx / TS)), ty0 = Math.max(0, Math.floor(cy / TS));
  for (let ty = ty0; ty <= Math.min(H - 1, ty0 + 12); ty++) for (let tx = tx0; tx <= Math.min(W - 1, tx0 + 21); tx++) drawTile(tx, ty, tx * TS - cx, ty * TS - cy);
  drawTowers(cx, cy);
  if (LV.draw) LV.draw(cx, cy);
  drawItems(cx, cy);
  // entidades ordenadas por y (quem esta mais embaixo aparece na frente)
  const ents = [];
  for (const e of enemies) ents.push({ y: e.y + (e.type === 'boss' ? 16 : 0), f: () => drawEnemy(e, Math.round(e.x - cx), Math.round(e.y - cy)) });
  for (const h of heroes) ents.push({ y: h.y + (h === L() ? 0.1 : 0), f: () => drawHero(h, Math.round(h.x - cx), Math.round(h.y - cy)) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  drawArrows(cx, cy);
  for (const p of parts) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 2)); R(p.x - cx, p.y - cy, p.size, p.size, p.col); } ctx.globalAlpha = 1;
  drawCrow(cx, cy);
  drawTimedBars(cx, cy);
}
function render() {
  ctx.imageSmoothingEnabled = false;
  if (state === 'reveal') drawReveal();
  else if (state === 'title') { cam.x = 24 * TS - VW / 2; cam.y = 0; drawWorld(); drawTitle(); }
  else { drawWorld(); drawHUD(); if (scrollFx) drawScroll(); if (dlg) drawDialog(); if (paused) drawPause(); }
  if (fade > 0) { ctx.fillStyle = `rgba(${fadeCol},${fade})`; ctx.fillRect(0, 0, VW, VH); }
  out.imageSmoothingEnabled = false; out.fillStyle = '#000'; out.fillRect(0, 0, cv.width, cv.height);
  out.drawImage(buf, 0, 0, VW, VH, OX, OY, VW * S, VH * S);
  flushText();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  readInput(); update(dt); render();
  requestAnimationFrame(frame);
}

// tela de titulo usa o mapa da fase 1 como fundo
loadLevel(1); playSong(null); banner = null;
// ganchos para testes automatizados (console do navegador)
window.__game = {
  get state() { return state; }, get LV() { return LV; }, heroes, get items() { return items; }, get enemies() { return enemies; }, get M() { return M; },
  get lead() { return lead; }, get dlg() { return dlg; }, get flags() { return flags; }, get keys() { return keysHeld; }, get chupetas() { return chupetas; },
  get boss() { return boss; }, get crystalOn() { return crystalOn; }, get mode() { return mode; }, get hearts() { return hearts; }, RESULT, loadLevel, nextLevel,
  setMenu(i) { menuSel = i; }, solidAt,
};
requestAnimationFrame(frame);
