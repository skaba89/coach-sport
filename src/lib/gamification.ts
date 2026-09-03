/**
 * Gamification: badges, streaks, levels, celebrations.
 *
 * Designed to be encouraging, not punitive. Rest days are valued.
 * No mechanics that push users to overtrain.
 */
import type { WorkoutSession } from './types'
import { computeStreak } from './stats'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  /** Date earned (ISO) */
  earnedAt: string
}

export interface GamificationState {
  streak: number
  totalSessions: number
  totalMinutes: number
  level: number
  levelName: string
  badges: Badge[]
  weeklyGoal: number
  weeklyProgress: number
}

const LEVELS = [
  { level: 1, name: 'Débutant', minSessions: 0 },
  { level: 2, name: 'Motivé', minSessions: 5 },
  { level: 3, name: 'Régulier', minSessions: 15 },
  { level: 4, name: 'Athlète', minSessions: 30 },
  { level: 5, name: 'Expert', minSessions: 50 },
  { level: 6, name: 'Maître', minSessions: 100 },
  { level: 7, name: 'Légende', minSessions: 200 },
]

export function computeLevel(totalSessions: number): { level: number; name: string } {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (totalSessions >= l.minSessions) current = l
  }
  return { level: current.level, name: current.name }
}

export function computeBadges(sessions: WorkoutSession[]): Badge[] {
  const badges: Badge[] = []
  const finished = sessions.filter((s) => s.finishedAt)
  const streak = computeStreak(sessions)
  const totalMinutes = finished.reduce((sum, s) => {
    if (!s.finishedAt) return sum
    const mins = (new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
    return sum + Math.max(0, Math.round(mins))
  }, 0)

  // First session
  if (finished.length >= 1) {
    badges.push({
      id: 'first-session',
      name: 'Premier pas',
      description: 'Tu as complété ta première séance !',
      icon: '🎯',
      earnedAt: finished[0].startedAt,
    })
  }

  // 5 sessions
  if (finished.length >= 5) {
    badges.push({
      id: 'sessions-5',
      name: 'Cinq séances',
      description: '5 séances complétées — tu prends le rythme !',
      icon: '⭐',
      earnedAt: finished[4].startedAt,
    })
  }

  // 3-day streak
  if (streak >= 3) {
    badges.push({
      id: 'streak-3',
      name: 'Série de 3',
      description: '3 jours d\'affilée — bravo !',
      icon: '🔥',
      earnedAt: new Date().toISOString(),
    })
  }

  // 7-day streak
  if (streak >= 7) {
    badges.push({
      id: 'streak-7',
      name: 'Semaine parfaite',
      description: '7 jours de suite — incroyable !',
      icon: '💎',
      earnedAt: new Date().toISOString(),
    })
  }

  // 100 minutes total
  if (totalMinutes >= 100) {
    badges.push({
      id: 'minutes-100',
      name: 'Cent minutes',
      description: '100 minutes d\'entraînement cumulées !',
      icon: '⏱️',
      earnedAt: new Date().toISOString(),
    })
  }

  // 500 minutes total
  if (totalMinutes >= 500) {
    badges.push({
      id: 'minutes-500',
      name: 'Cinq cents minutes',
      description: '500 minutes — tu es un athlète !',
      icon: '🏆',
      earnedAt: new Date().toISOString(),
    })
  }

  return badges
}

export function computeGamification(
  sessions: WorkoutSession[],
  weeklyGoal: number = 3,
): GamificationState {
  const finished = sessions.filter((s) => s.finishedAt)
  const streak = computeStreak(sessions)
  const totalMinutes = finished.reduce((sum, s) => {
    if (!s.finishedAt) return sum
    const mins = (new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
    return sum + Math.max(0, Math.round(mins))
  }, 0)

  // Weekly progress: count sessions in the last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weeklyProgress = finished.filter(
    (s) => new Date(s.startedAt) >= weekAgo,
  ).length

  const { level, name } = computeLevel(finished.length)
  const badges = computeBadges(sessions)

  return {
    streak,
    totalSessions: finished.length,
    totalMinutes,
    level,
    levelName: name,
    badges,
    weeklyGoal,
    weeklyProgress,
  }
}
