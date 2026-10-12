import { useEffect, useRef } from 'react'
import { Check, Dumbbell, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { WorkoutExercise } from '@/types/workout'

interface ExerciseCarouselProps {
  exercises: WorkoutExercise[]
  current: number
  imageFor: (item: WorkoutExercise) => string | undefined
  onSelect: (index: number) => void
  onAdd: () => void
  canAdd: boolean
}

/** Round thumbnails of the session's exercises; the current one is highlighted. */
export function ExerciseCarousel({ exercises, current, imageFor, onSelect, onAdd, canAdd }: ExerciseCarouselProps) {
  const listRef = useRef<HTMLOListElement>(null)

  // Keep the current exercise in view when it changes (e.g. auto-advance).
  useEffect(() => {
    const el = listRef.current?.children[current] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [current])

  return (
    <nav aria-label="Ejercicios de la sesión">
      <ol ref={listRef} className="flex gap-3 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {exercises.map((item, index) => {
          const done = item.sets.length > 0 && item.sets.every((s) => s.done)
          const image = imageFor(item)
          const active = index === current
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${index + 1}. ${item.exercise.name}${done ? ', completado' : ''}`}
                className={cn(
                  'relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 bg-white transition-[border-color,opacity,scale] duration-200 sm:size-24',
                  active ? 'scale-100 border-primary' : 'scale-95 border-transparent opacity-60 hover:opacity-100',
                )}
              >
                {image ? (
                  <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-surface-2 text-subtle">
                    <Dumbbell className="size-7" aria-hidden="true" />
                  </span>
                )}
                {done && (
                  <span className="absolute inset-0 flex items-center justify-center bg-canvas/60">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {canAdd && (
          <li className="shrink-0">
            <button
              type="button"
              onClick={onAdd}
              aria-label="Añadir ejercicio"
              className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-muted hover:border-primary hover:text-primary sm:size-24"
            >
              <Plus className="size-7" aria-hidden="true" />
            </button>
          </li>
        )}
      </ol>
    </nav>
  )
}
