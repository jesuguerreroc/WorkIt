import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { NumericField } from '@/components/ui/NumericField'
import { formatNumber } from '@/lib/numbers'
import type { WeightUnit } from '@/types/profile'
import { BAR_OPTIONS, PLATE_SETS, platesPerSide } from './plates'

const STORAGE_KEY = 'workit:plates'

function loadSettings(unit: WeightUnit): { bar: number; plates: number[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${unit}`) ?? 'null')
    if (saved && typeof saved.bar === 'number' && Array.isArray(saved.plates)) return saved
  } catch {
    // ignore
  }
  return { bar: BAR_OPTIONS[unit][0], plates: PLATE_SETS[unit] }
}

/** How many plates go on each side of the bar for a target weight. Bar and plates are remembered. */
export function PlateCalculatorDialog({
  open,
  onClose,
  unit,
  initialWeight,
}: {
  open: boolean
  onClose: () => void
  unit: WeightUnit
  initialWeight: number | null
}) {
  const [target, setTarget] = useState<number | null>(initialWeight)
  const [settings, setSettings] = useState(() => loadSettings(unit))
  const result = target !== null ? platesPerSide(target, settings.bar, settings.plates) : null

  const update = (next: typeof settings) => {
    setSettings(next)
    try {
      localStorage.setItem(`${STORAGE_KEY}:${unit}`, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const maxPlate = Math.max(...PLATE_SETS[unit])

  return (
    <Dialog open={open} onClose={onClose} title="Calculadora de discos" description="Qué discos poner en cada lado de la barra.">
      <div className="flex flex-col gap-5">
        <NumericField label={`Peso total (${unit})`} mode="decimal" suffix={unit} value={target} onChange={setTarget} className="max-w-48" inputClassName="text-2xl min-h-14" />

        <ChoiceGroup
          legend="Barra"
          name="plate-bar"
          type="radio"
          layout="chip"
          options={BAR_OPTIONS[unit].map((b) => ({ value: b, label: b === 0 ? 'Sin barra' : `${formatNumber(b)} ${unit}` }))}
          selected={[settings.bar]}
          onChange={([bar]) => bar !== undefined && update({ ...settings, bar })}
        />

        <ChoiceGroup
          legend="Discos disponibles"
          name="plate-sizes"
          type="checkbox"
          layout="chip"
          options={PLATE_SETS[unit].map((p) => ({ value: p, label: formatNumber(p) }))}
          selected={settings.plates}
          onChange={(plates) => update({ ...settings, plates })}
        />

        <section aria-live="polite" className="rounded-2xl bg-surface-2 p-4">
          {target === null ? (
            <p className="text-muted">Escribe el peso total que quieres levantar.</p>
          ) : !result ? (
            <p className="text-danger">El peso es menor que la barra ({formatNumber(settings.bar)} {unit}).</p>
          ) : (
            <>
              <p className="text-sm text-muted">En cada lado</p>
              <p className="font-display text-3xl font-bold">
                {result.perSide.length ? result.perSide.map(formatNumber).join(' + ') : 'Sin discos'}
                {result.perSide.length > 0 && <span className="ml-1 text-lg text-muted">{unit}</span>}
              </p>
              {/* Simple bar diagram: plate height follows its weight. Labels carry the values. */}
              {result.perSide.length > 0 && (
                <div className="mt-3 flex h-24 items-center" aria-hidden="true">
                  <span className="h-2 w-8 rounded-l bg-control" />
                  {result.perSide.map((plate, i) => (
                    <span
                      key={i}
                      className="mx-px flex w-5 items-center justify-center rounded-sm bg-primary text-[0.55rem] font-bold text-on-primary"
                      style={{ height: `${Math.max(30, (plate / maxPlate) * 100)}%` }}
                    >
                      <span className="-rotate-90 whitespace-nowrap">{formatNumber(plate)}</span>
                    </span>
                  ))}
                  <span className="h-2 flex-1 rounded-r bg-control" />
                </div>
              )}
              <p className="mt-2 text-sm">
                Total cargado: <strong>{formatNumber(result.achieved)} {unit}</strong>
              </p>
              {result.remainder > 0 && (
                <p className="mt-1 text-sm text-warning">
                  No se puede exacto con estos discos: faltan {formatNumber(result.remainder)} {unit}.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </Dialog>
  )
}
