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

export function createAudio() {
  let ctx = null;
  let muted = localStorage.getItem(MUTE_KEY) === 'true';
  let jetpackSource = null;
  let jetpackFilter = null;
  let jetpackGain = null;
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
    if (muted || !ctx || jetpackSource) return;

    const noiseBuffer = createNoiseBuffer(ctx, 0.08);
    jetpackSource = ctx.createBufferSource();
    jetpackSource.buffer = noiseBuffer;
    jetpackSource.loop = true;

    jetpackFilter = ctx.createBiquadFilter();
    jetpackFilter.type = 'bandpass';
    jetpackFilter.frequency.value = 900;
    jetpackFilter.Q.value = 0.7;

    jetpackGain = ctx.createGain();
    jetpackGain.gain.value = 0.07;

    jetpackSource.connect(jetpackFilter);
    jetpackFilter.connect(jetpackGain);
    jetpackGain.connect(ctx.destination);
    jetpackSource.start();
  }

  function stopJetpack() {
    if (!jetpackSource) return;
    try {
      jetpackSource.stop();
    } catch (_) {
      /* já parado */
    }
    jetpackSource.disconnect();
    jetpackFilter.disconnect();
    jetpackGain.disconnect();
    jetpackSource = null;
    jetpackFilter = null;
    jetpackGain = null;
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
