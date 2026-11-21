// audio.js — synthesized WebAudio sounds, no audio files: soft footfalls
// that grow louder as a guard nears, an alert sting, a key chime, and
// win / lose tones. The context starts on the first user gesture, so
// screenshots taken without interaction stay silent and error-free.
export function makeAudio() {
  const audio = {
    ctx: null,
    master: null,
    stepTimer: 0,
    muted: false,
  };

  audio.ensure = function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      audio.ctx = new Ctor();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.35;
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch {
      return false;
    }
  };

  function tone(freq, seconds, type, volume, slideTo) {
    if (!audio.ctx || audio.muted) return;
    const now = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  function noiseBurst(seconds, volume, lowpass) {
    if (!audio.ctx || audio.muted) return;
    const now = audio.ctx.currentTime;
    const length = Math.floor(audio.ctx.sampleRate * seconds);
    const buffer = audio.ctx.createBuffer(1, length, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = audio.ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    source.start(now);
  }

  audio.footstep = function footstep(nearestGuardDist) {
    // Louder when a guard is close: footsteps tell you where a guard is.
    const closeness = Math.max(0, 1 - nearestGuardDist / 320);
    noiseBurst(0.09, 0.05 + closeness * 0.22, 500 + closeness * 600);
  };

  audio.playerStep = function playerStep(sprinting) {
    noiseBurst(0.06, sprinting ? 0.16 : 0.07, 420);
  };

  audio.alertSting = function alertSting() {
    tone(660, 0.16, 'square', 0.16, 520);
    setTimeout(() => tone(880, 0.22, 'square', 0.16, 620), 130);
  };

  audio.pickup = function pickup() {
    tone(880, 0.12, 'sine', 0.2, 1320);
    setTimeout(() => tone(1320, 0.18, 'sine', 0.16), 90);
  };

  audio.unlock = function unlock() {
    tone(520, 0.14, 'triangle', 0.2, 780);
    setTimeout(() => tone(780, 0.2, 'triangle', 0.18), 110);
  };

  audio.win = function win() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => tone(freq, 0.28, 'triangle', 0.2), i * 140);
    });
  };

  audio.lose = function lose() {
    tone(320, 0.3, 'sawtooth', 0.14, 180);
    setTimeout(() => tone(210, 0.45, 'sawtooth', 0.12, 120), 220);
  };

  audio.tickGuardSteps = function tickGuardSteps(dt, guards, player) {
    if (!audio.ctx) return;
    audio.stepTimer -= dt;
    if (audio.stepTimer > 0) return;
    let nearest = Infinity;
    for (const guard of guards) {
      nearest = Math.min(nearest, Math.hypot(guard.x - player.x, guard.y - player.y));
    }
    if (nearest < 320) {
      audio.footstep(nearest);
      audio.stepTimer = 0.55;
    } else {
      audio.stepTimer = 0.25;
    }
  };

  return audio;
}
