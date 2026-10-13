import type { Weekday } from '@/types/profile'

/**
 * Ready-made programs. Each workout becomes one of the user's routines when the
 * program is added (they can then edit everything). Exercise ids refer to the
 * bundled catalogue; a unit test checks they all exist.
 * General-purpose templates — not personalised or medical advice.
 */

export interface ProgramExercise {
  id: string
  name: string
  sets: number
  repsMin: number
  repsMax: number
  /** Rest between sets, seconds. */
  rest: number
}

export interface ProgramWorkout {
  name: string
  days: Weekday[]
  exercises: ProgramExercise[]
}

export type ProgramCategory = 'gym' | 'basic'

export interface Program {
  id: string
  name: string
  /** Prefix for the routines it creates, e.g. "PPL". */
  short: string
  category: ProgramCategory
  level: 'Principiante' | 'Intermedio'
  focus: string
  description: string
  workouts: ProgramWorkout[]
}

export const programCategoryLabels: Record<ProgramCategory, string> = {
  gym: 'En el gimnasio',
  basic: 'Equipo básico',
}

const e = (id: string, name: string, sets: number, repsMin: number, repsMax: number, rest = 90): ProgramExercise => ({
  id,
  name,
  sets,
  repsMin,
  repsMax,
  rest,
})

// Shared exercises
const bench = (s: number, a: number, b: number) => e('Barbell_Bench_Press_-_Medium_Grip', 'Press de banca con barra', s, a, b, 150)
const squat = (s: number, a: number, b: number) => e('Barbell_Squat', 'Sentadilla con barra', s, a, b, 150)
const row = (s: number, a: number, b: number) => e('Bent_Over_Barbell_Row', 'Remo inclinado con barra', s, a, b, 120)
const pulldown = (s: number, a: number, b: number) => e('Wide-Grip_Lat_Pulldown', 'Jalón al pecho con agarre abierto', s, a, b, 90)
const rdl = (s: number, a: number, b: number) => e('Romanian_Deadlift', 'Peso muerto rumano', s, a, b, 120)
const lateral = (s: number) => e('Side_Lateral_Raise', 'Elevaciones laterales', s, 12, 15, 60)
const pushdown = (s: number) => e('Triceps_Pushdown_-_Rope_Attachment', 'Extensión de tríceps en polea con cuerda', s, 10, 15, 60)
const curl = (s: number) => e('Barbell_Curl', 'Curl con barra', s, 8, 12, 60)
const hammer = (s: number) => e('Hammer_Curls', 'Curl martillo', s, 10, 12, 60)
const calves = (s: number) => e('Standing_Calf_Raises', 'Elevación de talones de pie', s, 12, 15, 60)

