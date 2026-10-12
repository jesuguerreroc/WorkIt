/**
 * Parses user-typed numbers, accepting "62,5" and "62.5".
 * Returns null for empty input and undefined when the text is not a valid number.
 */
export function parseNumber(text: string, mode: 'integer' | 'decimal'): number | null | undefined {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '') return null
  const pattern = mode === 'integer' ? /^\d+$/ : /^\d+(\.\d{0,2})?$/
  if (!pattern.test(normalized)) return undefined
  return Number(normalized)
}

/** Spanish display: 62.5 → "62,5". */
export function formatNumber(value: number | null): string {
  return value === null ? '' : String(value).replace('.', ',')
}
