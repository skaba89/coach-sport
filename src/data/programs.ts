import type { Program } from '../lib/types'
import { premiumPrograms } from './premiumPrograms'

// Les programmes "généraux" (débutant, intermédiaire, avancé) n'utilisent
// que des exercices sans équipement. Le programme "Chaise" est le seul à
// s'appuyer sur une chaise, et c'est annoncé dans son nom et sa description.

export const programs: Program[] = [
  {
    id: 'debutant-full-body',
    name: 'Débutant — Full Body 3x/semaine',
    difficulty: 'debutant',
    description:
      'Programme d\'introduction 100% poids du corps pour construire les bases de force sur tout le corps. À faire 3 fois par semaine avec un jour de repos entre chaque séance. Aucun équipement requis.',
    days: [
      {
        name: 'Séance A',
        slots: [
          { exerciseId: 'knee-push-up', sets: 3, reps: '8-12', restSeconds: 60 },
          { exerciseId: 'squat', sets: 3, reps: '12-15', restSeconds: 60 },
          { exerciseId: 'plank', sets: 3, reps: '20-30s', restSeconds: 45 },
          { exerciseId: 'glute-bridge', sets: 3, reps: '12-15', restSeconds: 45 },
        ],
      },
      {
        name: 'Séance B',
        slots: [
          { exerciseId: 'push-up', sets: 3, reps: '6-10', restSeconds: 60 },
          { exerciseId: 'lunge', sets: 3, reps: '8-10 / jambe', restSeconds: 60 },
          { exerciseId: 'dead-bug', sets: 3, reps: '8-10 / côté', restSeconds: 45 },
          { exerciseId: 'mountain-climbers', sets: 3, reps: '30s', restSeconds: 45 },
        ],
      },
    ],
  },
  {
    id: 'intermediaire-full-body',
    name: 'Intermédiaire — Full Body Circuit',
    difficulty: 'intermediaire',
    description:
      'Programme en 3 jours pour progresser en force et en volume, 100% poids du corps. À répéter selon ton rythme (2x par semaine par jour pour un total de 6 séances, ou 1x pour un rythme plus léger).',
    days: [
      {
        name: 'Jour 1 — Haut du corps',
        slots: [
          { exerciseId: 'push-up', sets: 4, reps: '10-15', restSeconds: 60 },
          { exerciseId: 'diamond-push-up', sets: 3, reps: '8-12', restSeconds: 60 },
          { exerciseId: 'pike-push-up', sets: 3, reps: '6-10', restSeconds: 90 },
          { exerciseId: 'side-plank', sets: 3, reps: '20-30s / côté', restSeconds: 45 },
        ],
      },
      {
        name: 'Jour 2 — Bas du corps',
        slots: [
          { exerciseId: 'jump-squat', sets: 4, reps: '10-12', restSeconds: 75 },
          { exerciseId: 'lunge', sets: 3, reps: '10-12 / jambe', restSeconds: 60 },
          { exerciseId: 'single-leg-glute-bridge', sets: 3, reps: '12-15 / jambe', restSeconds: 60 },
          { exerciseId: 'fire-hydrant', sets: 3, reps: '12-15 / côté', restSeconds: 45 },
        ],
      },
      {
        name: 'Jour 3 — Cardio & Core',
        slots: [
          { exerciseId: 'burpees', sets: 3, reps: '10-15', restSeconds: 60 },
          { exerciseId: 'bicycle-crunch', sets: 3, reps: '15-20', restSeconds: 45 },
          { exerciseId: 'hollow-body-hold', sets: 3, reps: '20-40s', restSeconds: 45 },
          { exerciseId: 'high-knees', sets: 3, reps: '30s', restSeconds: 45 },
        ],
      },
    ],
  },
  {
    id: 'avance-skills',
    name: 'Avancé — Skills & Force',
    difficulty: 'avance',
    description:
      'Programme orienté figures avancées (archer push-up, pistol squat, V-ups) pour pratiquants confirmés. 100% poids du corps.',
    days: [
      {
        name: 'Jour 1 — Push avancé',
        slots: [
          { exerciseId: 'archer-push-up', sets: 4, reps: '3-6 / bras', restSeconds: 120 },
          { exerciseId: 'diamond-push-up', sets: 3, reps: '12-15', restSeconds: 90 },
          { exerciseId: 'pike-push-up', sets: 3, reps: '10-15', restSeconds: 60 },
        ],
      },
      {
        name: 'Jour 2 — Jambes avancé',
        slots: [
          { exerciseId: 'pistol-squat-progression', sets: 4, reps: '3-6 / jambe', restSeconds: 120 },
          { exerciseId: 'jump-squat', sets: 3, reps: '15-20', restSeconds: 75 },
          { exerciseId: 'single-leg-glute-bridge', sets: 3, reps: '15-20 / jambe', restSeconds: 60 },
        ],
      },
      {
        name: 'Jour 3 — Core avancé',
        slots: [
          { exerciseId: 'v-ups', sets: 4, reps: '10-15', restSeconds: 60 },
          { exerciseId: 'l-sit', sets: 3, reps: '10-20s', restSeconds: 60 },
          { exerciseId: 'burpees', sets: 4, reps: '15-20', restSeconds: 45 },
        ],
      },
    ],
  },
  {
    id: 'chaise-a-la-maison',
    name: '🪑 Chaise — Renfo à la maison / en voyage',
    difficulty: 'debutant',
    description:
      'Seul programme de l\'app qui utilise une chaise. Idéal en chambre d\'hôtel ou pour progresser en douceur : la chaise sert d\'appui pour l\'équilibre et de support pour aller plus profond en sécurité. Utilise une chaise stable, sans roulettes.',
    days: [
      {
        name: 'Jour 1',
        slots: [
          { exerciseId: 'chair-squat', sets: 3, reps: '10-15', restSeconds: 60 },
          { exerciseId: 'incline-pushup-chair', sets: 3, reps: '8-12', restSeconds: 60 },
          { exerciseId: 'chair-knee-raises', sets: 3, reps: '10-15', restSeconds: 45 },
          { exerciseId: 'hip-thrust-chair', sets: 3, reps: '12-15', restSeconds: 45 },
        ],
      },
      {
        name: 'Jour 2',
        slots: [
          { exerciseId: 'bulgarian-split-squat-chair', sets: 3, reps: '8-10 / jambe', restSeconds: 75 },
          { exerciseId: 'chair-triceps-dips', sets: 3, reps: '8-12', restSeconds: 60 },
          { exerciseId: 'step-back-lunge-chair', sets: 3, reps: '8-10 / jambe', restSeconds: 60 },
          { exerciseId: 'seated-knee-tucks', sets: 3, reps: '10-15', restSeconds: 45 },
        ],
      },
    ],
  },
]

export function getProgramById(id: string): Program | undefined {
  return programs.find((p) => p.id === id)
    ?? premiumPrograms.find((p) => p.id === id)
}
