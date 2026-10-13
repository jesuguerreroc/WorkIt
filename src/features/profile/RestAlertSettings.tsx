import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import {
  loadRestAlertSettings,
  ringBell,
  saveRestAlertSettings,
  unlockAudio,
  vibrateRestEnd,
  type RestAlertSettings as Settings,
} from '@/features/workouts/restAlerts'

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
const hasAudioSession = typeof navigator !== 'undefined' && 'audioSession' in navigator

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className={cn('flex min-h-11 items-center justify-between gap-4 py-2', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-surface-3 transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-on-primary"
      />
    </label>
  )
}

/** Device-level alerts for the end of a rest (stored on this phone, not in the account). */
export function RestAlertSettings() {
  const [settings, setSettings] = useState<Settings>(loadRestAlertSettings)

  const set = (patch: Partial<Settings>) =>
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveRestAlertSettings(next)
      return next
    })

  const test = () => {
    unlockAudio()
    ringBell()
    if (settings.vibration) vibrateRestEnd()
  }

  return (
    <section aria-labelledby="rest-alerts-title" className="rounded-3xl border border-border glass p-4 sm:p-5">
      <h2 id="rest-alerts-title" className="text-lg leading-snug font-semibold">
        Aviso de fin de descanso
      </h2>
      <p className="mt-1 text-sm text-muted">Se guarda en este dispositivo. Sube el volumen del teléfono para oírlo bien.</p>
      <div className="mt-3 flex flex-col divide-y divide-border">
        <Toggle label="Campana de ring" hint="Suena «ding-ding-ding» al terminar el descanso." checked={settings.sound} onChange={(sound) => set({ sound })} />
        <Toggle
          label="Cuenta atrás 3-2-1"
          hint="Pitidos cortos en los últimos 3 segundos."
          checked={settings.countdown}
          disabled={!settings.sound}
          onChange={(countdown) => set({ countdown })}
        />
        <Toggle
          label="Vibración"
          hint={canVibrate ? undefined : 'Este dispositivo no permite vibrar desde la web (iPhone).'}
          checked={settings.vibration && canVibrate}
          disabled={!canVibrate}
          onChange={(vibration) => set({ vibration })}
        />
        {hasAudioSession && (
          <Toggle
            label="Sonar aunque esté en silencio"
            hint="iPhone: ignora el modo silencio, pero puede pausar la música que estés escuchando."
            checked={settings.ignoreSilent}
            disabled={!settings.sound}
            onChange={(ignoreSilent) => set({ ignoreSilent })}
          />
        )}
      </div>
      <Button variant="secondary" className="mt-4" onClick={test} disabled={!settings.sound && !settings.vibration}>
        <BellRing className="size-4" aria-hidden="true" />
        Probar aviso
      </Button>
    </section>
  )
}
