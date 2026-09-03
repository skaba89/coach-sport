/**
 * Coach Engine V2 — Deterministic, testable, explainable coaching engine.
 *
 * Architecture:
 *   UserProfile + History → CoachEngine → TrainingPlan → WorkoutPrescription
 *
 * The engine is:
 * - Deterministic: same inputs → same output (no random except exercise selection)
 * - Explainable: each decision has a documented reason
 * - Testable: pure functions, no side effects
 * - Independent of any LLM (the LLM layer comes later and only feeds constraints)
 */

import type {
  Difficulty, Exercise, Goal, MuscleGroup, Preference,
  ProgramDay, ProgramExerciseSlot, Rpe, WorkoutSession,
  EquipmentPreference,
} from './types'
import { exercises, getExerciseById } from '../data/exercises'
import { estimateDayMinutes } from './duration'
import { groupLabelLong } from './labels'

// ─── Enriched User Profile (Coach V2) ──────────────────────────────

export interface CoachProfile {
  goal: Goal
  secondaryGoal?: Goal
  level: Difficulty
  frequency: number           // sessions per week (2-6)
  availableDays: number[]     // 0=Sunday, 1=Monday, ..., 6=Saturday
  durationMinutes: number
  equipment: EquipmentPreference
  preferences: Preference[]
  /** Declared limitations (e.g. bad knee, tight shoulders) */
  limitations?: string[]
  /** Exercise IDs the user dislikes — avoided when possible */
  dislikedExercises?: string[]
  /** Exercise IDs the user enjoys — favored when possible */
  enjoyedExercises?: string[]
  avoidExerciseIds?: string[]
  backSafetyClearedAt?: string
}

// ─── Training Plan (weekly structure) ──────────────────────────────

export interface WorkoutPrescription {
  dayName: string
  focus: MuscleGroup | 'full-body' | 'mobility' | 'recovery'
  slots: ProgramExerciseSlot[]
  estimatedMinutes: number
  /** Why this session was prescribed — for the coach UI */
  rationale: string
}

export interface TrainingDay {
  dayOfWeek: number            // 0=Sunday
  prescription?: WorkoutPrescription  // undefined = rest day
  isRest: boolean
}

export interface TrainingWeek {
  weekNumber: number
  days: TrainingDay[]
  totalVolume: number          // estimated total sets
  focusGroups: string[]
}

export interface TrainingPlan {
  weeks: TrainingWeek[]
  goal: Goal
  startDate: string            // ISO date
}

// ─── Recovery Score per Muscle Group ───────────────────────────────

export interface MuscleRecovery {
  lastWorked: string | null
  hoursSinceLastWorkout: number
  recoveryPercent: number
}

export type RecoveryState = Record<MuscleGroup, MuscleRecovery>

// ─── Progressive Overload ──────────────────────────────────────────

export interface ProgressionDecision {
  action: 'increase-reps' | 'increase-sets' | 'advance-exercise' | 'maintain' | 'decrease' | 'deload'
  reason: string
  newTarget?: string           // new reps string (e.g. "10-12" → "12-15")
  newSets?: number
}

// ─── Goal-based configuration ──────────────────────────────────────

interface GoalConfig {
  /** Sets per exercise */
  setsRange: [number, number]
  /** Rest between sets (seconds) */
  restSeconds: number
  /** Default reps for strength exercises */
  repsPattern: string
  /** Whether to include cardio circuits */
  includeCardio: boolean
  /** Focus groups priority order */
  groupPriority: MuscleGroup[]
  /** Tempo emphasis */
  tempo?: string
}

