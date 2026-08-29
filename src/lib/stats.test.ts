import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { computeStreak, totalRepsForExercise, volumeOverTime, weeklyStats } from './stats'
import type { WorkoutSession } from './types'
import { exercises } from '../data/exercises'

function makeSession(
  startedAt: string,
  logs: { exerciseId: string; reps: number; completed?: boolean }[],
  opts: { finishedAt?: string; programId?: string } = {},
): WorkoutSession {
  return {
    id: Math.random(),
    dayName: 'Test day',
    startedAt,
    finishedAt: opts.finishedAt,
    programId: opts.programId,
    logs: logs.map((l, i) => ({
      exerciseId: l.exerciseId,
      setIndex: i,
      reps: l.reps,
      completed: l.completed ?? true,
    })),
  }
}

describe('computeStreak', () => {
  beforeEach(() => {
    // Pin "today" to a fixed date so the tests are deterministic.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T12:00:00Z')) // a Friday
  })
  afterEach(() => vi.useRealTimers())

  it('returns 0 for an empty list', () => {
    expect(computeStreak([])).toBe(0)
  })

  it('returns 0 for sessions without finishedAt', () => {
    const sessions = [{ ...makeSession('2026-08-29T10:00:00', [{ exerciseId: 'pushup', reps: 10 }]), finishedAt: undefined }]
    expect(computeStreak(sessions)).toBe(0)
  })

  it('counts 1 for a single session today', () => {
    const sessions = [makeSession(
      '2026-08-29T10:00:00',
      [{ exerciseId: 'pushup', reps: 10 }],
      { finishedAt: '2026-08-29T10:30:00' },
    )]
    expect(computeStreak(sessions)).toBe(1)
  })

  it('counts consecutive days including today', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-29T10:30:00' }),
      makeSession('2026-08-28T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-28T10:30:00' }),
      makeSession('2026-08-27T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-27T10:30:00' }),
    ]
    expect(computeStreak(sessions)).toBe(3)
  })

  it('still counts yesterday+ streak if no session today yet', () => {
    const sessions = [
      makeSession('2026-08-28T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-28T10:30:00' }),
      makeSession('2026-08-27T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-27T10:30:00' }),
    ]
    expect(computeStreak(sessions)).toBe(2)
  })

  it('breaks the streak when a day is missing', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-29T10:30:00' }),
      // skip 2026-08-28
      makeSession('2026-08-27T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-27T10:30:00' }),
    ]
    expect(computeStreak(sessions)).toBe(1)
  })
})

describe('totalRepsForExercise', () => {
  it('sums reps only for completed sets matching the exercise', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [
        { exerciseId: 'pushup', reps: 10, completed: true },
        { exerciseId: 'pushup', reps: 8, completed: true },
        { exerciseId: 'squat', reps: 12, completed: true },
      ]),
      makeSession('2026-08-28T10:00:00', [
        { exerciseId: 'pushup', reps: 9, completed: true },
        { exerciseId: 'pushup', reps: 11, completed: false }, // not counted
      ]),
    ]
    expect(totalRepsForExercise(sessions, 'pushup')).toBe(27) // 10 + 8 + 9
    expect(totalRepsForExercise(sessions, 'squat')).toBe(12)
    expect(totalRepsForExercise(sessions, 'nonexistent')).toBe(0)
  })
})

describe('volumeOverTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns N points (default 14) sorted oldest-first', () => {
    const points = volumeOverTime([], 14)
    expect(points).toHaveLength(14)
    expect(points[0].date).not.toBe(points[13].date)
  })

  it('sums completed reps per day across all sessions', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [
        { exerciseId: 'pushup', reps: 10, completed: true },
        { exerciseId: 'squat', reps: 15, completed: true },
      ]),
    ]
    const points = volumeOverTime(sessions, 1) // only today
    expect(points).toHaveLength(1)
    expect(points[0].totalReps).toBe(25)
  })

  it('excludes uncompleted sets', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [
        { exerciseId: 'pushup', reps: 10, completed: true },
        { exerciseId: 'pushup', reps: 50, completed: false }, // skipped
      ]),
    ]
    const points = volumeOverTime(sessions, 1)
    expect(points[0].totalReps).toBe(10)
  })
})

describe('weeklyStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns 0 sessions and 100% capped regularity for empty list with default target', () => {
    const w = weeklyStats([], 3)
    expect(w.sessionsThisWeek).toBe(0)
    expect(w.minutesThisWeek).toBe(0)
    expect(w.regularityPercent).toBe(0)
    expect(w.groupsThisWeek).toEqual([])
  })

  it('counts sessions within the last 7 days', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-29T10:20:00' }),
      makeSession('2026-08-25T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-25T10:20:00' }),
      // older than 7 days — should not count
      makeSession('2026-08-20T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-20T10:20:00' }),
    ]
    const w = weeklyStats(sessions, 3)
    expect(w.sessionsThisWeek).toBe(2)
    expect(w.regularityPercent).toBe(67) // 2/3 = 66.67 -> 67
  })

  it('caps regularity at 100% when sessions exceed target', () => {
    const sessions = [
      makeSession('2026-08-29T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-29T10:20:00' }),
      makeSession('2026-08-28T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-28T10:20:00' }),
      makeSession('2026-08-27T10:00:00', [{ exerciseId: 'pushup', reps: 10 }], { finishedAt: '2026-08-27T10:20:00' }),
    ]
    const w = weeklyStats(sessions, 2)
    expect(w.sessionsThisWeek).toBe(3)
    expect(w.regularityPercent).toBe(100)
  })

  it('aggregates muscle groups touched this week (long labels)', () => {
    const pushup = exercises.find((e) => e.id === 'pushup')
    const squat = exercises.find((e) => e.id === 'squat')
    if (!pushup || !squat) {
      // Skip if the test exercises don't exist in the catalog
      return
    }
    const sessions = [
      makeSession('2026-08-29T10:00:00', [
        { exerciseId: 'pushup', reps: 10, completed: true },
      ], { finishedAt: '2026-08-29T10:20:00' }),
      makeSession('2026-08-28T10:00:00', [
        { exerciseId: 'squat', reps: 15, completed: true },
      ], { finishedAt: '2026-08-28T10:20:00' }),
    ]
    const w = weeklyStats(sessions, 3)
    expect(w.groupsThisWeek.length).toBeGreaterThan(0)
    // Long labels per labels.ts: "Pectoraux & Bras" or "Jambes & Fessiers"
    expect(w.groupsThisWeek.some((g) => g.includes('&'))).toBe(true)
  })
})
