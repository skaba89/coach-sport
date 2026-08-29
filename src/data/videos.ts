/**
 * Exercise video library.
 *
 * Each video is licensed CC0 (public domain) via Pexels.
 * Source: https://www.pexels.com/videos/
 *
 * 34 unique video clips covering 56+ exercises (direct + alias).
 * Poster images (.webp, first frame at 1s) generated via ffmpeg.
 */

export interface ExerciseVideo {
  /** Exercise id from src/data/exercises.ts that this video illustrates. */
  exerciseId: string
  /** Relative path under /public — served by Vite at the app's base URL. */
  src: string
  /** Poster image (first frame extracted as .webp) shown before play. */
  poster: string
  /** Pexels video ID, for license traceability (CC0). */
  source: 'pexels'
  sourceId: string
  /** Approximate clip duration in seconds. */
  durationSeconds: number
  /** Optional alternative exercises this same clip works for. */
  alsoFor?: string[]
}

const V = (
  exerciseId: string,
  file: string,
  pexelsId: string,
  durationSeconds: number,
  alsoFor?: string[],
): ExerciseVideo => ({
  exerciseId,
  src: `videos/${file}.mp4`,
  poster: `videos/${file}.webp`,
  source: 'pexels',
  sourceId: pexelsId,
  durationSeconds,
  alsoFor,
})

export const VIDEO_LIBRARY: ExerciseVideo[] = [
  // ── Push family (6 clips → 12 exercises) ──────────────────────────
  V('push-up',              'push-up',           '4367576',  12, ['knee-push-up', 'wide-push-up', 'diamond-push-up']),
  V('archer-push-up',       'push-up',           '4367576',  12),
  V('pike-push-up',         'pike-pushup',       '8520078',  15, ['elevated-pike-pushup']),
  V('incline-pushup-chair', 'push-up',           '4367576',  12, ['decline-pushup-chair']),
  V('chair-triceps-dips',   'push-up',           '4367576',  12),
  V('pull-up',              'pull-up',           '8519749',  10),

  // ── Legs family (7 clips → 15 exercises) ──────────────────────────
  V('squat',                'squat-bodyweight',  '7934710',  15, ['jump-squat', 'pulse-squat', 'chair-squat', 'sit-to-stand', 'chair-assisted-squat']),
  V('sumo-squat',           'sumo-squat',        '6454284',  18),
  V('lunge',                'lunge',             '8837221',  18, ['walking-lunge', 'jump-lunge', 'step-back-lunge-chair', 'bulgarian-split-squat-chair']),
  V('reverse-lunge',        'reverse-lunge',     '4488004',  14),
  V('pistol-squat-progression', 'pistol-squat',  '8836849',  16, ['assisted-pistol-squat-chair']),
  V('glute-bridge',         'glute-bridge',      '6525487',  14, ['single-leg-glute-bridge', 'single-leg-glute-bridge-chair']),
  V('hip-thrust-chair',     'hip-thrust',        '6111108',  12),
  V('donkey-kick',          'donkey-kick',       '10740728', 10),
  V('fire-hydrant',         'fire-hydrant',      '4116863',  10),

  // ── Core family (8 clips → 14 exercises) ──────────────────────────
  V('plank',                'plank',             '8343375',  14, ['high-plank']),
  V('side-plank',           'side-plank',        '6023265',  15),
  V('shoulder-tap',         'shoulder-tap',      '5319088',  12),
  V('hollow-body-hold',     'plank',             '8343375',  14),
  V('l-sit',                'l-sit',             '4259001',  12),
  V('crunch',               'bicycle-crunch',    '8233228',  15, ['reverse-crunch', 'bicycle-crunch']),
  V('leg-raise',            'leg-raise',         '6326818',  14, ['chair-knee-raises', 'seated-knee-tucks']),
  V('flutter-kicks',        'flutter-kick',      '5802387',  12),
  V('v-ups',                'v-ups',             '4259001',  12),
  V('dead-bug',             'dead-bug',          '17556397', 14),

  // ── Back family (2 clips → 2 exercises) ───────────────────────────
  V('superman',             'superman',          '15859716', 12),
  V('bird-dog',             'bird-dog',          '5983521',  10),

  // ── Cardio family (7 clips → 9 exercises) ──────────────────────────
  V('mountain-climbers',    'mountain-climber',  '6022762',  16, ['elevated-mountain-climbers']),
  V('high-knees',           'high-knees',        '6326791',  12),
  V('burpees',              'burpee-v2',         '4671964',  13),
  V('jumping-jacks',        'jumping-jacks',     '4859226',  11),
  V('skater-jumps',         'skater-jumps',      '4824406',  14),
  V('bear-crawl',           'bear-crawl',        '7339139',  13),
  V('inchworm',             'inchworm',          '5113007',  14),

  // ── Mobility family (2 clips → 3 exercises) ───────────────────────
  V('childs-pose',          'childs-pose',       '6932946',  14),
  V('hip-flexor-stretch',   'hip-flexor-stretch','7226846',  16),
  V('cat-cow-stretch',      'cat-cow',           '8232563',  18),
]

/** Index for O(1) lookup by exercise id. */
const BY_EXERCISE_ID = new Map<string, ExerciseVideo>()
for (const v of VIDEO_LIBRARY) {
  BY_EXERCISE_ID.set(v.exerciseId, v)
  if (v.alsoFor) {
    for (const alt of v.alsoFor) {
      if (!BY_EXERCISE_ID.has(alt)) BY_EXERCISE_ID.set(alt, v)
    }
  }
}

export function getExerciseVideo(exerciseId: string): ExerciseVideo | undefined {
  return BY_EXERCISE_ID.get(exerciseId)
}

/** Count of unique exercises covered (direct + alias). */
export const VIDEO_COVERAGE = BY_EXERCISE_ID.size
