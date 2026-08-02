import { CONFIG } from './config.js';
import { createRenderer } from './renderer.js';
import { loadAllSprites } from './assets.js';
import { createPlayer, createObstacles, checkCollision, getRect } from './entities.js';
import { States, createStateMachine } from './state.js';

const pontuation = document.getElementById("visor");
const canvas = document.getElementById("canvas");
const renderer = createRenderer(canvas);

// Definir dimensões dos sprites
const spriteWidth = 100;
const spriteHeight = 100;

// Carrega sprites via módulo de assets (inclui fallbacks)
const { player: playerData, vertical: verticalData, horizontal: horizontalData, background: backgroundData } = await loadAllSprites();

// Inicializa buffers via renderer
const playerBuffers = renderer.createSpriteBuffers(
  playerData.positionArray,
  playerData.colorArray
);
const vertexCount = playerBuffers.count;

const verticalBuffers = renderer.createSpriteBuffers(
  verticalData.positionArray,
  verticalData.colorArray
);
const vertexVerticalCount = verticalBuffers.count;

const horizontalBuffers = renderer.createSpriteBuffers(
  horizontalData.positionArray,
  horizontalData.colorArray
);
const vertexHorizontalCount = horizontalBuffers.count;

const backgroundBuffers = renderer.createSpriteBuffers(
  backgroundData.positionArray,
  backgroundData.colorArray
);
const vertexBackgroundCount = backgroundBuffers.count;

// Estado do jogo
const INITIAL_OBSTACLE_VELOCITY = CONFIG.obstacles.initialVelocity;
let obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
// Entities
const playerEntity = createPlayer(CONFIG);
const obstaclesEntity = createObstacles(CONFIG);
let jumping = false;
let points = 0;
const state = createStateMachine();
let backgroundX = 0;
let scoreTimer = 0;
let lastTime = null;

// Reaja a mudanças de estado para controlar overlays de forma centralizada
state.onChange((from, to) => {
  // Pausa: mostrar/ocultar overlay
  if (to === States.PAUSED) {
    showPauseOverlay();
  } else {
    hidePauseOverlay();
  }

  // Game over: criar overlay apenas ao entrar; remover ao sair
  if (to === States.GAME_OVER) {
    drawGameOverText();
  } else {
    const go = document.getElementById("gameOverText");
    if (go) go.remove();
  }
});

  const player = playerEntity.state;

  const horizontalObstacle = {
    width: CONFIG.obstacles.horizontal.width,
    height: CONFIG.obstacles.horizontal.height,
  };

  const verticalObstacle = {
    width: CONFIG.obstacles.vertical.width,
    height: CONFIG.obstacles.vertical.height,
  };

function startGame() {
  // Transition to PLAYING (valid from READY or PAUSED)
  state.transition(States.PLAYING);
}

function resetGame() {
  // Reset to READY
  state.force(States.READY);
  playerEntity.reset();
  obstaclesEntity.reset();
  obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
  points = 0;
  scoreTimer = 0;
  jumping = false;
  pontuation.textContent = "0000 m";
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// `checkCollision` imported from `src/entities.js`

function checkAllCollisions() {
  const p = playerEntity.state;

  // Colisão com bordas da tela
  if (p.y <= CONFIG.bounds.deathFloor || p.y >= CONFIG.bounds.deathCeiling) {
    state.transition(States.GAME_OVER);
    return;
  }

  const playerRect = getRect(p);
  const rects = obstaclesEntity.getRects();
  for (const r of rects) {
    if (checkCollision(playerRect, r)) {
      state.transition(States.GAME_OVER);
      return;
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (state.is(States.GAME_OVER)) {
      resetGame();
    } else {
      startGame();
      if (playerEntity.state.y > CONFIG.player.jumpThresholdY) {
        playerEntity.jump(CONFIG.physics.jumpVelocity);
      } else {
        playerEntity.jump(CONFIG.physics.jumpVelocityFromGround);
      }
      jumping = true;
    }
  }
});

  canvas.addEventListener('click', () => {
    if (state.is(States.GAME_OVER)) {
        resetGame();
    } else {
        startGame();
      playerEntity.jump(CONFIG.physics.canvasClickJumpVelocity);
        jumping = true;
    }
});

document.getElementById("pauseBtn").onclick = function () {
  if (!state.is(States.GAME_OVER)) {
    if (state.is(States.PLAYING)) state.transition(States.PAUSED);
    else if (state.is(States.PAUSED)) state.transition(States.PLAYING);
  }
};

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") {
    if (!state.is(States.GAME_OVER)) {
      if (state.is(States.PLAYING)) state.transition(States.PAUSED);
      else if (state.is(States.PAUSED)) state.transition(States.PLAYING);
    }
  }
});

