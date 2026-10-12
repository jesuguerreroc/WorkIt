import { Link } from 'react-router'
import type { Exercise } from '@/types/exercise'
import { ExerciseImage } from './ExerciseImage'
import { exerciseDetailPath } from './paths'
import { equipmentLabels, muscleLabels } from './taxonomy'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const muscles = exercise.primaryMuscles.map((m) => muscleLabels[m]).join(', ')

  return (
    <Link
      to={exerciseDetailPath(exercise)}
      className="group flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3 transition-[border-color,background-color,translate] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-2"
    >
      <ExerciseImage images={exercise.images} alt={`Demostración de ${exercise.name}`} />
      <div className="flex min-w-0 flex-col gap-1 px-1 pb-1">
        <h3 className="leading-snug font-semibold">{exercise.name}</h3>
        {muscles && <p className="text-sm text-primary">{muscles}</p>}
        <p className="text-sm text-muted">{equipmentLabels[exercise.equipment]}</p>
      </div>
    </Link>
  )
}
