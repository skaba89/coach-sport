import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Clock, Zap } from 'lucide-react'
import { useWorkoutStore } from '../stores/workoutStore'
import { useProfile } from '../lib/useDataStore'
import { generateWorkout } from '../lib/generateWorkout'
import {
  parseIntent,
  generateCoachResponse,
  generateWorkoutOptions,
  type CoachMessage,
} from '../lib/coachChat'
import type { MuscleGroup } from '../lib/types'

const SUGGESTIONS = [
  'Je suis fatigué et j\'ai 15 min',
  'Je veux travailler mes abdos',
  'Séance douce pour le dos',
  'J\'ai 20 min et je veux transpirer',
  'Mobilité aujourd\'hui',
  'Je suis en forme, 30 min intense',
]

export function CoachChat() {
  const navigate = useNavigate()
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const { profile } = useProfile()
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: 'coach',
      content: 'Salut ! Je suis ton coach. Dis-moi comment tu te sens aujourd\'hui, combien de temps tu as, et ce que tu veux travailler. Je te propose la séance parfaite. 💪',
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<ReturnType<typeof generateWorkoutOptions>>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, options])

  function handleSend(text?: string) {
    const message = text ?? input
    if (!message.trim()) return

    const userMsg: CoachMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    const intent = parseIntent(message)
    const response = generateCoachResponse(intent)
    const workoutOptions = generateWorkoutOptions(intent, profile?.durationMinutes ?? 20)

    const coachMsg: CoachMessage = {
      role: 'coach',
      content: response,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg, coachMsg])
    setOptions(workoutOptions)
    setInput('')
  }

  function startWorkoutFromOption(option: { durationMinutes: number; focus: string }) {
    const focusGroup = option.focus !== 'full-body' && option.focus !== 'mobility'
      ? option.focus as MuscleGroup
      : undefined

    const day = generateWorkout({
      durationMinutes: option.durationMinutes,
      equipment: profile?.equipment ?? 'any',
      level: profile?.level ?? 'debutant',
      preferences: profile?.preferences ?? [],
      focusGroup,
    })

    startWorkout(day)
    navigate('/workout')
  }

  return (
    <div className="mx-auto flex h-screen max-w-lg flex-col px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Coach IA</h1>
          <p className="text-xs text-slate-400">Dis-moi ce dont tu as besoin</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-slate-900'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Workout options */}
        {options.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Séances proposées
            </p>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => startWorkoutFromOption(opt)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-left hover:border-emerald-500 hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    {opt.focus === 'mobility' ? <Sparkles size={18} /> : <Zap size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{opt.durationMinutes} min · {opt.focus}</p>
                    <p className="text-xs text-slate-400">{opt.rationale}</p>
                  </div>
                </div>
                <Clock size={16} className="text-slate-500" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Dis-moi comment tu te sens..."
          aria-label="Message au coach"
          className="flex-1 rounded-full border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          aria-label="Envoyer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
