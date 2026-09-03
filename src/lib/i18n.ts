/**
 * Minimal i18n system (fr/en) — Lot 16 from the spec.
 *
 * Not using a heavy library (i18next, react-intl) — the app is small
 * enough that a simple record-based approach works. Migrate to a full
 * library if the app grows beyond ~200 strings.
 *
 * Usage:
 *   import { t, useLanguage } from './lib/i18n'
 *   const msg = t('home.welcome')  // → "Bienvenue" or "Welcome"
 */

export type Language = 'fr' | 'en'

const DEFAULT_LANG: Language = 'fr'

// ─── Translation dictionary ────────────────────────────────────────

type Dict = Record<string, string>

const fr: Dict = {
  // App
  'app.name': 'Coach Sport',
  'app.tagline': 'Ton coach fitness à domicile',

  // Nav
  'nav.home': 'Accueil',
  'nav.programs': 'Programmes',
  'nav.exercises': 'Exercices',
  'nav.progress': 'Progression',
  'nav.profile': 'Profil',

  // Auth
  'auth.login': 'Se connecter',
  'auth.register': 'Créer un compte',
  'auth.logout': 'Se déconnecter',
  'auth.email': 'Email',
  'auth.password': 'Mot de passe',
  'auth.confirmPassword': 'Confirme le mot de passe',
  'auth.welcomeBack': 'Bon retour',
  'auth.createAccount': 'Crée ton compte',
  'auth.freeNoCard': 'Gratuit, sans carte bancaire. Tout reste privé.',
  'auth.alreadyHaveAccount': 'Déjà un compte ?',
  'auth.noAccount': 'Pas encore de compte ?',
  'auth.connect': 'Connecte-toi',
  'auth.invalidCredentials': 'Identifiants invalides',
  'auth.passwordMismatch': 'Les mots de passe ne correspondent pas.',
  'auth.passwordTooShort': 'Le mot de passe doit faire au moins 8 caractères.',

  // Home
  'home.coach': 'Coach',
  'home.recommended': 'Séance recommandée',
  'home.quickWorkouts': 'Entraînements rapides',
  'home.minutes': 'minutes',
  'home.start': 'Commencer',
  'home.lastSession': 'Dernière séance',
  'home.programs': 'Programmes',
  'home.seeAll': 'Tout voir',
  'home.freeTimer': 'Lancer un minuteur libre',
  'home.weeklyGoal': 'Objectif hebdo',
  'home.goalReached': '🎉 Objectif atteint cette semaine !',
  'home.badges': 'Récompenses',

  // Workout
  'workout.active': 'Séance en cours',
  'workout.noActive': 'Aucune séance en cours.',
  'workout.chooseProgram': 'Choisir un programme',
  'workout.cancel': 'Annuler la séance',
  'workout.rest': 'Repos',
  'workout.skipRest': 'Passer le repos',
  'workout.set': 'Série',
  'workout.reps': 'reps',
  'workout.target': 'Objectif',
  'workout.finish': 'Terminer la séance',
  'workout.completed': 'séries validées',
  'workout.sessionDone': 'Séance terminée !',
  'workout.howWasIt': 'Comment était la séance ?',
  'workout.saveFailed': 'Échec de l\'enregistrement de la séance.',

  // Exercises
  'exercises.title': 'Bibliothèque d\'exercices',
  'exercises.search': 'Rechercher un exercice...',
  'exercises.favorites': 'Favoris',
  'exercises.allEquipment': 'Tout équipement',
  'exercises.allGroups': 'Tous les groupes',
  'exercises.allLevels': 'Tous niveaux',
  'exercises.noResults': 'Aucun exercice ne correspond aux filtres.',
  'exercises.notFound': 'Exercice introuvable.',
  'exercises.howTo': 'Comment faire',
  'exercises.progression': 'Progression',
  'exercises.alternative': 'Alternative sans chaise',
  'exercises.demonstration': 'Démonstration',

  // History
  'history.title': 'Progression',
  'history.thisWeek': 'Cette semaine',
  'history.sessions': 'séance',
  'history.minutes': 'minutes',
  'history.regularity': 'régularité',
  'history.volume': 'Volume (répétitions) — 14 derniers jours',
  'history.sessionHistory': 'Historique des séances',
  'history.noSessions': 'Aucune séance enregistrée pour l\'instant.',
  'history.delete': 'Supprimer',
  'history.deleteConfirm': 'Supprimer cette séance ? Cette action est définitive.',

  // Profile
  'profile.title': 'Mon profil',
  'profile.deleteAccount': 'Supprimer mon compte',
  'profile.deleteWarning': 'Cette action est définitive. Toutes tes données seront effacées.',
  'profile.deleteConfirm': 'Confirmer la suppression',
  'profile.cancel': 'Annuler',
  'profile.memberSince': 'Membre depuis le',

  // Onboarding
  'onboarding.title': 'Personnalise ton entraînement',
  'onboarding.subtitle': 'Deux minutes pour qu\'on te propose des séances adaptées.',
  'onboarding.goal': 'Objectif',
  'onboarding.level': 'Niveau',
  'onboarding.frequency': 'Fréquence',
  'onboarding.duration': 'Durée par séance',
  'onboarding.equipment': 'Équipement disponible',
  'onboarding.preferences': 'Préférences (optionnel)',
  'onboarding.save': 'Enregistrer mon profil',

  // Common
  'common.loading': 'Chargement',
  'common.error': 'Une erreur est survenue',
  'common.retry': 'Réessayer',
  'common.cancel': 'Annuler',
  'common.confirm': 'Confirmer',
  'common.save': 'Enregistrer',
  'common.delete': 'Supprimer',
  'common.back': 'Retour',
}

