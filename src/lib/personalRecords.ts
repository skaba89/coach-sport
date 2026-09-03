/**
 * Personal Records tracking (Lot 13 from the spec).
 *
 * Tracks max reps, max duration, best volume per exercise.
 * Notifies the user when a new PR is achieved.
 */
import type { WorkoutSession } from './types'
import { getExerciseById } from '../data/exercises'

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  /** Best single-set reps achieved */
  maxReps: number
  /** Best single-set duration (seconds) — for holds like plank */
  maxDurationSeconds?: number
  /** Total volume (sum of reps across all sets in the best session) */
  bestVolume: number
  /** Date of the PR (ISO) */
  achievedAt: string
  /** Previous record (for "New PR!" notification) */
  previousRecord?: number
}

/**
 * Compute PRs from the user's session history.
 * Returns one record per exercise that has at least one completed set.
 */
export function computePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const byExercise = new Map<string, { reps: number[]; durations: number[]; volumes: number[]; dates: string[] }>()

  for (const session of sessions) {
    if (!session.finishedAt) continue

    // Group reps by exercise within this session
    const sessionByExercise = new Map<string, { reps: number; duration: number }>()
    for (const log of session.logs) {
      if (!log.completed) continue
      const existing = sessionByExercise.get(log.exerciseId) ?? { reps: 0, duration: 0 }
      existing.reps = Math.max(existing.reps, log.reps)
      // For duration-based exercises, reps stores seconds (e.g. plank 30s → reps=30)
      const ex = getExerciseById(log.exerciseId)
      if (ex && isHoldExercise(ex.id)) {
        existing.duration = Math.max(existing.duration, log.reps)
      }
      sessionByExercise.set(log.exerciseId, existing)
    }

    // Accumulate into the global per-exercise stats
    for (const [exerciseId, data] of sessionByExercise) {
      const stats = byExercise.get(exerciseId) ?? { reps: [], durations: [], volumes: [], dates: [] }
      stats.reps.push(data.reps)
      if (data.duration > 0) stats.durations.push(data.duration)
      // Volume = sum of all reps for this exercise in this session
      const volume = session.logs
        .filter((l) => l.exerciseId === exerciseId && l.completed)
        .reduce((sum, l) => sum + l.reps, 0)
      stats.volumes.push(volume)
      stats.dates.push(session.startedAt)
      byExercise.set(exerciseId, stats)
    }
  }

  // Build PR records
  const records: PersonalRecord[] = []
  for (const [exerciseId, stats] of byExercise) {
    const ex = getExerciseById(exerciseId)
    if (!ex) continue

    const maxReps = Math.max(...stats.reps)
    const maxDuration = stats.durations.length > 0 ? Math.max(...stats.durations) : undefined
    const bestVolume = Math.max(...stats.volumes)
    const bestDateIndex = stats.volumes.indexOf(bestVolume)

    records.push({
      exerciseId,
      exerciseName: ex.name,
      maxReps,
      maxDurationSeconds: maxDuration,
      bestVolume,
      achievedAt: stats.dates[bestDateIndex] ?? new Date().toISOString(),
    })
  }

  // Sort by best volume descending
  return records.sort((a, b) => b.bestVolume - a.bestVolume)
}

/**
 * Compare two sets of PRs and return new records achieved.
 * Used to show "🔥 Nouveau record !" notifications.
 */
export function findNewRecords(
  current: PersonalRecord[],
  previous: PersonalRecord[],
): PersonalRecord[] {
  const newRecords: PersonalRecord[] = []
  for (const curr of current) {
    const prev = previous.find((p) => p.exerciseId === curr.exerciseId)
    if (!prev) {
      // First ever record for this exercise
      newRecords.push({ ...curr, previousRecord: undefined })
    } else if (curr.maxReps > prev.maxReps) {
      newRecords.push({ ...curr, previousRecord: prev.maxReps })
    } else if (curr.bestVolume > prev.bestVolume) {
      newRecords.push({ ...curr, previousRecord: prev.bestVolume })
    }
  }
  return newRecords
}

function isHoldExercise(exerciseId: string): boolean {
  const holdIds = new Set([
    'plank', 'side-plank', 'hollow-body-hold', 'l-sit',
    'wall-sit', 'superman-hold', 'reverse-plank', 'hollow-rock',
  ])
  return holdIds.has(exerciseId)
}
