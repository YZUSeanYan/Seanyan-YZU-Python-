// Duolingo-style sound effects manager
const SOUND_ENABLED_KEY = 'seanyan_sound_enabled';

function readSoundEnabled() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
}

let soundEnabled = readSoundEnabled();

const soundCache: Record<string, HTMLAudioElement> = {};
let audioContext: AudioContext | null = null;

function getAudio(src: string): HTMLAudioElement {
  if (!soundCache[src]) {
    soundCache[src] = new Audio(src);
    soundCache[src].volume = 0.4;
  }
  return soundCache[src];
}

export function playCorrect() {
  if (!soundEnabled) return;
  try {
    const audio = getAudio('/sounds/correct.mp3');
    audio.currentTime = 0;
    audio.play().catch(() => {}); // Ignore autoplay restrictions
  } catch { /* ignore */ }
}

export function playWrong() {
  if (!soundEnabled) return;
  try {
    const audio = getAudio('/sounds/wrong.mp3');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch { /* ignore */ }
}

export function playNext() {
  playTone(440, 0.045, 0, 'sine', 0.016);
  playTone(588, 0.055, 0.038, 'sine', 0.014);
}

function playTone(frequency: number, duration = 0.08, delay = 0, type: OscillatorType = 'sine', gain = 0.045) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new AudioContext();
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  } catch { /* ignore */ }
}

export function playSelect() {
  playTone(520, 0.055, 0, 'triangle', 0.028);
  playTone(760, 0.05, 0.045, 'triangle', 0.022);
}

export function playSuccessChime() {
  playCorrect();
  playTone(660, 0.07, 0, 'sine', 0.035);
  playTone(880, 0.08, 0.065, 'sine', 0.04);
  playTone(1175, 0.1, 0.135, 'sine', 0.035);
}

export function playErrorBuzz() {
  playWrong();
  playTone(220, 0.12, 0, 'sawtooth', 0.022);
  playTone(165, 0.11, 0.09, 'sawtooth', 0.018);
}

export function playFinish() {
  playTone(523, 0.08, 0, 'triangle', 0.03);
  playTone(659, 0.08, 0.07, 'triangle', 0.035);
  playTone(784, 0.12, 0.14, 'triangle', 0.04);
}

export function toggleSound() {
  setSoundEnabled(!soundEnabled);
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    }
  } catch { /* ignore */ }
  return soundEnabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function playSoundPreview() {
  playSelect();
  playTone(660, 0.07, 0.09, 'sine', 0.028);
}
