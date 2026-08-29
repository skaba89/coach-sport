/**
 * Exercise video library.
 *
 * Each video is licensed CC0 (public domain) via Pexels.
 * Source: https://www.pexels.com/videos/
 *
 * Attribution is NOT required for CC0 content, but we keep the
 * Pexels video ID for traceability in case the user wants to
 * verify the license or replace a clip.
 *
 * Local copies live in /public/videos/*.mp4 + *.webp (poster image)
 * and are served alongside the rest of the static assets. Future work:
 * - Move to a CDN (Cloudflare R2 / Bunny CDN) before SaaS launch
 * - Provide multiple resolutions (sd/hd) and let the player pick
 *   based on network quality
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
  // ── Push family ──────────────────────────────────────────────────
  V('push-up',              'push-up',           '4367576',  12, ['knee-push-up', 'wide-push-up', 'diamond-push-up', 'archer-push-up']),
  V('pike-push-up',         'push-up',           '4367576',  12),
  V('incline-pushup-chair', 'push-up',           '4367576',  12, ['decline-pushup-chair']),
  V('chair-triceps-dips',   'push-up',           '4367576',  12),
  V('elevated-pike-pushup', 'push-up',           '4367576',  12),
  V('pull-up',              'pull-up',           '8519749',  10),

  // ── Legs family ──────────────────────────────────────────────────
  V('squat',                'squat-bodyweight',  '7934710',  15, ['sumo-squat', 'jump-squat', 'pulse-squat', 'chair-squat', 'sit-to-stand', 'chair-assisted-squat']),
  V('lunge',                'lunge',             '8837221',  18, ['reverse-lunge', 'walking-lunge', 'jump-lunge', 'step-back-lunge-chair', 'bulgarian-split-squat-chair']),
  V('glute-bridge',         'glute-bridge',      '6525487',  14, ['single-leg-glute-bridge', 'hip-thrust-chair', 'single-leg-glute-bridge-chair']),
  V('donkey-kick',          'glute-bridge',      '6525487',  14, ['fire-hydrant']),

  // ── Core family ──────────────────────────────────────────────────
  V('plank',                'plank',             '8343375',  14, ['side-plank', 'high-plank', 'shoulder-tap']),
  V('hollow-body-hold',     'plank',             '8343375',  14),
  V('l-sit',                'plank',             '8343375',  14),

  // ── Back family ──────────────────────────────────────────────────
  V('superman',             'superman',          '15859716', 12),
  V('bird-dog',             'bird-dog',          '5983521',  10),

  // ── Cardio family ────────────────────────────────────────────────
  V('mountain-climbers',    'mountain-climber',  '6022762',  16, ['elevated-mountain-climbers']),
  V('high-knees',           'mountain-climber',  '6022762',  16),
  V('burpees',              'burpee-v2',         '4671964',  13),
  V('jumping-jacks',        'jumping-jacks',     '4859226',  11, ['skater-jumps']),
  V('bear-crawl',           'burpee-v2',         '4671964',  13),

  // ── Mobility family ──────────────────────────────────────────────
  V('childs-pose',          'childs-pose',       '6932946',  14),
  V('hip-flexor-stretch',   'hip-flexor-stretch','7226846',  16),
  V('cat-cow-stretch',      'hip-flexor-stretch','7226846',  16),
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
