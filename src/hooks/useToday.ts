import { useState } from 'react'
import { localDateKey } from '@/lib/dates'

/** Today's local date key, fixed for the lifetime of the component (a reload picks up a new day). */
export function useToday(): string {
  const [today] = useState(() => localDateKey(new Date()))
  return today
}
