import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** How the value is displayed, e.g. seconds → "1:30". */
  format?: (value: number) => string
  /** Spoken unit for the buttons, e.g. "segundos" → "Restar 15 segundos". */
  unitLabel?: string
  size?: 'md' | 'lg'
  className?: string
}

/**
 * − value + control with large touch targets, built for one-handed use at the gym.
 * The value is an <output> so screen readers announce changes.
 */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = String,
  unitLabel,
  size = 'md',
  className,
}: StepperProps) {
  const labelId = useId()
  const unit = unitLabel ? ` ${step} ${unitLabel}` : ''
  const button = cn(
    'flex shrink-0 items-center justify-center rounded-xl bg-surface-3 text-fg transition-colors hover:bg-control/40 active:bg-control/60 disabled:opacity-40',
    size === 'lg' ? 'size-12' : 'size-11',
  )

  return (
    <div role="group" aria-labelledby={labelId} className={cn('flex flex-col gap-1.5', className)}>
      <span id={labelId} className="text-sm font-medium text-muted">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={button}
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label={`Restar${unit || ' 1'}`}
        >
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className={cn(
            'min-w-14 flex-1 text-center font-display font-bold tabular-nums',
            size === 'lg' ? 'text-3xl' : 'text-2xl',
          )}
        >
          {format(value)}
        </output>
        <button
          type="button"
          className={button}
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label={`Sumar${unit || ' 1'}`}
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
