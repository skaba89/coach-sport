# Architecture — Coach Sport

## Vue d'ensemble

```
Coach Sport — PWA de coaching fitness calisthénie premium
│
├── Frontend (React 19 + TypeScript 6 + Vite 8 + Tailwind 4)
│   ├── Pages (15 routes)
│   ├── Components (VideoWithInstructions, ErrorBoundary, NavBar, etc.)
│   ├── Lib (coachEngine, coachChat, gamification, challenges, i18n, etc.)
│   └── Stores (Zustand persist pour séance active)
│
├── Backend (Vite middleware + Netlify Functions)
│   ├── Auth (JWT + bcrypt + rate limiting + Zod validation)
│   ├── Data (sessions, profile, favorites — scoped by userId)
│   └── Stripe (checkout + webhook + subscriptions)
│
├── Database
│   ├── IndexedDB (Dexie) — offline-first, isolé par ownerId
│   └── PostgreSQL (Neon) — production, schema.sql avec CHECK constraints
│
├── PWA
│   ├── Service Worker (Workbox autoUpdate)
│   ├── Manifest (installable, standalone)
│   └── 56 vidéos CC0 + 56 posters .webp
│
└── DevOps
    ├── CI (GitHub Actions: lint + test + build + e2e)
    ├── Deploy (Netlify Functions + static)
    └── Security (SECURITY.md, PR template, Dependabot)
```

## Structure des dossiers

```
src/
├── components/         # Composants UI réutilisables
│   ├── auth/           # ProtectedRoute
│   ├── VideoWithInstructions.tsx  # Vidéo + overlay + voix-off
│   ├── VideoPlayer.tsx            # Lecteur vidéo simple (legacy)
│   ├── ErrorBoundary.tsx
│   ├── NavBar.tsx                 # Navigation 4 onglets
│   └── ...
├── data/               # Catalogue statique
│   ├── exercises.ts    # 125 exercices
│   ├── programs.ts     # 4 programmes standards
│   ├── premiumPrograms.ts # 6 programmes premium
│   └── videos.ts       # 56 clips CC0 + aliases
├── db/                 # Persistance
│   ├── db.ts           # Dexie + ownerId isolation + wipe
│   ├── repository.ts   # Adapter pattern (Dexie ↔ HTTP)
│   └── httpRepository.ts # API HTTP adapter
├── lib/                # Logique métier
│   ├── auth/           # AuthContext, api, types
│   ├── coachEngine.ts  # Coach V2 (recovery, progression, weekly plan)
│   ├── coachChat.ts    # IA conversationnelle (parseIntent + response)
│   ├── challenges.ts   # 8 challenges + tracking
│   ├── gamification.ts # Badges, levels, weekly goal
│   ├── personalRecords.ts # PR tracking
│   ├── observability.ts # Web vitals + error logging
│   ├── i18n.ts         # Système fr/en
│   ├── schemas.ts      # Zod validation (server-side)
│   └── ...
├── pages/              # 15 pages
│   ├── Home.tsx        # Coach UX (plan du jour, badges, streak)
│   ├── Explore.tsx     # Programmes + exercices + quick workouts
│   ├── CoachChat.tsx   # Chat IA
│   ├── Challenges.tsx  # Liste des challenges
│   ├── Admin.tsx       # Back-office (stats, exercices, vidéos)
│   ├── Pricing.tsx     # Plans freemium
│   └── ...
├── stores/
│   └── workoutStore.ts # Zustand persist (séance active)
└── main.tsx            # Entry point (i18n + error handlers + web vitals)

server/
├── middleware.ts       # Auth endpoints (register, login, refresh, me)
├── dataMiddleware.ts   # Data endpoints (sessions, profile, favorites)
├── stripeMiddleware.ts # Stripe (checkout, webhook, subscriptions)
├── jwt.ts              # JWT sign/verify (lazy secret init)
├── users.ts            # In-memory user store (dev)
├── pgUsers.ts          # Postgres user adapter (prod)
├── pgDataStore.ts      # Postgres data adapter (prod)
├── dataStore.ts        # In-memory data store (dev)
├── rateLimit.ts        # Token bucket rate limiter
├── schemas.ts          # Zod schemas partagés
└── adapters.ts         # Runtime switch in-memory ↔ Postgres

netlify/functions/       # Netlify Functions (production)
├── _common.ts          # Handler générique (event → req/res)
├── _router.ts          # Middleware chain
├── auth/auth.ts        # /api/auth/*
├── data/data.ts        # /api/sessions, /profile, /favorites
└── stripe/stripe.ts    # /api/subscriptions, /api/stripe/webhook

db/
└── schema.sql          # 6 tables Postgres + CHECK + triggers + index

e2e/                     # Tests Playwright (23 tests)
├── auth-flow.spec.ts
├── critical-flow.spec.ts
└── data-persistence.spec.ts
```

## Flux de données

```
Utilisateur
    ↓
UI (React)
    ↓
useDataStore hooks (useSessions, useProfile, useFavorites)
    ↓
getDataStore() → choisit l'adapter
    ├── Non authentifié → Dexie (IndexedDB, ownerId='anonymous')
    └── Authentifié → HTTP adapter (/api/* → Netlify Functions)
                            ↓
                        authenticate(req) → verifyAccessToken
                            ↓
                        usersAdapter → in-memory ou Postgres
                            ↓
                        dataStore → in-memory ou Postgres (scoped by userId)
```

## Sécurité

| Mesure | Implémentation |
|--------|----------------|
| Password hashing | bcrypt 10 rounds |
| JWT | access 15min + refresh 30j (jose HS256) |
| JWT secret | Hard-fail en production si < 32 chars |
| Rate limiting | 5 register/min, 10 login/min per IP |
| API validation | Zod safeParse sur tous les endpoints |
| IndexedDB isolation | ownerId filtering + wipe au logout |
| CSP | script-src 'self' 'unsafe-inline', frame-ancestors via headers |
| Mass assignment | .strict() sur tous les schémas Zod |
| Secrets | .gitignore + .env.example, aucun secret dans Git |

## Tests

| Type | Count | Framework |
|------|-------|-----------|
| Unitaires | 59 | Vitest |
| E2E | 23 | Playwright |
| **Total** | **82** | |

Couverture: duration, stats, ExerciseTarget, coachEngine (recovery, progression, weekly plan, skill graph)

## Déploiement

1. **Netlify** (recommandé) — `netlify.toml` configuré
2. **Render** — `render.yaml` blueprint (web + api)
3. **Vercel** — `vercel.json` configuré

Voir `DEPLOY.md` pour le guide complet.
