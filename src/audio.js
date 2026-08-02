import { CONFIG } from './config.js';

const MUTE_KEY = 'jetpackguy:muted';

function createNoiseBuffer(context, durationSeconds) {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function buildJetpackGraph(context, jetpackCfg) {
  const master = context.createGain();
  master.gain.value = jetpackCfg.masterGain;
  const sources = [];
  const disconnect = [];

  if (jetpackCfg.noise) {
    const noiseCfg = jetpackCfg.noise;
    const noiseBuffer = createNoiseBuffer(context, noiseCfg.bufferDuration);
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    let tail = noiseSource;
    if (noiseCfg.filterType) {
      const filter = context.createBiquadFilter();
      filter.type = noiseCfg.filterType;
      filter.frequency.value = noiseCfg.frequency;
      filter.Q.value = noiseCfg.q;
      noiseSource.connect(filter);
      tail = filter;
      disconnect.push(filter);
    }

    const noiseGain = context.createGain();
    noiseGain.gain.value = noiseCfg.gain;
    tail.connect(noiseGain);
    noiseGain.connect(master);
    disconnect.push(noiseGain);
    sources.push(noiseSource);
  }

  if (jetpackCfg.oscillator) {
    const oscCfg = jetpackCfg.oscillator;
    const oscillator = context.createOscillator();
    oscillator.type = oscCfg.type;
    oscillator.frequency.value = oscCfg.frequency;
    const oscGain = context.createGain();
    oscGain.gain.value = oscCfg.gain;
    oscillator.connect(oscGain);
    oscGain.connect(master);
    disconnect.push(oscGain);
    sources.push(oscillator);
  }

  master.connect(context.destination);
  disconnect.push(master);

  for (const source of sources) {
    source.start();
  }

  return { sources, disconnect };
}

export function createAudio() {
  let ctx = null;
  let muted = localStorage.getItem(MUTE_KEY) === 'true';
  let jetpackNodes = null;
  let gestureInitDone = false;

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function initOnFirstGesture() {
    if (gestureInitDone) return;
    const handler = () => {
      ensureContext();
      gestureInitDone = true;
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('pointerdown', handler);
    document.addEventListener('keydown', handler);
  }

  function isMuted() {
    return muted;
  }

  function setMuted(value) {
    muted = value;
    localStorage.setItem(MUTE_KEY, value ? 'true' : 'false');
    if (muted) stopJetpack();
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function startJetpack() {
    if (muted || !ctx || jetpackNodes) return;
    jetpackNodes = buildJetpackGraph(ctx, CONFIG.audio.jetpack);
  }

  function stopJetpack() {
    if (!jetpackNodes) return;
    for (const source of jetpackNodes.sources) {
      try {
        source.stop();
      } catch (_) {
        /* já parado */
      }
      source.disconnect();
    }
    for (const node of jetpackNodes.disconnect) {
      node.disconnect();
    }
    jetpackNodes = null;
  }

  function playDeath() {
    if (muted) return;
    const context = ensureContext();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.32);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + 0.38);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  function playRecordBlip() {
    if (muted) return;
    const context = ensureContext();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(990, now + 0.06);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + 0.16);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  return {
    initOnFirstGesture,
    isMuted,
    toggleMute,
    startJetpack,
    stopJetpack,
    playDeath,
    playRecordBlip,
  };
}
