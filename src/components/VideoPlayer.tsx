import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import type { ExerciseVideo } from '../data/videos'

interface VideoPlayerProps {
  video: ExerciseVideo
  /** Display label rendered above the player. */
  label?: string
  /** Optional aspect class — defaults to 16/9. */
  aspectClass?: string
}

/**
 * Lazy HTML5 video player for exercise demonstrations.
 *
 * Design choices:
 * - <video preload="metadata"> so we fetch the moov atom only (small range
 *   request) — the video body stays unloaded until play.
 * - Loop muted autoplay on first viewport entry (IntersectionObserver).
 *   This matches the "demo loop" UX of Nike Training Club / Freeletics:
 *   the user sees the exercise in motion immediately, no click required.
 * - Pause when scrolled out of view to save CPU.
 * - Replaces the previous SVG hand-drawn ExerciseAnimation when a video
 *   is available — falls back to ExerciseAnimation otherwise (caller's job).
 */
export function VideoPlayer({ video, label, aspectClass = 'aspect-video' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1

  // Auto-play when entering viewport, pause when leaving.
  useEffect(() => {
    const el = containerRef.current
    const video = videoRef.current
    if (!el || !video) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            void video.play().catch(() => {/* autoplay blocked: user must click */})
          } else {
            video.pause()
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
    } else {
      v.pause()
    }
  }

  function restart() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    void v.play()
  }

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden rounded-xl bg-slate-900/60 ${aspectClass}`}>
      {label && (
        <p className="absolute left-3 top-3 z-10 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
          {label}
        </p>
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
        aria-label={label ?? 'Démonstration vidéo de l\'exercice'}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget
          if (v.duration > 0) setProgress(v.currentTime / v.duration)
        }}
      />
      {/* Centered play/pause overlay (only visible when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Lire la vidéo"
          className="absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-opacity hover:bg-slate-900/30"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/90 text-slate-900 shadow-lg">
            <Play size={28} fill="currentColor" />
          </span>
        </button>
      )}
      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-slate-900/90 to-transparent px-3 pb-2 pt-6">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
          className="rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-700"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
        </button>
        <button
          onClick={restart}
          aria-label="Recommencer la vidéo"
          className="rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-700"
        >
          <RotateCcw size={14} />
        </button>
        <div className="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full bg-emerald-500 transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-[10px] font-medium tabular-nums text-slate-300">{video.durationSeconds}s</span>
      </div>
    </div>
  )
}
