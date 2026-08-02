# JetPack Guy — contexto para agentes

Recriação em pixel art do *Jetpack Joyride* com **WebGL puro**, sem bibliotecas e sem build. Nasceu como trabalho da disciplina de Computação Gráfica (UnB) e está sendo evoluído para peça de portfólio, com foco em UX/UI, design system e arquitetura.

**As tarefas vêm do [`ROADMAP.md`](ROADMAP.md).** Execute uma por vez, apenas no escopo descrito, e valide os critérios de aceite antes de commitar. Não adiante tarefas futuras nem "melhore" o que está fora do escopo.

## Mapa do projeto

| Caminho | O que é |
|---|---|
| `index.html` | Estrutura da página: canvas, visor de pontuação, botão de pausa, moldura |
| `style.css` | Todo o CSS — layout, moldura, HUD, overlays, media queries |
| `script.js` | **Todo o jogo** (~675 linhas): shaders, buffers, carga de sprites, física, colisão, input e loop |
| `ImagesJson/*.json` | Sprites como listas de pixels `{ x, y, color }` |
| `Images/*.png` | Arte-fonte: moldura, visor, ícone de pausa e os sprites originais |
| `Images/ImageConverter.py` | Converte PNG → JSON de pixels (roda fora do jogo, manualmente) |
| `Info/*.txt` | Anotações da disciplina — **histórico, não especificação** |
| `TelaMorte.html` | Removido na tarefa 0.2 |
| `ROADMAP.md` | Plano de evolução em 8 fases; fonte das tarefas |

Hoje o jogo inteiro vive em `script.js`. A Fase 2 do roadmap o divide em `src/` (`main.js`, `config.js`, `renderer.js`, `assets.js`, `entities.js`, `input.js`, `state.js`) — quando isso acontecer, atualize a tabela acima.

## Não leia estes arquivos por inteiro

- `ImagesJson/BackgroundPixels.json` — **11 MB**. Ler estoura o contexto sem entregar informação útil.
- Os demais JSONs de `ImagesJson/` (84–128 KB) — se precisar conferir o formato, leia só as primeiras linhas.

O formato é sempre o mesmo: array de `{ "x": int, "y": int, "color": "rgba(r, g, b, a)" }`, um item por pixel visível.

## Como rodar e verificar

Servidor local é obrigatório — o `fetch` dos JSONs falha em `file://`:

```bash
npx serve .
```

Depois de **qualquer** mudança, jogue uma partida completa antes de commitar: voar (Espaço, seta para cima ou clique), morrer, reiniciar, pausar com `P` e com o botão. Console sem erros.

## Conceitos do domínio

- **Sprites são pontos, não texturas.** Cada pixel do JSON vira um vértice desenhado com `gl.POINTS`. Essa é a proposta pedagógica do projeto — não converter para textura nem para quads.
- **Coordenadas em clip space** (−1 a +1). Os sprites têm o Y invertido no vertex shader; o fundo não — é o que o uniform `isBackground` controla.
- **Escala:** 1.5 unidades de clip space = 375 px (teto ao chão); 0.4 = 100 px (obstáculo). Canvas é 540×540.
- **A física está em unidades por frame**, calibrada para 60 fps — em monitores de 144 Hz o jogo roda mais rápido. A tarefa 1.3 corrige isso com delta time.
- **Os overlays de pausa e game over** são criados por JS com estilos inline e anexados ao `body`, fora do container do jogo. A tarefa 5.1 os move para o HTML.

## Convenções

- Commits em português, no formato Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `perf:`. O histórico antigo não segue isso; a convenção vale a partir de agora.
- Uma tarefa do roadmap = um commit.
- Código, comentários e textos de interface em português.
- Caminhos sempre relativos e com `/` — o deploy é GitHub Pages.

## Não faça

- Adicionar frameworks, bundlers ou dependências. O projeto é HTML/CSS/JS servido direto, e isso é intencional.
- Refatorar, renomear ou reformatar arquivos fora do escopo da tarefa atual.
- Escrever comentário para explicar a mudança feita ou justificar o código. Comentário só para restrição que o código não consegue mostrar.
- Tratar `Info/TODO.txt` como backlog — o backlog é o `ROADMAP.md`.

## Manutenção deste arquivo

Atualize-o quando a estrutura mudar, no mesmo commit da tarefa: Fase 2 (módulos em `src/`), Fase 3 (novo formato do background) e Fase 4 (design system em `src/styles/`).
