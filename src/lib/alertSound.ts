// Alert tones synthesized with Web Audio — no audio files to ship or load.
// Browsers keep an AudioContext suspended until the user interacts with the
// page, so the context is unlocked on the first click/keypress.

export type AlertKind = 'cut' | 'restored'

const STORAGE_KEY = 'alert-sound-enabled'
const SOUND_KEYS: Record<AlertKind, string> = {
  cut: 'alert-sound-cut',
  restored: 'alert-sound-restored',
}
const VOLUME_KEY = 'alert-sound-volume'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage blocked — the preference just won't persist
  }
}

export function isAlertSoundEnabled(): boolean {
  return readStorage(STORAGE_KEY) !== 'false'
}

export function setAlertSoundEnabled(enabled: boolean) {
  writeStorage(STORAGE_KEY, String(enabled))
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
  /** Glide to this frequency over the note's duration (sirens, swoops). */
  endFreq?: number
  start: number
  duration: number
  type?: OscillatorType
  gain?: number
}

function playNotes(notes: Note[], volume: number) {
  const audio = getContext()
  if (!audio) return
  void audio.resume()
  const t0 = audio.currentTime + 0.02

  for (const { freq, endFreq, start, duration, type = 'sine', gain = 0.25 } of notes) {
    const osc = audio.createOscillator()
    const env = audio.createGain()
    const begin = t0 + start
    osc.type = type
    osc.frequency.setValueAtTime(freq, begin)
    if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, begin + duration)
    // Short attack and exponential release so notes don't click.
    env.gain.setValueAtTime(0.0001, begin)
    env.gain.exponentialRampToValueAtTime(gain * volume, begin + 0.015)
    env.gain.exponentialRampToValueAtTime(0.0001, begin + duration)
    osc.connect(env).connect(audio.destination)
    osc.start(begin)
    osc.stop(begin + duration + 0.05)
  }
}

function repeat(times: number, every: number, make: (start: number) => Note[]): Note[] {
  return Array.from({ length: times }, (_, i) => make(i * every)).flat()
}

export type SoundId =
  | 'alarm'
  | 'siren'
  | 'beeps'
  | 'klaxon'
  | 'descend'
  | 'chime'
  | 'dingdong'
  | 'bell'
  | 'fanfare'
  | 'bubble'
  | 'ping'
  | 'none'

