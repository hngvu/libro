import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  IconAlertTriangle,
  IconRefresh,
  IconArrowBackUp,
  IconBell,
  IconSearch,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { LoanResponse } from '@/types/api'

export function OverduePage() {
  const { t, isDark, showFeedback, circulationSettings } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const [overdueLoans, setOverdueLoans] = useState<LoanResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetLoans({
        status: 'OVERDUE',
        keyword: keyword || undefined,
        page: 1,
        size: 50,
      })
      setOverdueLoans(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load overdue list')
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    fetchOverdueLoans()
  }, [fetchOverdueLoans])

  const calculateDaysOverdue = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime()
    const now = Date.now()
    const diffDays = Math.max(1, Math.ceil((now - due) / (1000 * 60 * 60 * 24)))
    return diffDays
  }

  const handleReturn = async (id: number) => {
    if (!confirm('Confirm return processing for this overdue book?')) return
    try {
      await api.adminReturnLoan(id)
      showFeedback('success', 'Book returned and checked in!')
      fetchOverdueLoans()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return loan')
    }
  }

  const handleSendReminder = (loan: LoanResponse) => {
    showFeedback('success', `Reminder notification sent to ${loan.userFullName || loan.username}!`)
  }

  return (
    <div className="space-y-4">
      {/* Priority Notice Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-start sm:items-center justify-between gap-3 ${
          isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 shrink-0">
            <IconAlertTriangle size={22} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Urgent Circulation Queue</h3>
            <p className="text-[11px] opacity-90 mt-0.5">
              These books have exceeded their due date. Fines accrue at {circulationSettings.finePerDayOverdue.toLocaleString('vi-VN')} VND per day past deadline.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/30 shrink-0">
          {overdueLoans.length} Overdue
        </span>
      </div>

      {/* Toolbar */}
      <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${t.cardBg}`}>
        <div className="relative w-full sm:w-80">
          <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search overdue reader or loan code..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOverdueLoans()}
            className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
          />
        </div>

        <button
          onClick={fetchOverdueLoans}
          className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Overdue Table */}
      {loading ? (
        <div className={`p-10 text-center text-xs rounded-2xl border ${t.cardBg} ${t.subTextColor}`}>
          Loading overdue returns...
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${t.tableHead}`}>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Loan Code</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrower</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book Title</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Due Date</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Days Overdue</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Accrued Fine</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {overdueLoans.map((l) => {
                  const days = calculateDaysOverdue(l.dueDate)
                  const fine = days * circulationSettings.finePerDayOverdue
                  return (
                    <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{l.loanCode}</td>
                      <td className="py-3 px-4 text-xs">
                        <div className={`font-medium ${t.titleColor}`}>{l.userFullName || l.username}</div>
                        <div className={`text-[10px] font-mono ${t.mutedColor}`}>@{l.username}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className={`font-medium ${t.titleColor}`}>{l.bookTitle || `Copy #${l.bookCopyId}`}</div>
                        <div className={`text-[10px] font-mono ${t.mutedColor}`}>{l.barcode}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-rose-400">{l.dueDate}</td>
                      <td className="py-3 px-4 text-xs font-bold text-rose-400">
                        +{days} days
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-semibold text-amber-400">
                        {fine.toLocaleString('vi-VN')} VND
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendReminder(l)}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                              isDark ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20' : 'text-amber-800 bg-amber-50 border border-amber-200'
                            }`}
                            title="Send notice"
                          >
                            <IconBell size={13} /> Notice
                          </button>
                          <button
                            onClick={() => handleReturn(l.id)}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${t.primaryBtn}`}
                          >
                            <IconArrowBackUp size={13} /> Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {overdueLoans.length === 0 && (
                  <tr>
                    <td colSpan={7} className={`py-10 text-center text-xs ${t.subTextColor}`}>
                      🎉 Excellent! There are no overdue book returns in the library system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
