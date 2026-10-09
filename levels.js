'use strict';
// =====================================================================
//  levels.js — as 3 fases
//  Legenda de tiles:
//  . chao   , chao decorado   : caminho   _ piso   # muro   W muro rachado (segredo, machado)
//  T arvore ~ agua/lava  b/v ponte escondida (H/V)  = | ponte  R pedra rachada (machado)
//  B arbusto (machado)  C cristal (flecha)  J alavanca (machado)  P placa  G grade  L fechadura
//  H portao grande  I placa de aviso  A altar  X torre  D/E portas das torres  O portal
// =====================================================================
function Grid(W, H, seed) {
  const M = []; for (let y = 0; y < H; y++) M.push(Array(W).fill('.'));
  const r = mulberry(seed);
  const g = {
    W, H, M, r,
    set(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) M[y][x] = c; },
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(i, j, c); },
    outline(x, y, w, h, c) { for (let i = x; i < x + w; i++) { g.set(i, y, c); g.set(i, y + h - 1, c); } for (let j = y; j < y + h; j++) { g.set(x, j, c); g.set(x + w - 1, j, c); } },
    deco(p) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (M[y][x] === '.' && r() < p) M[y][x] = ','; },
    border() { g.rect(0, 0, W, 2, 'T'); g.rect(0, H - 2, W, 2, 'T'); g.rect(0, 0, 2, H, 'T'); g.rect(W - 2, 0, 2, H, 'T'); },
    trees(p, keep) {
      const inKeep = (x, y) => keep.some(([a, b, w, h]) => x >= a && x < a + w && y >= b && y < b + h);
      for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (!'.,'.includes(M[y][x]) || inKeep(x, y) || r() > p) continue;
        let ok = true;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!'.,T'.includes(M[y + j][x + i])) ok = false;
        if (ok) M[y][x] = 'T';
      }
    },
  };
  return g;
}
const tc = (x, y) => ({ x: x * TS + 8, y: y * TS + 8 });

