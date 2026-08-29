-- Calisthenics Tracker — backend schema (Neon / plain Postgres)
--
-- Mirrors the local Dexie model (src/lib/types.ts, src/db/db.ts) so the
-- migration from "data lives in the browser" to "data lives on a server,
-- synced across devices" is a straight port, not a redesign.
--
-- Neon is Postgres only — no built-in auth like Supabase — so this schema
-- owns its own `users` table (email + hashed password) instead of relying
-- on a platform-provided auth.users. Authorization is enforced by the API
-- layer (every query scoped to the authenticated user's id), not by
-- Postgres row-level security — there's no built-in equivalent of
-- Supabase's auth.uid() here without a backend setting a session claim,
-- which is more machinery than this stage needs.
--
-- Run this once in the Neon SQL Editor (console.neon.tech → your project
-- → SQL Editor → paste → Run). Safe to re-run.

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ============================================================
-- updated_at trigger function (shared by profiles, workout_sessions, subscriptions)
-- ============================================================
-- A single trigger function used by all tables that maintain an updated_at
-- column. Avoids duplicating the same logic per-table.
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- users — email + password auth, owned by this app
-- ============================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null
    check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  -- bcrypt hashes are exactly 60 chars and start with $2a$ / $2b$ / $2y$
  password_hash text not null
    check (length(password_hash) = 60 and password_hash ~ '^\$2[aby]\$'),
  created_at timestamptz not null default now()
);

-- ============================================================
-- profiles — one row per user (onboarding answers)
-- ============================================================
create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  goal text
    check (goal in ('remise-en-forme','renforcement','muscle','endurance',
                    'perte-de-poids','raffermissement','abdos','jambes',
                    'fessiers','dos','mobilite')),
  level text
    check (level in ('debutant','intermediaire','avance','expert')),
  frequency int
    check (frequency between 2 and 6),
  duration_minutes int
    check (duration_minutes in (10,15,20,30,45,60)),
  equipment text
    check (equipment in ('none','chair','any')),
  preferences text[] default '{}',
  back_safety_cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_touch_updated_at on profiles;
create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

-- ============================================================
-- workout_sessions — one row per completed (or in-progress) session
-- ============================================================
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  program_id text,
  day_name text not null
    check (length(day_name) between 1 and 200),
  started_at timestamptz not null,
  finished_at timestamptz,
  rpe text
    check (rpe is null or rpe in ('tres-facile','facile','correct','difficile','tres-difficile')),
  notes text
    check (notes is null or length(notes) <= 5000),
  created_at timestamptz not null default now(),
  -- A finished session must have finished_at >= started_at
  check (finished_at is null or finished_at >= started_at)
);

create index if not exists workout_sessions_user_started_idx
  on workout_sessions (user_id, started_at desc);

-- ============================================================
-- set_logs — one row per logged set within a session
-- ============================================================
create table if not exists set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id text not null,
  set_index int not null check (set_index >= 0),
  reps int not null default 0 check (reps >= 0),
  weight_kg numeric check (weight_kg is null or weight_kg >= 0),
  completed boolean not null default false
);

create index if not exists set_logs_session_idx on set_logs (session_id);
-- Faster JOIN when fetching sessions+sets for one user (avoids the lookup
-- through workout_sessions.user_id on every set_logs row).
create index if not exists set_logs_exercise_idx on set_logs (exercise_id);

-- ============================================================
-- favorites — starred exercises/programs
-- ============================================================
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('exercise', 'program')),
  ref_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, type, ref_id)
);

-- ============================================================
-- subscriptions — prepared for Stripe billing (not wired up yet)
-- ============================================================
create table if not exists subscriptions (
  user_id uuid primary key references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text
    check (status in ('trialing','active','past_due','canceled','ended','incomplete','incomplete_expired')),
  plan text
    check (plan in ('free','pro','coach','monthly','annual','lifetime')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_touch_updated_at on subscriptions;
create trigger subscriptions_touch_updated_at
  before update on subscriptions
  for each row execute function touch_updated_at();
