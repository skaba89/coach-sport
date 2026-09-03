import { describe, it, expect } from 'vitest'
import { getExerciseById } from '../data/exercises'
import {
  computeRecovery,
  decideProgression,
  generateWeeklyPlan,
  buildSkillGraph,
  recommendProgression,
  type CoachProfile,
} from './coachEngine'
import type { WorkoutSession, Rpe } from './types'

// ─── Test fixtures ─────────────────────────────────────────────────

const baseProfile: CoachProfile = {
  goal: 'renforcement',
  level: 'debutant',
  frequency: 3,
  availableDays: [1, 3, 5], // Mon, Wed, Fri
  durationMinutes: 20,
  equipment: 'none',
  preferences: [],
}

function makeSession(
  startedAt: string,
  exerciseIds: string[],
  rpe?: Rpe,
): WorkoutSession {
  return {
    id: Math.random(),
    dayName: 'Test',
    startedAt,
    finishedAt: startedAt,
    rpe,
    logs: exerciseIds.map((exerciseId, i) => ({
      exerciseId,
      setIndex: i,
      reps: 10,
      completed: true,
    })),
}
  }

// ─── Recovery Engine ───────────────────────────────────────────────

describe('computeRecovery', () => {
  it('returns 100% recovery for all groups when no sessions exist', () => {
    const recovery = computeRecovery([])
    expect(recovery.push.recoveryPercent).toBe(100)
    expect(recovery.legs.recoveryPercent).toBe(100)
    expect(recovery.core.recoveryPercent).toBe(100)
    expect(recovery.push.lastWorked).toBeNull()
  })

  it('returns < 100% recovery for groups worked recently', () => {
    const now = new Date('2026-01-15T10:00:00Z')
    const recentSession = makeSession('2026-01-14T10:00:00Z', ['push-up'])
    const recovery = computeRecovery([recentSession], now)

    // push was worked 24h ago → 24/48 = 50% recovery
    expect(recovery.push.recoveryPercent).toBe(50)
    expect(recovery.push.lastWorked).toBe('2026-01-14T10:00:00Z')
    expect(recovery.legs.recoveryPercent).toBe(100) // legs not worked
  })

  it('returns 100% recovery for groups worked > 48h ago', () => {
    const now = new Date('2026-01-15T10:00:00Z')
    const oldSession = makeSession('2026-01-12T10:00:00Z', ['squat'])
    const recovery = computeRecovery([oldSession], now)

    expect(recovery.legs.recoveryPercent).toBe(100)
  })
})

// ─── RPE-based Progression ─────────────────────────────────────────

describe('decideProgression', () => {
  it('maintains when no history', () => {
    const decision = decideProgression([], '8-12', 3)
    expect(decision.action).toBe('maintain')
  })

  it('decreases when last RPE is tres-difficile', () => {
    const decision = decideProgression(['tres-difficile'], '8-12', 4)
    expect(decision.action).toBe('decrease')
    expect(decision.newSets).toBe(3)
  })

  it('increases reps after 2+ easy sessions', () => {
    const decision = decideProgression(['facile', 'facile'], '8-12', 3)
    expect(decision.action).toBe('increase-reps')
    expect(decision.newTarget).toBeTruthy()
    // Should increase the upper bound
    expect(decision.newTarget).toMatch(/-1[34]/) // 9-13 or 9-14
  })

  it('triggers deload after 2+ hard sessions', () => {
    const decision = decideProgression(['difficile', 'tres-difficile'], '8-12', 4)
    expect(decision.action).toBe('deload')
  })

  it('maintains on correct RPE', () => {
    const decision = decideProgression(['correct'], '8-12', 3)
    expect(decision.action).toBe('maintain')
  })
})

// ─── Weekly Plan Generator ─────────────────────────────────────────

