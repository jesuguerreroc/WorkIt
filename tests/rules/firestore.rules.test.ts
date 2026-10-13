import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'

// Runs against the Firestore emulator (see `npm run test:rules`). The "demo-" project id
// guarantees no real Firebase resources are touched.
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-workit',
    firestore: { rules: readFileSync(process.env.RULES_FILE ?? 'firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

const alice = () => env.authenticatedContext('alice').firestore()
const bob = () => env.authenticatedContext('bob').firestore()
const anon = () => env.unauthenticatedContext().firestore()

function newProfile(overrides: Record<string, unknown> = {}) {
  return {
    displayName: 'Alice',
    goal: null,
    level: null,
    trainingDays: [],
    equipment: [],
    weightUnit: 'kg',
    onboardingStatus: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
    ...overrides,
  }
}

/** Seeds alice's profile bypassing the rules, as if created earlier. */
async function seedAlice() {
  await env.withSecurityRulesDisabled(async (context) => {
    const past = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'))
    await setDoc(doc(context.firestore(), 'users/alice'), newProfile({ createdAt: past, updatedAt: past }))
  })
}

describe('users/{uid} — access', () => {
  it('denies everything to signed-out visitors', async () => {
    await seedAlice()
    await assertFails(getDoc(doc(anon(), 'users/alice')))
    await assertFails(setDoc(doc(anon(), 'users/mallory'), newProfile()))
  })

  it('lets a user read their own profile but not someone else’s', async () => {
    await seedAlice()
    await assertSucceeds(getDoc(doc(alice(), 'users/alice')))
    await assertFails(getDoc(doc(bob(), 'users/alice')))
  })

  it('blocks creating, updating or deleting another user’s profile', async () => {
    await assertFails(setDoc(doc(bob(), 'users/alice'), newProfile()))
    await seedAlice()
    await assertFails(updateDoc(doc(bob(), 'users/alice'), { displayName: 'Hacked', updatedAt: serverTimestamp() }))
    await assertFails(deleteDoc(doc(bob(), 'users/alice')))
  })

  it('lets a user delete their own profile', async () => {
    await seedAlice()
    await assertSucceeds(deleteDoc(doc(alice(), 'users/alice')))
  })
})

describe('users/{uid} — create validation', () => {
  it('accepts a valid new profile', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), newProfile()))
  })

  it('accepts a fully filled profile', async () => {
    await assertSucceeds(
      setDoc(
        doc(alice(), 'users/alice'),
        newProfile({
          goal: 'strength',
          level: 'intermediate',
          trainingDays: [1, 3, 5],
          equipment: ['barbell', 'dumbbells'],
          weightUnit: 'lb',
          onboardingStatus: 'completed',
        }),
      ),
    )
  })

  it('requires server timestamps', async () => {
    const forged = Timestamp.fromDate(new Date('2020-01-01T00:00:00Z'))
    await assertFails(setDoc(doc(alice(), 'users/alice'), newProfile({ createdAt: forged })))
    await assertFails(setDoc(doc(alice(), 'users/alice'), newProfile({ updatedAt: forged })))
  })

  it('rejects unknown and missing fields', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), newProfile({ isAdmin: true })))
    const { goal: _omitted, ...withoutGoal } = newProfile()
    await assertFails(setDoc(doc(alice(), 'users/alice'), withoutGoal))
  })

  it.each([
    ['displayName too long', { displayName: 'x'.repeat(41) }],
    ['displayName not a string', { displayName: 42 }],
    ['unknown goal', { goal: 'bulk' }],
    ['unknown level', { level: 'pro' }],
    ['weekday out of range', { trainingDays: [0, 8] }],
    ['duplicated weekday', { trainingDays: [1, 1] }],
    ['trainingDays not a list', { trainingDays: 'lunes' }],
    ['unknown equipment', { equipment: ['smith_machine'] }],
    ['unknown weight unit', { weightUnit: 'stone' }],
    ['unknown onboarding status', { onboardingStatus: 'done' }],
    ['wrong schema version', { schemaVersion: 2 }],
  ])('rejects %s', async (_label, override) => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), newProfile(override)))
  })
})

describe('users/{uid} — update validation', () => {
  it('accepts a valid partial update', async () => {
    await seedAlice()
    await assertSucceeds(
      updateDoc(doc(alice(), 'users/alice'), {
        goal: 'muscle',
        trainingDays: [2, 4],
        onboardingStatus: 'completed',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('accepts the optional streak settings and validates them', async () => {
    await seedAlice()
    await assertSucceeds(updateDoc(doc(alice(), 'users/alice'), { streakMode: 'flexible', streakAllowedMisses: 1, updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { streakMode: 'lazy', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { streakAllowedMisses: 9, updatedAt: serverTimestamp() }))
  })

  it('rejects changing createdAt', async () => {
    await seedAlice()
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  })

  it('rejects updates without a fresh server updatedAt', async () => {
    await seedAlice()
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { goal: 'muscle' }))
  })

  it('rejects invalid values on update', async () => {
    await seedAlice()
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { level: 'god', updatedAt: serverTimestamp() }))
  })
})

describe('collections not yet released', () => {
  it('isolates and validates routines, workouts and custom exercises', async () => {
    const ts = { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), schemaVersion: 1 }
    const routine = { name: 'Rutina A', days: [1, 3], exercises: [], status: 'active', ...ts }
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/routines/r1'), routine))
    await assertFails(setDoc(doc(bob(), 'users/alice/routines/r2'), routine))
    await assertFails(getDoc(doc(bob(), 'users/alice/routines/r1')))
    await assertFails(setDoc(doc(alice(), 'users/alice/routines/r3'), { ...routine, status: 'deleted' }))
    const workout = {
      routineId: 'r1', routineName: 'Rutina A', status: 'active', source: 'live', startedAt: 1, endedAt: null,
      localDate: '2026-10-12', pausedAt: null, pausedMs: 0, exercises: [], notes: '', weightUnit: 'kg',
      exerciseKeys: [], summary: null, revision: 1, ...ts,
    }
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/workouts/w1'), workout))
    await assertFails(setDoc(doc(alice(), 'users/alice/workouts/w2'), { ...workout, localDate: '12/10/2026' }))
    await assertFails(getDoc(doc(bob(), 'users/alice/workouts/w1')))
    const custom = {
      name: 'Mi press', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], equipment: 'dumbbell', type: 'strength',
      instructions: '', suggestedSets: 3, suggestedRepsMin: 8, suggestedRepsMax: 12, ...ts,
    }
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/customExercises/c1'), custom))
    await assertFails(setDoc(doc(alice(), 'users/alice/customExercises/c2'), { ...custom, imageUrl: 'x' }))
    await assertFails(setDoc(doc(alice(), 'users/alice/achievements/a1'), { a: 1 }))
  })

  it('lets signed-in users read the global catalogue but never write it', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'exercises/bench-press')))
    await assertFails(getDoc(doc(anon(), 'exercises/bench-press')))
    await assertFails(setDoc(doc(alice(), 'exercises/bench-press'), { name: 'Press de banca' }))
  })

  it('denies unknown top-level collections', async () => {
    await assertFails(setDoc(doc(alice(), 'anything/x'), { a: 1 }))
  })
})
