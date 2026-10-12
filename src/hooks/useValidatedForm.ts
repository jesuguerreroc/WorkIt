import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'

type Validator<K extends string> = (values: Record<K, string>) => Partial<Record<K, string>>

/**
 * Minimal form state for small auth-style forms:
 * - errors appear on blur, then update live for touched fields;
 * - a failed submit reveals every error and focuses the summary (or the only invalid field);
 * - `submitting` guards against double submits.
 */
export function useValidatedForm<K extends string>(
  initialValues: Record<K, string>,
  validate: Validator<K>,
  fieldOrder: readonly K[],
) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const allErrors = validate(values)
  const visibleErrors: Partial<Record<K, string>> = {}
  for (const key of fieldOrder) {
    if ((submitAttempted || touched[key]) && allErrors[key]) visibleErrors[key] = allErrors[key]
  }

  /** Props to spread on a TextField. */
  const field = (name: K) => ({
    id: name,
    name,
    value: values[name],
    error: visibleErrors[name],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
    onBlur: () => setTouched((current) => ({ ...current, [name]: true })),
  })

  const handleSubmit = (onValid: (values: Record<K, string>) => Promise<void> | void) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (submitting) return
      setSubmitAttempted(true)

      const invalid = fieldOrder.filter((key) => allErrors[key])
      if (invalid.length > 0) {
        // Wait for the summary/inline errors to render before moving focus.
        requestAnimationFrame(() => {
          if (invalid.length > 1) summaryRef.current?.focus()
          else document.getElementById(invalid[0])?.focus()
        })
        return
      }

      setSubmitting(true)
      try {
        await onValid(values)
      } finally {
        setSubmitting(false)
      }
    }

  const summaryErrors = submitAttempted
    ? fieldOrder.flatMap((key) => (allErrors[key] ? [{ fieldId: key, message: allErrors[key] }] : []))
    : []

  return { values, field, handleSubmit, submitting, summaryRef, summaryErrors }
}
