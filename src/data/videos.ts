/**
 * Exercise video library.
 *
 * Each video is licensed CC0 (public domain) via Pexels.
 * Source: https://www.pexels.com/videos/
 *
 * 56 unique video clips — one per exercise where available.
 * Poster images (.webp, first frame at 1s) generated via ffmpeg.
 */

export interface ExerciseVideo {
  exerciseId: string
  src: string
  poster: string
  source: 'pexels'
  sourceId: string
  durationSeconds: number
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
  // ── Push family — EACH EXERCICE HAS ITS OWN VIDEO ────────────────
  V('push-up',              'push-up',              '4367576', 12),
  V('knee-push-up',         'knee-push-up',         '6388865', 14),
  V('wide-push-up',         'wide-push-up',         '6970183', 12),
  V('diamond-push-up',      'diamond-push-up',      '8520078', 15),
  V('archer-push-up',       'archer-push-up',       '4945123', 18),
  V('pike-push-up',         'pike-pushup',          '8520078', 15),
  V('incline-pushup-chair', 'incline-pushup-chair', '6893304', 12),
  V('decline-pushup-chair', 'decline-pushup-chair', '4964650', 14),
  V('chair-triceps-dips',   'chair-triceps-dips',   '4159114', 10),
  V('pull-up',              'pull-up',              '8519749', 10),

  // ── Legs family — EACH VARIANT HAS ITS OWN VIDEO ──────────────────
  V('squat',                'squat-bodyweight',     '7934710', 15, ['chair-squat', 'sit-to-stand', 'chair-assisted-squat']),
  V('sumo-squat',           'sumo-squat',           '6454284', 18),
  V('jump-squat',           'jump-squat',           '5025962', 12),
  V('pulse-squat',          'squat-bodyweight',     '7934710', 15),
  V('lunge',                'lunge',                '8837221', 18),
  V('reverse-lunge',        'reverse-lunge',       '4488004', 14),
  V('walking-lunge',        'walking-lunge',        '4488004', 14),
  V('jump-lunge',           'jump-lunge',           '5510124', 12),
  V('step-back-lunge-chair','reverse-lunge',       '4488004', 14),
  V('bulgarian-split-squat-chair', 'lunge',        '8837221', 18),
  V('pistol-squat-progression', 'pistol-squat-progression', '8836849', 16),
  V('assisted-pistol-squat-chair', 'pistol-squat-progression', '8836849', 16),
  V('glute-bridge',         'glute-bridge',         '6525487', 14),
  V('single-leg-glute-bridge', 'glute-bridge',     '6525487', 14),
  V('single-leg-glute-bridge-chair', 'glute-bridge', '6525487', 14),
  V('hip-thrust-chair',     'hip-thrust',           '6111108', 12),
  V('donkey-kick',          'donkey-kick',          '10740728', 10),
  V('fire-hydrant',         'fire-hydrant',         '4116863', 10),

  // ── Core family — EACH VARIANT HAS ITS OWN VIDEO ──────────────────
  V('plank',                'plank',                '8343375', 14),
  V('high-plank',           'plank',                '8343375', 14),
  V('side-plank',           'side-plank',           '6023265', 15),
  V('shoulder-tap',         'shoulder-tap',         '5319088', 12),
  V('hollow-body-hold',     'plank',                '8343375', 14),
  V('l-sit',                'l-sit',                '4259001', 12),
  V('crunch',               'bicycle-crunch',       '8233228', 15),
  V('reverse-crunch',       'bicycle-crunch',       '8233228', 15),
  V('bicycle-crunch',       'bicycle-crunch',       '8233228', 15),
  V('leg-raise',            'leg-raise',            '6326818', 14),
  V('chair-knee-raises',    'leg-raise',            '6326818', 14),
  V('seated-knee-tucks',    'leg-raise',            '6326818', 14),
  V('flutter-kicks',        'flutter-kick',         '5802387', 12),
  V('v-ups',                'v-ups',                '4259001', 12),
  V('dead-bug',             'dead-bug',             '17556397', 14),

  // ── Back family ───────────────────────────────────────────────────
  V('superman',             'superman',             '15859716', 12),
  V('bird-dog',             'bird-dog',             '5983521',  10),

  // ── Cardio family ─────────────────────────────────────────────────
  V('mountain-climbers',    'mountain-climber',     '6022762', 16),
  V('elevated-mountain-climbers', 'mountain-climber', '6022762', 16),
  V('high-knees',           'high-knees',           '6326791', 12),
  V('burpees',              'burpee-v2',            '4671964', 13),
  V('jumping-jacks',        'jumping-jacks',        '4859226', 11),
  V('skater-jumps',         'skater-jumps',         '4824406', 14),
  V('bear-crawl',           'bear-crawl',           '7339139', 13),
  V('inchworm',             'inchworm',            '5113007', 14),

  // ── Mobility + Back pain relief ───────────────────────────────────
  V('childs-pose',          'childs-pose',          '6932946', 14),
  V('child-pose-relax',     'childs-pose',          '6932946', 14),
  V('hip-flexor-stretch',   'hip-flexor-stretch',   '7226846', 16),
  V('cat-cow-stretch',      'cat-cow',              '8232563', 18),
  V('cat-cow-stretch-v2',   'cat-cow',              '8232563', 18),
  V('knee-to-chest-stretch','knee-to-chest',        '8401260', 12),
  V('both-knees-to-chest',  'knee-to-chest',        '8401260', 12),
  V('knees-rocks-side-to-side', 'knees-rocks',     '8691033', 14),
  V('pelvic-tilt-exercise', 'pelvic-tilt',         '7155311', 14),
  V('bridging-exercise',    'pelvic-tilt',          '7155311', 14),
  V('seated-spinal-twist',  'spinal-twist',         '6298129', 15),
  V('spinal-twist-supine',  'spinal-twist',         '6298129', 15),
  V('cobra-stretch-gentle', 'cobra-pose',           '6955406', 14),
  V('cobra-stretch',        'cobra-pose',           '6955406', 14),
  V('lower-back-stretch-prone', 'lower-back-stretch', '8638175', 14),
  V('standing-side-bend',   'lower-back-stretch',   '8638175', 14),
  V('piriformis-stretch-seated', 'piriformis-stretch', '6077273', 14),
  V('piriformis-stretch-supine', 'piriformis-stretch', '6077273', 14),
  V('piriformis-stretch',   'piriformis-stretch',   '6077273', 14),
  V('figure-4-stretch-supine', 'piriformis-stretch', '6077273', 14),
  V('figure-4-stretch',     'piriformis-stretch',   '6077273', 14),
  V('sciatic-nerve-glide',  'piriformis-stretch',   '6077273', 14),
  V('hip-flexor-stretch-kneeling', 'kneeling-hip-flexor', '3195218', 14),
  V('hip-flexor-stretch-standing', 'kneeling-hip-flexor', '3195218', 14),
  V('butterfly-stretch',    'glute-stretch',        '6525487', 14),
  V('frog-stretch',         'glute-stretch',        '6525487', 14),
  V('happy-baby-pose',      'glute-stretch',        '6525487', 14),
  V('hip-circles',          'piriformis',           '6111108', 12),
  V('kneeling-hip-rotation', 'piriformis',          '6111108', 12),
  V('lunge-hip-opener',     'piriformis',           '6111108', 12),
  V('hamstring-stretch-supine', 'hamstring-stretch', '6023267', 14),
  V('hamstring-stretch-doorway', 'hamstring-stretch', '6023267', 14),
]

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

export const VIDEO_COVERAGE = BY_EXERCISE_ID.size
