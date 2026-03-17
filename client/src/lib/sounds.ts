const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playMoveSound() {
  playTone(600, 0.08, 'sine', 0.12);
}

export function playCaptureSound() {
  playTone(300, 0.15, 'square', 0.1);
  setTimeout(() => playTone(200, 0.1, 'square', 0.08), 50);
}

export function playCheckSound() {
  playTone(800, 0.1, 'sawtooth', 0.08);
  setTimeout(() => playTone(1000, 0.1, 'sawtooth', 0.06), 80);
}

export function playGameOverSound() {
  playTone(523, 0.2, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.2, 'sine', 0.1), 150);
  setTimeout(() => playTone(784, 0.3, 'sine', 0.1), 300);
}

export function playGameStartSound() {
  playTone(440, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(554, 0.1, 'sine', 0.1), 100);
}

export function playLowTimeSound() {
  playTone(440, 0.05, 'square', 0.06);
}