const GOAL_CONFIGS: Record<Goal, GoalConfig> = {
  'remise-en-forme': {
    setsRange: [2, 3],
    restSeconds: 60,
    repsPattern: '10-15',
    includeCardio: true,
    groupPriority: ['legs', 'push', 'core', 'cardio', 'mobility'],
  },
  'renforcement': {
    setsRange: [3, 4],
    restSeconds: 45,
    repsPattern: '8-12',
    includeCardio: true,
    groupPriority: ['push', 'legs', 'core', 'back', 'cardio'],
  },
  'muscle': {
    setsRange: [3, 5],
    restSeconds: 60,
    repsPattern: '8-12',
    includeCardio: false,
    groupPriority: ['push', 'legs', 'core', 'back'],
    tempo: '3-1-2-0',
  },
  'endurance': {
    setsRange: [3, 4],
    restSeconds: 30,
    repsPattern: '15-20',
    includeCardio: true,
    groupPriority: ['cardio', 'legs', 'core', 'push'],
  },
  'perte-de-poids': {
    setsRange: [3, 4],
    restSeconds: 30,
    repsPattern: '12-15',
    includeCardio: true,
    groupPriority: ['legs', 'cardio', 'push', 'core'],
  },
  'raffermissement': {
    setsRange: [3, 4],
    restSeconds: 40,
    repsPattern: '12-15',
    includeCardio: true,
    groupPriority: ['legs', 'core', 'push', 'back'],
  },
  'abdos': {
    setsRange: [3, 4],
    restSeconds: 30,
    repsPattern: '15-20',
    includeCardio: true,
    groupPriority: ['core', 'cardio', 'legs'],
  },
  'jambes': {
    setsRange: [3, 5],
    restSeconds: 60,
    repsPattern: '10-15',
    includeCardio: false,
    groupPriority: ['legs', 'core', 'cardio'],
  },
  'fessiers': {
    setsRange: [3, 4],
    restSeconds: 45,
    repsPattern: '12-15',
    includeCardio: false,
    groupPriority: ['legs', 'core'],
  },
  'dos': {
    setsRange: [3, 4],
    restSeconds: 45,
    repsPattern: '10-15',
    includeCardio: false,
    groupPriority: ['back', 'core', 'mobility'],
  },
  'mobilite': {
    setsRange: [2, 3],
    restSeconds: 20,
    repsPattern: '30-45s',
    includeCardio: false,
    groupPriority: ['mobility', 'core', 'back'],
  },
}

// ─── Recovery Engine ───────────────────────────────────────────────

const RECOVERY_HOURS_FULL = 48  // 48h for full recovery of a muscle group

