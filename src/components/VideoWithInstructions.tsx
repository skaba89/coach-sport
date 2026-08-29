import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Info } from 'lucide-react'
import type { ExerciseVideo } from '../data/videos'
import type { Exercise } from '../lib/types'

interface VideoWithInstructionsProps {
  video: ExerciseVideo
  exercise: Exercise
  /** Optional target reps label rendered as overlay. */
  targetReps?: string
  /** Show the chair badge. */
  showChairBadge?: boolean
  /** Aspect class — defaults to video. */
  aspectClass?: string
}

/**
 * Pick the best available French voice from the browser's voice list.
 * Falls back to any voice whose lang starts with 'fr'.
 * Returns null if no French voice is available.
 */
function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // Priority order:
  // 1. fr-FR voices from major vendors (Google, Microsoft, Amazon)
  // 2. Any fr-FR voice
  // 3. Any voice whose lang starts with 'fr' (fr-CA, fr-BE, etc.)
  const priority = [
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && /google/i.test(v.name),
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && /microsoft|amazon|natural/i.test(v.name),
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR',
    (v: SpeechSynthesisVoice) => v.lang.startsWith('fr'),
  ]
  for (const predicate of priority) {
    const match = voices.find(predicate)
    if (match) return match
  }
  return null
}

/**
 * Format the instructions into a natural, well-paced French script.
 *
 * The original instructions are imperative ("Descendre, pousser...").
 * For spoken output we wrap them in conversational connectors so the
 * TTS engine reads them naturally:
 *   - Greeting + exercise name
 *   - Numbered steps with "Étape N : ..."
 *   - Target reps reformatted (3-6 → "entre 3 et 6")
 *   - Encouragement at the end
 */
function buildSpokenScript(exercise: Exercise, targetReps?: string): string {
  const name = exercise.name
  const steps = exercise.instructions

  // Reformulate target reps for natural speech
  // Examples:
  //   "3-6 / bras" → "entre 3 et 6 répétitions par bras"
  //   "12-15"     → "entre 12 et 15 répétitions"
  //   "20-30s"    → "20 à 30 secondes"
  //   "AMRAP"     → "le maximum de répétitions"
  let spokenTarget = ''
  if (targetReps) {
    const rangeMatch = targetReps.match(/^(\d+)\s*-\s*(\d+)\s*(\/\s*\w+)?$/)
    const timeMatch = targetReps.match(/^(\d+)\s*-\s*(\d+)\s*s$/i)
    if (timeMatch) {
      spokenTarget = `Maintiens la position pendant ${timeMatch[1]} à ${timeMatch[2]} secondes.`
    } else if (rangeMatch) {
      const [, low, high, suffix] = rangeMatch
      const perPart = suffix ? ` par ${suffix.replace('/', '').trim()}` : ''
      spokenTarget = `L'objectif est de faire entre ${low} et ${high} répétitions${perPart}.`
    } else if (targetReps.toUpperCase() === 'AMRAP') {
      spokenTarget = "L'objectif est de faire le maximum de répétitions possible."
    } else {
      spokenTarget = `L'objectif est ${targetReps} répétitions.`
    }
  }

  // Build the script
  const parts: string[] = []
  parts.push(`Voici l'exercice : ${name}.`)
  if (exercise.description) {
    // Brief description, shortened for speech
    const shortDesc = exercise.description.length > 100
      ? exercise.description.slice(0, 100).trim() + '...'
      : exercise.description
    parts.push(shortDesc)
  }
  parts.push("Je vais t'expliquer comment le faire, étape par étape.")
  steps.forEach((step, i) => {
    parts.push(`Étape ${i + 1}. ${step}`)
  })
  if (spokenTarget) {
    parts.push(spokenTarget)
  }
  parts.push("N'oublie pas de bien respirer, et garde le contrôle du mouvement. C'est parti !")
  return parts.join(' ')
}

/**
 * Video player with:
 * 1. Real CC0 video clip (autoplays muted in loop)
 * 2. Overlay text with the current instruction step
 * 3. Text-to-speech voice-over (Web Speech API) with native French voice
 * 4. Expandable "all instructions" panel
 */
