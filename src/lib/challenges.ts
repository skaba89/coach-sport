/**
 * Challenges system — gamified multi-day goals.
 *
 * Each challenge has a duration (days), a daily commitment,
 * and tracks the user's progress. Challenges are compatible
 * with the user's level and preferences.
 */

export interface Challenge {
  id: string
  name: string
  description: string
  durationDays: number
  difficulty: 'debutant' | 'intermediaire' | 'avance'
  icon: string
  /** Daily commitment description */
  dailyCommitment: string
  /** Exercise IDs or muscle groups targeted */
  focus: string
  /** Category for filtering */
  category: 'force' | 'core' | 'cardio' | 'mobility' | 'streak' | 'full-body'
}

export interface ChallengeProgress {
  challengeId: string
  startedAt: string
  completedDays: number[]
  status: 'active' | 'completed' | 'abandoned'
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'challenge-7j-debutant',
    name: '7 Jours Débutant',
    description: 'Une semaine pour lancer la machine. Une séance courte chaque jour, 10-15 min.',
    durationDays: 7,
    difficulty: 'debutant',
    icon: '🌱',
    dailyCommitment: '1 séance de 10-15 min',
    focus: 'Full body',
    category: 'full-body',
  },
  {
    id: 'challenge-14j-consistance',
    name: '14 Jours Consistance',
    description: 'Deux semaines pour créer l\'habitude. Alterne force et mobilité.',
    durationDays: 14,
    difficulty: 'debutant',
    icon: '🔥',
    dailyCommitment: '1 séance de 15-20 min',
    focus: 'Full body + mobilité',
    category: 'full-body',
  },
  {
    id: 'challenge-30j-transformation',
    name: '30 Jours Transformation',
    description: 'Un mois complet pour transformer ton corps. Progression hebdomadaire.',
    durationDays: 30,
    difficulty: 'intermediaire',
    icon: '💎',
    dailyCommitment: '1 séance de 20-30 min',
    focus: 'Full body progressif',
    category: 'full-body',
  },
  {
    id: 'challenge-100-pompes',
    name: '100 Pompes Progressives',
    description: 'Atteins 100 pompes en une séance. Progression sur 4 semaines.',
    durationDays: 28,
    difficulty: 'intermediaire',
    icon: '💪',
    dailyCommitment: 'Séance push-focus + test max pompes',
    focus: 'Push (pompes)',
    category: 'force',
  },
  {
    id: 'challenge-core-21j',
    name: 'Core 21 Jours',
    description: '3 semaines dédiées au gainage et aux abdos. Progression du temps sous tension.',
    durationDays: 21,
    difficulty: 'intermediaire',
    icon: '🎯',
    dailyCommitment: '1 séance core de 10-15 min',
    focus: 'Core / abdos',
    category: 'core',
  },
  {
    id: 'challenge-mobilite-quotidienne',
    name: 'Mobilité Quotidienne 30 Jours',
    description: '30 jours de mobilité, 10 min par jour. Idéal en complément d\'un autre programme.',
    durationDays: 30,
    difficulty: 'debutant',
    icon: '🧘',
    dailyCommitment: '1 routine mobilité de 10 min',
    focus: 'Mobilité + souplesse',
    category: 'mobility',
  },
  {
    id: 'challenge-cardio-14j',
    name: 'Cardio 14 Jours Sans Sauts',
    description: 'Deux semaines de cardio low-impact. Idéal pour les articulations.',
    durationDays: 14,
    difficulty: 'debutant',
    icon: '❤️',
    dailyCommitment: '1 séance cardio de 15 min (sans sauts)',
    focus: 'Cardio low-impact',
    category: 'cardio',
  },
  {
    id: 'challenge-dos-sain-21j',
    name: 'Dos Sain 21 Jours',
    description: '3 semaines pour renforcer et soulager ton dos. Exercices doux et ciblés.',
    durationDays: 21,
    difficulty: 'debutant',
    icon: '🦴',
    dailyCommitment: '1 séance dos/posture de 15 min',
    focus: 'Dos + posture + mobilité',
    category: 'mobility',
  },
]

/**
 * Get challenges filtered by category and difficulty.
 */
export function getChallenges(opts?: {
  category?: Challenge['category']
  difficulty?: Challenge['difficulty']
}): Challenge[] {
  return CHALLENGES.filter((c) => {
    if (opts?.category && c.category !== opts.category) return false
    if (opts?.difficulty && c.difficulty !== opts.difficulty) return false
    return true
  })
}

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id)
}

/**
 * Compute challenge progress from session history.
 * A day is "completed" if the user has at least one finished session
 * on that day (since the challenge start date).
 */
export function computeChallengeProgress(
  challenge: Challenge,
  progress: ChallengeProgress,
  sessionDates: string[],
): { completedDays: number; percent: number; isComplete: boolean; streak: number } {
  const startDate = new Date(progress.startedAt)
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const completedDays: number[] = []
  for (let day = 0; day < Math.min(daysSinceStart + 1, challenge.durationDays); day++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(dayDate.getDate() + day)
    const dayStr = dayDate.toDateString()

    if (sessionDates.some((s) => new Date(s).toDateString() === dayStr)) {
      completedDays.push(day)
    }
  }

  const percent = Math.round((completedDays.length / challenge.durationDays) * 100)
  const isComplete = completedDays.length >= challenge.durationDays

  // Compute current streak within the challenge
  let streak = 0
  for (let day = completedDays.length - 1; day >= 0; day--) {
    if (completedDays.includes(day)) {
      streak++
    } else {
      break
    }
  }

  return { completedDays: completedDays.length, percent, isComplete, streak }
}
