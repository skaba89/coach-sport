import type { Program, ProgramDay, ProgramExerciseSlot } from './types'

const SECONDS_PER_REP = 3 // rough concentric + eccentric time
const DEFAULT_WORK_SECONDS = 30 // fallback for "AMRAP" / "Max" / unparsable targets
const TRANSITION_SECONDS = 15 // time to get set up for the next exercise

/** Extracts the average working time (seconds) for one set from a "reps" label
 * like "8-12", "10-12 / jambe", "20-30s", "AMRAP" or "Max". */
function estimateSetSeconds(reps: string): number {
  const timeMatch = reps.match(/(\d+)(?:-(\d+))?\s*s/i)
  if (timeMatch) {
    const lo = Number(timeMatch[1])
    const hi = timeMatch[2] ? Number(timeMatch[2]) : lo
    return (lo + hi) / 2
  }

  const repsMatch = reps.match(/(\d+)(?:-(\d+))?/)
  if (repsMatch) {
    const lo = Number(repsMatch[1])
    const hi = repsMatch[2] ? Number(repsMatch[2]) : lo
    return ((lo + hi) / 2) * SECONDS_PER_REP
  }

  return DEFAULT_WORK_SECONDS
}

function estimateSlotSeconds(slot: ProgramExerciseSlot): number {
  const workPerSet = estimateSetSeconds(slot.reps)
  return slot.sets * workPerSet + Math.max(0, slot.sets - 1) * slot.restSeconds
}

/** Estimated total duration of a training day, in minutes (rounded). */
export function estimateDayMinutes(day: ProgramDay): number {
  const totalSeconds = day.slots.reduce(
    (sum, slot) => sum + estimateSlotSeconds(slot) + TRANSITION_SECONDS,
    0,
  )
  return Math.max(1, Math.round(totalSeconds / 60))
}

/** Total number of sets across all exercises of a day. */
export function totalSets(day: ProgramDay): number {
  return day.slots.reduce((sum, slot) => sum + slot.sets, 0)
}

/** Average estimated session duration across all days of a program, in minutes. */
export function estimateProgramAverageMinutes(program: Program): number {
  const total = program.days.reduce((sum, day) => sum + estimateDayMinutes(day), 0)
  return Math.round(total / program.days.length)
}
