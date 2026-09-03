/**
 * Training Calendar — monthly view of completed sessions.
 *
 * Shows a calendar grid with colored dots on days where the user
 * trained. Click a day to see session details.
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { WorkoutSession } from '../lib/types'
import { getExerciseById } from '../data/exercises'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function TrainingCalendar({ sessions }: { sessions: WorkoutSession[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>()
    for (const session of sessions) {
      if (!session.finishedAt) continue
      const dateKey = new Date(session.startedAt).toDateString()
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(session)
    }
    return map
  }, [sessions])

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Start from Monday (1) — adjust for Sunday (0)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = lastDay.getDate()

    const days: { date: Date | null; key: string | null }[] = []

    // Empty cells before the 1st
    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, key: null })
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      days.push({ date, key: date.toDateString() })
    }

    return days
  }, [currentMonth])

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const today = new Date().toDateString()
  const selectedSessions = selectedDay ? sessionsByDay.get(selectedDay) ?? [] : []

  // Monthly stats
  const monthSessions = sessions.filter((s) => {
    if (!s.finishedAt) return false
    const d = new Date(s.startedAt)
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
  })

  const monthMinutes = monthSessions.reduce((sum, s) => {
    if (!s.finishedAt) return sum
    return sum + Math.round((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)
  }, 0)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prevMonth} aria-label="Mois précédent" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-700">
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-white">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button onClick={nextMonth} aria-label="Mois suivant" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-700">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Monthly stats */}
      <div className="mb-4 flex justify-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-400">{monthSessions.length}</p>
          <p className="text-xs text-slate-500">séances</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-400">{monthMinutes}</p>
          <p className="text-xs text-slate-500">minutes</p>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-slate-500">{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (!day.date) {
            return <div key={i} />
          }

          const daySessions = day.key ? sessionsByDay.get(day.key) ?? [] : []
          const hasSessions = daySessions.length > 0
          const isToday = day.key === today
          const isSelected = day.key === selectedDay

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day.key)}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                isSelected
                  ? 'bg-emerald-500 text-slate-900'
                  : hasSessions
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : isToday
                  ? 'border border-emerald-500/50 text-emerald-400'
                  : 'text-slate-500 hover:bg-slate-700'
              }`}
              aria-label={`${day.date.getDate()} ${MONTHS[day.date.getMonth()]}`}
            >
              <span className="font-medium">{day.date.getDate()}</span>
              {hasSessions && !isSelected && (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="mt-4 border-t border-slate-700 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {new Date(selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune séance ce jour.</p>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((session, i) => {
                const exercises = [...new Set(session.logs.map((l) => l.exerciseId))]
                  .map((id) => getExerciseById(id)?.name)
                  .filter(Boolean)
                const minutes = session.finishedAt
                  ? Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
                  : 0

                return (
                  <div key={i} className="rounded-lg bg-slate-900/60 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{session.dayName}</p>
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        {minutes} min
                      </span>
                    </div>
                    {exercises.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">{exercises.join(', ')}</p>
                    )}
                    {session.rpe && (
                      <p className="mt-0.5 text-xs text-slate-500">RPE: {session.rpe}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
