import { useEffect, useState, type CSSProperties, type ReactElement } from 'react'

// Lightweight offline "how-to" animation: a minimal stick-figure silhouette
// that loops through 2-3 hand-drawn poses (JS-driven pose cycling, no
// video/network needed). Not meant to be anatomically perfect — just enough
// to read the movement pattern at a glance, fully bundled with the app.

type Point = [number, number]

interface Pose {
  head: Point
  shoulder: Point
  elbow: Point
  hand: Point
  hip: Point
  knee: Point
  foot: Point
  extra?: [Point, Point][] // extra raw segments, e.g. a second leg or a seat line
}

function poseSegments(p: Pose): [Point, Point][] {
  const segs: [Point, Point][] = [
    [p.shoulder, p.head], // neck, drawn under the (filled) head so it reads as "attached"
    [p.shoulder, p.hip],
    [p.shoulder, p.elbow],
    [p.elbow, p.hand],
    [p.hip, p.knee],
    [p.knee, p.foot],
  ]
  if (p.extra) segs.push(...p.extra)
  return segs
}

function Figure({ pose, style }: { pose: Pose; style?: CSSProperties }) {
  return (
    <g style={style}>
      {poseSegments(pose).map(([[x1, y1], [x2, y2]], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      ))}
      <circle cx={pose.head[0]} cy={pose.head[1]} r={9} fill="currentColor" />
    </g>
  )
}

/** Cycles through [0, length) on a timer. JS-driven (not CSS keyframes) so
 * exactly one pose is ever the "active" one — no ambiguous cross-fade state. */
function useCycle(length: number, intervalMs: number): number {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (length <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % length), intervalMs)
    return () => window.clearInterval(id)
  }, [length, intervalMs])
  return index
}

/** Small pinned badge so a chair-equipment demo is recognizable even before
 * reading the exercise's title or filter tags. */
function ChairBadge() {
  return (
    <span
      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-sm"
      title="Nécessite une chaise"
      aria-hidden
    >
      🪑
    </span>
  )
}

function AnimatedLoop({ poses, intervalMs = 850 }: { poses: Pose[]; intervalMs?: number }) {
  const active = useCycle(poses.length, intervalMs)
  return (
    <svg viewBox="0 0 200 190" className="h-full w-full text-emerald-400">
      <line x1="10" y1="178" x2="190" y2="178" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
      {poses.map((pose, i) => (
        <Figure
          key={i}
          pose={pose}
          style={{ opacity: i === active ? 1 : 0, transition: 'opacity 200ms ease-in-out' }}
        />
      ))}
    </svg>
  )
}

function StaticHold({ pose }: { pose: Pose }) {
  return (
    <svg viewBox="0 0 200 190" className="h-full w-full text-emerald-400">
      <line x1="10" y1="178" x2="190" y2="178" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
      <Figure pose={pose} style={{ animation: 'exanim-breathe 2.4s ease-in-out infinite', transformOrigin: 'center' }} />
    </svg>
  )
}

// --- Pose data (side view, x→right, y→down, ground at y=178) ---

const kneePushUpPoses: Pose[] = [
  { head: [40, 95], shoulder: [55, 100], elbow: [56, 139], hand: [55, 178], hip: [100, 108], knee: [120, 178], foot: [150, 168] },
  { head: [38, 145], shoulder: [50, 150], elbow: [30, 138], hand: [55, 178], hip: [98, 155], knee: [120, 178], foot: [150, 165] },
]

const pushUpPoses: Pose[] = [
  { head: [40, 95], shoulder: [55, 100], elbow: [58, 139], hand: [55, 178], hip: [110, 105], knee: [140, 140], foot: [165, 178] },
  { head: [38, 150], shoulder: [50, 155], elbow: [30, 140], hand: [55, 178], hip: [108, 158], knee: [140, 168], foot: [165, 178] },
]

const pikePushUpPoses: Pose[] = [
  { head: [70, 110], shoulder: [72, 120], elbow: [71, 150], hand: [70, 178], hip: [115, 90], knee: [150, 140], foot: [165, 178] },
  { head: [65, 150], shoulder: [68, 145], elbow: [50, 150], hand: [70, 178], hip: [113, 92], knee: [150, 140], foot: [165, 178] },
]

