import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, Star, Video as VideoIcon, Sparkles } from 'lucide-react'
import { getExerciseById } from '../data/exercises'
import { hasExerciseAnimation } from '../lib/hasAnimation'
import { getExerciseVideo } from '../data/videos'
import { VideoPlayer } from '../components/VideoPlayer'
import { equipmentBadge, exerciseEquipmentSafetyNote } from '../lib/equipment'
import { groupLabel, difficultyLabel } from '../lib/labels'
import { withToast } from '../lib/toast'
import { getDataStore, useFavorite } from '../lib/useDataStore'

// FIX (audit §9.3 action #3): code-split the 401-LOC ExerciseAnimation
// component so it only loads when actually needed (when no real video
// is available for the exercise). Saves ~30 KB gzip on routes where a
// video is shown.
const LazyExerciseAnimation = lazy(() =>
  import('../components/ExerciseAnimation').then((m) => ({ default: m.ExerciseAnimation })),
)

export function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  // ⚠️ Hook MUST be called before any early return (Rules of Hooks).
  // When exerciseId is missing/invalid, the query resolves to undefined.
  const { favorite, refresh: refreshFavorite } = useFavorite('exercise', exerciseId)
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined

  if (!exercise || !exerciseId) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <p className="text-slate-400">Exercice introuvable.</p>
      </div>
    )
  }

  const easier = exercise.progressionFrom ? getExerciseById(exercise.progressionFrom) : undefined
  const harder = exercise.progressionTo ? getExerciseById(exercise.progressionTo) : undefined
  const noEquipAlt = exercise.noEquipmentAlternative ? getExerciseById(exercise.noEquipmentAlternative) : undefined
  const safetyNote = exerciseEquipmentSafetyNote(exercise)
  const currentExerciseId = exerciseId
  const isFavorite = favorite?.id !== undefined

  async function toggleFavorite() {
    const store = getDataStore()
    try {
      if (favorite?.id !== undefined) {
        await withToast(
          store.favorites.delete(favorite.id),
          'Échec de la suppression du favori.',
        )
      } else {
        await withToast(
          store.favorites.add({ type: 'exercise', refId: currentExerciseId }),
          'Échec de l\'ajout aux favoris.',
        )
      }
      await refreshFavorite()
    } catch {
      // toast already shown
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/exercises" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ChevronLeft size={16} /> Exercices
        </Link>
        <button onClick={toggleFavorite} className="text-slate-500 hover:text-amber-400" title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={isFavorite}>
          <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-amber-400' : ''} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            exercise.equipment === 'chair' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
          }`}
        >
          {equipmentBadge[exercise.equipment]}
        </span>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
          {groupLabel[exercise.muscleGroup]}
        </span>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
          {difficultyLabel[exercise.difficulty]}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white">{exercise.name}</h1>
      <p className="mt-2 text-slate-400">{exercise.description}</p>

      {safetyNote && (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>{safetyNote}</p>
        </div>
      )}

      <Demonstration exerciseId={exercise.id} equipment={exercise.equipment} />

      <div className="mt-6">
        <h2 className="mb-2 font-semibold text-white">Comment faire</h2>
        <ol className="flex flex-col gap-2">
          {exercise.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {noEquipAlt && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-white">Alternative sans chaise</h2>
          <Link
            to={`/exercises/${noEquipAlt.id}`}
            className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-sm hover:bg-slate-800/70"
          >
            <span className="text-slate-500">🏠 </span>
            <span className="text-white">{noEquipAlt.name}</span>
          </Link>
        </div>
      )}

      {(easier || harder) && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-white">Progression</h2>
          <div className="flex flex-col gap-2">
            {easier && (
              <Link
                to={`/exercises/${easier.id}`}
                className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-sm hover:bg-slate-800/70"
              >
                <span className="text-slate-500">← Plus facile : </span>
                <span className="text-white">{easier.name}</span>
              </Link>
            )}
            {harder && (
              <Link
                to={`/exercises/${harder.id}`}
                className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-sm hover:bg-slate-800/70"
              >
                <span className="text-slate-500">Plus difficile → </span>
                <span className="text-white">{harder.name}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DemonstrationProps {
  exerciseId: string
  equipment: 'none' | 'chair'
}

/**
 * Switches between real video (preferred, when available) and the
 * legacy SVG animation (fallback). Real videos match what competitors
 * (Nike Training Club, Freeletics, Peloton) offer — they make the
 * exercise immediately understandable, especially for beginners.
 */
function Demonstration({ exerciseId, equipment }: DemonstrationProps) {
  const video = getExerciseVideo(exerciseId)
  const hasSvg = hasExerciseAnimation(exerciseId)
  const [forceSvg, setForceSvg] = useState(false)

  if (!video && !hasSvg) return null

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {video && !forceSvg ? (
            <><VideoIcon size={12} /> Vidéo</>
          ) : (
            <><Sparkles size={12} /> Animation</>
          )}
        </p>
        {video && hasSvg && (
          <button
            onClick={() => setForceSvg((v) => !v)}
            className="text-[10px] uppercase tracking-wide text-slate-500 hover:text-slate-300"
            aria-pressed={forceSvg}
          >
            {forceSvg ? 'Voir la vidéo' : 'Voir l\'animation'}
          </button>
        )}
      </div>

      {video && !forceSvg ? (
        <VideoPlayer video={video} label={equipment === 'chair' ? '🪑 Chaise' : undefined} />
      ) : (
        <Suspense fallback={<div className="aspect-video animate-pulse rounded-xl bg-slate-800/60" />}>
          <LazyExerciseAnimation
            exerciseId={exerciseId}
            showChairBadge={equipment === 'chair'}
          />
        </Suspense>
      )}
    </div>
  )
}
