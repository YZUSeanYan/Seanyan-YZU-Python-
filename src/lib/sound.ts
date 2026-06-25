// Duolingo-style sound effects manager
let soundEnabled = true;

const soundCache: Record<string, HTMLAudioElement> = {};

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
  if (!soundEnabled) return;
  try {
    const audio = getAudio('/sounds/next.mp3');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch { /* ignore */ }
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}
