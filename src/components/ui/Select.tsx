import { useId, type ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectProps extends Omit<ComponentProps<'select'>, 'id'> {
  id?: string
  label: string
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean
  error?: string
  options: Array<{ value: string; label: string }>
  /** Adds a first empty option with this text. */
  placeholder?: string
}

/** Native select (keeps mobile pickers and keyboard behaviour) with the app styling. */
export function Select({ id, label, hideLabel, error, options, placeholder, className, ...rest }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = error ? `${selectId}-error` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={selectId} className={cn('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'block min-h-11 w-full appearance-none rounded-xl border bg-surface py-2 pr-10 pl-4 text-base text-fg transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none',
            error ? 'border-danger' : 'border-control',
          )}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
