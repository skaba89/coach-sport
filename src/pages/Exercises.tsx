import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star } from 'lucide-react'
import { exercises } from '../data/exercises'
import type { Difficulty, Equipment, MuscleGroup } from '../lib/types'
import { equipmentEmoji, equipmentLabel } from '../lib/equipment'
import { groupLabel, difficultyLabel } from '../lib/labels'
import { getDataStore, useFavorites } from '../lib/useDataStore'

export function Exercises() {
  const [group, setGroup] = useState<MuscleGroup | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all')
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const { favorites } = useFavorites('exercise')
  // FIX (audit §6.2 lint warning): derive the Set from `favorites.map(...)`
  // directly in the memo body so the dependency is stable (map output, not
  // the live query result which changes identity every render).
  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.refId)),
    [favorites],
  )

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (group === 'all' || e.muscleGroup === group) &&
          (difficulty === 'all' || e.difficulty === difficulty) &&
          (equipment === 'all' || e.equipment === equipment) &&
          (!favoritesOnly || favoriteIds.has(e.id)) &&
          (query.trim() === '' || e.name.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [group, difficulty, equipment, query, favoritesOnly, favoriteIds],
  )

  async function toggleFavorite(exerciseId: string) {
    const store = getDataStore()
    try {
      const existing = await store.favorites.find('exercise', exerciseId)
      if (existing?.id !== undefined) {
        await store.favorites.delete(existing.id)
      } else {
        await store.favorites.add({ type: 'exercise', refId: exerciseId })
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-1 text-2xl font-bold text-white">Bibliothèque d'exercices</h1>
      <p className="mb-4 text-sm text-slate-500">
        Calisthénie à domicile — poids du corps, et une chaise pour certains exercices seulement.
      </p>

      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un exercice..."
          aria-label="Rechercher un exercice par nom"
          className="w-full rounded-full border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium ${
            favoritesOnly ? 'border-amber-500 bg-amber-500/15 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-200'
          }`}
        >
          <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} aria-hidden="true" /> Favoris
        </button>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as Equipment | 'all')}
          aria-label="Filtrer par équipement"
          className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="all">Tout équipement</option>
          {(Object.entries(equipmentLabel) as [Equipment, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {equipmentEmoji[value]} {label}
            </option>
          ))}
        </select>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as MuscleGroup | 'all')}
          aria-label="Filtrer par groupe musculaire"
          className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="all">Tous les groupes</option>
          {(Object.entries(groupLabel) as [MuscleGroup, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | 'all')}
          aria-label="Filtrer par niveau de difficulté"
          className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="all">Tous niveaux</option>
          {(Object.entries(difficultyLabel) as [Difficulty, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.map((exercise) => {
          const isFavorite = favoriteIds.has(exercise.id)
          return (
            <li key={exercise.id} className="relative">
              {/* FIX (audit §7.6 a11y): previously a <button> nested inside <Link>,
                  which is invalid HTML. Now: a relative-positioned <li> containing
                  a <Link> + an absolutely-positioned favorite button overlaid. */}
              <Link
                to={`/exercises/${exercise.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-800/40 p-3 pr-12 transition-colors hover:bg-slate-800/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{exercise.name}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-sm" title={equipmentLabel[exercise.equipment]} aria-hidden="true">
                      {equipmentEmoji[exercise.equipment]}
                    </span>
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                      {groupLabel[exercise.muscleGroup]}
                    </span>
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-slate-400">{exercise.description}</p>
              </Link>
              <button
                onClick={() => toggleFavorite(exercise.id)}
                aria-label={isFavorite ? `Retirer ${exercise.name} des favoris` : `Ajouter ${exercise.name} aux favoris`}
                aria-pressed={isFavorite}
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="absolute right-3 top-3 text-slate-500 hover:text-amber-400"
              >
                <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-amber-400' : ''} />
              </button>
            </li>
          )
        })}
        {filtered.length === 0 && <p className="text-sm text-slate-500">Aucun exercice ne correspond aux filtres.</p>}
      </ul>
    </div>
  )
}