// ---------------------------------------------------------------------
//  FASE 1 — Floresta (torres falsas)
// ---------------------------------------------------------------------
function level1() {
  const g = Grid(48, 40, 2026);
  g.deco(0.06); g.border();
  g.outline(12, 2, 24, 12, '#'); g.rect(13, 3, 22, 10, '_');
  g.set(23, 13, 'H'); g.set(24, 13, 'H');
  g.rect(15, 3, 5, 6, 'X'); g.set(17, 8, 'D');
  g.rect(28, 3, 5, 6, 'X'); g.set(30, 8, 'E');
  g.rect(23, 14, 2, 23, ':'); g.rect(19, 16, 10, 6, ':');
  g.set(23, 18, 'A'); g.set(24, 18, 'A');
  g.rect(5, 22, 29, 2, ':');
  // oeste: bosque fechado
  g.outline(2, 14, 8, 7, 'T'); g.rect(3, 15, 6, 5, '.');
  g.set(5, 20, 'R'); g.set(6, 20, 'R'); g.rect(5, 21, 2, 1, ':'); g.set(8, 21, 'I');
  // leste: lago
  g.rect(34, 14, 12, 15, '~'); g.rect(39, 19, 5, 7, '.');
  g.set(39, 22, 'C'); g.rect(34, 23, 5, 1, 'b'); g.set(32, 21, 'I');
  // sudeste: ruinas
  g.rect(25, 29, 12, 2, ':');
  g.outline(30, 31, 13, 7, '#'); g.rect(31, 32, 11, 5, '_');
  g.set(36, 31, 'G'); g.set(28, 29, 'P'); g.set(27, 28, 'I');
  // segredo: nicho atras da parede rachada das ruinas
  g.set(42, 34, 'W'); g.rect(43, 33, 3, 3, '_'); g.rect(43, 32, 3, 1, '#'); g.rect(43, 36, 3, 1, '#');
  // segredo: arbustos no sudoeste
  g.outline(4, 31, 5, 5, 'B'); g.rect(5, 32, 3, 3, '.');
  g.set(21, 15, 'I'); g.set(21, 33, 'I');
  g.trees(0.11, [[3, 15, 6, 5], [39, 19, 5, 7], [19, 29, 10, 9], [18, 15, 12, 8], [8, 24, 8, 8], [12, 26, 10, 9], [36, 3, 9, 10], [3, 30, 7, 7], [42, 29, 4, 9]]);
  for (const [x, y] of [[38, 4], [42, 6], [40, 10], [44, 3]]) g.set(x, y, 'T');
  return {
    n: 1, name: 'A Floresta das Duas Torres', theme: 'forest', song: 'forest', W: g.W, H: g.H, M: g.M,
    start: [[23, 34], [24, 35]],
    items: [
      { kind: 'relic', id: 0, ...tc(5, 16) }, { kind: 'relic', id: 1, ...tc(41, 22) }, { kind: 'relic', id: 2, ...tc(36, 35) },
      { kind: 'chupeta', ...tc(6, 33) }, { kind: 'chupeta', ...tc(44, 34) },
    ],
    enemies: [['slime', 11, 26], ['slime', 13, 18], ['slime', 9, 29], ['slime', 15, 34], ['slime', 30, 18], ['slime', 28, 25], ['skel', 42, 30], ['skel', 33, 34], ['skel', 39, 33], ['skel', 41, 9]],
    signs: {
      '21,33': ['Bem-vindos, Gu e De!', 'Reúnam as 3 relíquias sagradas e levem ao altar. Lá as Duas Torres vão revelar o grande segredo!'],
      '8,21': ['Pedras rachadas bloqueiam o bosque...', 'Dizem que só o machado de um viking consegue quebrá-las.'],
      '32,21': ['Um cristal antigo brilha na ilha do lago.', 'Só uma flecha élfica alcança tão longe. Mirem para a direita!'],
      '27,28': ['A placa antiga abre o portão das ruínas...', '...mas só enquanto alguém estiver em cima dela. Quem fica, espera!'],
      '21,15': ['Além deste portão estão as Duas Torres.', 'É lá que o segredo será revelado! (Quase lá!)'],
    },
    plates: { '28,29': 'ruina' }, gates: { '36,31': 'ruina' },
    gateRules: { ruina: { mode: 'hold', flag: 'relic2' } },
    crystals: { '39,22': { bridge: [[38, 23], [37, 23], [36, 23], [35, 23], [34, 23]], msg: 'O cristal brilhou! Uma ponte surgiu sobre o lago!' } },
    altar: { x: 24 * TS, y: 18 * TS + 8, need: 3, gate: [[23, 13], [24, 13]] },
    towers: { y: 3, fake: true, plazaY: 13 },
    intro: ['Num reino distante, uma nova vida está a caminho...',
      'Duas torres guardam o grande segredo: Valhala, a torre azul, e Lothlórien, a torre rosa.',
      'Só quem reunir as 3 relíquias sagradas e levá-las ao altar verá qual delas vai se abrir.',
      'Gu, o viking, quebra pedras e arbustos com seu machado. De, a elfa, acerta alvos distantes com seu arco.'],
  };
}

