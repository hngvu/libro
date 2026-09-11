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
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { LoanResponse } from '@/types/api'

export function DashboardPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [counts, setCounts] = useState({
    books: 0,
    copies: 0,
    overdue: 0,
    activeLoans: 0,
    members: 0,
  })
  const [recentLoans, setRecentLoans] = useState<LoanResponse[]>([])
  const [loadingLoans, setLoadingLoans] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setLoadingLoans(true)
    try {
      const [booksRes, copiesRes, loansRes, usersRes] = await Promise.allSettled([
        api.adminGetBooks({ page: 1, size: 1 }),
        api.adminGetBookCopies({ page: 1, size: 1 }),
        api.adminGetLoans({ page: 1, size: 50 }),
        api.adminGetUsers({ page: 1, size: 1 }),
      ])

      let overdueCount = 0
      let borrowedCount = 0
      let recentList: LoanResponse[] = []

      if (loansRes.status === 'fulfilled') {
        const list = loansRes.value.content || []
        overdueCount = list.filter((l) => l.status === 'OVERDUE').length
        borrowedCount = list.filter((l) => l.status === 'BORROWED').length
        recentList = list.slice(0, 6)
      }

      setCounts({
        books: booksRes.status === 'fulfilled' ? booksRes.value.totalElements || 0 : 0,
        copies: copiesRes.status === 'fulfilled' ? copiesRes.value.totalElements || 0 : 0,
        overdue: overdueCount,
        activeLoans: borrowedCount,
        members: usersRes.status === 'fulfilled' ? usersRes.value.totalElements || 0 : 0,
      })
      setRecentLoans(recentList)
    } catch {
      // Ignore background load error
    } finally {
      setLoadingLoans(false)
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
      {/* 1. Dynamic KPI Overview Cards (Reference SaaS Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Books */}
        <div
          onClick={() => navigate('/admin/books')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Catalog Titles</span>
            <IconBooks size={17} className={t.mutedColor} />
          </div>
          <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {counts.books}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            Catalog bibliography
          </p>
          <div className="mt-2 h-5 w-full opacity-40">
            <svg viewBox="0 0 100 25" fill="none" className="w-full h-full stroke-current text-blue-400">
              <path d="M0 20 Q 25 5, 50 15 T 100 8" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
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
          <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {counts.copies}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            On shelf & in circulation
          </p>
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
          onClick={() => navigate('/admin/circulation')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Active Loans</span>
            <IconClock size={17} className={t.mutedColor} />
          </div>
          <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {counts.activeLoans}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            Borrowed by readers
          </p>
          <div className="mt-2 h-5 w-full opacity-50">
            <svg viewBox="0 0 100 25" fill="none" className="w-full h-full stroke-current text-blue-500">
              <path d="M0 18 Q 30 22, 60 8 T 100 5" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div
          onClick={() => navigate('/admin/overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover} ${
            counts.overdue > 0 ? (isDark ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/30' : 'border-rose-300 bg-rose-50/50') : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${counts.overdue > 0 ? 'text-rose-400 font-semibold' : t.subTextColor}`}>
              Overdue Returns
            </span>
            <IconAlertTriangle size={17} className={counts.overdue > 0 ? 'text-rose-400' : t.mutedColor} />
          </div>
          <div className={`text-3xl font-sans font-bold tracking-tight ${counts.overdue > 0 ? 'text-rose-400' : t.titleColor}`}>
            {counts.overdue}
          </div>
          <p className={`text-[11px] mt-1 truncate ${counts.overdue > 0 ? 'text-rose-400 font-medium' : t.subTextColor}`}>
            {counts.overdue > 0 ? 'Action required' : 'All loans current'}
          </p>
          <div className="mt-2 h-5 w-full opacity-40 flex items-center">
            <div className={`h-1 w-full rounded-full ${counts.overdue > 0 ? 'bg-rose-500' : 'bg-gray-500'}`} />
          </div>
        </div>

        {/* Card 5: Members */}
        <div
          onClick={() => navigate('/admin/members')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${t.cardBg} ${t.cardHover}`}
        >
          <div className={`flex items-center justify-between mb-1.5 ${t.subTextColor}`}>
            <span className="text-xs font-medium">Patrons & Staff</span>
            <IconUsers size={17} className={t.mutedColor} />
          </div>
          <div className={`text-3xl font-sans font-bold tracking-tight ${t.titleColor}`}>
            {counts.members}
          </div>
          <p className={`text-[11px] mt-1 truncate ${t.subTextColor}`}>
            Registered accounts
          </p>
          <div className="mt-2 h-5 w-full opacity-40">
            <svg viewBox="0 0 100 25" fill="none" className="w-full h-full stroke-current text-purple-400">
              <path d="M0 15 Q 35 25, 70 8 T 100 12" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Shortcuts */}
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
            onClick={() => navigate('/admin/members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconUsers size={14} /> Add Patron
          </button>
        </div>
      </div>

      {/* 3. Recent Loans Activity Table */}
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

        {loadingLoans ? (
          <div className={`p-8 text-center text-xs ${t.subTextColor}`}>Loading recent transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${t.tableHead}`}>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Loan Code</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrower</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book Title</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Due Date</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Action</th>
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
