import { lazy, memo, Suspense, useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useWorkoutStore } from '../stores/workoutStore'
import { getExerciseById } from '../data/exercises'
import { getProgramById } from '../data/programs'
import { getDataStore } from '../lib/useDataStore'
import { CountdownTimer } from '../components/CountdownTimer'
import { hasExerciseAnimation } from '../lib/hasAnimation'
import type { Rpe } from '../lib/types'
import { rpeLabel } from '../lib/labels'
import { withToast } from '../lib/toast'

// FIX (audit §9.3 action #3): ExerciseAnimation is 401 LOC and only used
// on the Workout page (where no real video plays). Lazy-load it so its
// chunk is split from the main bundle and only fetched when a workout
// is actually started.
const LazyExerciseAnimation = lazy(() =>
  import('../components/ExerciseAnimation').then((m) => ({ default: m.ExerciseAnimation })),
)

const rpeOptions: { value: Rpe; label: string; emoji: string }[] = [
  { value: 'tres-facile', label: 'Très facile', emoji: '😴' },
  { value: 'facile', label: 'Facile', emoji: '🙂' },
  { value: 'correct', label: 'Parfaite', emoji: '💪' },
  { value: 'difficile', label: 'Difficile', emoji: '😓' },
  { value: 'tres-difficile', label: 'Trop difficile', emoji: '🥵' },
]

export function Workout() {
  const active = useWorkoutStore((s) => s.active)
  const logSet = useWorkoutStore((s) => s.logSet)
  const clearWorkout = useWorkoutStore((s) => s.clearWorkout)
  const navigate = useNavigate()
  const [resting, setResting] = useState<{ exerciseId: string; seconds: number } | null>(null)
  const [askingFeedback, setAskingFeedback] = useState(false)
  const [saving, setSaving] = useState(false)

  const program = active?.programId ? getProgramById(active.programId) : undefined
  const day = program?.days.find((d) => d.name === active?.dayName)

  // FIX (audit §6.2): previous dep was `active` which is a new reference on
  // every `logSet`. Depending on `active?.logs` lets the memo cache hits
  // when the logs array is reference-stable across unrelated renders.
  const exerciseIds = useMemo(() => {
    if (!active) return []
    return [...new Set(active.logs.map((l) => l.exerciseId))]
  }, [active?.logs])

  if (!active) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <p className="text-slate-400">Aucune séance en cours.</p>
        <button onClick={() => navigate('/programs')} className="mt-2 text-emerald-400">
          Choisir un programme
        </button>
      </div>
    )
  }

  const allCompleted = active.logs.every((l) => l.completed)

  async function submitFeedback(rpe: Rpe) {
    if (!active || saving) return
    setSaving(true)
    try {
      // FIX (audit §4.4, §6.4): previously `clearWorkout()` ran BEFORE the
      // DB write resolved, so a failed write silently lost the session.
      // Now: await the persist first, then clear + navigate.
      await withToast(
        getDataStore().sessions.add({
          programId: active.programId,
          dayName: active.dayName,
          startedAt: active.startedAt,
          finishedAt: new Date().toISOString(),
          logs: active.logs,
          rpe,
        }),
        "Échec de l'enregistrement de la séance. Réessaie dans un instant.",
      )
      clearWorkout()
      navigate('/history')
    } finally {
      setSaving(false)
    }
  }

  if (askingFeedback) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 text-center">
          <p className="text-3xl">🔥</p>
          <h1 className="mt-2 text-xl font-bold text-white">Séance terminée !</h1>
          <p className="mt-1 text-sm text-slate-400">{active.dayName}</p>
          <p className="mt-4 mb-3 font-medium text-white">Comment était la séance ?</p>
          <div className="flex flex-col gap-2">
            {rpeOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => submitFeedback(o.value)}
                disabled={saving}
                aria-label={`Difficulté ressentie : ${rpeLabel[o.value]}`}
                className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-left text-white hover:border-emerald-500 hover:bg-slate-900 disabled:opacity-50"
              >
                <span className="text-xl" aria-hidden="true">{o.emoji}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Séance en cours</p>
          <h1 className="text-xl font-bold text-white">{active.dayName}</h1>
        </div>
        <button
          onClick={() => {
            clearWorkout()
            navigate('/programs')
          }}
          className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-rose-400"
          title="Annuler la séance"
          aria-label="Annuler la séance"
        >
          <X size={18} />
        </button>
      </div>

      {resting && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/60 p-4">
          <CountdownTimer
            seconds={resting.seconds}
            label="Repos"
            autoStart
            colorClass="text-amber-400"
            onComplete={() => setResting(null)}
          />
          <button
            onClick={() => setResting(null)}
            className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Passer le repos
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {exerciseIds.map((exerciseId) => {
          const exercise = getExerciseById(exerciseId)
          const slot = day?.slots.find((s) => s.exerciseId === exerciseId)
          const setsForExercise = active.logs.filter((l) => l.exerciseId === exerciseId)

          return (
            <ExerciseWorkoutCard
              key={exerciseId}
              exerciseId={exerciseId}
              exerciseName={exercise?.name ?? exerciseId}
              isChair={exercise?.equipment === 'chair'}
              targetReps={slot?.reps}
            >
              {setsForExercise.map((log) => (
                <SetRow
                  key={log.setIndex}
                  setNumber={log.setIndex + 1}
                  completed={log.completed}
                  reps={log.reps}
                  onValidate={(reps) => {
                    logSet(exerciseId, log.setIndex, reps)
                    if (slot?.restSeconds) {
                      setResting({ exerciseId, seconds: slot.restSeconds })
                    }
                  }}
                />
              ))}
            </ExerciseWorkoutCard>
          )
        })}
      </div>

      <button
        onClick={() => setAskingFeedback(true)}
        disabled={!allCompleted}
        className="mt-6 w-full rounded-2xl bg-emerald-500 py-3 text-center font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
      >
        {allCompleted ? 'Terminer la séance' : `${active.logs.filter((l) => l.completed).length} / ${active.logs.length} séries validées`}
      </button>
    </div>
  )
}