const dipsPoses: Pose[] = [
  { hand: [70, 90], elbow: [72, 110], shoulder: [75, 130], hip: [80, 155], knee: [110, 170], foot: [130, 178], head: [78, 110] },
  { hand: [70, 90], elbow: [48, 105], shoulder: [60, 130], hip: [68, 158], knee: [100, 172], foot: [125, 178], head: [63, 140] },
]

const plankPose: Pose = { head: [45, 120], shoulder: [60, 125], elbow: [60, 150], hand: [75, 155], hip: [115, 130], knee: [150, 150], foot: [175, 160] }
const sidePlankPose: Pose = { head: [45, 110], shoulder: [65, 120], elbow: [65, 150], hand: [70, 155], hip: [115, 125], knee: [150, 140], foot: [178, 150] }
const hollowBodyPose: Pose = { head: [50, 165], shoulder: [70, 172], elbow: [55, 150], hand: [40, 140], hip: [100, 178], knee: [140, 165], foot: [175, 150] }
const lSitPose: Pose = { head: [75, 90], shoulder: [75, 100], elbow: [72, 120], hand: [70, 140], hip: [80, 140], knee: [120, 140], foot: [160, 140] }
const childsPosePose: Pose = { head: [75, 160], shoulder: [90, 155], elbow: [70, 165], hand: [50, 170], hip: [140, 165], knee: [145, 175], foot: [160, 178] }

const crunchPoses: Pose[] = [
  { head: [50, 178], shoulder: [65, 175], elbow: [55, 178], hand: [45, 178], hip: [100, 178], knee: [140, 165], foot: [170, 178] },
  { head: [55, 155], shoulder: [68, 160], elbow: [58, 163], hand: [48, 166], hip: [100, 178], knee: [140, 165], foot: [170, 178] },
]

const legRaisePoses: Pose[] = [
  { head: [45, 172], shoulder: [60, 175], elbow: [55, 178], hand: [45, 178], hip: [100, 178], knee: [145, 170], foot: [178, 175] },
  { head: [45, 172], shoulder: [60, 175], elbow: [55, 178], hand: [45, 178], hip: [100, 178], knee: [110, 120], foot: [105, 80] },
]

const vUpsPoses: Pose[] = [
  { head: [25, 178], shoulder: [45, 178], elbow: [30, 178], hand: [15, 178], hip: [100, 178], knee: [140, 178], foot: [178, 178] },
  { head: [70, 140], shoulder: [80, 150], elbow: [70, 145], hand: [60, 140], hip: [100, 178], knee: [130, 140], foot: [155, 120] },
]

const deadBugPoses: Pose[] = [
  { hip: [100, 178], shoulder: [85, 170], head: [70, 165], elbow: [70, 150], hand: [60, 130], knee: [130, 165], foot: [160, 150] },
  { hip: [100, 178], shoulder: [85, 170], head: [70, 165], elbow: [85, 150], hand: [85, 125], knee: [110, 155], foot: [110, 135] },
]

const seatedLegRaisePoses: Pose[] = [
  { hip: [100, 140], shoulder: [95, 100], head: [88, 85], elbow: [80, 110], hand: [70, 130], knee: [105, 165], foot: [110, 178], extra: [[[65, 140], [135, 140]]] },
  { hip: [100, 140], shoulder: [95, 100], head: [88, 85], elbow: [80, 110], hand: [70, 130], knee: [130, 130], foot: [150, 120], extra: [[[65, 140], [135, 140]]] },
]

const balanceChairPose: Pose = {
  head: [85, 50], shoulder: [85, 65], elbow: [100, 80], hand: [115, 85], hip: [85, 110], knee: [95, 140], foot: [100, 178],
  extra: [[[85, 110], [65, 145]], [[115, 85], [115, 140]]],
}

const supermanPoses: Pose[] = [
  { shoulder: [70, 165], hip: [120, 168], head: [55, 158], elbow: [50, 155], hand: [35, 148], knee: [150, 160], foot: [178, 150] },
  { shoulder: [70, 178], hip: [120, 178], head: [55, 178], elbow: [50, 177], hand: [35, 178], knee: [150, 178], foot: [178, 178] },
]

const birdDogPoses: Pose[] = [
  {
    head: [80, 140], shoulder: [90, 145], elbow: [70, 140], hand: [50, 135], hip: [140, 150], knee: [165, 145], foot: [190, 140],
    extra: [[[90, 145], [90, 178]], [[140, 150], [140, 178]]],
  },
  {
    head: [80, 140], shoulder: [90, 145], elbow: [90, 150], hand: [90, 178], hip: [140, 150], knee: [140, 155], foot: [140, 178],
    extra: [[[90, 145], [90, 178]], [[140, 150], [140, 178]]],
  },
]

