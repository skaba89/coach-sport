import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Timer as TimerIcon, ArrowRight, Settings, Play } from 'lucide-react'
import { computeStreak } from '../lib/stats'
import { programs } from '../data/programs'
import { generateWorkout } from '../lib/generateWorkout'
import { useWorkoutStore } from '../stores/workoutStore'
import { useSessions, useProfile } from '../lib/useDataStore'

const quickDurations = [10, 15, 20]

export function Home() {
  const navigate = useNavigate()
  const { sessions } = useSessions()
  const { profile } = useProfile()
  const startWorkout = useWorkoutStore((s) => s.startWorkout)

  const streak = computeStreak(sessions)
  // FIX (audit §4.3 DRY): previous code sorted `sessions` twice (once for
  // lastSession, once for recentExerciseIds which is the same data sliced
  // to length 1). Now: single sort, derive both views from it.
  const sortedDesc = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [sessions],
  )
  const lastSession = sortedDesc[0]
  const recentExerciseIds = useMemo(
    () => sortedDesc.slice(0, 1).flatMap((s) => s.logs.map((l) => l.exerciseId)),
    [sortedDesc],
  )

  // FIX (audit §6.2): `recommended` was recomputed on every render (with a
  // new Math.random result). Memoize on profile + recentExerciseIds.
  const recommended = useMemo(
    () =>
      profile
        ? generateWorkout({
            durationMinutes: profile.durationMinutes,
            equipment: profile.equipment,
            level: profile.level,
            preferences: profile.preferences,
            avoidExerciseIds: recentExerciseIds,
          })
        : null,
    [profile, recentExerciseIds],
  )

  function startGenerated(durationMinutes: number) {
    const day = generateWorkout({
      durationMinutes,
      equipment: profile?.equipment ?? 'any',
      level: profile?.level ?? 'debutant',
      preferences: profile?.preferences ?? [],
      avoidExerciseIds: recentExerciseIds,
    })
    startWorkout(day)
    navigate('/workout')
  }

  function startRecommended() {
    if (!recommended) return
    startWorkout(recommended)
    navigate('/workout')
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">Bien joué, continue comme ça 💪</p>
          <h1 className="text-2xl font-bold text-white">Calisthenics Tracker</h1>
        </div>
        <Link
          to="/onboarding"
          className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-slate-200"
          title="Mon profil"
          aria-label="Ouvrir mon profil"
        >
          <Settings size={18} />
        </Link>
      </header>

      {!profile && (
        <Link
          to="/onboarding"
          className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 hover:bg-emerald-500/15"
        >
          <span className="text-sm font-medium">Personnalise ton entraînement (2 min) →</span>
          <ArrowRight size={16} />
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-800/70 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-orange-400">
            <Flame size={18} />
            <span className="text-xs font-semibold uppercase tracking-wide">Série</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {streak} <span className="text-sm font-normal text-slate-400">jour{streak > 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/70 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-emerald-400">
            <TimerIcon size={18} />
            <span className="text-xs font-semibold uppercase tracking-wide">Séances</span>
          </div>
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
        </div>
      </div>

      {recommended && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Séance recommandée</p>
          <p className="mt-1 font-semibold text-white">{recommended.name}</p>
          <p className="mt-1 text-sm text-slate-400">{recommended.slots.length} exercices</p>
          <button
            onClick={startRecommended}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-semibold text-slate-900 hover:bg-emerald-400"
          >
            <Play size={16} /> Commencer
          </button>
        </div>
      )}

      <section className="mb-6">
        <h2 className="mb-3 font-semibold text-white">Entraînements rapides</h2>
        <div className="grid grid-cols-3 gap-2">
          {quickDurations.map((d) => (
            <button
              key={d}
              onClick={() => startGenerated(d)}
              className="rounded-xl border border-slate-800 bg-slate-800/40 py-3 text-center hover:bg-slate-800/70"
            >
              <p className="text-lg font-bold text-white">{d}</p>
              <p className="text-xs text-slate-500">minutes</p>
            </button>
          ))}
        </div>
      </section>

      {lastSession && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dernière séance</p>
          <p className="mt-1 font-medium text-white">{lastSession.dayName}</p>
          <p className="text-sm text-slate-400">
            {new Date(lastSession.startedAt).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Programmes</h2>
          <Link to="/programs" className="flex items-center gap-1 text-sm text-emerald-400">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {programs.slice(0, 2).map((program) => (
            <Link
              key={program.id}
              to={`/programs/${program.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-colors hover:bg-slate-800/70"
            >
              <p className="font-medium text-white">{program.name}</p>
              <p className="mt-1 text-sm text-slate-400">{program.days.length} jours d'entraînement</p>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/timer"
        className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-500 p-4 font-semibold text-slate-900 hover:bg-emerald-400"
      >
        Lancer un minuteur libre
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
