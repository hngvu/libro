import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch,
  IconCheck,
  IconX,
  IconRefresh,
  IconBooks,
  IconClock,
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { ReservationResponse, ReservationStatus } from '@/types/api'

export function ReservationsPage() {
  const { t, isDark, showFeedback } = useAdmin()

  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Filters
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetReservations({
        keyword: keyword.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: page - 1,
        size: 10,
      })
      setReservations(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch {
      showFeedback('error', 'Failed to load reservations list.')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, page, showFeedback])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleMarkReady = async (id: number) => {
    setActionLoading(id)
    try {
      await api.adminMarkReservationReady(id)
      showFeedback('success', 'Assigned available copy and marked hold as READY FOR PICKUP!')
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to mark reservation ready. No available copies?')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFulfill = async (id: number) => {
    setActionLoading(id)
    try {
      await api.adminFulfillReservation(id)
      showFeedback('success', 'Reservation fulfilled and converted into active checkout loan!')
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to fulfill reservation checkout.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: number) => {
    const reason = prompt('Reason for cancelling this reservation (optional):', 'Cancelled by librarian')
    if (reason === null) return // User cancelled prompt

    setActionLoading(id)
    try {
      await api.adminCancelReservation(id, reason)
      showFeedback('success', 'Reservation cancelled and queue updated.')
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to cancel reservation.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleProcessExpired = async () => {
    setLoading(true)
    try {
      const res = await api.adminProcessExpiredReservations()
      showFeedback('success', `Processed expiry check: ${res.expiredCount} hold(s) expired.`)
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to run hold expiry sweep.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar & Filter Header */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-center justify-between gap-3 shadow-xs ${t.cardBg}`}>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search patron, book, or RES code..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
              className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['ALL', 'PENDING', 'READY_FOR_PICKUP', 'FULFILLED', 'CANCELLED', 'EXPIRED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st)
                  setPage(1)
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === st
                    ? t.primaryBtn
                    : isDark
                      ? 'bg-[#1a1f2c] text-gray-400 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'READY_FOR_PICKUP'
                    ? 'Ready'
                    : st === 'PENDING'
                      ? 'In Queue'
                      : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={handleProcessExpired}
            title="Sweep expired pickup deadlines"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${t.secondaryBtn}`}
          >
            <IconClock size={14} /> Sweep Expired
          </button>
          <button
            type="button"
            onClick={() => fetchReservations()}
            disabled={loading}
            title="Refresh list"
            className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-center cursor-pointer transition-colors ${t.secondaryBtn}`}
          >
            <IconRefresh size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${t.tableHead}`}>
                <th className="py-3 px-4 text-xs font-semibold">Hold Code</th>
                <th className="py-3 px-4 text-xs font-semibold">Patron Details</th>
                <th className="py-3 px-4 text-xs font-semibold">Reserved Book Title</th>
                <th className="py-3 px-4 text-xs font-semibold text-center">Queue / Hold</th>
                <th className="py-3 px-4 text-xs font-semibold">Requested At</th>
                <th className="py-3 px-4 text-xs font-semibold">Pickup Deadline</th>
                <th className="py-3 px-4 text-xs font-semibold">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {loading && reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-12 text-center text-xs ${t.subTextColor}`}>
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading reservations from database...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-12 text-center text-xs ${t.subTextColor}`}>
                    No reservations found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const isActionBusy = actionLoading === r.id
                  return (
                    <tr key={r.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-blue-400">
                        {r.reservationCode}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className={`font-bold ${t.titleColor}`}>{r.userFullName || 'Unknown Patron'}</div>
                        <div className={`text-[11px] font-mono ${t.subTextColor}`}>{r.userEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-2.5">
                          {r.bookCover ? (
                            <img
                              src={r.bookCover}
                              alt={r.bookTitle}
                              className="w-8 h-11 object-cover rounded-md shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-8 h-11 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <IconBooks size={16} className="text-blue-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`font-bold truncate max-w-xs ${t.titleColor}`}>{r.bookTitle}</p>
                            {r.barcode && (
                              <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                                Copy: {r.barcode} ({r.location || 'Shelf'})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-center">
                        {r.status === 'PENDING' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-400/15 text-amber-400 border border-amber-400/30">
                            Queue #{r.queuePosition || 1}
                          </span>
                        ) : r.status === 'READY_FOR_PICKUP' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
                            On Hold Shelf
                          </span>
                        ) : (
                          <span className={`text-[11px] font-mono ${t.subTextColor}`}>-</span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-xs font-mono ${t.subTextColor}`}>
                        {r.reservedAt ? r.reservedAt.split('T')[0] : '-'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {r.pickupDeadline ? (
                          <span
                            className={`font-semibold ${
                              new Date(r.pickupDeadline) < new Date() && r.status === 'READY_FOR_PICKUP'
                                ? 'text-red-400 font-bold'
                                : t.titleColor
                            }`}
                          >
                            {r.pickupDeadline}
                          </span>
                        ) : (
                          <span className={`${t.subTextColor}`}>-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            r.status === 'READY_FOR_PICKUP'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : r.status === 'PENDING'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : r.status === 'FULFILLED'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : r.status === 'EXPIRED'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : t.statusMuted
                          }`}
                        >
                          {r.status === 'READY_FOR_PICKUP'
                            ? 'Ready for Pickup'
                            : r.status === 'PENDING'
                              ? 'Waiting in Queue'
                              : r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ready Button for Pending holds */}
                          {r.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleMarkReady(r.id)}
                              disabled={isActionBusy}
                              className={`h-7 px-2.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${t.primaryBtn} ${
                                isActionBusy ? 'opacity-50' : ''
                              }`}
                            >
                              {isActionBusy ? '...' : 'Mark Ready'}
                            </button>
                          )}

                          {/* Fulfill / Check out button when Ready */}
                          {r.status === 'READY_FOR_PICKUP' && (
                            <button
                              type="button"
                              onClick={() => handleFulfill(r.id)}
                              disabled={isActionBusy}
                              className={`h-7 px-2.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white ${
                                isActionBusy ? 'opacity-50' : ''
                              }`}
                            >
                              {isActionBusy ? '...' : 'Check Out'}
                            </button>
                          )}

                          {/* Cancel hold button */}
                          {(r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP') && (
                            <button
                              type="button"
                              onClick={() => handleCancel(r.id)}
                              disabled={isActionBusy}
                              title="Cancel hold request"
                              className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <IconX size={15} />
                            </button>
                          )}

                          {/* Fulfilled marker */}
                          {r.status === 'FULFILLED' && (
                            <span className="text-[11px] flex items-center gap-1 text-blue-400 font-bold">
                              <IconCheck size={14} /> Loan Created
                            </span>
                          )}

                          {/* Expired marker */}
                          {r.status === 'EXPIRED' && (
                            <span className="text-[11px] flex items-center gap-1 text-rose-400 font-semibold">
                              <IconAlertCircle size={14} /> Expired
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${t.subTextColor} ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
          <span>
            Total: <strong>{totalElements}</strong> reservations (Page {page} of {totalPages})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`p-1.5 rounded-lg border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${t.secondaryBtn}`}
            >
              <IconChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`p-1.5 rounded-lg border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${t.secondaryBtn}`}
            >
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

