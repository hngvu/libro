import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type {
  BookResponse,
  BookCopyResponse,
  LoanResponse,
  UserResponse,
  BookFormat,
  BookStatus,
  BookCopyStatus,
  LoanStatus,
  UserRole,
} from '@/types/api'
import { api } from '@/services/api'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  IconBook,
  IconBarcode,
  IconUsers,
  IconPlus,
  IconPencil,
  IconTrash,
  IconArrowBackUp,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
  IconShieldLock,
  IconLogout,
  IconBooks,
  IconExternalLink,
  IconInfoCircle,
  IconKey,
  IconMenu2,
  IconX,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react'

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user, login, logout, isAdmin, isLibrarian, canAccessAdmin, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('books')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Settings modal & Circulation policies state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [circulationSettings, setCirculationSettings] = useState({
    defaultLoanDays: 14,
    defaultRenewDays: 7,
    maxRenewalsAllowed: 2,
    finePerDayOverdue: 5000,
  })

  // Staff portal login gate state
  const [gateEmail, setGateEmail] = useState('')
  const [gatePassword, setGatePassword] = useState('')
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError] = useState('')

  // ==========================================
  // 1. BOOKS STATE
  // ==========================================
  const [books, setBooks] = useState<BookResponse[]>([])
  const [bookKeyword, setBookKeyword] = useState('')
  const [bookLoading, setBookLoading] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<BookResponse | null>(null)
  const [bookFormData, setBookFormData] = useState({
    title: '',
    handle: '',
    slug: '',
    isbn: '',
    publicationYear: 2024,
    cover: '',
    edition: '1st Edition',
    format: 'PAPERBACK' as BookFormat,
    description: '',
    status: 'ACTIVE' as BookStatus,
  })

  // ==========================================
  // 2. COPIES STATE
  // ==========================================
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [copyKeyword, setCopyKeyword] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyFormData, setCopyFormData] = useState({
    barcode: '',
    bookId: 0,
  })

  // ==========================================
  // 3. LOANS STATE
  // ==========================================
  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [loanKeyword, setLoanKeyword] = useState('')
  const [loanStatus, setLoanStatus] = useState<LoanStatus | ''>('')
  const [loanLoading, setLoanLoading] = useState(false)
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [loanFormData, setLoanFormData] = useState({
    userId: 0,
    bookCopyId: 0,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedLoanForRenew, setSelectedLoanForRenew] = useState<LoanResponse | null>(null)
  const [renewDays, setRenewDays] = useState(7)

  // ==========================================
  // 4. USERS STATE
  // ==========================================
  const [users, setUsers] = useState<UserResponse[]>([])
  const [userKeyword, setUserKeyword] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'MEMBER' as UserRole,
  })

  // General Notification / Error
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ==========================================
  // FETCHERS
  // ==========================================
  const fetchBooks = useCallback(async () => {
    setBookLoading(true)
    try {
      const res = await api.adminGetBooks({
        keyword: bookKeyword || undefined,
        page: 1,
        size: 50,
      })
      setBooks(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load books')
    } finally {
      setBookLoading(false)
    }
  }, [bookKeyword])

  const fetchCopies = useCallback(async () => {
    setCopyLoading(true)
    try {
      const res = await api.adminGetBookCopies({
        keyword: copyKeyword || undefined,
        page: 1,
        size: 50,
      })
      setCopies(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load copies')
    } finally {
      setCopyLoading(false)
    }
  }, [copyKeyword])

  const fetchLoans = useCallback(async () => {
    setLoanLoading(true)
    try {
      const res = await api.adminGetLoans({
        keyword: loanKeyword || undefined,
        status: loanStatus || undefined,
        page: 1,
        size: 50,
      })
      setLoans(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load loans')
    } finally {
      setLoanLoading(false)
    }
  }, [loanKeyword, loanStatus])

  const fetchUsers = useCallback(async () => {
    setUserLoading(true)
    try {
      const res = await api.adminGetUsers({
        keyword: userKeyword || undefined,
        page: 1,
        size: 50,
      })
      setUsers(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load users')
    } finally {
      setUserLoading(false)
    }
  }, [userKeyword])

  // ==========================================
  // SIDEBAR SEARCH HELPERS
  // ==========================================
  const currentSearchKeyword =
    activeTab === 'books'
      ? bookKeyword
      : activeTab === 'copies'
        ? copyKeyword
        : activeTab === 'loans'
          ? loanKeyword
          : userKeyword

  const handleSidebarSearchChange = (val: string) => {
    if (activeTab === 'books') setBookKeyword(val)
    else if (activeTab === 'copies') setCopyKeyword(val)
    else if (activeTab === 'loans') setLoanKeyword(val)
    else if (activeTab === 'users') setUserKeyword(val)
  }

  const handleSidebarSearchSubmit = () => {
    if (activeTab === 'books') fetchBooks()
    else if (activeTab === 'copies') fetchCopies()
    else if (activeTab === 'loans') fetchLoans()
    else if (activeTab === 'users') fetchUsers()
  }

  const handleClearSidebarSearch = () => {
    handleSidebarSearchChange('')
  }

  const getSearchPlaceholder = () => {
    if (activeTab === 'books') return 'Search titles, ISBN...'
    if (activeTab === 'copies') return 'Search barcodes...'
    if (activeTab === 'loans') return 'Search loans...'
    if (activeTab === 'users') return 'Search users...'
    return 'Search in desk...'
  }

  // Preload all overview metrics when authorized
  useEffect(() => {
    if (canAccessAdmin) {
      fetchBooks()
      fetchCopies()
      fetchLoans()
      fetchUsers()
    }
  }, [canAccessAdmin, fetchBooks, fetchCopies, fetchLoans, fetchUsers])

  // Refetch active tab data when tab changes
  useEffect(() => {
    if (!canAccessAdmin) return
    if (activeTab === 'books') fetchBooks()
    else if (activeTab === 'copies') fetchCopies()
    else if (activeTab === 'loans') fetchLoans()
    else if (activeTab === 'users') fetchUsers()
  }, [activeTab, canAccessAdmin, fetchBooks, fetchCopies, fetchLoans, fetchUsers])

  // ==========================================
  // HANDLERS: BOOKS
  // ==========================================
  const handleOpenCreateBook = () => {
    setEditingBook(null)
    setBookFormData({
      title: '',
      handle: `BK${String(Math.floor(100000 + Math.random() * 900000))}`,
      slug: '',
      isbn: `978${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      publicationYear: 2024,
      cover: '',
      edition: '1st Edition',
      format: 'PAPERBACK',
      description: '',
      status: 'ACTIVE',
    })
    setBookModalOpen(true)
  }

  const handleOpenEditBook = (book: BookResponse) => {
    setEditingBook(book)
    setBookFormData({
      title: book.title,
      handle: book.handle,
      slug: book.slug,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      cover: book.cover || '',
      edition: book.edition || '1st Edition',
      format: (book.format as BookFormat) || 'PAPERBACK',
      description: book.description || '',
      status: book.status,
    })
    setBookModalOpen(true)
  }

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await api.adminUpdateBook(editingBook.id, {
          title: bookFormData.title,
          slug: bookFormData.slug || bookFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isbn: bookFormData.isbn,
          publicationYear: Number(bookFormData.publicationYear),
          cover: bookFormData.cover || undefined,
          edition: bookFormData.edition,
          format: bookFormData.format,
          description: bookFormData.description,
          status: bookFormData.status,
        })
        showFeedback('success', 'Book details updated successfully!')
      } else {
        await api.adminCreateBook({
          title: bookFormData.title,
          handle: bookFormData.handle,
          slug: bookFormData.slug || bookFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isbn: bookFormData.isbn,
          publicationYear: Number(bookFormData.publicationYear),
          cover: bookFormData.cover || undefined,
          edition: bookFormData.edition,
          format: bookFormData.format,
          description: bookFormData.description,
        })
        showFeedback('success', 'New book title added to catalog!')
      }
      setBookModalOpen(false)
      fetchBooks()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save book')
    }
  }

  const handleDeleteBook = async (id: number) => {
    if (!confirm('Are you sure you want to archive this book? It will be hidden from end users.')) return
    try {
      await api.adminDeleteBook(id)
      showFeedback('success', 'Book archived successfully!')
      fetchBooks()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive book')
    }
  }

  // ==========================================
  // HANDLERS: COPIES
  // ==========================================
  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateBookCopy({
        barcode: copyFormData.barcode,
        bookId: Number(copyFormData.bookId),
      })
      showFeedback('success', 'New physical copy registered!')
      setCopyModalOpen(false)
      fetchCopies()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create copy')
    }
  }

  const handleUpdateCopyStatus = async (id: number, status: BookCopyStatus) => {
    try {
      await api.adminUpdateBookCopy(id, { status })
      showFeedback('success', 'Copy status updated successfully!')
      fetchCopies()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update copy status')
    }
  }

  // ==========================================
  // HANDLERS: LOANS
  // ==========================================
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateLoan({
        userId: Number(loanFormData.userId),
        bookCopyId: Number(loanFormData.bookCopyId),
        dueDate: loanFormData.dueDate,
      })
      showFeedback('success', 'Circulation loan ticket issued!')
      setLoanModalOpen(false)
      fetchLoans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to issue loan')
    }
  }

  const handleReturnLoan = async (id: number) => {
    if (!confirm('Confirm book return for this loan ticket?')) return
    try {
      await api.adminReturnLoan(id)
      showFeedback('success', 'Book return processed successfully!')
      fetchLoans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return loan')
    }
  }

  const handleRenewLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoanForRenew) return
    try {
      await api.adminRenewLoan(selectedLoanForRenew.id, {
        extensionDays: Number(renewDays),
      })
      showFeedback('success', 'Loan period extended successfully!')
      setRenewModalOpen(false)
      fetchLoans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to renew loan')
    }
  }

  // ==========================================
  // HANDLERS: USERS
  // ==========================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateUser({
        username: userFormData.username,
        email: userFormData.email,
        password: userFormData.password || 'libro123',
        fullName: userFormData.fullName,
        phone: userFormData.phone || undefined,
        role: userFormData.role,
      })
      showFeedback('success', 'New user account created!')
      setUserModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!isAdmin) {
      showFeedback('error', 'Only Administrators have permission to modify user accounts.')
      return
    }
    if (!confirm('Are you sure you want to deactivate or remove this user account?')) return
    try {
      await api.adminDeleteUser(userId)
      showFeedback('success', 'User account updated successfully.')
      fetchUsers()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove user account.')
    }
  }

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
        // Reader logged in from staff portal -> redirect to catalog
        navigate('/')
      }
    } catch (err: any) {
      setGateError(err.message || 'Invalid staff credentials or insufficient clearance.')
    } finally {
      setGateLoading(false)
    }
  }

  // ==========================================
  // ACCESS CONTROL GATES
  // ==========================================
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#6f7f64]">
        <div className="w-8 h-8 border-2 border-[#3d4b3e] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-serif italic">Verifying staff credentials...</p>
      </div>
    )
  }

  // Gate 1: Unauthenticated -> Staff Portal Sign In
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="bg-[#fafafa] dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-[#3d4b3e]/10 dark:bg-[#c8d0b7]/10 text-[#3d4b3e] dark:text-[#c8d0b7] mb-1">
              <IconShieldLock size={32} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              Staff Administration Portal
            </h2>
            <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]/80">
              Circulation desk, barcode tracking, and library cataloging are restricted to authorized staff (Librarians & Administrators).
            </p>
          </div>

          {gateError && (
            <div className="p-3 rounded-xl text-xs bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-2">
              <IconAlertTriangle size={16} className="shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Logins */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold text-[#6f7f64] uppercase tracking-wider">
              Quick 1-Click Staff Access (Demo)
            </div>
            <button
              type="button"
              disabled={gateLoading}
              onClick={() => handleQuickLogin('admin')}
              className="w-full text-left p-3 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] hover:border-[#3d4b3e] transition flex items-center justify-between group cursor-pointer disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1e2320] dark:text-[#f5f3e6] group-hover:text-[#3d4b3e] flex items-center gap-1.5">
                    Sign in as Administrator
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 font-semibold">
                      Full Access
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6f7f64] font-mono">admin@libro.com</div>
                </div>
              </div>
              <IconKey size={16} className="text-[#6f7f64] group-hover:text-[#3d4b3e]" />
            </button>

            <button
              type="button"
              disabled={gateLoading}
              onClick={() => handleQuickLogin('librarian')}
              className="w-full text-left p-3 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] hover:border-[#3d4b3e] transition flex items-center justify-between group cursor-pointer disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/40 text-[#3d4b3e] dark:text-[#c8d0b7] flex items-center justify-center font-bold text-xs">
                  L
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1e2320] dark:text-[#f5f3e6] group-hover:text-[#3d4b3e] flex items-center gap-1.5">
                    Sign in as Librarian
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#c8d0b7]/50 text-[#1e2320] dark:bg-[#3d4b3e] dark:text-[#c8d0b7] font-semibold">
                      Circulation Desk
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6f7f64] font-mono">lucia@libro.com</div>
                </div>
              </div>
              <IconKey size={16} className="text-[#6f7f64] group-hover:text-[#3d4b3e]" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-[#c8d0b7] dark:border-[#3d4b3e]"></div>
            <span className="shrink mx-3 text-[11px] text-[#6f7f64] uppercase font-semibold">
              or staff credentials
            </span>
            <div className="grow border-t border-[#c8d0b7] dark:border-[#3d4b3e]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleGateSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Staff Email</label>
              <Input
                type="email"
                required
                placeholder="staff@libro.com"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Password</label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button
              type="submit"
              disabled={gateLoading}
              className="w-full h-9 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
            >
              {gateLoading ? 'Authenticating...' : 'Sign In to Staff Desk'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-[#6f7f64] hover:text-[#3d4b3e] dark:hover:text-[#c8d0b7] underline"
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
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-[#fafafa] dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-2xl p-6 sm:p-8 shadow-md text-center space-y-5">
          <div className="inline-flex p-3 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            <IconAlertTriangle size={32} />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              Staff Clearance Required
            </h2>
            <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]/80 mt-2 leading-relaxed">
              You are signed in as <strong className="text-[#1e2320] dark:text-[#f5f3e6]">{user.fullName || user.username}</strong> (<code className="text-xs font-mono">{user.email}</code>) with role <Badge variant="secondary" className="ml-1 text-[10px]">{user.role}</Badge>.
            </p>
            <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]/80 mt-1">
              The circulation desk and administration console are only accessible by Librarians and System Administrators.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={() => logout()}
              className="w-full h-9 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
            >
              Switch to Staff Account
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full h-9 text-xs border-[#c8d0b7] dark:border-[#3d4b3e]"
            >
              Return to Reader Public Catalog
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa] dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]">
      {/* 1. Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 border-b border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#f4f1ea] dark:bg-[#222824] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Libro" className="w-7 h-7 rounded-md object-contain" />
          <span className="font-serif font-bold text-base">Libro Desk</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 text-[#1e2320] dark:text-[#f5f3e6]"
        >
          {mobileSidebarOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
        </Button>
      </div>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 2. Left Sidebar - 2/10 ratio (Clean & Minimal navigation) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 md:w-[20%] md:min-w-[200px] md:max-w-[240px] bg-[#f7f6f1] dark:bg-[#222824] border-r border-[#c8d0b7] dark:border-[#3d4b3e] flex flex-col justify-between p-3 transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Search & Navigation Items */}
        <div>
          {/* In-sidebar Search Header */}
          <div className="mb-2.5">
            <div className="relative">
              <IconSearch
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6f7f64] dark:text-[#c8d0b7]/60 pointer-events-none"
              />
              <Input
                type="text"
                value={currentSearchKeyword}
                onChange={(e) => handleSidebarSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSidebarSearchSubmit()
                }}
                placeholder={getSearchPlaceholder()}
                className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-[#1e2320] border-[#c8d0b7] dark:border-[#3d4b3e] rounded-lg shadow-2xs focus-visible:ring-1 focus-visible:ring-[#3d4b3e]"
              />
              {currentSearchKeyword && (
                <button
                  type="button"
                  onClick={handleClearSidebarSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] p-0.5 rounded cursor-pointer"
                >
                  <IconX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* Nav 1: Books */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('books')
                setMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'books'
                  ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold shadow-xs'
                  : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/35 dark:hover:bg-[#3d4b3e]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconBook size={16} />
                <span>Titles & Catalog</span>
              </div>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'books' ? 'bg-white/20 text-white' : 'text-[#6f7f64] dark:text-[#c8d0b7]'
              }`}>
                {books.length}
              </span>
            </button>

            {/* Nav 2: Copies */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('copies')
                setMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'copies'
                  ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold shadow-xs'
                  : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/35 dark:hover:bg-[#3d4b3e]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconBarcode size={16} />
                <span>Physical Copies</span>
              </div>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'copies' ? 'bg-white/20 text-white' : 'text-[#6f7f64] dark:text-[#c8d0b7]'
              }`}>
                {copies.length}
              </span>
            </button>

            {/* Nav 3: Loans */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('loans')
                setMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold shadow-xs'
                  : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/35 dark:hover:bg-[#3d4b3e]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconClock size={16} />
                <span>Circulation Loans</span>
              </div>
              <div className="flex items-center gap-1.5">
                {loans.filter(l => l.status === 'OVERDUE').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="Overdue loans" />
                )}
                <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === 'loans' ? 'bg-white/20 text-white' : 'text-[#6f7f64] dark:text-[#c8d0b7]'
                }`}>
                  {loans.filter(l => l.status === 'BORROWED').length}
                </span>
              </div>
            </button>

            {/* Nav 4: Users */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('users')
                setMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold shadow-xs'
                  : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/35 dark:hover:bg-[#3d4b3e]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconUsers size={16} />
                <span>Readers & Staff</span>
              </div>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'text-[#6f7f64] dark:text-[#c8d0b7]'
              }`}>
                {users.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Settings Button */}
        <div className="pt-2 border-t border-[#c8d0b7]/40 dark:border-[#3d4b3e]/40">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/35 dark:hover:bg-[#3d4b3e]/30 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <IconSettings size={16} className="text-[#6f7f64] dark:text-[#c8d0b7] group-hover:rotate-45 transition-transform duration-200" />
              <span>Settings</span>
            </div>
            <span className="text-[10px] text-[#6f7f64] dark:text-[#c8d0b7]/70 font-mono">
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Area (8/10 ratio - 80% width) */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        {/* Top Header Row in Workspace */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {activeTab === 'books' && 'Catalog Titles & Bibliography'}
              {activeTab === 'copies' && 'Physical Copies & Barcode Inventory'}
              {activeTab === 'loans' && 'Circulation Desk & Active Loans'}
              {activeTab === 'users' && 'Patrons & Staff Directory'}
            </h1>
            <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]/80 mt-1">
              {activeTab === 'books' && 'Manage library metadata, publication years, ISBN identifiers, and catalog status.'}
              {activeTab === 'copies' && 'Track individual physical items, barcode tags, condition, and shelf availability.'}
              {activeTab === 'loans' && 'Issue loan tickets, process book returns, and grant renewal extensions.'}
              {activeTab === 'users' && 'Directory of registered readers, circulation librarians, and administrator accounts.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Desk Online
            </span>
          </div>
        </div>

        {/* Dynamic KPI Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Titles */}
          <div
            onClick={() => setActiveTab('books')}
            className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
              activeTab === 'books'
                ? 'border-[#3d4b3e] dark:border-[#c8d0b7] bg-white dark:bg-[#252c28] ring-1 ring-[#3d4b3e]/30'
                : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] hover:border-[#3d4b3e]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6f7f64] dark:text-[#c8d0b7] mb-1">
              <span className="text-xs font-semibold">Titles & Catalog</span>
              <IconBooks size={18} />
            </div>
            <div className="text-2xl font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {books.length}
            </div>
            <p className="text-[11px] text-[#6f7f64] mt-0.5 truncate">
              {books.filter((b) => b.status === 'ACTIVE').length} active titles
            </p>
          </div>

          {/* Card 2: Copies */}
          <div
            onClick={() => setActiveTab('copies')}
            className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
              activeTab === 'copies'
                ? 'border-[#3d4b3e] dark:border-[#c8d0b7] bg-white dark:bg-[#252c28] ring-1 ring-[#3d4b3e]/30'
                : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] hover:border-[#3d4b3e]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6f7f64] dark:text-[#c8d0b7] mb-1">
              <span className="text-xs font-semibold">Physical Copies</span>
              <IconBarcode size={18} />
            </div>
            <div className="text-2xl font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {copies.length}
            </div>
            <p className="text-[11px] text-[#6f7f64] mt-0.5 truncate">
              {copies.filter((c) => c.status === 'AVAILABLE').length} on shelf · {copies.filter((c) => c.status === 'BORROWED').length} out
            </p>
          </div>

          {/* Card 3: Active Loans */}
          <div
            onClick={() => {
              setActiveTab('loans')
              setLoanStatus('BORROWED')
            }}
            className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
              activeTab === 'loans'
                ? 'border-[#3d4b3e] dark:border-[#c8d0b7] bg-white dark:bg-[#252c28] ring-1 ring-[#3d4b3e]/30'
                : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] hover:border-[#3d4b3e]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6f7f64] dark:text-[#c8d0b7] mb-1">
              <span className="text-xs font-semibold">Active Loans</span>
              <IconClock size={18} />
            </div>
            <div className="text-2xl font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {loans.filter((l) => l.status === 'BORROWED').length}
            </div>
            <p className="text-[11px] text-[#6f7f64] mt-0.5 truncate">
              Currently in circulation
            </p>
          </div>

          {/* Card 4: Overdue */}
          <div
            onClick={() => {
              setActiveTab('loans')
              setLoanStatus('OVERDUE')
            }}
            className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
              loans.filter((l) => l.status === 'OVERDUE').length > 0
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/40'
                : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#6f7f64] dark:text-[#c8d0b7]'}`}>
                Overdue Returns
              </span>
              <IconAlertTriangle size={18} className={loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-600' : 'text-[#6f7f64]'} />
            </div>
            <div className={`text-2xl font-serif font-bold ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-[#1e2320] dark:text-[#f5f3e6]'}`}>
              {loans.filter((l) => l.status === 'OVERDUE').length}
            </div>
            <p className={`text-[11px] mt-0.5 truncate ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-600 font-semibold' : 'text-[#6f7f64]'}`}>
              {loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'Action required' : 'All loans current'}
            </p>
          </div>

          {/* Card 5: Users */}
          <div
            onClick={() => setActiveTab('users')}
            className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
              activeTab === 'users'
                ? 'border-[#3d4b3e] dark:border-[#c8d0b7] bg-white dark:bg-[#252c28] ring-1 ring-[#3d4b3e]/30'
                : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] hover:border-[#3d4b3e]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6f7f64] dark:text-[#c8d0b7] mb-1">
              <span className="text-xs font-semibold">Patrons & Staff</span>
              <IconUsers size={18} />
            </div>
            <div className="text-2xl font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {users.length}
            </div>
            <p className="text-[11px] text-[#6f7f64] mt-0.5 truncate">
              {users.filter((u) => u.role === 'MEMBER').length} readers · {users.filter((u) => u.role !== 'MEMBER').length} staff
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-[#c8d0b7]/40 text-[#1e2320] border border-[#c8d0b7]'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Tabs (without redundant top TabsList) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>

        {/* ==========================================
            TAB 1: BOOKS
            ========================================== */}
        <TabsContent value="books" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Input
                placeholder="Search title, handle, or ISBN..."
                value={bookKeyword}
                onChange={(e) => setBookKeyword(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={fetchBooks} className="h-9 px-3">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchBooks} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button size="sm" onClick={handleOpenCreateBook} className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]">
                <IconPlus size={15} /> Add New Title
              </Button>
            </div>
          </div>

          {bookLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading catalog titles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Handle</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Copies (Avail/Total)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]">
                      {b.handle}
                    </TableCell>
                    <TableCell>
                      <span className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6] text-xs block hover:underline cursor-pointer">
                        {b.title}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#6f7f64]">{b.isbn}</TableCell>
                    <TableCell className="text-xs">{b.publicationYear}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {b.format}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-[#6f7f64]">{b.availableCopies}</span> / {b.totalCopies}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditBook(b)}
                          className="h-7 w-7 p-0 text-[#6f7f64] hover:text-[#3d4b3e]"
                          title="Edit"
                        >
                          <IconPencil size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBook(b.id)}
                          className="h-7 w-7 p-0 text-[#6f7f64] hover:text-rose-700"
                          title="Archive"
                        >
                          <IconTrash size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ==========================================
            TAB 2: COPIES
            ========================================== */}
        <TabsContent value="copies" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Input
                placeholder="Search barcode number..."
                value={copyKeyword}
                onChange={(e) => setCopyKeyword(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={fetchCopies} className="h-9 px-3">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchCopies} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setCopyFormData({
                    barcode: `BC-${Math.floor(100000 + Math.random() * 900000)}`,
                    bookId: books.length > 0 ? books[0].id : 1,
                  })
                  setCopyModalOpen(true)
                }}
                className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
              >
                <IconPlus size={15} /> Add Copy (Barcode)
              </Button>
            </div>
          </div>

          {copyLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading physical copies...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Catalog Title</TableHead>
                  <TableHead>Book ID</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {copies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                      <span className="flex items-center gap-1.5">
                        <IconBarcode size={16} className="text-[#6f7f64]" />
                        {c.barcode}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-serif font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                      {c.bookTitle || `Book ID #${c.bookId}`}
                    </TableCell>
                    <TableCell className="text-xs text-[#6f7f64] font-mono">{c.bookId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === 'AVAILABLE'
                            ? 'success'
                            : c.status === 'BORROWED'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateCopyStatus(c.id, e.target.value as BookCopyStatus)}
                        className="h-7 px-2 text-[11px] rounded border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BORROWED">BORROWED</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ==========================================
            TAB 3: CIRCULATION LOANS
            ========================================== */}
        <TabsContent value="loans" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search loan code or reader..."
                value={loanKeyword}
                onChange={(e) => setLoanKeyword(e.target.value)}
                className="h-9 text-xs w-64"
              />
              <select
                value={loanStatus}
                onChange={(e) => setLoanStatus(e.target.value as LoanStatus)}
                className="h-9 px-3 text-xs rounded-lg border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]"
              >
                <option value="">All Statuses</option>
                <option value="BORROWED">Borrowed</option>
                <option value="RETURNED">Returned</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <Button size="sm" onClick={fetchLoans} className="h-9 px-3">
                Filter
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchLoans} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (users.length === 0) fetchUsers()
                  if (copies.length === 0) fetchCopies()
                  setLoanFormData({
                    userId: users.length > 0 ? (users[0].id || 3) : 3,
                    bookCopyId: copies.length > 0 ? copies[0].id : 1,
                    dueDate: new Date(Date.now() + circulationSettings.defaultLoanDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  })
                  setLoanModalOpen(true)
                }}
                className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
              >
                <IconPlus size={15} /> Issue New Loan
              </Button>
            </div>
          </div>

          {loanLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading circulation records...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Code</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Book & Barcode</TableHead>
                  <TableHead>Borrowed Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]">
                      {l.loanCode}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-[#1e2320] dark:text-[#f5f3e6]">
                        {l.userFullName || l.username || `User #${l.userId}`}
                      </div>
                      <div className="text-[11px] text-[#6f7f64] font-mono">@{l.username}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-[#1e2320] dark:text-[#f5f3e6]">
                        {l.bookTitle || `Book ID: ${l.bookCopyId}`}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        {l.barcode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#6f7f64]">{l.borrowDate}</TableCell>
                    <TableCell className="text-xs font-semibold">
                      <span className={l.status === 'OVERDUE' ? 'text-rose-700 dark:text-rose-400' : ''}>
                        {l.dueDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === 'RETURNED'
                            ? 'outline'
                            : l.status === 'OVERDUE'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status !== 'RETURNED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturnLoan(l.id)}
                              className="h-7 px-2 text-[11px] gap-1 text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40 border-[#c8d0b7]"
                            >
                              <IconArrowBackUp size={13} /> Return Book
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedLoanForRenew(l)
                                setRenewDays(circulationSettings.defaultRenewDays)
                                setRenewModalOpen(true)
                              }}
                              className="h-7 px-2 text-[11px] gap-1 text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40"
                            >
                              <IconClock size={13} /> Renew
                            </Button>
                          </>
                        )}
                        {l.status === 'RETURNED' && (
                          <span className="text-[11px] text-[#6f7f64]">Completed ({l.returnDate})</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ==========================================
            TAB 4: USERS
            ========================================== */}
        <TabsContent value="users" className="space-y-4">
          {!isAdmin && (
            <div className="p-3 rounded-xl bg-[#c8d0b7]/25 dark:bg-[#3d4b3e]/30 border border-[#c8d0b7] dark:border-[#3d4b3e] text-xs text-[#3d4b3e] dark:text-[#c8d0b7] flex items-center gap-2.5">
              <IconInfoCircle size={18} className="shrink-0 text-[#3d4b3e] dark:text-[#c8d0b7]" />
              <span>
                <strong>Librarian Mode:</strong> You have read-only directory access to patron records for loan verification. User registration, role assignments, and deletions require <strong>System Administrator</strong> privileges.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Input
                placeholder="Search user by name or email..."
                value={userKeyword}
                onChange={(e) => setUserKeyword(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={fetchUsers} className="h-9 px-3">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchUsers} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setUserFormData({
                      username: '',
                      email: '',
                      password: '',
                      fullName: '',
                      phone: '',
                      role: 'MEMBER',
                    })
                    setUserModalOpen(true)
                  }}
                  className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
                >
                  <IconPlus size={15} /> Add Member Account
                </Button>
              )}
            </div>
          </div>

          {userLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading reader accounts...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.username}>
                    <TableCell className="font-mono text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                      @{u.username}
                    </TableCell>
                    <TableCell className="text-xs font-serif font-bold">{u.fullName}</TableCell>
                    <TableCell className="text-xs text-[#6f7f64]">{u.email}</TableCell>
                    <TableCell className="text-xs text-[#6f7f64]">{u.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === 'ADMIN' ? 'destructive' : u.role === 'LIBRARIAN' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                        {u.status}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {u.id && u.id !== user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => u.id && handleDeleteUser(u.id)}
                            className="h-7 w-7 p-0 text-[#6f7f64] hover:text-rose-700"
                            title="Deactivate / Delete User Account"
                          >
                            <IconTrash size={15} />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </main>

      {/* ==========================================
          MODALS IN ENGLISH
          ========================================== */}

      {/* 1. Modal Add / Edit Book */}
      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent onClose={() => setBookModalOpen(false)} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingBook ? 'Edit Book Details' : 'Add New Title to Catalog'}</DialogTitle>
            <DialogDescription>
              Enter publication metadata adhering to library cataloging standards
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBook} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Title *</label>
                <Input
                  required
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Handle (Public Identifier) *</label>
                <Input
                  required
                  disabled={!!editingBook}
                  value={bookFormData.handle}
                  onChange={(e) => setBookFormData({ ...bookFormData, handle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">ISBN *</label>
                <Input
                  required
                  value={bookFormData.isbn}
                  onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Year</label>
                <Input
                  type="number"
                  value={bookFormData.publicationYear}
                  onChange={(e) => setBookFormData({ ...bookFormData, publicationYear: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Format</label>
                <select
                  value={bookFormData.format}
                  onChange={(e) => setBookFormData({ ...bookFormData, format: e.target.value as BookFormat })}
                  className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
                >
                  <option value="PAPERBACK">PAPERBACK</option>
                  <option value="HARDCOVER">HARDCOVER</option>
                  <option value="EBOOK">EBOOK</option>
                  <option value="AUDIOBOOK">AUDIOBOOK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Cover Image URL</label>
              <Input
                placeholder="https://..."
                value={bookFormData.cover}
                onChange={(e) => setBookFormData({ ...bookFormData, cover: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Book Synopsis</label>
              <textarea
                rows={3}
                value={bookFormData.description}
                onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                className="w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] p-2 text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6f7f64]"
              />
            </div>

            {editingBook && (
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Catalog Status</label>
                <select
                  value={bookFormData.status}
                  onChange={(e) => setBookFormData({ ...bookFormData, status: e.target.value as BookStatus })}
                  className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setBookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBook ? 'Save Changes' : 'Create Book'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Add Copy */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Register Physical Copy (Barcode)</DialogTitle>
            <DialogDescription>
              Assign a unique barcode to a catalog title
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCopy} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Barcode Number *</label>
              <Input
                required
                value={copyFormData.barcode}
                onChange={(e) => setCopyFormData({ ...copyFormData, barcode: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Catalog Title *</label>
              <select
                value={copyFormData.bookId}
                onChange={(e) => setCopyFormData({ ...copyFormData, bookId: Number(e.target.value) })}
                className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.handle}] {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setCopyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Register Copy</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Issue Loan */}
      <Dialog open={loanModalOpen} onOpenChange={setLoanModalOpen}>
        <DialogContent onClose={() => setLoanModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Issue Book Loan Ticket</DialogTitle>
            <DialogDescription>
              Assign a physical copy to a reader with a return deadline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLoan} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Borrower Patron *</label>
              {users.length > 0 ? (
                <select
                  required
                  value={loanFormData.userId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, userId: Number(e.target.value) })}
                  className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-white dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]"
                >
                  <option value="">-- Select Member Account --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) — #{u.id} [{u.role}]
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="number"
                  required
                  placeholder="e.g. 3 (Member Bin)"
                  value={loanFormData.userId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, userId: Number(e.target.value) })}
                />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Book Copy (Physical Item) *</label>
              {copies.length > 0 ? (
                <select
                  required
                  value={loanFormData.bookCopyId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, bookCopyId: Number(e.target.value) })}
                  className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-white dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]"
                >
                  <option value="">-- Select Physical Copy --</option>
                  {copies.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} — Barcode: {c.barcode} ({c.bookTitle || `Book ID ${c.bookId}`}) [{c.status}]
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={loanFormData.bookCopyId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, bookCopyId: Number(e.target.value) })}
                />
              )}
              <span className="text-[11px] text-[#6f7f64] block mt-1">
                Tip: Only copies with AVAILABLE status should be checked out to patrons
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Due Date *</label>
              <Input
                type="date"
                required
                value={loanFormData.dueDate}
                onChange={(e) => setLoanFormData({ ...loanFormData, dueDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setLoanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Issue Loan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Modal Renew Loan */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent onClose={() => setRenewModalOpen(false)} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Extend Loan Period</DialogTitle>
            <DialogDescription>
              Grant additional borrowing days for loan {selectedLoanForRenew?.loanCode}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenewLoan} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Days to Extend</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={renewDays}
                onChange={(e) => setRenewDays(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setRenewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Renewal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Modal Create User */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent onClose={() => setUserModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Create Reader / Staff Account</DialogTitle>
            <DialogDescription>
              Register a new user account with assigned library permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Username *</label>
                <Input
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Full Name *</label>
                <Input
                  required
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Email Address *</label>
              <Input
                type="email"
                required
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Initial Password</label>
                <Input
                  type="password"
                  placeholder="Default: libro123"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Phone Number</label>
                <Input
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Role *</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
              >
                <option value="MEMBER">MEMBER (Library Reader)</option>
                <option value="LIBRARIAN">LIBRARIAN (Circulation Staff)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Modal Settings */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent onClose={() => setSettingsModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-base flex items-center gap-2">
              <IconSettings size={18} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
              Circulation & System Settings
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure library circulation rules and manage staff session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Section 1: Staff Account */}
            <div className="p-3 rounded-xl border border-[#c8d0b7]/60 dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] space-y-2">
              <div className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] flex items-center justify-between">
                <span>Staff Account</span>
                <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[10px]">
                  {isAdmin ? 'ADMIN' : isLibrarian ? 'LIBRARIAN' : user.role}
                </Badge>
              </div>
              <div className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]/80">
                <div className="font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                  {user.fullName || user.username}
                </div>
                <div className="font-mono text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]/60">
                  {user.email}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-[#c8d0b7]/40 dark:border-[#3d4b3e]/40">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSettingsModalOpen(false)
                    navigate('/')
                  }}
                  className="h-7 text-xs gap-1.5 cursor-pointer"
                >
                  <IconExternalLink size={13} /> Public Catalog
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSettingsModalOpen(false)
                    logout()
                    navigate('/')
                  }}
                  className="h-7 text-xs gap-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <IconLogout size={13} /> Sign Out
                </Button>
              </div>
            </div>

            {/* Section 2: Circulation Rules */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                Circulation Lending Policies
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]">Default Loan (Days)</label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={circulationSettings.defaultLoanDays}
                    onChange={(e) =>
                      setCirculationSettings({
                        ...circulationSettings,
                        defaultLoanDays: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]">Renewal Extension (Days)</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={circulationSettings.defaultRenewDays}
                    onChange={(e) =>
                      setCirculationSettings({
                        ...circulationSettings,
                        defaultRenewDays: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]">Max Renewals Allowed</label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={circulationSettings.maxRenewalsAllowed}
                    onChange={(e) =>
                      setCirculationSettings({
                        ...circulationSettings,
                        maxRenewalsAllowed: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]">Overdue Fine/Day (VND)</label>
                  <Input
                    type="number"
                    step={1000}
                    value={circulationSettings.finePerDayOverdue}
                    onChange={(e) =>
                      setCirculationSettings({
                        ...circulationSettings,
                        finePerDayOverdue: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: System Status */}
            <div className="p-2.5 rounded-lg border border-[#c8d0b7]/40 dark:border-[#3d4b3e]/60 text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]/70 flex items-center justify-between">
              <div>
                <span className="font-medium text-[#1e2320] dark:text-[#f5f3e6]">Libro Core:</span> v2.0-Spring
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Backend Connected</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setSettingsModalOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  showFeedback('success', 'Circulation policy preferences saved!')
                  setSettingsModalOpen(false)
                }}
                className="bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
