import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type {
  LoanPublicResponse,
  LoanStatus,
  FinePublicResponse,
  ReservationResponse,
  ReservationStatus,
} from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  IconBook,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconRefresh,
  IconLogin,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconCoins,
  IconSearch,
  IconFilter2,
  IconArrowsUpDown,
  IconX,
  IconPlus,
  IconBookmark,
  IconTrash,
} from '@tabler/icons-react'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return dateStr
  }
}

function getDueInfo(dueDateStr?: string | null, status?: LoanStatus) {
  if (status === 'RETURNED' || !dueDateStr) return null
  try {
    const parts = dueDateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      due.setHours(0, 0, 0, 0)
      const diffTime = due.getTime() - now.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      if (status === 'OVERDUE' || diffDays < 0) {
        const daysLate = Math.max(1, Math.abs(diffDays))
        return { isOverdue: true, isDueSoon: false, days: daysLate, text: `${daysLate}d overdue` }
      }
      if (diffDays === 0) {
        return { isOverdue: false, isDueSoon: true, days: 0, text: 'Due today' }
      }
      if (diffDays === 1) {
        return { isOverdue: false, isDueSoon: true, days: 1, text: 'Due tomorrow' }
      }
      if (diffDays <= 3) {
        return { isOverdue: false, isDueSoon: true, days: diffDays, text: `Due in ${diffDays}d` }
      }
    }
  } catch {
    // ignore parsing error
  }
  return null
}

interface MyLoansViewProps {
  onOpenAuth: () => void
}

