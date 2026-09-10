import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import type { UserResponse } from '@/types/api'
import {
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)

  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setError(null)
      setSuccessMsg(null)
      setRegConfirmPassword('')
    }
  }, [open, defaultMode])

  // Login form states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form states
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regFullName, setRegFullName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const redirectAfterLogin = (loggedInUser: UserResponse | null) => {
    onOpenChange(false)
    if (!loggedInUser) return

    if (loggedInUser.role === 'ADMIN' || loggedInUser.role === 'LIBRARIAN') {
      // Staff accounts go directly to the administration desk
      navigate('/admin')
    } else {
      // Reader account: if currently on /admin, redirect back to catalog
      if (location.pathname === '/admin') {
        navigate('/')
      }
    }
  }

  const handleQuickLogin = async (email: string, pass: string) => {
    setError(null)
    setLoading(true)
    try {
      const loggedUser = await login(email, pass)
      redirectAfterLogin(loggedUser)
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedUser = await login(loginEmail, loginPassword)
      redirectAfterLogin(loggedUser)
    } catch (err: any) {
      setError(err.message || 'Login failed. Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your password.')
      return
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await register({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
      })
      setSuccessMsg('Account registered successfully! Please sign in.')
      setMode('login')
      setLoginEmail(regEmail)
      setLoginPassword(regPassword)
      setRegConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="w-full max-w-[400px] p-6 sm:p-7">
        <DialogHeader className="mb-4 text-center sm:text-center">
          <DialogTitle className="font-serif text-2xl font-bold text-[#181818] dark:text-[#f5f3e6] tracking-tight">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-3.5 flex items-center gap-2.5 p-2.5 text-[12.5px] text-rose-800 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in">
            <IconAlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3.5 flex items-center gap-2.5 p-2.5 text-[12.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in">
            <IconCheck size={16} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-3">
            <div className="space-y-1">
              <label className="text-[12.5px] font-medium text-[#333] dark:text-[#e0e0e0]">
                Email
              </label>
              <Input
                type="email"
                required
                className="h-9 text-[13px]"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12.5px] font-medium text-[#333] dark:text-[#e0e0e0]">
                Password
              </label>
              <Input
                type="password"
                required
                className="h-9 text-[13px]"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9.5 mt-2 bg-[#3d4b3e] hover:bg-[#2e3a2f] text-white text-[13.5px] font-semibold transition-colors cursor-pointer rounded-md shadow-xs"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Quick Demo Logins */}
            <div className="pt-3.5 mt-3.5 border-t border-[#e8e5dc] dark:border-[#3d4b3e]/60 text-center">
              <p className="text-[11px] text-[#767676] dark:text-[#999] mb-1.5 uppercase tracking-wider font-semibold">Demo accounts</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@libro.com', 'admin123')}
                  disabled={loading}
                  className="px-3 py-1 text-[11.5px] font-medium rounded-full border border-[#d8d5ce] dark:border-[#3d4b3e] bg-white dark:bg-[#1a201c] hover:bg-black/5 text-[#444] dark:text-[#ccc] transition-colors cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('lucia@libro.com', 'lucia123')}
                  disabled={loading}
                  className="px-3 py-1 text-[11.5px] font-medium rounded-full border border-[#d8d5ce] dark:border-[#3d4b3e] bg-white dark:bg-[#1a201c] hover:bg-black/5 text-[#444] dark:text-[#ccc] transition-colors cursor-pointer"
                >
                  Librarian
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('bin@libro.com', 'chubin123')}
                  disabled={loading}
                  className="px-3 py-1 text-[11.5px] font-medium rounded-full border border-[#d8d5ce] dark:border-[#3d4b3e] bg-white dark:bg-[#1a201c] hover:bg-black/5 text-[#444] dark:text-[#ccc] transition-colors cursor-pointer"
                >
                  Reader
                </button>
              </div>
            </div>

            {/* Bottom Switch Link */}
            <div className="pt-3 text-center text-[13px] text-[#666666] dark:text-[#a0a0a0]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setSuccessMsg(null)
                }}
                className="font-semibold text-[#181818] dark:text-[#f5f3e6] hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} autoComplete="off" className="space-y-3">
            <div className="space-y-1">
              <label className="text-[12.5px] font-medium text-[#333] dark:text-[#e0e0e0]">
                Full name
              </label>
              <Input
                required
                className="h-9 text-[13px]"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12.5px] font-medium text-[#333] dark:text-[#e0e0e0]">
                Email
              </label>
              <Input
                type="email"
                required
                className="h-9 text-[13px]"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12.5px] font-medium text-[#333] dark:text-[#e0e0e0]">
                Password
              </label>
              <Input
                type="password"
                required
                className="h-9 text-[13px]"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12.5px] font-medium text-[#333] dark:text-[#e0e0e0]">
                Confirm password
              </label>
              <Input
                type="password"
                required
                className="h-9 text-[13px]"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9.5 mt-2 bg-[#3d4b3e] hover:bg-[#2e3a2f] text-white text-[13.5px] font-semibold transition-colors cursor-pointer rounded-md shadow-xs"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            {/* Bottom Switch Link */}
            <div className="pt-3 mt-3 border-t border-[#e8e5dc] dark:border-[#3d4b3e]/60 text-center text-[13px] text-[#666666] dark:text-[#a0a0a0]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMsg(null)
                }}
                className="font-semibold text-[#181818] dark:text-[#f5f3e6] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
