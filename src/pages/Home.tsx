import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Timer as TimerIcon, ArrowRight, Settings, Play, Trophy, TrendingUp, Sparkles } from 'lucide-react'
import { computeStreak } from '../lib/stats'
import { programs } from '../data/programs'
import { premiumPrograms } from '../data/premiumPrograms'
import { generateWorkout } from '../lib/generateWorkout'
import { useWorkoutStore } from '../stores/workoutStore'
import { useSessions, useProfile } from '../lib/useDataStore'
import { computeGamification } from '../lib/gamification'

const quickDurations = [10, 15, 20]

export function Home() {
  const navigate = useNavigate()
  const { sessions } = useSessions()
  const { profile } = useProfile()
  const startWorkout = useWorkoutStore((s) => s.startWorkout)

  const streak = computeStreak(sessions)
  const sortedDesc = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [sessions],
  )
  const lastSession = sortedDesc[0]
  const recentExerciseIds = useMemo(
    () => sortedDesc.slice(0, 1).flatMap((s) => s.logs.map((l) => l.exerciseId)),
    [sortedDesc],
  )

  const game = useMemo(() => computeGamification(sessions, profile?.frequency ?? 3), [sessions, profile])

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

  // Coach message based on state
  const coachMessage = useMemo(() => {
    if (!profile) return 'Bienvenue ! Configure ton profil pour des séances personnalisées.'
    if (streak === 0) return 'C\'est reparti ! Une séance aujourd\'hui pour relancer la machine. 💪'
    if (streak < 3) return `${streak} jour${streak > 1 ? 's' : ''} de suite — continue !`
    if (streak < 7) return `${streak} jours de streak ! Tu es sur la bonne voie. 🔥`
    return `${streak} jours ! Tu es une légende. 💎`
  }, [profile, streak])

  const allPrograms = [...programs, ...premiumPrograms]

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      {/* Header with level + settings */}
      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
              Niv. {game.level}
            </span>
            <span className="text-xs text-slate-400">{game.levelName}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">Coach Sport</h1>
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

      {/* Coach message */}
      <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-2">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Coach</p>
            <p className="mt-0.5 text-sm text-slate-200">{coachMessage}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-800/70 p-4 text-center">
          <Flame size={20} className="mx-auto mb-1 text-orange-400" aria-hidden="true" />
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">jours</p>
        </div>
        <div className="rounded-2xl bg-slate-800/70 p-4 text-center">
          <TimerIcon size={20} className="mx-auto mb-1 text-emerald-400" aria-hidden="true" />
          <p className="text-2xl font-bold text-white">{game.totalSessions}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">séances</p>
        </div>
        <div className="rounded-2xl bg-slate-800/70 p-4 text-center">
          <Trophy size={20} className="mx-auto mb-1 text-amber-400" aria-hidden="true" />
          <p className="text-2xl font-bold text-white">{game.badges.length}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">badges</p>
        </div>
      </div>

      {/* Weekly goal progress */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <TrendingUp size={16} aria-hidden="true" /> Objectif hebdo
          </p>
          <span className="text-sm font-bold text-emerald-400">
            {game.weeklyProgress}/{game.weeklyGoal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (game.weeklyProgress / game.weeklyGoal) * 100)}%` }}
          />
        </div>
        {game.weeklyProgress >= game.weeklyGoal && (
          <p className="mt-2 text-xs text-emerald-400">🎉 Objectif atteint cette semaine !</p>
        )}
      </div>

      {/* Recommended workout */}
      {recommended && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Séance recommandée</p>
          <p className="mt-1 font-semibold text-white">{recommended.name}</p>
          <p className="mt-1 text-sm text-slate-400">{recommended.slots.length} exercices · ~{recommended.slots.reduce((s, sl) => s + sl.sets, 0)} séries</p>
          <button
            onClick={startRecommended}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-semibold text-slate-900 hover:bg-emerald-400"
          >
            <Play size={16} /> Commencer
          </button>
        </div>
      )}

      {/* Quick workouts */}
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

      {/* Badges */}
      {game.badges.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-semibold text-white">Récompenses</h2>
          <div className="flex flex-wrap gap-2">
            {game.badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5"
                title={badge.description}
              >
                <span className="text-lg" aria-hidden="true">{badge.icon}</span>
                <span className="text-xs font-medium text-slate-300">{badge.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last session */}
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

      {/* Programs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Programmes</h2>
          <Link to="/programs" className="flex items-center gap-1 text-sm text-emerald-400">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {allPrograms.slice(0, 3).map((program) => (
            <Link
              key={program.id}
              to={`/programs/${program.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-colors hover:bg-slate-800/70"
            >
              <p className="font-medium text-white">{program.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {program.days.length} jours · {program.difficulty}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Coach AI + Challenges */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          to="/coach"
          className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center hover:bg-emerald-500/15"
        >
          <Sparkles size={24} className="text-emerald-400" aria-hidden="true" />
          <span className="text-sm font-medium text-white">Coach IA</span>
          <span className="text-xs text-slate-400">Parle à ton coach</span>
        </Link>
        <Link
          to="/challenges"
          className="flex flex-col items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center hover:bg-amber-500/15"
        >
          <Trophy size={24} className="text-amber-400" aria-hidden="true" />
          <span className="text-sm font-medium text-white">Challenges</span>
          <span className="text-xs text-slate-400">Relève un défi</span>
        </Link>
      </div>

      <Link
        to="/timer"
        className="mt-3 flex items-center justify-between rounded-2xl bg-slate-800 p-4 font-semibold text-slate-300 hover:bg-slate-700"
      >
        Lancer un minuteur libre
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
