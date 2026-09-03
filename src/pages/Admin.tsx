import { useState } from 'react'
import { Database, Dumbbell, TrendingUp, Search, Filter } from 'lucide-react'
import { exercises } from '../data/exercises'
import { programs } from '../data/programs'
import { premiumPrograms } from '../data/premiumPrograms'
import { CHALLENGES } from '../lib/challenges'
import { VIDEO_LIBRARY } from '../data/videos'
import { groupLabel, difficultyLabel } from '../lib/labels'
import type { MuscleGroup, Difficulty } from '../lib/types'

export function Admin() {
  const [tab, setTab] = useState<'stats' | 'exercises' | 'programs' | 'videos'>('stats')
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState<MuscleGroup | 'all'>('all')

  const allPrograms = [...programs, ...premiumPrograms]
  const filteredExercises = exercises.filter((e) => {
    if (filterGroup !== 'all' && e.muscleGroup !== filterGroup) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Stats
  const exercisesByGroup = exercises.reduce((acc, e) => {
    acc[e.muscleGroup] = (acc[e.muscleGroup] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const exercisesByDifficulty = exercises.reduce((acc, e) => {
    acc[e.difficulty] = (acc[e.difficulty] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const videosWithoutExercise = VIDEO_LIBRARY.filter((v) => !exercises.find((e) => e.id === v.exerciseId))

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Back-office</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {([
          { id: 'stats', label: 'Stats', icon: TrendingUp },
          { id: 'exercises', label: 'Exercices', icon: Dumbbell },
          { id: 'programs', label: 'Programmes', icon: Database },
          { id: 'videos', label: 'Vidéos', icon: Filter },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Exercices" value={exercises.length} icon="💪" />
            <StatCard label="Programmes" value={allPrograms.length} icon="📋" />
            <StatCard label="Vidéos CC0" value={VIDEO_LIBRARY.length} icon="🎬" />
            <StatCard label="Challenges" value={CHALLENGES.length} icon="🏆" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
            <p className="mb-3 text-sm font-semibold text-white">Par groupe musculaire</p>
            <div className="space-y-2">
              {Object.entries(exercisesByGroup).sort((a, b) => b[1] - a[1]).map(([group, count]) => (
                <div key={group} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{groupLabel[group as MuscleGroup] ?? group}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full bg-emerald-500" style={{ width: `${(count / exercises.length) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-bold text-white">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
            <p className="mb-3 text-sm font-semibold text-white">Par niveau</p>
            <div className="flex gap-3">
              {(['debutant', 'intermediaire', 'avance', 'expert'] as Difficulty[]).map((d) => (
                <div key={d} className="flex-1 rounded-xl bg-slate-900/60 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{exercisesByDifficulty[d] ?? 0}</p>
                  <p className="text-xs text-slate-500">{difficultyLabel[d]}</p>
                </div>
              ))}
            </div>
          </div>

          {videosWithoutExercise.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-200">⚠️ Vidéos sans exercice associé</p>
              <p className="mt-1 text-xs text-amber-300">
                {videosWithoutExercise.length} vidéo(s) dans VIDEO_LIBRARY ne correspondent à aucun exercice du catalogue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Exercises tab */}
      {tab === 'exercises' && (
        <div>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher un exercice"
                className="w-full rounded-full border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-200"
              />
            </div>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value as MuscleGroup | 'all')}
              aria-label="Filtrer par groupe"
              className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
            >
              <option value="all">Tous</option>
              {(Object.keys(groupLabel) as MuscleGroup[]).map((g) => (
                <option key={g} value={g}>{groupLabel[g]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filteredExercises.map((ex) => (
              <div key={ex.id} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{ex.name}</p>
                    <p className="text-xs text-slate-500">id: {ex.id}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      {groupLabel[ex.muscleGroup]}
                    </span>
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      {difficultyLabel[ex.difficulty]}
                    </span>
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      {ex.equipment === 'chair' ? '🪑' : '🏠'}
                    </span>
                  </div>
                </div>
                {ex.progressionFrom && (
                  <p className="mt-1 text-xs text-emerald-400">← progression de: {ex.progressionFrom}</p>
                )}
                {ex.progressionTo && (
                  <p className="text-xs text-slate-500">→ progression vers: {ex.progressionTo}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">{filteredExercises.length} exercices</p>
        </div>
      )}

      {/* Programs tab */}
      {tab === 'programs' && (
        <div className="space-y-3">
          {allPrograms.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <p className="font-medium text-white">{p.name}</p>
              <p className="text-xs text-slate-500">id: {p.id}</p>
              <div className="mt-1 flex gap-1.5">
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                  {p.days.length} jours
                </span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                  {difficultyLabel[p.difficulty]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Videos tab */}
      {tab === 'videos' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{VIDEO_LIBRARY.length} clips vidéo CC0 au total</p>
          {VIDEO_LIBRARY.map((v) => {
            const ex = exercises.find((e) => e.id === v.exerciseId)
            return (
              <div key={v.exerciseId} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{ex?.name ?? v.exerciseId}</p>
                    <p className="text-xs text-slate-500">{v.src} · {v.durationSeconds}s</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">
                    CC0 · Pexels
                  </span>
                </div>
                {v.alsoFor && v.alsoFor.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Alias: {v.alsoFor.join(', ')}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 text-center">
      <p className="text-2xl" aria-hidden="true">{icon}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
