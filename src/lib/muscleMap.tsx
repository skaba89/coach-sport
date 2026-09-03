/**
 * Muscle Map — visual body map showing which muscle groups have been worked.
 *
 * Features:
 * - SVG body silhouette with color-coded muscle groups
 * - Intensity based on recent session volume per group
 * - Click a muscle group to see exercises targeting it
 * - Recovery state overlay (green=recovered, amber=partial, red=fatigued)
 */


import type { WorkoutSession, MuscleGroup } from './types'
import { getExerciseById } from '../data/exercises'
import { computeRecovery } from './coachEngine'

export interface MuscleGroupStats {
  group: MuscleGroup
  totalSets: number
  totalReps: number
  lastWorked: string | null
  recoveryPercent: number
  /** Intensity 0-1 for color coding */
  intensity: number
}

export function computeMuscleStats(sessions: WorkoutSession[]): Record<MuscleGroup, MuscleGroupStats> {
  const now = new Date()
  const recovery = computeRecovery(sessions, now)

  const stats = {} as Record<MuscleGroup, MuscleGroupStats>
  const groups: MuscleGroup[] = ['push', 'legs', 'core', 'back', 'cardio', 'mobility']

  // Compute volume per group from all sessions
  const volumeByGroup: Record<string, { sets: number; reps: number; lastDate: string | null }> = {}
  for (const g of groups) {
    volumeByGroup[g] = { sets: 0, reps: 0, lastDate: null }
  }

  for (const session of sessions) {
    if (!session.finishedAt) continue
    for (const log of session.logs) {
      if (!log.completed) continue
      const ex = getExerciseById(log.exerciseId)
      if (!ex) continue
      const v = volumeByGroup[ex.muscleGroup]
      if (v) {
        v.sets += 1
        v.reps += log.reps
        if (!v.lastDate || session.startedAt > v.lastDate) {
          v.lastDate = session.startedAt
        }
      }
    }
  }

  // Find max volume for normalization
  const maxVolume = Math.max(1, ...groups.map((g) => volumeByGroup[g].reps))

  for (const group of groups) {
    const v = volumeByGroup[group]
    stats[group] = {
      group,
      totalSets: v.sets,
      totalReps: v.reps,
      lastWorked: v.lastDate,
      recoveryPercent: recovery[group].recoveryPercent,
      intensity: v.reps / maxVolume,
    }
  }

  return stats
}

/**
 * Get color for a muscle group based on intensity + recovery.
 * - No work: gray
 * - Recently worked + low recovery: red/amber
 * - Worked + recovered: green
 */
export function getMuscleColor(stats: MuscleGroupStats): { fill: string; label: string } {
  if (stats.totalReps === 0) {
    return { fill: '#334155', label: 'Non travaillé' }
  }

  if (stats.recoveryPercent < 50) {
    return { fill: '#f87171', label: 'En récupération' }
  } else if (stats.recoveryPercent < 80) {
    return { fill: '#fbbf24', label: 'Récupération partielle' }
  } else {
    return { fill: '#34d399', label: 'Récupéré' }
  }
}

/**
 * SVG body map with clickable muscle groups.
 * Simplified silhouette — not anatomically perfect, just enough to
 * communicate which areas have been worked.
 */
