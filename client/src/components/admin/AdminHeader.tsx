
import { useLocation } from 'react-router-dom'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

export function AdminHeader() {
  const { t, mobileSidebarOpen, setMobileSidebarOpen, headerAction } = useAdmin()
  const location = useLocation()

  // Get Page Title based on Route
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Dashboard'
    if (path === '/admin/books') return 'Catalog'
    if (path === '/admin/books/new') return 'New Book'
    if (path.startsWith('/admin/books/') && path.endsWith('/copies')) return 'Book Copies'
    if (path.startsWith('/admin/books/')) return 'Edit Book'
    if (path === '/admin/copies') return 'Copies'
    if (path === '/admin/authors/new') return 'New Author'
    if (path.startsWith('/admin/authors/')) return 'Edit Author'
    if (path === '/admin/authors') return 'Authors'
    if (path === '/admin/genres/new') return 'New Genre'
    if (path.startsWith('/admin/genres/')) return 'Edit Genre'
    if (path === '/admin/genres') return 'Genres'
    if (path === '/admin/circulation') return 'Desk'
    if (path === '/admin/overdue') return 'Overdue'
    if (path === '/admin/reservations') return 'Reservations'
    if (path === '/admin/subscriptions/plans/new' || path === '/admin/membership-plans/new') return 'New Plan'
    if (path.startsWith('/admin/subscriptions/plans/') || path.startsWith('/admin/membership-plans/')) return 'Edit Plan'
    if (path === '/admin/subscriptions/plans' || path === '/admin/membership-plans') return 'Plans'
    if (path === '/admin/subscriptions/history' || path === '/admin/user-subscriptions') return 'History'
    if (path === '/admin/members') return 'Members'
    if (path === '/admin/fines') return 'Fines'
    if (path === '/admin/reports') return 'Reports'
    if (path === '/admin/staff-settings') return 'Staff'
    if (path === '/admin/activity-log') return 'Logs'
    if (path === '/admin/settings') return 'Settings'
    return 'Admin'
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

      {headerAction && (
        <div className="flex items-center gap-2 shrink-0">
          {headerAction}
        </div>
      )}
    </header>
  )
}
