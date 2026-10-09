'use strict';
// =====================================================================
//  levels/fase2.js — As Montanhas Geladas  (REVELACAO FALSA #2)
//  Objetivo: chave 1 (caverna, pedras do Gu) + chave 2 (duas placas juntas) +
//  cristais em sequencia (De) -> ponte -> templo com 2 fechaduras ->
//  pergaminho escreve "É MENIN..." e o Corvo rouba -> portal para a fase 3.
//  Segredos: coracao dourado (parede rachada acima da caverna), 2 chupetas em arbustos.
// =====================================================================
function buildFase2() {
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

registerLevel(2, () => Object.assign(buildFase2(), {
  // entrar no templo dispara a cena do pergaminho roubado
  update() {
    const t = this.temple;
    if (flags.temple || !anyIn(t.x0, t.y0, t.x1, t.y1)) return;
    flags.temple = 1;
    const cx = 24 * TS, cy = 4 * TS;
    playSong(null);
    runCut([
      { do: () => { camFocus = { x: cx, y: cy + 30 }; }, say: ['O Templo do Oráculo!', 'Uma voz antiga ecoa: "Vocês chegaram longe... agora o segredo SERÁ revelado!"', 'Um pergaminho brilhante se abre sobre o altar...'] },
      { do: () => { SFX.chime(); showScroll('O bebê de Gu e De é...', 'É MENIN'); }, until: scrollDone },
      { wait: 1.6 },
      { do: () => { crowTo(cam.x + VW / 2, cam.y + VH / 2 - 10, 260); crow.x = cam.x + VW + 20; crow.y = cam.y + 30; SFX.crow(); }, until: crowArrived },
      { do: () => { scrollFx = null; crow.carry = true; SFX.crow(); shakeT = 0.3; crowTo(cam.x - 60, cam.y + 20, 220); }, wait: 1.0 },
      { do: () => { crowTo(cx, cy + 12, 160); }, until: crowArrived },
      { say: ['Corvo: CRÁ-CRÁ! Esse pergaminho agora é MEU!', 'Corvo: Se quiserem saber o final, venham buscar na Fortaleza dos Orcs...', 'Corvo: ...se tiverem coragem! CRÁ-CRÁ-CRÁ!'] },
      { do: () => { crowTo(cx + 30, cy - 200, 170); }, wait: 1.0 },
      { do: () => { crow = null; }, say: ['De: Ele levou bem na hora!!', 'Gu: "É MENIN..." — menino ou menina?! Atrás dele!'] },
      { do: () => { M[5][20] = 'O'; SFX.portal(); burst(20 * TS + 8, 5 * TS + 8, 40, ['#b388ff', '#fff', '#7c4dff'], 90, 1); playSong(this.song); }, say: 'Um portal mágico se abriu no canto do templo!' },
    ]);
  },
}));