export function MyLoansView({ onOpenAuth }: MyLoansViewProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'loans' | 'reservations' | 'fines'>('loans')

  // Loans State
  const [loans, setLoans] = useState<LoanPublicResponse[]>([])
  const [loadingLoans, setLoadingLoans] = useState(false)
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'due-asc' | 'title-asc' | 'title-desc'>('date-desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [renewingLoanCode, setRenewingLoanCode] = useState<string | null>(null)

  // Reservations State
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [resActiveFilterFields, setResActiveFilterFields] = useState<string[]>([])
  const [resKeyword, setResKeyword] = useState('')
  const [resStatusFilter, setResStatusFilter] = useState<ReservationStatus | ''>('')
  const [resStartDateFilter, setResStartDateFilter] = useState('')
  const [resEndDateFilter, setResEndDateFilter] = useState('')
  const [cancellingResId, setCancellingResId] = useState<number | null>(null)

  // Fines State
  const [fines, setFines] = useState<FinePublicResponse[]>([])
  const [payingFineCode, setPayingFineCode] = useState<string | null>(null)

  // Summary Stats
  const [stats, setStats] = useState({ ongoing: 0, overdue: 0, dueSoon: 0, returned: 0, reserved: 0, total: 0 })
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const stripeStatus = searchParams.get('status')

  const fetchStats = useCallback(async () => {
    if (!user || user.role !== 'MEMBER') return
    try {
      const [allLoansRes, resRes, finesRes] = await Promise.all([
        api.getMyLoans({ size: 100 }),
        api.getMyReservations({ size: 50 }),
        api.getMyFines({ status: 'PENDING' }),
      ])
      const all = allLoansRes.content || []
      let ongoing = 0
      let overdue = 0
      let dueSoon = 0
      let returned = 0

      all.forEach((l) => {
        if (l.status === 'RETURNED') {
          returned++
        } else {
          ongoing++
          const dueInfo = getDueInfo(l.dueDate, l.status)
          if (l.status === 'OVERDUE' || dueInfo?.isOverdue) {
            overdue++
          } else if (dueInfo?.isDueSoon) {
            dueSoon++
          }
        }
      })

      const activeRes = (resRes.content || []).filter(
        (r) => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP'
      ).length

      setStats({
        ongoing,
        overdue,
        dueSoon,
        returned,
        reserved: activeRes,
        total: all.length,
      })
      setReservations(resRes.content || [])
      setFines(finesRes.content || [])
    } catch (err) {
      console.error('Failed to fetch summary stats:', err)
    }
  }, [user])

  const fetchMyLoans = useCallback(async () => {
    if (!user || user.role !== 'MEMBER') return
    setLoadingLoans(true)
    try {
      const loansRes = await api.getMyLoans({
        status: statusFilter || undefined,
        page,
        size: 50,
      })
      setLoans(loansRes.content || [])
      setTotalPages(loansRes.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch loans:', err)
      setLoans([])
    } finally {
      setLoadingLoans(false)
    }
  }, [user, statusFilter, page])

  const handlePayFineWithStripe = async (fineCode: string) => {
    setPayingFineCode(fineCode)
    try {
      const res = await api.createFineCheckoutSession(fineCode, window.location.origin)
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate Stripe payment')
      setPayingFineCode(null)
    }
  }

  const handleRenewLoan = async (loanCode: string) => {
    setRenewingLoanCode(loanCode)
    setActionMessage(null)
    try {
      const updated = await api.renewMyLoan(loanCode)
      setActionMessage({
        type: 'success',
        text: `Loan ${loanCode} renewed successfully! New due date is ${updated.dueDate}.`,
      })
      fetchMyLoans()
      fetchStats()
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to renew loan. Check your loan limit or overdue fines.',
      })
    } finally {
      setRenewingLoanCode(null)
    }
  }

  const handleCancelReservation = async (resId: number) => {
    if (!confirm('Are you sure you want to cancel this reservation hold?')) return
    setCancellingResId(resId)
    try {
      await api.cancelMyReservation(resId, 'Cancelled by user')
      fetchStats()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation')
    } finally {
      setCancellingResId(null)
    }
  }

  useEffect(() => {
    fetchMyLoans()
  }, [fetchMyLoans])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const filteredAndSortedLoans = useMemo(() => {
    let list = [...loans]
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (l) =>
          (l.bookTitle && l.bookTitle.toLowerCase().includes(kw)) ||
          (l.loanCode && l.loanCode.toLowerCase().includes(kw)) ||
          (l.barcode && l.barcode.toLowerCase().includes(kw)) ||
          (l.bookHandle && l.bookHandle.toLowerCase().includes(kw))
      )
    }
    if (startDateFilter) {
      list = list.filter((l) => {
        const b = (l.borrowDate || '').split('T')[0]
        const d = (l.dueDate || '').split('T')[0]
        return (b && b >= startDateFilter) || (d && d >= startDateFilter)
      })
    }
    if (endDateFilter) {
      list = list.filter((l) => {
        const b = (l.borrowDate || '').split('T')[0]
        const d = (l.dueDate || '').split('T')[0]
        return (b && b <= endDateFilter) || (d && d <= endDateFilter)
      })
    }
    if (sortBy === 'date-desc') {
      list.sort((a, b) => (b.borrowDate || '').localeCompare(a.borrowDate || ''))
    } else if (sortBy === 'date-asc') {
      list.sort((a, b) => (a.borrowDate || '').localeCompare(b.borrowDate || ''))
    } else if (sortBy === 'due-asc') {
      list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    } else if (sortBy === 'title-asc') {
      list.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''))
    } else if (sortBy === 'title-desc') {
      list.sort((a, b) => (b.bookTitle || '').localeCompare(a.bookTitle || ''))
    }
    return list
  }, [loans, keyword, sortBy, startDateFilter, endDateFilter])

  const filteredReservations = useMemo(() => {
    let list = [...reservations]
    if (resStatusFilter) {
      list = list.filter((r) => r.status === resStatusFilter)
    }
    if (resKeyword.trim()) {
      const kw = resKeyword.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.bookTitle && r.bookTitle.toLowerCase().includes(kw)) ||
          (r.reservationCode && r.reservationCode.toLowerCase().includes(kw)) ||
          (r.barcode && r.barcode.toLowerCase().includes(kw))
      )
    }
    if (resStartDateFilter) {
      list = list.filter((r) => {
        const d = (r.reservedAt || r.pickupDeadline || '').split('T')[0]
        return d ? d >= resStartDateFilter : true
      })
    }
    if (resEndDateFilter) {
      list = list.filter((r) => {
        const d = (r.reservedAt || r.pickupDeadline || '').split('T')[0]
        return d ? d <= resEndDateFilter : true
      })
    }
    return list
  }, [reservations, resStatusFilter, resKeyword, resStartDateFilter, resEndDateFilter])

  if (!user || user.role !== 'MEMBER') {
    return (
      <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] shadow-sm max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-[6px] bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/50 flex items-center justify-center text-[#3d4b3e] dark:text-[#c8d0b7] mx-auto mb-4">
          <IconLogin size={28} />
        </div>
        <h2 className="font-bold text-xl text-[#1e2320] dark:text-[#f5f3e6] mb-2">
          Sign In to Access Your Bookshelf
        </h2>
        <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mb-6">
          Log in with your library account to view your borrowed titles, track return dates, and manage your reading shelves.
        </p>
        <Button onClick={onOpenAuth} className="gap-2 rounded-[6px]">
          <IconLogin size={16} /> Sign In to Libro
        </Button>
      </div>
    )
  }

  const getLoanStatusBadge = (status: LoanStatus, dueInfo?: ReturnType<typeof getDueInfo>) => {
    switch (status) {
      case 'ONGOING':
        if (dueInfo?.isDueSoon) {
          return (
            <Badge variant="warning" className="rounded-[4px] bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold">
              Due Soon
            </Badge>
          )
        }
        return (
          <Badge variant="warning" className="rounded-[4px] font-semibold">
            Ongoing
          </Badge>
        )
      case 'RETURNED':
        return (
          <Badge variant="success" className="rounded-[4px] font-semibold">
            Returned
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="rounded-[4px] font-semibold">
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline" className="rounded-[4px] font-semibold">{status}</Badge>
    }
  }

  const totalFinesAmount = fines.reduce((sum, f) => sum + (f.amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* 1. Compact Stat Cards (4 Equal Width Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Overdue & Due Soon (Warning - Reddish Brown) */}
        <button
          type="button"
          onClick={() => {
            if (stats.overdue > 0) {
              setActiveTab('loans')
              setActiveFilterFields((prev) => (prev.includes('status') ? prev : [...prev, 'status']))
              setStatusFilter('OVERDUE')
              setPage(1)
            } else if (stats.dueSoon > 0) {
              setActiveTab('loans')
              setActiveFilterFields((prev) => (prev.includes('status') ? prev : [...prev, 'status']))
              setStatusFilter('ONGOING')
              setSortBy('due-asc')
              setPage(1)
            } else if (fines.length > 0) {
              setActiveTab('fines')
            } else {
              setActiveTab('loans')
              setActiveFilterFields([])
              setStatusFilter('')
              setPage(1)
            }
          }}
          className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer flex items-center justify-between min-w-0 w-full min-h-[72px] ${
            (activeTab === 'loans' && (statusFilter === 'OVERDUE' || (statusFilter === 'ONGOING' && sortBy === 'due-asc' && stats.dueSoon > 0))) ||
            activeTab === 'fines'
              ? 'border-[#7a2323] bg-[#7a2323]/20 dark:bg-[#631c1c]/45 shadow-xs ring-1 ring-[#7a2323]/30'
              : stats.overdue > 0 || stats.dueSoon > 0 || fines.length > 0
              ? 'border-[#a84d4d]/40 dark:border-[#7a2828]/60 bg-[#8b2d2d]/10 dark:bg-[#521919]/30 hover:border-[#7a2323]'
              : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:border-[#8b2d2d]/60'
          }`}
        >
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-semibold text-[#801b1b] dark:text-[#fca5a5] block truncate">
              {stats.overdue > 0
                ? 'Overdue Warning'
                : stats.dueSoon > 0
                ? 'Due Soon Warning'
                : fines.length > 0
                ? 'Unpaid Fines'
                : 'Overdue & Alerts'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xl font-bold text-[#5e1111] dark:text-[#fecdd3]">
                {stats.overdue > 0
                  ? stats.overdue
                  : stats.dueSoon > 0
                  ? stats.dueSoon
                  : fines.length > 0
                  ? `$${totalFinesAmount.toFixed(2)}`
                  : 0}
              </span>
              {stats.overdue > 0 && stats.dueSoon > 0 && (
                <span className="text-[10px] font-medium text-[#991b1b] dark:text-[#fca5a5] truncate">
                  (+{stats.dueSoon} due soon)
                </span>
              )}
              {stats.overdue === 0 && stats.dueSoon > 0 && (
                <span className="text-[10px] font-medium text-[#991b1b] dark:text-[#fca5a5]">
                  in ≤ 3 days
                </span>
              )}
              {stats.overdue === 0 && stats.dueSoon === 0 && fines.length === 0 && (
                <span className="text-[10px] font-medium text-[#6f7f64] dark:text-[#c8d0b7]">
                  All clear
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#801b1b]/15 dark:bg-[#801b1b]/40 text-[#801b1b] dark:text-[#fca5a5] flex items-center justify-center shrink-0">
            {fines.length > 0 && stats.overdue === 0 && stats.dueSoon === 0 ? (
              <IconCoins size={16} />
            ) : (
              <IconAlertTriangle size={16} />
            )}
          </div>
        </button>

        {/* Card 2: Currently Reading */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('loans')
            setActiveFilterFields((prev) => (prev.includes('status') ? prev : [...prev, 'status']))
            setStatusFilter('ONGOING')
            setPage(1)
          }}
          className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer flex items-center justify-between min-w-0 w-full min-h-[72px] ${
            activeTab === 'loans' && statusFilter === 'ONGOING'
              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-xs'
              : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:border-amber-400/80'
          }`}
        >
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-medium text-[#6f7f64] dark:text-[#c8d0b7] block truncate">
              Currently Reading
            </span>
            <span className="text-xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {stats.ongoing}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <IconClock size={16} />
          </div>
        </button>

        {/* Card 3: Reservations */}
        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer flex items-center justify-between min-w-0 w-full min-h-[72px] ${
            activeTab === 'reservations'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-xs'
              : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:border-blue-400/80'
          }`}
        >
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-medium text-[#6f7f64] dark:text-[#c8d0b7] block truncate">
              Holds & Reserved
            </span>
            <span className="text-xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {stats.reserved}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <IconBookmark size={16} />
          </div>
        </button>

        {/* Card 4: Completed Reads */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('loans')
            setActiveFilterFields((prev) => (prev.includes('status') ? prev : [...prev, 'status']))
            setStatusFilter('RETURNED')
            setPage(1)
          }}
          className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer flex items-center justify-between min-w-0 w-full min-h-[72px] ${
            activeTab === 'loans' && statusFilter === 'RETURNED'
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs'
              : 'border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:border-emerald-400/80'
          }`}
        >
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-medium text-[#6f7f64] dark:text-[#c8d0b7] block truncate">
              Completed Reads
            </span>
            <span className="text-xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
              {stats.returned}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <IconCheck size={16} />
          </div>
        </button>
      </div>

      {/* 2. Navigation Tabs Row */}
      {/* 2. Navigation Tabs Row (Clean Minimalist Text) */}
      <div className="flex items-center gap-1 border-b border-[#c8d0b7]/60 dark:border-[#3d4b3e]">
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-[6px] transition-all cursor-pointer border-b-2 -mb-[1px] ${
            activeTab === 'loans'
              ? 'border-[#3d4b3e] dark:border-[#c8d0b7] text-[#1e2320] dark:text-[#f5f3e6] bg-[#faf9f4] dark:bg-[#252c28]'
              : 'border-transparent text-[#6f7f64] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-[#f5f3e6]'
          }`}
        >
          Loans
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-[6px] transition-all cursor-pointer border-b-2 -mb-[1px] ${
            activeTab === 'reservations'
              ? 'border-[#3d4b3e] dark:border-[#c8d0b7] text-[#1e2320] dark:text-[#f5f3e6] bg-[#faf9f4] dark:bg-[#252c28]'
              : 'border-transparent text-[#6f7f64] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-[#f5f3e6]'
          }`}
        >
          Reservations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fines')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-[6px] transition-all cursor-pointer flex items-center gap-1.5 border-b-2 -mb-[1px] ${
            activeTab === 'fines'
              ? 'border-[#3d4b3e] dark:border-[#c8d0b7] text-[#1e2320] dark:text-[#f5f3e6] bg-[#faf9f4] dark:bg-[#252c28]'
              : 'border-transparent text-[#6f7f64] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-[#f5f3e6]'
          }`}
        >
          <span>Fines</span>
          {fines.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          )}
        </button>
      </div>

      {/* Global Alerts & Actions */}
      {actionMessage && (
        <div
          className={`p-3 rounded-[6px] border flex items-center justify-between text-xs ${
            actionMessage.type === 'success'
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : 'border-rose-300 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {actionMessage.type === 'success' ? (
              <IconCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <IconAlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            {actionMessage.text}
          </div>
          <button onClick={() => setActionMessage(null)} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}

      {stripeStatus === 'success' && (
        <div className="p-3 rounded-[6px] border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <IconCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            Payment completed successfully via Stripe! Your fine has been marked as paid.
          </div>
          <button onClick={() => navigate('/loans', { replace: true })} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: LOANS MANAGEMENT */}
      {activeTab === 'loans' && (
        <div className="space-y-3.5">
          {/* Search & Actions Toolbar */}
          <div className="space-y-2.5">
            {/* Row 1: Searchbar + Sort Button */}
            <div className="flex items-center gap-2 w-full sm:w-[360px] md:w-[420px]">
              <div className="relative flex-1">
                <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7f64] dark:text-[#c8d0b7]" />
                <input
                  placeholder="Search title or loan code..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-9 pl-9 pr-8 text-xs sm:text-sm w-full rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] text-[#1e2320] dark:text-[#f5f3e6] placeholder:text-[#6f7f64] dark:placeholder:text-[#8e9d89] outline-none focus:border-[#3d4b3e] dark:focus:border-[#c8d0b7] transition-colors"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] cursor-pointer"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`h-9 w-9 rounded-[6px] border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      sortBy !== 'date-desc'
                        ? 'bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 border-[#3d4b3e] text-[#3d4b3e] dark:text-[#c8d0b7]'
                        : 'bg-white dark:bg-[#252c28] border-[#c8d0b7] dark:border-[#3d4b3e] text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/20'
                    }`}
                    title="Sort options"
                  >
                    <IconArrowsUpDown size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[6px] border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-xs">
                  <DropdownMenuItem
                    onClick={() => setSortBy('date-desc')}
                    className={sortBy === 'date-desc' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                  >
                    Borrowed Date (Newest)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('date-asc')}
                    className={sortBy === 'date-asc' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                  >
                    Borrowed Date (Oldest)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('due-asc')}
                    className={sortBy === 'due-asc' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                  >
                    Due Date (Soonest)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('title-asc')}
                    className={sortBy === 'title-asc' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                  >
                    Title (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('title-desc')}
                    className={sortBy === 'title-desc' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                  >
                    Title (Z-A)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Row 2: Filter Section Under Searchbar */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <div className="h-9 flex items-center gap-1.5 px-3 rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-[#1e2320] dark:text-[#f5f3e6] text-xs font-semibold select-none">
                <IconFilter2 size={15} className="text-[#6f7f64] dark:text-[#c8d0b7]" />
                <span>Filter</span>
              </div>

              {/* Status Filter Field Chip */}
              {activeFilterFields.includes('status') && (
                <div className="h-9 flex items-center gap-1 pl-3 pr-1 rounded-[6px] border border-[#3d4b3e] dark:border-[#c8d0b7] bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#1e2320] dark:text-[#f5f3e6] text-xs font-medium">
                  <span className="text-[#6f7f64] dark:text-[#c8d0b7]">Status:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="font-semibold flex items-center gap-1 hover:underline cursor-pointer outline-none px-1 py-0.5 rounded-[4px]"
                      >
                        <span>
                          {statusFilter === 'ONGOING'
                            ? 'Ongoing'
                            : statusFilter === 'OVERDUE'
                            ? 'Overdue'
                            : statusFilter === 'RETURNED'
                            ? 'Returned'
                            : 'All'}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-[6px] border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-xs">
                      <DropdownMenuItem
                        onClick={() => { setStatusFilter(''); setPage(1) }}
                        className={!statusFilter ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { setStatusFilter('ONGOING'); setPage(1) }}
                        className={statusFilter === 'ONGOING' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Ongoing (Currently Borrowed)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { setStatusFilter('OVERDUE'); setPage(1) }}
                        className={statusFilter === 'OVERDUE' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Overdue
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { setStatusFilter('RETURNED'); setPage(1) }}
                        className={statusFilter === 'RETURNED' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Returned
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilterFields((prev) => prev.filter((f) => f !== 'status'))
                      setStatusFilter('')
                      setPage(1)
                    }}
                    className="p-1 hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e] rounded-[3px] cursor-pointer text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] ml-0.5"
                    title="Remove status filter"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              )}

              {/* Date Range Filter Field Chip */}
              {activeFilterFields.includes('date') && (
                <div className="h-9 flex items-center gap-1 pl-3 pr-1.5 rounded-[6px] border border-[#3d4b3e] dark:border-[#c8d0b7] bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#1e2320] dark:text-[#f5f3e6] text-xs font-medium">
                  <span className="text-[#6f7f64] dark:text-[#c8d0b7] shrink-0">Date:</span>
                  <DateRangePicker
                    value={{ start: startDateFilter, end: endDateFilter }}
                    onChange={(range) => {
                      setStartDateFilter(range.start || '')
                      setEndDateFilter(range.end || '')
                      setPage(1)
                    }}
                    placeholder="All dates"
                    allowClear={false}
                    format="dd/MM/yyyy"
                    className="h-7 border-none bg-transparent hover:border-none hover:bg-transparent dark:hover:bg-transparent shadow-none px-1 text-xs font-semibold focus:border-none focus:ring-0 text-[#1e2320] dark:text-[#f5f3e6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilterFields((prev) => prev.filter((f) => f !== 'date'))
                      setStartDateFilter('')
                      setEndDateFilter('')
                      setPage(1)
                    }}
                    className="p-1 hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e] rounded-[3px] cursor-pointer text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6]"
                    title="Remove date filter"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              )}

              {/* Plus Button to add unselected filters */}
              {activeFilterFields.length < 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:bg-[#c8d0b7]/20 flex items-center justify-center text-[#1e2320] dark:text-[#f5f3e6] cursor-pointer transition-colors"
                      title="Add filter"
                    >
                      <IconPlus size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-[6px] border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-xs">
                    {!activeFilterFields.includes('status') && (
                      <DropdownMenuItem onClick={() => setActiveFilterFields((prev) => [...prev, 'status'])}>
                        Status
                      </DropdownMenuItem>
                    )}
                    {!activeFilterFields.includes('date') && (
                      <DropdownMenuItem onClick={() => setActiveFilterFields((prev) => [...prev, 'date'])}>
                        Date Range
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Reset Filters Button */}
              {(activeFilterFields.length > 0 || statusFilter || startDateFilter || endDateFilter || keyword) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilterFields([])
                    setStatusFilter('')
                    setStartDateFilter('')
                    setEndDateFilter('')
                    setKeyword('')
                    setPage(1)
                  }}
                  className="h-9 px-2.5 rounded-[6px] text-xs text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] hover:bg-[#c8d0b7]/30 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <IconX size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Loans Table */}
          {loadingLoans ? (
            <div className="p-12 text-center text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
              Loading borrowed books...
            </div>
          ) : filteredAndSortedLoans.length === 0 ? (
            <div className="p-10 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e]">
              <IconBook className="mx-auto text-[#6f7f64] opacity-50 mb-2" size={32} />
              <p className="text-sm font-semibold text-[#1e2320] dark:text-[#f5f3e6]">No borrowed books found</p>
              <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1">
                {keyword || statusFilter ? 'Try clearing your filters to see more results.' : 'You have not borrowed any books yet.'}
              </p>
            </div>
          ) : (
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow className="bg-[#faf9f4] dark:bg-[#252c28] border-b border-[#c8d0b7] dark:border-[#3d4b3e] hover:bg-[#faf9f4] dark:hover:bg-[#252c28]">
                  <TableHead className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] min-w-[220px]">Book</TableHead>
                  <TableHead className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] w-[140px] whitespace-nowrap">Loan Code</TableHead>
                  <TableHead className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] w-[110px] whitespace-nowrap">Borrowed</TableHead>
                  <TableHead className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] w-[130px] whitespace-nowrap">Due Date</TableHead>
                  <TableHead className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] w-[110px] whitespace-nowrap">Returned</TableHead>
                  <TableHead className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6] w-[110px] text-right whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLoans.map((loan) => {
                  const dueInfo = getDueInfo(loan.dueDate, loan.status)
                  return (
                    <TableRow key={loan.loanCode} className="border-b border-[#c8d0b7]/40 dark:border-[#3d4b3e]/40 hover:bg-[#c8d0b7]/15 dark:hover:bg-[#3d4b3e]/30 transition-colors">
                      {/* Rich Book Column: Cover + Title + Authors + Barcode */}
                      <TableCell className="font-medium text-xs py-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => loan.bookHandle && navigate(`/book/${loan.bookHandle}`)}
                            className="w-10 h-14 sm:w-11 sm:h-15 rounded-[4px] bg-[#c8d0b7]/20 dark:bg-[#3d4b3e]/30 border border-[#c8d0b7]/50 dark:border-[#3d4b3e] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs group"
                          >
                            {loan.bookCover ? (
                              <img
                                src={loan.bookCover}
                                alt={loan.bookTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <IconBook size={18} className="text-[#6f7f64] dark:text-[#c8d0b7] opacity-60" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <span
                              onClick={() => loan.bookHandle && navigate(`/book/${loan.bookHandle}`)}
                              className="font-semibold text-xs sm:text-sm text-[#1e2320] dark:text-[#f5f3e6] hover:underline cursor-pointer truncate block"
                              title={loan.bookTitle || 'Untitled Book'}
                            >
                              {loan.bookTitle || 'Untitled Book'}
                            </span>
                            {loan.authors && loan.authors.length > 0 && (
                              <span
                                className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] truncate block"
                                title={loan.authors.join(', ')}
                              >
                                by {loan.authors.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs sm:text-[13px] font-mono font-medium text-[#1e2320] dark:text-[#f5f3e6] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{loan.loanCode}</span>
                          {loan.renewalCount && loan.renewalCount > 0 ? (
                            <span
                              title={`Renewed ${loan.renewalCount} time${loan.renewalCount > 1 ? 's' : ''}`}
                              className="font-sans text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-[4px] border border-blue-300 dark:border-blue-700 shadow-2xs select-none"
                            >
                              {loan.renewalCount}x
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs sm:text-[13px] text-[#1e2320] dark:text-[#f5f3e6] whitespace-nowrap">
                        {formatDate(loan.borrowDate)}
                      </TableCell>

                      <TableCell className="text-xs sm:text-[13px] font-medium whitespace-nowrap">
                        <span
                          className={
                            loan.status === 'OVERDUE' || dueInfo?.isOverdue
                              ? 'text-rose-700 dark:text-rose-400 font-bold'
                              : dueInfo?.isDueSoon
                              ? 'text-amber-700 dark:text-amber-400 font-semibold'
                              : 'text-[#1e2320] dark:text-[#f5f3e6]'
                          }
                        >
                          {formatDate(loan.dueDate)}
                          {dueInfo?.isOverdue && loan.status !== 'RETURNED' ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">
                              ({dueInfo.days})
                            </span>
                          ) : dueInfo?.isDueSoon && loan.status !== 'RETURNED' ? (
                            <span className="text-amber-700 dark:text-amber-400 text-[11px] font-medium ml-1">
                              ({dueInfo.days === 0 ? 'today' : `${dueInfo.days}d`})
                            </span>
                          ) : null}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs sm:text-[13px] text-[#1e2320] dark:text-[#f5f3e6] whitespace-nowrap">
                        {loan.status === 'RETURNED' ? (
                          loan.returnDate ? formatDate(loan.returnDate) : <span className="text-[#6f7f64] dark:text-[#c8d0b7]">—</span>
                        ) : loan.status === 'ONGOING' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={renewingLoanCode === loan.loanCode}
                            onClick={() => handleRenewLoan(loan.loanCode)}
                            className="text-[11px] h-6 px-2.5 gap-1 rounded-[4px] border-[#c8d0b7] dark:border-[#3d4b3e] text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#3d4b3e] hover:text-white dark:hover:bg-[#c8d0b7] dark:hover:text-[#1e2320] transition-colors shadow-2xs font-semibold cursor-pointer"
                          >
                            <IconRefresh size={11} className={renewingLoanCode === loan.loanCode ? 'animate-spin' : ''} />
                            {renewingLoanCode === loan.loanCode ? 'Renewing...' : 'Renew'}
                          </Button>
                        ) : (
                          <span className="text-[#6f7f64] dark:text-[#c8d0b7]">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-right whitespace-nowrap">
                        {getLoanStatusBadge(loan.status, dueInfo)}
                      </TableCell>
                  </TableRow>
                )
              })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#c8d0b7] dark:border-[#3d4b3e] pt-4">
              <span className="text-xs text-[#6f7f64]">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs gap-1 rounded-[5px]"
                >
                  <IconChevronLeft size={14} /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs gap-1 rounded-[5px]"
                >
                  Next <IconChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESERVATIONS / HOLDS */}
      {activeTab === 'reservations' && (
        <div className="space-y-3.5">
          {/* Search & Actions Toolbar */}
          <div className="space-y-2.5">
            {/* Row 1: Searchbar */}
            <div className="flex items-center gap-2 w-full sm:w-[360px] md:w-[420px]">
              <div className="relative flex-1">
                <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7f64] dark:text-[#c8d0b7]" />
                <input
                  placeholder="Search reserved title or code..."
                  value={resKeyword}
                  onChange={(e) => setResKeyword(e.target.value)}
                  className="h-9 pl-9 pr-8 text-xs sm:text-sm w-full rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] text-[#1e2320] dark:text-[#f5f3e6] placeholder:text-[#6f7f64] dark:placeholder:text-[#8e9d89] outline-none focus:border-[#3d4b3e] dark:focus:border-[#c8d0b7] transition-colors"
                />
                {resKeyword && (
                  <button
                    type="button"
                    onClick={() => setResKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] cursor-pointer"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Filter Section Under Searchbar */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <div className="h-9 flex items-center gap-1.5 px-3 rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-[#1e2320] dark:text-[#f5f3e6] text-xs font-semibold select-none">
                <IconFilter2 size={15} className="text-[#6f7f64] dark:text-[#c8d0b7]" />
                <span>Filter</span>
              </div>

              {/* Status Filter Field Chip */}
              {resActiveFilterFields.includes('status') && (
                <div className="h-9 flex items-center gap-1 pl-3 pr-1 rounded-[6px] border border-[#3d4b3e] dark:border-[#c8d0b7] bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#1e2320] dark:text-[#f5f3e6] text-xs font-medium">
                  <span className="text-[#6f7f64] dark:text-[#c8d0b7]">Status:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="font-semibold flex items-center gap-1 hover:underline cursor-pointer outline-none px-1 py-0.5 rounded-[4px]"
                      >
                        <span>
                          {resStatusFilter === 'PENDING'
                            ? 'Pending'
                            : resStatusFilter === 'READY_FOR_PICKUP'
                            ? 'Ready For Pickup'
                            : resStatusFilter === 'FULFILLED'
                            ? 'Fulfilled'
                            : resStatusFilter === 'CANCELLED'
                            ? 'Cancelled'
                            : 'All'}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-[6px] border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-xs">
                      <DropdownMenuItem
                        onClick={() => setResStatusFilter('')}
                        className={!resStatusFilter ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        All Statuses
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResStatusFilter('PENDING')}
                        className={resStatusFilter === 'PENDING' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Pending Queue
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResStatusFilter('READY_FOR_PICKUP')}
                        className={resStatusFilter === 'READY_FOR_PICKUP' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Ready For Pickup
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResStatusFilter('FULFILLED')}
                        className={resStatusFilter === 'FULFILLED' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Fulfilled
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResStatusFilter('CANCELLED')}
                        className={resStatusFilter === 'CANCELLED' ? 'font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]' : ''}
                      >
                        Cancelled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    type="button"
                    onClick={() => {
                      setResActiveFilterFields((prev) => prev.filter((f) => f !== 'status'))
                      setResStatusFilter('')
                    }}
                    className="p-1 hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e] rounded-[3px] cursor-pointer text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] ml-0.5"
                    title="Remove status filter"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              )}

              {/* Date Range Filter Field Chip */}
              {resActiveFilterFields.includes('date') && (
                <div className="h-9 flex items-center gap-1 pl-3 pr-1.5 rounded-[6px] border border-[#3d4b3e] dark:border-[#c8d0b7] bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#1e2320] dark:text-[#f5f3e6] text-xs font-medium">
                  <span className="text-[#6f7f64] dark:text-[#c8d0b7] shrink-0">Date:</span>
                  <DateRangePicker
                    value={{ start: resStartDateFilter, end: resEndDateFilter }}
                    onChange={(range) => {
                      setResStartDateFilter(range.start || '')
                      setResEndDateFilter(range.end || '')
                    }}
                    placeholder="All dates"
                    allowClear={false}
                    format="dd/MM/yyyy"
                    className="h-7 border-none bg-transparent hover:border-none hover:bg-transparent dark:hover:bg-transparent shadow-none px-1 text-xs font-semibold focus:border-none focus:ring-0 text-[#1e2320] dark:text-[#f5f3e6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setResActiveFilterFields((prev) => prev.filter((f) => f !== 'date'))
                      setResStartDateFilter('')
                      setResEndDateFilter('')
                    }}
                    className="p-1 hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e] rounded-[3px] cursor-pointer text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6]"
                    title="Remove date filter"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              )}

              {/* Plus Button to add unselected filters */}
              {resActiveFilterFields.length < 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:bg-[#c8d0b7]/20 flex items-center justify-center text-[#1e2320] dark:text-[#f5f3e6] cursor-pointer transition-colors"
                      title="Add filter"
                    >
                      <IconPlus size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-[6px] border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] text-xs">
                    {!resActiveFilterFields.includes('status') && (
                      <DropdownMenuItem onClick={() => setResActiveFilterFields((prev) => [...prev, 'status'])}>
                        Status
                      </DropdownMenuItem>
                    )}
                    {!resActiveFilterFields.includes('date') && (
                      <DropdownMenuItem onClick={() => setResActiveFilterFields((prev) => [...prev, 'date'])}>
                        Date Range
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Reset Filters Button */}
              {(resActiveFilterFields.length > 0 || resStatusFilter || resStartDateFilter || resEndDateFilter || resKeyword) && (
                <button
                  type="button"
                  onClick={() => {
                    setResActiveFilterFields([])
                    setResStatusFilter('')
                    setResStartDateFilter('')
                    setResEndDateFilter('')
                    setResKeyword('')
                  }}
                  className="h-9 px-2.5 rounded-[6px] text-xs text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] hover:bg-[#c8d0b7]/30 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <IconX size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Reservations List */}
          {filteredReservations.length === 0 ? (
            <div className="p-10 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e]">
              <IconBookmark className="mx-auto text-[#6f7f64] opacity-50 mb-2" size={32} />
              <p className="text-sm font-semibold text-[#1e2320] dark:text-[#f5f3e6]">No book holds or reservations found</p>
              <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1">
                When copies of popular titles are unavailable, you can place a hold to reserve your place in line.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-[6px] border border-[#c8d0b7]/70 dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => res.bookHandle && navigate(`/book/${res.bookHandle}`)}
                        className="font-semibold text-sm text-[#1e2320] dark:text-[#f5f3e6] hover:underline cursor-pointer truncate"
                      >
                        {res.bookTitle || 'Untitled Book'}
                      </span>
                      {res.status === 'READY_FOR_PICKUP' ? (
                        <Badge variant="success" className="text-[10px] rounded-[4px]">
                          Ready for pickup
                        </Badge>
                      ) : res.status === 'PENDING' ? (
                        <Badge variant="warning" className="text-[10px] rounded-[4px]">
                          Queue #{res.queuePosition || 1}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] rounded-[4px]">
                          {res.status}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[#6f7f64] dark:text-[#c8d0b7] text-xs flex-wrap">
                      <span>Code: <code className="font-mono font-bold text-[#1e2320] dark:text-[#f5f3e6]">{res.reservationCode}</code></span>
                      <span>Reserved: {formatDate(res.reservedAt)}</span>
                      {res.pickupDeadline && (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          Pickup deadline: {formatDate(res.pickupDeadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {(res.status === 'PENDING' || res.status === 'READY_FOR_PICKUP') && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancellingResId === res.id}
                      onClick={() => handleCancelReservation(res.id)}
                      className="text-xs h-8 gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[5px] shrink-0"
                    >
                      <IconTrash size={13} />
                      {cancellingResId === res.id ? 'Cancelling...' : 'Cancel Hold'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FINES & PENALTIES */}
      {activeTab === 'fines' && (
        <div className="space-y-3.5">
          {fines.length === 0 ? (
            <div className="p-10 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e]">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <IconCheck size={24} />
              </div>
              <p className="text-sm font-semibold text-[#1e2320] dark:text-[#f5f3e6]">No Outstanding Fines</p>
              <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1">
                Your library account is in great standing with zero pending fines. Happy reading!
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[6px] border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCoins className="text-amber-600 dark:text-amber-400" size={20} />
                  <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                    Outstanding Library Fines & Penalties ({fines.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Total Due: ${totalFinesAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Outstanding balances prevent borrowing additional titles until settled. You can pay securely via Stripe.
              </p>
              <div className="divide-y divide-amber-200 dark:divide-amber-800">
                {fines.map((fine) => (
                  <div key={fine.fineCode} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono font-bold text-amber-950 dark:text-amber-100">{fine.fineCode}</span>
                      <span className="text-muted-foreground mx-1.5">•</span>
                      <span className="font-medium">{fine.bookTitle || 'Library Item'}</span>
                      <span className="text-muted-foreground mx-1.5">•</span>
                      <Badge variant="outline" className="text-[10px] uppercase rounded-[4px]">
                        {fine.reason.replace('_', ' ')}
                      </Badge>
                      {fine.daysOverdue && fine.daysOverdue > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 ml-1.5">({fine.daysOverdue} days late)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="font-mono font-bold text-sm text-amber-900 dark:text-amber-200">
                        ${fine.amount.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        disabled={payingFineCode === fine.fineCode}
                        onClick={() => handlePayFineWithStripe(fine.fineCode)}
                        className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs rounded-[5px]"
                      >
                        <IconCreditCard size={14} />
                        {payingFineCode === fine.fineCode ? 'Redirecting...' : 'Pay with Stripe'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
