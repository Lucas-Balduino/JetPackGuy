import { CONFIG } from './config.js';
import { createRenderer } from './renderer.js';
import { loadAllSprites } from './assets.js';
import { createPlayer, createObstacles, checkCollision, getRect } from './entities.js';
import { States, createStateMachine } from './state.js';
import { setupInput } from './input.js';

const pontuation = document.getElementById("visor");
const canvas = document.getElementById("canvas");
const loadingOverlay = document.getElementById("loadingOverlay");
const renderer = createRenderer(canvas);

const { player: playerData, vertical: verticalData, horizontal: horizontalData, background: backgroundData } = await loadAllSprites();

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

const INITIAL_OBSTACLE_VELOCITY = CONFIG.obstacles.initialVelocity;
let obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
const playerEntity = createPlayer(CONFIG);
const obstaclesEntity = createObstacles(CONFIG);
let points = 0;
const state = createStateMachine();
let backgroundX = 0;
let scoreTimer = 0;
let lastTime = null;
let firstFrameDrawn = false;

state.onChange((_from, to) => {
  if (to === States.PAUSED) {
    showPauseOverlay();
  } else {
    hidePauseOverlay();
  }

  if (to === States.GAME_OVER) {
    drawGameOverText();
  } else {
    const go = document.getElementById("gameOverText");
    if (go) go.remove();
  }
});

function applyJump(e) {
  if (e && e.type === 'click') {
    playerEntity.jump(CONFIG.physics.canvasClickJumpVelocity);
  } else if (playerEntity.state.y > CONFIG.player.jumpThresholdY) {
    playerEntity.jump(CONFIG.physics.jumpVelocity);
  } else {
    playerEntity.jump(CONFIG.physics.jumpVelocityFromGround);
  }
}

function startGame() {
  state.transition(States.PLAYING);
}

function resetGame() {
  state.force(States.READY);
  playerEntity.reset();
  obstaclesEntity.reset();
  obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
  points = 0;
  scoreTimer = 0;
  pontuation.textContent = "0000 m";
}

function checkAllCollisions() {
  const p = playerEntity.state;

  if (p.y <= CONFIG.bounds.deathFloor || p.y >= CONFIG.bounds.deathCeiling) {
    state.transition(States.GAME_OVER);
    return;
  }

  const playerRect = getRect(p);
  for (const r of obstaclesEntity.getRects()) {
    if (checkCollision(playerRect, r)) {
      state.transition(States.GAME_OVER);
      return;
    }
  }
}

function togglePause() {
  if (state.is(States.GAME_OVER)) return;
  if (state.is(States.PLAYING)) state.transition(States.PAUSED);
  else if (state.is(States.PAUSED)) state.transition(States.PLAYING);
}

setupInput({
  onJump: (e) => {
    if (state.is(States.GAME_OVER)) {
      resetGame();
      return;
    }
    if (state.is(States.READY)) startGame();
    if (!state.is(States.PLAYING) && !state.is(States.PAUSED)) return;
    applyJump(e);
  },
  onTogglePause: togglePause,
});

document.getElementById("pauseBtn").onclick = togglePause;

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

  if (state.is(States.PLAYING) || state.is(States.READY)) {
    backgroundX -= obstacleVelocity * dt * 60;
    if (backgroundX <= -2) {
      backgroundX = 0;
    }
  }

  if (state.is(States.PLAYING)) {
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
  const player = playerEntity.state;
  renderer.drawSprite(playerBuffers, [player.x, player.y]);

  if (!firstFrameDrawn) {
    firstFrameDrawn = true;
    loadingOverlay.classList.add("hidden");
  }

  requestAnimationFrame(animate);
}

console.log("Inicializando jogo...");
console.log("Vértices do jogador:", vertexCount);
console.log("Vértices obstáculo vertical:", vertexVerticalCount);
console.log("Vértices obstáculo horizontal:", vertexHorizontalCount);
console.log("Vértices background:", vertexBackgroundCount);

renderer.setViewport(canvas.width, canvas.height);
requestAnimationFrame(animate);