// ---------------------------------------------------------------------
//  FASE 2 — Montanhas Geladas (pergaminho roubado)
// ---------------------------------------------------------------------
function level2() {
  const g = Grid(48, 36, 77);
  g.deco(0.05); g.border();
  g.rect(2, 2, 12, 7, 'T'); g.rect(34, 2, 12, 7, 'T');
  g.rect(14, 9, 20, 9, '~');
  // templo
  g.outline(18, 2, 12, 6, '#'); g.rect(19, 3, 10, 4, '_');
  g.set(23, 4, 'A'); g.set(24, 4, 'A');
  g.set(23, 7, 'L'); g.set(24, 7, 'L');
  g.rect(23, 8, 2, 1, ':'); g.rect(23, 9, 2, 9, 'v');
  g.set(17, 12, 'C'); g.set(20, 12, 'C'); g.set(29, 12, 'C');
  // segredo: canto do templo atras de arbustos
  g.set(15, 2, 'B'); g.set(14, 3, 'B'); g.set(15, 3, 'B');
  // caminhos
  g.rect(23, 18, 2, 16, ':'); g.rect(6, 24, 36, 2, ':');
  // caverna oeste (chave 1)
  g.outline(3, 12, 9, 9, '#'); g.rect(4, 13, 7, 7, '_');
  g.set(6, 20, 'R'); g.set(7, 20, 'R'); g.rect(6, 21, 2, 3, ':');
  // segredo: sala acima da caverna
  g.outline(5, 8, 5, 5, '#'); g.rect(6, 9, 3, 3, '_'); g.set(7, 12, 'W');
  // leste: duas placas (chave 2)
  g.outline(36, 11, 9, 8, '#'); g.rect(37, 12, 7, 6, '_');
  g.set(40, 18, 'G'); g.set(38, 21, 'P'); g.set(42, 21, 'P'); g.rect(38, 19, 5, 2, ':');
  // segredo: arbustos sudeste
  g.outline(40, 27, 5, 5, 'B'); g.rect(41, 28, 3, 3, '.');
  for (const k of ['21,31', '21,19', '9,22', '40,22']) { const [x, y] = k.split(',').map(Number); g.set(x, y, 'I'); }
  g.trees(0.10, [[14, 2, 20, 7], [3, 9, 11, 16], [19, 18, 10, 18], [35, 10, 11, 14], [39, 26, 7, 7], [4, 22, 6, 4]]);
  return {
    n: 2, name: 'As Montanhas Geladas', theme: 'snow', song: 'snow', W: g.W, H: g.H, M: g.M,
    start: [[23, 32], [24, 32]],
    items: [
      { kind: 'key', ...tc(7, 14) }, { kind: 'key', ...tc(40, 13) }, { kind: 'heartC', ...tc(7, 10) },
      { kind: 'chupeta', ...tc(14, 2) }, { kind: 'chupeta', ...tc(42, 29) },
    ],
    enemies: [['slimeI', 10, 28], ['slimeI', 16, 21], ['slimeI', 30, 21], ['slimeI', 34, 30], ['orc', 5, 16], ['orc', 9, 17], ['orc', 13, 29], ['orc', 38, 15], ['bat', 42, 14], ['bat', 28, 28], ['bat', 18, 26], ['orc', 31, 27]],
    signs: {
      '21,31': ['As Montanhas Geladas...', 'Dizem que no Templo do Oráculo, ao norte, o segredo será FINALMENTE revelado!'],
      '21,19': ['Três cristais guardam a ponte do templo.', 'Acertem na ordem das marcas douradas: uma, duas, três!', 'A porta do templo tem duas fechaduras... procurem as duas chaves!'],
      '9,22': ['Caverna do Gelo. Uma chave brilha lá dentro...', '...atrás de pedras rachadas. Já sabem quem chamar!'],
      '40,22': ['Duas placas, um portão.', 'Sozinho ninguém abre. Juntos, sim!'],
    },
    plates: { '38,21': 'gelo', '42,21': 'gelo' }, gates: { '40,18': 'gelo' },
    gateRules: { gelo: { mode: 'all' } },
    crystals: {
      '20,12': { seq: 1, mark: 1, inLiq: true }, '29,12': { seq: 2, mark: 2, inLiq: true }, '17,12': { seq: 3, mark: 3, inLiq: true },
    },
    seqBridge: { bridge: [[23, 17], [24, 17], [23, 16], [24, 16], [23, 15], [24, 15], [23, 14], [24, 14], [23, 13], [24, 13], [23, 12], [24, 12], [23, 11], [24, 11], [23, 10], [24, 10], [23, 9], [24, 9]], msg: 'Os três cristais brilham juntos! Uma ponte de gelo surgiu até o templo!' },
    lockNeed: { '23,7': 2, '24,7': 2 },
    temple: { x0: 19, y0: 3, x1: 28, y1: 6 },
    intro: ['O portal levou Gu e De até as Montanhas Geladas...', 'O Corvo disse que o segredo está no Templo do Oráculo, depois do lago congelado.', 'Encontrem as duas chaves do templo!'],
  };
}

// ---------------------------------------------------------------------
//  FASE 3 — Fortaleza dos Orcs (chefao + torres verdadeiras)
// ---------------------------------------------------------------------
function level3() {
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
const LEVELS = [null, level1, level2, level3];