function ExerciseWorkoutCard({
  exerciseId,
  exerciseName,
  isChair,
  targetReps,
  children,
}: {
  exerciseId: string
  exerciseName: string
  isChair: boolean
  targetReps?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-medium text-white">
          {isChair && (
            <span title="Nécessite une chaise" role="img" aria-label="Nécessite une chaise">
              🪑
            </span>
          )}
          {exerciseName}
        </p>
        {targetReps && <span className="shrink-0 text-xs text-slate-500">Objectif : {targetReps}</span>}
      </div>

      {hasExerciseAnimation(exerciseId) && (
        <div className="mb-3">
          <Suspense fallback={<div className="aspect-[200/190] w-40 animate-pulse rounded-xl bg-slate-800/60" />}>
            <LazyExerciseAnimation
              exerciseId={exerciseId}
              showChairBadge={isChair}
              className="mx-auto aspect-[200/190] w-40 overflow-hidden rounded-xl bg-slate-900/60 p-2"
            />
          </Suspense>
        </div>
      )}

      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

// FIX (audit §6.2): `React.memo` + stable `onValidate` callback so SetRow
// does not re-render when sibling sets are validated.
const SetRow = memo(function SetRow({
  setNumber,
  completed,
  reps,
  onValidate,
}: {
  setNumber: number
  completed: boolean
  reps: number
  onValidate: (reps: number) => void
}) {
  // FIX (audit §8.9): `reps || 0` collapses legitimate `0` reps to `0`.
  // Use `reps` directly since the prop is typed `number`.
  const [value, setValue] = useState(reps)
  const handleValidate = useCallback(() => onValidate(value), [onValidate, value])

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm text-slate-400">Série {setNumber}</span>
      <input
        type="number"
        min={0}
        value={value}
        disabled={completed}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-center text-sm text-white disabled:opacity-50"
      />
      <span className="text-xs text-slate-500">reps</span>
      <button
        onClick={handleValidate}
        disabled={completed}
        aria-label={completed ? `Série ${setNumber} validée` : `Valider la série ${setNumber}`}
        className={`ml-auto flex h-8 w-8 items-center justify-center rounded-full ${
          completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300 hover:bg-emerald-500 hover:text-slate-900'
        }`}
      >
        <Check size={16} />
      </button>
    </div>
  )
})
