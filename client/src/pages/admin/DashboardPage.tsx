import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconBooks,
  IconBarcode,
  IconClock,
  IconAlertTriangle,
  IconUsers,
  IconArrowRight,
  IconPlus,
  IconArrowLeftRight,
  IconArrowBackUp,
  IconCoins,
  IconCrown,
  IconAlertOctagon,
  IconReportAnalytics,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { DashboardSummaryResponse, OperationalAlertsResponse, LoanResponse } from '@/types/api'

export function DashboardPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [alerts, setAlerts] = useState<OperationalAlertsResponse | null>(null)
  const [recentLoans, setRecentLoans] = useState<LoanResponse[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, alertsRes, loansRes] = await Promise.allSettled([
        api.adminGetDashboardSummary(),
        api.adminGetOperationalAlerts(),
        api.adminGetLoans({ page: 1, size: 6 }),
      ])

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value)
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value)
      }
      if (loansRes.status === 'fulfilled') {
        setRecentLoans(loansRes.value.content || [])
      }
    } catch {
      // Ignore background load error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleReturnLoan = async (id: number) => {
    if (!confirm('Confirm book return for this loan ticket?')) return
    try {
      await api.adminReturnLoan(id)
      showFeedback('success', 'Book return processed successfully!')
      fetchDashboardData()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return loan')
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Dynamic KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* Card 1: Books */}
        <div
          onClick={() => navigate('/admin/books')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Catalog Titles</span>
            <IconBooks size={17} className={t.mutedColor} />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {summary?.totalBooks ?? 0}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            Unique titles
          </p>
        </div>

        {/* Card 2: Copies */}
        <div
          onClick={() => navigate('/admin/copies')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Physical Copies</span>
            <IconBarcode size={17} className={t.mutedColor} />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {summary?.totalCopies ?? 0}
          </div>
          <p className={`text-[11px] mt-1 truncate text-emerald-600 dark:text-emerald-400`}>
            {summary?.availableCopies ?? 0} available on shelf
          </p>
        </div>

        {/* Card 3: Active Loans */}
        <div
          onClick={() => navigate('/admin/circulation')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Active Loans</span>
            <IconClock size={17} className={t.mutedColor} />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {summary?.activeLoans ?? 0}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            In circulation
          </p>
        </div>

        {/* Card 4: Overdue */}
        <div
          onClick={() => navigate('/admin/overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover} ${
            (summary?.overdueLoans ?? 0) > 0 ? (isDark ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/30' : 'border-rose-300 bg-rose-50/50') : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${(summary?.overdueLoans ?? 0) > 0 ? 'text-rose-400 font-semibold' : t.subTextColor}`}>
              Overdue Returns
            </span>
            <IconAlertTriangle size={17} className={(summary?.overdueLoans ?? 0) > 0 ? 'text-rose-400' : t.mutedColor} />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight ${(summary?.overdueLoans ?? 0) > 0 ? 'text-rose-400' : t.titleColor}`}>
            {summary?.overdueLoans ?? 0}
          </div>
          <p className={`text-[11px] mt-1 truncate ${(summary?.overdueLoans ?? 0) > 0 ? 'text-rose-400 font-medium' : t.subTextColor}`}>
            {(summary?.overdueLoans ?? 0) > 0 ? 'Action required' : 'All loans current'}
          </p>
        </div>

        {/* Card 5: Members */}
        <div
          onClick={() => navigate('/admin/members')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Members</span>
            <IconUsers size={17} className={t.mutedColor} />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {summary?.totalMembers ?? 0}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            {summary?.activeSubscriptions ?? 0} active subscribers
          </p>
        </div>

        {/* Card 6: Pending Fines */}
        <div
          onClick={() => navigate('/admin/fines')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Unpaid Fines</span>
            <IconCoins size={17} className="text-amber-500" />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight text-amber-600 dark:text-amber-400`}>
            ${(summary?.pendingFinesAmount ?? 0).toFixed(2)}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            {summary?.pendingFinesCount ?? 0} unpaid tickets
          </p>
        </div>

        {/* Card 7: Subscription MRR */}
        <div
          onClick={() => navigate('/admin/reports')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Monthly MRR</span>
            <IconCrown size={17} className="text-indigo-500" />
          </div>
          <div className={`text-2xl font-sans font-bold tracking-tight text-indigo-600 dark:text-indigo-400`}>
            ${(summary?.estimatedMonthlyRecurringRevenue ?? 0).toFixed(2)}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            Stripe recurring
          </p>
        </div>
      </div>

      {/* 2. Operational Alerts (Severe Overdues or Low Stock) */}
      {alerts && (alerts.totalSevereOverdues > 0 || alerts.totalOutOfStock > 0) && (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertOctagon size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Operational Watchlist & Attention Required
              </h3>
            </div>
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
              {alerts.totalSevereOverdues} overdue tickets • {alerts.totalOutOfStock} titles out of stock
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {alerts.severeOverdues.length > 0 && (
              <div className="space-y-1.5 bg-white/60 dark:bg-[#1a202c]/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                  <span>Critical Overdue Loans (&gt; 7 days)</span>
                  <button onClick={() => navigate('/admin/overdue')} className="underline text-[11px] cursor-pointer">
                    Inspect
                  </button>
                </div>
                {alerts.severeOverdues.slice(0, 3).map((item) => (
                  <div key={item.loanCode} className="flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[220px]">
                      <strong>{item.borrowerName}</strong>: {item.bookTitle}
                    </span>
                    <span className="font-mono text-rose-600 font-bold">
                      +{item.daysOverdue}d overdue
                    </span>
                  </div>
                ))}
              </div>
            )}

            {alerts.outOfStockBooks.length > 0 && (
              <div className="space-y-1.5 bg-white/60 dark:bg-[#1a202c]/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Titles with Zero Available Copies</span>
                  <button onClick={() => navigate('/admin/books')} className="underline text-[11px] cursor-pointer">
                    View Catalog
                  </button>
                </div>
                {alerts.outOfStockBooks.slice(0, 3).map((book) => (
                  <div key={book.bookHandle} className="flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[220px]">
                      <span className="font-mono">{book.bookHandle}</span> • {book.title}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      0 / {book.totalCopies} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Quick Action Shortcuts */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${t.cardBg}`}>
        <div>
          <div className={`text-xs font-semibold ${t.titleColor}`}>Quick Desk Actions</div>
          <div className={`text-[11px] ${t.subTextColor}`}>Common circulation and catalog workflows</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/circulation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
          >
            <IconArrowLeftRight size={14} /> New Checkout
          </button>
          <button
            onClick={() => navigate('/admin/circulation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconArrowBackUp size={14} /> Process Return
          </button>
          <button
            onClick={() => navigate('/admin/books')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconPlus size={14} /> Add Title
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconReportAnalytics size={14} /> View Analytics Reports
          </button>
        </div>
      </div>

      {/* 4. Recent Loans Activity Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>Recent Circulation Activity</h3>
            <p className={`text-[11px] ${t.subTextColor}`}>Latest book borrow and return transactions</p>
          </div>
          <button
            onClick={() => navigate('/admin/circulation')}
            className={`text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
          >
            <span>View All Desk Tickets</span>
            <IconArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className={`p-8 text-center text-xs ${t.subTextColor}`}>Loading recent transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${t.tableHead}`}>
                  <th className="py-3 px-4 text-xs font-semibold">Loan Code</th>
                  <th className="py-3 px-4 text-xs font-semibold">Borrower</th>
                  <th className="py-3 px-4 text-xs font-semibold">Book Title</th>
                  <th className="py-3 px-4 text-xs font-semibold">Due Date</th>
                  <th className="py-3 px-4 text-xs font-semibold">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {recentLoans.map((l) => (
                  <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{l.loanCode}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`font-medium ${t.titleColor}`}>{l.userFullName || l.username}</span>
                      <span className={`block text-[10px] font-mono ${t.mutedColor}`}>@{l.username}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`font-medium ${t.titleColor}`}>{l.bookTitle || `Book ID #${l.bookCopyId}`}</span>
                      <span className={`block text-[10px] font-mono ${t.mutedColor}`}>{l.barcode}</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      <span className={l.status === 'OVERDUE' ? 'text-rose-400' : t.titleColor}>{l.dueDate}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          l.status === 'RETURNED'
                            ? t.statusMuted
                            : l.status === 'OVERDUE'
                            ? t.statusOverdue
                            : t.statusBorrowed
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status !== 'RETURNED' ? (
                        <button
                          onClick={() => handleReturnLoan(l.id)}
                          className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${t.secondaryBtn}`}
                        >
                          Return Book
                        </button>
                      ) : (
                        <span className={`text-[11px] ${t.mutedColor}`}>Returned</span>
                      )}
                    </td>
                  </tr>
                ))}
                {recentLoans.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`py-6 text-center text-xs ${t.subTextColor}`}>
                      No circulation loans recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
