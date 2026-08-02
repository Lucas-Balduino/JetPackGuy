function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createJetpackParticles(renderer) {
  const particles = [];
  const maxParticles = 100;
  const lifetime = 0.4;
  const emissionRate = 120;
  let emissionAccumulator = 0;

  function reset() {
    particles.length = 0;
    emissionAccumulator = 0;
  }

  function spawn(player) {
    if (particles.length >= maxParticles) {
      particles.shift();
    }

    const ageOffset = getRandomFloat(0, 0.08);
    particles.push({
      x: player.x + getRandomFloat(-0.02, 0.01),
      y: player.y - player.height / 2 - 0.02,
      vx: getRandomFloat(-0.008, 0.008),
      vy: getRandomFloat(-0.035, -0.012),
      age: ageOffset,
      maxAge: lifetime,
      lifeSeed: Math.random(),
    });
  }

  function update(dt, player, canEmit) {
    if (canEmit && player.velocity > 0) {
      emissionAccumulator += dt * emissionRate;
      while (emissionAccumulator >= 1) {
        emissionAccumulator -= 1;
        spawn(player);
      }
    } else {
      emissionAccumulator = 0;
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.age += dt;
      particle.x += particle.vx * dt * 60;
      particle.y += particle.vy * dt * 60;
      particle.vy -= 0.00055 * dt * 60;
      particle.vx *= 0.995;

      if (particle.age >= particle.maxAge) {
        particles.splice(i, 1);
      }
    }
  }

  function draw() {
    if (particles.length === 0) return;

    const positions = new Float32Array(particles.length * 2);
    const colors = new Float32Array(particles.length * 4);

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const lifeRatio = clamp(1 - particle.age / particle.maxAge, 0, 1);
      const heat = clamp(particle.age / particle.maxAge, 0, 1);
      const red = 1;
      const green = 0.82 - heat * 0.55;
      const blue = 0.12 - heat * 0.12;
      const alpha = lifeRatio * (0.7 + particle.lifeSeed * 0.3);

      positions[i * 2] = particle.x;
      positions[i * 2 + 1] = particle.y;
      colors[i * 4] = red;
      colors[i * 4 + 1] = clamp(green, 0, 1);
      colors[i * 4 + 2] = clamp(blue, 0, 1);
      colors[i * 4 + 3] = alpha;
    }

    renderer.drawPoints(positions, colors);
  }

  return Object.freeze({
    reset,
    update,
    draw,
  });
}