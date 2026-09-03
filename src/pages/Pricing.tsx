import { useState } from 'react'
import { Check, Crown, Zap, Sparkles } from 'lucide-react'
import { useAuth } from '../lib/auth/AuthContext'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  icon: typeof Crown
  color: string
  features: { text: string; included: boolean }[]
  cta: string
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: '/mois',
    icon: Zap,
    color: 'text-slate-400',
    features: [
      { text: 'Bibliothèque d\'exercices (125+)', included: true },
      { text: 'Programmes de base (4)', included: true },
      { text: 'Tracking des séances', included: true },
      { text: 'Minuteur + repos', included: true },
      { text: 'Mode hors-ligne (PWA)', included: true },
      { text: 'Séances rapides générées', included: true },
      { text: 'Coach IA conversationnel', included: false },
      { text: 'Programmes premium (6)', included: false },
      { text: 'Statistiques avancées', included: false },
      { text: 'Challenges', included: false },
      { text: 'Sync multi-appareils', included: false },
    ],
    cta: 'Plan actuel',
  },
  {
    id: 'pro',
    name: 'Premium',
    price: '7,99€',
    period: '/mois',
    icon: Crown,
    color: 'text-emerald-400',
    highlight: true,
    features: [
      { text: 'Tout le plan gratuit', included: true },
      { text: 'Coach IA conversationnel', included: true },
      { text: 'Programmes premium (6)', included: true },
      { text: 'Statistiques avancées + records', included: true },
      { text: 'Challenges (8 disponibles)', included: true },
      { text: 'Plan hebdomadaire intelligent', included: true },
      { text: 'Progressive overload automatique', included: true },
      { text: 'Récupération par groupe musculaire', included: true },
      { text: 'Sync multi-appareils', included: true },
      { text: 'Vidéos premium (hors-ligne)', included: true },
    ],
    cta: 'Passer Premium',
  },
  {
    id: 'annual',
    name: 'Premium Annuel',
    price: '59€',
    period: '/an',
    icon: Sparkles,
    color: 'text-amber-400',
    features: [
      { text: 'Tout le plan Premium', included: true },
      { text: '2 mois offerts (-38%)', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Accès anticipé aux nouveautés', included: true },
    ],
    cta: 'Choisir l\'annuel',
  },
]

export function Pricing() {
  const { user } = useAuth()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Abonnements</h1>
      <p className="mb-6 text-sm text-slate-400">
        Débloque tout le potentiel de ton coach. Sans engagement, annulable à tout moment.
      </p>

      {/* Billing toggle */}
      <div className="mb-6 flex justify-center gap-2 rounded-full bg-slate-800 p-1">
        <button
          onClick={() => setBilling('monthly')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billing === 'monthly' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400'
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling('annual')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billing === 'annual' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400'
          }`}
        >
          Annuel (-38%)
        </button>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {(billing === 'monthly' ? [PLANS[0], PLANS[1]] : [PLANS[0], PLANS[2]]).map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 ${
                plan.highlight
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-800/40'
              }`}
            >
              {plan.highlight && (
                <span className="mb-2 inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
                  Recommandé
                </span>
              )}
              <div className="flex items-center gap-2">
                <Icon size={24} className={plan.color} aria-hidden="true" />
                <h2 className="text-lg font-bold text-white">{plan.name}</h2>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-slate-700" aria-hidden="true" />
                    )}
                    <span className={f.included ? 'text-slate-200' : 'text-slate-600'}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.id === 'free'}
                className={`mt-5 w-full rounded-xl py-3 font-semibold transition-colors ${
                  plan.id === 'free'
                    ? 'cursor-default bg-slate-800 text-slate-500'
                    : plan.highlight
                    ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                onClick={() => {
                  if (plan.id !== 'free') {
                    // Future: redirect to Stripe Checkout
                    alert('Le paiement Stripe sera disponible prochainement. En attendant, profitez de toutes les fonctionnalités gratuitement !')
                  }
                }}
              >
                {plan.id === 'free' && user ? 'Plan actuel' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <h3 className="mb-3 font-semibold text-white">Questions fréquentes</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-200">Puis-je annuler à tout moment ?</p>
            <p className="text-slate-400">Oui, sans frais ni justification. L'annulation prend effet à la fin de la période en cours.</p>
          </div>
          <div>
            <p className="font-medium text-slate-200">Mes données sont-elles conservées ?</p>
            <p className="text-slate-400">Oui, toutes vos séances et votre historique restent accessibles. Seules les fonctionnalités premium sont désactivées.</p>
          </div>
          <div>
            <p className="font-medium text-slate-200">Le mode hors-ligne fonctionne-t-il en premium ?</p>
            <p className="text-slate-400">Oui, et il est encore plus puissant : vidéos premium téléchargées pour un accès complet sans connexion.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
