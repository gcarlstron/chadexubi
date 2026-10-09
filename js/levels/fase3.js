'use strict';
// =====================================================================
//  levels/fase3.js — A Fortaleza dos Orcs  (REVELACAO VERDADEIRA)
//  Objetivo: cristal levanta ponte na lava -> alavanca (Gu) + cristal (De) juntos
//  abrem a jaula da chave -> porta da muralha -> CHEFE ORC -> pergaminho ->
//  portao das Duas Torres verdadeiras -> suspense -> porta certa -> revelacao.
//  Segredo: chupeta atras da parede rachada da muralha (oeste).
// =====================================================================
function buildFase3() {
  const g = Grid(48, 40, 1313);
  g.deco(0.05); g.border();
  // lava externa
  g.rect(2, 2, 7, 12, '~'); g.rect(39, 2, 7, 16, '~'); g.rect(9, 2, 3, 7, '~'); g.rect(36, 2, 3, 7, '~');
  g.rect(2, 14, 1, 4, 'T'); g.rect(8, 14, 1, 4, 'T');
  // praca final
  g.outline(12, 1, 24, 9, '#'); g.rect(13, 2, 22, 7, '_');
  g.rect(15, 2, 5, 6, 'X'); g.set(17, 7, 'D'); g.rect(28, 2, 5, 6, 'X'); g.set(30, 7, 'E');
  // arena
  g.outline(9, 9, 30, 10, '#'); g.rect(10, 10, 28, 8, '_');
  g.set(23, 9, 'H'); g.set(24, 9, 'H');
  // muralha + fechadura
  g.rect(2, 18, 44, 1, '#'); g.set(23, 18, 'L'); g.set(24, 18, 'L');
  // segredo: sala na muralha
  g.outline(3, 14, 5, 5, '#'); g.rect(4, 15, 3, 3, '_'); g.set(5, 18, 'W');
  // patio
  g.rect(23, 19, 2, 11, ':');
  g.rect(9, 20, 6, 4, '~'); g.set(12, 21, 'C');
  g.set(16, 26, 'J'); g.set(14, 26, 'I');
  g.outline(36, 21, 7, 6, '#'); g.rect(37, 22, 5, 4, '_'); g.set(39, 26, 'G');
  g.rect(28, 20, 3, 2, '~'); g.rect(17, 21, 2, 2, '~');
  g.rect(25, 27, 15, 1, ':');
  // rio de lava + ponte escondida
  g.rect(2, 30, 44, 3, '~'); g.rect(23, 30, 2, 3, 'v'); g.set(27, 28, 'C');
  g.rect(23, 33, 2, 5, ':'); g.set(21, 34, 'I');
  g.trees(0.07, [[20, 19, 8, 12], [8, 19, 12, 10], [33, 19, 12, 11], [20, 33, 10, 5], [2, 19, 6, 6], [25, 26, 6, 3]]);
  return {
    n: 3, name: 'A Fortaleza dos Orcs', theme: 'volcano', song: 'volcano', W: g.W, H: g.H, M: g.M,
    start: [[23, 36], [24, 36]],
    items: [{ kind: 'key', ...tc(39, 23) }, { kind: 'chupeta', ...tc(5, 16) }],
    enemies: [['orc', 18, 35], ['orc', 30, 35], ['bat', 12, 34], ['bat', 36, 34], ['orc', 8, 27], ['orc', 30, 23], ['orc', 33, 27], ['bat', 20, 23], ['bat', 29, 25], ['slimeF', 5, 24], ['slimeF', 43, 28], ['skel', 38, 23], ['skel', 4, 21]],
    signs: {
      '21,34': ['Uma ponte de pedra dorme sob a lava...', 'Uma flecha no cristal do outro lado pode acordá-la!'],
      '14,26': ['A jaula da chave só abre se o cristal e a alavanca', 'brilharem AO MESMO TEMPO! Sejam rápidos!'],
    },
    plates: {}, gates: { '39,26': 'jaula' }, gateRules: { jaula: { mode: 'flag', flag: 'jaula' } },
    crystals: {
      '27,28': { bridge: [[23, 32], [24, 32], [23, 31], [24, 31], [23, 30], [24, 30]], msg: 'A lava borbulha... uma ponte de pedra surgiu!' },
      '12,21': { timed: 'cristal', inLiq: true },
    },
    levers: { '16,26': 'alavanca' },
    combo: { a: 'cristal', b: 'alavanca', flag: 'jaula', msg: 'Cristal e alavanca juntos! A jaula se abriu!' },
    lockNeed: { '23,18': 1, '24,18': 1 },
    arena: { x0: 10, y0: 10, x1: 37, y1: 16, door: [[23, 18], [24, 18]], gate: [[23, 9], [24, 9]], boss: [23, 11] },
    towers: { y: 2, fake: false, plazaY: 9 },
    intro: ['A Fortaleza dos Orcs! O Corvo escondeu o pergaminho aqui.', 'Cuidado com a lava... e com o Chefe Orc!'],
  };
}

