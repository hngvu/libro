
import { useLocation } from 'react-router-dom'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

export function AdminHeader() {
  const { t, mobileSidebarOpen, setMobileSidebarOpen } = useAdmin()
  const location = useLocation()

  // Get Page Title based on Route
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Dashboard'
    if (path === '/admin/books') return 'Catalog'
    if (path.startsWith('/admin/books/') && path.endsWith('/copies')) return 'Book Copies'
    if (path.startsWith('/admin/books/')) return 'Book Details'
    if (path === '/admin/copies') return 'Copies'
    if (path === '/admin/taxonomy') return 'Taxonomy'
    if (path === '/admin/circulation') return 'Checkout & Returns'
    if (path === '/admin/overdue') return 'Overdue'
    if (path === '/admin/reservations') return 'Reservations'
    if (path === '/admin/members') return 'Members'
    if (path === '/admin/fines') return 'Fines'
    if (path === '/admin/reports') return 'Reports'
    if (path === '/admin/staff-settings') return 'Staff & Roles'
    if (path === '/admin/activity-log') return 'Activity Log'
    if (path === '/admin/settings') return 'Settings'
    return 'Administration'
  }

  return (
    <header className={`flex items-center justify-between gap-3 pb-3 border-b ${t.headerBorder}`}>
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className={`md:hidden p-2 rounded-xl border transition-colors cursor-pointer ${t.secondaryBtn}`}
          aria-label="Toggle menu"
        >
          {mobileSidebarOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
        </button>

        <h1 className={`font-sans text-base sm:text-lg font-bold tracking-tight ${t.titleColor}`}>
          {getPageTitle()}
        </h1>
      </div>
    </header>
  )
}
