import { exercises } from '../data/exercises'
import type { Difficulty, Exercise, MuscleGroup, Preference, ProgramDay, ProgramExerciseSlot, EquipmentPreference } from './types'
import { estimateDayMinutes } from './duration'
import { groupLabelLong } from './labels'

export interface GenerateWorkoutOptions {
  durationMinutes: number
  equipment: EquipmentPreference
  level: Difficulty
  preferences: Preference[]
  /** Exercise ids to avoid where possible (e.g. worked yesterday) — best effort. */
  avoidExerciseIds?: string[]
  /** Restrict to a single muscle group (used by the category quick-start
   * cards — "Abdos 15 min" etc.). Omit for a balanced full-body session. */
  focusGroup?: MuscleGroup
}

const WARMUP_IDS = ['cat-cow-stretch', 'high-knees']
const COOLDOWN_IDS = ['childs-pose', 'hip-flexor-stretch']

const HOLD_EXERCISE_IDS = new Set([
  'plank',
  'side-plank',
  'hollow-body-hold',
  'l-sit',
  'childs-pose',
  'cat-cow-stretch',
])

function passesEquipment(ex: Exercise, pref: EquipmentPreference): boolean {
  if (pref === 'none') return ex.equipment === 'none'
  return true // 'chair' and 'any' both allow none + chair (chair is the only tier that exists)
}

function passesPreferences(ex: Exercise, prefs: Preference[]): boolean {
  if (prefs.includes('sans-sauts') && ex.highImpact) return false
  return true
}

function defaultReps(ex: Exercise): string {
  return HOLD_EXERCISE_IDS.has(ex.id) ? '20-30s' : '8-12'
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

const BALANCED_ORDER: MuscleGroup[] = ['legs', 'push', 'core', 'back', 'cardio']

/** Builds a ProgramDay sized to a target duration from the exercise pool,
 * respecting equipment/level/preferences. Not a stored Program — this day
 * has no programId, which the workout store already treats as optional. */
export function generateWorkout(opts: GenerateWorkoutOptions): ProgramDay {
  const pool = exercises.filter((e) => passesEquipment(e, opts.equipment) && passesPreferences(e, opts.preferences))
  const includeWarmupCooldown = opts.durationMinutes >= 15 && !opts.focusGroup

  const slots: ProgramExerciseSlot[] = []
  if (includeWarmupCooldown) {
    for (const id of WARMUP_IDS) {
      if (pool.some((e) => e.id === id)) slots.push({ exerciseId: id, sets: 1, reps: '45s', restSeconds: 15 })
    }
  }

  const groups = opts.focusGroup
    ? [opts.focusGroup]
    : BALANCED_ORDER.filter((g) => g !== 'cardio' || opts.preferences.includes('cardio') || opts.preferences.includes('full-body') || opts.preferences.length === 0)

  const mainSlots: ProgramExerciseSlot[] = []
  const used = new Set<string>()
  for (const group of groups) {
    const candidates = pool.filter(
      (e) => e.muscleGroup === group && !used.has(e.id) && !(opts.avoidExerciseIds ?? []).includes(e.id),
    )
    if (candidates.length === 0) continue
    const atLevel = candidates.filter((e) => e.difficulty === opts.level)
    const chosen = pickOne(atLevel.length ? atLevel : candidates)
    used.add(chosen.id)
    mainSlots.push({ exerciseId: chosen.id, sets: 3, reps: defaultReps(chosen), restSeconds: 45 })
  }

  // A focused single-group session gets a couple more exercises from the
  // same group so it doesn't feel like just one move on repeat.
  if (opts.focusGroup) {
    const more = pool.filter((e) => e.muscleGroup === opts.focusGroup && !used.has(e.id))
    for (const ex of more.slice(0, 2)) {
      used.add(ex.id)
      mainSlots.push({ exerciseId: ex.id, sets: 3, reps: defaultReps(ex), restSeconds: 45 })
    }
  }

  slots.push(...mainSlots)
  if (includeWarmupCooldown) {
    for (const id of COOLDOWN_IDS) {
      if (pool.some((e) => e.id === id)) slots.push({ exerciseId: id, sets: 1, reps: '30s', restSeconds: 10 })
    }
  }

  const label = opts.focusGroup ? groupLabelLong[opts.focusGroup] : 'Full Body'
  const day: ProgramDay = { name: `${label} généré · ${opts.durationMinutes} min`, slots }

  // Nudge total sets up/down so the estimate lands near the target duration.
  let guard = 0
  while (estimateDayMinutes(day) < opts.durationMinutes - 2 && guard < 8) {
    for (const slot of mainSlots) slot.sets += 1
    guard++
  }
  guard = 0
  while (estimateDayMinutes(day) > opts.durationMinutes + 3 && mainSlots.some((s) => s.sets > 2) && guard < 8) {
    for (const slot of mainSlots) if (slot.sets > 2) slot.sets -= 1
    guard++
  }

  return day
}