registerLevel(3, () => Object.assign(buildFase3(), {
  // entrar na arena: porta fecha, Corvo chama o Chefe Orc
  update() {
    const a = this.arena;
    if (flags.arena) return;
    const h = anyIn(a.x0, a.y0, a.x1, a.y1); if (!h) return;
    flags.arena = 1;
    const o = partner(h); o.x = h.x + (o === heroes[0] ? -16 : 16); o.y = h.y; if (blocked(o)) { o.x = h.x; o.y = h.y; }
    o.anchored = false; trail = [];
    for (const hh of heroes) hh.y = Math.min(hh.y, 16 * TS + 8); // ninguem fica preso na porta
    this.respawnPt = [[23, 16], [24, 16]];
    playSong(null);
    runCut([
      { do: () => { a.door.forEach(([x, y]) => M[y][x] = '#'); SFX.door(); shakeT = 0.5; camFocus = { x: 24 * TS, y: 13 * TS }; }, wait: 0.8 },
      { do: () => { crowTo(24 * TS, 11 * TS, 120); SFX.crow(); }, until: crowArrived },
      { say: ['Corvo: CRÁ! Chegaram até aqui?', 'Corvo: O pergaminho está comigo... e o segredo também!', 'Corvo: CHEFE ORC! Acabe com eles!'] },
      { do: () => { crowTo(24 * TS, -40, 150); smoke(a.boss[0] * TS + 16, a.boss[1] * TS + 16, 50); SFX.boss(); shakeT = 0.6; spawnBoss(a.boss[0], a.boss[1]); }, wait: 1.2 },
      { do: () => { crow = null; playSong('boss'); }, say: ['Chefe Orc: GRRROOOAAARRR!', 'Dica: o machado do Gu bate forte, e a flecha da De quebra escudos mágicos!'] },
    ]);
  },
  onBossDefeated(e) {
    const c = center(e); playSong(null);
    for (let i = 0; i < 6; i++) later(i * 0.25, () => { burst(c.x + rnd() * 30 - 15, c.y + rnd() * 30 - 15, 20, ['#ff7043', '#ffd54f', '#fff'], 90, 0.7); SFX.kill(); shakeT = 0.3; });
    later(1.6, () => runCut([
      { do: () => { smoke(c.x, c.y, 60); SFX.poof(); camFocus = { x: c.x, y: c.y }; }, wait: 1.0 },
      { do: () => { crowTo(c.x + 20, c.y - 20, 140); SFX.crow(); }, until: crowArrived },
      { say: ['Corvo: Nããão! Meu Chefe Orc!', 'Corvo: Tá bom, tá bom... vocês venceram. O pergaminho é de vocês. CRÁ...'] },
      { do: () => { items.push({ kind: 'scroll', x: c.x, y: c.y + 4, taken: false }); SFX.key(); crowTo(c.x + 60, -60, 160); }, wait: 1.0 },
      { do: () => { crow = null; this.arena.door.forEach(([x, y]) => M[y][x] = '_'); playSong(this.song); }, say: 'O Corvo deixou cair o pergaminho! Peguem!' },
    ]));
  },
  onScroll() {
    say(['O pergaminho diz: "As Duas Torres VERDADEIRAS guardam o segredo no topo da fortaleza."', 'Desta vez não tem truque. O portão do norte se abriu!'], () => {
      this.arena.gate.forEach(([x, y]) => M[y][x] = '_'); SFX.door(); shakeT = 0.6; burst(24 * TS, 9 * TS + 8, 30, ['#9a9aa8', '#fff'], 80, 0.7, 60);
    });
  },
}));