const en: Dict = {
  'app.name': 'Coach Sport',
  'app.tagline': 'Your home fitness coach',

  'nav.home': 'Home',
  'nav.programs': 'Programs',
  'nav.exercises': 'Exercises',
  'nav.progress': 'Progress',
  'nav.profile': 'Profile',

  'auth.login': 'Log in',
  'auth.register': 'Create account',
  'auth.logout': 'Log out',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.welcomeBack': 'Welcome back',
  'auth.createAccount': 'Create your account',
  'auth.freeNoCard': 'Free, no credit card. Everything stays private.',
  'auth.alreadyHaveAccount': 'Already have an account?',
  'auth.noAccount': 'No account yet?',
  'auth.connect': 'Log in',
  'auth.invalidCredentials': 'Invalid credentials',
  'auth.passwordMismatch': 'Passwords do not match.',
  'auth.passwordTooShort': 'Password must be at least 8 characters.',

  'home.coach': 'Coach',
  'home.recommended': 'Recommended workout',
  'home.quickWorkouts': 'Quick workouts',
  'home.minutes': 'minutes',
  'home.start': 'Start',
  'home.lastSession': 'Last session',
  'home.programs': 'Programs',
  'home.seeAll': 'See all',
  'home.freeTimer': 'Start a free timer',
  'home.weeklyGoal': 'Weekly goal',
  'home.goalReached': '🎉 Weekly goal reached!',
  'home.badges': 'Rewards',

  'workout.active': 'Active workout',
  'workout.noActive': 'No active workout.',
  'workout.chooseProgram': 'Choose a program',
  'workout.cancel': 'Cancel workout',
  'workout.rest': 'Rest',
  'workout.skipRest': 'Skip rest',
  'workout.set': 'Set',
  'workout.reps': 'reps',
  'workout.target': 'Target',
  'workout.finish': 'Finish workout',
  'workout.completed': 'sets completed',
  'workout.sessionDone': 'Workout complete!',
  'workout.howWasIt': 'How was the workout?',
  'workout.saveFailed': 'Failed to save the workout.',

  'exercises.title': 'Exercise Library',
  'exercises.search': 'Search exercises...',
  'exercises.favorites': 'Favorites',
  'exercises.allEquipment': 'All equipment',
  'exercises.allGroups': 'All groups',
  'exercises.allLevels': 'All levels',
  'exercises.noResults': 'No exercises match your filters.',
  'exercises.notFound': 'Exercise not found.',
  'exercises.howTo': 'How to do it',
  'exercises.progression': 'Progression',
  'exercises.alternative': 'No-chair alternative',
  'exercises.demonstration': 'Demonstration',

  'history.title': 'Progress',
  'history.thisWeek': 'This week',
  'history.sessions': 'session',
  'history.minutes': 'minutes',
  'history.regularity': 'consistency',
  'history.volume': 'Volume (reps) — last 14 days',
  'history.sessionHistory': 'Session history',
  'history.noSessions': 'No sessions recorded yet.',
  'history.delete': 'Delete',
  'history.deleteConfirm': 'Delete this session? This action is permanent.',

  'profile.title': 'My profile',
  'profile.deleteAccount': 'Delete my account',
  'profile.deleteWarning': 'This action is permanent. All your data will be erased.',
  'profile.deleteConfirm': 'Confirm deletion',
  'profile.cancel': 'Cancel',
  'profile.memberSince': 'Member since',

  'onboarding.title': 'Customize your training',
  'onboarding.subtitle': 'Two minutes so we can suggest tailored workouts.',
  'onboarding.goal': 'Goal',
  'onboarding.level': 'Level',
  'onboarding.frequency': 'Frequency',
  'onboarding.duration': 'Session duration',
  'onboarding.equipment': 'Available equipment',
  'onboarding.preferences': 'Preferences (optional)',
  'onboarding.save': 'Save my profile',

  'common.loading': 'Loading',
  'common.error': 'An error occurred',
  'common.retry': 'Retry',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.back': 'Back',
}

const DICTS: Record<Language, Dict> = { fr, en }

// ─── Language management ───────────────────────────────────────────

let currentLang: Language = DEFAULT_LANG

export function getLanguage(): Language {
  return currentLang
}

export function setLanguage(lang: Language): void {
  currentLang = lang
  try {
    localStorage.setItem('calisthenies.lang', lang)
  } catch {
    // ignore
  }
}

export function initLanguage(): Language {
  try {
    const stored = localStorage.getItem('calisthenies.lang') as Language | null
    if (stored === 'fr' || stored === 'en') {
      currentLang = stored
    }
  } catch {
    // ignore
  }
  return currentLang
}

// ─── Translation function ──────────────────────────────────────────

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = DICTS[currentLang] ?? DICTS[DEFAULT_LANG]
  let str = dict[key] ?? DICTS[DEFAULT_LANG][key] ?? key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }

  return str
}
