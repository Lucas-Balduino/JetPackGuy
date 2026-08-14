# JetPack Guy — contexto para agentes

Recriação em pixel art do *Jetpack Joyride* com **WebGL puro**, sem bibliotecas e sem build. Nasceu como trabalho da disciplina de Computação Gráfica (UnB) e está sendo evoluído para peça de portfólio, com foco em UX/UI, design system e arquitetura.

**As tarefas vêm do [`ROADMAP.md`](ROADMAP.md).** Execute uma por vez, apenas no escopo descrito, e valide os critérios de aceite antes de commitar. Não adiante tarefas futuras nem "melhore" o que está fora do escopo.

## Mapa do projeto

| Caminho | O que é |
|---|---|
| `index.html` | Estrutura da página: canvas, visor de pontuação, botão de pausa, moldura |
| `style.css` | Layout, moldura, HUD, overlays e media queries (usa tokens) |
| `src/styles/tokens.css` | Design tokens (cores, tipografia, espaçamento, z-index) |
| `src/styles/components.css` | Componentes reutilizáveis (`.btn-pixel`, `.panel-pixel`, etc.) |
| `design.html` | Styleguide navegável do design system |
| `src/main.js` | Ponto de entrada: liga renderer, assets, entidades, estado, input e loop |
| `src/config.js` | Constantes de tuning (`CONFIG` congelado, inclui escala de render) |
| `src/renderer.js` | Pipeline WebGL: shaders, buffers, `drawSprite` |
| `src/assets.js` | Fetch/parse dos JSONs de pixels e fallbacks |
| `src/entities.js` | Player, obstáculos, hitboxes e colisão AABB |
| `src/state.js` | Máquina de estados (`READY`, `PLAYING`, `PAUSED`, `GAME_OVER`) |
| `src/input.js` | Teclado e clique no canvas (callbacks) |
| `src/audio.js` | Efeitos sonoros sintetizados (Web Audio API) e preferência de mudo |
| `ImagesJson/*.json` | Sprites como listas de pixels `{ x, y, color }` |
| `ImagesJson/BackgroundPixels.compact.json` | Fundo em formato compacto `{ width, height, data: [r,g,b,...] }` |
| `tools/convert_to_compact.py` | Converte PNG opaco em JSON compacto (roda fora do jogo) |
| `Images/*.png` | Arte-fonte: moldura, visor, ícone de pausa e os sprites originais |
| `Images/ImageConverter.py` | Converte PNG → JSON de pixels (roda fora do jogo, manualmente) |
| `Info/*.txt` | Anotações da disciplina — **histórico, não especificação** |
| `TelaMorte.html` | Removido na tarefa 0.2 |
| `ROADMAP.md` | Plano de evolução em 8 fases; fonte das tarefas |
| `SKILLS.md` | Catálogo das skills de agente: quando usar, restrições e manutenção |
| `.agents/skills/` | Skills instaladas no projeto (Cursor lê daqui). Não é runtime do jogo |
| `skills-lock.json` | Versões/hashes das skills — não editar à mão |

## Não leia estes arquivos por inteiro

- `ImagesJson/BackgroundPixels.compact.json` — **~1,3 MB**. Ler estoura o contexto sem entregar informação útil.
- Os demais JSONs de `ImagesJson/` (84–128 KB) — se precisar conferir o formato, leia só as primeiras linhas.

Sprites usam array de `{ "x": int, "y": int, "color": "rgba(r, g, b, a)" }`, um item por pixel visível. O background usa formato compacto: `{ "width": W, "height": H, "data": [r, g, b, ...] }` em ordem row-major (coordenadas derivadas do índice).

## Como rodar e verificar

Servidor local é obrigatório — o `fetch` dos JSONs falha em `file://`:

```bash
npx serve .
```

Depois de **qualquer** mudança, jogue uma partida completa antes de commitar: voar (Espaço, seta para cima ou clique), morrer, reiniciar, pausar com `P` e com o botão. Console sem erros. A skill `webapp-testing` (ver [`SKILLS.md`](SKILLS.md)) pode automatizar esse checklist; não substitui o critério de aceite se o teste não cobrir o fluxo.

## Skills de agente

O catálogo, o “quando usar” e os comandos de update estão em [`SKILLS.md`](SKILLS.md). Antes de polir UI, auditar a11y, estender o design system ou testar no browser, leia o `SKILL.md` da skill correspondente em `.agents/skills/`. Skills **não** autorizam React, Tailwind, Three.js, Phaser nem qualquer dependência nova no jogo.

## Conceitos do domínio

- **Sprites são pontos, não texturas.** Cada pixel do JSON vira um vértice desenhado com `gl.POINTS`. Essa é a proposta pedagógica do projeto — não converter para textura nem para quads.
- **Coordenadas em clip space** (−1 a +1). Os sprites têm o Y invertido no vertex shader; o fundo não — é o que o uniform `isBackground` controla.
- **Escala:** 1.5 unidades de clip space = 375 px (teto ao chão); `CONFIG.render.spriteScale` (0.4) ≈ 100 px para sprites. Canvas é 540×540. Sprites são centralizados pelo bounding box do conteúdo e escalados pelo quadro-fonte (100×100). `gl_PointSize` é calculado pelo espaçamento entre pixels para evitar sobreposição.
- **Física com delta time:** movimento e pontuação usam `dt` (segundos desde o último frame, com clamp de 0,05 s) multiplicado por 60 para preservar o tuning calibrado em 60 fps. `lastTime` é atualizado em todo frame, inclusive pausado — evita salto ao retomar.
- **Os overlays de pausa e game over** são criados por JS com estilos inline e anexados ao `body`, fora do container do jogo. A tarefa 5.1 os move para o HTML.

## Convenções

- Commits em português, no formato Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `perf:`. O histórico antigo não segue isso; a convenção vale a partir de agora.
- Uma tarefa do roadmap = um commit.
- Código, comentários e textos de interface em português.
- Caminhos sempre relativos e com `/` — o deploy é GitHub Pages.

## Não faça

- Adicionar frameworks, bundlers ou dependências. O projeto é HTML/CSS/JS servido direto, e isso é intencional. Playwright e scripts em `.agents/skills/` ficam fora do runtime.
- Editar arquivos em `.agents/skills/` à mão (o `skills-lock.json` valida o hash).
- Refatorar, renomear ou reformatar arquivos fora do escopo da tarefa atual.
- Escrever comentário para explicar a mudança feita ou justificar o código. Comentário só para restrição que o código não consegue mostrar.
- Tratar `Info/TODO.txt` como backlog — o backlog é o `ROADMAP.md`.

## Manutenção deste arquivo

Atualize-o quando a estrutura mudar, no mesmo commit da tarefa: Fase 3 (novo formato do background), Fase 4 (design system em `src/styles/`) e o catálogo em `SKILLS.md` / `.agents/skills/` quando skills forem adicionadas ou removidas.
