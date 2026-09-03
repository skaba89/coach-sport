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

  // ─── 8 semaines muscle à domicile ────────────────────────────────
  {
    id: 'muscle-domicile-8s',
    name: 'Muscle à Domicile — 8 Semaines',
    difficulty: 'intermediaire',
    description: 'Programme d\'hypertrophie sur 8 semaines. 4 séances/semaine, 30 min. Volume progressif pour construire du muscle au poids du corps.',
    days: [
      {
        name: 'Semaine 1-2 · Push Volume',
        slots: [
          { exerciseId: 'push-up', sets: 4, reps: '12-15', restSeconds: 45 },
          { exerciseId: 'diamond-push-up', sets: 3, reps: '10-12', restSeconds: 45 },
          { exerciseId: 'pike-push-up', sets: 3, reps: '8-10', restSeconds: 50 },
          { exerciseId: 'chair-triceps-dips', sets: 3, reps: '12-15', restSeconds: 40 },
        ],
      },
      {
        name: 'Semaine 1-2 · Legs Volume',
        slots: [
          { exerciseId: 'squat', sets: 4, reps: '15-20', restSeconds: 45 },
          { exerciseId: 'lunge', sets: 3, reps: '12 / jambe', restSeconds: 45 },
          { exerciseId: 'glute-bridge', sets: 4, reps: '15-20', restSeconds: 40 },
          { exerciseId: 'calf-raises', sets: 4, reps: '20-25', restSeconds: 30 },
        ],
      },
      {
        name: 'Semaine 3-4 · Intensité Push',
        slots: [
          { exerciseId: 'wide-push-up', sets: 4, reps: '15-20', restSeconds: 40 },
          { exerciseId: 'archer-push-up', sets: 3, reps: '6-8 / bras', restSeconds: 60 },
          { exerciseId: 'pike-push-up', sets: 4, reps: '10-12', restSeconds: 50 },
          { exerciseId: 'explosive-push-up', sets: 3, reps: '8-10', restSeconds: 60 },
        ],
      },
      {
        name: 'Semaine 5-6 · Force + Volume',
        slots: [
          { exerciseId: 'archer-push-up', sets: 4, reps: '8-10 / bras', restSeconds: 60 },
          { exerciseId: 'pistol-squat-progression', sets: 3, reps: '6-8 / jambe', restSeconds: 60 },
          { exerciseId: 'hollow-body-hold', sets: 3, reps: '30-45s', restSeconds: 40 },
          { exerciseId: 'pull-up', sets: 3, reps: '5-8', restSeconds: 90 },
        ],
      },
    ],
  },

  // ─── 4 semaines express 15 min ───────────────────────────────────
  {
    id: 'express-15min-4s',
    name: 'Express 15 min — 4 Semaines',
    difficulty: 'debutant',
    description: 'Programme court de 4 semaines pour les emplois du temps chargés. 4 séances de 15 min/semaine. HIIT + force.',
    days: [
      {
        name: 'Semaine 1-2 · Full Body Express',
        slots: [
          { exerciseId: 'push-up', sets: 3, reps: '10-12', restSeconds: 30 },
          { exerciseId: 'squat', sets: 3, reps: '15', restSeconds: 30 },
          { exerciseId: 'mountain-climbers', sets: 3, reps: '30s', restSeconds: 20 },
          { exerciseId: 'plank', sets: 3, reps: '20-30s', restSeconds: 20 },
        ],
      },
      {
        name: 'Semaine 1-2 · Cardio Express',
        slots: [
          { exerciseId: 'jumping-jacks', sets: 3, reps: '30s', restSeconds: 15 },
          { exerciseId: 'high-knees', sets: 3, reps: '30s', restSeconds: 15 },
          { exerciseId: 'burpees', sets: 3, reps: '8-10', restSeconds: 30 },
          { exerciseId: 'skater-jumps', sets: 3, reps: '20s', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 3-4 · Intensité Express',
        slots: [
          { exerciseId: 'push-up', sets: 3, reps: '12-15', restSeconds: 25 },
          { exerciseId: 'jump-squat', sets: 3, reps: '12', restSeconds: 25 },
          { exerciseId: 'bicycle-crunch', sets: 3, reps: '20', restSeconds: 20 },
          { exerciseId: 'plank', sets: 3, reps: '30-40s', restSeconds: 20 },
        ],
      },
    ],
  },

  // ─── 6 semaines cardio sans sauts ────────────────────────────────
  {
    id: 'cardio-sans-sauts-6s',
    name: 'Cardio Sans Sauts — 6 Semaines',
    difficulty: 'debutant',
    description: 'Programme cardio low-impact sur 6 semaines. 3 séances/semaine, 20 min. Idéal pour préserver les articulations.',
    days: [
      {
        name: 'Semaine 1-2 · Low Impact A',
        slots: [
          { exerciseId: 'march-in-place', sets: 3, reps: '60s', restSeconds: 20 },
          { exerciseId: 'step-jacks', sets: 3, reps: '30s', restSeconds: 15 },
          { exerciseId: 'shadow-boxing', sets: 3, reps: '45s', restSeconds: 20 },
          { exerciseId: 'squat', sets: 3, reps: '12-15', restSeconds: 30 },
        ],
      },
      {
        name: 'Semaine 1-2 · Low Impact B',
        slots: [
          { exerciseId: 'mountain-climbers', sets: 3, reps: '30s', restSeconds: 20 },
          { exerciseId: 'squat-to-reach', sets: 3, reps: '15', restSeconds: 25 },
          { exerciseId: 'plank-jacks', sets: 3, reps: '30s', restSeconds: 20 },
          { exerciseId: 'dead-bug', sets: 3, reps: '10 / côté', restSeconds: 25 },
        ],
      },
      {
        name: 'Semaine 3-4 · Progression',
        slots: [
          { exerciseId: 'shadow-boxing', sets: 4, reps: '60s', restSeconds: 20 },
          { exerciseId: 'squat', sets: 4, reps: '15-20', restSeconds: 25 },
          { exerciseId: 'mountain-climbers', sets: 4, reps: '40s', restSeconds: 20 },
          { exerciseId: 'lunge', sets: 3, reps: '10 / jambe', restSeconds: 30 },
        ],
      },
    ],
  },

  // ─── 8 semaines 50+ remise en forme ──────────────────────────────
  {
    id: 'cinquantenaire-8s',
    name: '50+ Remise en Forme — 8 Semaines',
    difficulty: 'debutant',
    description: 'Programme doux pour les 50 ans et plus. 3 séances/semaine, 20 min. Renforcement + mobilité + équilibre.',
    days: [
      {
        name: 'Semaine 1-2 · Doux',
        slots: [
          { exerciseId: 'wall-push-up', sets: 3, reps: '10-12', restSeconds: 45 },
          { exerciseId: 'chair-assisted-squat', sets: 3, reps: '10', restSeconds: 45 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '12', restSeconds: 40 },
          { exerciseId: 'bird-dog', sets: 3, reps: '8 / côté', restSeconds: 40 },
          { exerciseId: 'cat-cow-stretch', sets: 2, reps: '30s', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 3-4 · Progression',
        slots: [
          { exerciseId: 'incline-pushup-elevated', sets: 3, reps: '10-12', restSeconds: 40 },
          { exerciseId: 'sit-to-stand', sets: 3, reps: '12', restSeconds: 40 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '15', restSeconds: 35 },
          { exerciseId: 'dead-bug', sets: 3, reps: '10 / côté', restSeconds: 35 },
          { exerciseId: 'hip-flexor-stretch', sets: 2, reps: '30s / côté', restSeconds: 15 },
        ],
      },
      {
        name: 'Semaine 5-6 · Stabilisation',
        slots: [
          { exerciseId: 'knee-push-up', sets: 3, reps: '8-10', restSeconds: 40 },
          { exerciseId: 'squat', sets: 3, reps: '10-12', restSeconds: 40 },
          { exerciseId: 'bird-dog', sets: 3, reps: '12 / côté', restSeconds: 35 },
          { exerciseId: 'tree-pose', sets: 2, reps: '20s / jambe', restSeconds: 20 },
          { exerciseId: 'standing-forward-fold', sets: 2, reps: '30s', restSeconds: 15 },
        ],
      },
    ],
  },

  // ─── 4 semaines voyage / hôtel ───────────────────────────────────
  {
    id: 'voyage-hotel-4s',
    name: 'Voyage / Hôtel — 4 Semaines',
    difficulty: 'debutant',
    description: 'Programme pour entraînement en voyage. Aucun équipement, espace réduit. 3 séances/semaine, 15 min.',
    days: [
      {
        name: 'Semaine 1-2 · Chambre',
        slots: [
          { exerciseId: 'push-up', sets: 3, reps: '10-12', restSeconds: 30 },
          { exerciseId: 'squat', sets: 3, reps: '15', restSeconds: 30 },
          { exerciseId: 'plank', sets: 3, reps: '30s', restSeconds: 25 },
          { exerciseId: 'mountain-climbers', sets: 3, reps: '30s', restSeconds: 20 },
        ],
      },
      {
        name: 'Semaine 1-2 · Petit Espace',
        slots: [
          { exerciseId: 'diamond-push-up', sets: 3, reps: '8-10', restSeconds: 30 },
          { exerciseId: 'lunge', sets: 3, reps: '10 / jambe', restSeconds: 30 },
          { exerciseId: 'dead-bug', sets: 3, reps: '10 / côté', restSeconds: 25 },
          { exerciseId: 'jumping-jacks', sets: 3, reps: '30s', restSeconds: 20 },
        ],
      },
      {
        name: 'Semaine 3-4 · Intensité',
        slots: [
          { exerciseId: 'push-up', sets: 4, reps: '12-15', restSeconds: 25 },
          { exerciseId: 'squat', sets: 4, reps: '20', restSeconds: 25 },
          { exerciseId: 'burpees', sets: 3, reps: '8-10', restSeconds: 30 },
          { exerciseId: 'plank', sets: 3, reps: '45s', restSeconds: 25 },
        ],
      },
    ],
  },
]
