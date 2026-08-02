import { CONFIG } from './config.js';
import { createRenderer } from './renderer.js';
import { loadAllSprites } from './assets.js';
import { createPlayer, createObstacles, checkCollision, getRect } from './entities.js';
import { States, createStateMachine } from './state.js';
import { setupInput } from './input.js';
import { getHighScore, saveHighScore } from './storage.js';

const pontuation = document.getElementById("visor");
const canvas = document.getElementById("canvas");
const loadingOverlay = document.getElementById("loadingOverlay");
const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
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

function formatScore(value) {
  return value.toString().padStart(4, "0") + " m";
}

function updateGameOverOverlay() {
  const distanceEl = document.getElementById("gameOverDistance");
  const recordEl = document.getElementById("gameOverRecord");
  const newRecordEl = document.getElementById("gameOverNewRecord");
  const previousHigh = getHighScore();
  const isNewRecord = points > previousHigh;

  distanceEl.textContent = formatScore(points);
  if (isNewRecord) saveHighScore(points);
  recordEl.textContent = "RECORDE: " + formatScore(isNewRecord ? points : previousHigh);
  newRecordEl.classList.toggle("hidden", !isNewRecord);
}

state.onChange((_from, to) => {
  startOverlay.classList.toggle("hidden", to !== States.READY);
  pauseOverlay.classList.toggle("hidden", to !== States.PAUSED);
  gameOverOverlay.classList.toggle("hidden", to !== States.GAME_OVER);
  if (to === States.GAME_OVER) updateGameOverOverlay();
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

function resetGameState() {
  playerEntity.reset();
  obstaclesEntity.reset();
  obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
  points = 0;
  scoreTimer = 0;
  pontuation.textContent = "0000 m";
}

function resetGame() {
  resetGameState();
  state.force(States.READY);
}

function restartGame() {
  resetGameState();
  state.force(States.PLAYING);
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
      restartGame();
      return;
    }
    if (state.is(States.READY)) startGame();
    if (!state.is(States.PLAYING) && !state.is(States.PAUSED)) return;
    applyJump(e);
  },
  onTogglePause: togglePause,
});

document.getElementById("pauseBtn").onclick = togglePause;
document.getElementById("startBtn").onclick = () => {
  if (state.is(States.READY)) startGame();
};
document.getElementById("restartBtn").onclick = () => {
  if (state.is(States.GAME_OVER)) restartGame();
};

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
