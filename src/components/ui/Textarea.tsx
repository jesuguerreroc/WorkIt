import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  id?: string
  label: string
  hint?: ReactNode
  error?: string
}

export function Textarea({ id, label, hint, error, className, ...rest }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'block min-h-28 w-full rounded-xl border bg-surface px-4 py-3 text-base text-fg placeholder:text-subtle',
          'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none',
          error ? 'border-danger' : 'border-control',
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
