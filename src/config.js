export const JETPACK_SOUND_PRESETS = Object.freeze({
  hiss: Object.freeze({
    masterGain: 0.07,
    noise: Object.freeze({
      bufferDuration: 0.08,
      gain: 1,
      filterType: 'bandpass',
      frequency: 900,
      q: 0.7,
    }),
    oscillator: null,
  }),
  crackle: Object.freeze({
    masterGain: 0.06,
    noise: Object.freeze({
      bufferDuration: 0.04,
      gain: 1,
      filterType: 'highpass',
      frequency: 1800,
      q: 1.1,
    }),
    oscillator: null,
  }),
  engine: Object.freeze({
    masterGain: 0.09,
    noise: Object.freeze({
      bufferDuration: 0.05,
      gain: 0.55,
      filterType: 'lowpass',
      frequency: 420,
      q: 0.5,
    }),
    oscillator: Object.freeze({
      type: 'sawtooth',
      frequency: 72,
      gain: 0.45,
    }),
  }),
  whoosh: Object.freeze({
    masterGain: 0.2,
    noise: Object.freeze({
      bufferDuration: 0.11,
      gain: 1,
      filterType: 'bandpass',
      frequency: 240,
      q: 1.2,
    }),
    oscillator: null,
  }),
});

export const CONFIG = Object.freeze({
  player: { x: -0.7, startY: -0.8, width: 0.08, height: 0.08, jumpThresholdY: -0.7 },
  physics: { gravity: -0.001, jumpVelocity: 0.023, jumpVelocityFromGround: 0.03, canvasClickJumpVelocity: 0.028 },
  bounds: { floor: -0.8, ceiling: 0.93, deathFloor: -0.85, deathCeiling: 1 },
  obstacles: {
    initialVelocity: 0.015,
    acceleration: 0.00003,
    horizontal: { width: 0.25, height: 0.06 },
    vertical: { width: 0.06, height: 0.25 },
    respawnX: [1.5, 1.8, 2.1],
    startX: [1.2, 1.8, 2.4],
    offscreenX: -1.5,
    spawnYRange: [-0.8, 0.8],
  },
  score: { intervalSeconds: 0.1 },
  audio: Object.freeze({
    jetpack: JETPACK_SOUND_PRESETS.whoosh,
  }),
});
