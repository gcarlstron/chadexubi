'use strict';
// =====================================================================
//  levels/fase1.js — A Floresta das Duas Torres  (REVELACAO FALSA #1)
//  Objetivo: 3 reliquias -> altar -> portao abre -> suspense nas torres ->
//  as torres somem (ilusao do Corvo) -> portal para a fase 2.
//  Segredos: chupeta nos arbustos (sudoeste) e atras da parede rachada das ruinas.
// =====================================================================
function buildFase1() {
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
      'Gu, o viking, quebra pedras e arbustos com seu machado. De, a elfa, acerta alvos distantes com seu arco.',
      'Dizem também que há chupetas douradas escondidas pelo reino... o bebê vai querer todas!'],
  };
}

registerLevel(1, () => Object.assign(buildFase1(), {
  altarPlaced: false,
  // altar: com as 3 reliquias abre o portao das torres
  update() {
    const a = this.altar;
    if (this.altarPlaced || !anyNear(a.x, a.y, 28)) return;
    if (relicCount < a.need) { if (cd('altar', 6)) say('Um altar antigo com 3 encaixes vazios... (' + relicCount + '/3 relíquias)'); return; }
    this.altarPlaced = true; SFX.chime(); shakeT = 0.4; burst(a.x, a.y - 8, 40, RELIC_COL.concat(['#fff']), 100, 1);
    this.respawnPt = [[23, 20], [24, 20]];
    say(['As três relíquias brilham sobre o altar...', 'Uma voz ecoa pela floresta: "O GRANDE SEGREDO SERÁ REVELADO AGORA!"', 'O portão das Duas Torres se abriu! Corram!'], () => {
      a.gate.forEach(([x, y]) => M[y][x] = '_'); SFX.door(); shakeT = 0.6; burst(24 * TS, 13 * TS + 8, 30, ['#9a9aa8', '#fff'], 80, 0.7, 60);
    });
  },
  draw(cx, cy) { if (this.altarPlaced) RELIC_COL.forEach((c, i) => drawGem(23 * TS + 8 + i * 8 - cx, 18 * TS - 1 - cy + Math.sin(time * 3 + i) * 1.5, c)); },
  // fim do suspense: as torres eram falsas!
  onFakeTowers() {
    const cx = 24 * TS, cy = 7 * TS;
    runCut([
      { do: () => { camFocus = { x: cx, y: cy }; towerShake = 1.6; SFX.boss(); }, wait: 1.6 },
      { do: () => { SFX.poof(); fade = 0.9; fadeCol = '255,255,255'; vanishTowers(); }, wait: 1.2 },
      { do: () => { crowTo(cx, cy - 10, 90); SFX.crow(); }, until: crowArrived },
      { say: ['Corvo: CRÁ-CRÁ-CRÁ! Caíram direitinho!', 'Corvo: Essas torres eram só uma ilusão minha! Hahaha!', 'Corvo: O segredo verdadeiro está muito bem guardado... depois das Montanhas Geladas!', 'Corvo: Duvido que cheguem lá! CRÁ!'] },
      { do: () => { crowTo(cx + 40, cy - 200, 160); SFX.crow(); }, wait: 1.2 },
      { do: () => { crow = null; }, say: ['Gu: Ah, não acredito! Era tudo de mentira?!', 'De: Calma, Gu. Vamos atrás daquele corvo!'] },
      { do: () => { M[6][23] = 'O'; M[6][24] = 'O'; SFX.portal(); burst(cx, 6 * TS + 8, 40, ['#b388ff', '#fff', '#7c4dff'], 90, 1); }, say: 'Um portal mágico surgiu no meio da praça!' },
    ]);
  },
}));