export function computeRecovery(sessions: WorkoutSession[], now: Date = new Date()): RecoveryState {
  const result = {} as RecoveryState
  const groups: MuscleGroup[] = ['push', 'legs', 'core', 'back', 'cardio', 'mobility']

  for (const group of groups) {
    // Find the most recent session that worked this group
    const recentSession = sessions
      .filter((s) => s.finishedAt)
      .filter((s) => {
        // Check if any exercise in this session targets this group
        return s.logs.some((log) => {
          const ex = getExerciseById(log.exerciseId)
          return ex?.muscleGroup === group
        })
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]

    if (!recentSession) {
      result[group] = {
        lastWorked: null,
        hoursSinceLastWorkout: Infinity,
        recoveryPercent: 100,
      }
    } else {
      const lastDate = new Date(recentSession.startedAt)
      const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
      const recoveryPercent = Math.min(100, Math.round((hoursSince / RECOVERY_HOURS_FULL) * 100))
      result[group] = {
        lastWorked: recentSession.startedAt,
        hoursSinceLastWorkout: Math.round(hoursSince),
        recoveryPercent,
      }
    }
  }

  return result
}

// ─── RPE-based Progression ─────────────────────────────────────────

export function decideProgression(
  recentRpes: Rpe[],
  currentReps: string,
  currentSets: number,
): ProgressionDecision {
  if (recentRpes.length === 0) {
    return { action: 'maintain', reason: 'Pas assez d\'historique pour ajuster.' }
  }

  const lastRpe = recentRpes[0]
  const avgRpe = recentRpes.slice(0, 3)

  // Count "easy" and "hard" sessions
  const easyCount = avgRpe.filter((r) => r === 'tres-facile' || r === 'facile').length
  const hardCount = avgRpe.filter((r) => r === 'difficile' || r === 'tres-difficile').length

  // Very difficult → decrease
  if (lastRpe === 'tres-difficile') {
    return {
      action: 'decrease',
      reason: 'Dernière séance très difficile — on réduit le volume.',
      newSets: Math.max(2, currentSets - 1),
    }
  }

  // Multiple easy sessions → increase
  if (easyCount >= 2 && lastRpe !== 'difficile') {
    // Try to increase reps range
    const match = currentReps.match(/^(\d+)-(\d+)$/)
    if (match) {
      const low = Number(match[1])
      const high = Number(match[2])
      const newHigh = Math.min(high + 2, 20)
      const newLow = Math.min(low + 1, newHigh - 2)
      return {
        action: 'increase-reps',
        reason: 'Les dernières séances étaient faciles — on augmente les reps.',
        newTarget: `${newLow}-${newHigh}`,
      }
    }
    // Can't parse reps → increase sets
    return {
      action: 'increase-sets',
      reason: 'Les dernières séances étaient faciles — on ajoute une série.',
      newSets: Math.min(currentSets + 1, 5),
    }
  }

  // Multiple hard sessions → deload
  if (hardCount >= 2) {
    return {
      action: 'deload',
      reason: 'Fatigue accumulée détectée — semaine de deload recommandée.',
    }
  }

  // Stable
  return {
    action: 'maintain',
    reason: 'Charge actuelle appropriée — on maintient.',
  }
}

// ─── Weekly Plan Generator ─────────────────────────────────────────

export function generateWeeklyPlan(profile: CoachProfile, recovery: RecoveryState): TrainingWeek {
  const config = GOAL_CONFIGS[profile.goal]
  const days: TrainingDay[] = []

  // Map available days (default to [1,3,5] = Mon/Wed/Fri if not specified)
  const availableDays = profile.availableDays.length > 0
    ? profile.availableDays
    : [1, 3, 5].slice(0, profile.frequency)

  // Distribute sessions across available days
  const sessionDays = distributeSessions(availableDays, profile.frequency)

  // Assign focus to each session day, rotating through priority groups
  // while respecting recovery
  const focusAssignments = assignFocusToDays(
    sessionDays,
    config.groupPriority,
    recovery,
    profile.goal,
  )

  for (let day = 0; day < 7; day++) {
    const sessionIndex = sessionDays.indexOf(day)
    if (sessionIndex === -1) {
      days.push({ dayOfWeek: day, isRest: true })
    } else {
      const focus = focusAssignments[sessionIndex]
      const prescription = generatePrescription(
        focus,
        profile,
        config,
        recovery,
      )
      days.push({
        dayOfWeek: day,
        isRest: false,
        prescription,
      })
    }
  }

  const totalVolume = days.reduce(
    (sum, d) => sum + (d.prescription?.slots.reduce((s, slot) => s + slot.sets, 0) ?? 0),
    0,
  )

  const focusGroups = [...new Set(
    days
      .filter((d) => d.prescription)
      .map((d) => d.prescription!.focus),
  )]

  return {
    weekNumber: 1,
    days,
    totalVolume,
    focusGroups: focusGroups.map(String),
  }
}

function distributeSessions(availableDays: number[], frequency: number): number[] {
  if (availableDays.length === 0) return []
  // Evenly distribute sessions across available days
  const sorted = [...availableDays].sort((a, b) => a - b)
  if (frequency >= sorted.length) return sorted

  // Pick evenly spaced days
  const step = sorted.length / frequency
  const selected: number[] = []
  for (let i = 0; i < frequency; i++) {
    const idx = Math.round(i * step)
    selected.push(sorted[idx])
  }
  return selected
}

function assignFocusToDays(
  sessionDays: number[],
  priority: MuscleGroup[],
  recovery: RecoveryState,
  goal: Goal,
): (MuscleGroup | 'full-body' | 'mobility' | 'recovery')[] {
  const assignments: (MuscleGroup | 'full-body' | 'mobility' | 'recovery')[] = []

  for (let i = 0; i < sessionDays.length; i++) {
    if (i === 0) {
      // First session of the week: full-body or primary focus
      if (goal === 'mobilite') {
        assignments.push('mobility')
      } else if (goal === 'dos') {
        assignments.push('back')
      } else {
        assignments.push('full-body')
      }
    } else if (i === sessionDays.length - 1 && sessionDays.length >= 3) {
      // Last session: mobility or recovery if frequency is high
      if (goal === 'mobilite') {
        assignments.push('mobility')
      } else {
        assignments.push('core')
      }
    } else {
      // Middle sessions: pick the most recovered priority group
      const mostRecovered = priority
        .filter((g) => g !== 'mobility')
        .sort((a, b) => recovery[b].recoveryPercent - recovery[a].recoveryPercent)[0]
      assignments.push(mostRecovered || 'full-body')
    }
  }

  return assignments
}

// ─── Prescription Generator (single session) ───────────────────────

function generatePrescription(
  focus: MuscleGroup | 'full-body' | 'mobility' | 'recovery',
  profile: CoachProfile,
  config: GoalConfig,
  recovery: RecoveryState,
): WorkoutPrescription {
  const pool = exercises.filter(
    (e) => passesEquipment(e, profile.equipment) && passesPreferences(e, profile.preferences),
  )

  // Determine which groups to include
  let groups: MuscleGroup[]
  let rationale: string

  if (focus === 'full-body') {
    groups = config.groupPriority.filter((g) =>
      g !== 'cardio' || config.includeCardio,
    )
    rationale = 'Séance full-body équilibrée selon votre objectif.'
  } else if (focus === 'mobility') {
    groups = ['mobility', 'back']
    rationale = 'Séance mobilité pour améliorer votre souplesse et récupération.'
  } else if (focus === 'recovery') {
    groups = ['mobility']
    rationale = 'Séance de récupération active — intensité réduite.'
  } else {
    groups = [focus]
    rationale = `Séance ciblée ${groupLabelLong[focus]} selon votre objectif.`
  }

  // Filter out groups that are not recovered enough (< 50%)
  const recoveredGroups = groups.filter((g) => {
    const r = recovery[g]
    return !r || r.recoveryPercent >= 50
  })
  if (recoveredGroups.length < groups.length) {
    const skipped = groups.filter((g) => !recoveredGroups.includes(g))
    rationale += ` Attention: ${skipped.join(', ')} encore en récupération (${skipped.map((g) => recovery[g].recoveryPercent + '%').join(', ')}).`
  }

  const activeGroups = recoveredGroups.length > 0 ? recoveredGroups : groups

  // Build slots
  const slots: ProgramExerciseSlot[] = []
  const used = new Set<string>()

  // Warmup for sessions >= 15 min
  if (profile.durationMinutes >= 15 && focus !== 'mobility') {
    slots.push({ exerciseId: 'cat-cow-stretch', sets: 1, reps: '45s', restSeconds: 15 })
    slots.push({ exerciseId: 'high-knees', sets: 1, reps: '30s', restSeconds: 15 })
  }

  // Main exercises
  for (const group of activeGroups) {
    const candidates = pool.filter(
      (e) => e.muscleGroup === group &&
      !used.has(e.id) &&
      !(profile.dislikedExercises ?? []).includes(e.id) &&
      !(profile.avoidExerciseIds ?? []).includes(e.id),
    )
    if (candidates.length === 0) continue

    // Prefer exercises at the user's level, then enjoyed exercises
    const atLevel = candidates.filter((e) => e.difficulty === profile.level)
    const enjoyed = (atLevel.length > 0 ? atLevel : candidates).filter(
      (e) => (profile.enjoyedExercises ?? []).includes(e.id),
    )
    const pick = enjoyed.length > 0 ? enjoyed[0] : (atLevel.length > 0 ? atLevel : candidates)[0]

    used.add(pick.id)
    const sets = Math.max(config.setsRange[0], Math.min(config.setsRange[1], 3))
    const reps = config.repsPattern
    slots.push({
      exerciseId: pick.id,
      sets,
      reps,
      restSeconds: config.restSeconds,
    })
  }

  // Cooldown
  if (profile.durationMinutes >= 15 && focus !== 'mobility') {
    slots.push({ exerciseId: 'childs-pose', sets: 1, reps: '30s', restSeconds: 10 })
    slots.push({ exerciseId: 'hip-flexor-stretch', sets: 1, reps: '30s', restSeconds: 10 })
  }

  // Nudge sets to match target duration
  const day: ProgramDay = { name: focus, slots }
  let guard = 0
  while (estimateDayMinutes(day) < profile.durationMinutes - 2 && guard < 6) {
    for (const slot of slots) {
      if (slot.sets < config.setsRange[1]) slot.sets += 1
    }
    guard++
  }
  guard = 0
  while (estimateDayMinutes(day) > profile.durationMinutes + 3 && guard < 6) {
    for (const slot of slots) {
      if (slot.sets > config.setsRange[0]) slot.sets -= 1
    }
    guard++
  }

  const estimatedMinutes = estimateDayMinutes(day)

  return {
    dayName: `${focus === 'full-body' ? 'Full Body' : groupLabelLong[focus as MuscleGroup] ?? focus} · ${estimatedMinutes} min`,
    focus,
    slots,
    estimatedMinutes,
    rationale,
  }
}

// ─── Filters (shared) ──────────────────────────────────────────────

function passesEquipment(ex: Exercise, pref: EquipmentPreference): boolean {
  if (pref === 'none') return ex.equipment === 'none'
  return true
}

function passesPreferences(ex: Exercise, prefs: Preference[]): boolean {
  if (prefs.includes('sans-sauts') && ex.highImpact) return false
  return true
}

// ─── Skill Graph ───────────────────────────────────────────────────

export interface SkillNode {
  exerciseId: string
  prerequisites: string[]   // exercise IDs you should master first
  progressions: string[]    // exercise IDs this leads to
  regressions: string[]     // easier alternatives
  estimatedLevel: Difficulty
}

export function buildSkillGraph(): Map<string, SkillNode> {
  const graph = new Map<string, SkillNode>()

  for (const ex of exercises) {
    const node: SkillNode = {
      exerciseId: ex.id,
      prerequisites: ex.progressionFrom ? [ex.progressionFrom] : [],
      progressions: ex.progressionTo ? [ex.progressionTo] : [],
      regressions: [],
      estimatedLevel: ex.difficulty,
    }
    graph.set(ex.id, node)
  }

  // Fill in regressions (reverse of progressionFrom)
  for (const ex of exercises) {
    if (ex.progressionFrom) {
      const parent = graph.get(ex.progressionFrom)
      if (parent) {
        parent.progressions.push(ex.id)
      }
    }
  }

  return graph
}

/**
 * Recommends the next progression for an exercise the user has mastered.
 * Returns null if no progression exists or if the user hasn't mastered it yet.
 */
export function recommendProgression(
  exerciseId: string,
  recentSessions: WorkoutSession[],
): { nextExerciseId: string; reason: string } | null {
  const ex = getExerciseById(exerciseId)
  if (!ex || !ex.progressionTo) return null

  // Check if the user has done this exercise at least 3 times with RPE <= 'correct'
  const sessionsWithExercise = recentSessions
    .filter((s) => s.logs.some((l) => l.exerciseId === exerciseId && l.completed))
    .filter((s) => s.rpe && (s.rpe === 'tres-facile' || s.rpe === 'facile' || s.rpe === 'correct'))

  if (sessionsWithExercise.length < 3) {
    return null
  }

  return {
    nextExerciseId: ex.progressionTo,
    reason: `Tu maîtrises ${ex.name} (${sessionsWithExercise.length} séances réussies). Passe à la progression suivante !`,
  }
}
