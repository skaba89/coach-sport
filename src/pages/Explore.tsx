import { Link } from 'react-router-dom'
import { Clock, Dumbbell, ListChecks, Zap, Search } from 'lucide-react'
import { programs } from '../data/programs'
import { premiumPrograms } from '../data/premiumPrograms'
import { exercises } from '../data/exercises'
import { estimateProgramAverageMinutes } from '../lib/duration'
import { equipmentBadge, programEquipment } from '../lib/equipment'
import { difficultyLabel } from '../lib/labels'
import type { Difficulty } from '../lib/types'
import { useState } from 'react'
import { useWorkoutStore } from '../stores/workoutStore'
import { useNavigate } from 'react-router-dom'
import { generateWorkout } from '../lib/generateWorkout'
import { useProfile } from '../lib/useDataStore'

const difficultyColor: Record<Difficulty, string> = {
  debutant: 'bg-emerald-500/15 text-emerald-400',
  intermediaire: 'bg-amber-500/15 text-amber-400',
  avance: 'bg-rose-500/15 text-rose-400',
  expert: 'bg-purple-500/15 text-purple-400',
}

const allPrograms = [...programs, ...premiumPrograms]

const quickDurations = [10, 15, 20]

export function Explore() {
  const navigate = useNavigate()
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const { profile } = useProfile()
  const [search, setSearch] = useState('')

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function startGenerated(durationMinutes: number) {
    const day = generateWorkout({
      durationMinutes,
      equipment: profile?.equipment ?? 'any',
      level: profile?.level ?? 'debutant',
      preferences: profile?.preferences ?? [],
    })
    startWorkout(day)
    navigate('/workout')
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Explorer</h1>

      {/* Quick workouts */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <Zap size={18} className="text-emerald-400" aria-hidden="true" />
          Séances rapides
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {quickDurations.map((d) => (
            <button
              key={d}
              onClick={() => startGenerated(d)}
              className="rounded-xl border border-slate-800 bg-slate-800/40 py-4 text-center hover:bg-slate-800/70"
            >
              <p className="text-lg font-bold text-white">{d}</p>
              <p className="text-xs text-slate-500">min</p>
            </button>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <Dumbbell size={18} className="text-emerald-400" aria-hidden="true" />
          Programmes
        </h2>
        <div className="flex flex-col gap-3">
          {allPrograms.map((program) => (
            <Link
              key={program.id}
              to={`/programs/${program.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-colors hover:bg-slate-800/70"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-medium text-white">{program.name}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColor[program.difficulty]}`}>
                  {difficultyLabel[program.difficulty]}
                </span>
              </div>
              <p className="text-sm text-slate-400">{program.description}</p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                {program.days.length} jours
                <span className="text-slate-700">·</span>
                <Clock size={12} aria-hidden="true" /> ≈ {estimateProgramAverageMinutes(program)} min
                <span className="text-slate-700">·</span>
                <span className={programEquipment(program) === 'chair' ? 'text-amber-400' : 'text-emerald-400'}>
                  {equipmentBadge[programEquipment(program)]}
                </span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Exercise search */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <ListChecks size={18} className="text-emerald-400" aria-hidden="true" />
          Bibliothèque d'exercices
        </h2>
        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un exercice..."
            aria-label="Rechercher un exercice par nom"
            className="w-full rounded-full border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          {filteredExercises.slice(0, 8).map((exercise) => (
            <Link
              key={exercise.id}
              to={`/exercises/${exercise.id}`}
              className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 transition-colors hover:bg-slate-800/70"
            >
              <p className="font-medium text-white">{exercise.name}</p>
              <p className="mt-1 line-clamp-1 text-sm text-slate-400">{exercise.description}</p>
            </Link>
          ))}
          {filteredExercises.length > 8 && (
            <Link
              to="/exercises"
              className="rounded-xl border border-slate-800 bg-slate-800/20 p-3 text-center text-sm text-emerald-400 hover:bg-slate-800/40"
            >
              Voir les {filteredExercises.length} exercices →
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
