# Déploiement — Coach Sport

Guide complet pour déployer l'app sur Netlify, Render, ou Vercel.

## Table des matières

- [Prérequis](#prérequis)
- [Option 1 — Netlify (serverless, recommandé)](#option-1--netlify-serverless-recommandé)
- [Option 2 — Render (long-running process)](#option-2--render-long-running-process)
- [Option 3 — Vercel (serverless)](#option-3--vercel-serverless)
- [Base de données Neon Postgres](#base-de-données-neon-postgres)
- [Stripe webhook](#stripe-webhook)
- [Variables d'environnement](#variables-denvironnement)
- [Smoke test post-déploiement](#smoke-test-post-déploiement)
- [Monitoring](#monitoring)
- [Rollback](#rollback)

---

## Prérequis

- Un compte [GitHub](https://github.com) avec ce repo poussé
- Une base [Neon Postgres](https://neon.tech) (gratuit, 0.5 Go)
- Un compte [Stripe](https://stripe.com) (test mode pour le dev)
- Optionnel : un compte [Sentry](https://sentry.io) pour le monitoring d'erreurs

---

## Option 1 — Netlify (serverless, recommandé)

Netlify déploie le frontend statique et utilise des Netlify Functions pour `/api/*`.

### Étapes

1. **Connectez le repo à Netlify**
   - Allez sur <https://app.netlify.com/start>
   - Choisissez votre repo GitHub
   - Netlify détecte automatiquement `netlify.toml` (build + redirects déjà configurés)

2. **Configurez les variables d'environnement** dans Netlify → Site settings → Environment variables :

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/db?sslmode=require` |
   | `JWT_SECRET` | `openssl rand -hex 32` (générez une clé aléatoire) |
   | `STRIPE_SECRET_KEY` | `sk_test_...` (depuis Stripe dashboard) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (configuré après le webhook) |

3. **Créez les Netlify Functions** pour exposer l'API
   - Créez un dossier `netlify/functions/` à la racine
   - Portez chaque handler de `server/middleware.ts`, `server/dataMiddleware.ts`, `server/stripeMiddleware.ts` vers une fonction Netlify
   - Voir <https://docs.netlify.com/functions/overview/> pour la signature

4. **Déployez** : Netlify build le projet avec `npm run build` et publie `dist/`

5. **Configurez le webhook Stripe** (voir [Stripe webhook](#stripe-webhook))

### Notes

- Netlify Functions ont un cold-start de ~50ms — acceptable pour de l'auth
- 125k function invocations/mois sur le free tier — largement suffisant pour démarrer
- HTTPS automatique via le CDN Netlify

---

## Option 2 — Render (long-running process)

Render exécute le serveur Express (`server.ts`) comme un long-running process.

### Étapes

1. **Connectez le repo à Render**
   - Allez sur <https://dashboard.render.com/select-repo>
   - Sélectionnez votre repo
   - Render détecte `render.yaml` et propose de créer les 2 services :
     - `coach-sport-web` (static site, frontend)
     - `coach-sport-api` (web service, backend Express)

2. **Configurez les variables d'environnement** dans Render dashboard :
   - Sur `coach-sport-api` :
     - `DATABASE_URL` — URL Neon Postgres
     - `JWT_SECRET` — clé secrète
     - `CORS_ORIGIN` — URL du service `coach-sport-web` (ex : `https://coach-sport-web.onrender.com`)
     - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO` (optionnel)
   - Sur `coach-sport-web` :
     - `VITE_API_URL` — URL du service `coach-sport-api` (ex : `https://coach-sport-api.onrender.com`)

3. **Update `src/lib/auth/api.ts`** pour pointer vers l'URL Render :
   ```ts
   const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/auth`
   ```

4. **Déployez** : Render build avec `npm install && npm run build` puis démarre `npm run serve:api`

5. **Configurez le webhook Stripe** avec l'URL Render :
   `https://coach-sport-api.onrender.com/api/stripe/webhook`

### Notes

- Le free tier Render met le service en sleep après 15 min d'inactivité (~50ms cold-start)
- Pour éviter le sleep, payez $7/mois pour le "Starter" plan
- HTTPS automatique via le proxy Render

---

## Option 3 — Vercel (serverless)

Vercel fonctionne comme Netlify mais avec une intégration Vite native.

### Étapes

1. **Importez le repo** sur <https://vercel.com/new>
2. Vercel détecte `vercel.json` (déjà configuré) :
   - Framework : Vite
   - Build command : `npm run build`
   - Output directory : `dist`
3. Variables d'environnement (même liste que Netlify)
4. Pour l'API : portez les handlers vers `/api/*` functions (Vercel Functions, syntaxe Node.js)

---

## Base de données Neon Postgres

### Création

1. Créez un compte sur <https://neon.tech>
2. Créez un projet, copiez la connection string :
   ```
   postgresql://user:password@ep-xxx.eu-west-2.aws.neon.tech/dbname?sslmode=require
   ```

### Initialisation du schéma

1. Dans le Neon dashboard → SQL Editor
2. Collez le contenu de [`db/schema.sql`](./db/schema.sql)
3. Exécutez — le script est idempotent (safe to re-run)

Le script crée :
- Tables : `users`, `profiles`, `workout_sessions`, `set_logs`, `favorites`, `subscriptions`
- Contraintes CHECK (email format, bcrypt hash length, enums, frequency 2-6, etc.)
- Trigger `touch_updated_at()` pour `updated_at` automatique
- Index pour les requêtes fréquentes

---

## Stripe webhook

### Configuration

1. Stripe Dashboard → <https://dashboard.stripe.com/webhooks>
2. **Add endpoint** :
   - URL : `https://YOUR-DOMAIN/api/stripe/webhook`
   - Events :
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. Copiez le **Signing secret** (`whsec_...`)
4. Ajoutez-le comme `STRIPE_WEBHOOK_SECRET` dans Netlify/Render

### Test local (dev)

```bash
# Installez la Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# ou : sudo apt install stripe  # Linux

# Forward les events vers votre serveur local
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

La CLI affiche votre `whsec_...` local → ajoutez-le à `.env.local` :
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Variables d'environnement

| Variable | Requis | Default (dev) | Description |
|----------|--------|---------------|-------------|
| `DATABASE_URL` | Prod | — | URL Neon Postgres. Si absente, in-memory store. |
| `JWT_SECRET` | Prod | `dev-only-secret-...` | HMAC key pour JWT (32+ chars). **Change en prod !** |
| `STRIPE_SECRET_KEY` | Stripe | — | `sk_test_...` ou `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | — | `whsec_...` |
| `STRIPE_PRICE_ID_PRO` | Checkout | — | Price ID Stripe pour le plan Pro |
| `CORS_ORIGIN` | Render API | `*` | URL du frontend (pour CORS strict) |
| `VITE_API_URL` | Render frontend | (vide) | URL de l'API (pour Render où l'API est sur un autre domaine) |

---

## Smoke test post-déploiement

```bash
# 1. Health check (Render uniquement)
curl https://YOUR-API-DOMAIN/api/health
# → { "status": "ok", "postgres": true, "stripe": true }

# 2. Register un utilisateur
curl -X POST https://YOUR-DOMAIN/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'
# → 201 + { user, accessToken, refreshToken }

# 3. Visitez l'app dans le navigateur
open https://YOUR-DOMAIN
# → page de login s'affiche

# 4. Testez le flow complet : register → onboarding → workout → reload
# 5. Vérifiez que les données persistent après reload (Postgres branché)
```

---

## Monitoring

- **Netlify Analytics** : built-in, free tier couvre le RUM de base
- **Vercel Analytics** : similaire, intégré au free tier
- **Sentry** : pour le tracking d'erreurs en production
  - Frontend : `npm install @sentry/react`
  - Backend : `npm install @sentry/node`
- **Neon dashboard** : métriques de requêtes + storage

---

## Rollback

### Netlify/Vercel

1. Dashboard → Deployments
2. Trouvez la dernière deployment connue-good
3. Menu `...` → **Promote to Production**

### Render

1. Dashboard → Service → Deployments
2. **Rollback** vers le commit précédent

### Neon Postgres

- Point-in-time recovery (PITR) jusqu'à 7 jours sur le free tier
- Action : Neon dashboard → Restore → choisir un timestamp

---

## Troubleshooting

### "404 page not found" sur les routes SPA

- Vérifiez que le redirect SPA est configuré (`netlify.toml` ou `render.yaml`)
- Pour Netlify : `[[redirects]] from = "/*" to = "/index.html" status = 200`
- Pour Render : `routes: - type: rewrite source: /* destination: /index.html`

### Erreur 500 sur /api/auth/register

- Vérifiez que `DATABASE_URL` est correctement définie
- Vérifiez que l'URL commence par `postgresql://` ou `postgres://` (pas `file:`)
- Vérifiez que `db/schema.sql` a été exécuté dans Neon

### "User no longer exists" après login

- Le serveur a redémarré en mode in-memory (sans DATABASE_URL)
- Toutes les données créées en mode in-memory sont perdues au redémarrage
- Configurez `DATABASE_URL` pour la persistance

### Erreur CORS

- Vérifiez que `CORS_ORIGIN` est bien l'URL du frontend (sans trailing slash)
- Pour Render, `CORS_ORIGIN=https://coach-sport-web.onrender.com`
- Vérifiez que le navigateur ne bloque pas les cookies cross-origin (SameSite)
