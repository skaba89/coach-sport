/**
 * AI Conversationnel Coach — chat interface that feeds the Coach Engine V2.
 *
 * Architecture (per spec §20):
 *   User → Coach conversationnel (LLM) → Intentions / contraintes
 *   → Coach Engine déterministe → WorkoutPrescription validée
 *
 * The LLM explains and interprets. The engine prescribes.
 * The LLM NEVER generates workout prescriptions directly.
 */

export interface CoachMessage {
  role: 'user' | 'coach'
  content: string
  timestamp: string
}

export interface CoachIntent {
  /** What the user wants to do today */
  fatigue?: 'basse' | 'moyenne' | 'haute'
  durationMinutes?: number
  focusGroup?: string
  intensity?: 'douce' | 'moderee' | 'intense'
  /** Parsed constraints from the user's message */
  constraints: string[]
}

/**
 * Parse the user's natural language message into structured intents.
 *
 * This is a deterministic parser (no LLM) that extracts:
 * - Fatigue level ("fatigué", "en forme", "douleurs")
 * - Duration ("15 min", "court", "long")
 * - Focus ("abdos", "dos", "jambes", "cardio")
 * - Intensity ("doux", "intense", "facile")
 *
 * The LLM layer (when wired) would do this more robustly, but the
 * deterministic parser ensures the engine works offline.
 */
export function parseIntent(message: string): CoachIntent {
  const lower = message.toLowerCase()
  const constraints: string[] = []

  // Fatigue
  let fatigue: CoachIntent['fatigue']
  if (/fatigu|épuisé|crevé|pas motiv|dur|rough/i.test(lower)) {
    fatigue = 'haute'
    constraints.push('fatigue: haute')
  } else if (/en forme|dynamique|motiv|frai|good/i.test(lower)) {
    fatigue = 'basse'
    constraints.push('fatigue: basse')
  } else {
    fatigue = 'moyenne'
  }

  // Duration
  let durationMinutes: number | undefined
  const durationMatch = lower.match(/(\d+)\s*min/)
  if (durationMatch) {
    durationMinutes = Number(durationMatch[1])
    constraints.push(`durée: ${durationMinutes} min`)
  } else if (/court|rapide|express/i.test(lower)) {
    durationMinutes = 10
    constraints.push('durée: court (10 min)')
  } else if (/long|complet|séance complète/i.test(lower)) {
    durationMinutes = 30
    constraints.push('durée: long (30 min)')
  }

  // Focus group
  let focusGroup: string | undefined
  if (/abdo|core|gainage|ventre/i.test(lower)) {
    focusGroup = 'core'
    constraints.push('focus: core')
  } else if (/dos|lombaire|posture/i.test(lower)) {
    focusGroup = 'back'
    constraints.push('focus: dos')
  } else if (/jambe| squat|fessier|cuiss/i.test(lower)) {
    focusGroup = 'legs'
    constraints.push('focus: jambes')
  } else if (/pompe|push|pec|triceps|bras/i.test(lower)) {
    focusGroup = 'push'
    constraints.push('focus: push')
  } else if (/cardio|sweat|endurance/i.test(lower)) {
    focusGroup = 'cardio'
    constraints.push('focus: cardio')
  } else if (/mobilit|souple|étire|stretch/i.test(lower)) {
    focusGroup = 'mobility'
    constraints.push('focus: mobilité')
  }

  // Intensity
  let intensity: CoachIntent['intensity']
  if (/doux|léger|facile|récup|recover/i.test(lower)) {
    intensity = 'douce'
    constraints.push('intensité: douce')
  } else if (/intense|hardcore|max| HIT/i.test(lower)) {
    intensity = 'intense'
    constraints.push('intensité: intense')
  } else {
    intensity = 'moderee'
  }

  return { fatigue, durationMinutes, focusGroup, intensity, constraints }
}

/**
 * Generate a coach response based on the parsed intent.
 *
 * This is the "explanation" layer — the coach explains what it will
 * do and why, in a friendly and encouraging tone.
 */
export function generateCoachResponse(intent: CoachIntent): string {
  const parts: string[] = []

  // Acknowledge the user's state
  if (intent.fatigue === 'haute') {
    parts.push("Je vois que tu es fatigué aujourd'hui. On va adapter la séance pour qu'elle soit efficace sans t'épuiser.")
  } else if (intent.fatigue === 'basse') {
    parts.push("Tu es en forme aujourd'hui ! Profitons-en pour bien travailler.")
  }

  // Explain the plan
  if (intent.intensity === 'douce') {
    parts.push("Je te propose une séance douce, axée sur la récupération et la mobilité.")
  } else if (intent.intensity === 'intense') {
    parts.push("On va pousser aujourd'hui avec une séance intense et des exercices avancés.")
  }

  if (intent.focusGroup) {
    const focusLabels: Record<string, string> = {
      core: 'gainage et abdos',
      back: 'renforcement du dos',
      legs: 'jambes et fessiers',
      push: 'haut du corps (pompes)',
      cardio: 'cardio',
      mobility: 'mobilité et souplesse',
    }
    parts.push(`On se concentre sur ${focusLabels[intent.focusGroup] ?? intent.focusGroup}.`)
  }

  if (intent.durationMinutes) {
    parts.push(`Séance de ${intent.durationMinutes} minutes, prête à démarrer quand tu l'es.`)
  } else {
    parts.push("Séance adaptée à ta durée habituelle, prête à démarrer.")
  }

  // Encouragement
  const encouragements = [
    "C'est parti ! 💪",
    "Tu vas assuredment te sentir mieux après ! 🎯",
    "Chaque séance compte, même courte. 🔥",
    "Écoute ton corps et fais de ton mieux. ⭐",
  ]
  parts.push(encouragements[Math.floor(Math.random() * encouragements.length)])

  return parts.join(' ')
}

/**
 * Generate workout options from the parsed intent.
 * Returns 1-3 options with different durations/focus.
 */
export interface WorkoutOption {
  durationMinutes: number
  focus: string
  rationale: string
}

export function generateWorkoutOptions(intent: CoachIntent, defaultDuration: number = 20): WorkoutOption[] {
  const options: WorkoutOption[] = []
  const baseDuration = intent.durationMinutes ?? defaultDuration

  // Adjust duration based on fatigue
  let adjustedDuration = baseDuration
  if (intent.fatigue === 'haute') {
    adjustedDuration = Math.max(10, Math.round(baseDuration * 0.7))
  } else if (intent.fatigue === 'basse') {
    adjustedDuration = Math.min(45, Math.round(baseDuration * 1.2))
  }

  // Option 1: main recommendation
  options.push({
    durationMinutes: adjustedDuration,
    focus: intent.focusGroup ?? 'full-body',
    rationale: intent.fatigue === 'haute'
      ? 'Séance raccourcie car tu es fatigué'
      : 'Séance adaptée à ton état du jour',
  })

  // Option 2: shorter alternative
  if (adjustedDuration > 10) {
    options.push({
      durationMinutes: Math.max(5, adjustedDuration - 10),
      focus: intent.focusGroup ?? 'full-body',
      rationale: 'Version plus courte si tu manques de temps',
    })
  }

  // Option 3: mobility/recovery if fatigued
  if (intent.fatigue === 'haute' || intent.intensity === 'douce') {
    options.push({
      durationMinutes: 10,
      focus: 'mobility',
      rationale: 'Récupération active + mobilité',
    })
  }

  return options
}
