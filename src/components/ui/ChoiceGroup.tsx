import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ChoiceOption<V extends string | number> {
  value: V
  label: string
  /** Shown under the label in the "card" layout. */
  description?: string
  /** Full accessible name when `label` is abbreviated (e.g. "L" → "Lunes"). */
  ariaLabel?: string
}

interface ChoiceGroupProps<V extends string | number> {
  legend: string
  hint?: ReactNode
  name: string
  /** radio = one value, checkbox = any number of values. */
  type: 'radio' | 'checkbox'
  options: ChoiceOption<V>[]
  selected: V[]
  onChange: (selected: V[]) => void
  layout?: 'card' | 'chip' | 'day'
  className?: string
}

/**
 * Native radio/checkbox inputs styled as selectable cards or chips.
 * Keyboard behaviour (Tab, arrows for radios, Space) comes from the browser.
 */
export function ChoiceGroup<V extends string | number>({
  legend,
  hint,
  name,
  type,
  options,
  selected,
  onChange,
  layout = 'chip',
  className,
}: ChoiceGroupProps<V>) {
  const toggle = (value: V) => {
    if (type === 'radio') onChange([value])
    else onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-3', className)}>
      <legend className="text-sm font-semibold">{legend}</legend>
      {hint && <p className="-mt-1 text-sm text-muted">{hint}</p>}
      <div
        className={cn(
          layout === 'card' && 'grid gap-2 sm:grid-cols-2',
          layout === 'chip' && 'flex flex-wrap gap-2',
          layout === 'day' && 'grid grid-cols-7 gap-1.5 sm:max-w-md',
        )}
      >
        {options.map((option) => {
          const checked = selected.includes(option.value)
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex cursor-pointer items-center border transition-colors duration-150 select-none',
                'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-primary',
                !checked && 'border-border-strong bg-surface text-muted hover:border-control hover:text-fg',
                // Days use a solid fill; cards and chips a soft one. Never both.
                checked && layout === 'day' && 'border-primary bg-primary text-on-primary',
                checked && layout !== 'day' && 'border-primary bg-primary-soft text-fg',
                layout === 'card' && 'min-h-14 gap-3 rounded-2xl px-4 py-3',
                layout === 'chip' && 'min-h-11 gap-2 rounded-full px-4 text-sm font-medium',
                layout === 'day' && 'aspect-square min-h-11 justify-center rounded-xl text-sm font-semibold',
              )}
            >
              <input
                type={type}
                name={name}
                value={String(option.value)}
                checked={checked}
                onChange={() => toggle(option.value)}
                aria-label={option.ariaLabel}
                className="sr-only"
              />
              {layout === 'card' && (
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center border',
                    type === 'radio' ? 'rounded-full' : 'rounded-md',
                    checked ? 'border-primary bg-primary text-on-primary' : 'border-control',
                  )}
                  aria-hidden="true"
                >
                  {checked && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              )}
              {layout === 'chip' && checked && <Check className="size-4 text-primary" aria-hidden="true" />}
              <span className="flex flex-col">
                <span className={cn(layout === 'card' && 'font-semibold text-fg')}>{option.label}</span>
                {layout === 'card' && option.description && (
                  <span className="text-sm text-muted">{option.description}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
