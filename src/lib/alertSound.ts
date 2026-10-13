// Alert tones synthesized with Web Audio — no audio files to ship or load.
// Browsers keep an AudioContext suspended until the user interacts with the
// page, so the context is unlocked on the first click/keypress.

const STORAGE_KEY = 'alert-sound-enabled'

export function isAlertSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setAlertSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // storage blocked — the preference just won't persist
  }
}

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  return ctx
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    void getContext()?.resume()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

interface Note {
  freq: number
  start: number
  duration: number
  type?: OscillatorType
  gain?: number
}

function playNotes(notes: Note[]) {
  const audio = getContext()
  if (!audio) return
  void audio.resume()
  const t0 = audio.currentTime + 0.02

  for (const { freq, start, duration, type = 'sine', gain = 0.25 } of notes) {
    const osc = audio.createOscillator()
    const env = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0 + start)
    // Short attack and exponential release so notes don't click.
    env.gain.setValueAtTime(0.0001, t0 + start)
    env.gain.exponentialRampToValueAtTime(gain, t0 + start + 0.015)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + start + duration)
    osc.connect(env).connect(audio.destination)
    osc.start(t0 + start)
    osc.stop(t0 + start + duration + 0.05)
  }
}

/** Urgent falling two-tone alarm, three times. */
function playPowerCut() {
  const notes: Note[] = []
  for (let i = 0; i < 3; i++) {
    const s = i * 0.5
    notes.push({ freq: 880, start: s, duration: 0.2, type: 'square', gain: 0.12 })
    notes.push({ freq: 587, start: s + 0.22, duration: 0.24, type: 'square', gain: 0.12 })
  }
  playNotes(notes)
}

/** Bright rising chime (C–E–G–C). */
function playPowerRestored() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.25 },
    { freq: 659.25, start: 0.12, duration: 0.25 },
    { freq: 783.99, start: 0.24, duration: 0.3 },
    { freq: 1046.5, start: 0.36, duration: 0.55 },
  ])
}

export function playAlertSound(kind: 'cut' | 'restored', { force = false } = {}) {
  if (!force && !isAlertSoundEnabled()) return
  if (kind === 'cut') playPowerCut()
  else playPowerRestored()
}
