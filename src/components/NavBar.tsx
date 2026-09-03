import { NavLink } from 'react-router-dom'
import { Calendar, Compass, TrendingUp, User } from 'lucide-react'

/**
 * Bottom navigation — Coach UX refonte.
 *
 * 4 tabs instead of 5:
 * - Aujourd'hui (Home): plan du jour, séance recommandée, streak, badges
 * - Explorer: programmes + exercices + quick workouts
 * - Progression: historique, stats, records personnels
 * - Profil: compte, paramètres, langue
 */
const links = [
  { to: '/', label: "Aujourd'hui", icon: Calendar },
  { to: '/explore', label: 'Explorer', icon: Compass },
  { to: '/history', label: 'Progression', icon: TrendingUp },
  { to: '/profile', label: 'Profil', icon: User },
]

export function NavBar() {
  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`
              }
              aria-label={label}
            >
              <Icon size={20} strokeWidth={2.2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
