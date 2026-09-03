import { Trash2, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getExerciseById } from '../data/exercises'
import { volumeOverTime, weeklyStats } from '../lib/stats'
import { VolumeChart } from '../components/VolumeChart'
import { TrainingCalendar } from '../components/TrainingCalendar'
import { MuscleMap, computeMuscleStats } from '../lib/muscleMap'
import type { Rpe } from '../lib/types'
import { rpeLabel } from '../lib/labels'
import { withToast } from '../lib/toast'
import { getDataStore, useSessions, useProfile } from '../lib/useDataStore'
import { useMemo } from 'react'

const rpeEmoji: Record<Rpe, string> = {
  'tres-facile': '😴',
  facile: '🙂',
  correct: '💪',
  difficile: '😓',
  'tres-difficile': '🥵',
}

export function History() {
  const { sessions } = useSessions()
  const { profile } = useProfile()
  const volumeData = volumeOverTime(sessions, 14)
  const week = weeklyStats(sessions, profile?.frequency)
  const muscleStats = useMemo(() => computeMuscleStats(sessions), [sessions])

  async function deleteSession(id: number | undefined) {
    if (id === undefined) return
    const ok = window.confirm('Supprimer cette séance ? Cette action est définitive.')
    if (!ok) return
    try {
      await withToast(getDataStore().sessions.delete(id), 'Échec de la suppression de la séance.')
    } catch {
      // toast already shown by withToast
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold text-white">Progression</h1>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <p className="mb-3 text-sm font-medium text-slate-300">Cette semaine</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-white">{week.sessionsThisWeek}</p>
            <p className="text-xs text-slate-500">séance{week.sessionsThisWeek > 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{week.minutesThisWeek}</p>
            <p className="text-xs text-slate-500">minutes</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{week.regularityPercent}%</p>
            <p className="text-xs text-slate-500">régularité</p>
          </div>
        </div>
        {week.groupsThisWeek.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">Groupes travaillés : {week.groupsThisWeek.join(', ')}</p>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <p className="mb-3 text-sm font-medium text-slate-300">Volume (répétitions) — 14 derniers jours</p>
        <VolumeChart data={volumeData} />
      </div>

      {/* Muscle Map */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <p className="mb-3 text-sm font-medium text-slate-300">Carte musculaire</p>
        <MuscleMap stats={muscleStats} />
      </div>

      {/* Training Calendar */}
      <div className="mb-6">
        <TrainingCalendar sessions={sessions} />
      </div>

      {/* Skills link */}
      <Link
        to="/skills"
        className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 hover:bg-emerald-500/10"
      >
        <div className="flex items-center gap-2">
          <Target size={20} className="text-emerald-400" aria-hidden="true" />
          <span className="font-medium text-white">Compétences</span>
        </div>
        <span className="text-xs text-slate-400">Voir tes objectifs →</span>
      </Link>

      <h2 className="mb-3 font-semibold text-white">Historique des séances</h2>
      {sessions.length === 0 && (
        <p className="text-sm text-slate-500">Aucune séance enregistrée pour l'instant. Lance ton premier entraînement !</p>
      )}
      <div className="flex flex-col gap-3">
        {sessions.map((session) => {
          const completedSets = session.logs.filter((l) => l.completed)
          const totalReps = completedSets.reduce((sum, l) => sum + l.reps, 0)
          const exerciseNames = [...new Set(completedSets.map((l) => getExerciseById(l.exerciseId)?.name ?? l.exerciseId))]

          return (
            <div key={session.id} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-white">
                    {session.dayName}
                    {session.rpe && (
                      <span title={`Difficulté ressentie : ${rpeLabel[session.rpe]}`} role="img" aria-label={`Difficulté ressentie : ${rpeLabel[session.rpe]}`}>
                        {rpeEmoji[session.rpe]}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(session.startedAt).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                  title="Supprimer"
                  aria-label={`Supprimer la séance du ${new Date(session.startedAt).toLocaleDateString('fr-FR')}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-slate-400">
                {completedSets.length} séries · {totalReps} reps totales
              </p>
              <p className="mt-1 text-xs text-slate-500">{exerciseNames.join(', ')}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
