# Base de données Neon — charger le schéma

Tu as déjà créé le projet Neon. Il reste à créer les tables.

## Charger le schéma

1. Va sur [console.neon.tech](https://console.neon.tech) → ton projet
2. **SQL Editor** (menu de gauche)
3. Colle tout le contenu de [`schema.sql`](./schema.sql) (dans ce même dossier)
4. **Run**

Ça crée les tables `users`, `profiles`, `workout_sessions`, `set_logs`, `favorites`, `subscriptions`.

> Je n'ai pas pu le faire moi-même depuis cette session : l'environnement dans lequel je tourne bloque les connexions sortantes vers l'hôte Neon (politique réseau du sandbox, pas un problème avec ta base). En passant par la console Neon dans ton navigateur, ça marche directement.

## Pourquoi ce schéma est différent de celui prévu pour Supabase

Neon fournit uniquement la base Postgres — pas de système de comptes/authentification intégré comme Supabase. Ce schéma a donc sa propre table `users` (email + mot de passe haché), et la sécurité (chaque utilisateur ne voit que ses données) sera appliquée par le code de l'API plutôt que par la base elle-même.

## Et après ?

Neon seul ne suffit pas à connecter le frontend en toute sécurité : la chaîne de connexion ne doit **jamais** être exposée dans le navigateur. Il faut une petite API côté serveur qui la garde secrète et expose des routes (`/api/login`, `/api/sessions`, etc.) que l'app appelle à la place.

Recommandation : héberger cette API sur **Vercel** (fonctions serverless, gratuit pour ce volume, s'intègre nativement avec Neon) plutôt que GitHub Pages (qui ne fait que du statique, pas de serveur). C'est un changement d'hébergement qu'on fera quand on attaquera cette étape — l'app actuelle déployée sur GitHub Pages continue de fonctionner entre-temps.
