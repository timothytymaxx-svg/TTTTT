// Sound synthesizers using standard Web Audio API (zero external assets needed)

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;
let globalVolume: number = 0.8;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('classroom_sound_muted', muted ? 'true' : 'false');
  }
}

export function getSoundMuted(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('classroom_sound_muted');
    if (stored !== null) {
      isMuted = stored === 'true';
    }
  }
  return isMuted;
}

export function setSoundVolume(vol: number) {
  globalVolume = Math.max(0, Math.min(1, vol));
}

// Play a mechanical/woodblock click sound during shuffling
export function playTickSound(frequency = 520, duration = 0.04) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.3 * globalVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore audio context restrictions
  }
}

// Play celebratory fanfare chord progression when a student is picked
export function playCelebrationFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [
      { freq: 523.25, time: 0, dur: 0.12 }, // C5
      { freq: 659.25, time: 0.1, dur: 0.12 }, // E5
      { freq: 783.99, time: 0.2, dur: 0.14 }, // G5
      { freq: 1046.5, time: 0.32, dur: 0.45 }, // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      const startTime = ctx.currentTime + time;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.4 * globalVolume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });

    // Add a subtle warm bass root
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.32); // C4
    bassGain.gain.setValueAtTime(0.25 * globalVolume, ctx.currentTime + 0.32);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(ctx.currentTime + 0.32);
    bassOsc.stop(ctx.currentTime + 0.8);
  } catch {
    // ignore
  }
}

// Play swoosh sound for tab change or group shuffle
export function playWhooshSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15 * globalVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }
}
