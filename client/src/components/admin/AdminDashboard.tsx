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
  IconSun,
  IconMoon,
} from '@tabler/icons-react'

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user, login, logout, isAdmin, isLibrarian, canAccessAdmin, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'books' | 'copies' | 'loans' | 'users'>('books')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Theme mode: 'dark' (SaaS Midnight reference) or 'light' (chữ đen nền trắng)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('libro_admin_theme') as 'dark' | 'light') || 'dark'
  })

  const toggleThemeMode = (mode: 'dark' | 'light') => {
    setThemeMode(mode)
    localStorage.setItem('libro_admin_theme', mode)
  }

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

  // 1. BOOKS STATE
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

  // 2. COPIES STATE
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [copyKeyword, setCopyKeyword] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyFormData, setCopyFormData] = useState({
    barcode: '',
    bookId: 0,
  })

  // 3. LOANS STATE
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

  // 4. USERS STATE
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

  // FETCHERS
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

  // SIDEBAR SEARCH HELPERS
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

  useEffect(() => {
    if (canAccessAdmin) {
      fetchBooks()
      fetchCopies()
      fetchLoans()
      fetchUsers()
    }
  }, [canAccessAdmin, fetchBooks, fetchCopies, fetchLoans, fetchUsers])

  useEffect(() => {
    if (!canAccessAdmin) return
    if (activeTab === 'books') fetchBooks()
    else if (activeTab === 'copies') fetchCopies()
    else if (activeTab === 'loans') fetchLoans()
    else if (activeTab === 'users') fetchUsers()
  }, [activeTab, canAccessAdmin, fetchBooks, fetchCopies, fetchLoans, fetchUsers])

  // HANDLERS: BOOKS
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

  // HANDLERS: COPIES
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

  // HANDLERS: LOANS
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

  // HANDLERS: USERS
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
        navigate('/')
      }
    } catch (err: any) {
      setGateError(err.message || 'Invalid staff credentials or insufficient clearance.')
    } finally {
      setGateLoading(false)
    }
  }

  const isDark = themeMode === 'dark'

  // Dynamic Theme Classes
  const t = {
    // Layout
    pageBg: isDark ? 'bg-[#16181d] text-[#cbd2de]' : 'bg-[#f8fafc] text-gray-800',
    sidebarBg: isDark ? 'bg-[#121316] border-[#22262e]' : 'bg-white border-gray-200',
    headerBorder: isDark ? 'border-[#262a34]' : 'border-gray-200',
    cardBg: isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border-gray-200 shadow-xs',
    cardHover: isDark ? 'hover:border-[#3d4554]' : 'hover:border-gray-300',
    
    // Typography
    titleColor: isDark ? 'text-white' : 'text-gray-900',
    subTextColor: isDark ? 'text-[#8c94a5]' : 'text-gray-500',
    mutedColor: isDark ? 'text-[#5d6575]' : 'text-gray-400',
    
    // Inputs & Filters
    inputBg: isDark 
      ? 'bg-[#16181d] border-[#2c323e] text-[#f3f4f6] placeholder:text-[#5d6575] focus:border-blue-500' 
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-900',
    
    // Buttons
    primaryBtn: isDark
      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
      : 'bg-gray-900 hover:bg-black text-white shadow-xs',
    secondaryBtn: isDark
      ? 'bg-[#16181d] border border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#3e4757]'
      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
    
    // Table
    tableWrapper: isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border-gray-200 shadow-xs',
    tableHead: isDark ? 'bg-[#191c22] border-[#2c323e] text-[#8c94a5]' : 'bg-gray-50 border-gray-200 text-gray-500',
    tableRow: isDark ? 'border-[#2c323e]/50 hover:bg-[#252a34]' : 'border-gray-100 hover:bg-gray-50/80',
    tableCell: isDark ? 'text-[#cbd2de]' : 'text-gray-700',
    
    // Badges & Actions
    statusActive: isDark
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    statusBorrowed: isDark
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
    statusOverdue: isDark
      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      : 'bg-rose-50 text-rose-700 border border-rose-200',
    statusMuted: isDark
      ? 'bg-[#16181d] text-[#7d8697] border border-[#2c323e]'
      : 'bg-gray-100 text-gray-500 border border-gray-200',

    // Modals
    modalBg: isDark ? 'bg-[#1f232b] border-[#2c323e] text-[#cbd2de]' : 'bg-white border-gray-200 text-gray-900',
  }

  // ==========================================
  // ACCESS CONTROL GATES
  // ==========================================
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
            <div className={`inline-flex p-3 rounded-full border mb-1 ${isDark ? 'bg-[#16181d] border-[#2c323e] text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
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
            <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}></div></div>
            <span className={`relative px-2 text-[10px] uppercase font-semibold ${isDark ? 'bg-[#1f232b] text-[#5d6575]' : 'bg-white text-gray-400'}`}>
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
              You are signed in as <strong className={t.titleColor}>{user.fullName || user.username}</strong> (<code className="text-xs font-mono">{user.email}</code>) with role <span className="ml-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">{user.role}</span>.
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

  // ==========================================
  // MAIN DASHBOARD (Refined Soft Dark / Clean Light)
  // ==========================================
  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-150 ${t.pageBg}`}>
      {/* 1. Mobile Top Navigation Bar */}
      <div className={`md:hidden flex items-center justify-between p-3.5 border-b sticky top-0 z-40 ${t.sidebarBg} ${t.headerBorder}`}>
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Libro" className="w-7 h-7 rounded-lg object-contain" />
          <span className={`font-sans font-bold text-base ${t.titleColor}`}>Libro Desk</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleThemeMode(isDark ? 'light' : 'dark')}
            className={`p-1.5 rounded-lg border ${t.secondaryBtn}`}
            title={isDark ? 'Chuyển sang nền trắng chữ đen' : 'Chuyển sang nền tối SaaS'}
          >
            {isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className={`p-1.5 ${t.subTextColor} hover:${t.titleColor} transition-colors cursor-pointer`}
          >
            {mobileSidebarOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 2. Left Sidebar (Sleek SaaS Style matching reference) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 md:w-[240px] border-r flex flex-col justify-between p-3.5 transition-transform duration-200 ${t.sidebarBg} ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Brand Header & Navigation Items */}
        <div className="space-y-4">
          <div className="hidden md:flex items-center justify-between px-2 pt-1 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                L
              </div>
              <div>
                <div className={`font-sans font-bold text-sm tracking-tight ${t.titleColor}`}>Libro Admin</div>
                <div className={`text-[10px] ${t.subTextColor}`}>Library Management</div>
              </div>
            </div>
          </div>

          {/* In-sidebar Search Header */}
          <div>
            <div className="relative">
              <IconSearch
                size={14}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor} pointer-events-none`}
              />
              <input
                type="text"
                value={currentSearchKeyword}
                onChange={(e) => handleSidebarSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSidebarSearchSubmit()
                }}
                placeholder={getSearchPlaceholder()}
                className={`w-full h-8 pl-8 pr-7 text-xs rounded-xl border outline-none transition ${t.inputBg}`}
              />
              {currentSearchKeyword && (
                <button
                  type="button"
                  onClick={handleClearSidebarSearch}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer ${t.mutedColor} hover:${t.titleColor}`}
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'books'
                  ? isDark
                    ? 'bg-[#28303d] text-white shadow-xs font-semibold'
                    : 'bg-gray-900 text-white shadow-xs font-semibold'
                  : isDark
                    ? 'text-[#828c9f] hover:text-white hover:bg-[#1a1d24]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconBook size={16} />
                <span>Titles & Catalog</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'books'
                  ? isDark ? 'bg-[#1c222b] text-blue-300' : 'bg-gray-800 text-gray-200'
                  : isDark ? 'bg-[#16181d] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'copies'
                  ? isDark
                    ? 'bg-[#28303d] text-white shadow-xs font-semibold'
                    : 'bg-gray-900 text-white shadow-xs font-semibold'
                  : isDark
                    ? 'text-[#828c9f] hover:text-white hover:bg-[#1a1d24]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconBarcode size={16} />
                <span>Physical Copies</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'copies'
                  ? isDark ? 'bg-[#1c222b] text-blue-300' : 'bg-gray-800 text-gray-200'
                  : isDark ? 'bg-[#16181d] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'loans'
                  ? isDark
                    ? 'bg-[#28303d] text-white shadow-xs font-semibold'
                    : 'bg-gray-900 text-white shadow-xs font-semibold'
                  : isDark
                    ? 'text-[#828c9f] hover:text-white hover:bg-[#1a1d24]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconClock size={16} />
                <span>Circulation Loans</span>
              </div>
              <div className="flex items-center gap-1.5">
                {loans.filter(l => l.status === 'OVERDUE').length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Overdue loans" />
                )}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'loans'
                    ? isDark ? 'bg-[#1c222b] text-blue-300' : 'bg-gray-800 text-gray-200'
                    : isDark ? 'bg-[#16181d] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'users'
                  ? isDark
                    ? 'bg-[#28303d] text-white shadow-xs font-semibold'
                    : 'bg-gray-900 text-white shadow-xs font-semibold'
                  : isDark
                    ? 'text-[#828c9f] hover:text-white hover:bg-[#1a1d24]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconUsers size={16} />
                <span>Readers & Staff</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'users'
                  ? isDark ? 'bg-[#1c222b] text-blue-300' : 'bg-gray-800 text-gray-200'
                  : isDark ? 'bg-[#16181d] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'
              }`}>
                {users.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Settings & Theme Switcher */}
        <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
          {/* Quick Theme Toggle in Sidebar */}
          <button
            type="button"
            onClick={() => toggleThemeMode(isDark ? 'light' : 'dark')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'text-[#828c9f] hover:text-white hover:bg-[#1a1d24]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isDark ? <IconSun size={16} className="text-amber-400" /> : <IconMoon size={16} className="text-blue-600" />}
              <span>{isDark ? 'Nền trắng chữ đen' : 'Giao diện tối SaaS'}</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-[#181a20] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'}`}>
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
              isDark ? 'text-[#828c9f] hover:text-white hover:bg-[#1a1d24]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <IconSettings size={16} className="group-hover:rotate-45 transition-transform duration-200" />
              <span>Settings</span>
            </div>
            <span className={`text-[10px] font-mono ${t.mutedColor}`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        {/* Top Header Row in Workspace (Clean SaaS Header matching Reference) */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${t.headerBorder}`}>
          <div>
            <h1 className={`font-sans text-2xl font-bold tracking-tight ${t.titleColor}`}>
              {activeTab === 'books' && 'Catalog Titles & Bibliography'}
              {activeTab === 'copies' && 'Physical Copies & Barcode Inventory'}
              {activeTab === 'loans' && 'Circulation Desk & Active Loans'}
              {activeTab === 'users' && 'Patrons & Staff Directory'}
            </h1>
            <p className={`text-xs mt-1 ${t.subTextColor}`}>
              {activeTab === 'books' && 'Manage library metadata, publication years, ISBN identifiers, and catalog status.'}
              {activeTab === 'copies' && 'Track individual physical items, barcode tags, condition, and shelf availability.'}
              {activeTab === 'loans' && 'Issue loan tickets, process book returns, and grant renewal extensions.'}
              {activeTab === 'users' && 'Directory of registered readers, circulation librarians, and administrator accounts.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Theme Toggle Button */}
            <button
              onClick={() => toggleThemeMode(isDark ? 'light' : 'dark')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${t.secondaryBtn}`}
              title={isDark ? 'Chuyển sang nền trắng chữ đen (Light Mode)' : 'Chuyển sang nền tối chuẩn SaaS (Dark Mode)'}
            >
              {isDark ? (
                <>
                  <IconSun size={15} className="text-amber-400" />
                  <span>Nền trắng chữ đen</span>
                </>
              ) : (
                <>
                  <IconMoon size={15} className="text-blue-600" />
                  <span>Giao diện tối SaaS</span>
                </>
              )}
            </button>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Desk Online
            </span>
          </div>
        </div>

        {/* Dynamic KPI Overview Cards (Matching reference card styling with subtle SVG graphs) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Titles */}
          <div
            onClick={() => setActiveTab('books')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${t.cardBg} ${t.cardHover} ${
              activeTab === 'books' ? (isDark ? 'ring-2 ring-blue-500/50 bg-[#232934]' : 'ring-2 ring-blue-500/40 bg-blue-50/40 border-blue-200') : ''
            }`}
          >
            <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
              <span className="text-xs font-medium">Titles & Catalog</span>
              <IconBooks size={17} className={t.mutedColor} />
            </div>
            <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
              {books.length}
            </div>
            <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
              {books.filter((b) => b.status === 'ACTIVE').length} active in public
            </p>
            {/* Subtle mini wave SVG (reference style) */}
            <div className="mt-2 h-5 w-full opacity-40">
              <svg viewBox="0 0 100 25" fill="none" className="w-full h-full stroke-current text-blue-400">
                <path d="M0 20 Q 25 5, 50 15 T 100 8" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Copies */}
          <div
            onClick={() => setActiveTab('copies')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${t.cardBg} ${t.cardHover} ${
              activeTab === 'copies' ? (isDark ? 'ring-2 ring-blue-500/50 bg-[#232934]' : 'ring-2 ring-blue-500/40 bg-blue-50/40 border-blue-200') : ''
            }`}
          >
            <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
              <span className="text-xs font-medium">Physical Copies</span>
              <IconBarcode size={17} className={t.mutedColor} />
            </div>
            <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
              {copies.length}
            </div>
            <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
              {copies.filter((c) => c.status === 'AVAILABLE').length} shelf · {copies.filter((c) => c.status === 'BORROWED').length} out
            </p>
            {/* Subtle mini bars SVG (reference style) */}
            <div className="mt-2 h-5 w-full flex items-end gap-1.5 opacity-40">
              <div className="w-1.5 h-2 bg-emerald-400 rounded-xs" />
              <div className="w-1.5 h-4 bg-emerald-400 rounded-xs" />
              <div className="w-1.5 h-3 bg-emerald-400 rounded-xs" />
              <div className="w-1.5 h-5 bg-emerald-400 rounded-xs" />
              <div className="w-1.5 h-3.5 bg-emerald-400 rounded-xs" />
            </div>
          </div>

          {/* Card 3: Active Loans */}
          <div
            onClick={() => {
              setActiveTab('loans')
              setLoanStatus('BORROWED')
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${t.cardBg} ${t.cardHover} ${
              activeTab === 'loans' ? (isDark ? 'ring-2 ring-blue-500/50 bg-[#232934]' : 'ring-2 ring-blue-500/40 bg-blue-50/40 border-blue-200') : ''
            }`}
          >
            <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
              <span className="text-xs font-medium">Active Loans</span>
              <IconClock size={17} className={t.mutedColor} />
            </div>
            <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
              {loans.filter((l) => l.status === 'BORROWED').length}
            </div>
            <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
              Circulating with patrons
            </p>
            {/* Subtle blue curve SVG */}
            <div className="mt-2 h-5 w-full opacity-50">
              <svg viewBox="0 0 100 25" fill="none" className="w-full h-full stroke-current text-blue-500">
                <path d="M0 18 Q 30 22, 60 8 T 100 5" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Overdue */}
          <div
            onClick={() => {
              setActiveTab('loans')
              setLoanStatus('OVERDUE')
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${t.cardBg} ${t.cardHover} ${
              loans.filter((l) => l.status === 'OVERDUE').length > 0
                ? (isDark ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/30' : 'border-rose-300 bg-rose-50/50')
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-medium ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-400 font-semibold' : t.subTextColor}`}>
                Overdue Returns
              </span>
              <IconAlertTriangle size={17} className={loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-400' : t.mutedColor} />
            </div>
            <div className={`text-3xl font-sans font-bold tracking-tight ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-400' : t.titleColor}`}>
              {loans.filter((l) => l.status === 'OVERDUE').length}
            </div>
            <p className={`text-[11px] mt-1 truncate ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'text-rose-400 font-medium' : t.subTextColor}`}>
              {loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'Needs staff follow-up' : 'All loans on schedule'}
            </p>
            {/* Subtle indicator */}
            <div className="mt-2 h-5 w-full opacity-40 flex items-center">
              <div className={`h-1 w-full rounded-full ${loans.filter((l) => l.status === 'OVERDUE').length > 0 ? 'bg-rose-500' : 'bg-gray-500'}`} />
            </div>
          </div>

          {/* Card 5: Users */}
          <div
            onClick={() => setActiveTab('users')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${t.cardBg} ${t.cardHover} ${
              activeTab === 'users' ? (isDark ? 'ring-2 ring-blue-500/50 bg-[#232934]' : 'ring-2 ring-blue-500/40 bg-blue-50/40 border-blue-200') : ''
            }`}
          >
            <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
              <span className="text-xs font-medium">Patrons & Staff</span>
              <IconUsers size={17} className={t.mutedColor} />
            </div>
            <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
              {users.length}
            </div>
            <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
              {users.filter((u) => u.role === 'MEMBER').length} readers · {users.filter((u) => u.role !== 'MEMBER').length} staff
            </p>
            {/* Subtle mini wave */}
            <div className="mt-2 h-5 w-full opacity-40">
              <svg viewBox="0 0 100 25" fill="none" className="w-full h-full stroke-current text-purple-400">
                <path d="M0 15 Q 35 25, 70 8 T 100 12" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* Main Tabs Content */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>

          {/* TAB 1: BOOKS */}
          <TabsContent value="books" className="space-y-4 outline-none">
            {/* Toolbar */}
            <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center gap-2 w-full sm:w-80">
                <div className="relative w-full">
                  <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                  <input
                    placeholder="Search title, handle, or ISBN..."
                    value={bookKeyword}
                    onChange={(e) => setBookKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
                    className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
                  />
                </div>
                <button
                  onClick={fetchBooks}
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0 ${t.secondaryBtn}`}
                >
                  Search
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={fetchBooks}
                  className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <IconRefresh size={14} /> Refresh
                </button>
                <button
                  onClick={handleOpenCreateBook}
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
                >
                  <IconPlus size={15} /> Add New Title
                </button>
              </div>
            </div>

            {/* Pristine Clean Table (No leaky styles) */}
            {bookLoading ? (
              <div className={`p-10 text-center text-xs rounded-2xl border ${t.cardBg} ${t.subTextColor}`}>
                Loading catalog titles...
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${t.tableHead}`}>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Handle</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book Title</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">ISBN</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Year</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Format</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Copies (Avail/Total)</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                      {books.map((b) => (
                        <tr key={b.id} className={`border-b transition-colors ${t.tableRow}`}>
                          <td className="py-3 px-4 font-mono text-xs font-medium">
                            {b.handle}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              onClick={() => navigate(`/books/${b.slug || b.id}`)}
                              className={`font-sans font-medium text-xs block cursor-pointer hover:underline ${t.titleColor}`}
                            >
                              {b.title}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-mono text-xs ${t.subTextColor}`}>{b.isbn}</td>
                          <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{b.publicationYear}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${t.statusMuted}`}>
                              {b.format}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>
                            <span className={`font-semibold ${t.titleColor}`}>{b.availableCopies}</span> / {b.totalCopies}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              b.status === 'ACTIVE' ? t.statusActive : t.statusMuted
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditBook(b)}
                                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                  isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#252a34]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                title="Edit"
                              >
                                <IconPencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(b.id)}
                                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                  isDark ? 'text-[#8c94a5] hover:text-rose-400 hover:bg-[#252a34]' : 'text-gray-500 hover:text-rose-600 hover:bg-gray-100'
                                }`}
                                title="Archive"
                              >
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: COPIES */}
          <TabsContent value="copies" className="space-y-4 outline-none">
            {/* Toolbar */}
            <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center gap-2 w-full sm:w-80">
                <div className="relative w-full">
                  <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                  <input
                    placeholder="Search barcode number..."
                    value={copyKeyword}
                    onChange={(e) => setCopyKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchCopies()}
                    className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
                  />
                </div>
                <button
                  onClick={fetchCopies}
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0 ${t.secondaryBtn}`}
                >
                  Search
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={fetchCopies}
                  className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <IconRefresh size={14} /> Refresh
                </button>
                <button
                  onClick={() => {
                    setCopyFormData({
                      barcode: `BC-${Math.floor(100000 + Math.random() * 900000)}`,
                      bookId: books.length > 0 ? books[0].id : 1,
                    })
                    setCopyModalOpen(true)
                  }}
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
                >
                  <IconPlus size={15} /> Add Copy (Barcode)
                </button>
              </div>
            </div>

            {copyLoading ? (
              <div className={`p-10 text-center text-xs rounded-2xl border ${t.cardBg} ${t.subTextColor}`}>
                Loading physical copies...
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${t.tableHead}`}>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Barcode</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Catalog Title</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book ID</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Condition Status</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Change Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                      {copies.map((c) => (
                        <tr key={c.id} className={`border-b transition-colors ${t.tableRow}`}>
                          <td className="py-3 px-4 font-mono text-xs font-semibold">
                            <span className="flex items-center gap-1.5">
                              <IconBarcode size={16} className={t.mutedColor} />
                              {c.barcode}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>
                            {c.bookTitle || `Book ID #${c.bookId}`}
                          </td>
                          <td className={`py-3 px-4 text-xs font-mono ${t.subTextColor}`}>{c.bookId}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              c.status === 'AVAILABLE'
                                ? t.statusActive
                                : c.status === 'BORROWED'
                                ? t.statusBorrowed
                                : t.statusMuted
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select
                              value={c.status}
                              onChange={(e) => handleUpdateCopyStatus(c.id, e.target.value as BookCopyStatus)}
                              className={`h-7 px-2 text-[11px] rounded-lg border outline-none cursor-pointer ${t.inputBg}`}
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="BORROWED">BORROWED</option>
                              <option value="MAINTENANCE">MAINTENANCE</option>
                              <option value="LOST">LOST</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: CIRCULATION LOANS */}
          <TabsContent value="loans" className="space-y-4 outline-none">
            {/* Toolbar */}
            <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                  <input
                    placeholder="Search loan code or reader..."
                    value={loanKeyword}
                    onChange={(e) => setLoanKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchLoans()}
                    className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
                  />
                </div>
                <select
                  value={loanStatus}
                  onChange={(e) => setLoanStatus(e.target.value as LoanStatus)}
                  className={`h-9 px-3 text-xs rounded-xl border outline-none cursor-pointer ${t.inputBg}`}
                >
                  <option value="">All Statuses</option>
                  <option value="BORROWED">Borrowed</option>
                  <option value="RETURNED">Returned</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
                <button
                  onClick={fetchLoans}
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0 ${t.secondaryBtn}`}
                >
                  Filter
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={fetchLoans}
                  className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <IconRefresh size={14} /> Refresh
                </button>
                <button
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
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
                >
                  <IconPlus size={15} /> Issue New Loan
                </button>
              </div>
            </div>

            {loanLoading ? (
              <div className={`p-10 text-center text-xs rounded-2xl border ${t.cardBg} ${t.subTextColor}`}>
                Loading circulation records...
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${t.tableHead}`}>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Loan Code</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrower</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book & Barcode</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrowed Date</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Due Date</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                      {loans.map((l) => (
                        <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                          <td className="py-3 px-4 font-mono text-xs font-semibold">
                            {l.loanCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className={`font-medium text-xs ${t.titleColor}`}>
                              {l.userFullName || l.userEmail || `User #${l.userId}`}
                            </div>
                            {l.userEmail && <div className={`text-[11px] font-mono ${t.mutedColor}`}>{l.userEmail}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <div className={`font-medium text-xs ${t.titleColor}`}>
                              {l.bookTitle || `Book ID: ${l.bookCopyId}`}
                            </div>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 inline-block ${t.statusMuted}`}>
                              {l.barcode}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{l.borrowDate}</td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span className={l.status === 'OVERDUE' ? 'text-rose-400 font-bold' : t.titleColor}>
                              {l.dueDate}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              l.status === 'RETURNED'
                                ? t.statusMuted
                                : l.status === 'OVERDUE'
                                ? t.statusOverdue
                                : t.statusBorrowed
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {l.status !== 'RETURNED' && (
                                <>
                                  <button
                                    onClick={() => handleReturnLoan(l.id)}
                                    className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${t.secondaryBtn}`}
                                  >
                                    <IconArrowBackUp size={13} /> Return
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedLoanForRenew(l)
                                      setRenewDays(circulationSettings.defaultRenewDays)
                                      setRenewModalOpen(true)
                                    }}
                                    className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                                      isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#252a34]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                  >
                                    <IconClock size={13} /> Renew
                                  </button>
                                </>
                              )}
                              {l.status === 'RETURNED' && (
                                <span className={`text-[11px] ${t.mutedColor}`}>Completed ({l.returnDate})</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: USERS */}
          <TabsContent value="users" className="space-y-4 outline-none">
            {!isAdmin && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                isDark ? 'bg-[#1f232b] border-[#2c323e] text-[#8c94a5]' : 'bg-blue-50/50 border-blue-200 text-blue-800'
              }`}>
                <IconInfoCircle size={18} className="shrink-0 text-blue-400" />
                <span>
                  <strong>Librarian Mode:</strong> You have read-only directory access to patron records for loan verification. User registration, role assignments, and deletions require <strong>System Administrator</strong> privileges.
                </span>
              </div>
            )}

            {/* Toolbar */}
            <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center gap-2 w-full sm:w-80">
                <div className="relative w-full">
                  <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                  <input
                    placeholder="Search user by name or email..."
                    value={userKeyword}
                    onChange={(e) => setUserKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0 ${t.secondaryBtn}`}
                >
                  Search
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={fetchUsers}
                  className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <IconRefresh size={14} /> Refresh
                </button>
                {isAdmin && (
                  <button
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
                    className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
                  >
                    <IconPlus size={15} /> Add Member Account
                  </button>
                )}
              </div>
            </div>

            {userLoading ? (
              <div className={`p-10 text-center text-xs rounded-2xl border ${t.cardBg} ${t.subTextColor}`}>
                Loading reader accounts...
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${t.tableHead}`}>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Username</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Full Name</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Email</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Phone</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Role</th>
                        <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                        {isAdmin && <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                      {users.map((u) => (
                        <tr key={u.username} className={`border-b transition-colors ${t.tableRow}`}>
                          <td className="py-3 px-4 font-mono text-xs font-semibold">
                            @{u.username}
                          </td>
                          <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{u.fullName}</td>
                          <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{u.email}</td>
                          <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{u.phone || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : u.role === 'LIBRARIAN'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : t.statusMuted
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              u.status === 'ACTIVE' ? t.statusActive : t.statusMuted
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right">
                              {u.id && u.id !== user?.id && (
                                <button
                                  onClick={() => u.id && handleDeleteUser(u.id)}
                                  className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                    isDark ? 'text-[#8c94a5] hover:text-rose-400 hover:bg-[#252a34]' : 'text-gray-500 hover:text-rose-600 hover:bg-gray-100'
                                  }`}
                                  title="Deactivate / Delete User Account"
                                >
                                  <IconTrash size={15} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* 1. Modal Add / Edit Book */}
      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent onClose={() => setBookModalOpen(false)} className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              {editingBook ? 'Edit Book Details' : 'Add New Title to Catalog'}
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Enter publication metadata adhering to library cataloging standards
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBook} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Title *</label>
                <input
                  required
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Handle (Public Identifier) *</label>
                <input
                  required
                  disabled={!!editingBook}
                  value={bookFormData.handle}
                  onChange={(e) => setBookFormData({ ...bookFormData, handle: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition disabled:opacity-50 ${t.inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>ISBN *</label>
                <input
                  required
                  value={bookFormData.isbn}
                  onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Year</label>
                <input
                  type="number"
                  value={bookFormData.publicationYear}
                  onChange={(e) => setBookFormData({ ...bookFormData, publicationYear: Number(e.target.value) })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Format</label>
                <select
                  value={bookFormData.format}
                  onChange={(e) => setBookFormData({ ...bookFormData, format: e.target.value as BookFormat })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                >
                  <option value="PAPERBACK">PAPERBACK</option>
                  <option value="HARDCOVER">HARDCOVER</option>
                  <option value="EBOOK">EBOOK</option>
                  <option value="AUDIOBOOK">AUDIOBOOK</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Cover Image URL</label>
              <input
                placeholder="https://..."
                value={bookFormData.cover}
                onChange={(e) => setBookFormData({ ...bookFormData, cover: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Book Synopsis</label>
              <textarea
                rows={3}
                value={bookFormData.description}
                onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                className={`w-full mt-1 p-2.5 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            {editingBook && (
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Catalog Status</label>
                <select
                  value={bookFormData.status}
                  onChange={(e) => setBookFormData({ ...bookFormData, status: e.target.value as BookStatus })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </div>
            )}

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setBookModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                {editingBook ? 'Save Changes' : 'Create Book'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Add Copy */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className={`sm:max-w-md rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Register Physical Copy (Barcode)
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Assign a unique barcode to a catalog title
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCopy} className="space-y-3.5 pt-2">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Barcode Number *</label>
              <input
                required
                value={copyFormData.barcode}
                onChange={(e) => setCopyFormData({ ...copyFormData, barcode: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Catalog Title *</label>
              <select
                value={copyFormData.bookId}
                onChange={(e) => setCopyFormData({ ...copyFormData, bookId: Number(e.target.value) })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.handle}] {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Register Copy
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Issue Loan */}
      <Dialog open={loanModalOpen} onOpenChange={setLoanModalOpen}>
        <DialogContent onClose={() => setLoanModalOpen(false)} className={`sm:max-w-md rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Issue Book Loan Ticket
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Assign a physical copy to a reader with a return deadline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLoan} className="space-y-3.5 pt-2">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Borrower Patron *</label>
              {users.length > 0 ? (
                <select
                  required
                  value={loanFormData.userId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, userId: Number(e.target.value) })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                >
                  <option value="">-- Select Member Account --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) — #{u.id} [{u.role}]
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  required
                  placeholder="e.g. 3 (Member Bin)"
                  value={loanFormData.userId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, userId: Number(e.target.value) })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              )}
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Book Copy (Physical Item) *</label>
              {copies.length > 0 ? (
                <select
                  required
                  value={loanFormData.bookCopyId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, bookCopyId: Number(e.target.value) })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                >
                  <option value="">-- Select Physical Copy --</option>
                  {copies.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} — Barcode: {c.barcode} ({c.bookTitle || `Book ID ${c.bookId}`}) [{c.status}]
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={loanFormData.bookCopyId || ''}
                  onChange={(e) => setLoanFormData({ ...loanFormData, bookCopyId: Number(e.target.value) })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              )}
              <span className={`text-[11px] block mt-1 ${t.mutedColor}`}>
                Tip: Only copies with AVAILABLE status should be checked out to patrons
              </span>
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Due Date *</label>
              <input
                type="date"
                required
                value={loanFormData.dueDate}
                onChange={(e) => setLoanFormData({ ...loanFormData, dueDate: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setLoanModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Issue Loan
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Modal Renew Loan */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent onClose={() => setRenewModalOpen(false)} className={`sm:max-w-sm rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Extend Loan Period
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Grant additional borrowing days for loan {selectedLoanForRenew?.loanCode}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenewLoan} className="space-y-3.5 pt-2">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Days to Extend</label>
              <input
                type="number"
                min={1}
                max={30}
                value={renewDays}
                onChange={(e) => setRenewDays(Number(e.target.value))}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setRenewModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Confirm Renewal
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Modal Create User */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent onClose={() => setUserModalOpen(false)} className={`sm:max-w-md rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Create Reader / Staff Account
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Register a new user account with assigned library permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Username *</label>
                <input
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Full Name *</label>
                <input
                  required
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Email Address *</label>
              <input
                type="email"
                required
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Initial Password</label>
                <input
                  type="password"
                  placeholder="Default: libro123"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Phone Number</label>
                <input
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Role *</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              >
                <option value="MEMBER">MEMBER (Library Reader)</option>
                <option value="LIBRARIAN">LIBRARIAN (Circulation Staff)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Create Account
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Modal Settings */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent onClose={() => setSettingsModalOpen(false)} className={`sm:max-w-md rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-base flex items-center gap-2 ${t.titleColor}`}>
              <IconSettings size={18} className={t.mutedColor} />
              Circulation & System Settings
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Configure library circulation rules and manage staff session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Section 0: Theme Mode Selection */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
              <div>
                <div className={`text-xs font-semibold ${t.titleColor}`}>Giao diện quản trị</div>
                <div className={`text-[11px] ${t.subTextColor}`}>Tùy chọn nền tối SaaS hoặc nền trắng chữ đen</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleThemeMode('light')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                    !isDark ? 'bg-white text-gray-900 border-gray-300 shadow-xs font-semibold' : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  Sáng
                </button>
                <button
                  type="button"
                  onClick={() => toggleThemeMode('dark')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                    isDark ? 'bg-[#28303d] text-white border-blue-500/40 shadow-xs font-semibold' : 'text-gray-500 border-transparent hover:text-gray-900'
                  }`}
                >
                  Tối
                </button>
              </div>
            </div>

            {/* Section 1: Staff Account */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`text-xs font-semibold flex items-center justify-between ${t.titleColor}`}>
                <span>Staff Account</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold border border-blue-500/20">
                  {isAdmin ? 'ADMIN' : isLibrarian ? 'LIBRARIAN' : user.role}
                </span>
              </div>
              <div className="text-xs">
                <div className={`font-medium ${t.titleColor}`}>
                  {user.fullName || user.username}
                </div>
                <div className={`font-mono text-[11px] ${t.mutedColor}`}>
                  {user.email}
                </div>
              </div>
              <div className={`flex items-center gap-2 pt-2 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                <button
                  onClick={() => {
                    setSettingsModalOpen(false)
                    navigate('/')
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <IconExternalLink size={13} /> Public Catalog
                </button>
                <button
                  onClick={() => {
                    setSettingsModalOpen(false)
                    logout()
                    navigate('/')
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <IconLogout size={13} /> Sign Out
                </button>
              </div>
            </div>

            {/* Section 2: Circulation Rules */}
            <div className="space-y-2.5">
              <div className={`text-xs font-semibold ${t.titleColor}`}>
                Circulation Lending Policies
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-[11px] ${t.subTextColor}`}>Default Loan (Days)</label>
                  <input
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
                    className={`w-full h-8 px-2.5 rounded-xl text-xs mt-1 border outline-none transition ${t.inputBg}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] ${t.subTextColor}`}>Renewal Extension (Days)</label>
                  <input
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
                    className={`w-full h-8 px-2.5 rounded-xl text-xs mt-1 border outline-none transition ${t.inputBg}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-[11px] ${t.subTextColor}`}>Max Renewals Allowed</label>
                  <input
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
                    className={`w-full h-8 px-2.5 rounded-xl text-xs mt-1 border outline-none transition ${t.inputBg}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] ${t.subTextColor}`}>Overdue Fine/Day (VND)</label>
                  <input
                    type="number"
                    step={1000}
                    value={circulationSettings.finePerDayOverdue}
                    onChange={(e) =>
                      setCirculationSettings({
                        ...circulationSettings,
                        finePerDayOverdue: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className={`w-full h-8 px-2.5 rounded-xl text-xs mt-1 border outline-none transition ${t.inputBg}`}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: System Status */}
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
              <div>
                <span className={`font-medium ${t.titleColor}`}>Libro Core:</span> v2.0-Spring
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={t.subTextColor}>Backend Connected</span>
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showFeedback('success', 'Circulation policy preferences saved!')
                  setSettingsModalOpen(false)
                }}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
