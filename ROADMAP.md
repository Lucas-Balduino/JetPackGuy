# ROADMAP — JetPack Guy WebGL

Evolução do projeto acadêmico para peça de portfólio, com foco em **arquitetura de projetos**, **UX/UI** e **design systems**.

---

## Como usar este documento

Este roadmap foi desenhado para ser executado **uma tarefa por vez**, cada tarefa virando **um commit**. As tarefas são pequenas e autocontidas de propósito, para que qualquer modelo de IA (ou você mesmo) consiga executá-las sem contexto além do que está escrito aqui.

**Prompt sugerido para cada tarefa** (cole no chat do modelo):

> Leia os arquivos AGENTS.md e ROADMAP.md na raiz do projeto. Execute SOMENTE a tarefa [ID da tarefa, ex: 1.2]. Não faça nada além do escopo descrito. Ao terminar, verifique todos os critérios de aceite da tarefa e faça um commit com a mensagem sugerida.

**Regras para o executor (modelo ou humano):**

0. Ler o [`AGENTS.md`](AGENTS.md) antes de começar: ele tem o mapa do projeto, os conceitos de WebGL que o código não explicita, as convenções e a lista de arquivos que **não** devem ser lidos por inteiro (o JSON do fundo tem 11 MB).
1. Executar **apenas uma tarefa por vez**. Nunca adiantar tarefas futuras, mesmo que pareça fácil.
2. Não refatorar, renomear ou "melhorar" nada fora do escopo da tarefa.
3. Antes do commit, conferir **todos** os critérios de aceite.
4. O jogo deve continuar funcionando após todo commit: abrir com um servidor local (`npx serve .` ou `python -m http.server`) e jogar uma partida completa (voar, morrer, reiniciar, pausar).
5. Mensagens de commit seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `fix:`, `feat:`, `refactor:`, `chore:`, `docs:`, `perf:`.
6. Se uma tarefa depender de outra não concluída, parar e avisar em vez de improvisar.
7. Ao concluir: marcar o checkbox da tarefa (`[ ]` → `[x]`) no corpo dela **e** no [Resumo do progresso](#resumo-do-progresso), e atualizar a linha **Progresso atual**. Fazer isso no mesmo commit da tarefa.

**Ordem:** as fases devem ser feitas em sequência (0 → 7). Dentro de cada fase, as tarefas também são sequenciais, salvo indicação contrária.

### Progresso atual

**Fase 1 concluída (5/5)** · próxima tarefa: **2.4** — Extrair o carregador de assets (assets.js)

---

## Fase 0 — Higiene do repositório ✅

> **O que você aprende:** todo projeto profissional começa com um repositório limpo — sem arquivos mortos, com documentação que corresponde à realidade e metadados básicos (licença, gitignore). É a primeira coisa que um recrutador vê.

### 0.1 — Adicionar .gitignore e LICENSE

- **Status:** [x] concluído
- **Objetivo:** metadados básicos de repositório.
- **Passos:**
  1. Criar `.gitignore` na raiz com: `node_modules/`, `.DS_Store`, `Thumbs.db`, `*.log`.
  2. Criar `LICENSE` na raiz com o texto padrão da licença MIT, ano 2026, autores: Lucas Gonçalves Balduíno, Augusto Sodré Carneiro Lima, Luana Ferreira Veloso Lima.
- **Critérios de aceite:** os dois arquivos existem na raiz; o LICENSE contém o texto MIT completo.
- **Commit:** `chore: adiciona .gitignore e licença MIT`

### 0.2 — Remover arquivos e código mortos

- **Status:** [x] concluído
- **Objetivo:** eliminar tudo que não é usado.
- **Passos:**
  1. Excluir `TelaMorte.html` (referencia `JetPackJogo.js` e `SandboxJetPack.js`, que não existem).
  2. Em `style.css`, remover todos os blocos de código comentados (o bloco `.game-frame` comentado, o bloco `#visor` antigo comentado e comentários de propriedades soltas como `/* box-shadow... */`).
  3. Em `script.js`, remover o bloco `// draw(...)` comentado dentro de `animate()` (por volta da linha 631).
  4. Corrigir em `style.css` a propriedade inválida `display: absolute` na classe `.instructions` (remover a linha).
- **Critérios de aceite:** `TelaMorte.html` não existe mais; nenhum bloco de código comentado permanece em `style.css`; o jogo abre e roda normalmente.
- **Commit:** `chore: remove arquivos mortos e código comentado`

### 0.3 — Corrigir o README

- **Status:** [x] concluído
- **Objetivo:** documentação que reflete o projeto real.
- **Passos:**
  1. Na seção "Estrutura do Projeto", substituir a árvore fictícia (`assets/`) pela estrutura real: `index.html`, `style.css`, `script.js`, `Images/`, `ImagesJson/`, `Info/`, `AGENTS.md`, `ROADMAP.md`.
  2. Substituir a URL placeholder `https://github.com/seu-usuario/jetpack-joyride-webgl.git` pela URL real do repositório (se não souber, usar `https://github.com/Lucas-Balduino/JetPackGuy`).
  3. Remover a afirmação "Modo responsivo: funciona em desktop e dispositivos móveis" (ainda não é verdade; será readicionada na Fase 5).
- **Critérios de aceite:** a árvore do README bate com `ls` da raiz; nenhuma URL placeholder permanece.
- **Commit:** `docs: atualiza README com estrutura e links reais`

---

## Fase 1 — Correção de bugs ✅

> **O que você aprende:** bugs sutis de JavaScript (avaliação de expressões, closures, timers) e o conceito mais importante de game dev: **física independente de frame rate (delta time)**.

### 1.1 — Corrigir o listener de teclado inválido

- **Status:** [x] concluído
- **Objetivo:** remover um bug clássico de JS.
- **Contexto:** em `script.js` (~linha 423) existe `document.addEventListener("keydown" || "click", ...)`. A expressão `"keydown" || "click"` avalia apenas para `"keydown"`; o `"click"` é código morto. Dentro do handler, `e.code === "Click"` nunca é verdadeiro. O clique só funciona por causa de outro listener no canvas.
- **Passos:**
  1. Trocar `document.addEventListener("keydown" || "click", ...)` por `document.addEventListener("keydown", ...)`.
  2. Remover a condição `|| e.code === "Click"` de dentro do handler.
  3. Não mexer no listener de `click` do canvas — ele está correto.
- **Critérios de aceite:** Espaço e seta para cima continuam fazendo o personagem voar; clique no canvas continua funcionando; a string `"Click"` não aparece mais em `script.js`.
- **Commit:** `fix: corrige listener de teclado com expressão inválida`

### 1.2 — Unificar velocidade inicial dos obstáculos

- **Status:** [x] concluído
- **Objetivo:** o jogo deve reiniciar exatamente como começou.
- **Contexto:** a variável `obstacleVelocity` é inicializada com `0.015`, mas `resetGame()` a redefine para `0.01`. Partidas após a primeira começam mais lentas.
- **Passos:**
  1. Criar uma constante `const INITIAL_OBSTACLE_VELOCITY = 0.015;` perto das outras variáveis de estado.
  2. Usar essa constante tanto na inicialização quanto dentro de `resetGame()`.
- **Critérios de aceite:** o número `0.01` como velocidade de obstáculo não existe mais no código; morrer e reiniciar produz a mesma velocidade inicial da primeira partida.
- **Commit:** `fix: unifica velocidade inicial de obstáculos no reset`

### 1.3 — Física com delta time

- **Status:** [x] concluído
- **Objetivo:** o jogo deve rodar na mesma velocidade em monitores de 60 Hz, 120 Hz e 144 Hz.
- **Contexto:** hoje a física soma valores fixos por frame (`y += velocity`, `x1 -= obstacleVelocity`), então quanto maior o refresh rate, mais rápido o jogo.
- **Passos:**
  1. Na função `animate()`, receber o timestamp: `function animate(now) { ... }`.
  2. Guardar o timestamp do frame anterior em uma variável `lastTime` e calcular `const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;` (o `Math.min` evita saltos quando a aba fica em segundo plano). Inicializar `lastTime` no primeiro frame.
  3. Converter as constantes de movimento para unidades **por segundo** (valores atuais assumem 60 fps, então multiplicar por 60): gravidade `-0.001` vira `-0.06/s²` aplicada como `velocity += GRAVITY * dt * 60`... **Forma mais simples e segura:** manter os números atuais e multiplicar cada incremento por `dt * 60`, ou seja: `y += velocity * dt * 60`, `velocity += gravity * dt * 60`, `x1 -= obstacleVelocity * dt * 60`, idem para `x2`, `x3` e `backgroundX`.
  4. O `requestAnimationFrame(animate)` já passa o timestamp automaticamente; nada a mudar na chamada.
- **Critérios de aceite:** em um monitor de 60 Hz o jogo se comporta como antes; limitando o refresh (ou usando o throttling de FPS do DevTools → Performance), a velocidade percebida do jogo não muda; a variável `dt` é usada em todos os incrementos de posição/velocidade.
- **Commit:** `fix: física independente de frame rate com delta time`

### 1.4 — Unificar a lógica de pontuação

- **Status:** [x] concluído
- **Objetivo:** remover duplicação e acoplar a pontuação ao loop do jogo.
- **Contexto:** o `setInterval` que incrementa pontos está duplicado em `startGame()` e `setPaused()`. Além disso, um timer separado do loop pode dessincronizar.
- **Passos:**
  1. Remover os dois `setInterval` e a variável `pointsInterval`.
  2. Criar um acumulador `let scoreTimer = 0;`. Dentro de `animate()`, no bloco que só roda quando `gameStarted && !gameOver && !paused`, fazer `scoreTimer += dt;` e, enquanto `scoreTimer >= 0.1`, subtrair `0.1`, incrementar `points`, incrementar `obstacleVelocity += 0.00003` e atualizar o texto do visor (mesma formatação atual: `points.toString().padStart(4, "0") + " m"`).
  3. `resetGame()` deve zerar `scoreTimer` e `points` e atualizar o visor para `"0000 m"`.
  4. Remover todos os `clearInterval` que sobrarem.
- **Critérios de aceite:** `setInterval`/`clearInterval` não aparecem mais em `script.js`; a pontuação sobe ~10 pontos por segundo; pausar congela a pontuação; reiniciar zera o visor.
- **Commit:** `refactor: pontuação integrada ao game loop sem setInterval`

### 1.5 — Carregamento paralelo dos assets

- **Status:** [x] concluído
- **Objetivo:** reduzir o tempo até o jogo ficar pronto.
- **Contexto:** os 4 JSONs são carregados com `await` em sequência; podem ser carregados em paralelo.
- **Passos:**
  1. Substituir os quatro `await getJsonData(...)` sequenciais por um único `Promise.all([...])` que carrega os quatro de uma vez, atribuindo os resultados às mesmas chaves de `jsonData`.
- **Critérios de aceite:** existe exatamente um `await Promise.all` para os JSONs; o jogo carrega e roda normalmente.
- **Commit:** `perf: carrega assets JSON em paralelo com Promise.all`

---

## Fase 2 — Arquitetura em módulos

> **O que você aprende:** **separação de responsabilidades**. Um arquivo de 675 linhas que mistura renderização, física, input e DOM é difícil de manter. A divisão em módulos ES com responsabilidade única é o padrão de qualquer projeto profissional, e a **máquina de estados** é o padrão central de arquitetura de jogos.
>
> Estrutura-alvo ao final da fase:
>
> ```
> src/
> ├── main.js          # ponto de entrada: liga tudo
> ├── config.js        # todas as constantes de tuning
> ├── renderer.js      # WebGL: shaders, buffers, draw
> ├── assets.js        # fetch e parse dos JSONs de pixels
> ├── entities.js      # player e obstáculos (posições, hitboxes, colisão)
> ├── input.js         # teclado, mouse e (futuramente) toque
> └── state.js         # máquina de estados do jogo
> ```

### 2.1 — Migrar para ES Modules

- **Status:** [x] concluído
- **Objetivo:** habilitar `import`/`export` sem ainda dividir o código.
- **Passos:**
  1. Criar a pasta `src/` e mover `script.js` para `src/main.js`.
  2. Em `index.html`, trocar `<script src="script.js">` por `<script type="module" src="src/main.js">`.
  3. Remover a IIFE `(async function () { ... })()` que envolve todo o código: módulos ES já têm escopo próprio e suportam top-level `await`. O conteúdo fica no nível do módulo.
- **Critérios de aceite:** `script.js` não existe mais na raiz; o jogo roda igual servindo via servidor local; nenhum erro no console.
- **Commit:** `refactor: migra script para ES module em src/main.js`

### 2.2 — Extrair configuração (config.js)

- **Status:** [x] concluído
- **Objetivo:** eliminar números mágicos.
- **Passos:**
  1. Criar `src/config.js` exportando um objeto congelado:

     ```js
     export const CONFIG = Object.freeze({
       player: { x: -0.7, startY: -0.8, width: 0.08, height: 0.08 },
       physics: { gravity: -0.001, jumpVelocity: 0.023, jumpVelocityFromGround: 0.03, canvasClickJumpVelocity: 0.028 },
       bounds: { floor: -0.8, ceiling: 0.93, deathFloor: -0.85, deathCeiling: 1 },
       obstacles: {
         initialVelocity: 0.015, acceleration: 0.00003,
         horizontal: { width: 0.25, height: 0.06 },
         vertical: { width: 0.06, height: 0.25 },
         respawnX: [1.5, 1.8, 2.1], startX: [1.2, 1.8, 2.4],
         offscreenX: -1.5, spawnYRange: [-0.8, 0.8],
       },
       score: { intervalSeconds: 0.1 },
     });
     ```
  2. Em `src/main.js`, importar `CONFIG` e substituir **todos** os literais correspondentes por referências à configuração.
- **Critérios de aceite:** os literais `-0.7`, `0.015`, `0.00003`, `-0.85`, `0.93`, `1.2`, `1.8`, `2.4` etc. não aparecem mais soltos em `main.js` (apenas via `CONFIG`); o gameplay não mudou.
- **Commit:** `refactor: extrai constantes de tuning para src/config.js`

### 2.3 — Extrair o renderer WebGL (renderer.js)

- **Status:** [x] concluído
- **Objetivo:** isolar todo o código de WebGL.
- **Passos:**
  1. Criar `src/renderer.js` exportando uma função `createRenderer(canvas)` que: obtém o contexto, compila os shaders (mover `vsSource`, `fsSource`, `createShader` e a criação do program para cá), guarda as locations e retorna um objeto com os métodos:
     - `createSpriteBuffers({ positionArray, colorArray })` → `{ posBuffer, colorBuffer, count }` (substitui `initBuffer` + contagem manual);
     - `clear()` → `clearColor` + `clear`;
     - `drawSprite(buffers, translation, isBackground = false)` (substitui a função `draw`).
  2. Se o contexto WebGL falhar, `createRenderer` deve lançar um `Error` — o `main.js` captura e mostra o alerta atual.
  3. Atualizar `main.js` para usar o renderer, removendo de lá tudo que é WebGL puro.
- **Critérios de aceite:** `main.js` não contém mais nenhuma chamada direta a `gl.*`; o jogo renderiza idêntico.
- **Commit:** `refactor: isola pipeline WebGL em src/renderer.js`

### 2.4 — Extrair o carregador de assets (assets.js)

- **Status:** [ ] pendente
- **Objetivo:** isolar fetch/parse dos sprites.
- **Passos:**
  1. Criar `src/assets.js` e mover para lá: `getJsonData`, `createFallbackSprite`, `createFullBackground` e o parse de cores.
  2. Exportar uma função `async loadAllSprites()` que retorna `{ player, verticalObstacle, horizontalObstacle, background }`, já aplicando os fallbacks quando um JSON vier vazio.
  3. Remover de `getJsonData` a comparação por URL hardcoded (`if (url === "ImagesJson/BackgroundPixels.json")`): adicionar um parâmetro `isBackground` à função e passar `true` só para o background.
- **Critérios de aceite:** `main.js` só chama `loadAllSprites()`; nenhuma URL de JSON aparece em `main.js`; o jogo carrega os quatro sprites normalmente.
- **Commit:** `refactor: extrai carregamento de sprites para src/assets.js`

### 2.5 — Extrair entidades e colisão (entities.js)

- **Status:** [ ] pendente
- **Objetivo:** agrupar estado e regras de player/obstáculos.
- **Passos:**
  1. Criar `src/entities.js` exportando:
     - `createPlayer(config)` → objeto com `x`, `y`, `velocity`, `width`, `height` e métodos `jump(vel)`, `applyPhysics(dt)`, `reset()`;
     - `createObstacles(config)` → array de 3 obstáculos, cada um com `x`, `y`, `width`, `height`, `respawnX` e métodos `advance(velocity, dt)` (move e reposiciona com Y aleatório ao sair da tela) e `reset()`;
     - `checkCollision(rectA, rectB)` e `getRect(entity)` (centro → retângulo AABB, como o código atual faz).
  2. Reescrever em `main.js` o corpo de `animate()` e `checkAllCollisions()` usando essas entidades. As variáveis soltas `y, velocity, x1..x3, y1..y3` deixam de existir.
- **Critérios de aceite:** as variáveis `x1`, `x2`, `x3`, `y1`, `y2`, `y3` não existem mais em `main.js`; colisões e respawn funcionam como antes.
- **Commit:** `refactor: extrai player e obstáculos para src/entities.js`

### 2.6 — Máquina de estados (state.js)

- **Status:** [ ] pendente
- **Objetivo:** substituir os booleanos `gameStarted`/`gameOver`/`paused` por um estado explícito.
- **Contexto:** três booleanos permitem 8 combinações, das quais várias não fazem sentido (ex.: `gameOver && paused`). Uma máquina de estados torna os fluxos explícitos e prepara o menu da Fase 5.
- **Passos:**
  1. Criar `src/state.js` exportando:

     ```js
     export const States = Object.freeze({ READY: "ready", PLAYING: "playing", PAUSED: "paused", GAME_OVER: "game_over" });
     export function createStateMachine() { /* estado atual + transições válidas */ }
     ```
  2. Transições válidas: `READY → PLAYING` (primeiro pulo), `PLAYING → PAUSED` e `PAUSED → PLAYING` (tecla P/botão), `PLAYING → GAME_OVER` (colisão), `GAME_OVER → READY` (reset). O método `transition(to)` deve ignorar (com `console.warn`) transições inválidas.
  3. Substituir em `main.js` todos os usos de `gameStarted`, `gameOver` e `paused` por consultas ao estado (`state.is(States.PLAYING)` etc.).
- **Critérios de aceite:** os booleanos `gameStarted`, `gameOver` e `paused` não existem mais; pausar durante game over não tem efeito; todo o fluxo jogar → morrer → reiniciar → pausar funciona.
- **Commit:** `refactor: introduz máquina de estados do jogo em src/state.js`

### 2.7 — Módulo de input (input.js)

- **Status:** [ ] pendente
- **Objetivo:** centralizar teclado e mouse.
- **Passos:**
  1. Criar `src/input.js` exportando `setupInput({ onJump, onTogglePause })` que registra os listeners de `keydown` (Espaço, seta para cima, P) e `click` no canvas, chamando os callbacks.
  2. `main.js` decide **o que fazer** (pular, resetar, pausar) dentro dos callbacks, consultando a máquina de estados; `input.js` só traduz eventos.
- **Critérios de aceite:** nenhum `addEventListener` de gameplay em `main.js` (o botão de pausa do DOM pode ficar); controles funcionam como antes.
- **Commit:** `refactor: centraliza input de teclado e mouse em src/input.js`

---

## Fase 3 — Assets e performance

> **O que você aprende:** performance percebida é UX. Um jogo que demora 10 segundos para abrir perde o jogador antes do primeiro pulo. Aqui você mede, otimiza e comunica o carregamento.

### 3.1 — Otimizar as imagens PNG

- **Status:** [ ] pendente
- **Objetivo:** reduzir os PNGs gigantes.
- **Contexto:** `Images/PixelArtVisor.png` tem 2,2 MB e `Images/MolduraPixelArt.png` tem 1,25 MB — para imagens decorativas isso é ~50x maior que o necessário.
- **Passos:**
  1. Reprocessar os dois arquivos com uma ferramenta de otimização (ex.: [Squoosh](https://squoosh.app/) exportando PNG com paleta/quantização, ou `pngquant`). Como são pixel art, reduzir a paleta de cores não degrada a qualidade visual. Manter as dimensões em pixels.
  2. Substituir os arquivos originais pelos otimizados (mesmos nomes e caminhos).
- **Critérios de aceite:** cada um dos dois arquivos fica abaixo de 200 KB; visualmente idênticos no jogo.
- **Commit:** `perf: otimiza PNGs da moldura e do visor`

### 3.2 — Substituir o JSON de background de 11 MB

- **Status:** [ ] pendente
- **Objetivo:** eliminar o maior gargalo de carregamento.
- **Contexto:** `ImagesJson/BackgroundPixels.json` tem **11 MB** para descrever uma imagem de 375×375. O formato JSON (`{"x":..,"y":..,"color":"rgba(...)"}` por pixel) é extremamente verboso.
- **Passos:**
  1. Criar um script `tools/convert_to_compact.py` (adaptando `Images/ImageConverter.py`) que converte a imagem em um formato compacto: um JSON com `{ "width": W, "height": H, "data": [x, y, r, g, b, x, y, r, g, b, ...] }` (array plano de inteiros). Isso reduz ~10x sem perder a proposta de "renderização por pontos".
  2. Gerar `ImagesJson/BackgroundPixels.compact.json` a partir de `Images/PixelArtBackground.png`.
  3. Adaptar `src/assets.js` para ler o novo formato no caso do background (loop de 5 em 5 no array plano; normalização de coordenadas igual à atual).
  4. Excluir `ImagesJson/BackgroundPixels.json` antigo.
  5. (Opcional, se fácil) converter os outros três JSONs para o mesmo formato e apagar os antigos, unificando o parser.
- **Critérios de aceite:** o novo arquivo tem menos de 1,5 MB; o background renderiza visualmente idêntico; o arquivo de 11 MB foi removido do repositório.
- **Commit:** `perf: formato compacto para pixels do background (11MB -> ~1MB)`

### 3.3 — Tela de loading

- **Status:** [ ] pendente
- **Objetivo:** nunca mostrar canvas vazio ao usuário.
- **Passos:**
  1. Em `index.html`, adicionar dentro de `.game-container` um `<div id="loadingOverlay">Carregando...</div>` sobre o canvas (posição absoluta, fundo escuro, fonte Pixelify Sans, centralizado).
  2. Em `main.js`, esconder o overlay (`classList.add("hidden")`) somente depois que `loadAllSprites()` resolver e o primeiro frame for desenhado.
  3. Estilizar `#loadingOverlay` e a classe `.hidden { display: none; }` em `style.css`.
- **Critérios de aceite:** com o DevTools em "Slow 3G", o texto "Carregando..." aparece e some quando o jogo fica pronto; sem throttling, o flash é imperceptível mas sem erro.
- **Commit:** `feat: tela de loading durante carregamento de assets`

---

## Fase 4 — Design System

> **O que você aprende:** um design system é a diferença entre "estilizar telas" e "projetar um sistema". Você define **tokens** (decisões de design nomeadas: cores, tipografia, espaçamento), constrói **componentes** a partir deles e **documenta** tudo. Depois disso, criar qualquer tela nova é montar Lego.

### 4.1 — Tokens de design (CSS custom properties)

- **Status:** [ ] pendente
- **Objetivo:** fundar o design system.
- **Passos:**
  1. Criar `src/styles/tokens.css` com um bloco `:root` definindo, com comentários explicando cada grupo:
     - **Cores:** `--color-bg-deep: #0f0f23`, `--color-bg-mid: #1a1a2e`, `--color-bg-light: #16213e`, `--color-surface: #183251`, `--color-border: #000f30`, `--color-text: #e0f7fa`, `--color-accent: #ffd000`, `--color-danger: #ff4444`, `--color-white: #ffffff` (paleta extraída dos valores já usados em `style.css`).
     - **Tipografia:** `--font-family-pixel: 'Pixelify Sans', monospace`, escala `--font-size-sm: 14px`, `--font-size-md: 20px`, `--font-size-lg: 28px`, `--font-size-xl: 35px`, pesos `--font-weight-regular: 400`, `--font-weight-bold: 700`.
     - **Espaçamento (escala de 4px):** `--space-1: 4px` até `--space-8: 32px` (dobrar a cada passo: 4, 8, 12, 16, 24, 32).
     - **Bordas e efeitos:** `--radius-sm: 8px`, `--radius-md: 15px`, `--radius-lg: 25px`, `--border-pixel: 5px solid var(--color-border)`, `--glow-danger: 0 0 15px var(--color-danger)`, `--shadow-text: 1px 1px 2px #000`.
     - **Camadas (z-index):** `--z-game: 1`, `--z-hud: 10`, `--z-controls: 110`, `--z-overlay: 100`.
  2. Importar `tokens.css` no `index.html` **antes** de `style.css`.
- **Critérios de aceite:** o arquivo existe, está importado e a página renderiza sem mudanças visuais (os tokens ainda não são usados).
- **Commit:** `feat(ds): define tokens de design em CSS custom properties`

### 4.2 — Aplicar tokens ao CSS existente

- **Status:** [ ] pendente
- **Objetivo:** todo valor de design vem de token.
- **Passos:**
  1. Reescrever `style.css` substituindo cada cor, fonte, espaçamento, raio e z-index hardcoded pelo token correspondente de `tokens.css`.
  2. Se um valor usado não tiver token equivalente, criar o token (seguindo a nomenclatura existente) em vez de deixar o valor solto.
- **Critérios de aceite:** `style.css` não contém mais cores hex/rgba literais nem `font-family` literal (exceto dentro de `tokens.css`); a página está visualmente idêntica (comparar screenshot antes/depois).
- **Commit:** `refactor(ds): aplica tokens de design ao CSS existente`

### 4.3 — Componentes base

- **Status:** [ ] pendente
- **Objetivo:** criar as classes de componente reutilizáveis do sistema.
- **Passos:**
  1. Criar `src/styles/components.css` (importar no `index.html` após `tokens.css`) com:
     - `.btn-pixel` — botão pixel-art: fundo `--color-surface`, borda `--border-pixel`, fonte pixel, estados `:hover` (fundo mais claro) e `:focus-visible` (outline de `--color-accent` de 3px, **nunca** `outline: none`), `:active` (translateY(2px));
     - `.panel-pixel` — painel/overlay: fundo `rgba(0,0,0,0.9)`, borda 3px `--color-danger` ou variante `.panel-pixel--neutral` com borda `--color-border`, `--radius-md`, padding `--space-6`;
     - `.overlay-center` — utilitário de posicionamento: absoluto, centrado no container pai, `z-index: var(--z-overlay)`;
     - `.hud-text` — texto de HUD: fonte pixel, `--font-size-xl`, `--shadow-text`.
  2. Aplicar `.btn-pixel` ao `#pauseBtn` existente (removendo do `#pauseBtn` as regras que o componente agora cobre; manter apenas posicionamento/tamanho específicos).
- **Critérios de aceite:** o botão de pausa usa `.btn-pixel` e continua no mesmo lugar; navegar por Tab mostra outline visível no botão.
- **Commit:** `feat(ds): componentes base (botão, painel, overlay, HUD)`

### 4.4 — Página de documentação do design system

- **Status:** [ ] pendente
- **Objetivo:** o artefato de portfólio — um styleguide navegável.
- **Passos:**
  1. Criar `design.html` na raiz: uma página estática que importa `tokens.css` e `components.css` e exibe:
     - **Seção Cores:** um swatch (quadrado + nome do token + valor) para cada token de cor, gerados via JS lendo `getComputedStyle(document.documentElement)` ou escritos à mão;
     - **Seção Tipografia:** cada tamanho da escala com texto de exemplo;
     - **Seção Espaçamento:** barras mostrando a escala de 4px;
     - **Seção Componentes:** um exemplar vivo de cada componente (`.btn-pixel` nos estados normal/hover/focus, `.panel-pixel`, `.hud-text`) com o trecho de HTML de uso em um `<code>`.
  2. Adicionar um link discreto "Design System" no rodapé do `index.html` (dentro de `.instructions` ou abaixo) apontando para `design.html`.
- **Critérios de aceite:** `design.html` abre e mostra as 4 seções; todos os tokens de cor aparecem; o link no jogo funciona.
- **Commit:** `feat(ds): página de documentação do design system`

---

## Fase 5 — UX e fluxo de telas

> **O que você aprende:** a jornada do usuário como fluxo completo (onboarding → jogo → falha → retry), hierarquia de informação, e por que UI declarada em HTML/CSS é melhor que UI criada por JS com estilos inline.

### 5.1 — Overlays declarativos (remover DOM criado por JS)

- **Status:** [ ] pendente
- **Objetivo:** toda a UI existe no HTML; o JS apenas mostra/esconde.
- **Contexto:** `drawGameOverText()` e `showPauseOverlay()` criam divs com dezenas de estilos inline e as anexam ao `document.body` (fora do container do jogo).
- **Passos:**
  1. Em `index.html`, adicionar dentro de `.game-container`:

     ```html
     <div id="gameOverOverlay" class="overlay-center panel-pixel hidden">
       <h2>GAME OVER</h2>
       <p>Pressione ESPAÇO ou clique para reiniciar</p>
     </div>
     <div id="pauseOverlay" class="overlay-center hud-text hidden">PAUSADO</div>
     ```
  2. Remover de `main.js` as funções `drawGameOverText`, `showPauseOverlay`, `hidePauseOverlay` e substituí-las por `classList.add/remove("hidden")` nos elementos, disparado pelas transições da máquina de estados.
  3. Estilizar títulos/textos dos overlays com tokens em `components.css` (cor `--color-danger` e `--glow-danger` no GAME OVER, como hoje).
- **Critérios de aceite:** nenhuma `document.createElement` em `main.js`; nenhum estilo inline via `element.style` para overlays; game over e pausa aparecem centralizados **sobre o canvas** (não sobre a página).
- **Commit:** `refactor(ux): overlays declarativos no HTML controlados por classe`

### 5.2 — Tela inicial (estado READY)

- **Status:** [ ] pendente
- **Objetivo:** onboarding em vez de canvas parado.
- **Passos:**
  1. Adicionar em `index.html` um overlay `#startOverlay` (classes `overlay-center panel-pixel--neutral`) com: título "JETPACK GUY", subtítulo "Espaço, ↑ ou clique para voar", e um `.btn-pixel` "JOGAR".
  2. No estado `READY`, mostrar o overlay; na transição `READY → PLAYING` (primeiro input ou clique em JOGAR), escondê-lo.
  3. Na transição `GAME_OVER → READY` (reset), mostrar o overlay novamente.
- **Critérios de aceite:** ao abrir a página aparece a tela inicial; qualquer input de pulo ou o botão inicia o jogo; após morrer e resetar, a tela inicial volta.
- **Commit:** `feat(ux): tela inicial com onboarding`

### 5.3 — Tela de morte com pontuação e recorde

- **Status:** [ ] pendente
- **Objetivo:** fechar o loop de retenção (o item "Tela de Morte" do TODO original).
- **Passos:**
  1. Expandir `#gameOverOverlay` com: distância da partida ("0342 m"), recorde ("RECORDE: 0518 m") e um `.btn-pixel` "JOGAR DE NOVO".
  2. Criar `src/storage.js` com `getHighScore()` / `saveHighScore(points)` usando `localStorage` (chave `jetpackguy:highscore`).
  3. Na transição para `GAME_OVER`: preencher a distância, comparar com o recorde, salvar se for maior e, nesse caso, exibir um destaque "NOVO RECORDE!" em `--color-accent`.
  4. O botão "JOGAR DE NOVO" reinicia direto para `PLAYING` (sem passar pela tela inicial).
- **Critérios de aceite:** morrer mostra distância e recorde corretos; o recorde persiste após recarregar a página; bater o recorde mostra o destaque.
- **Commit:** `feat(ux): tela de morte com pontuação e recorde persistente`

### 5.4 — Transições e micro-animações de UI

- **Status:** [ ] pendente
- **Objetivo:** suavidade nas trocas de tela.
- **Passos:**
  1. Em `components.css`, criar animações CSS: `.overlay-center` entra com fade + scale (ex.: `@keyframes overlay-in { from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } }`, 200ms ease-out). Ajustar: o utilitário já centraliza com transform, então a animação deve preservar o translate.
  2. Aplicar a animação quando a classe `hidden` é removida.
  3. Envolver todas as animações em `@media (prefers-reduced-motion: no-preference) { ... }` para respeitar usuários sensíveis a movimento.
- **Critérios de aceite:** overlays entram com fade/scale suave; com "Emular prefers-reduced-motion" no DevTools, aparecem instantaneamente sem animação.
- **Commit:** `feat(ux): transições de overlay com suporte a reduced motion`

### 5.5 — Responsividade real e controle por toque

- **Status:** [ ] pendente
- **Objetivo:** jogável em celular.
- **Passos:**
  1. Adicionar `<meta name="viewport" content="width=device-width, initial-scale=1">` ao `index.html` (e ao `design.html`).
  2. Refazer o layout para escalar: o conjunto moldura + canvas + visor deve reduzir proporcionalmente via `transform: scale()` calculado, ou preferencialmente com unidades relativas (`min(90vw, 540px)`) — escolher a abordagem que preservar o alinhamento da moldura `#MolduraPixelArt`, que hoje usa px absolutos. Testar nos breakpoints 1280px, 768px e 390px.
  3. Em `src/input.js`, adicionar `touchstart` no canvas (com `preventDefault`) chamando `onJump`, para o toque não gerar clique duplo nem scroll.
  4. Atualizar o texto de `.instructions` para mencionar toque quando `('ontouchstart' in window)`.
- **Critérios de aceite:** no modo dispositivo do DevTools (iPhone/Android), o jogo inteiro cabe na tela sem cortes e é jogável por toque; no desktop nada mudou.
- **Commit:** `feat(ux): layout responsivo e controle por toque`

### 5.6 — Acessibilidade

- **Status:** [ ] pendente
- **Objetivo:** o básico de a11y bem feito.
- **Passos:**
  1. `alt` descritivo em todas as `<img>` (`#MolduraPixelArt`: `alt=""` + `aria-hidden="true"` por ser decorativa; ícone de pausa: `alt="Pausar"` ou usar `aria-label` no botão).
  2. `aria-label="Pausar jogo"` no `#pauseBtn`; alternar para `"Continuar jogo"` quando pausado.
  3. Overlays com `role="dialog"` e `aria-live="polite"` no `#gameOverOverlay` para leitores de tela anunciarem o fim de jogo; visor com `aria-live="off"` (atualiza demais).
  4. Garantir contraste mínimo 4.5:1 nos textos sobre fundos (verificar `--color-text` sobre `--color-surface` com o DevTools).
  5. Conferir que toda interação funciona só com teclado (Tab até o botão JOGAR, Enter ativa).
- **Critérios de aceite:** auditoria de acessibilidade do Lighthouse ≥ 95; jogo operável apenas com teclado.
- **Commit:** `feat(ux): acessibilidade (aria, alt, contraste, teclado)`

---

## Fase 6 — Game feel

> **O que você aprende:** "game feel" (ou *juice*) — feedbacks sensoriais que fazem a mesma mecânica parecer 10x melhor. Cada tarefa aqui é um efeito isolado e opcional; a ordem interna é livre.

### 6.1 — Partículas do jetpack

- **Status:** [ ] pendente
- **Passos:** em um novo `src/particles.js`, gerar pontos (reutilizando o renderer e `gl.POINTS`, coerente com a técnica do projeto) que nascem sob o player enquanto `velocity > 0`, com cor amarelo→vermelho, vida curta (~0.4s), queda e fade (descartar partículas mortas). Máximo de ~100 partículas simultâneas.
- **Critérios de aceite:** segurar Espaço mostra rastro de fogo; soltar interrompe; FPS estável.
- **Commit:** `feat(feel): partículas de propulsão do jetpack`

### 6.2 — Screen shake na morte

- **Status:** [ ] pendente
- **Passos:** na transição para `GAME_OVER`, aplicar por ~300ms um deslocamento aleatório decrescente ao uniform `translation` de tudo que é desenhado (ou uma classe CSS com `@keyframes` de shake no canvas — mais simples). Respeitar `prefers-reduced-motion`.
- **Critérios de aceite:** morte gera tremida curta; com reduced motion, nada treme.
- **Commit:** `feat(feel): screen shake ao morrer`

### 6.3 — Sons e botão de mudo

- **Status:** [ ] pendente
- **Passos:** criar `src/audio.js` usando **Web Audio API com sons sintetizados** (osciladores: ruído curto para o jato, tom descendente para morte, blip para recorde) — sem arquivos de áudio, o que evita problemas de licença. Botão de mudo (`.btn-pixel`, ícone 🔊/🔇 em texto) ao lado do pause; preferência salva em `localStorage`. O `AudioContext` só pode iniciar após o primeiro gesto do usuário — criar no primeiro input.
- **Critérios de aceite:** sons tocam nos eventos; mudo silencia e persiste após reload; nenhum erro de autoplay no console.
- **Commit:** `feat(feel): efeitos sonoros sintetizados com toggle de mudo`

### 6.4 — Animação do contador de metros

- **Status:** [ ] pendente
- **Passos:** ao atualizar o visor, aplicar um "pulse" sutil (scale 1.0→1.08→1.0, ~120ms) a cada 100m cheios; na tela de morte, animar a contagem da distância de 0 até o valor final em ~0.8s (`requestAnimationFrame`).
- **Critérios de aceite:** pulse a cada 100m; contagem animada na tela de morte; reduced motion desativa ambos.
- **Commit:** `feat(feel): animações do contador de pontuação`

---

## Fase 7 — Vitrine de portfólio

> **O que você aprende:** empacotar e apresentar um projeto — deploy, documentação orientada a quem lê, e os metadados que fazem um link parecer profissional quando compartilhado.

### 7.1 — Deploy no GitHub Pages

- **Status:** [ ] pendente
- **Passos:** criar `.github/workflows/deploy.yml` com o workflow oficial de deploy estático do GitHub Pages (actions/upload-pages-artifact + actions/deploy-pages, branch main, publicando a raiz do repositório). Habilitar Pages nas configurações do repositório (Settings → Pages → GitHub Actions).
- **Critérios de aceite:** o jogo abre na URL `https://<usuario>.github.io/<repo>/` com todos os assets carregando (caminhos relativos — conferir que nenhum caminho começa com `/`).
- **Commit:** `chore: deploy automático no GitHub Pages`

### 7.2 — Favicon e meta tags Open Graph

- **Status:** [ ] pendente
- **Passos:** criar um favicon a partir do sprite do personagem (`Images/PixelArtJetPackGuy.png` redimensionado para 32×32 → `favicon.png`); adicionar ao `<head>`: `<link rel="icon">`, `<meta name="description">`, e as tags OG (`og:title`, `og:description`, `og:image` com um screenshot 1200×630 do jogo salvo em `Images/og-cover.png`, `og:url`) + `twitter:card summary_large_image`.
- **Critérios de aceite:** favicon aparece na aba; validar o link em https://www.opengraph.xyz/ mostra card com imagem.
- **Commit:** `feat: favicon e meta tags para compartilhamento`

### 7.3 — README de portfólio

- **Status:** [ ] pendente
- **Passos:** reescrever o README com: badge/link "▶ Jogar agora" para o GitHub Pages; GIF de gameplay (gravar com ScreenToGif/Kap, salvar em `Images/gameplay.gif`, máx. 5 MB); seção **"Como funciona a renderização"** explicando a técnica de pixels→pontos WebGL (com trecho do shader); seção **"Design System"** com link para `design.html` publicado; seção **"Arquitetura"** com a árvore de `src/` e uma frase sobre cada módulo; roadmap de próximos passos.
- **Critérios de aceite:** README renderiza no GitHub com GIF funcionando; todos os links (jogo, design system) funcionam.
- **Commit:** `docs: README de portfólio com demo, arquitetura e design system`

---

## Resumo do progresso

Visão rápida — marque cada tarefa aqui **e** no corpo dela ao concluir. Contagem: **11/35**.

### Fase 0 — Higiene do repositório ✅ (3/3)

- [x] 0.1 — Adicionar .gitignore e LICENSE
- [x] 0.2 — Remover arquivos e código mortos
- [x] 0.3 — Corrigir o README

### Fase 1 — Correção de bugs ✅ (5/5)

- [x] 1.1 — Corrigir o listener de teclado inválido
- [x] 1.2 — Unificar velocidade inicial dos obstáculos
- [x] 1.3 — Física com delta time
- [x] 1.4 — Unificar a lógica de pontuação
- [x] 1.5 — Carregamento paralelo dos assets

### Fase 2 — Arquitetura em módulos (3/7)

- [x] 2.1 — Migrar para ES Modules
- [x] 2.2 — Extrair configuração (config.js)
- [x] 2.3 — Extrair o renderer WebGL (renderer.js)
- [ ] 2.4 — Extrair o carregador de assets (assets.js)
- [ ] 2.3 — Extrair o renderer WebGL (renderer.js)
- [ ] 2.4 — Extrair o carregador de assets (assets.js)
- [ ] 2.5 — Extrair entidades e colisão (entities.js)
- [ ] 2.6 — Máquina de estados (state.js)
- [ ] 2.7 — Módulo de input (input.js)

### Fase 3 — Assets e performance (0/3)

- [ ] 3.1 — Otimizar as imagens PNG
- [ ] 3.2 — Substituir o JSON de background de 11 MB
- [ ] 3.3 — Tela de loading

### Fase 4 — Design system (0/4)

- [ ] 4.1 — Tokens de design (CSS custom properties)
- [ ] 4.2 — Aplicar tokens ao CSS existente
- [ ] 4.3 — Componentes base
- [ ] 4.4 — Página de documentação do design system

### Fase 5 — UX e fluxo de telas (0/6)

- [ ] 5.1 — Overlays declarativos
- [ ] 5.2 — Tela inicial (estado READY)
- [ ] 5.3 — Tela de morte com pontuação e recorde
- [ ] 5.4 — Transições e micro-animações de UI
- [ ] 5.5 — Responsividade real e controle por toque
- [ ] 5.6 — Acessibilidade

### Fase 6 — Game feel (0/4)

- [ ] 6.1 — Partículas do jetpack
- [ ] 6.2 — Screen shake na morte
- [ ] 6.3 — Sons e botão de mudo
- [ ] 6.4 — Animação do contador de metros

### Fase 7 — Vitrine de portfólio (0/3)

- [ ] 7.1 — Deploy no GitHub Pages
- [ ] 7.2 — Favicon e meta tags Open Graph
- [ ] 7.3 — README de portfólio