const squatPoses: Pose[] = [
  { head: [76, 48], shoulder: [90, 65], elbow: [70, 90], hand: [55, 100], hip: [90, 110], knee: [95, 145], foot: [100, 178] },
  { head: [62, 88], shoulder: [78, 100], elbow: [50, 105], hand: [30, 110], hip: [70, 135], knee: [95, 150], foot: [100, 178] },
]

const lungePoses: Pose[] = [
  { head: [95, 50], shoulder: [95, 65], elbow: [80, 90], hand: [70, 100], hip: [95, 110], knee: [97, 145], foot: [100, 178] },
  {
    head: [88, 90], shoulder: [90, 100], elbow: [75, 115], hand: [65, 120], hip: [88, 130], knee: [95, 155], foot: [100, 178],
    extra: [[[88, 130], [130, 170]]],
  },
]

const pistolSquatPoses: Pose[] = [
  { head: [80, 55], shoulder: [80, 70], elbow: [60, 90], hand: [40, 95], hip: [80, 115], knee: [85, 145], foot: [90, 178], extra: [[[80, 115], [140, 100]]] },
  { head: [65, 95], shoulder: [68, 105], elbow: [40, 110], hand: [20, 112], hip: [65, 140], knee: [85, 155], foot: [90, 178], extra: [[[65, 140], [150, 120]]] },
]

const gluteBridgePoses: Pose[] = [
  { shoulder: [50, 178], head: [35, 175], elbow: [45, 178], hand: [40, 178], hip: [100, 178], knee: [145, 155], foot: [170, 178] },
  { shoulder: [50, 178], head: [35, 175], elbow: [45, 178], hand: [40, 178], hip: [100, 145], knee: [145, 150], foot: [170, 178] },
]

const donkeyKickPoses: Pose[] = [
  {
    shoulder: [85, 145], hip: [130, 148], head: [73, 138], elbow: [85, 150], hand: [85, 178], knee: [155, 160], foot: [155, 178],
    extra: [[[130, 148], [130, 178]]],
  },
  {
    shoulder: [85, 145], hip: [130, 148], head: [73, 138], elbow: [85, 150], hand: [85, 178], knee: [175, 140], foot: [165, 110],
    extra: [[[130, 148], [130, 178]]],
  },
]

const fireHydrantPoses: Pose[] = [
  {
    shoulder: [85, 145], hip: [130, 148], head: [73, 138], elbow: [85, 150], hand: [85, 178], knee: [155, 160], foot: [155, 178],
    extra: [[[130, 148], [130, 178]]],
  },
  {
    shoulder: [85, 145], hip: [130, 148], head: [73, 138], elbow: [85, 150], hand: [85, 178], knee: [160, 150], foot: [145, 155],
    extra: [[[130, 148], [130, 178]]],
  },
]

const burpeePoses: Pose[] = [
  { head: [76, 43], shoulder: [90, 60], elbow: [90, 85], hand: [90, 105], hip: [90, 110], knee: [93, 145], foot: [100, 178] },
  { head: [40, 110], shoulder: [55, 115], elbow: [56, 145], hand: [55, 178], hip: [105, 120], knee: [150, 150], foot: [175, 160] },
  { head: [76, 23], shoulder: [90, 40], elbow: [85, 15], hand: [80, 0], hip: [90, 80], knee: [93, 120], foot: [100, 150] },
]

const mountainClimberPoses: Pose[] = [
  { head: [45, 130], shoulder: [60, 135], elbow: [60, 157], hand: [60, 178], hip: [110, 140], knee: [150, 155], foot: [175, 165] },
  { head: [45, 130], shoulder: [60, 135], elbow: [60, 157], hand: [60, 178], hip: [108, 140], knee: [90, 150], foot: [80, 175] },
]

const highKneesPoses: Pose[] = [
  { head: [90, 50], shoulder: [90, 65], elbow: [75, 80], hand: [65, 90], hip: [90, 110], knee: [105, 120], foot: [100, 140] },
  { head: [90, 50], shoulder: [90, 65], elbow: [100, 85], hand: [110, 95], hip: [90, 110], knee: [93, 145], foot: [100, 178] },
]

