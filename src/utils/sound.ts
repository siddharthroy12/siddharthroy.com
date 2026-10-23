const STORAGE_KEY = "sound-enabled";

let enabled = false;
let hydrated = false;
let audioContext: AudioContext | null = null;
const listeners = new Set<() => void>();

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    enabled = false;
  }
};

export function isSoundEnabled() {
  hydrate();
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  hydrate();
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // storage unavailable; keep in-memory state only
  }
  for (const listener of listeners) listener();
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A short synthesized blip. Silent unless sound has been enabled. */
export function playBlip() {
  if (!isSoundEnabled() || typeof window === "undefined") return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    const pitch = 780 + Math.random() * 220;
    oscillator.frequency.setValueAtTime(pitch, now);
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.6, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch {
    // audio unavailable; stay silent
  }
}
