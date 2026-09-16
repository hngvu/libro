
import { NavLink } from 'react-router-dom'
import { useAdmin } from './AdminContext'

export function SidebarHeader() {
  const { t } = useAdmin()

  return (
    <div className="px-3 py-1">
      <NavLink
        to="/admin"
        className="flex items-center gap-2.5 select-none group w-fit cursor-pointer"
        title="Libro Dashboard"
      >
        <div className="relative">
          <img
            src="/favicon.svg"
            alt="Libro"
            className="w-8 h-8 rounded-lg object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-serif text-[21px] font-bold tracking-[0.12em] lowercase leading-none ${t.titleColor}`}
            style={{ fontFamily: "'Playfair Display', 'Merriweather', Georgia, serif" }}
          >
            libro
          </span>
          <span className="inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" title="System Online" />
        </div>
      </NavLink>
    </div>
  )
}
