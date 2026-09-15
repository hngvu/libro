import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type {
  LoanPublicResponse,
  LoanStatus,
  FinePublicResponse,
  MembershipPlanResponse,
  UserSubscriptionResponse,
} from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
  IconCalendar,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconBarcode,
  IconRefresh,
  IconLogin,
  IconChevronLeft,
  IconChevronRight,
  IconBooks,
  IconCreditCard,
  IconCoins,
  IconCrown,
  IconSparkles,
} from '@tabler/icons-react'

interface MyLoansViewProps {
  onOpenAuth: () => void
}

export function MyLoansView({ onOpenAuth }: MyLoansViewProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [loans, setLoans] = useState<LoanPublicResponse[]>([])
  const [fines, setFines] = useState<FinePublicResponse[]>([])
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null)
  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [subscribingCode, setSubscribingCode] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [payingFineCode, setPayingFineCode] = useState<string | null>(null)
  const [renewingLoanCode, setRenewingLoanCode] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const stripeStatus = searchParams.get('status')
  const subscriptionStatus = searchParams.get('subscription')

  const fetchMyLoans = useCallback(async () => {
    if (!user || user.role !== 'MEMBER') return
    setLoading(true)
    try {
      const [loansRes, finesRes, subRes, plansRes] = await Promise.all([
        api.getMyLoans({
          status: statusFilter || undefined,
          page,
          size: 10,
        }),
        api.getMyFines({ status: 'PENDING' }),
        api.getMySubscription().catch(() => null),
        api.getMembershipPlans().catch(() => []),
      ])
      setLoans(loansRes.content || [])
      setTotalPages(loansRes.totalPages || 1)
      setFines(finesRes.content || [])
      if (subRes) setSubscription(subRes)
      if (plansRes) setPlans(plansRes)
    } catch (err) {
      console.error('Failed to fetch loans, fines, or subscription:', err)
      setLoans([])
    } finally {
      setLoading(false)
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

  const handleSubscribe = async (planCode: string, cycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY') => {
    setSubscribingCode(planCode)
    try {
      const res = await api.createSubscriptionCheckoutSession(planCode, cycle, window.location.origin)
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate subscription checkout')
      setSubscribingCode(null)
    }
  }

  const handleOpenCustomerPortal = async () => {
    setOpeningPortal(true)
    try {
      const res = await api.createCustomerPortalSession(window.location.href)
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open customer portal')
      setOpeningPortal(false)
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
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to renew loan. Check your loan limit or overdue fines.',
      })
    } finally {
      setRenewingLoanCode(null)
    }
  }

  useEffect(() => {
    fetchMyLoans()
  }, [fetchMyLoans])

  if (!user || user.role !== 'MEMBER') {
    return (
      <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-2xl border border-[#c8d0b7] dark:border-[#3d4b3e] shadow-sm max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/50 flex items-center justify-center text-[#3d4b3e] dark:text-[#c8d0b7] mx-auto mb-4">
          <IconLogin size={28} />
        </div>
        <h2 className="font-serif font-bold text-xl text-[#1e2320] dark:text-[#f5f3e6] mb-2">
          Sign In to Access Your Bookshelf
        </h2>
        <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mb-6">
          Log in with your library account to view your borrowed titles, track return dates, and manage your reading shelves.
        </p>
        <Button onClick={onOpenAuth} className="gap-2">
          <IconLogin size={16} /> Sign In to Libro
        </Button>
      </div>
    )
  }

  const getLoanStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'ONGOING':
        return (
          <Badge variant="warning" className="gap-1">
            <IconClock size={12} /> Ongoing
          </Badge>
        )
      case 'RETURNED':
        return (
          <Badge variant="success" className="gap-1">
            <IconCheck size={12} /> Returned
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="gap-1">
            <IconAlertTriangle size={12} /> Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Quick stats
  const activeLoansCount = loans.filter((l) => l.status === 'ONGOING').length
  const overdueLoansCount = loans.filter((l) => l.status === 'OVERDUE').length
  const returnedLoansCount = loans.filter((l) => l.status === 'RETURNED').length

  return (
    <div className="space-y-6">
      {/* Goodreads "My Books" Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c8d0b7] dark:border-[#3d4b3e] pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#1e2320] dark:text-[#f5f3e6]">
            My Bookshelf & Circulation Loans
          </h2>
          <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1 font-serif italic">
            Reader profile for <strong className="text-[#3d4b3e] dark:text-[#f5f3e6]">{user.email}</strong> ({user.fullName || 'Member'})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMyLoans} className="gap-1.5 self-start sm:self-auto text-xs">
          <IconRefresh size={14} /> Refresh Shelf
        </Button>
      </div>

      {/* Membership Plan Banner */}
      <div className="p-5 rounded-2xl border border-[#c8d0b7] dark:border-[#3d4b3e] bg-gradient-to-br from-[#faf9f4] via-[#f4f1ea] to-[#e8ebdf] dark:from-[#212723] dark:via-[#252c28] dark:to-[#1e2320] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3d4b3e] text-white dark:bg-[#c8d0b7] dark:text-[#1e2320]">
              <IconCrown size={14} />
              {subscription?.planName || 'Free Reader'}
            </span>
            <span className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
              Status: <strong className="uppercase">{subscription?.status || 'FREE_TIER'}</strong>
            </span>
          </div>
          <p className="text-xs text-[#55634d] dark:text-[#c8d0b7]/90">
            Perks: Borrow up to <strong>{subscription?.maxActiveLoans ?? 1} books</strong> at once • <strong>{subscription?.loanDurationDays ?? 7} days</strong> borrowing period • <strong>{subscription?.maxRenewals ?? 0} renewals</strong> allowed
          </p>
          {subscription?.currentPeriodEnd && (
            <p className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7]/70 font-mono">
              Current billing period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {subscription?.stripeCustomerId && (
            <Button
              variant="outline"
              size="sm"
              disabled={openingPortal}
              onClick={handleOpenCustomerPortal}
              className="gap-1.5 text-xs flex-1 md:flex-initial"
            >
              <IconCreditCard size={14} />
              {openingPortal ? 'Opening Portal...' : 'Manage Billing'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsPlanModalOpen(true)}
            className="gap-1.5 text-xs bg-[#3d4b3e] hover:bg-[#2b352c] text-white flex-1 md:flex-initial"
          >
            <IconSparkles size={14} />
            {subscription?.planCode && subscription.planCode !== 'FREE' ? 'Change Tier' : 'Upgrade Plan'}
          </Button>
        </div>
      </div>

      {/* Action Messages */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            actionMessage.type === 'success'
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : 'border-rose-300 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {actionMessage.type === 'success' ? (
              <IconCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <IconAlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            {actionMessage.text}
          </div>
          <button onClick={() => setActionMessage(null)} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Stripe Payment Notifications */}
      {stripeStatus === 'success' && (
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <IconCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            Payment completed successfully via Stripe! Your fine has been marked as paid.
          </div>
          <button onClick={() => navigate('/my-loans', { replace: true })} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}
      {stripeStatus === 'cancelled' && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <IconAlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            Payment was cancelled. You can retry paying your fee anytime.
          </div>
          <button onClick={() => navigate('/my-loans', { replace: true })} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Subscription Notifications */}
      {subscriptionStatus === 'success' && (
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <IconCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            Subscription activated successfully via Stripe Billing! Enjoy your elevated reading perks.
          </div>
          <button onClick={() => navigate('/my-loans', { replace: true })} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}
      {subscriptionStatus === 'cancelled' && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <IconAlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            Subscription checkout was not completed. You can upgrade your tier whenever you wish.
          </div>
          <button onClick={() => navigate('/my-loans', { replace: true })} className="underline text-[11px] font-semibold cursor-pointer shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#c8d0b7]/25 dark:bg-[#252c28]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-serif font-bold uppercase text-[#3d4b3e] dark:text-[#c8d0b7]">Currently Reading</p>
              <h3 className="text-2xl font-extrabold text-[#1e2320] dark:text-[#f5f3e6] mt-1">{activeLoansCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#c8d0b7]/50 dark:bg-[#3d4b3e] flex items-center justify-center text-[#3d4b3e] dark:text-[#f5f3e6]">
              <IconClock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-serif font-bold uppercase text-rose-800 dark:text-rose-400">Overdue Returns</p>
              <h3 className="text-2xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">{overdueLoansCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-200/80 dark:bg-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300">
              <IconAlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#6f7f64]/15 dark:bg-[#252c28]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-serif font-bold uppercase text-[#3d4b3e] dark:text-[#c8d0b7]">Completed Reads</p>
              <h3 className="text-2xl font-extrabold text-[#1e2320] dark:text-[#f5f3e6] mt-1">{returnedLoansCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#6f7f64]/30 dark:bg-[#3d4b3e] flex items-center justify-center text-[#3d4b3e] dark:text-[#f5f3e6]">
              <IconCheck size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Fines Section */}
      {fines.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCoins className="text-amber-600 dark:text-amber-400" size={20} />
              <h3 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-200">
                Outstanding Library Fines & Penalties ({fines.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Total Due: ${fines.reduce((sum, f) => sum + (f.amount || 0), 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            You have outstanding fees from overdue, damaged, or lost books. Outstanding balances prevent borrowing additional titles until settled.
          </p>
          <div className="divide-y divide-amber-200 dark:divide-amber-800">
            {fines.map((fine) => (
              <div key={fine.fineCode} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-amber-950 dark:text-amber-100">{fine.fineCode}</span>
                  <span className="text-muted-foreground mx-1.5">•</span>
                  <span className="font-medium">{fine.bookTitle || 'Library Item'}</span>
                  <span className="text-muted-foreground mx-1.5">•</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
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
                    className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                  >
                    <IconCreditCard size={15} />
                    {payingFineCode === fine.fineCode ? 'Redirecting...' : 'Pay with Stripe'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goodreads Shelves Tabs */}
      <div className="flex items-center gap-2 bg-[#faf9f4] dark:bg-[#252c28] p-3 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
        <span className="text-xs font-bold text-[#6f7f64] dark:text-[#c8d0b7] mr-2 flex items-center gap-1">
          <IconBooks size={15} /> Shelf:
        </span>
        {(['', 'ONGOING', 'OVERDUE', 'RETURNED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st as LoanStatus)
              setPage(1)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-[#3d4b3e] text-[#f5f3e6] shadow-xs'
                : 'bg-[#c8d0b7]/40 dark:bg-[#1e2320] text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/70'
            }`}
          >
            {st === '' ? 'All Books' : st === 'ONGOING' ? 'Currently Borrowed' : st === 'OVERDUE' ? 'Overdue' : 'Read / Returned'}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#6f7f64]">Loading your bookshelf...</div>
      ) : loans.length === 0 ? (
        <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
          <IconBook size={40} className="mx-auto text-[#6f7f64] mb-2" />
          <h3 className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6] text-sm">
            Your bookshelf is currently empty
          </h3>
          <p className="text-xs text-[#6f7f64] mt-1">
            Browse our library catalog to discover titles to read and borrow.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Date Borrowed</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Date Returned</TableHead>
              <TableHead>Shelf Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.loanCode}>
                <TableCell className="font-mono font-semibold text-xs text-[#3d4b3e] dark:text-[#c8d0b7]">
                  {loan.loanCode}
                </TableCell>
                <TableCell>
                  <div
                    onClick={() => navigate(`/book/${loan.bookHandle}`)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div className="h-10 w-7 bg-[#c8d0b7]/30 rounded-xs book-shadow overflow-hidden shrink-0 flex items-center justify-center group-hover:-translate-y-0.5 transition-transform">
                      {loan.bookCover ? (
                        <img src={loan.bookCover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <IconBook size={14} className="text-[#6f7f64]" />
                      )}
                    </div>
                    <div>
                      <span className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6] block text-xs group-hover:underline">
                        {loan.bookTitle}
                      </span>
                      <span className="text-[11px] text-[#6f7f64] font-mono">
                        {loan.bookHandle}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-[#1e2320] dark:text-[#f5f3e6]">
                  <span className="inline-flex items-center gap-1">
                    <IconBarcode size={14} className="text-[#6f7f64]" />
                    {loan.barcode}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                  <span className="inline-flex items-center gap-1">
                    <IconCalendar size={13} className="text-[#6f7f64]" />
                    {loan.borrowDate}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-medium">
                  <span className={`inline-flex items-center gap-1 ${
                    loan.status === 'OVERDUE' ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-[#1e2320] dark:text-[#f5f3e6]'
                  }`}>
                    <IconClock size={13} />
                    {loan.dueDate}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                  {loan.returnDate || '—'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getLoanStatusBadge(loan.status)}
                    {loan.renewalCount && loan.renewalCount > 0 ? (
                      <span className="block text-[10px] text-muted-foreground">
                        {loan.renewalCount} renewed
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {loan.status === 'ONGOING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={renewingLoanCode === loan.loanCode}
                      onClick={() => handleRenewLoan(loan.loanCode)}
                      className="text-xs h-7 gap-1"
                    >
                      <IconRefresh size={12} />
                      {renewingLoanCode === loan.loanCode ? 'Renewing...' : 'Renew'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
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
              className="h-8 text-xs gap-1"
            >
              <IconChevronLeft size={14} /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs gap-1"
            >
              Next <IconChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Membership Plans Dialog */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-4xl" onClose={() => setIsPlanModalOpen(false)}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#1e2320] dark:text-[#f5f3e6] flex items-center gap-2">
                  <IconCrown size={22} className="text-amber-500" />
                  Choose Your Libro Membership Tier
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Unlock higher concurrent borrowing limits, extended loan durations, and renewals with Stripe.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCycle('MONTHLY')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedCycle === 'MONTHLY'
                      ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle('YEARLY')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    selectedCycle === 'YEARLY'
                      ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                    Save ~20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {plans.map((p) => {
                const isCurrent = subscription?.planCode === p.code || (!subscription?.planCode && p.code === 'FREE')
                const matchedPrice = p.prices?.find((pr) => pr.billingCycle === selectedCycle) 
                  || p.prices?.[0]
                const priceValue = matchedPrice ? Number(matchedPrice.price) : 0
                const cycleText = matchedPrice?.billingCycle === 'YEARLY' ? 'year' : 'month'

                return (
                  <div
                    key={p.code}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                      p.code === 'VIP'
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-md'
                        : isCurrent
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-foreground">{p.name}</h4>
                        {p.code === 'VIP' && (
                          <Badge variant="warning" className="text-[10px] uppercase font-bold">
                            Popular
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="success" className="text-[10px] uppercase font-bold">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">${priceValue.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">/{cycleText}</span>
                      </div>
                      <p className="text-xs text-muted-foreground min-h-[36px]">{p.description}</p>
                      <ul className="space-y-2 text-xs text-foreground/80 border-t border-border pt-3">
                        <li className="flex items-center gap-2">
                          <IconCheck size={14} className="text-emerald-500 shrink-0" />
                          <span><strong>{p.maxActiveLoans}</strong> active books at a time</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck size={14} className="text-emerald-500 shrink-0" />
                          <span><strong>{p.loanDurationDays} days</strong> loan duration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck size={14} className="text-emerald-500 shrink-0" />
                          <span><strong>{p.maxRenewals}</strong> allowed renewals</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4 mt-auto">
                      {isCurrent ? (
                        <Button variant="outline" size="sm" disabled className="w-full text-xs">
                          Current Plan
                        </Button>
                      ) : priceValue === 0 ? (
                        <Button variant="outline" size="sm" disabled className="w-full text-xs">
                          Free Base Tier
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={subscribingCode === p.code}
                          onClick={() => handleSubscribe(p.code, selectedCycle)}
                          className="w-full text-xs gap-1.5 bg-[#3d4b3e] hover:bg-[#2b352c] text-white"
                        >
                          <IconCreditCard size={14} />
                          {subscribingCode === p.code ? 'Redirecting...' : `Subscribe for $${priceValue.toFixed(2)}`}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
