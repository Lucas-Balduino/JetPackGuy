import { CONFIG } from './config.js';
import { createRenderer } from './renderer.js';
import { loadAllSprites } from './assets.js';

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
let y = CONFIG.player.startY,
  velocity = 0,
  gravity = CONFIG.physics.gravity;
const INITIAL_OBSTACLE_VELOCITY = CONFIG.obstacles.initialVelocity;
let x1 = CONFIG.obstacles.startX[0],
  x2 = CONFIG.obstacles.startX[1],
  x3 = CONFIG.obstacles.startX[2];
let obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
let y1 = 0,
  y2 = 0,
  y3 = 0;
let jumping = false;
let points = 0;
let gameOver = false;
let gameStarted = false;
let backgroundX = 0;
let paused = false;
let scoreTimer = 0;
let lastTime = null;

  const player = {
    width: CONFIG.player.width,
    height: CONFIG.player.height,
    x: CONFIG.player.x,
    y: y,
  };

  const horizontalObstacle = {
    width: CONFIG.obstacles.horizontal.width,
    height: CONFIG.obstacles.horizontal.height,
  };

  const verticalObstacle = {
    width: CONFIG.obstacles.vertical.width,
    height: CONFIG.obstacles.vertical.height,
  };

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
  }
}

function resetGame() {
  gameOver = false;
  gameStarted = false;
  y = -0.8;
  velocity = 0;
  x1 = 1.2;
  x2 = 1.8;
  x3 = 2.4;
  obstacleVelocity = INITIAL_OBSTACLE_VELOCITY;
  y1 = 0;
  y2 = 0;
  y3 = 0;
  points = 0;
  scoreTimer = 0;
  jumping = false;
  pontuation.textContent = "0000 m";
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function checkAllCollisions() {
  player.y = y;

  // Colisão com bordas da tela
    if (y <= CONFIG.bounds.deathFloor || y >= CONFIG.bounds.deathCeiling) {
    gameOver = true;
    return;
  }

  const horizontalObstRect = {
    x: x1 - horizontalObstacle.width / 2,
    y: y1 - horizontalObstacle.height / 2,
    width: horizontalObstacle.width,
    height: horizontalObstacle.height,
  };

  const verticalObst1Rect = {
    x: x2 - verticalObstacle.width / 2,
    y: y2 - verticalObstacle.height / 2,
    width: verticalObstacle.width,
    height: verticalObstacle.height,
  };

  const verticalObst2Rect = {
    x: x3 - verticalObstacle.width / 2,
    y: y3 - verticalObstacle.height / 2,
    width: verticalObstacle.width,
    height: verticalObstacle.height,
  };

  const playerRect = {
    x: player.x - player.width / 2,
    y: player.y - player.height / 2,
    width: player.width,
    height: player.height,
  };

  if (
    checkCollision(playerRect, horizontalObstRect) ||
    checkCollision(playerRect, verticalObst1Rect) ||
    checkCollision(playerRect, verticalObst2Rect)
  ) {
    gameOver = true;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (gameOver) {
      resetGame();
    } else {
      startGame();
      if (y > CONFIG.player.jumpThresholdY) {
        velocity = CONFIG.physics.jumpVelocity;
      } else {
        velocity = CONFIG.physics.jumpVelocityFromGround;
      }
      jumping = true;
    }
  }
});

  canvas.addEventListener('click', () => {
    if (gameOver) {
        resetGame();
    } else {
        startGame();
      velocity = CONFIG.physics.canvasClickJumpVelocity;
        jumping = true;
    }
});

document.getElementById("pauseBtn").onclick = function () {
  if (!gameOver) setPaused(!paused);
};

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && !gameOver) {
    setPaused(!paused);
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
  paused = value;
  if (paused) {
    showPauseOverlay();
  } else {
    hidePauseOverlay();
  }
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

  // Só atualiza movimento se não estiver pausado e não estiver em game over
  if (!gameOver && !paused) {
    backgroundX -= obstacleVelocity * dt * 60;
    if (backgroundX <= -2) {
      backgroundX = 0;
    }

    if (!gameOver) {
      const gameOverText = document.getElementById("gameOverText");
      if (gameOverText) {
        gameOverText.remove();
      }

      if (gameStarted) {
        y += velocity * dt * 60;
        velocity += gravity * dt * 60;
      }

      // Limites da tela
      if (y <= CONFIG.player.startY) {
        y = CONFIG.player.startY;
        velocity = 0;
        jumping = false;
      }
      if (y >= CONFIG.bounds.ceiling) {
        y = CONFIG.bounds.ceiling;
        velocity = Math.min(velocity, 0);
      }

      if (gameStarted) {
          x1 -= obstacleVelocity * dt * 60;
          if (x1 <= CONFIG.obstacles.offscreenX) {
            x1 = CONFIG.obstacles.respawnX[0];
            y1 = getRandomFloat(CONFIG.obstacles.spawnYRange[0], CONFIG.obstacles.spawnYRange[1]);
          }

          x2 -= obstacleVelocity * dt * 60;
          if (x2 <= CONFIG.obstacles.offscreenX) {
            x2 = CONFIG.obstacles.respawnX[1];
            y2 = getRandomFloat(CONFIG.obstacles.spawnYRange[0], CONFIG.obstacles.spawnYRange[1]);
          }

          x3 -= obstacleVelocity * dt * 60;
          if (x3 <= CONFIG.obstacles.offscreenX) {
            x3 = CONFIG.obstacles.respawnX[2];
            y3 = getRandomFloat(CONFIG.obstacles.spawnYRange[0], CONFIG.obstacles.spawnYRange[1]);
          }

        scoreTimer += dt;
        while (scoreTimer >= CONFIG.score.intervalSeconds) {
          scoreTimer -= CONFIG.score.intervalSeconds;
          points += 1;
          obstacleVelocity += CONFIG.obstacles.acceleration;
          pontuation.textContent = points.toString().padStart(4, "0") + " m";
        }

        checkAllCollisions();
      }
    } else {
      drawGameOverText();
    }
  } else if (gameOver) {
    drawGameOverText();
  }

  // Sempre desenha a cena (para mostrar overlay de pausa/game over)
  if (vertexBackgroundCount > 0) {
    renderer.drawSprite(backgroundBuffers, [backgroundX, 0], true);
    renderer.drawSprite(backgroundBuffers, [backgroundX + 2, 0], true);
  }
  renderer.drawSprite(horizontalBuffers, [x1, y1]);
  renderer.drawSprite(verticalBuffers, [x2, y2]);
  renderer.drawSprite(verticalBuffers, [x3, y3]);
  renderer.drawSprite(playerBuffers, [player.x, y]);

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
