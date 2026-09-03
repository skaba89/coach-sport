import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, Shield, ChevronLeft } from 'lucide-react'
import { useAuth } from '../lib/auth/AuthContext'
import { useSessions, useProfile } from '../lib/useDataStore'
import { db, getOwnerId } from '../db/db'

export function Privacy() {
  const { user } = useAuth()
  const { sessions } = useSessions()
  const { profile } = useProfile()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const ownerId = getOwnerId()
      const favorites = await db.favorites.where('ownerId').equals(ownerId).toArray()

      const data = {
        exportedAt: new Date().toISOString(),
        user: user ? { id: user.id, email: user.email, createdAt: user.createdAt } : null,
        profile,
        sessions,
        favorites: favorites.map((f) => ({ type: f.type, refId: f.refId })),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coach-sport-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExported(true)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <Link to="/profile" className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ChevronLeft size={16} /> Profil
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-white">Confidentialité & RGPD</h1>

      {/* Data export */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
          <Download size={18} className="text-emerald-400" aria-hidden="true" />
          Exporter mes données
        </h2>
        <p className="mb-3 text-sm text-slate-400">
          Télécharge toutes tes données (profil, séances, favoris) au format JSON.
          Conformément au RGPD (art. 20 — droit à la portabilité).
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full rounded-xl bg-emerald-500 py-2.5 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
        >
          {exporting ? 'Export en cours…' : 'Télécharger mes données'}
        </button>
        {exported && (
          <p className="mt-2 text-xs text-emerald-400">✓ Données exportées avec succès !</p>
        )}
      </section>

      {/* Privacy policy */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
          <Shield size={18} className="text-emerald-400" aria-hidden="true" />
          Politique de confidentialité
        </h2>
        <div className="space-y-3 text-sm text-slate-400">
          <div>
            <p className="font-medium text-slate-300">Données collectées</p>
            <p>Email (pour l'authentification), profil d'entraînement (objectif, niveau, fréquence),
            historique des séances, favoris.</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Stockage</p>
            <p>Les données sont stockées localement dans ton navigateur (IndexedDB) et/ou sur
            notre serveur sécurisé. Elles ne sont jamais vendues ni partagées avec des tiers.</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Cookies</p>
            <p>Aucun cookie de tracking. Un token JWT est stocké dans localStorage pour
            maintenir ta session. Aucun analytics tiers.</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Suppression</p>
            <p>Tu peux supprimer ton compte et toutes tes données à tout moment depuis la page
            Profil. La suppression est définitive et irréversible.</p>
          </div>
        </div>
      </section>

      {/* Legal */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
          <FileText size={18} className="text-emerald-400" aria-hidden="true" />
          Mentions légales
        </h2>
        <div className="space-y-2 text-sm text-slate-400">
          <p><span className="font-medium text-slate-300">Éditeur :</span> Coach Sport</p>
          <p><span className="font-medium text-slate-300">Contact :</span> skaba89@users.noreply.github.com</p>
          <p><span className="font-medium text-slate-300">Licence :</span> MIT</p>
          <p className="mt-3 border-t border-slate-700 pt-2 text-xs">
            ⚠️ Ce produit est un outil de suivi d'entraînement. Il ne constitue pas un avis médical.
            Consulte un professionnel de santé avant de commencer tout programme d'exercice.
            En cas de douleur, arrête immédiatement.
          </p>
        </div>
      </section>
    </div>
  )
}
