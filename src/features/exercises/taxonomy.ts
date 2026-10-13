import type { EquipmentType, ExerciseLevel, ExerciseType, Muscle, MuscleGroup } from '@/types/exercise'

// Spanish labels for exercise metadata. These are closed vocabularies, so every
// value has a reviewed translation (unlike exercise names, see nameTranslations.ts).

export const muscleLabels: Record<Muscle, string> = {
  abdominals: 'Abdominales',
  abductors: 'Abductores',
  adductors: 'Aductores',
  biceps: 'Bíceps',
  calves: 'Pantorrillas',
  chest: 'Pecho',
  forearms: 'Antebrazos',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales',
  lats: 'Dorsales',
  lower_back: 'Zona lumbar',
  middle_back: 'Espalda media',
  neck: 'Cuello',
  quadriceps: 'Cuádriceps',
  shoulders: 'Hombros',
  traps: 'Trapecios',
  triceps: 'Tríceps',
}

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazos',
  quadriceps: 'Cuádriceps',
  hamstrings: 'Isquiotibiales',
  glutes: 'Glúteos',
  calves: 'Pantorrillas',
  abs: 'Abdominales',
}

/** Muscles that count as each filter group (primary muscle match). */
export const muscleGroupMembers: Record<MuscleGroup, Muscle[]> = {
  chest: ['chest'],
  back: ['lats', 'middle_back', 'lower_back', 'traps'],
  shoulders: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  abs: ['abdominals'],
}

export const equipmentLabels: Record<EquipmentType, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  ez_bar: 'Barra Z',
  kettlebell: 'Kettlebell',
  cable: 'Polea',
  machine: 'Máquina',
  bands: 'Bandas elásticas',
  bodyweight: 'Peso corporal',
  medicine_ball: 'Balón medicinal',
  exercise_ball: 'Fitball',
  foam_roll: 'Rodillo de espuma',
  other: 'Otro',
  none: 'Sin equipamiento',
}

export const exerciseTypeLabels: Record<ExerciseType, string> = {
  strength: 'Fuerza',
  stretching: 'Estiramiento',
  cardio: 'Cardio',
  plyometrics: 'Pliometría',
  powerlifting: 'Powerlifting',
  olympic_weightlifting: 'Halterofilia',
  strongman: 'Strongman',
}

export const levelLabels: Record<ExerciseLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Avanzado',
}

/** The filter group a detailed muscle belongs to (null for neck, adductors…). */
export function muscleGroupOf(muscle: Muscle): MuscleGroup | null {
  for (const [group, members] of Object.entries(muscleGroupMembers) as Array<[MuscleGroup, Muscle[]]>) {
    if (members.includes(muscle)) return group
  }
  return null
}
