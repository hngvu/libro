import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import {
  IconLock,
  IconMail,
  IconUser,
  IconSparkles,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
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

  const handleQuickLogin = async (email: string, pass: string) => {
    setError(null)
    setLoading(true)
    try {
      await login(email, pass)
      onOpenChange(false)
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
      await login(loginEmail, loginPassword)
      onOpenChange(false)
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
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-2xl bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/60 flex items-center justify-center text-[#3d4b3e] dark:text-[#f5f3e6]">
              <IconSparkles size={24} />
            </div>
          </div>
          <DialogTitle className="font-serif text-center text-xl text-[#1e2320] dark:text-[#f5f3e6]">
            {mode === 'login' ? 'Welcome to Libro' : 'Join the Libro Community'}
          </DialogTitle>
          <DialogDescription className="text-center text-[#6f7f64] dark:text-[#c8d0b7]">
            {mode === 'login'
              ? 'Sign in to discover books, borrow titles, and manage your library shelves'
              : 'Create your free library account in under 30 seconds'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <IconAlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-[#3d4b3e] bg-[#c8d0b7]/30 border border-[#c8d0b7] rounded-lg">
            <IconCheck size={18} className="shrink-0 text-[#6f7f64]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Demo Fast Buttons */}
        {mode === 'login' && (
          <div className="mb-4 p-3 bg-[#c8d0b7]/25 dark:bg-[#1e2320]/60 rounded-xl border border-[#c8d0b7]/80 dark:border-[#3d4b3e]">
            <p className="text-xs font-semibold text-[#3d4b3e] dark:text-[#c8d0b7] uppercase tracking-wider mb-2">
              Quick Sign-In (Demo Profiles):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@libro.com', 'admin123')}
                disabled={loading}
                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-[#252c28] hover:bg-[#c8d0b7]/50 border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-lg text-[#3d4b3e] dark:text-[#f5f3e6] transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('lucia@libro.com', 'lucia123')}
                disabled={loading}
                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-[#252c28] hover:bg-[#c8d0b7]/50 border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-lg text-[#3d4b3e] dark:text-[#f5f3e6] transition-colors cursor-pointer"
              >
                Librarian
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('bin@libro.com', 'chubin123')}
                disabled={loading}
                className="px-2 py-1.5 text-xs font-medium bg-white dark:bg-[#252c28] hover:bg-[#c8d0b7]/50 border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-lg text-[#6f7f64] dark:text-[#c8d0b7] transition-colors cursor-pointer"
              >
                Reader Bin
              </button>
            </div>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                Email Address
              </label>
              <div className="relative">
                <IconMail className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="pl-9"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                Password
              </label>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-9"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setMode('register')
                  }}
                  className="text-[#3d4b3e] dark:text-[#f5f3e6] font-semibold hover:underline cursor-pointer"
                >
                  Join Libro free
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                Full Name
              </label>
              <div className="relative">
                <IconUser className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
                <Input
                  required
                  placeholder="John Doe"
                  className="pl-9 text-xs"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                Email Address
              </label>
              <div className="relative">
                <IconMail className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
                <Input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="pl-9 text-xs"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                Password
              </label>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-9 text-xs"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                Confirm Password
              </label>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-9 text-xs"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setMode('login')
                  }}
                  className="text-[#3d4b3e] dark:text-[#f5f3e6] font-semibold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
