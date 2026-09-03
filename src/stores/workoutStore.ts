import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProgramDay, ProgramExerciseSlot, SetLog } from '../lib/types'

/**
 * Active workout with FULL prescription preserved.
 *
 * Lot 0.4 fix: previously, startWorkout() only kept SetLog[] (exerciseId,
 * setIndex, reps, completed) — losing restSeconds, target reps, and the
 * slot metadata. Now we keep the full slots array so generated workouts
 * (which have no programId to look up) still show their target reps and
 * rest timer.
 *
 * Lot 0.5 fix: the store is now persisted to localStorage via zustand's
 * persist middleware. A refresh no longer loses the active workout.
 */
interface ActiveWorkoutSlot {
  exerciseId: string
  targetReps: string      // e.g. "8-12", "30s", "AMRAP"
  restSeconds: number
  sets: SetLog[]
}

interface ActiveWorkout {
  programId?: string
  source: 'program' | 'generated' | 'quick'
  dayName: string
  startedAt: string
  slots: ActiveWorkoutSlot[]
  /** Flat list of all set logs — derived from slots for backward compat
   * with the WorkoutSession schema (which uses a flat logs array). */
  logs: SetLog[]
}

interface WorkoutState {
  active: ActiveWorkout | null
  startWorkout: (day: ProgramDay, programId?: string) => void
  logSet: (exerciseId: string, setIndex: number, reps: number, weightKg?: number) => void
  clearWorkout: () => void
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      active: null,

      startWorkout: (day, programId) => {
        // Build slots with full prescription preserved
        const slots: ActiveWorkoutSlot[] = day.slots.map((slot: ProgramExerciseSlot) => ({
          exerciseId: slot.exerciseId,
          targetReps: slot.reps,
          restSeconds: slot.restSeconds,
          sets: Array.from({ length: slot.sets }, (_, i) => ({
            exerciseId: slot.exerciseId,
            setIndex: i,
            reps: 0,
            completed: false,
          })),
        }))

        // Flat logs array for backward compat with WorkoutSession
        const logs: SetLog[] = slots.flatMap((s) => s.sets)

        set({
          active: {
            programId,
            source: programId ? 'program' : 'generated',
            dayName: day.name,
            startedAt: new Date().toISOString(),
            slots,
            logs,
          },
        })
      },

      logSet: (exerciseId, setIndex, reps, weightKg) =>
        set((state) => {
          if (!state.active) return state
          // Update both the flat logs and the nested slots
          const updateLog = (log: SetLog) =>
            log.exerciseId === exerciseId && log.setIndex === setIndex
              ? { ...log, reps, weightKg, completed: true }
              : log

          const logs = state.active.logs.map(updateLog)
          const slots = state.active.slots.map((slot) =>
            slot.exerciseId === exerciseId
              ? { ...slot, sets: slot.sets.map(updateLog) }
              : slot,
          )

          return { active: { ...state.active, logs, slots } }
        }),

      clearWorkout: () => set({ active: null }),
    }),
    {
      name: 'calisthenies.active-workout',
      // Only persist the active workout, not the functions
      partialize: (state) => ({ active: state.active }),
    },
  ),
)
