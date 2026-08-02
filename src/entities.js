function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function createPlayer(cfg) {
  const p = {
    x: cfg.player.x,
    y: cfg.player.startY,
    width: cfg.player.width,
    height: cfg.player.height,
    velocity: 0,
    jumping: false,
    startY: cfg.player.startY,
    jumpThresholdY: cfg.player.jumpThresholdY,
  };

  function applyPhysics(dt) {
    p.y += p.velocity * dt * 60;
    p.velocity += cfg.physics.gravity * dt * 60;

    if (p.y <= p.startY) {
      p.y = p.startY;
      p.velocity = 0;
      p.jumping = false;
    }
    if (p.y >= cfg.bounds.ceiling) {
      p.y = cfg.bounds.ceiling;
      p.velocity = Math.min(p.velocity, 0);
    }
  }

  function jump(vel) {
    p.velocity = vel;
    p.jumping = true;
  }

  function reset() {
    p.y = p.startY;
    p.velocity = 0;
    p.jumping = false;
  }

  return Object.freeze({
    get state() {
      return p;
    },
    applyPhysics,
    jump,
    reset,
  });
}

export function createObstacles(cfg) {
  const obs = [];
  for (let i = 0; i < 3; i++) {
    const isHorizontal = i === 0;
    const width = isHorizontal ? cfg.obstacles.horizontal.width : cfg.obstacles.vertical.width;
    const height = isHorizontal ? cfg.obstacles.horizontal.height : cfg.obstacles.vertical.height;
    obs.push({
      x: cfg.obstacles.startX[i],
      y: 0,
      width,
      height,
      respawnX: cfg.obstacles.respawnX[i],
      isHorizontal,
    });
  }

  function advanceAll(velocity, dt) {
    for (let i = 0; i < obs.length; i++) {
      obs[i].x -= velocity * dt * 60;
      if (obs[i].x <= cfg.obstacles.offscreenX) {
        obs[i].x = obs[i].respawnX;
        obs[i].y = getRandomFloat(cfg.obstacles.spawnYRange[0], cfg.obstacles.spawnYRange[1]);
      }
    }
  }

  function reset() {
    for (let i = 0; i < obs.length; i++) {
      obs[i].x = cfg.obstacles.startX[i];
      obs[i].y = 0;
    }
  }

  function getRects() {
    return obs.map((o) => ({
      x: o.x - o.width / 2,
      y: o.y - o.height / 2,
      width: o.width,
      height: o.height,
    }));
  }

  function getPositions() {
    return obs.map((o) => [o.x, o.y]);
  }

  return Object.freeze({
    get obstacles() {
      return obs;
    },
    advanceAll,
    reset,
    getRects,
    getPositions,
  });
}

export function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

export function getRect(entity) {
  return {
    x: entity.x - entity.width / 2,
    y: entity.y - entity.height / 2,
    width: entity.width,
    height: entity.height,
  };
}
