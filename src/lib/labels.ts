import type { Difficulty, MuscleGroup, Rpe } from './types'

/**
 * Single source of truth for display labels.
 *
 * Previously duplicated across Programs.tsx, Exercises.tsx, ExerciseDetail.tsx,
 * stats.ts, and generateWorkout.ts with slightly different wording
 * (e.g. "core" rendered as "Gainage" in some files and "Abdos & Core"
 * in others). Consolidating here guarantees consistency.
 *
 * Note: Home.tsx and generateWorkout.ts use the long-form labels
 * ("Pectoraux & Bras", "Jambes & Fessiers", etc.) for generated
 * workout names — those are intentionally different from the short
 * chip labels used in lists.
 */

/** Short labels — for chips, badges, filter dropdowns. */
export const groupLabel: Record<MuscleGroup, string> = {
  push: 'Push',
  legs: 'Jambes',
  core: 'Gainage',
  back: 'Dos',
  cardio: 'Cardio',
  mobility: 'Mobilité',
}

/** Long labels — for generated workout names and stat group breakdowns. */
export const groupLabelLong: Record<MuscleGroup, string> = {
  push: 'Pectoraux & Bras',
  legs: 'Jambes & Fessiers',
  core: 'Abdos & Core',
  back: 'Dos & Posture',
  cardio: 'Cardio',
  mobility: 'Mobilité',
}

export const difficultyLabel: Record<Difficulty, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
}

export const rpeLabel: Record<Rpe, string> = {
  'tres-facile': 'Très facile',
  facile: 'Facile',
  correct: 'Parfaite',
  difficile: 'Difficile',
  'tres-difficile': 'Trop difficile',
}
