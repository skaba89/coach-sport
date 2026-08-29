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
 * Video player with:
 * 1. Real CC0 video clip (autoplays muted in loop)
 * 2. Overlay text with the first instruction step
 * 3. Optional text-to-speech voice-over (Web Speech API)
 * 4. Expandable "all instructions" panel
 *
 * This is the realistic, understandable format the user asked for:
 * they see the movement AND get the explanation in parallel.
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

  // Text-to-speech for instructions — runs through all steps in sequence
  useEffect(() => {
    if (!voiceOn) return
    if (!('speechSynthesis' in window)) {
      setVoiceOn(false)
      return
    }
    window.speechSynthesis.cancel()

    const steps = exercise.instructions
    const utter = new SpeechSynthesisUtterance(
      `${exercise.name}. ${steps.join(' ')} Objectif : ${targetReps ?? 'à ton rythme'}.`,
    )
    utter.lang = 'fr-FR'
    utter.rate = 0.95
    utter.onend = () => setVoiceOn(false)
    window.speechSynthesis.speak(utter)

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [voiceOn, exercise, targetReps])

  // Cycle through instruction steps as overlay text (every 4s)
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentStep((s) => (s + 1) % exercise.instructions.length)
    }, 4500)
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
    setVoiceOn((v) => !v)
    if (voiceOn && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
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
