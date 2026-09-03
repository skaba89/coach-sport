/**
 * Skills tracking — specific calisthenics skill goals.
 *
 * Each skill has prerequisites (exercises you must master first),
 * a progression path, and a tracking system.
 *
 * Inspired by Calisteniapp's skill programs but with our own
 * deterministic progression engine.
 */

import type { WorkoutSession } from './types'


export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'debutant' | 'intermediaire' | 'avance' | 'expert'
  /** Exercise IDs that build toward this skill */
  prerequisites: string[]
  /** The final exercise that represents mastering the skill */
  targetExerciseId?: string
  /** Estimated weeks to achieve with consistent training */
  estimatedWeeks: number
  category: 'push' | 'pull' | 'core' | 'legs' | 'mobility'
}

export interface SkillProgress {
  skillId: string
  status: 'locked' | 'in-progress' | 'ready' | 'mastered'
  completedPrerequisites: number
  totalPrerequisites: number
  percent: number
  reason: string
}

export const SKILLS: Skill[] = [
  {
    id: 'first-pushup',
    name: 'Ma première pompe',
    description: 'Atteindre 10 pompes complètes d\'affilée. La base de la force upper body.',
    icon: '💪',
    difficulty: 'debutant',
    prerequisites: ['knee-push-up'],
    targetExerciseId: 'push-up',
    estimatedWeeks: 2,
    category: 'push',
  },
  {
    id: 'first-pullup',
    name: 'Ma première traction',
    description: 'Atteindre une traction complète. Nécessite une barre de traction.',
    icon: '🆙',
    difficulty: 'intermediaire',
    prerequisites: ['pull-up'],
    targetExerciseId: 'pull-up',
    estimatedWeeks: 8,
    category: 'pull',
  },
  {
    id: 'diamond-master',
    name: 'Maîtriser les pompes diamant',
    description: 'Atteindre 15 pompes diamant pour des triceps forts.',
    icon: '💎',
    difficulty: 'intermediaire',
    prerequisites: ['push-up'],
    targetExerciseId: 'diamond-push-up',
    estimatedWeeks: 4,
    category: 'push',
  },
  {
    id: 'handstand-hold',
    name: 'Équilibre sur les mains (mur)',
    description: 'Tenir 30 secondes en équilibre contre un mur.',
    icon: '🤸',
    difficulty: 'avance',
    prerequisites: ['pike-push-up', 'wall-handstand-hold'],
    targetExerciseId: 'wall-handstand-hold',
    estimatedWeeks: 6,
    category: 'push',
  },
  {
    id: 'plank-master',
    name: 'Maîtrise de la planche',
    description: 'Tenir la planche 60 secondes avec une forme parfaite.',
    icon: '🧱',
    difficulty: 'debutant',
    prerequisites: ['plank'],
    targetExerciseId: 'plank',
    estimatedWeeks: 3,
    category: 'core',
  },
  {
    id: 'hollow-body',
    name: 'Hollow body hold',
    description: 'Tenir le hollow body 30 secondes. La base du gainage gymnastique.',
    icon: '🏋️',
    difficulty: 'intermediaire',
    prerequisites: ['plank', 'dead-bug'],
    targetExerciseId: 'hollow-body-hold',
    estimatedWeeks: 4,
    category: 'core',
  },
  {
    id: 'l-sit',
    name: 'L-sit',
    description: 'Tenir le L-sit 10 secondes. Force core + compression.',
    icon: '🇱',
    difficulty: 'avance',
    prerequisites: ['hollow-body-hold', 'plank'],
    targetExerciseId: 'l-sit',
    estimatedWeeks: 6,
    category: 'core',
  },
  {
    id: 'pistol-squat',
    name: 'Pistol squat',
    description: 'Réaliser un pistol squat complet (descendre et remonter sur une jambe).',
    icon: '🦵',
    difficulty: 'avance',
    prerequisites: ['squat', 'lunge', 'pistol-squat-progression'],
    targetExerciseId: 'pistol-squat-progression',
    estimatedWeeks: 8,
    category: 'legs',
  },
  {
    id: 'archer-pushup',
    name: 'Archer push-up',
    description: 'Maîtriser l\'archer push-up pour la force unilatérale.',
    icon: '🏹',
    difficulty: 'avance',
    prerequisites: ['push-up', 'wide-push-up', 'diamond-push-up'],
    targetExerciseId: 'archer-push-up',
    estimatedWeeks: 6,
    category: 'push',
  },
  {
    id: 'full-mobility',
    name: 'Mobilité complète',
    description: 'Atteindre une bonne mobilité dans tous les groupes. 30 jours de practice.',
    icon: '🧘',
    difficulty: 'debutant',
    prerequisites: ['cat-cow-stretch', 'hip-flexor-stretch', 'childs-pose'],
    estimatedWeeks: 4,
    category: 'mobility',
  },
]

/**
 * Compute skill progress from the user's session history.
 * A prerequisite is "completed" if the user has done the exercise
 * at least 3 times with RPE ≤ 'correct'.
 */
export function computeSkillProgress(
  skill: Skill,
  sessions: WorkoutSession[],
): SkillProgress {
  const completed = new Set<string>()

  for (const prereqId of skill.prerequisites) {
    // Check if the user has done this exercise 3+ times successfully
    const successfulSessions = sessions.filter((s) => {
      if (!s.finishedAt) return false
      const hasExercise = s.logs.some((l) => l.exerciseId === prereqId && l.completed)
      const isEasy = !s.rpe || s.rpe === 'tres-facile' || s.rpe === 'facile' || s.rpe === 'correct'
      return hasExercise && isEasy
    })

    if (successfulSessions.length >= 3) {
      completed.add(prereqId)
    }
  }

  // Check if target exercise is mastered (5+ successful sessions)
  let targetMastered = false
  if (skill.targetExerciseId) {
    const targetSessions = sessions.filter((s) => {
      if (!s.finishedAt) return false
      const hasExercise = s.logs.some((l) => l.exerciseId === skill.targetExerciseId && l.completed)
      const isEasy = !s.rpe || s.rpe === 'tres-facile' || s.rpe === 'facile' || s.rpe === 'correct'
      return hasExercise && isEasy
    })
    targetMastered = targetSessions.length >= 5
  }

  const totalPrereqs = skill.prerequisites.length
  const completedPrereqs = completed.size
  const allPrereqsDone = completedPrereqs === totalPrereqs

  let status: SkillProgress['status']
  let reason: string

  if (targetMastered) {
    status = 'mastered'
    reason = 'Compétence maîtrisée ! 🎉'
  } else if (allPrereqsDone) {
    status = 'ready'
    reason = 'Tous les prérequis validés — tu peux travailler la compétence cible.'
  } else if (completedPrereqs > 0) {
    status = 'in-progress'
    reason = `${completedPrereqs}/${totalPrereqs} prérequis validés. Continue !`
  } else {
    status = 'locked'
    reason = `Commence par maîtriser les prérequis (${totalPrereqs} à valider).`
  }

  const percent = targetMastered
    ? 100
    : Math.round((completedPrereqs / Math.max(1, totalPrereqs)) * 80) // 80% max until target is mastered

  return {
    skillId: skill.id,
    status,
    completedPrerequisites: completedPrereqs,
    totalPrerequisites: totalPrereqs,
    percent,
    reason,
  }
}

export function getSkillById(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id)
}
