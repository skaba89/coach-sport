import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { Difficulty, EquipmentPreference, Goal, Preference, UserProfile } from '../lib/types'
import { backRedFlagQuestions, backSafetyMedicalMessage } from '../lib/backSafety'
import { withToast } from '../lib/toast'
import { getDataStore } from '../lib/useDataStore'

const goalOptions: { value: Goal; label: string }[] = [
  { value: 'remise-en-forme', label: 'Me remettre en forme' },
  { value: 'renforcement', label: 'Me renforcer' },
  { value: 'muscle', label: 'Me muscler' },
  { value: 'endurance', label: 'Améliorer mon endurance' },
  { value: 'perte-de-poids', label: 'Perdre du poids' },
  { value: 'raffermissement', label: 'Raffermir mon corps' },
  { value: 'abdos', label: 'Renforcer mes abdos' },
  { value: 'jambes', label: 'Renforcer mes jambes' },
  { value: 'fessiers', label: 'Renforcer mes fessiers' },
  { value: 'dos', label: 'Renforcer mon dos' },
  { value: 'mobilite', label: 'Améliorer ma mobilité' },
]

const levelOptions: { value: Difficulty; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
]

const frequencyOptions = [2, 3, 4, 5, 6]
const durationOptions = [10, 15, 20, 30, 45, 60]

const equipmentOptions: { value: EquipmentPreference; label: string }[] = [
  { value: 'none', label: '🏠 Aucun équipement' },
  { value: 'chair', label: '🪑 J\'ai une chaise' },
  { value: 'any', label: 'Peu importe' },
]

const preferenceOptions: { value: Preference; label: string }[] = [
  { value: 'sans-sauts', label: 'Sans sauts / low impact' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'force', label: 'Force' },
  { value: 'mobilite', label: 'Mobilité' },
  { value: 'full-body', label: 'Full Body' },
]

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

export function Onboarding() {
  const navigate = useNavigate()
  const [goal, setGoal] = useState<Goal>('remise-en-forme')
  const [level, setLevel] = useState<Difficulty>('debutant')
  const [frequency, setFrequency] = useState(3)
  const [duration, setDuration] = useState(20)
  const [equipment, setEquipment] = useState<EquipmentPreference>('any')
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [backAnswers, setBackAnswers] = useState<Record<string, boolean>>({})

  const wantsBackFocus = goal === 'dos'
  const hasRedFlag = Object.values(backAnswers).some(Boolean)
  const canSave = !wantsBackFocus || !hasRedFlag

  function togglePreference(p: Preference) {
    setPreferences((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  async function handleSave() {
    if (!canSave) return
    const profile: UserProfile = {
      goal,
      level,
      frequency,
      durationMinutes: duration,
      equipment,
      preferences,
      ...(wantsBackFocus ? { backSafetyClearedAt: new Date().toISOString() } : {}),
    }
    try {
      await withToast(
        getDataStore().profile.put({ id: 'me', ...profile }),
        "Échec de l'enregistrement du profil. Réessaie dans un instant.",
      )
      navigate('/')
    } catch {
      // toast already shown
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-1 text-2xl font-bold text-white">Personnalise ton entraînement</h1>
      <p className="mb-6 text-sm text-slate-500">
        Deux minutes pour qu'on te propose des séances adaptées. Tout reste sur ton appareil.
      </p>

      <Section title="Objectif">
        <div className="flex flex-wrap gap-2">
          {goalOptions.map((o) => (
            <Pill key={o.value} active={goal === o.value} onClick={() => setGoal(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
      </Section>

      {wantsBackFocus && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="mb-3 text-sm font-medium text-amber-200">
            Avant de te proposer des séances "Dos", coche ce qui s'applique à toi en ce moment :
          </p>
          <div className="flex flex-col gap-2">
            {backRedFlagQuestions.map((q) => (
              <label key={q.id} className="flex items-start gap-2 text-sm text-amber-100">
                <input
                  type="checkbox"
                  checked={backAnswers[q.id] ?? false}
                  onChange={(e) => setBackAnswers((prev) => ({ ...prev, [q.id]: e.target.checked }))}
                  className="mt-0.5"
                />
                {q.label}
              </label>
            ))}
          </div>
          {hasRedFlag && (
            <p className="mt-3 rounded-xl bg-rose-500/15 p-3 text-sm text-rose-200">{backSafetyMedicalMessage}</p>
          )}
        </div>
      )}

      <Section title="Niveau">
        <div className="flex flex-wrap gap-2">
          {levelOptions.map((o) => (
            <Pill key={o.value} active={level === o.value} onClick={() => setLevel(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Fréquence">
        <div className="flex flex-wrap gap-2">
          {frequencyOptions.map((f) => (
            <Pill key={f} active={frequency === f} onClick={() => setFrequency(f)}>
              {f} jours / semaine
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Durée par séance">
        <div className="flex flex-wrap gap-2">
          {durationOptions.map((d) => (
            <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
              {d} min
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Équipement disponible">
        <div className="flex flex-wrap gap-2">
          {equipmentOptions.map((o) => (
            <Pill key={o.value} active={equipment === o.value} onClick={() => setEquipment(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
      </Section>

      <Section title="Préférences (optionnel)">
        <div className="flex flex-wrap gap-2">
          {preferenceOptions.map((o) => (
            <Pill key={o.value} active={preferences.includes(o.value)} onClick={() => togglePreference(o.value)}>
              {o.label}
            </Pill>
          ))}
        </div>
      </Section>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-center font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
      >
        <Check size={18} />
        Enregistrer mon profil
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">{title}</h2>
      {children}
    </div>
  )
}
