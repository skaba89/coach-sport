import { describe, it, expect } from 'vitest'
import { parseTarget, targetToString, type ExerciseTarget } from './types'

describe('parseTarget', () => {
  it('parses AMRAP', () => {
    expect(parseTarget('AMRAP')).toEqual({ metricType: 'amrap' })
    expect(parseTarget('amrap')).toEqual({ metricType: 'amrap' })
    expect(parseTarget('MAX')).toEqual({ metricType: 'amrap' })
  })

  it('parses a rep range like "8-12"', () => {
    expect(parseTarget('8-12')).toEqual({
      metricType: 'reps',
      targetMin: 8,
      targetMax: 12,
      perSide: false,
    })
  })

  it('parses a rep range with perSide like "3-6 / bras"', () => {
    expect(parseTarget('3-6 / bras')).toEqual({
      metricType: 'reps',
      targetMin: 3,
      targetMax: 6,
      perSide: true,
    })
  })

  it('parses a single rep count like "10"', () => {
    expect(parseTarget('10')).toEqual({
      metricType: 'reps',
      targetMin: 10,
      targetMax: 10,
    })
  })

  it('parses a time-based target like "30s"', () => {
    expect(parseTarget('30s')).toEqual({
      metricType: 'duration',
      targetSeconds: 30,
    })
  })

  it('parses a time range like "20-30s"', () => {
    expect(parseTarget('20-30s')).toEqual({
      metricType: 'duration',
      targetSeconds: 25,
    })
  })

  it('parses "45s" with space', () => {
    expect(parseTarget('45 s')).toEqual({
      metricType: 'duration',
      targetSeconds: 45,
    })
  })

  it('falls back to AMRAP for unrecognized formats', () => {
    expect(parseTarget('hello')).toEqual({ metricType: 'amrap' })
    expect(parseTarget('')).toEqual({ metricType: 'amrap' })
  })
})

describe('targetToString', () => {
  it('formats a rep range', () => {
    const target: ExerciseTarget = { metricType: 'reps', targetMin: 8, targetMax: 12 }
    expect(targetToString(target)).toBe('8-12')
  })

  it('formats a single rep count', () => {
    const target: ExerciseTarget = { metricType: 'reps', targetMin: 10, targetMax: 10 }
    expect(targetToString(target)).toBe('10')
  })

  it('formats perSide', () => {
    const target: ExerciseTarget = { metricType: 'reps', targetMin: 3, targetMax: 6, perSide: true }
    expect(targetToString(target)).toBe('3-6 / côté')
  })

  it('formats duration', () => {
    const target: ExerciseTarget = { metricType: 'duration', targetSeconds: 30 }
    expect(targetToString(target)).toBe('30s')
  })

  it('formats AMRAP', () => {
    const target: ExerciseTarget = { metricType: 'amrap' }
    expect(targetToString(target)).toBe('AMRAP')
  })
})

describe('parseTarget → targetToString round-trip', () => {
  it('round-trips a rep range', () => {
    const target = parseTarget('8-12')
    const str = targetToString(target)
    expect(str).toBe('8-12')
  })

  it('round-trips AMRAP', () => {
    const target = parseTarget('AMRAP')
    expect(targetToString(target)).toBe('AMRAP')
  })

  it('round-trips duration', () => {
    const target = parseTarget('45s')
    expect(targetToString(target)).toBe('45s')
  })
})
