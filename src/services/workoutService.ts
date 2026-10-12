import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from '@/lib/firestore'
import { localDateKey } from '@/lib/dates'
import { newId } from '@/features/routines/routineLogic'
import { previousPerformance, summarizeWorkout } from '@/features/workouts/workoutMath'
import { exerciseKey } from '@/types/exercise'
import type { WeightUnit } from '@/types/profile'
import type { Routine } from '@/types/routine'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/workout'

/** History window loaded for progress, streaks and "previous session" values. */
export const HISTORY_LIMIT = 500

function workoutsRef(uid: string) {
  return collection(getDb(), 'users', uid, 'workouts')
}

export function toWorkout(snapshot: DocumentSnapshot): Workout {
  const d = snapshot.data() ?? {}
  return {
    id: snapshot.id,
    routineId: d.routineId ?? null,
    routineName: d.routineName ?? '',
    status: d.status ?? 'active',
    source: d.source ?? 'live',
    startedAt: d.startedAt ?? 0,
    endedAt: d.endedAt ?? null,
    localDate: d.localDate ?? localDateKey(d.startedAt ?? 0),
    pausedAt: d.pausedAt ?? null,
    pausedMs: d.pausedMs ?? 0,
    exercises: d.exercises ?? [],
    notes: d.notes ?? '',
    weightUnit: d.weightUnit ?? 'kg',
    exerciseKeys: d.exerciseKeys ?? [],
    summary: d.summary ?? null,
    revision: d.revision ?? 0,
  }
}

/** Explicit field list mirrored by validWorkout() in firestore.rules. */
function payload(workout: Workout) {
  return {
    routineId: workout.routineId,
    routineName: workout.routineName.slice(0, 60),
    status: workout.status,
    source: workout.source,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    localDate: workout.localDate,
    pausedAt: workout.pausedAt,
    pausedMs: workout.pausedMs,
    exercises: workout.exercises.map((e) => ({
      id: e.id,
      exercise: { source: e.exercise.source, id: e.exercise.id, name: e.exercise.name },
      repsMin: e.repsMin,
      repsMax: e.repsMax,
      restBetweenSets: e.restBetweenSets,
      restAfterExercise: e.restAfterExercise,
      notes: e.notes,
      sets: e.sets.map((s) => ({
        id: s.id,
        weight: s.weight,
        reps: s.reps,
        done: s.done,
        warmup: s.warmup,
        completedAt: s.completedAt,
      })),
    })),
    notes: workout.notes,
    weightUnit: workout.weightUnit,
    exerciseKeys: [...new Set(workout.exercises.map((e) => exerciseKey(e.exercise)))],
    summary: workout.summary,
    revision: workout.revision,
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
  }
}

export function subscribeToWorkouts(
  uid: string,
  onData: (workouts: Workout[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(workoutsRef(uid), orderBy('startedAt', 'desc'), limit(HISTORY_LIMIT)),
    (snapshot) => onData(snapshot.docs.map(toWorkout)),
    onError,
  )
}

export function subscribeToWorkout(
  uid: string,
  id: string,
  onData: (workout: Workout | null, hasPendingWrites: boolean) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(workoutsRef(uid), id),
    { includeMetadataChanges: true },
    (snapshot) => onData(snapshot.exists() ? toWorkout(snapshot) : null, snapshot.metadata.hasPendingWrites),
    onError,
  )
}

export async function findActiveWorkout(uid: string): Promise<Workout | null> {
  const snapshot = await getDocs(query(workoutsRef(uid), where('status', '==', 'active'), limit(1)))
  return snapshot.empty ? null : toWorkout(snapshot.docs[0])
}

function emptySets(count: number, weight: number | null): WorkoutSet[] {
  return Array.from({ length: count }, () => ({
    id: newId(),
    weight,
    reps: null,
    done: false,
    warmup: false,
    completedAt: null,
  }))
}

/** Builds a session from a routine. Changes during the session never touch the routine. */
export function workoutFromRoutine(routine: Routine, history: Workout[], unit: WeightUnit, now: number): Workout {
  const exercises: WorkoutExercise[] = routine.exercises.map((item) => {
    // Pre-fill each set with last session's weight (same unit), else the routine's starting weight.
    const previous = previousPerformance(history, exerciseKey(item.exercise))
    const previousWeight = previous && previous.unit === unit ? (previous.sets.find((s) => !s.warmup)?.weight ?? null) : null
    return {
      id: newId(),
      exercise: item.exercise,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
      restBetweenSets: item.restBetweenSets,
      restAfterExercise: item.restAfterExercise,
      notes: '',
      sets: emptySets(item.sets, previousWeight ?? item.weight),
    }
  })
  return baseWorkout({ routineId: routine.id, routineName: routine.name, exercises, unit, now, source: 'live' })
}

export function baseWorkout(options: {
  routineId: string | null
  routineName: string
  exercises: WorkoutExercise[]
  unit: WeightUnit
  now: number
  source: Workout['source']
  /** For manual sessions: the day they belong to. */
  localDate?: string
}): Workout {
  const startedAt = options.localDate
    ? new Date(`${options.localDate}T12:00:00`).getTime()
    : options.now
  return {
    id: doc(collection(getDb(), '_')).id,
    routineId: options.routineId,
    routineName: options.routineName,
    status: 'active',
    source: options.source,
    startedAt,
    endedAt: null,
    localDate: options.localDate ?? localDateKey(options.now),
    pausedAt: null,
    pausedMs: 0,
    exercises: options.exercises,
    notes: '',
    weightUnit: options.unit,
    exerciseKeys: options.exercises.map((e) => exerciseKey(e.exercise)),
    summary: null,
    revision: 1,
  }
}

export async function createWorkout(uid: string, workout: Workout): Promise<void> {
  await setDoc(doc(workoutsRef(uid), workout.id), { ...payload(workout), createdAt: serverTimestamp() })
}

/** Full overwrite of the mutable fields; createdAt is preserved with merge. */
export async function saveWorkout(uid: string, workout: Workout): Promise<void> {
  await setDoc(doc(workoutsRef(uid), workout.id), payload(workout), { merge: true })
}

/** Finishes a session: computes the summary and marks it completed. */
export function completeWorkout(workout: Workout, history: Workout[], now: number): Workout {
  const ended: Workout = {
    ...workout,
    // A paused session ends when it was paused.
    endedAt: workout.source === 'manual' ? workout.startedAt : (workout.pausedAt ?? now),
    status: 'completed',
    revision: workout.revision + 1,
  }
  return { ...ended, summary: summarizeWorkout(ended, history, now) }
}

export async function deleteWorkout(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(workoutsRef(uid), id))
}
