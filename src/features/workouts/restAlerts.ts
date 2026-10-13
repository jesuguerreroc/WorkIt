/**
 * End-of-rest alerts: a synthesized boxing-ring bell (no audio files, so no
 * licensing questions), 3-2-1 countdown ticks and vibration. Preferences are
 * per device (localStorage): sound and vibration depend on the phone in hand.
 */

export interface RestAlertSettings {
  sound: boolean
  countdown: boolean
  vibration: boolean
  /** iPhone only: plays through the silent switch, but may pause other music. */
  ignoreSilent: boolean
}

export const defaultRestAlertSettings: RestAlertSettings = { sound: true, countdown: true, vibration: true, ignoreSilent: false }

const KEY = 'workit:rest-alerts'

export function loadRestAlertSettings(): RestAlertSettings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaultRestAlertSettings, ...(JSON.parse(raw) as Partial<RestAlertSettings>) } : defaultRestAlertSettings
  } catch {
    return defaultRestAlertSettings
  }
}

export function saveRestAlertSettings(settings: RestAlertSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Private mode or full storage: the defaults keep working.
  }
}

/** Safari 16.4+ Audio Session API; absent elsewhere. */
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

let audio: AudioContext | null = null
let output: AudioNode | null = null

/** Must run during a tap: browsers only allow audio after a user gesture. */
export function unlockAudio() {
  try {
    const session = (navigator as AudioSessionNavigator).audioSession
    if (session) session.type = loadRestAlertSettings().ignoreSilent ? 'playback' : 'auto'
    if (!audio) {
      audio = new AudioContext()
      // Compressor + high master gain: loud enough for a gym without clipping.
      const compressor = audio.createDynamicsCompressor()
      compressor.threshold.value = -18
      compressor.ratio.value = 6
      const master = audio.createGain()
      master.gain.value = 1
      compressor.connect(master).connect(audio.destination)
      output = compressor
    }
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
    output = null
  }
}

/** Inharmonic partials of a struck bell: [frequency ratio, level, decay seconds]. */
const BELL_PARTIALS: [number, number, number][] = [
  [1, 1, 2.4],
  [2.32, 0.55, 1.6],
  [4.25, 0.35, 1.0],
  [6.63, 0.2, 0.6],
  [9.38, 0.12, 0.35],
]
const BELL_HZ = 740

function strike(ctx: AudioContext, out: AudioNode, at: number) {
  for (const [ratio, level, decay] of BELL_PARTIALS) {
    // Two slightly detuned oscillators per partial give the bell its shimmer.
    for (const detune of [-4, 4]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = BELL_HZ * ratio
      osc.detune.value = detune
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.32 * level, at + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
      osc.connect(gain).connect(out)
      osc.start(at)
      osc.stop(at + decay + 0.05)
    }
  }
  // Short metallic "clang" of the hammer hitting the bell.
  const noise = ctx.createBufferSource()
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.03), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  noise.buffer = buffer
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 3200
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.5
  noise.connect(band).connect(noiseGain).connect(out)
  noise.start(at)
}

/** "Ding-ding-ding": three quick strikes, like the end of a boxing round. */
export function ringBell() {
  if (!audio || !output) return
  const start = audio.currentTime + 0.02
  for (const offset of [0, 0.32, 0.64]) strike(audio, output, start + offset)
}

/** Short tick for the last 3 seconds; the final one is higher. */
export function tick(last = false) {
  if (!audio || !output) return
  const at = audio.currentTime + 0.01
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'triangle'
  osc.frequency.value = last ? 1320 : 990
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.5, at + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)
  osc.connect(gain).connect(output)
  osc.start(at)
  osc.stop(at + 0.12)
}

export function vibrateRestEnd() {
  navigator.vibrate?.([300, 120, 300, 120, 500])
}
