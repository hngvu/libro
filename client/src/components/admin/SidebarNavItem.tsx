import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAdmin } from './AdminContext'

interface SidebarNavItemProps {
  to: string
  icon?: React.ReactNode
  label: string
  badge?: string | number
  isSubItem?: boolean
  isOverdueAlert?: boolean
  end?: boolean
}

export function SidebarNavItem({
  to,
  icon,
  label,
  badge,
  isSubItem = false,
  isOverdueAlert = false,
  end = false,
}: SidebarNavItemProps) {
  const { isDark, setMobileSidebarOpen } = useAdmin()

  // Always use end for root /admin so it doesn't match all /admin/* subroutes
  const shouldEnd = end || to === '/admin'

  return (
    <NavLink
      to={to}
      end={shouldEnd}
      onClick={() => setMobileSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-xl text-xs transition-colors duration-150 cursor-pointer group ${
          isSubItem ? 'px-3 py-2 ml-3.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? isDark
              ? 'bg-[#2b2f35] text-white font-semibold shadow-xs hover:bg-[#343a44]'
              : 'bg-gray-100 text-gray-950 font-semibold border border-gray-200/90 shadow-xs hover:bg-gray-200/70'
            : isDark
            ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]'
            : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
        }`
      }
    >
      <div className="flex items-center gap-2.5 truncate">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isOverdueAlert && (
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Action required" />
        )}
        {badge !== undefined && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
              isDark
                ? 'bg-[#181a20] text-[#c7c9c8] group-hover:text-white'
                : 'bg-gray-100 text-gray-700 border border-gray-200/60 group-hover:text-gray-950'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </NavLink>
  )
}
