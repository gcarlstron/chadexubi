# Arquitetura — O Desafio das Duas Torres

O jogo é feito em JavaScript puro com Canvas, sem build e sem dependências. Ele abre direto pelo `index.html` (via `file://`), e por isso usa scripts clássicos em vez de módulos ES. Os arquivos compartilham o escopo global e a **ordem de carregamento no `index.html` importa**: cada arquivo só usa, no momento em que carrega, o que foi definido antes dele.

## Pastas

| Pasta | O que tem |
|---|---|
| `js/core/` | `util.js` (constantes, utilitários, leitura do segredo), `canvas.js` (tela e buffer 320x180), `audio.js` (SFX e músicas), `input.js` (teclado/controle por jogador) |
| `js/gfx/` | `sprites.js` (pixel art em texto), `tiles.js` (imagens dos tiles por tema), `draw.js` (primitivas, torres, portal, bebê e texto nítido) |
| `js/world/` | `state.js` (estado global e da fase, partículas, timers), `tiles.js` (**registro de tiles**), `collision.js`, `level.js` (Grid, **registro de fases**, carga e portal) |
| `js/mechanics/` | Uma mecânica por arquivo: `breakables` (pedra/parede/arbusto), `crystals` (pontes, sequência, temporizado), `levers` (alavanca + combo), `plates` (placas e grades), `carry` (**itens carregáveis + receptores**), `locks` (portas que recebem chaves), `signs` (avisos lidos com o botão de ação), `items` (**registro de itens**) |
| `js/entities/` | `heroes.js` (Gu e De: movimento, ataques, troca/chamar), `enemies.js` (**registro de inimigos** + IA padrão), `boss.js` (Chefe Orc), `crow.js` (Corvo) |
| `js/story/` | `dialog.js` (caixa de diálogo), `cutscene.js` (roteiro de cenas + pergaminho), `towers.js` (suspense, porta e revelação) |
| `js/levels/` | `fase1.js`, `fase2.js` e `fase3.js`: o mapa, os dados e as cenas de cada fase |
| `js/ui/` | `hud.js`, `screens.js` (título, pausa e tela da revelação) |
| `js/main.js` | O loop: `update()` → `render()`, câmera e início do jogo |

## Fluxo de um frame

```
readInput()  →  update(dt)  →  render()
                 ├─ title: menu
                 ├─ cut: updateCut (cenas roteirizadas)
                 ├─ suspense / reveal: story/towers.js
                 └─ play: heróis → placas → flechas → inimigos → itens
                          → gatilhos (avisos, timers, fechaduras, portal, LV.update, torres)
```

## Registros (onde adicionar coisas)

### Novo tile / mecânica

Em um arquivo de `js/mechanics/`:

```js
defineTile('K', {
  solid: true,                       // ou (x, y) => bool
  liquid: false,                     // true: morcegos e flechas passam por cima
  img: (T, x, y, v) => T.rock,       // imagem do tema atual
  axe: (x, y, heroi) => { ... },     // o que o machado do Gu faz
  arrowHint: true,                   // a flecha bate e sugere usar o Gu
});
onLevelLoad(() => { /* zera o estado da mecânica */ });
```

Para a flecha da De interagir com algo novo, siga o exemplo de `arrowHitsCrystal`, chamado em `entities/heroes.js` (`updateArrows`).

### Novo inimigo

Em `js/entities/enemies.js` (e o sprite em `gfx/sprites.js`):

```js
defineEnemy('lobo', { hp: 3, sp: 40, chase: 120, cols: ['#9e9e9e', '#fff'] });
```

O comportamento é opcional: `update`, `damage`, `draw`, `hb`, `body`, `contact` (veja `boss.js`).

### Novo item

Em `js/mechanics/items.js`:

```js
defineItem('pocao', { draw: (it, x, y) => {...}, pickup: it => {...} });
```

### Item carregável + receptor (ex.: chave → porta)

Itens com `carry: true` não vão para inventário: o herói pega com o **botão de ação**, leva acima da cabeça (um por herói) e só ele pode colocar no receptor.

```js
defineItem('gema', { carry: true, name: () => 'uma gema', hint: 'Levem até o pedestal.', draw: (it, x, y) => {...} });
defineReceiver({ kind: 'gema', find: h => /* alvo perto do herói ou null */, place: (h, item, alvo) => {...} });
// ou, só numa fase: LV.receivers = [{ kind, find, place }]
```

Botão de ação (A/B, Espaço, K, Enter), em ordem de prioridade: colocar/soltar o item carregado → pegar item → ler placa → atacar.

### Nova fase

Crie `js/levels/fase4.js`, inclua no `index.html` e registre:

```js
function buildFase4() {
  const g = Grid(48, 40, seed); /* g.rect, g.outline, g.set, g.trees... */
  return { n: 4, name: '...', theme: 'snow', song: 'snow', W: g.W, H: g.H, M: g.M,
           start: [[x, y], [x, y]], items: [...], enemies: [...], signs: {...}, intro: [...] };
}
registerLevel(4, () => Object.assign(buildFase4(), {
  update() { /* gatilhos e cenas da fase */ },
}));
```

A fase anterior leva até ela colocando um portal: `M[y][x] = 'O'`. Os campos aceitos estão documentados no topo de `world/level.js`.

### Nova cena

```js
runCut([
  { do: () => crowTo(x, y), until: crowArrived },
  { say: ['Corvo: CRÁ!'] },
  { wait: 1.0 },
]);
```

## Legenda do mapa

`.` chão · `,` chão decorado · `:` caminho · `_` piso · `#` muro · `W` muro rachado · `T` árvore · `~` água/lava · `b`/`v` ponte escondida · `=`/`|` ponte · `R` pedra · `B` arbusto · `C` cristal · `J` alavanca · `P` placa · `G` grade · `L` fechadura · `H` portão grande · `I` aviso · `A` altar · `X` torre · `D`/`E` portas das torres · `O` portal

## Testes

- `index.html?teste=menino` ou `?teste=menina` força um final, sem precisar do `segredo.js`.
- `&fase=2` ou `&fase=3` começa direto na fase indicada.
- `window.__game` (no console do navegador) dá acesso ao estado do jogo para depuração.
