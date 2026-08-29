import type { Equipment, Exercise, Program, ProgramDay } from './types'
import { getExerciseById } from '../data/exercises'

export const equipmentLabel: Record<Equipment, string> = {
  none: 'Aucun équipement',
  chair: 'Chaise',
}

export const equipmentBadge: Record<Equipment, string> = {
  none: '🏠 Aucun équipement',
  chair: '🪑 Chaise nécessaire',
}

export const equipmentEmoji: Record<Equipment, string> = {
  none: '🏠',
  chair: '🪑',
}

/** A day needs a chair if any of its exercises does. */
export function dayEquipment(day: ProgramDay): Equipment {
  const usesChair = day.slots.some((slot) => getExerciseById(slot.exerciseId)?.equipment === 'chair')
  return usesChair ? 'chair' : 'none'
}

/** A program needs a chair if any of its days does. */
export function programEquipment(program: Program): Equipment {
  const usesChair = program.days.some((day) => dayEquipment(day) === 'chair')
  return usesChair ? 'chair' : 'none'
}

export function exerciseEquipmentSafetyNote(exercise: Exercise): string | undefined {
  if (exercise.equipment !== 'chair') return undefined
  return (
    exercise.chairSafetyNote ??
    'Utilise une chaise stable, sans roulettes, posée sur un sol plat et non glissant. Écarte tout risque de bascule avant de commencer.'
  )
}
