import { Lock, Target, CheckCircle2, TrendingUp } from 'lucide-react'
import { SKILLS, computeSkillProgress, type Skill } from '../lib/skills'
import type { WorkoutSession } from '../lib/types'
import { useSessions } from '../lib/useDataStore'
import { getExerciseById } from '../data/exercises'

const statusConfig = {
  locked: { icon: Lock, color: 'text-slate-500', bg: 'bg-slate-800/40', label: 'Verrouillé' },
  'in-progress': { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'En cours' },
  ready: { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Prêt !' },
  mastered: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Maîtrisé' },
}

const difficultyColors: Record<string, string> = {
  debutant: 'bg-emerald-500/15 text-emerald-400',
  intermediaire: 'bg-amber-500/15 text-amber-400',
  avance: 'bg-rose-500/15 text-rose-400',
  expert: 'bg-purple-500/15 text-purple-400',
}

export function Skills() {
  const { sessions } = useSessions()
  const categories = ['push', 'pull', 'core', 'legs', 'mobility'] as const
  const categoryLabels: Record<string, string> = {
    push: 'Push / Pompes',
    pull: 'Pull / Tractions',
    core: 'Core / Gainage',
    legs: 'Jambes',
    mobility: 'Mobilité',
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Compétences</h1>
      <p className="mb-6 text-sm text-slate-400">
        Débloque des compétences avancées en maîtrisant les prérequis. Chaque compétence a un chemin de progression clair.
      </p>

      {categories.map((cat) => {
        const skills = SKILLS.filter((s) => s.category === cat)
        if (skills.length === 0) return null

        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 font-semibold text-white">{categoryLabels[cat]}</h2>
            <div className="space-y-3">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} sessions={sessions} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function SkillCard({ skill, sessions }: { skill: Skill; sessions: WorkoutSession[] }) {
  const progress = computeSkillProgress(skill, sessions)
  const config = statusConfig[progress.status]
  const Icon = config.icon

  return (
    <div className={`rounded-2xl border border-slate-800 p-4 ${config.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{skill.icon}</span>
          <div>
            <p className="font-medium text-white">{skill.name}</p>
            <p className="text-xs text-slate-500">
              {skill.estimatedWeeks} semaines · {skill.difficulty}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.color}`}>
            <Icon size={10} />
            {config.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${difficultyColors[skill.difficulty]}`}>
            {skill.difficulty}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-400">{skill.description}</p>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {progress.completedPrerequisites}/{progress.totalPrerequisites} prérequis
          </span>
          <span className="font-bold text-slate-300">{progress.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">{progress.reason}</p>

      {/* Prerequisites */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skill.prerequisites.map((prereqId) => {
          const ex = getExerciseById(prereqId)?.name ?? prereqId
          const isDone = progress.completedPrerequisites > 0 &&
            sessions.some((s) => s.logs.some((l) => l.exerciseId === prereqId && l.completed))
          return (
            <span
              key={prereqId}
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isDone ? '✓ ' : ''}{ex}
            </span>
          )
        })}
      </div>
    </div>
  )
}