export function MuscleMap({ stats, onGroupClick }: {
  stats: Record<MuscleGroup, MuscleGroupStats>
  onGroupClick?: (group: MuscleGroup) => void
}) {
  const groupLabels: Record<MuscleGroup, string> = {
    push: 'Push',
    legs: 'Jambes',
    core: 'Core',
    back: 'Dos',
    cardio: 'Cardio',
    mobility: 'Mobilité',
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 400" className="h-80 w-40" role="img" aria-label="Carte musculaire">
        {/* Head */}
        <circle cx="100" cy="30" r="20" fill="#1e293b" stroke="#334155" strokeWidth="1" />

        {/* Neck */}
        <rect x="92" y="48" width="16" height="12" fill="#1e293b" stroke="#334155" strokeWidth="1" />

        {/* Push (chest/shoulders/arms) */}
        <g onClick={() => onGroupClick?.('push')} className="cursor-pointer">
          <ellipse cx="100" cy="75" rx="35" ry="20" fill={getMuscleColor(stats.push).fill} stroke="#475569" strokeWidth="1" opacity="0.8" />
          <title>{groupLabels.push}: {stats.push.totalReps} reps, {stats.push.recoveryPercent}% récupéré</title>
        </g>

        {/* Shoulders */}
        <ellipse cx="60" cy="70" rx="15" ry="12" fill={getMuscleColor(stats.push).fill} stroke="#475569" strokeWidth="1" opacity="0.6" />
        <ellipse cx="140" cy="70" rx="15" ry="12" fill={getMuscleColor(stats.push).fill} stroke="#475569" strokeWidth="1" opacity="0.6" />

        {/* Arms */}
        <rect x="35" y="80" width="18" height="60" rx="9" fill={getMuscleColor(stats.push).fill} stroke="#475569" strokeWidth="1" opacity="0.5" />
        <rect x="147" y="80" width="18" height="60" rx="9" fill={getMuscleColor(stats.push).fill} stroke="#475569" strokeWidth="1" opacity="0.5" />

        {/* Back (upper back) */}
        <g onClick={() => onGroupClick?.('back')} className="cursor-pointer">
          <ellipse cx="100" cy="105" rx="30" ry="18" fill={getMuscleColor(stats.back).fill} stroke="#475569" strokeWidth="1" opacity="0.7" />
          <title>{groupLabels.back}: {stats.back.totalReps} reps, {stats.back.recoveryPercent}% récupéré</title>
        </g>

        {/* Core (abs) */}
        <g onClick={() => onGroupClick?.('core')} className="cursor-pointer">
          <ellipse cx="100" cy="140" rx="28" ry="25" fill={getMuscleColor(stats.core).fill} stroke="#475569" strokeWidth="1" opacity="0.7" />
          <title>{groupLabels.core}: {stats.core.totalReps} reps, {stats.core.recoveryPercent}% récupéré</title>
        </g>

        {/* Legs (quads/glutes) */}
        <g onClick={() => onGroupClick?.('legs')} className="cursor-pointer">
          <ellipse cx="85" cy="190" rx="20" ry="30" fill={getMuscleColor(stats.legs).fill} stroke="#475569" strokeWidth="1" opacity="0.7" />
          <ellipse cx="115" cy="190" rx="20" ry="30" fill={getMuscleColor(stats.legs).fill} stroke="#475569" strokeWidth="1" opacity="0.7" />
          <title>{groupLabels.legs}: {stats.legs.totalReps} reps, {stats.legs.recoveryPercent}% récupéré</title>
        </g>

        {/* Lower legs */}
        <rect x="75" y="220" width="15" height="60" rx="7" fill={getMuscleColor(stats.legs).fill} stroke="#475569" strokeWidth="1" opacity="0.5" />
        <rect x="110" y="220" width="15" height="60" rx="7" fill={getMuscleColor(stats.legs).fill} stroke="#475569" strokeWidth="1" opacity="0.5" />

        {/* Cardio (heart area) */}
        <g onClick={() => onGroupClick?.('cardio')} className="cursor-pointer">
          <circle cx="85" cy="85" r="8" fill={getMuscleColor(stats.cardio).fill} stroke="#475569" strokeWidth="1" opacity="0.6" />
          <title>{groupLabels.cardio}: {stats.cardio.totalReps} reps, {stats.cardio.recoveryPercent}% récupéré</title>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        {(['push', 'back', 'core', 'legs', 'cardio'] as MuscleGroup[]).map((g) => {
          const color = getMuscleColor(stats[g])
          return (
            <button
              key={g}
              onClick={() => onGroupClick?.(g)}
              className="flex items-center gap-1.5"
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.fill }} />
              <span className="text-slate-400">{groupLabels[g]}</span>
              <span className="text-slate-600">({stats[g].totalReps})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
