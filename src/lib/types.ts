export type MuscleGroup =
  | 'push'
  | 'legs'
  | 'core'
  | 'back'
  | 'cardio'
  | 'mobility'

export type Difficulty = 'debutant' | 'intermediaire' | 'avance' | 'expert'

/** Equipment policy: home calisthenics only. A plain, stable chair is the
 * only piece of equipment ever allowed — never dumbbells, bars, bands,
 * rings, benches, or any specialized gear. */
export type Equipment = 'none' | 'chair'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  difficulty: Difficulty
  equipment: Equipment
  description: string
  instructions: string[]
  progressionFrom?: string // id of the easier exercise this progresses from
  progressionTo?: string // id of the harder exercise this progresses to
  /** Only set when equipment === 'chair': the id of a no-equipment exercise
   * that works the same pattern, offered as a fallback. */
  noEquipmentAlternative?: string
  /** Only used when equipment === 'chair': overrides the generic chair
   * safety note with something specific to this exercise's tip-over risk. */
  chairSafetyNote?: string
  /** Involves a jump/impact landing — excluded when the user prefers
   * "sans sauts" / low-impact training. */
  highImpact?: boolean
}

export interface ProgramExerciseSlot {
  exerciseId: string
  sets: number
  reps: string // e.g. "8-12" or "AMRAP" or "30s"
  restSeconds: number
}

export interface ProgramDay {
  name: string // e.g. "Jour 1 — Haut du corps"
  slots: ProgramExerciseSlot[]
}

export interface Program {
  id: string
  name: string
  difficulty: Difficulty
  description: string
  days: ProgramDay[]
}

export interface SetLog {
  exerciseId: string
  setIndex: number
  reps: number
  weightKg?: number
  completed: boolean
}

/** How the session felt, asked right after finishing — feeds the (simple,
 * local, heuristic) progression engine for next time. */
export type Rpe = 'tres-facile' | 'facile' | 'correct' | 'difficile' | 'tres-difficile'

export interface WorkoutSession {
  id?: number
  programId?: string
  dayName: string
  startedAt: string // ISO date
  finishedAt?: string
  logs: SetLog[]
  notes?: string
  rpe?: Rpe
}

// ---- Onboarding / personal profile (stored locally, never leaves the device) ----

export type Goal =
  | 'remise-en-forme'
  | 'renforcement'
  | 'muscle'
  | 'endurance'
  | 'perte-de-poids'
  | 'raffermissement'
  | 'abdos'
  | 'jambes'
  | 'fessiers'
  | 'dos'
  | 'mobilite'

export type Preference = 'sans-sauts' | 'cardio' | 'force' | 'mobilite' | 'full-body'

/** 'any' = both no-equipment and chair exercises are fair game. */
export type EquipmentPreference = Equipment | 'any'

export interface UserProfile {
  goal: Goal
  level: Difficulty
  frequency: number // sessions per week, 2-6
  durationMinutes: number // preferred session length
  equipment: EquipmentPreference
  preferences: Preference[]
  /** Set once the back-safety questionnaire has been passed with no red
   * flags — required before goal === 'dos' can be selected/recommended. */
  backSafetyClearedAt?: string
}
