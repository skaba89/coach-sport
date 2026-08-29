/**
 * Lightweight non-React helper to know whether an exercise has a
 * fallback SVG animation. Kept separate from ExerciseAnimation.tsx
 * so callers can decide to render without paying the cost of importing
 * the 401-LOC component.
 *
 * The list is duplicated intentionally: ExerciseAnimation.tsx keeps its
 * own exerciseToGroup map for the actual rendering. If they drift apart,
 * the worst case is `hasExerciseAnimation` returning true but
 * ExerciseAnimation rendering null (already handled defensively).
 */

const EXERCISES_WITH_ANIMATION = new Set<string>([
  // Push — sans équipement
  'knee-push-up', 'push-up', 'wide-push-up', 'diamond-push-up', 'archer-push-up', 'pike-push-up',
  // Push — chaise
  'incline-pushup-chair', 'decline-pushup-chair', 'chair-triceps-dips', 'elevated-pike-pushup',
  // Core — sans équipement
  'plank', 'side-plank', 'shoulder-tap', 'hollow-body-hold', 'crunch',
  'reverse-crunch', 'bicycle-crunch', 'leg-raise', 'flutter-kicks',
  'v-ups', 'l-sit', 'dead-bug',
  // Core — chaise
  'chair-knee-raises', 'seated-knee-tucks',
  // Back
  'superman', 'bird-dog',
  // Legs — sans équipement
  'squat', 'sumo-squat', 'jump-squat', 'lunge', 'reverse-lunge',
  'pistol-squat-progression', 'glute-bridge', 'single-leg-glute-bridge',
  'donkey-kick', 'fire-hydrant',
  // Legs — chaise
  'chair-squat', 'sit-to-stand', 'chair-assisted-squat',
  'bulgarian-split-squat-chair', 'assisted-pistol-squat-chair',
  'step-back-lunge-chair', 'single-leg-glute-bridge-chair',
  'hip-thrust-chair', 'assisted-balance-chair',
  // Cardio
  'mountain-climbers', 'burpees', 'high-knees', 'jumping-jacks',
  'skater-jumps', 'bear-crawl', 'inchworm', 'elevated-mountain-climbers',
  // Mobilité
  'cat-cow-stretch', 'childs-pose', 'hip-flexor-stretch',
])

export function hasExerciseAnimation(exerciseId: string): boolean {
  return EXERCISES_WITH_ANIMATION.has(exerciseId)
}
