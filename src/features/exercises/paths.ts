import type { Exercise, ExerciseRef } from '@/types/exercise'

export function exerciseDetailPath(exercise: Exercise | ExerciseRef): string {
  const ref = 'ref' in exercise ? exercise.ref : exercise
  return `/app/ejercicios/${ref.source}/${encodeURIComponent(ref.id)}`
}