const jumpingJacksPoses: Pose[] = [
  { head: [100, 45], shoulder: [100, 60], elbow: [100, 80], hand: [100, 100], hip: [100, 110], knee: [100, 145], foot: [100, 178] },
  { head: [100, 45], shoulder: [100, 60], elbow: [85, 35], hand: [75, 15], hip: [100, 110], knee: [75, 145], foot: [55, 178] },
]

const skaterJumpPoses: Pose[] = [
  {
    head: [85, 55], shoulder: [85, 70], elbow: [70, 90], hand: [55, 100], hip: [85, 115], knee: [90, 150], foot: [95, 178],
    extra: [[[85, 115], [120, 165]]],
  },
  {
    head: [100, 45], shoulder: [100, 60], elbow: [115, 45], hand: [125, 35], hip: [100, 100], knee: [110, 130], foot: [120, 155],
    extra: [[[100, 100], [85, 140]]],
  },
]

const bearCrawlPoses: Pose[] = [
  {
    shoulder: [90, 140], hip: [140, 150], head: [78, 132], elbow: [70, 145], hand: [55, 160], knee: [140, 165], foot: [165, 178],
    extra: [[[115, 148], [115, 178]]],
  },
  {
    shoulder: [95, 138], hip: [145, 148], head: [83, 130], elbow: [115, 150], hand: [130, 168], knee: [120, 160], foot: [100, 178],
    extra: [[[120, 146], [120, 178]]],
  },
]

const inchwormPoses: Pose[] = [
  { head: [90, 90], shoulder: [90, 100], elbow: [85, 130], hand: [80, 160], hip: [90, 110], knee: [93, 145], foot: [100, 178] },
  { head: [40, 140], shoulder: [55, 145], elbow: [56, 163], hand: [55, 178], hip: [110, 150], knee: [145, 165], foot: [175, 175] },
]

const catCowPoses: Pose[] = [
  {
    shoulder: [90, 145], hip: [140, 140], head: [78, 130], elbow: [90, 150], hand: [90, 178], knee: [140, 155], foot: [140, 178],
    extra: [[[140, 140], [140, 178]]],
  },
  {
    shoulder: [90, 150], hip: [140, 148], head: [85, 160], elbow: [90, 155], hand: [90, 178], knee: [140, 158], foot: [140, 178],
    extra: [[[140, 148], [140, 178]]],
  },
]

const animationsByGroup: Record<string, () => ReactElement> = {
  'knee-push-up': () => <AnimatedLoop poses={kneePushUpPoses} />,
  'push-up': () => <AnimatedLoop poses={pushUpPoses} />,
  'pike-push-up': () => <AnimatedLoop poses={pikePushUpPoses} />,
  dips: () => <AnimatedLoop poses={dipsPoses} />,
  plank: () => <StaticHold pose={plankPose} />,
  'side-plank': () => <StaticHold pose={sidePlankPose} />,
  'hollow-body': () => <StaticHold pose={hollowBodyPose} />,
  'l-sit': () => <StaticHold pose={lSitPose} />,
  'childs-pose': () => <StaticHold pose={childsPosePose} />,
  'hip-flexor-stretch': () => <StaticHold pose={lungePoses[1]} />,
  crunch: () => <AnimatedLoop poses={crunchPoses} />,
  'leg-raise': () => <AnimatedLoop poses={legRaisePoses} />,
  'v-ups': () => <AnimatedLoop poses={vUpsPoses} />,
  'dead-bug': () => <AnimatedLoop poses={deadBugPoses} />,
  'seated-leg-raise': () => <AnimatedLoop poses={seatedLegRaisePoses} />,
  'balance-chair': () => <StaticHold pose={balanceChairPose} />,
  superman: () => <AnimatedLoop poses={supermanPoses} />,
  'bird-dog': () => <AnimatedLoop poses={birdDogPoses} />,
  squat: () => <AnimatedLoop poses={squatPoses} />,
  lunge: () => <AnimatedLoop poses={lungePoses} />,
  'pistol-squat': () => <AnimatedLoop poses={pistolSquatPoses} />,
  'glute-bridge': () => <AnimatedLoop poses={gluteBridgePoses} />,
  'donkey-kick': () => <AnimatedLoop poses={donkeyKickPoses} />,
  'fire-hydrant': () => <AnimatedLoop poses={fireHydrantPoses} />,
  'mountain-climber': () => <AnimatedLoop poses={mountainClimberPoses} />,
  burpee: () => <AnimatedLoop poses={burpeePoses} />,
  'high-knees': () => <AnimatedLoop poses={highKneesPoses} />,
  'jumping-jacks': () => <AnimatedLoop poses={jumpingJacksPoses} />,
  'skater-jumps': () => <AnimatedLoop poses={skaterJumpPoses} />,
  'bear-crawl': () => <AnimatedLoop poses={bearCrawlPoses} />,
  inchworm: () => <AnimatedLoop poses={inchwormPoses} />,
  'cat-cow': () => <AnimatedLoop poses={catCowPoses} />,
}

