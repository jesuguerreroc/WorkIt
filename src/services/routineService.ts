import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from '@/lib/firestore'
import type { Routine, RoutineExercise, RoutineInput, RoutineStatus } from '@/types/routine'
import { newId } from '@/features/routines/routineLogic'

/**
 * Routines at users/{uid}/routines. Top-level fields are validated by
 * validRoutine() in firestore.rules; item fields are validated by validateRoutine()
 * before every write (Security Rules cannot iterate over lists).
 */

function routinesRef(uid: string) {
  return collection(getDb(), 'users', uid, 'routines')
}

function toRoutine(snapshot: DocumentSnapshot): Routine {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return {
    id: snapshot.id,
    name: data.name ?? '',
    days: data.days ?? [],
    exercises: data.exercises ?? [],
    status: data.status ?? 'active',
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  }
}

function cleanExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  // Explicit field list: never persist UI-only properties.
  return exercises.map((e) => ({
    id: e.id,
    exercise: { source: e.exercise.source, id: e.exercise.id, name: e.exercise.name },
    sets: e.sets,
    repsMin: e.repsMin,
    repsMax: e.repsMax,
    weight: e.weight,
    restBetweenSets: e.restBetweenSets,
    restAfterExercise: e.restAfterExercise,
    notes: e.notes.trim(),
  }))
}

function payload(input: RoutineInput) {
  return {
    name: input.name.trim(),
    days: [...new Set(input.days)].sort((a, b) => a - b),
    exercises: cleanExercises(input.exercises),
  }
}

export function subscribeToRoutines(
  uid: string,
  onData: (routines: Routine[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(routinesRef(uid), orderBy('createdAt', 'asc')),
    (snapshot) => onData(snapshot.docs.map(toRoutine)),
    onError,
  )
}

export async function createRoutine(uid: string, input: RoutineInput): Promise<string> {
  const ref = await addDoc(routinesRef(uid), {
    ...payload(input),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
  })
  return ref.id
}

export async function updateRoutine(uid: string, id: string, input: RoutineInput): Promise<void> {
  await updateDoc(doc(routinesRef(uid), id), { ...payload(input), updatedAt: serverTimestamp() })
}

export async function appendExerciseToRoutine(uid: string, routine: Routine, item: RoutineExercise): Promise<void> {
  await updateRoutine(uid, routine.id, { name: routine.name, days: routine.days, exercises: [...routine.exercises, item] })
}

export async function setRoutineStatus(uid: string, id: string, status: RoutineStatus): Promise<void> {
  await updateDoc(doc(routinesRef(uid), id), { status, updatedAt: serverTimestamp() })
}

export async function duplicateRoutine(uid: string, routine: Routine): Promise<string> {
  const suffix = ' (copia)'
  return createRoutine(uid, {
    name: routine.name.slice(0, 60 - suffix.length) + suffix,
    days: routine.days,
    // New item ids so the copy is fully independent.
    exercises: routine.exercises.map((e) => ({ ...e, id: newId() })),
  })
}

export async function deleteRoutine(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(routinesRef(uid), id))
}
