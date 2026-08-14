# Skills de agente — JetPack Guy

Catálogo das skills instaladas **neste repositório** para o Cursor (e outros agentes que leem `.agents/skills/`). Elas não fazem parte do runtime do jogo: não entram no GitHub Pages e **não** autorizam adicionar frameworks, bundlers ou bibliotecas ao código em `src/`.

Fonte canônica: [`.agents/skills/`](.agents/skills/). Versões travadas em [`skills-lock.json`](skills-lock.json).

Antes de usar uma skill, leia o `SKILL.md` correspondente. Respeite o [`AGENTS.md`](AGENTS.md): sprites continuam `gl.POINTS`, CSS continua em tokens, e o jogo continua HTML/CSS/JS servido direto.

## Quando usar cada uma

| Skill | Use quando | Não use para |
|---|---|---|
| [`frontend-design`](.agents/skills/frontend-design/SKILL.md) | Polir HUD, overlays ou `design.html` sem visual genérico de IA | Reescrever o renderer WebGL ou trocar a paleta pixel sem pedido |
| [`web-design-guidelines`](.agents/skills/web-design-guidelines/SKILL.md) | Auditar HTML/CSS (foco, contraste, espaçamento, UX) | Mudar física, colisão ou shaders |
| [`design-system`](.agents/skills/design-system/SKILL.md) | Auditar tokens, documentar `.btn-pixel` / `.panel-pixel`, estender o sistema | Inventar um DS paralelo (Tailwind, shadcn, etc.) |
| [`design-critique`](.agents/skills/design-critique/SKILL.md) | Review estruturado da UI ou do styleguide como peça de portfólio | Implementar features de gameplay |
| [`webapp-testing`](.agents/skills/webapp-testing/SKILL.md) | Automatizar o checklist de partida (voar, pausar, morrer, reiniciar) | Empacotar Playwright dentro do jogo |
| [`playwright-cli`](.agents/skills/playwright-cli/SKILL.md) | Controlar um browser ao vivo (snapshot, clique, screenshot) | Testar sites de terceiros ou alterar o deploy |
| [`seo-audit`](.agents/skills/seo-audit/SKILL.md) | Auditar a URL do GitHub Pages (meta, OG, descrição) | SEO de conteúdo que não existe neste repo |

Origem e instalação (já aplicadas neste clone):

```bash
npx skills add anthropics/skills --skill frontend-design --skill webapp-testing --agent cursor -y --copy
npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent cursor -y --copy
npx skills add anthropics/knowledge-work-plugins --skill design-system --skill design-critique --skill seo-audit --agent cursor -y --copy
npx skills add microsoft/playwright-cli --skill playwright-cli --agent cursor -y --copy
```

## Como cada skill funciona (resumo)

- **frontend-design** — define uma direção estética (paleta, tipo, layout, um risco visual) e só então gera HTML/CSS alinhado à identidade do projeto (aqui: pixel art, tokens existentes).
- **web-design-guidelines** — baixa as [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) da Vercel e aponta violações no formato `arquivo:linha`.
- **design-system** — três modos: `audit` (inconsistências e valores soltos), `document` (um componente) e `extend` (padrão novo a partir dos tokens).
- **design-critique** — crítica em dimensões fixas (primeira impressão, usabilidade, hierarquia, consistência) a partir de URL, screenshot ou descrição.
- **webapp-testing** — scripts Playwright em Python; o helper `scripts/with_server.py` sobe `npx serve .`, inspeciona o DOM e executa ações. Não adiciona dependência ao jogo.
- **playwright-cli** — CLI da Microsoft para sessão de browser (`open`, `goto`, `click`, snapshot). Snyk marca risco alto porque controla um browser local — usar só contra o jogo neste repo.
- **seo-audit** — pede a URL publicada (`https://Lucas-Balduino.github.io/JetPackGuy/`) e devolve um plano (meta tags, OG, conteúdo).

## Manutenção

```bash
npx skills list              # o que está instalado no projeto
npx skills update -p -y      # atualizar só as skills deste repo
```

Para restaurar num clone novo a partir do lock: `npx skills experimental_install`.

Não edite os arquivos dentro de `.agents/skills/` à mão — o `skills-lock.json` valida o hash. Para incluir outra skill, use `npx skills find`, confirme qualidade (fonte oficial, 1K+ installs) e atualize **este arquivo** e o mapa no `AGENTS.md` no mesmo commit.
