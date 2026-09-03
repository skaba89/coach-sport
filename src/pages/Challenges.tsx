import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { getChallenges, type Challenge } from '../lib/challenges'

const categoryLabels: Record<string, string> = {
  'force': 'Force',
  'core': 'Core',
  'cardio': 'Cardio',
  'mobility': 'Mobilité',
  'streak': 'Streak',
  'full-body': 'Full Body',
}

const categoryColors: Record<string, string> = {
  'force': 'bg-rose-500/15 text-rose-400',
  'core': 'bg-amber-500/15 text-amber-400',
  'cardio': 'bg-blue-500/15 text-blue-400',
  'mobility': 'bg-purple-500/15 text-purple-400',
  'streak': 'bg-emerald-500/15 text-emerald-400',
  'full-body': 'bg-emerald-500/15 text-emerald-400',
}

const difficultyColors: Record<string, string> = {
  debutant: 'bg-emerald-500/15 text-emerald-400',
  intermediaire: 'bg-amber-500/15 text-amber-400',
  avance: 'bg-rose-500/15 text-rose-400',
}

export function Challenges() {
  const categories = ['full-body', 'force', 'core', 'cardio', 'mobility'] as const

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Challenges</h1>

      <p className="mb-6 text-sm text-slate-400">
        Lance-toi un défi sur plusieurs jours. Chaque jour compte, chaque séance te rapproche de ton objectif.
      </p>

      {categories.map((cat) => {
        const challenges = getChallenges({ category: cat })
        if (challenges.length === 0) return null

        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${categoryColors[cat]}`}>
                {categoryLabels[cat]}
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-colors hover:bg-slate-800/70"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{challenge.icon}</span>
          <div>
            <p className="font-medium text-white">{challenge.name}</p>
            <p className="text-xs text-slate-500">{challenge.durationDays} jours · {challenge.focus}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColors[challenge.difficulty]}`}>
          {challenge.difficulty}
        </span>
      </div>
      <p className="text-sm text-slate-400">{challenge.description}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
        <Trophy size={12} aria-hidden="true" />
        {challenge.dailyCommitment}
      </p>
    </Link>
  )
}
