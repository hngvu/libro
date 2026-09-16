import { NavLink } from 'react-router-dom'
import { IconSettings } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'


export function AdminSidebar() {
  const { isDark, t, mobileSidebarOpen, setMobileSidebarOpen } = useAdmin()

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 md:w-[240px] border-r flex flex-col justify-between p-3.5 transition-transform duration-200 ${
        t.sidebarBg
      } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* Top: Fixed Brand Header (Logo) */}
      <div className={`pb-3 border-b shrink-0 ${isDark ? 'border-[#22262e]' : 'border-[#d8dce2]'}`}>
        <SidebarHeader />
      </div>

      {/* Middle: Scrollable Grouped Navigation */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-3 min-h-0 pt-3">
        <SidebarNav />
      </div>

      {/* Footer: Settings Link (Navigates to /admin/settings) */}
      <div className={`pt-3 border-t shrink-0 ${isDark ? 'border-[#22262e]' : 'border-[#d8dce2]'}`}>
        <NavLink
          to="/admin/settings"
          onClick={() => setMobileSidebarOpen(false)}
          className={({ isActive }) => `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors duration-150 cursor-pointer group outline-none select-none border ${
            isActive
              ? (isDark ? 'bg-[#2b2f35] text-white font-semibold border-transparent shadow-xs hover:bg-[#343a44]' : 'bg-white text-[#212b36] font-semibold border-[#dce0e5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]')
              : (isDark ? 'text-[#8c94a5] font-medium border-transparent hover:text-white hover:bg-[#1f2228]' : 'text-[#4b5563] font-medium border-transparent hover:text-[#212b36] hover:bg-[#dfe2e6]/70')
          }`}
        >
          {({ isActive }) => (
            <>
              <IconSettings
                size={17}
                className={`group-hover:rotate-45 transition-transform duration-200 shrink-0 ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-[#0088ff]'
                    : isDark
                    ? 'text-[#8c94a5] group-hover:text-white'
                    : 'text-[#4b5563] group-hover:text-[#212b36]'
                }`}
              />
              <span className={isActive ? 'font-semibold' : 'font-medium'}>Settings</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
