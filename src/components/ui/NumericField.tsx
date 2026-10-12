import { useId, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatNumber as display, parseNumber } from '@/lib/numbers'

interface NumericFieldProps {
  label: string
  hideLabel?: boolean
  value: number | null
  onChange: (value: number | null) => void
  mode?: 'integer' | 'decimal'
  /** Unit shown inside the field, e.g. "kg". */
  suffix?: string
  placeholder?: string
  invalid?: boolean
  className?: string
  inputClassName?: string
  id?: string
}


/**
 * Number input that accepts "62,5" or "62.5", opens the numeric keypad on mobile
 * and keeps the raw text while typing (so "62," is not rejected mid-edit).
 * Emits null for empty, and nothing while the text is not a valid number.
 */
export function NumericField({
  label,
  hideLabel,
  value,
  onChange,
  mode = 'integer',
  suffix,
  placeholder,
  invalid,
  className,
  inputClassName,
  id,
}: NumericFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [text, setText] = useState(display(value))
  const [syncedValue, setSyncedValue] = useState(value)

  // Follow external changes (e.g. "copy previous weight") unless the text already means the same.
  // Adjusting state during render is React's recommended alternative to an effect here.
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (parseNumber(text, mode) !== value) setText(display(value))
  }

  const parsed = parseNumber(text, mode)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn('text-sm font-medium text-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode={mode === 'integer' ? 'numeric' : 'decimal'}
          autoComplete="off"
          enterKeyHint="next"
          placeholder={placeholder}
          value={text}
          aria-invalid={invalid || parsed === undefined || undefined}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            setText(event.target.value)
            const next = parseNumber(event.target.value, mode)
            if (next !== undefined) onChange(next)
          }}
          onBlur={() => parsed !== undefined && setText(display(parsed))}
          className={cn(
            'block min-h-11 w-full rounded-xl border bg-surface px-3 text-center text-base font-semibold text-fg tabular-nums placeholder:font-normal placeholder:text-subtle',
            'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none',
            invalid || parsed === undefined ? 'border-danger' : 'border-control',
            suffix && 'pr-9',
            inputClassName,
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">{suffix}</span>
        )}
      </div>
    </div>
  )
}
