import { describe, it, expect } from 'vitest'
import { estimateDayMinutes, estimateProgramAverageMinutes, totalSets } from './duration'
import type { Program, ProgramDay } from './types'

function makeSlot(exerciseId: string, sets: number, reps: string, restSeconds = 30) {
  return { exerciseId, sets, reps, restSeconds }
}

function makeDay(name: string, slots: ReturnType<typeof makeSlot>[]): ProgramDay {
  return { name, slots }
}

describe('estimateDayMinutes', () => {
  it('returns at least 1 minute for an empty day', () => {
    const day = makeDay('Vide', [])
    expect(estimateDayMinutes(day)).toBeGreaterThanOrEqual(1)
  })

  it('estimates a single 3x10 reps slot with 45s rest in a plausible range', () => {
    // 3 sets * 10 reps * 3 s = 90 s work
    // 2 rests * 45 s = 90 s rest
    // 1 transition * 15 s = 15 s
    // total = 195 s = 3.25 min -> rounded to 3 min
    const day = makeDay('Push', [makeSlot('pushup', 3, '8-12', 45)])
    const minutes = estimateDayMinutes(day)
    expect(minutes).toBeGreaterThanOrEqual(3)
    expect(minutes).toBeLessThanOrEqual(5)
  })

  it('parses time-based reps like "20-30s" correctly', () => {
    // 3 sets * 25 s avg = 75 s work
    // 2 rests * 30 s = 60 s rest
    // 1 transition = 15 s
    // total = 150 s = 2.5 min -> rounded to 3 min
    const day = makeDay('Plank', [makeSlot('plank', 3, '20-30s', 30)])
    const minutes = estimateDayMinutes(day)
    expect(minutes).toBeGreaterThanOrEqual(2)
    expect(minutes).toBeLessThanOrEqual(4)
  })

  it('falls back to 30s default work for unparsable reps like "AMRAP"', () => {
    // 3 sets * 30 s = 90 s work
    // 2 rests * 45 s = 90 s rest
    // 1 transition = 15 s
    // total = 195 s = 3.25 min -> 3 min
    const day = makeDay('AMRAP', [makeSlot('amrap-thing', 3, 'AMRAP', 45)])
    const minutes = estimateDayMinutes(day)
    expect(minutes).toBeGreaterThanOrEqual(3)
    expect(minutes).toBeLessThanOrEqual(5)
  })

  it('scales linearly with number of sets (single-reps slots)', () => {
    const short = makeDay('Short', [makeSlot('pushup', 2, '8-12', 30)])
    const long = makeDay('Long', [makeSlot('pushup', 6, '8-12', 30)])
    expect(estimateDayMinutes(long)).toBeGreaterThan(estimateDayMinutes(short))
  })
})

describe('totalSets', () => {
  it('sums sets across all slots', () => {
    const day = makeDay('Mixed', [
      makeSlot('pushup', 3, '8-12'),
      makeSlot('squat', 4, '12-15'),
      makeSlot('plank', 1, '30s'),
    ])
    expect(totalSets(day)).toBe(8)
  })

  it('returns 0 for an empty day', () => {
    expect(totalSets(makeDay('Empty', []))).toBe(0)
  })
})

describe('estimateProgramAverageMinutes', () => {
  it('returns the average of all days rounded', () => {
    const program: Program = {
      id: 'test-program',
      name: 'Test',
      difficulty: 'debutant',
      description: 'A test program',
      days: [
        makeDay('Day A', [makeSlot('pushup', 3, '8-12', 30)]),
        makeDay('Day B', [makeSlot('squat', 5, '12-15', 60)]),
      ],
    }
    const avg = estimateProgramAverageMinutes(program)
    expect(avg).toBeGreaterThan(0)
    // Both days should be in the 2-7 min range, avg between 2 and 7
    expect(avg).toBeGreaterThanOrEqual(2)
    expect(avg).toBeLessThanOrEqual(7)
  })

  it('does not crash on a single-day program', () => {
    const program: Program = {
      id: 'one-day',
      name: 'One',
      difficulty: 'intermediaire',
      description: 'Single day',
      days: [makeDay('Only', [makeSlot('pushup', 3, '8-12', 45)])],
    }
    const avg = estimateProgramAverageMinutes(program)
    expect(avg).toBeGreaterThan(0)
  })
})