const exerciseToGroup: Record<string, keyof typeof animationsByGroup> = {
  // Push — sans équipement
  'knee-push-up': 'knee-push-up',
  'push-up': 'push-up',
  'wide-push-up': 'push-up',
  'diamond-push-up': 'push-up',
  'archer-push-up': 'push-up',
  'pike-push-up': 'pike-push-up',
  // Push — chaise
  'incline-pushup-chair': 'knee-push-up',
  'decline-pushup-chair': 'push-up',
  'chair-triceps-dips': 'dips',
  'elevated-pike-pushup': 'pike-push-up',
  // Core — sans équipement
  plank: 'plank',
  'side-plank': 'side-plank',
  'shoulder-tap': 'plank',
  'hollow-body-hold': 'hollow-body',
  crunch: 'crunch',
  'reverse-crunch': 'crunch',
  'bicycle-crunch': 'crunch',
  'leg-raise': 'leg-raise',
  'flutter-kicks': 'leg-raise',
  'v-ups': 'v-ups',
  'l-sit': 'l-sit',
  'dead-bug': 'dead-bug',
  // Core — chaise
  'chair-knee-raises': 'seated-leg-raise',
  'seated-knee-tucks': 'seated-leg-raise',
  // Back — sans équipement
  superman: 'superman',
  'bird-dog': 'bird-dog',
  // Legs — sans équipement
  squat: 'squat',
  'sumo-squat': 'squat',
  'jump-squat': 'squat',
  lunge: 'lunge',
  'reverse-lunge': 'lunge',
  'pistol-squat-progression': 'pistol-squat',
  'glute-bridge': 'glute-bridge',
  'single-leg-glute-bridge': 'glute-bridge',
  'donkey-kick': 'donkey-kick',
  'fire-hydrant': 'fire-hydrant',
  // Legs — chaise
  'chair-squat': 'squat',
  'sit-to-stand': 'squat',
  'chair-assisted-squat': 'squat',
  'bulgarian-split-squat-chair': 'lunge',
  'assisted-pistol-squat-chair': 'pistol-squat',
  'step-back-lunge-chair': 'lunge',
  'single-leg-glute-bridge-chair': 'glute-bridge',
  'hip-thrust-chair': 'glute-bridge',
  'assisted-balance-chair': 'balance-chair',
  // Cardio / full body — sans équipement
  'mountain-climbers': 'mountain-climber',
  burpees: 'burpee',
  'high-knees': 'high-knees',
  'jumping-jacks': 'jumping-jacks',
  'skater-jumps': 'skater-jumps',
  'bear-crawl': 'bear-crawl',
  inchworm: 'inchworm',
  // Cardio — chaise
  'elevated-mountain-climbers': 'mountain-climber',
  // Mobilité — sans équipement
  'cat-cow-stretch': 'cat-cow',
  'childs-pose': 'childs-pose',
  'hip-flexor-stretch': 'hip-flexor-stretch',
}

export function hasExerciseAnimation(exerciseId: string): boolean {
  return exerciseId in exerciseToGroup
}

export function ExerciseAnimation({
  exerciseId,
  showChairBadge = false,
  className,
}: {
  exerciseId: string
  showChairBadge?: boolean
  className?: string
}) {
  const group = exerciseToGroup[exerciseId]
  const render = group ? animationsByGroup[group] : undefined
  if (!render) return null

  return (
    <div className={`relative ${className ?? 'aspect-[200/190] w-full overflow-hidden rounded-xl bg-slate-800 p-3'}`}>
      {render()}
      {showChairBadge && <ChairBadge />}
    </div>
  )
}
