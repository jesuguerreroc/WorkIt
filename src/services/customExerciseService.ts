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
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from '@/lib/firestore'
import {
  exerciseKey,
  type EquipmentType,
  type Exercise,
  type ExerciseType,
  type Muscle,
} from '@/types/exercise'

/**
 * Private exercises at users/{uid}/customExercises. Fields are mirrored by
 * validCustomExercise() in firestore.rules. No image: photo upload is out of scope.
 */

export const CUSTOM_EXERCISE_LIMITS = {
  nameMax: 80,
  instructionsMax: 2000,
  secondaryMax: 6,
  setsMax: 20,
  repsMax: 100,
} as const

export interface CustomExerciseInput {
  name: string
  primaryMuscle: Muscle
  secondaryMuscles: Muscle[]
  equipment: EquipmentType
  type: ExerciseType
  instructions: string
  suggestedSets: number | null
  suggestedRepsMin: number | null
  suggestedRepsMax: number | null
}

function customExercisesRef(uid: string) {
  return collection(getDb(), 'users', uid, 'customExercises')
}

function toPayload(input: CustomExerciseInput) {
  return {
    name: input.name.trim().slice(0, CUSTOM_EXERCISE_LIMITS.nameMax),
    primaryMuscle: input.primaryMuscle,
    secondaryMuscles: [...new Set(input.secondaryMuscles)]
      .filter((m) => m !== input.primaryMuscle)
      .slice(0, CUSTOM_EXERCISE_LIMITS.secondaryMax),
    equipment: input.equipment,
    type: input.type,
    instructions: input.instructions.trim().slice(0, CUSTOM_EXERCISE_LIMITS.instructionsMax),
    suggestedSets: input.suggestedSets,
    suggestedRepsMin: input.suggestedRepsMin,
    suggestedRepsMax: input.suggestedRepsMax,
  }
}

export function customExerciseFromDoc(id: string, data: DocumentData): Exercise {
  const ref = { source: 'custom' as const, id }
  const instructions = typeof data.instructions === 'string' ? data.instructions : ''
  return {
    ref,
    key: exerciseKey(ref),
    name: data.name ?? 'Ejercicio sin nombre',
    originalName: null,
    primaryMuscles: data.primaryMuscle ? [data.primaryMuscle] : [],
    secondaryMuscles: data.secondaryMuscles ?? [],
    equipment: data.equipment ?? 'other',
    type: data.type ?? 'strength',
    level: null,
    instructions: instructions
      .split(/\n+/)
      .map((line: string) => line.trim())
      .filter(Boolean),
    instructionsLanguage: 'es',
    images: [],
    suggestedSets: data.suggestedSets ?? null,
    suggestedRepsMin: data.suggestedRepsMin ?? null,
    suggestedRepsMax: data.suggestedRepsMax ?? null,
  }
}

export function subscribeToCustomExercises(
  uid: string,
  onData: (exercises: Exercise[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(customExercisesRef(uid), orderBy('name')),
    (snapshot) => onData(snapshot.docs.map((d) => customExerciseFromDoc(d.id, d.data()))),
    onError,
  )
}

export async function createCustomExercise(uid: string, input: CustomExerciseInput): Promise<string> {
  const ref = await addDoc(customExercisesRef(uid), {
    ...toPayload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
  })
  return ref.id
}

export async function updateCustomExercise(uid: string, id: string, input: CustomExerciseInput): Promise<void> {
  await updateDoc(doc(customExercisesRef(uid), id), { ...toPayload(input), updatedAt: serverTimestamp() })
}

export async function deleteCustomExercise(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(customExercisesRef(uid), id))
}
