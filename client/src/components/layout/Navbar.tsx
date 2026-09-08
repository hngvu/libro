import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconBooks,
  IconClock,
  IconDashboard,
  IconUser,
  IconLogout,
  IconLogin,
  IconUserPlus,
  IconChevronDown,
} from '@tabler/icons-react'

interface NavbarProps {
  currentView: 'catalog' | 'loans' | 'admin'
  onViewChange: (view: 'catalog' | 'loans' | 'admin') => void
  onOpenAuth: (mode?: 'login' | 'register') => void
  onOpenProfile: () => void
}

export function Navbar({
  currentView,
  onViewChange,
  onOpenAuth,
  onOpenProfile,
}: NavbarProps) {
  const { user, logout, canAccessAdmin } = useAuth()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#f5f3e6]/95 dark:bg-[#1e2320]/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Goodreads-style Brand */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onViewChange('catalog')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="h-9 w-9 rounded-lg bg-[#3d4b3e] flex items-center justify-center text-[#f5f3e6] shadow-sm">
              <IconBooks size={20} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif font-bold text-2xl tracking-tight text-[#1e2320] dark:text-[#f5f3e6] lowercase">
                libro
              </span>
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-[#6f7f64] dark:text-[#c8d0b7]">
                reads
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onViewChange('catalog')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'catalog'
                  ? 'bg-[#3d4b3e] text-[#f5f3e6]'
                  : 'text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40'
              }`}
            >
              Browse Catalog
            </button>

            {user && (
              <button
                onClick={() => onViewChange('loans')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'loans'
                    ? 'bg-[#3d4b3e] text-[#f5f3e6]'
                    : 'text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40'
                }`}
              >
                <IconClock size={16} />
                My Bookshelf
              </button>
            )}

            {canAccessAdmin && (
              <button
                onClick={() => onViewChange('admin')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-[#3d4b3e] text-[#f5f3e6]'
                    : 'text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40'
                }`}
              >
                <IconDashboard size={16} />
                Admin Desk
                <span className="h-1.5 w-1.5 rounded-full bg-[#6f7f64]" />
              </button>
            )}
          </nav>
        </div>

        {/* User / Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-full hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 transition-colors border border-[#c8d0b7] dark:border-[#3d4b3e] cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-[#3d4b3e] text-[#f5f3e6] font-bold text-xs flex items-center justify-center">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] leading-tight">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] text-[#6f7f64] dark:text-[#c8d0b7]">
                    <Badge
                      variant={
                        user.role === 'ADMIN'
                          ? 'destructive'
                          : user.role === 'LIBRARIAN'
                          ? 'default'
                          : 'secondary'
                      }
                      className="py-0 px-1 text-[9px]"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <IconChevronDown size={14} className="text-[#6f7f64]" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-[#c8d0b7]/50 dark:border-[#3d4b3e] mb-1">
                      <p className="text-xs font-bold text-[#1e2320] dark:text-[#f5f3e6]">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        onOpenProfile()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <IconUser size={15} /> Account Profile
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        onViewChange('loans')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <IconClock size={15} /> My Loans & Shelves
                    </button>

                    {canAccessAdmin && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onViewChange('admin')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-lg transition-colors cursor-pointer font-medium"
                      >
                        <IconDashboard size={15} /> Library Management
                      </button>
                    )}

                    <div className="my-1 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <IconLogout size={15} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth('login')}
                className="gap-1 text-xs font-semibold"
              >
                <IconLogin size={15} /> Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenAuth('register')}
                className="gap-1 text-xs font-semibold"
              >
                <IconUserPlus size={15} /> Join Libro
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
