import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAdmin } from './AdminContext'

interface SidebarNavItemProps {
  to: string
  icon?: React.ReactNode
  label: string
  badge?: string | number
  isSubItem?: boolean
  isOverdueAlert?: boolean
  end?: boolean
  disableActive?: boolean
  isActiveMatch?: (pathname: string) => boolean
}

export function SidebarNavItem({
  to,
  icon,
  label,
  badge,
  isSubItem = false,
  isOverdueAlert = false,
  end = false,
  disableActive = false,
  isActiveMatch,
}: SidebarNavItemProps) {
  const { isDark, setMobileSidebarOpen } = useAdmin()
  const location = useLocation()

  // Always use end for root /admin so it doesn't match all /admin/* subroutes
  const shouldEnd = end || to === '/admin'

  return (
    <NavLink
      to={to}
      end={shouldEnd}
      onClick={() => setMobileSidebarOpen(false)}
      className={({ isActive: navActive }) => {
        let isActive = disableActive ? false : navActive
        if (isActiveMatch && !disableActive) {
          isActive = isActiveMatch(location.pathname)
        }
        return `flex items-center justify-between rounded-lg transition-colors duration-150 cursor-pointer group outline-none select-none border ${
          isSubItem ? 'pl-8 pr-3 py-1.5 text-[13px]' : 'px-3 py-2 text-[13.5px]'
        } ${
          isActive
            ? isDark
              ? 'bg-[#2b2f35] text-white font-semibold border-transparent shadow-xs hover:bg-[#343a44]'
              : 'bg-white text-[#212b36] font-semibold border-[#dce0e5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
            : isDark
            ? 'text-[#8c94a5] font-medium border-transparent hover:text-white hover:bg-[#1f2228]'
            : 'text-[#4b5563] font-medium border-transparent hover:text-[#212b36] hover:bg-[#dfe2e6]/70'
        }`
      }}
    >
      {({ isActive: navActive }) => {
        let isActive = disableActive ? false : navActive
        if (isActiveMatch && !disableActive) {
          isActive = isActiveMatch(location.pathname)
        }
        return (
          <>
            <div className="flex items-center gap-2.5 truncate">
              {icon && (
                <span
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-white'
                        : 'text-[#0088ff]'
                      : isDark
                      ? 'text-[#8c94a5] group-hover:text-white'
                      : 'text-[#4b5563] group-hover:text-[#212b36]'
                  }`}
                >
                  {icon}
                </span>
              )}
              <span className="truncate">{label}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isOverdueAlert && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Action required" />
              )}
              {badge !== undefined && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full transition-colors ${
                    isDark
                      ? 'bg-[#181a20] text-[#c7c9c8] group-hover:text-white'
                      : 'bg-[#dfe2e6] text-[#4b5563] font-medium group-hover:text-[#212b36]'
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
          </>
        )
      }}
    </NavLink>
  )
}
