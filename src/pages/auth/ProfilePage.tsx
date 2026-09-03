import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Trash2, AlertCircle, ChevronLeft, Mail, Calendar, Crown, Settings, Shield } from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthContext'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, deleteAccount } = useAuth()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) return null // ProtectedRoute guarantees this, but TS doesn't know

  async function handleLogout() {
    setBusy(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount()
      navigate('/register', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <Link to="/" className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ChevronLeft size={16} /> Accueil
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-white">Mon profil</h1>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-xl font-bold text-emerald-400"
            aria-hidden="true"
          >
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{user.email}</p>
            <p className="text-xs text-slate-500">
              Membre depuis le{' '}
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3">
          <Mail size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="truncate text-sm text-white">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3">
          <Calendar size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inscrit le</p>
            <p className="text-sm text-white">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Premium + Admin links */}
        <div className="space-y-2">
          <Link
            to="/pricing"
            className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 hover:bg-emerald-500/10"
          >
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-emerald-400" aria-hidden="true" />
              <span className="text-sm font-medium text-white">Passer Premium</span>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-slate-500" aria-hidden="true" />
          </Link>
          <Link
            to="/admin"
            className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-3 hover:bg-slate-800/70"
          >
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-slate-400" aria-hidden="true" />
              <span className="text-sm font-medium text-white">Back-office</span>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-slate-500" aria-hidden="true" />
          </Link>
          <Link
            to="/privacy"
            className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 p-3 hover:bg-slate-800/70"
          >
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-slate-400" aria-hidden="true" />
              <span className="text-sm font-medium text-white">Confidentialité & RGPD</span>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-slate-500" aria-hidden="true" />
          </Link>
        </div>

        <button
          onClick={handleLogout}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          <LogOut size={18} aria-hidden="true" />
          {busy ? 'Déconnexion…' : 'Se déconnecter'}
        </button>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 py-3 font-medium text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
          >
            <Trash2 size={18} aria-hidden="true" />
            Supprimer mon compte
          </button>
        ) : (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
            <p className="mb-3 text-sm text-rose-200">
              ⚠️ Cette action est <strong>définitive</strong>. Toutes tes données (profil, séances, favoris)
              seront définitivement effacées.
            </p>
            {error && (
              <div role="alert" className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/15 p-2 text-xs text-rose-100">
                <AlertCircle size={14} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 py-2 text-sm text-white hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-medium text-white hover:bg-rose-600"
              >
                {busy ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
