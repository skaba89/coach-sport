# Feuille de route — de l'app locale au SaaS commercialisable

État : Phase 0 terminée (app locale complète). Ce document couvre la suite.

## Phase 1 — Backend (en cours)

**Base de données : Neon** (choisi à la place de Supabase — Postgres pur, pas d'auth intégrée).

- [x] Schéma de base de données (`db/schema.sql`)
- [x] Projet Neon créé (par toi)
- [ ] **Toi** : coller `db/schema.sql` dans la console Neon (SQL Editor) — voir `db/SETUP.md`. Je n'ai pas pu le faire depuis cette session : l'hôte Neon n'est pas autorisé en sortie réseau du sandbox.
- [ ] Petite API serveur (à écrire) qui garde la chaîne de connexion Neon secrète — jamais exposée au navigateur
- [ ] Hébergement de cette API : **Vercel** recommandé (fonctions serverless gratuites, s'intègre bien avec Neon) — implique de migrer l'hébergement du frontend de GitHub Pages vers Vercel au passage

## Phase 2 — Comptes & synchronisation

- [ ] Système d'authentification maison (email + mot de passe haché, JWT) — Neon n'a pas d'auth intégrée comme Supabase
- [ ] Écrans connexion/inscription
- [ ] Migration de la persistance : IndexedDB local → API/Neon (profil, séances, favoris)
- [ ] Les données existantes déjà sur ton appareil restent lisibles et sont migrées au premier login
- [ ] Synchronisation multi-appareils

## Phase 3 — Abonnement (Stripe)

- [ ] Décision : modèle économique (abonnement / achat unique / freemium) — à définir avec toi
- [ ] Compte Stripe (le tien, pour la facturation — même principe que Supabase)
- [ ] Page de tarifs, paiement, gestion d'abonnement (annulation, changement de plan)
- [ ] Paywall : quelles fonctionnalités restent gratuites vs payantes

## Phase 4 — Back-office admin

- [ ] Interface pour gérer exercices/programmes sans toucher au code
- [ ] Vue utilisateurs (support client basique)
- [ ] Statistiques d'usage agrégées (pas de données personnelles sensibles)

## Phase 5 — Conformité légale

- [ ] CGU, politique de confidentialité (RGPD), mentions légales
- [ ] Disclaimer médical explicite (important vu le module "Dos")
- [ ] Politique de suppression de compte/données (droit à l'oubli RGPD)
- [ ] Recommandé : relecture par un professionnel du droit avant lancement public — je peux rédiger un premier jet, pas remplacer un avis juridique

## Phase 6 — Vraies vidéos (optionnel, sur budget)

- [ ] Reste sur les animations SVG (gratuit, déjà fait) tant que non prioritaire
- [ ] Si budget : fournisseur vidéo sous licence, ou tournage propre
- [ ] Infrastructure de lecture vidéo (lazy loading, cache, fallback) déjà anticipée dans l'architecture

## Ce qui ne change pas

Le frontend React actuel (pages, composants, logique métier, générateur de séance, animations) est réutilisé tel quel — seule la couche de persistance change (IndexedDB → API/Neon). Rien de ce qui a été construit n'est jeté.
