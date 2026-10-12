import type { Ref } from 'react'
import { CircleAlert } from 'lucide-react'

interface FormErrorSummaryProps {
  /** Field id → message, in visual order. */
  errors: Array<{ fieldId: string; message: string }>
  ref?: Ref<HTMLDivElement>
}

/**
 * Focusable summary shown after a failed submit with several errors.
 * Each item links to its field; inline errors stay visible next to the inputs.
 */
export function FormErrorSummary({ errors, ref }: FormErrorSummaryProps) {
  if (errors.length < 2) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="form-error-summary-title"
      className="rounded-xl border border-danger/40 bg-danger-soft p-4 text-sm focus-visible:outline-danger"
    >
      <p id="form-error-summary-title" className="flex items-center gap-2 font-semibold text-fg">
        <CircleAlert className="size-5 text-danger" aria-hidden="true" />
        Revisa {errors.length} campos antes de continuar
      </p>
      <ul className="mt-2 flex flex-col gap-1 pl-7">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(error.fieldId)?.focus()
              }}
              className="text-danger underline underline-offset-2 hover:text-fg"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
