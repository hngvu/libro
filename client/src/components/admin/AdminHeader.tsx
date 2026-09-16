import { useLocation, useNavigate } from 'react-router-dom'
import {
  IconMenu2,
  IconX,
  IconLogout,
  IconUser,
} from '@tabler/icons-react'
import { useAdmin } from './AdminContext'
import { useAuth } from '@/context/AuthContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function AdminHeader() {
  const { t, isDark, mobileSidebarOpen, setMobileSidebarOpen, headerAction, headerTitle } = useAdmin()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Get Page Title based on Route
  const getPageTitle = () => {
    if (headerTitle) return headerTitle
    const path = location.pathname

    // 1. Dashboard
    if (path === '/admin') return 'Dashboard'

    // 2. Books Group
    if (path === '/admin/books/new') return 'New Book'
    if (path.startsWith('/admin/books/')) return 'Edit Book'
    if (path === '/admin/books') return 'Catalog'
    if (path === '/admin/copies') return 'Copies'
    if (path === '/admin/authors/new') return 'New Author'
    if (path.startsWith('/admin/authors/')) return 'Edit Author'
    if (path === '/admin/authors') return 'Authors'
    if (path === '/admin/genres/new') return 'New Genre'
    if (path.startsWith('/admin/genres/')) return 'Edit Genre'
    if (path === '/admin/genres') return 'Genres'

    // 3. Circulation Group
    if (path.startsWith('/admin/circulation/reservations/') || path.startsWith('/admin/reservations/')) return 'Reservation'
    if (path === '/admin/circulation/reservations' || path === '/admin/reservations') return 'Reservations'
    if (path === '/admin/circulation/overdue' || path === '/admin/overdue') return 'Overdue'
    if (path === '/admin/circulation/renewals' || path === '/admin/renewals') return 'Renewals'
    if (path.startsWith('/admin/circulation/')) return 'Loan'
    if (path === '/admin/circulation/desk' || path === '/admin/circulation') return 'Desk'

    // 4. Membership Group
    if (path === '/admin/membership/plans/new' || path === '/admin/subscriptions/plans/new' || path === '/admin/membership-plans/new') return 'New Plan'
    if (path.startsWith('/admin/membership/plans/') || path.startsWith('/admin/subscriptions/plans/') || path.startsWith('/admin/membership-plans/')) return 'Edit Plan'
    if (path === '/admin/membership/plans' || path === '/admin/subscriptions/plans' || path === '/admin/membership-plans' || path === '/admin/membership') return 'Plans'
    if (path === '/admin/membership/subscriptions' || path === '/admin/subscriptions/history' || path === '/admin/user-subscriptions' || path === '/admin/subscriptions') return 'Subscriptions'

    // 5. Fines Group
    if (path.startsWith('/admin/fines/penalties/') || /^\/admin\/fines\/\d+/.test(path)) return 'Penalty Detail'
    if (path === '/admin/fines/penalties') return 'Penalties'
    if (path === '/admin/fines' || path === '/admin/fines/fees' || path === '/admin/fines/dues' || path === '/admin/fines/settings' || path === '/admin/fines/config') return 'Fees'

    // 6. Members
    if (path.startsWith('/admin/members/')) return 'Member'
    if (path === '/admin/members') return 'Members'

    // 7. Reports
    if (path === '/admin/reports') return 'Reports'

    // 8. Admin Settings
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

      <div className="flex items-center gap-2.5 shrink-0">
        {headerAction && (
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        )}

        {/* User Dropdown Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 px-2.5 sm:px-3 rounded-lg border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer select-none outline-none ${t.cardBg} ${t.cardHover} ${
                  isDark ? 'border-[#2c323e]' : 'border-[#dce0e5]'
                }`}
              >
                <span className={`font-semibold max-w-[120px] truncate ${t.titleColor}`}>
                  {user.fullName || user.username}
                </span>
                <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-semibold text-[11px] uppercase shrink-0 shadow-2xs">
                  {user.fullName ? user.fullName.charAt(0) : user.username ? user.username.charAt(0) : <IconUser size={13} />}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52 p-1.5 space-y-1">
              {/* User profile header */}
              <div className="px-2.5 py-1.5">
                <p className={`text-xs font-bold truncate ${t.titleColor}`}>
                  {user.fullName || user.username}
                </p>
                <p className="text-xs text-[#637381] dark:text-[#8c94a5] font-normal truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              <DropdownMenuSeparator />

              {/* Logout Option */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs cursor-pointer py-1.5 text-[#4b5563] dark:text-[#cbd2de] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10 transition-colors"
              >
                <IconLogout size={15} />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
