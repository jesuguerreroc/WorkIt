import { useState } from 'react'
import { Link } from 'react-router'
import { Archive, ArchiveRestore, Copy, FolderOpen, MoreHorizontal, Pencil, Play, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/features/auth/authContext'
import { weekdayOptions } from '@/features/profile/profileOptions'
import { StartConflictDialog } from '@/features/workouts/StartConflictDialog'
import { useStartWorkout } from '@/features/workouts/useStartWorkout'
import { createRoutine, deleteRoutine, duplicateRoutine, setRoutineStatus } from '@/services/routineService'
import type { Routine } from '@/types/routine'
import { exampleRoutineExercises } from './routineLogic'
import { useRoutines } from './useRoutines'

export function RoutinesPage() {
  const { routines, status } = useRoutines()
  const starter = useStartWorkout()
  const [showArchived, setShowArchived] = useState(false)
  const active = routines.filter((r) => r.status === 'active')
  const archived = routines.filter((r) => r.status === 'archived')

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Rutinas</h1>
          <p className="mt-1 text-muted">Organiza tus sesiones y empieza a entrenar desde aquí.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink to="/app/programas" variant="secondary">
            <FolderOpen className="size-4" aria-hidden="true" />
            Programas
          </ButtonLink>
          <ButtonLink to="/app/rutinas/nueva">
            <Plus className="size-4" aria-hidden="true" />
            Nueva rutina
          </ButtonLink>
        </div>
      </header>

      {starter.active && (
        <Alert tone="success" title="Entrenamiento en curso">
          «{starter.active.routineName}» sigue abierto.{' '}
          <Link to={`/app/entrenar/${starter.active.id}`} className="font-semibold text-fg underline">
            Continuar
          </Link>
        </Alert>
      )}

      {status === 'loading' && <p className="text-muted">Cargando rutinas…</p>}
      {status === 'error' && <Alert tone="error">No se pudieron cargar tus rutinas. Revisa tu conexión.</Alert>}
      {status === 'ready' && active.length === 0 && <EmptyRoutines hasArchived={archived.length > 0} />}

      {active.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {active.map((routine) => (
            <li key={routine.id}>
              <RoutineCard routine={routine} onStart={() => starter.start(routine)} />
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="flex min-h-11 items-center gap-2 self-start font-semibold text-muted hover:text-fg"
          >
            <Archive className="size-5" aria-hidden="true" />
            {showArchived ? 'Ocultar' : 'Ver'} rutinas archivadas ({archived.length})
          </button>
          {showArchived && (
            <ul className="grid gap-4 md:grid-cols-2">
              {archived.map((routine) => (
                <li key={routine.id}>
                  <RoutineCard routine={routine} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <StartConflictDialog starter={starter} />
    </div>
  )
}

function EmptyRoutines({ hasArchived }: { hasArchived: boolean }) {
  const { user } = useAuth()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>()

  const createExample = async () => {
    if (!user) return
    setCreating(true)
    try {
      await createRoutine(user.uid, { name: 'Rutina A (ejemplo)', days: [1, 4], exercises: exampleRoutineExercises() })
    } catch {
      setError('No se pudo crear la rutina de ejemplo.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border-strong px-6 py-12 text-center">
      <p className="font-display text-3xl font-bold uppercase">{hasArchived ? 'Sin rutinas activas' : 'Crea tu primera rutina'}</p>
      <p className="max-w-md text-muted">
        Elige los ejercicios, las series, las repeticiones y los descansos. También puedes partir de una rutina de
        ejemplo de pecho, hombros y tríceps y adaptarla.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/app/rutinas/nueva">
          <Plus className="size-4" aria-hidden="true" />
          Crear rutina
        </ButtonLink>
        <ButtonLink to="/app/programas" variant="secondary">
          <FolderOpen className="size-4" aria-hidden="true" />
          Explorar programas
        </ButtonLink>
        <Button variant="ghost" onClick={createExample} loading={creating}>
          <Sparkles className="size-4" aria-hidden="true" />
          Usar rutina de ejemplo
        </Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  )
}

function dayLabels(routine: Routine): string {
  return weekdayOptions
    .filter((o) => routine.days.includes(o.value))
    .map((o) => o.ariaLabel?.slice(0, 3))
    .join(' · ')
}

function RoutineCard({ routine, onStart }: { routine: Routine; onStart?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0)
  const archived = routine.status === 'archived'

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight font-bold uppercase">
            <Link to={`/app/rutinas/${routine.id}`} className="hover:text-primary hover:underline">
              {routine.name}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-muted">
            {routine.exercises.length} {routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} · {totalSets} series
            {routine.days.length > 0 && <> · {dayLabels(routine)}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={`Más opciones de ${routine.name}`}
          className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </button>
      </header>

      <ol className="flex flex-col gap-1 text-sm">
        {routine.exercises.slice(0, 4).map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="truncate">{item.exercise.name}</span>
            <span className="shrink-0 text-muted tabular-nums">
              {item.sets} × {item.repsMin === item.repsMax ? item.repsMin : `${item.repsMin}–${item.repsMax}`}
            </span>
          </li>
        ))}
        {routine.exercises.length > 4 && <li className="text-muted">y {routine.exercises.length - 4} más</li>}
      </ol>

      <div className="mt-auto flex gap-2">
        {!archived && onStart && (
          <Button onClick={onStart} className="flex-1" disabled={routine.exercises.length === 0}>
            <Play className="size-4 fill-current" aria-hidden="true" />
            Empezar
          </Button>
        )}
        <ButtonLink to={`/app/rutinas/${routine.id}/editar`} variant="secondary" className={archived ? 'flex-1' : undefined}>
          <Pencil className="size-4" aria-hidden="true" />
          Editar
        </ButtonLink>
      </div>

      <RoutineMenu routine={routine} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </article>
  )
}

function RoutineMenu({ routine, open, onClose }: { routine: Routine; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const archived = routine.status === 'archived'

  const run = async (name: string, task: () => Promise<unknown>) => {
    if (!user) return
    setBusy(name)
    setError(undefined)
    try {
      await task()
      onClose()
      setConfirmDelete(false)
    } catch {
      setError('No se pudo completar la acción. Revisa tu conexión.')
    } finally {
      setBusy(null)
    }
  }

  const item = 'flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left font-semibold hover:bg-surface-2 disabled:opacity-50'

  return (
    <>
      <Dialog open={open && !confirmDelete} onClose={onClose} title={routine.name} description="Opciones de la rutina">
        <div className="flex flex-col gap-1">
          <button type="button" className={item} disabled={busy !== null} onClick={() => run('duplicate', () => duplicateRoutine(user!.uid, routine))}>
            <Copy className="size-5 text-muted" aria-hidden="true" />
            {busy === 'duplicate' ? 'Duplicando…' : 'Duplicar'}
          </button>
          <button
            type="button"
            className={item}
            disabled={busy !== null}
            onClick={() => run('archive', () => setRoutineStatus(user!.uid, routine.id, archived ? 'active' : 'archived'))}
          >
            {archived ? <ArchiveRestore className="size-5 text-muted" aria-hidden="true" /> : <Archive className="size-5 text-muted" aria-hidden="true" />}
            {archived ? 'Activar de nuevo' : 'Archivar'}
          </button>
          <button type="button" className={`${item} text-danger`} disabled={busy !== null} onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-5" aria-hidden="true" />
            Eliminar
          </button>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar rutina"
        description={`Se eliminará «${routine.name}». Tu historial de entrenamientos no se borra.`}
        confirmLabel="Eliminar"
        tone="danger"
        busy={busy === 'delete'}
        onConfirm={() => run('delete', () => deleteRoutine(user!.uid, routine.id))}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
