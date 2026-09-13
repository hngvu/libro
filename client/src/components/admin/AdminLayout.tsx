import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import { AdminProvider, useAdmin } from './AdminContext'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

export interface AdminLayoutOutletContext {
  counts: {
    books: number
    copies: number
    overdue: number
    activeLoans: number
    members: number
  }
  refreshCounts: () => Promise<void> | void
}

function AdminLayoutInner() {
  const navigate = useNavigate()
  const { user, login, logout, canAccessAdmin, loading: authLoading } = useAuth()
  const { t, isDark, feedback, mobileSidebarOpen, setMobileSidebarOpen } = useAdmin()

  // Gate 1: Login form state
  const [gateEmail, setGateEmail] = useState('')
  const [gatePassword, setGatePassword] = useState('')
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError] = useState('')

  const handleQuickLogin = async (role: 'admin' | 'librarian') => {
    setGateLoading(true)
    setGateError('')
    try {
      if (role === 'admin') {
        await login('admin@libro.com', 'admin123')
      } else {
        await login('lucia@libro.com', 'lucia123')
      }
    } catch (err: any) {
      setGateError(err.message || 'Staff authentication failed.')
    } finally {
      setGateLoading(false)
    }
  }

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGateLoading(true)
    setGateError('')
    try {
      const loggedUser = await login(gateEmail, gatePassword)
      if (loggedUser && (loggedUser.role === 'ADMIN' || loggedUser.role === 'LIBRARIAN')) {
        navigate('/admin')
      } else if (loggedUser && loggedUser.role === 'MEMBER') {
        navigate('/')
      }
    } catch (err: any) {
      setGateError(err.message || 'Invalid staff credentials or insufficient clearance.')
    } finally {
      setGateLoading(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-24 min-h-screen ${t.pageBg}`}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-gray-400">Verifying staff credentials...</p>
      </div>
    )
  }

  // Gate 1: Unauthenticated -> Staff Sign In
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${t.pageBg}`}>
        <div className={`border rounded-2xl p-6 sm:p-8 shadow-xl max-w-sm w-full space-y-5 ${t.modalBg}`}>
          <div className="flex items-center justify-center gap-2.5 select-none pt-1">
            <div className="relative">
              <img
                src="/favicon.svg"
                alt="Libro"
                className="w-8 h-8 rounded-xl object-contain bg-blue-600/10 p-1"
              />
            </div>
            <span
              className={`font-serif text-[22px] font-bold tracking-[0.12em] lowercase leading-none ${t.titleColor}`}
              style={{ fontFamily: "'Playfair Display', 'Merriweather', Georgia, serif" }}
            >
              libro
            </span>
          </div>

          {gateError && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-2">
              <IconAlertTriangle size={15} className="shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleGateSubmit} className="space-y-3.5">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.subTextColor}`}>Email</label>
              <input
                type="email"
                required
                autoFocus
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.subTextColor}`}>Password</label>
              <input
                type="password"
                required
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={gateLoading}
                className={`w-full h-9 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 ${t.primaryBtn}`}
              >
                {gateLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs">
            <span className={`text-[11px] ${t.mutedColor}`}>Demo:</span>
            <button
              type="button"
              disabled={gateLoading}
              onClick={() => handleQuickLogin('admin')}
              className={`text-[11px] font-medium hover:underline cursor-pointer ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              Admin
            </button>
            <span className={t.mutedColor}>·</span>
            <button
              type="button"
              disabled={gateLoading}
              onClick={() => handleQuickLogin('librarian')}
              className={`text-[11px] font-medium hover:underline cursor-pointer ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              Librarian
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Gate 2: Logged in but unauthorized (e.g. MEMBER)
  if (!canAccessAdmin) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${t.pageBg}`}>
        <div className={`border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4 max-w-sm w-full ${t.modalBg}`}>
          <div className="space-y-1">
            <h2 className={`text-lg font-bold font-sans ${t.titleColor}`}>
              Access Denied
            </h2>
            <p className={`text-xs ${t.subTextColor}`}>
              Account <span className={`font-medium ${t.titleColor}`}>{user.email}</span> does not have staff permissions.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => logout()}
              className={`w-full h-9 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const outletContext: AdminLayoutOutletContext = {
    counts: {
      books: 0,
      copies: 0,
      overdue: 0,
      activeLoans: 0,
      members: 0,
    },
    refreshCounts: async () => {},
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-150 ${t.pageBg}`}>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Workspace Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="max-w-[1600px] w-full mx-auto space-y-6">
          {/* Top Header */}
          <AdminHeader />

          {/* Global Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 transition-all shadow-xs ${
                feedback.type === 'success'
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isDark
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <IconCheck size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <IconAlertTriangle size={16} className="text-rose-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Route Content Outlet */}
          <div className="w-full">
            <Outlet context={outletContext} />
          </div>
        </div>
      </main>
    </div>
  )
}

export function AdminLayout() {
  return (
    <AdminProvider>
      <AdminLayoutInner />
    </AdminProvider>
  )
}
