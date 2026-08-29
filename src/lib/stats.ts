import type { WorkoutSession } from './types'
import { getExerciseById } from '../data/exercises'
import { groupLabelLong } from './labels'

export function computeStreak(sessions: WorkoutSession[]): number {
  const days = new Set(
    sessions
      .filter((s) => s.finishedAt)
      .map((s) => new Date(s.startedAt).toDateString()),
  )
  let streak = 0
  const cursor = new Date()
  // If nothing logged today yet, still allow the streak to count from yesterday
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function totalRepsForExercise(sessions: WorkoutSession[], exerciseId: string): number {
  return sessions.reduce((total, session) => {
    return (
      total +
      session.logs
        .filter((l) => l.exerciseId === exerciseId && l.completed)
        .reduce((sum, l) => sum + l.reps, 0)
    )
  }, 0)
}

export interface DailyVolumePoint {
  date: string
  totalReps: number
}

export function volumeOverTime(sessions: WorkoutSession[], days = 14): DailyVolumePoint[] {
  const now = new Date()
  const points: DailyVolumePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayKey = d.toDateString()
    const totalReps = sessions
      .filter((s) => new Date(s.startedAt).toDateString() === dayKey)
      .reduce((sum, s) => sum + s.logs.filter((l) => l.completed).reduce((a, l) => a + l.reps, 0), 0)
    points.push({ date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), totalReps })
  }
  return points
}

export interface WeeklyStats {
  sessionsThisWeek: number
  minutesThisWeek: number
  regularityPercent: number // sessionsThisWeek / target, capped at 100
  groupsThisWeek: string[]
}

/** "This week" = the last 7 days, rolling (simpler and more forgiving than
 * a Monday-anchored week for a personal single-user app). */
export function weeklyStats(sessions: WorkoutSession[], frequencyTarget = 3): WeeklyStats {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const thisWeek = sessions.filter((s) => s.finishedAt && new Date(s.startedAt) >= cutoff)

  const minutesThisWeek = thisWeek.reduce((sum, s) => {
    if (!s.finishedAt) return sum
    const mins = (new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
    return sum + Math.max(0, Math.round(mins))
  }, 0)

  const groupsSet = new Set<string>()
  for (const s of thisWeek) {
    for (const log of s.logs) {
      if (!log.completed) continue
      const group = getExerciseById(log.exerciseId)?.muscleGroup
      if (group) groupsSet.add(groupLabelLong[group])
    }
  }

  return {
    sessionsThisWeek: thisWeek.length,
    minutesThisWeek,
    regularityPercent: Math.min(100, Math.round((thisWeek.length / Math.max(1, frequencyTarget)) * 100)),
    groupsThisWeek: [...groupsSet],
  }
}
