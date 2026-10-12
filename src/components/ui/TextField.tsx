import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id?: string
  label: string
  hint?: ReactNode
  error?: string
}

const inputClasses =
  'block w-full min-h-12 rounded-xl border bg-surface px-4 text-base text-fg placeholder:text-subtle ' +
  'transition-colors duration-150 focus:outline-none focus-visible:outline-none ' +
  'focus:border-primary focus:ring-2 focus:ring-primary/30'

/**
 * Labelled input with hint and inline error, wired through aria-describedby.
 * Password inputs get a show/hide toggle; paste and password managers stay allowed.
 */
export function TextField({ id, label, hint, error, className, ...rest }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-fg">
        {label}
      </label>
      <FieldInput
        id={inputId}
        invalid={Boolean(error)}
        describedBy={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

interface FieldInputProps extends ComponentProps<'input'> {
  invalid: boolean
  describedBy?: string
}

function FieldInput({ invalid, describedBy, type, ...rest }: FieldInputProps) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  const input = (
    <input
      type={isPassword && revealed ? 'text' : type}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(inputClasses, invalid ? 'border-danger' : 'border-control', isPassword && 'pr-13')}
      {...rest}
    />
  )

  if (!isPassword) return input

  return (
    <div className="relative">
      {input}
      <button
        type="button"
        onClick={() => setRevealed((value) => !value)}
        aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={revealed}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-fg"
      >
        {revealed ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