export const SOUND_OPTIONS: { value: SoundId; label: string; notes: Note[] }[] = [
  {
    value: 'alarm',
    label: 'Alarm',
    // Urgent falling two-tone, three times.
    notes: repeat(3, 0.5, (s) => [
      { freq: 880, start: s, duration: 0.2, type: 'square', gain: 0.12 },
      { freq: 587, start: s + 0.22, duration: 0.24, type: 'square', gain: 0.12 },
    ]),
  },
  {
    value: 'siren',
    label: 'Siren',
    notes: repeat(3, 0.8, (s) => [
      { freq: 600, endFreq: 1200, start: s, duration: 0.4, type: 'sawtooth', gain: 0.1 },
      { freq: 1200, endFreq: 600, start: s + 0.4, duration: 0.4, type: 'sawtooth', gain: 0.1 },
    ]),
  },
  {
    value: 'beeps',
    label: 'Rapid beeps',
    notes: repeat(8, 0.15, (s) => [
      { freq: 2000, start: s, duration: 0.08, type: 'square', gain: 0.08 },
    ]),
  },
  {
    value: 'klaxon',
    label: 'Klaxon',
    notes: repeat(3, 0.6, (s) => [
      { freq: 220, start: s, duration: 0.45, type: 'sawtooth', gain: 0.16 },
      { freq: 277, start: s, duration: 0.45, type: 'sawtooth', gain: 0.1 },
    ]),
  },
  {
    value: 'descend',
    label: 'Descending',
    notes: [
      { freq: 1046.5, start: 0, duration: 0.25, type: 'triangle', gain: 0.3 },
      { freq: 783.99, start: 0.2, duration: 0.25, type: 'triangle', gain: 0.3 },
      { freq: 659.25, start: 0.4, duration: 0.25, type: 'triangle', gain: 0.3 },
      { freq: 523.25, start: 0.6, duration: 0.5, type: 'triangle', gain: 0.3 },
    ],
  },
  {
    value: 'chime',
    label: 'Chime',
    // Bright rising C–E–G–C.
    notes: [
      { freq: 523.25, start: 0, duration: 0.25 },
      { freq: 659.25, start: 0.12, duration: 0.25 },
      { freq: 783.99, start: 0.24, duration: 0.3 },
      { freq: 1046.5, start: 0.36, duration: 0.55 },
    ],
  },
  {
    value: 'dingdong',
    label: 'Ding-dong',
    notes: [
      { freq: 659.25, start: 0, duration: 0.6, gain: 0.3 },
      { freq: 523.25, start: 0.45, duration: 0.9, gain: 0.3 },
    ],
  },
  {
    value: 'bell',
    label: 'Bell',
    // Fundamental plus inharmonic partials, long decay.
    notes: [
      { freq: 880, start: 0, duration: 1.4, gain: 0.25 },
      { freq: 880 * 2.76, start: 0, duration: 0.8, gain: 0.08 },
      { freq: 880 * 5.4, start: 0, duration: 0.4, gain: 0.04 },
    ],
  },
  {
    value: 'fanfare',
    label: 'Fanfare',
    notes: [
      { freq: 523.25, start: 0, duration: 0.14, type: 'triangle', gain: 0.3 },
      { freq: 523.25, start: 0.16, duration: 0.14, type: 'triangle', gain: 0.3 },
      { freq: 523.25, start: 0.32, duration: 0.14, type: 'triangle', gain: 0.3 },
      { freq: 783.99, start: 0.48, duration: 0.7, type: 'triangle', gain: 0.3 },
    ],
  },
  {
    value: 'bubble',
    label: 'Bubble',
    notes: [
      { freq: 400, endFreq: 900, start: 0, duration: 0.12, gain: 0.3 },
      { freq: 500, endFreq: 1100, start: 0.15, duration: 0.12, gain: 0.3 },
      { freq: 600, endFreq: 1400, start: 0.3, duration: 0.15, gain: 0.3 },
    ],
  },
  {
    value: 'ping',
    label: 'Soft ping',
    notes: [{ freq: 1318.5, start: 0, duration: 0.6, gain: 0.2 }],
  },
  { value: 'none', label: 'Silent', notes: [] },
]

const DEFAULT_SOUNDS: Record<AlertKind, SoundId> = { cut: 'alarm', restored: 'chime' }

export function getAlertSoundChoice(kind: AlertKind): SoundId {
  const stored = readStorage(SOUND_KEYS[kind])
  return SOUND_OPTIONS.some((o) => o.value === stored) ? (stored as SoundId) : DEFAULT_SOUNDS[kind]
}

export function setAlertSoundChoice(kind: AlertKind, sound: SoundId) {
  writeStorage(SOUND_KEYS[kind], sound)
}

export type VolumeLevel = 'low' | 'medium' | 'high'

export const VOLUME_OPTIONS: { value: VolumeLevel; label: string; gain: number }[] = [
  { value: 'low', label: 'Low', gain: 0.4 },
  { value: 'medium', label: 'Medium', gain: 1 },
  { value: 'high', label: 'High', gain: 1.8 },
]

export function getAlertVolume(): VolumeLevel {
  const stored = readStorage(VOLUME_KEY)
  return VOLUME_OPTIONS.some((o) => o.value === stored) ? (stored as VolumeLevel) : 'medium'
}

export function setAlertVolume(level: VolumeLevel) {
  writeStorage(VOLUME_KEY, level)
}

/** Play a specific sound regardless of the on/off setting — used for previews. */
export function previewSound(sound: SoundId, volume: VolumeLevel = getAlertVolume()) {
  const notes = SOUND_OPTIONS.find((o) => o.value === sound)?.notes ?? []
  const gain = VOLUME_OPTIONS.find((o) => o.value === volume)?.gain ?? 1
  playNotes(notes, gain)
}

export function playAlertSound(kind: AlertKind, { force = false } = {}) {
  if (!force && !isAlertSoundEnabled()) return
  previewSound(getAlertSoundChoice(kind))
}
