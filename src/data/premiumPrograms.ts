import type { Program } from '../lib/types'

/**
 * Premium structured programs with week-by-week progressive overload.
 *
 * Each program spans multiple weeks with increasing volume/intensity.
 * The Coach Engine V2 can use these as templates and adapt them
 * based on the user's RPE feedback and recovery state.
 */

export const premiumPrograms: Program[] = [
  // ─── 4 semaines débutant absolu ──────────────────────────────────
  {
    id: 'debutant-4s',
    name: 'Débutant Absolu — 4 Semaines',
    difficulty: 'debutant',
    description: 'Programme d\'initiation de 4 semaines. 3 séances par semaine, 15-20 min. Construit les bases : force, gainage, mobilité. Aucun équipement.',
    days: [
      {
        name: 'Semaine 1-2 · Séance A',
        slots: [
          { exerciseId: 'knee-push-up', sets: 2, reps: '6-8', restSeconds: 60 },
          { exerciseId: 'chair-assisted-squat', sets: 2, reps: '8-10', restSeconds: 60 },
          { exerciseId: 'glute-bridge', sets: 2, reps: '10-12', restSeconds: 45 },
          { exerciseId: 'plank', sets: 2, reps: '15-20s', restSeconds: 45 },
        ],
      },
      {
        name: 'Semaine 1-2 · Séance B',
        slots: [
          { exerciseId: 'wall-sit', sets: 2, reps: '20-30s', restSeconds: 45 },
          { exerciseId: 'bird-dog', sets: 2, reps: '6-8 / côté', restSeconds: 45 },
          { exerciseId: 'cat-cow-stretch', sets: 2, reps: '30s', restSeconds: 20 },
          { exerciseId: 'childs-pose', sets: 1, reps: '45s', restSeconds: 0 },
        ],
      },
      {
        name: 'Semaine 3-4 · Séance A (progression)',
        slots: [
          { exerciseId: 'knee-push-up', sets: 3, reps: '8-10', restSeconds: 60 },
          { exerciseId: 'squat', sets: 3, reps: '10-12', restSeconds: 60 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '12-15', restSeconds: 45 },
          { exerciseId: 'plank', sets: 3, reps: '20-30s', restSeconds: 45 },
        ],
      },
      {
        name: 'Semaine 3-4 · Séance B (progression)',
        slots: [
          { exerciseId: 'push-up', sets: 2, reps: '5-8', restSeconds: 60 },
          { exerciseId: 'lunge', sets: 2, reps: '6-8 / jambe', restSeconds: 60 },
          { exerciseId: 'dead-bug', sets: 3, reps: '8-10 / côté', restSeconds: 45 },
          { exerciseId: 'hip-flexor-stretch', sets: 2, reps: '30s', restSeconds: 20 },
        ],
      },
    ],
  },

  // ─── 6 semaines remise en forme ──────────────────────────────────
  {
    id: 'remise-en-forme-6s',
    name: 'Remise en Forme — 6 Semaines',
    difficulty: 'debutant',
    description: 'Programme de 6 semaines pour reprendre le sport en douceur. 3 séances/semaine, 20-25 min. Mix de force, cardio léger et mobilité.',
    days: [
      {
        name: 'Semaine 1-2 · Full Body Doux',
        slots: [
          { exerciseId: 'push-up', sets: 3, reps: '8-10', restSeconds: 60 },
          { exerciseId: 'squat', sets: 3, reps: '12-15', restSeconds: 60 },
          { exerciseId: 'plank', sets: 3, reps: '20-30s', restSeconds: 45 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '12-15', restSeconds: 45 },
        ],
      },
      {
        name: 'Semaine 1-2 · Cardio + Core',
        slots: [
          { exerciseId: 'jumping-jacks', sets: 3, reps: '30s', restSeconds: 30 },
          { exerciseId: 'mountain-climbers', sets: 3, reps: '30s', restSeconds: 30 },
          { exerciseId: 'dead-bug', sets: 3, reps: '8-10 / côté', restSeconds: 45 },
          { exerciseId: 'childs-pose', sets: 1, reps: '45s', restSeconds: 0 },
        ],
      },
      {
        name: 'Semaine 3-4 · Progression',
        slots: [
          { exerciseId: 'push-up', sets: 3, reps: '10-12', restSeconds: 50 },
          { exerciseId: 'lunge', sets: 3, reps: '10 / jambe', restSeconds: 50 },
          { exerciseId: 'plank', sets: 3, reps: '30-40s', restSeconds: 40 },
          { exerciseId: 'bird-dog', sets: 3, reps: '10 / côté', restSeconds: 40 },
        ],
      },
      {
        name: 'Semaine 5-6 · Intensité',
        slots: [
          { exerciseId: 'diamond-push-up', sets: 3, reps: '8-10', restSeconds: 50 },
          { exerciseId: 'sumo-squat', sets: 3, reps: '12-15', restSeconds: 50 },
          { exerciseId: 'side-plank', sets: 3, reps: '20-30s / côté', restSeconds: 40 },
          { exerciseId: 'burpees', sets: 3, reps: '8-10', restSeconds: 60 },
        ],
      },
    ],
  },

  // ─── 8 semaines force poids du corps ─────────────────────────────
  {
    id: 'force-pdc-8s',
    name: 'Force Poids du Corps — 8 Semaines',
    difficulty: 'intermediaire',
    description: 'Programme structuré de 8 semaines pour développer la force. 4 séances/semaine, 25-30 min. Progression hebdomadaire des répétitions.',
    days: [
      {
        name: 'Semaine 1-2 · Push Focus',
        slots: [
          { exerciseId: 'push-up', sets: 4, reps: '10-12', restSeconds: 60 },
          { exerciseId: 'pike-push-up', sets: 3, reps: '6-8', restSeconds: 60 },
          { exerciseId: 'chair-triceps-dips', sets: 3, reps: '10-12', restSeconds: 50 },
          { exerciseId: 'plank', sets: 3, reps: '30-45s', restSeconds: 45 },
        ],
      },
      {
        name: 'Semaine 1-2 · Legs Focus',
        slots: [
          { exerciseId: 'squat', sets: 4, reps: '15-20', restSeconds: 60 },
          { exerciseId: 'lunge', sets: 3, reps: '12 / jambe', restSeconds: 50 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '15-20', restSeconds: 45 },
          { exerciseId: 'calf-raises', sets: 3, reps: '15-20', restSeconds: 40 },
        ],
      },
      {
        name: 'Semaine 3-4 · Progression Push',
        slots: [
          { exerciseId: 'wide-push-up', sets: 4, reps: '12-15', restSeconds: 55 },
          { exerciseId: 'diamond-push-up', sets: 3, reps: '8-10', restSeconds: 55 },
          { exerciseId: 'pike-push-up', sets: 3, reps: '8-10', restSeconds: 55 },
          { exerciseId: 'hollow-body-hold', sets: 3, reps: '20-30s', restSeconds: 45 },
        ],
      },
      {
        name: 'Semaine 5-6 · Intensité',
        slots: [
          { exerciseId: 'archer-push-up', sets: 4, reps: '6-8 / bras', restSeconds: 60 },
          { exerciseId: 'pistol-squat-progression', sets: 3, reps: '5-8 / jambe', restSeconds: 60 },
          { exerciseId: 'l-sit', sets: 3, reps: '10-15s', restSeconds: 45 },
          { exerciseId: 'superman', sets: 3, reps: '12-15', restSeconds: 45 },
        ],
      },
    ],
  },

  // ─── 6 semaines core spécialisé ──────────────────────────────────
  {
    id: 'core-6s',
    name: 'Core Intensif — 6 Semaines',
    difficulty: 'intermediaire',
    description: 'Programme dédié au gainage et aux abdos sur 6 semaines. 3 séances/semaine, 15-20 min. Progression du temps sous tension.',
    days: [
      {
        name: 'Semaine 1-2 · Fondations',
        slots: [
          { exerciseId: 'plank', sets: 3, reps: '30-45s', restSeconds: 45 },
          { exerciseId: 'dead-bug', sets: 3, reps: '10 / côté', restSeconds: 40 },
          { exerciseId: 'crunch', sets: 3, reps: '12-15', restSeconds: 40 },
          { exerciseId: 'bird-dog', sets: 3, reps: '10 / côté', restSeconds: 40 },
        ],
      },
      {
        name: 'Semaine 3-4 · Intensité',
        slots: [
          { exerciseId: 'plank', sets: 3, reps: '45-60s', restSeconds: 40 },
          { exerciseId: 'hollow-body-hold', sets: 3, reps: '20-30s', restSeconds: 40 },
          { exerciseId: 'bicycle-crunch', sets: 3, reps: '15-20', restSeconds: 35 },
          { exerciseId: 'leg-raise', sets: 3, reps: '10-12', restSeconds: 40 },
        ],
      },
      {
        name: 'Semaine 5-6 · Avancé',
        slots: [
          { exerciseId: 'side-plank', sets: 3, reps: '30-40s / côté', restSeconds: 35 },
          { exerciseId: 'hollow-rock', sets: 3, reps: '15-20s', restSeconds: 35 },
          { exerciseId: 'v-ups', sets: 3, reps: '10-12', restSeconds: 40 },
          { exerciseId: 'l-sit', sets: 3, reps: '10-15s', restSeconds: 45 },
        ],
      },
    ],
  },

  // ─── 6 semaines dos & posture ────────────────────────────────────
  {
    id: 'dos-posture-6s',
    name: 'Dos & Posture — 6 Semaines',
    difficulty: 'debutant',
    description: 'Programme spécialisé pour renforcer le dos et améliorer la posture. 3 séances/semaine, 15-20 min. Idéal pour les douleurs lombaires légères.',
    days: [
      {
        name: 'Semaine 1-2 · Renforcement doux',
        slots: [
          { exerciseId: 'bird-dog', sets: 3, reps: '8-10 / côté', restSeconds: 45 },
          { exerciseId: 'superman', sets: 3, reps: '10-12', restSeconds: 45 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '12-15', restSeconds: 45 },
          { exerciseId: 'cat-cow-stretch', sets: 2, reps: '30s', restSeconds: 20 },
        ],
      },
      {
        name: 'Semaine 3-4 · Mobilité + Force',
        slots: [
          { exerciseId: 'superman-hold', sets: 3, reps: '15-20s', restSeconds: 40 },
          { exerciseId: 'bird-dog', sets: 3, reps: '12 / côté', restSeconds: 40 },
          { exerciseId: 'pelvic-tilt-exercise', sets: 3, reps: '12-15', restSeconds: 40 },
          { exerciseId: 'knee-to-chest-stretch', sets: 2, reps: '30s / jambe', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 5-6 · Stabilisation',
        slots: [
          { exerciseId: 'reverse-plank', sets: 3, reps: '20-30s', restSeconds: 40 },
          { exerciseId: 'superman-hold', sets: 3, reps: '25-30s', restSeconds: 40 },
          { exerciseId: 'bridging-exercise', sets: 3, reps: '15-20', restSeconds: 40 },
          { exerciseId: 'spinal-twist-supine', sets: 2, reps: '30s / côté', restSeconds: 15 },
        ],
      },
    ],
  },

  // ─── 30 jours mobilité ───────────────────────────────────────────
  {
    id: 'mobilite-30j',
    name: 'Mobilité Quotidienne — 30 Jours',
    difficulty: 'debutant',
    description: 'Défi de 30 jours pour améliorer votre mobilité. 1 séance courte par jour (10-15 min). Idéal en complément d\'un autre programme.',
    days: [
      {
        name: 'Semaine 1 · Hanches',
        slots: [
          { exerciseId: 'hip-flexor-stretch-kneeling', sets: 2, reps: '30s / côté', restSeconds: 15 },
          { exerciseId: 'butterfly-stretch', sets: 2, reps: '30s', restSeconds: 15 },
          { exerciseId: 'knee-to-chest-stretch', sets: 2, reps: '30s / jambe', restSeconds: 15 },
          { exerciseId: 'cat-cow-stretch', sets: 2, reps: '30s', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 2 · Dos',
        slots: [
          { exerciseId: 'childs-pose', sets: 2, reps: '45s', restSeconds: 15 },
          { exerciseId: 'cobra-stretch-gentle', sets: 2, reps: '30s', restSeconds: 15 },
          { exerciseId: 'spinal-twist-supine', sets: 2, reps: '30s / côté', restSeconds: 15 },
          { exerciseId: 'knees-rocks-side-to-side', sets: 2, reps: '30s', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 3 · Épaules + Thoracique',
        slots: [
          { exerciseId: 'shoulder-dislocates', sets: 2, reps: '10 reps', restSeconds: 20 },
          { exerciseId: 'thoracic-rotation', sets: 2, reps: '10 / côté', restSeconds: 20 },
          { exerciseId: 'downward-dog', sets: 2, reps: '30s', restSeconds: 15 },
          { exerciseId: 'standing-forward-fold', sets: 2, reps: '30s', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 4 · Full Body Flow',
        slots: [
          { exerciseId: 'cat-cow-stretch', sets: 2, reps: '30s', restSeconds: 10 },
          { exerciseId: 'hip-flexor-stretch-kneeling', sets: 2, reps: '30s / côté', restSeconds: 10 },
          { exerciseId: 'pigeon-pose', sets: 2, reps: '30s / côté', restSeconds: 10 },
          { exerciseId: 'cobra-stretch-gentle', sets: 2, reps: '30s', restSeconds: 10 },
          { exerciseId: 'childs-pose', sets: 1, reps: '60s', restSeconds: 0 },
        ],
      },
    ],
  },
]