describe('generateWeeklyPlan', () => {
  it('generates a plan with the right number of sessions', () => {
    const recovery = computeRecovery([])
    const week = generateWeeklyPlan(baseProfile, recovery)

    const sessionDays = week.days.filter((d) => !d.isRest)
    expect(sessionDays.length).toBe(3) // frequency = 3
  })

  it('places sessions on available days', () => {
    const recovery = computeRecovery([])
    const week = generateWeeklyPlan(baseProfile, recovery)

    const sessionDayNumbers = week.days.filter((d) => !d.isRest).map((d) => d.dayOfWeek)
    expect(sessionDayNumbers).toContain(1) // Monday
    expect(sessionDayNumbers).toContain(3) // Wednesday
    expect(sessionDayNumbers).toContain(5) // Friday
  })

  it('includes rest days', () => {
    const recovery = computeRecovery([])
    const week = generateWeeklyPlan(baseProfile, recovery)

    const restDays = week.days.filter((d) => d.isRest)
    expect(restDays.length).toBe(4) // 7 - 3 sessions = 4 rest days
  })

  it('each prescription has a rationale', () => {
    const recovery = computeRecovery([])
    const week = generateWeeklyPlan(baseProfile, recovery)

    for (const day of week.days) {
      if (day.prescription) {
        expect(day.prescription.rationale).toBeTruthy()
        expect(day.prescription.rationale.length).toBeGreaterThan(10)
      }
    }
  })

  it('respects sans-sauts preference', () => {
    const profile: CoachProfile = {
      ...baseProfile,
      preferences: ['sans-sauts'],
    }
    const recovery = computeRecovery([])
    const week = generateWeeklyPlan(profile, recovery)

    for (const day of week.days) {
      if (day.prescription) {
        for (const slot of day.prescription.slots) {
          const ex = getExerciseById(slot.exerciseId)
          if (ex) {
            expect(ex.highImpact).toBeFalsy()
          }
        }
      }
    }
  })

  it('goal=mobilite produces mobility-focused sessions', () => {
    const profile: CoachProfile = {
      ...baseProfile,
      goal: 'mobilite',
    }
    const recovery = computeRecovery([])
    const week = generateWeeklyPlan(profile, recovery)

    const sessionDays = week.days.filter((d) => !d.isRest)
    expect(sessionDays.length).toBeGreaterThan(0)
    // At least one session should have mobility focus
    const hasMobility = sessionDays.some(
      (d) => d.prescription?.focus === 'mobility',
    )
    expect(hasMobility).toBe(true)
  })
})

// ─── Skill Graph ───────────────────────────────────────────────────

describe('buildSkillGraph', () => {
  it('builds a graph with all exercises', () => {
    const graph = buildSkillGraph()
    expect(graph.size).toBeGreaterThan(50) // we have 125+ exercises
  })

  it('push-up has knee-push-up as prerequisite', () => {
    const graph = buildSkillGraph()
    const pushUp = graph.get('push-up')
    expect(pushUp).toBeDefined()
    expect(pushUp!.prerequisites).toContain('knee-push-up')
  })

  it('knee-push-up has push-up as progression', () => {
    const graph = buildSkillGraph()
    const kneePushUp = graph.get('knee-push-up')
    expect(kneePushUp).toBeDefined()
    expect(kneePushUp!.progressions).toContain('push-up')
  })
})

describe('recommendProgression', () => {
  it('returns null when not enough successful sessions', () => {
    const sessions = [
      makeSession('2026-01-01', ['push-up'], 'facile'),
    ]
    const result = recommendProgression('push-up', sessions)
    expect(result).toBeNull()
  })

  it('recommends progression after 3+ successful sessions', () => {
    const sessions = [
      makeSession('2026-01-01', ['knee-push-up'], 'facile'),
      makeSession('2026-01-03', ['knee-push-up'], 'correct'),
      makeSession('2026-01-05', ['knee-push-up'], 'facile'),
    ]
    const result = recommendProgression('knee-push-up', sessions)
    expect(result).not.toBeNull()
    expect(result!.nextExerciseId).toBe('push-up')
    expect(result!.reason).toContain('maîtrises')
  })

  it('returns null when exercise has no progression', () => {
    const result = recommendProgression('cat-cow-stretch', [])
    expect(result).toBeNull()
  })
})
