/**
 * Shared Zod schemas for API validation (Lot 0.7).
 *
 * Used by both the Vite middleware (dev) and Netlify Functions (prod)
 * to validate incoming requests. The frontend can also import these
 * for client-side form validation — single source of truth.
 */
import { z } from 'zod'

// ─── Auth schemas ──────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide')
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Le mot de passe doit faire au moins 8 caractères')
    .max(128, 'Mot de passe trop long'),
}).strict()

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide')
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Mot de passe requis'),
}).strict()

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken requis'),
}).strict()

// ─── Data schemas ──────────────────────────────────────────────────

export const SetLogSchema = z.object({
  exerciseId: z.string().min(1),
  setIndex: z.number().int().min(0),
  reps: z.number().int().min(0),
  weightKg: z.number().optional(),
  completed: z.boolean(),
}).strict()

export const WorkoutSessionSchema = z.object({
  programId: z.string().optional(),
  dayName: z.string().min(1).max(200),
  startedAt: z.string().min(1),
  finishedAt: z.string().optional(),
  rpe: z.enum([
    'tres-facile', 'facile', 'correct', 'difficile', 'tres-difficile',
  ]).optional(),
  notes: z.string().max(5000).optional(),
  logs: z.array(SetLogSchema).default([]),
}).strict()

export const FavoriteSchema = z.object({
  type: z.enum(['exercise', 'program']),
  refId: z.string().min(1).max(200),
}).strict()

export const ProfileSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  goal: z.enum([
    'remise-en-forme', 'renforcement', 'muscle', 'endurance',
    'perte-de-poids', 'raffermissement', 'abdos', 'jambes',
    'fessiers', 'dos', 'mobilite',
  ]).optional(),
  level: z.enum(['debutant', 'intermediaire', 'avance', 'expert']).optional(),
  frequency: z.number().int().min(2).max(6).optional(),
  durationMinutes: z.number().int().optional(),
  equipment: z.enum(['none', 'chair', 'any']).optional(),
  preferences: z.array(z.string()).default([]),
  backSafetyClearedAt: z.string().optional(),
}).passthrough()  // allow extra fields for forward-compat

// ─── Types (inferred from schemas) ─────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type WorkoutSessionInput = z.infer<typeof WorkoutSessionSchema>
export type FavoriteInput = z.infer<typeof FavoriteSchema>
export type ProfileInput = z.infer<typeof ProfileSchema>
