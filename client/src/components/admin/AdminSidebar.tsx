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
      <div className={`pb-3 border-b shrink-0 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
        <SidebarHeader />
      </div>

      {/* Middle: Scrollable Grouped Navigation */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-3 min-h-0 pt-3">
        <SidebarNav />
      </div>

      {/* Footer: Settings Link (Navigates to /admin/settings) */}
      <div className={`pt-3 border-t shrink-0 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
        <NavLink
          to="/admin/settings"
          onClick={() => setMobileSidebarOpen(false)}
          className={({ isActive }) => `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors duration-150 cursor-pointer group ${
            isActive
              ? (isDark ? 'bg-[#2b2f35] text-white font-semibold shadow-xs hover:bg-[#343a44]' : 'bg-gray-100 text-gray-950 font-semibold border border-gray-200/90 shadow-xs hover:bg-gray-200/70')
              : (isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]' : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100')
          }`}
        >
          <IconSettings
            size={17}
            className="group-hover:rotate-45 transition-transform duration-200"
          />
          <span className="font-semibold">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
