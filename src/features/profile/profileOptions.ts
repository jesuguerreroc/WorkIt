import type { ChoiceOption } from '@/components/ui/ChoiceGroup'
import {
  WEEKDAYS,
  type Equipment,
  type ExperienceLevel,
  type TrainingGoal,
  type Weekday,
  type WeightUnit,
} from '@/types/profile'

// Spanish labels for profile values. Stored values stay language-neutral codes.

export const goalOptions: ChoiceOption<TrainingGoal>[] = [
  { value: 'muscle', label: 'Ganar masa muscular' },
  { value: 'strength', label: 'Ganar fuerza' },
  { value: 'fat_loss', label: 'Perder grasa' },
  { value: 'maintenance', label: 'Mantener mi forma física' },
]

export const levelOptions: ChoiceOption<ExperienceLevel>[] = [
  { value: 'beginner', label: 'Principiante', description: 'Empiezo o vuelvo tras un parón' },
  { value: 'intermediate', label: 'Intermedio', description: 'Entreno con regularidad' },
  { value: 'advanced', label: 'Avanzado', description: 'Domino la técnica y planifico cargas' },
]

const weekdayNames: Record<Weekday, [short: string, long: string]> = {
  1: ['L', 'Lunes'],
  2: ['M', 'Martes'],
  3: ['X', 'Miércoles'],
  4: ['J', 'Jueves'],
  5: ['V', 'Viernes'],
  6: ['S', 'Sábado'],
  7: ['D', 'Domingo'],
}

export const weekdayOptions: ChoiceOption<Weekday>[] = WEEKDAYS.map((day) => ({
  value: day,
  label: weekdayNames[day][0],
  ariaLabel: weekdayNames[day][1],
}))

export function weekdayName(day: Weekday): string {
  return weekdayNames[day][1]
}

export const equipmentOptions: ChoiceOption<Equipment>[] = [
  { value: 'full_gym', label: 'Gimnasio completo' },
  { value: 'dumbbells', label: 'Mancuernas' },
  { value: 'barbell', label: 'Barra y discos' },
  { value: 'machines', label: 'Máquinas' },
  { value: 'cables', label: 'Poleas' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'bands', label: 'Bandas elásticas' },
  { value: 'bodyweight', label: 'Peso corporal' },
]

export const unitOptions: ChoiceOption<WeightUnit>[] = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'lb', label: 'Libras (lb)' },
]

export function labelFor<V extends string | number>(options: ChoiceOption<V>[], value: V | null): string | null {
  return options.find((option) => option.value === value)?.label ?? null
}

/** Monday-based ISO weekday (1–7) for a date in the user's local time zone. */
export function isoWeekday(date: Date): Weekday {
  return (((date.getDay() + 6) % 7) + 1) as Weekday
}
