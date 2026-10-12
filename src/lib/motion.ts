import type { CSSProperties } from 'react'

/** Inline style for a `.reveal` child inside a container that owns `data-visible`. */
export function staggerDelay(index: number, step = 90): CSSProperties {
  return { '--delay': `${index * step}ms` } as CSSProperties
}