// Rendering is delegated to src/renderer.js

function drawGameOverText() {
  const gameOverDiv = document.createElement("div");
  gameOverDiv.style.position = "absolute";
  gameOverDiv.style.top = "50%";
  gameOverDiv.style.left = "50%";
  gameOverDiv.style.transform = "translate(-50%, -50%)";
  gameOverDiv.style.color = "#ff4444";
  gameOverDiv.style.fontSize = "28px";
  gameOverDiv.style.fontWeight = "bold";
  gameOverDiv.style.textAlign = "center";
  gameOverDiv.style.pointerEvents = "none";
  gameOverDiv.style.zIndex = "100";
  gameOverDiv.innerHTML =
    'GAME OVER<br><span style="font-size: 18px;">Pressione ESPAÇO ou clique para reiniciar</span>';
  gameOverDiv.id = "gameOverText";

  const existingText = document.getElementById("gameOverText");
  if (existingText) {
    existingText.remove();
  }

  document.body.appendChild(gameOverDiv);
}

function setPaused(value) {
  if (value) state.transition(States.PAUSED);
  else state.transition(States.PLAYING);
  if (state.is(States.PAUSED)) showPauseOverlay();
  else hidePauseOverlay();
}

function showPauseOverlay() {
  let pauseDiv = document.getElementById("pauseOverlay");
  if (!pauseDiv) {
    pauseDiv = document.createElement("div");
    pauseDiv.id = "pauseOverlay";
    pauseDiv.style.position = "absolute";
    pauseDiv.style.top = "50%";
    pauseDiv.style.left = "50%";
    pauseDiv.style.transform = "translate(-50%, -50%)";
    pauseDiv.style.color = "#fff";
    pauseDiv.style.fontSize = "32px";
    pauseDiv.style.fontWeight = "bold";
    pauseDiv.style.textAlign = "center";
    pauseDiv.style.pointerEvents = "none";
    pauseDiv.style.zIndex = "101";
    pauseDiv.style.textShadow = "0 0 10px #000";
    pauseDiv.innerHTML = "PAUSADO";
    document.body.appendChild(pauseDiv);
  }
}

function hidePauseOverlay() {
  const pauseDiv = document.getElementById("pauseOverlay");
  if (pauseDiv) pauseDiv.remove();
}

function animate(now) {
  if (lastTime === null) lastTime = now;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  renderer.clear();

  // Background deve se mover em READY e PLAYING; física e obstáculos só em PLAYING
  if (state.is(States.PLAYING) || state.is(States.READY)) {
    backgroundX -= obstacleVelocity * dt * 60;
    if (backgroundX <= -2) {
      backgroundX = 0;
    }
  }

  if (state.is(States.PLAYING)) {
    // Física do jogador e obstáculos
    playerEntity.applyPhysics(dt);
    obstaclesEntity.advanceAll(obstacleVelocity, dt);

    scoreTimer += dt;
    while (scoreTimer >= CONFIG.score.intervalSeconds) {
      scoreTimer -= CONFIG.score.intervalSeconds;
      points += 1;
      obstacleVelocity += CONFIG.obstacles.acceleration;
      pontuation.textContent = points.toString().padStart(4, "0") + " m";
    }

    checkAllCollisions();
  }

  // Sempre desenha a cena (para mostrar overlay de pausa/game over)
  if (vertexBackgroundCount > 0) {
    renderer.drawSprite(backgroundBuffers, [backgroundX, 0], true);
    renderer.drawSprite(backgroundBuffers, [backgroundX + 2, 0], true);
  }
  const positions = obstaclesEntity.getPositions();
  if (positions.length >= 3) {
    renderer.drawSprite(horizontalBuffers, positions[0]);
    renderer.drawSprite(verticalBuffers, positions[1]);
    renderer.drawSprite(verticalBuffers, positions[2]);
  }
  renderer.drawSprite(playerBuffers, [player.x, player.y]);

  requestAnimationFrame(animate);
}

// Log de debug
console.log("Inicializando jogo...");
console.log("Vértices do jogador:", vertexCount);
console.log("Vértices obstáculo vertical:", vertexVerticalCount);
console.log("Vértices obstáculo horizontal:", vertexHorizontalCount);
console.log("Vértices background:", vertexBackgroundCount);

renderer.setViewport(canvas.width, canvas.height);
requestAnimationFrame(animate);
