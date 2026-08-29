# Coach Sport — PWA de suivi d'entraînement calisthénie

Application mobile-first React 19 / TypeScript / Vite avec authentification JWT,
vidéos CC0, persistance multi-user (Postgres via Neon), abonnements Stripe,
et tests e2e Playwright.

[![Build status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/tests-46%20passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## Stack

- **Frontend** : React 19, TypeScript 6 (strict mode), Vite 8, Tailwind CSS 4
- **State** : Zustand (ephemeral), Dexie/IndexedDB (offline), HTTP adapter (online)
- **Backend** : Express 5 (production) ou Vite middleware (dev)
- **Auth** : JWT (jose) + bcrypt, access token 15min + refresh token 30j
- **DB** : Neon Postgres serverless (production) ou in-memory (dev)
- **Payments** : Stripe Checkout + subscriptions + webhook
- **Tests** : Vitest (unitaires, 23) + Playwright (e2e, 23)
- **PWA** : vite-plugin-pwa (auto-update, installable, offline-capable)

## Fonctionnalités

- ✅ Authentification complète (register, login, refresh, logout, delete account)
- ✅ Routes protégées + redirection auto vers /login
- ✅ 12 vidéos CC0 Pexels couvrant 33+ exercices (style Nike Training Club)
- ✅ 4 programmes prédéfinis + générateur de séances dynamique
- ✅ 56 exercices filtrables par groupe, niveau, équipement
- ✅ Suivi des séances avec timer de repos, RPE, historique
- ✅ Favoris persistés
- ✅ Rate limiting (5 register/min, 10 login/min par IP)
- ✅ Stripe subscriptions prêtes (checkout + webhook)
- ✅ Repository pattern : switch automatique local (Dexie) ↔ remote (API)
- ✅ Code splitting (ExerciseAnimation lazy-loaded)
- ✅ CSP stricte, ErrorBoundary, accessibilité ARIA
- ✅ 46 tests automatisés verts

## Démarrage rapide (dev)

```bash
git clone https://github.com/skaba89/coach-sport.git
cd coach-sport
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173/
```

Sans variables d'environnement, l'app démarre en mode **local-only** :
- Authentification via API in-memory (perdue au redémarrage du serveur)
- Données stockées en in-memory côté API ET dans IndexedDB côté client
- Idéal pour démo / développement

## Déploiement

Voir [`DEPLOY.md`](./DEPLOY.md) pour le guide complet (Netlify, Render, Vercel).

### Netlify (recommandé — serverless)

1. Connectez le repo à Netlify
2. Config déjà présente dans `netlify.toml` :
   - Build command : `npm run build`
   - Publish directory : `dist`
3. Variables d'environnement à définir dans Netlify → Site settings → Environment :
   - `DATABASE_URL` — URL Neon Postgres
   - `JWT_SECRET` — clé secrète (32+ chars, `openssl rand -hex 32`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO` (optionnel)

### Render (long-running process)

1. Connectez le repo à Render
2. Le blueprint `render.yaml` définit 2 services :
   - `coach-sport-web` : frontend statique
   - `coach-sport-api` : serveur Express (long-running)
3. Variables à définir dans Render dashboard (voir `render.yaml`) :
   - `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`

## Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Prod | URL Neon Postgres (`postgresql://...`). Si absente, fallback in-memory. |
| `JWT_SECRET` | Prod | HMAC key pour signer les JWTs (32+ chars) |
| `STRIPE_SECRET_KEY` | Stripe | `sk_test_...` ou `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | `whsec_...` |
| `STRIPE_PRICE_ID_PRO` | Checkout | ID du prix Stripe du plan Pro |
| `CORS_ORIGIN` | Render API | URL du frontend (pour autoriser les appels CORS) |

## Tests

```bash
npm run test           # 23 tests unitaires Vitest
npm run e2e            # 23 tests e2e Playwright (auto-build + serveur)
npm run lint           # oxlint
npm run build          # tsc strict + vite build
```

## Structure

```
.
├── src/                # Frontend React
│   ├── components/     # Composants UI (NavBar, VideoPlayer, ErrorBoundary…)
│   ├── pages/          # Pages (Home, Workout, Exercises, auth/*…)
│   ├── lib/            # Logique pure (stats, duration, generateWorkout, auth/*)
│   ├── data/           # Catalogue statique (exercises, programs, videos)
│   ├── db/             # Dexie + repository pattern
│   └── stores/         # Zustand stores
├── server/             # Backend (Vite middleware + Express)
│   ├── middleware.ts        # /api/auth/* endpoints
│   ├── dataMiddleware.ts   # /api/sessions, /profile, /favorites
│   ├── stripeMiddleware.ts  # /api/subscriptions, /api/stripe/webhook
│   ├── pgUsers.ts          # Adapter Postgres pour users
│   ├── pgDataStore.ts      # Adapter Postgres pour data
│   ├── dataStore.ts         # Store in-memory (dev fallback)
│   ├── jwt.ts              # Sign/verify JWT (jose)
│   ├── users.ts            # Store in-memory users (dev fallback)
│   ├── rateLimit.ts        # Token bucket rate limiter
│   └── adapters.ts         # Choix runtime in-memory vs Postgres
├── server.ts           # Serveur Express standalone (Render / Railway / Fly.io)
├── db/schema.sql       # Schema Postgres (CHECK constraints + triggers)
├── e2e/                # Tests Playwright (auth, critical, data-persistence)
├── public/videos/      # 12 vidéos CC0 Pexels (~14 MB)
├── netlify.toml        # Config Netlify
├── render.yaml         # Blueprint Render
├── DEPLOY.md           # Guide de déploiement complet
└── LICENSE             # MIT
```

## Licence

MIT — voir [`LICENSE`](./LICENSE).