export const PROGRAMS: Program[] = [
  {
    id: 'ppl',
    name: 'Push Pull Legs',
    short: 'PPL',
    category: 'gym',
    level: 'Intermedio',
    focus: 'Hipertrofia',
    description:
      'Empuje (pecho, hombro, tríceps), tirón (espalda, bíceps) y pierna. Pensado para 6 días, repitiendo cada sesión dos veces por semana; también funciona con 3 días.',
    workouts: [
      {
        name: 'Empuje',
        days: [1, 4],
        exercises: [
          bench(4, 6, 10),
          e('Incline_Dumbbell_Press', 'Press inclinado con mancuernas', 3, 8, 12, 120),
          e('Dumbbell_Shoulder_Press', 'Press de hombros con mancuernas', 3, 8, 12, 90),
          lateral(3),
          pushdown(3),
        ],
      },
      {
        name: 'Tirón',
        days: [2, 5],
        exercises: [pulldown(4, 8, 12), row(4, 6, 10), e('Seated_Cable_Rows', 'Remo sentado en polea', 3, 10, 12, 90), e('Face_Pull', 'Face pull en polea', 3, 12, 15, 60), curl(3), hammer(3)],
      },
      {
        name: 'Pierna',
        days: [3, 6],
        exercises: [
          squat(4, 6, 10),
          rdl(3, 8, 10),
          e('Leg_Press', 'Prensa de piernas', 3, 10, 12, 120),
          e('Lying_Leg_Curls', 'Curl femoral tumbado', 3, 10, 12, 60),
          e('Leg_Extensions', 'Extensión de cuádriceps en máquina', 3, 12, 15, 60),
          calves(4),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Torso / Pierna de fuerza',
    short: 'Torso/Pierna',
    category: 'gym',
    level: 'Intermedio',
    focus: 'Fuerza e hipertrofia',
    description: 'Cuatro días: dos de torso y dos de pierna, alternando un día más pesado (menos repeticiones) y otro de más volumen.',
    workouts: [
      {
        name: 'Torso A (fuerza)',
        days: [1],
        exercises: [bench(4, 5, 8), row(4, 5, 8), e('Standing_Military_Press', 'Press militar de pie', 3, 6, 8, 120), pulldown(3, 8, 10), curl(2), e('EZ-Bar_Skullcrusher', 'Press francés con barra Z', 2, 10, 12, 60)],
      },
      {
        name: 'Pierna A (fuerza)',
        days: [2],
        exercises: [squat(4, 5, 8), rdl(3, 6, 8), e('Leg_Press', 'Prensa de piernas', 3, 10, 10, 120), calves(4), e('Hanging_Leg_Raise', 'Elevación de piernas colgado', 3, 10, 15, 60)],
      },
      {
        name: 'Torso B (volumen)',
        days: [4],
        exercises: [
          e('Incline_Dumbbell_Press', 'Press inclinado con mancuernas', 4, 8, 12, 90),
          e('One-Arm_Dumbbell_Row', 'Remo a una mano con mancuerna', 4, 8, 12, 90),
          e('Dumbbell_Shoulder_Press', 'Press de hombros con mancuernas', 3, 10, 12, 90),
          e('Seated_Cable_Rows', 'Remo sentado en polea', 3, 10, 12, 90),
          lateral(3),
          hammer(2),
          e('Triceps_Pushdown', 'Extensión de tríceps en polea', 2, 10, 15, 60),
        ],
      },
      {
        name: 'Pierna B (volumen)',
        days: [5],
        exercises: [
          e('Barbell_Deadlift', 'Peso muerto con barra', 3, 4, 6, 180),
          e('Hack_Squat', 'Sentadilla hack', 3, 8, 10, 120),
          e('Barbell_Hip_Thrust', 'Hip thrust con barra', 3, 8, 12, 90),
          e('Seated_Leg_Curl', 'Curl femoral sentado', 3, 10, 12, 60),
          e('Seated_Calf_Raise', 'Elevación de talones sentado', 4, 12, 15, 60),
          e('Cable_Crunch', 'Crunch en polea', 3, 12, 15, 60),
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body en el gimnasio',
    short: 'Full Body',
    category: 'gym',
    level: 'Principiante',
    focus: 'Base de fuerza',
    description: 'Tres días no consecutivos trabajando todo el cuerpo. Ideal para empezar o si tienes poco tiempo.',
    workouts: [
      { name: 'A', days: [1], exercises: [squat(3, 6, 10), bench(3, 6, 10), row(3, 8, 10), lateral(2), e('Cable_Crunch', 'Crunch en polea', 2, 12, 15, 60)] },
      {
        name: 'B',
        days: [3],
        exercises: [rdl(3, 8, 10), e('Standing_Military_Press', 'Press militar de pie', 3, 6, 10, 120), pulldown(3, 8, 12), e('Dumbbell_Lunges', 'Zancadas con mancuernas', 2, 10, 12, 90), curl(2)],
      },
      {
        name: 'C',
        days: [5],
        exercises: [
          e('Leg_Press', 'Prensa de piernas', 3, 10, 12, 120),
          e('Incline_Dumbbell_Press', 'Press inclinado con mancuernas', 3, 8, 12, 90),
          e('Seated_Cable_Rows', 'Remo sentado en polea', 3, 10, 12, 90),
          e('Lying_Leg_Curls', 'Curl femoral tumbado', 2, 10, 12, 60),
          e('Triceps_Pushdown', 'Extensión de tríceps en polea', 2, 10, 15, 60),
        ],
      },
    ],
  },
  {
    id: 'dumbbells',
    name: 'Mancuernas y banco',
    short: 'Mancuernas',
    category: 'basic',
    level: 'Principiante',
    focus: 'Hipertrofia con poco material',
    description: 'Tres días con mancuernas, un banco y una barra de dominadas. Para casa o gimnasios pequeños.',
    workouts: [
      {
        name: 'A',
        days: [1],
        exercises: [
          e('Goblet_Squat', 'Sentadilla goblet', 3, 10, 12, 90),
          e('Dumbbell_Bench_Press', 'Press de banca con mancuernas', 3, 8, 12, 90),
          e('One-Arm_Dumbbell_Row', 'Remo a una mano con mancuerna', 3, 10, 12, 90),
          e('Dumbbell_Shoulder_Press', 'Press de hombros con mancuernas', 3, 10, 12, 90),
          e('Dumbbell_Bicep_Curl', 'Curl de bíceps con mancuernas', 2, 10, 12, 60),
        ],
      },
      {
        name: 'B',
        days: [3],
        exercises: [
          e('Stiff-Legged_Dumbbell_Deadlift', 'Peso muerto con piernas rígidas (mancuernas)', 3, 10, 12, 90),
          e('Pushups', 'Flexiones', 3, 8, 15, 90),
          e('Bent_Over_Two-Dumbbell_Row', 'Remo inclinado con mancuernas', 3, 10, 12, 90),
          e('Dumbbell_Lunges', 'Zancadas con mancuernas', 3, 10, 12, 90),
          lateral(3),
        ],
      },
      {
        name: 'C',
        days: [5],
        exercises: [
          e('Dumbbell_Squat', 'Sentadilla con mancuernas', 3, 10, 12, 90),
          e('Incline_Dumbbell_Press', 'Press inclinado con mancuernas', 3, 10, 12, 90),
          e('Pullups', 'Dominadas', 3, 5, 10, 120),
          e('Arnold_Dumbbell_Press', 'Press Arnold', 3, 10, 12, 90),
          hammer(2),
          e('Bench_Dips', 'Fondos en banco', 2, 10, 15, 60),
        ],
      },
    ],
  },
]
