# JetPack Guy WebGL

## 🚀 Sobre o Projeto

Uma recriação em pixel art do clássico *JetPack Joyride*, feita com **WebGL** puro. O jogo apresenta um cenário dinâmico, obstáculos que se movimentam e a pontuação em tempo real, tudo renderizado diretamente no canvas.

### 🎮 Funcionalidades

* **Renderização por pontos**: cada sprite é carregado de um JSON de pixels, garantindo fidelidade ao pixel art original.
* **Controles intuitivos**: `Espaço`, `Clique` ou seta para cima para voar; `P` ou botão de pausa para pausar.
* **Obstáculos dinâmicos**: obstáculos horizontais e verticais aparecem em posições randômicas a cada ciclo.
* **Sistema de pontuação**: contador em metros que aumenta a cada 0.1s e acelera a dificuldade.
* **Animações fluidas**: loop de renderização a 60fps usando `requestAnimationFrame`.

## 🛠️ Tecnologias

* **JavaScript** + **WebGL** (contexto `webgl` sem bibliotecas externas)
* **HTML5** + **CSS3** (layout, frames e visor estilizado)
* **Pixelify Sans** (Google Font)
* **JSON** para dados de pixel art

## 📂 Estrutura do Projeto

```
├── index.html
├── style.css
├── script.js
├── Images/              # imagens (PNG) usadas pelo jogo
├── ImagesJson/          # JSONs com pixels dos sprites
├── Info/                # anotações e dimensões (histórico)
├── AGENTS.md            # contexto para agentes
├── ROADMAP.md           # plano de evolução e tarefas
└── README.md
```

## 📥 Como Executar

1. **Clone** o repositório:

   ```bash
   git clone https://github.com/Lucas-Balduino/JetPackGuy.git
   ```
2. Abra um **servidor local** (recomendado para evitar bloqueios de `fetch`):

   ```bash
   cd JetPackGuy
   npx serve .
   ```
3. Acesse `http://localhost:5000` no navegador.

## 🎮 Controles

| Ação      | Tecla/Botão          |
| --------- | -------------------- |
| Voar      | `Espaço` / `Clique`  |
| Pausar    | `P` / botão de pausa |
| Reiniciar | `Espaço` / `Clique`  |

## 📝 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

> Feito por Lucas Gonçalves Balduíno, Augusto Sodré Carneiro Lima, Luana Ferreira Veloso Lima |  [GitHub](https://github.com/Lucas-Balduino)
