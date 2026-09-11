import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  IconShieldLock,
  IconAlertTriangle,
  IconKey,
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

  // Gate 1: Unauthenticated -> Staff Portal Sign In
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-10 px-4 ${t.pageBg}`}>
        <div className={`border rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-md w-full ${t.modalBg}`}>
          <div className="text-center space-y-2">
            <div
              className={`inline-flex p-3 rounded-full border mb-1 ${
                isDark ? 'bg-[#16181d] border-[#2c323e] text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
              }`}
            >
              <IconShieldLock size={30} />
            </div>
            <h2 className={`text-xl font-bold font-sans ${t.titleColor}`}>
              Staff Administration Portal
            </h2>
            <p className={`text-xs leading-relaxed ${t.subTextColor}`}>
              Circulation desk, barcode tracking, and library cataloging are restricted to authorized staff (Librarians & Administrators).
            </p>
          </div>

          {gateError && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-2">
              <IconAlertTriangle size={16} className="shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Logins */}
          <div className="space-y-2.5">
            <div className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>
              Quick 1-Click Staff Access (Demo)
            </div>
            <button
              type="button"
              disabled={gateLoading}
              onClick={() => handleQuickLogin('admin')}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between group cursor-pointer disabled:opacity-60 ${
                isDark
                  ? 'bg-[#16181d] border-[#2c323e] hover:border-[#3e4757]'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  A
                </div>
                <div>
                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${t.titleColor}`}>
                    Sign in as Administrator
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                      Full Access
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono ${t.subTextColor}`}>admin@libro.com</div>
                </div>
              </div>
              <IconKey size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
            </button>

            <button
              type="button"
              disabled={gateLoading}
              onClick={() => handleQuickLogin('librarian')}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between group cursor-pointer disabled:opacity-60 ${
                isDark
                  ? 'bg-[#16181d] border-[#2c323e] hover:border-[#3e4757]'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  L
                </div>
                <div>
                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${t.titleColor}`}>
                    Sign in as Librarian
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      Circulation Desk
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono ${t.subTextColor}`}>lucia@libro.com</div>
                </div>
              </div>
              <IconKey size={16} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`} />
            </div>
            <span
              className={`relative px-2 text-[10px] uppercase font-semibold ${
                isDark ? 'bg-[#1f232b] text-[#5d6575]' : 'bg-white text-gray-400'
              }`}
            >
              or custom credentials
            </span>
          </div>

          <form onSubmit={handleGateSubmit} className="space-y-3">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Staff Email</label>
              <input
                type="email"
                required
                placeholder="staff@libro.com"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <button
              type="submit"
              disabled={gateLoading}
              className={`w-full h-9 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 ${t.primaryBtn}`}
            >
              {gateLoading ? 'Authenticating...' : 'Sign In to Staff Desk'}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`text-xs hover:underline cursor-pointer transition-colors ${t.subTextColor}`}
            >
              ← Return to Reader Public Catalog
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
        <div className={`border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5 max-w-md w-full ${t.modalBg}`}>
          <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconAlertTriangle size={30} />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-sans ${t.titleColor}`}>
              Staff Clearance Required
            </h2>
            <p className={`text-xs mt-2 leading-relaxed ${t.subTextColor}`}>
              You are signed in as <strong className={t.titleColor}>{user.fullName || user.username}</strong> (<code className="text-xs font-mono">{user.email}</code>) with role{' '}
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">
                {user.role}
              </span>.
            </p>
            <p className={`text-xs mt-1.5 ${t.subTextColor}`}>
              The circulation desk and administration console are only accessible by Librarians and System Administrators.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => logout()}
              className={`w-full h-9 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
            >
              Switch to Staff Account
            </button>
            <button
              onClick={() => navigate('/')}
              className={`w-full h-9 text-xs rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
            >
              Return to Reader Public Catalog
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