export function VideoWithInstructions({
  video,
  exercise,
  targetReps,
  showChairBadge = false,
  aspectClass = 'aspect-video',
}: VideoWithInstructionsProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [voiceReady, setVoiceReady] = useState(false)

  // Wait for voices to be loaded (Chrome loads them async)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        setVoiceReady(true)
      }
    }
    checkVoices()
    window.speechSynthesis.onvoiceschanged = checkVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Auto-play when scrolled into view
  useEffect(() => {
    const el = containerRef.current
    const v = videoRef.current
    if (!el || !v) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            void v.play().catch(() => {})
          } else {
            v.pause()
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Text-to-speech — uses a native French voice when available
  useEffect(() => {
    if (!voiceOn) return
    if (!('speechSynthesis' in window)) {
      setVoiceOn(false)
      return
    }
    window.speechSynthesis.cancel()

    const script = buildSpokenScript(exercise, targetReps)
    const utter = new SpeechSynthesisUtterance(script)
    utter.lang = 'fr-FR'
    utter.rate = 0.92 // Slightly slower for clarity
    utter.pitch = 1.0
    utter.volume = 1.0

    // Pick the best French voice
    const frVoice = pickFrenchVoice()
    if (frVoice) {
      utter.voice = frVoice
    }

    // Track which step is currently being spoken (rough heuristic based on time)
    utter.onend = () => setVoiceOn(false)
    utter.onerror = () => setVoiceOn(false)

    window.speechSynthesis.speak(utter)

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [voiceOn, exercise, targetReps])

  // Cycle through instruction steps as overlay text (every 5s)
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentStep((s) => (s + 1) % exercise.instructions.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isPlaying, exercise.instructions.length])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }

  function restart() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    void v.play()
  }

  function toggleVoice() {
    if (voiceOn) {
      // Turning off — stop any in-progress speech
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setVoiceOn(false)
    } else {
      // Check availability first
      if (!('speechSynthesis' in window) || !voiceReady) {
        // Fallback: try anyway, browser will use default voice
        setVoiceReady(true)
      }
      setVoiceOn(true)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-slate-900/60">
      {/* Video container with overlay */}
      <div ref={containerRef} className={`relative w-full ${aspectClass}`}>
        {showChairBadge && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-amber-500/80 px-2 py-0.5 text-xs font-semibold text-slate-900">
            🪑 Chaise
          </span>
        )}
        {targetReps && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-emerald-300">
            🎯 {targetReps}
          </span>
        )}

        <video
          ref={videoRef}
          src={video.src}
          poster={video.poster}
          className="absolute inset-0 h-full w-full object-contain"
          playsInline
          muted
          loop
          preload="metadata"
          aria-label={`Démonstration vidéo : ${exercise.name}`}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            if (v.duration > 0) setProgress(v.currentTime / v.duration)
          }}
        />

        {/* Overlay: rotating instruction step (only while playing) */}
        {isPlaying && (
          <div className="absolute bottom-12 left-3 right-3 z-10">
            <div className="rounded-lg bg-slate-900/85 px-3 py-2 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                  {currentStep + 1}/{exercise.instructions.length}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Instruction
                </span>
              </div>
              <p className="text-sm text-white leading-snug">
                {exercise.instructions[currentStep]}
              </p>
            </div>
          </div>
        )}

        {/* Play/pause overlay (only when paused) */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            aria-label="Lire la vidéo"
            className="absolute inset-0 flex items-center justify-center bg-slate-900/40 hover:bg-slate-900/30"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/90 text-slate-900 shadow-lg">
              <Play size={28} fill="currentColor" />
            </span>
          </button>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-2 bg-gradient-to-t from-slate-900/95 to-transparent px-3 pb-2 pt-8">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Lire'}
            className="rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-700"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          <button
            onClick={restart}
            aria-label="Recommencer"
            className="rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-700"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleVoice}
            aria-pressed={voiceOn}
            aria-label={voiceOn ? 'Couper la voix' : 'Activer la voix-off'}
            className={`rounded-full p-1.5 hover:bg-slate-700 ${
              voiceOn ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900/80 text-white'
            }`}
            title={voiceOn ? 'Voix-off activée (parle les instructions)' : 'Activer la voix-off'}
          >
            {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={() => setShowInstructions((s) => !s)}
            aria-pressed={showInstructions}
            aria-label="Voir toutes les instructions"
            className={`rounded-full p-1.5 hover:bg-slate-700 ${
              showInstructions ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900/80 text-white'
            }`}
            title="Toutes les instructions"
          >
            <Info size={14} />
          </button>
          <div className="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-medium tabular-nums text-slate-300">{video.durationSeconds}s</span>
        </div>
      </div>

      {/* Expandable instructions panel */}
      {showInstructions && (
        <div className="border-t border-slate-700 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Comment faire — {exercise.instructions.length} étapes
          </p>
          <ol className="flex flex-col gap-1.5">
            {exercise.instructions.map((step, i) => (
              <li
                key={i}
                className={`flex gap-2 text-sm ${
                  i === currentStep && isPlaying ? 'text-emerald-300' : 'text-slate-300'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {exercise.description && (
            <p className="mt-2 border-t border-slate-700 pt-2 text-xs text-slate-400">
              {exercise.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
