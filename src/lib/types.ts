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

// ─── Lot 0.6: ExerciseTarget — typed prescription model ──────────

/**
 * Replaces the loose `reps: string` with a discriminated union.
 * Backward-compatible: `reps` string is still accepted and parsed
 * via parseTarget() / targetToString().
 */
export type MetricType = 'reps' | 'duration' | 'amrap'

export interface ExerciseTarget {
  metricType: MetricType
  /** For 'reps': minimum reps in the range (e.g. 8 for "8-12") */
  targetMin?: number
  /** For 'reps': maximum reps in the range (e.g. 12 for "8-12") */
  targetMax?: number
  /** For 'duration': target seconds (e.g. 30 for "30s") */
  targetSeconds?: number
  /** If true, target is per-side (e.g. "8-12 / bras") */
  perSide?: boolean
  /** Tempo suggestion (e.g. "3-1-2-0" for 3s eccentric, 1s pause, 2s concentric) */
  tempo?: string
  /** Reps in Reserve target (how many more reps you feel you could do) */
  rirTarget?: number
}

/** Parse a legacy reps string into a typed ExerciseTarget. */
export function parseTarget(reps: string): ExerciseTarget {
  const trimmed = reps.trim()

  // AMRAP
  if (trimmed.toUpperCase() === 'AMRAP' || trimmed.toUpperCase() === 'MAX') {
    return { metricType: 'amrap' }
  }

  // Time-based: "20-30s", "45s", "30 s"
  const timeMatch = trimmed.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*s/i)
  if (timeMatch) {
    return {
      metricType: 'duration',
      targetSeconds: timeMatch[2]
        ? Math.round((Number(timeMatch[1]) + Number(timeMatch[2])) / 2)
        : Number(timeMatch[1]),
    }
  }

  // Reps with range: "8-12", "8 - 12", "3-6 / bras"
  const rangeMatch = trimmed.match(/(\d+)\s*[-–]\s*(\d+)(?:\s*\/\s*(\w+))?/)
  if (rangeMatch) {
    return {
      metricType: 'reps',
      targetMin: Number(rangeMatch[1]),
      targetMax: Number(rangeMatch[2]),
      perSide: !!rangeMatch[3],
    }
  }

  // Single rep count: "10"
  const singleMatch = trimmed.match(/^(\d+)$/)
  if (singleMatch) {
    return {
      metricType: 'reps',
      targetMin: Number(singleMatch[1]),
      targetMax: Number(singleMatch[1]),
    }
  }

  // Fallback: treat as AMRAP
  return { metricType: 'amrap' }
}

/** Serialize an ExerciseTarget back to a display string. */
export function targetToString(target: ExerciseTarget): string {
  switch (target.metricType) {
    case 'reps':
      if (target.targetMin === target.targetMax) {
        return `${target.targetMin}${target.perSide ? ' / côté' : ''}`
      }
      return `${target.targetMin}-${target.targetMax}${target.perSide ? ' / côté' : ''}`
    case 'duration':
      return `${target.targetSeconds}s`
    case 'amrap':
      return 'AMRAP'
    default:
      return ''
  }
}

// ─── Program types (backward-compatible with reps: string) ────────

export interface ProgramExerciseSlot {
  exerciseId: string
  sets: number
  /** Legacy string format: "8-12", "30s", "AMRAP". Use parseTarget() for typed access. */
  reps: string
  restSeconds: number
  /** Lot 0.6: typed target (optional, derived from reps if not set) */
  target?: ExerciseTarget
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
