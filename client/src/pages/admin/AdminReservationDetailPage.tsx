import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconBook2,
  IconUser,
  IconCalendarEvent,
  IconClock,
  IconCheck,
  IconScan,
  IconX,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { ReservationResponse, ReservationStatus } from '@/types/api'

function parseDateTime(dateStr?: string | null) {
  if (!dateStr) return { date: '—', time: '' }
  try {
    if (dateStr.includes('T')) {
      const [dPart, tPart] = dateStr.split('T')
      const dPieces = dPart.split('-')
      const formattedDate = dPieces.length === 3 ? `${dPieces[2]}/${dPieces[1]}/${dPieces[0]}` : dPart
      const timePieces = tPart ? tPart.split(':') : []
      const formattedTime = timePieces.length >= 2 ? `${timePieces[0]}:${timePieces[1]}` : ''
      return { date: formattedDate, time: formattedTime }
    } else {
      const parts = dateStr.split('-')
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
      return { date: formattedDate, time: '' }
    }
  } catch {
    return { date: dateStr, time: '' }
  }
}

function formatDate(dateStr?: string) {
  return parseDateTime(dateStr).date
}

function formatReservationStatus(status?: ReservationStatus | string) {
  if (!status) return '—'
  switch (status) {
    case 'READY_FOR_PICKUP':
      return 'Ready for Pickup'
    case 'PENDING':
      return 'Pending'
    case 'FULFILLED':
      return 'Fulfilled'
    case 'CANCELLED':
      return 'Cancelled'
    case 'EXPIRED':
      return 'Expired'
    default: {
      const s = status.toLowerCase()
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
  }
}

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const resId = Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction, setHeaderTitle } = useAdmin()

  const [reservation, setReservation] = useState<ReservationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadReservation = useCallback(async () => {
    if (!resId) return
    setLoading(true)
    try {
      const data = await api.adminGetReservation(resId)
      setReservation(data)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load reservation record')
    } finally {
      setLoading(false)
    }
  }, [resId, showFeedback])

  useEffect(() => {
    loadReservation()
  }, [loadReservation])

  // Set header title with reservation code
  useEffect(() => {
    if (reservation?.reservationCode) {
      setHeaderTitle(`Reservation #${reservation.reservationCode}`)
    } else {
      setHeaderTitle('Reservation')
    }
  }, [reservation, setHeaderTitle])

  const handleMarkReady = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      await api.adminMarkReservationReady(reservation.id)
      showFeedback('success', 'Assigned available copy and marked hold as READY FOR PICKUP!')
      loadReservation()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to mark reservation ready. No available copies?')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFulfill = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      await api.adminFulfillReservation(reservation.id)
      showFeedback('success', 'Reservation fulfilled and converted into active checkout loan!')
      loadReservation()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to fulfill reservation checkout.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!reservation) return
    const reason = prompt('Reason for cancelling this reservation (optional):', 'Cancelled by librarian')
    if (reason === null) return

    setActionLoading(true)
    try {
      await api.adminCancelReservation(reservation.id, reason)
      showFeedback('success', 'Reservation cancelled and queue updated.')
      loadReservation()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to cancel reservation.')
    } finally {
      setActionLoading(false)
    }
  }

  // Manage top header action
  useEffect(() => {
    if (!reservation) {
      setHeaderAction(null)
      return
    }

    if (reservation.status === 'PENDING') {
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={actionLoading}
            className="h-8 px-3.5 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-60 bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-500"
          >
            Cancel Hold
          </button>
          <button
            type="button"
            onClick={handleMarkReady}
            disabled={actionLoading}
            className={`h-8 px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            Mark Ready
          </button>
        </div>
      )
    } else if (reservation.status === 'READY_FOR_PICKUP') {
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={actionLoading}
            className="h-8 px-3.5 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-60 bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-500"
          >
            Cancel Hold
          </button>
          <button
            type="button"
            onClick={handleFulfill}
            disabled={actionLoading}
            className={`h-8 px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            Check Out (Fulfill)
          </button>
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [reservation, actionLoading, t.primaryBtn, isDark, setHeaderAction])

  // Clear header action and title on unmount
  useEffect(() => {
    return () => {
      setHeaderAction(null)
      setHeaderTitle(null)
    }
  }, [setHeaderAction, setHeaderTitle])

  const getStatusBadge = (status?: ReservationStatus | string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return isDark
          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PENDING':
        return isDark
          ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
          : 'bg-[#fff8eb] text-[#b46b00] border-[#f2be54]'
      case 'FULFILLED':
        return isDark
          ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CANCELLED':
      case 'EXPIRED':
        return isDark
          ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return isDark
          ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
          : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading reservation details...
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className={`text-sm ${t.subTextColor}`}>Reservation record not found or has been removed.</p>
        <button
          onClick={() => navigate('/admin/circulation/reservations')}
          className={`px-4 py-2 text-xs font-medium rounded-md border ${t.secondaryBtn}`}
        >
          Back to Reservations
        </button>
      </div>
    )
  }

  const isPending = reservation.status === 'PENDING'
  const isReady = reservation.status === 'READY_FOR_PICKUP'
  const isFulfilled = reservation.status === 'FULFILLED'

  return (
    <div className="space-y-5 pb-12 max-w-4xl animate-in fade-in duration-150">

          {/* Section 1: Ticket Header & Timeline */}
          <div className={`p-4 rounded-xl border space-y-3.5 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#22262e]">
              <div>
                <span className={`text-xs block font-mono font-medium ${t.mutedColor}`}>HOLD TICKET CODE</span>
                <span className={`text-lg font-mono font-bold ${t.titleColor}`}>
                  {reservation.reservationCode}
                </span>
              </div>
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${getStatusBadge(reservation.status)}`}>
                {formatReservationStatus(reservation.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${t.subTextColor}`}>
                  <IconCalendarEvent size={15} className="text-blue-500" /> Requested Date
                </span>
                <p className={`text-sm font-mono font-medium ${t.titleColor}`}>
                  {parseDateTime(reservation.reservedAt).time
                    ? `${parseDateTime(reservation.reservedAt).date} ${parseDateTime(reservation.reservedAt).time}`
                    : parseDateTime(reservation.reservedAt).date}
                </p>
              </div>

              <div className="space-y-1">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${isReady ? 'text-[#b46b00] dark:text-amber-400 font-semibold' : t.subTextColor}`}>
                  <IconClock size={15} className={isReady ? 'text-[#b46b00] dark:text-amber-400' : 'text-blue-500'} /> Pickup Deadline
                </span>
                <p className={`text-sm font-mono font-medium ${isReady ? 'text-[#b46b00] dark:text-amber-400 font-bold' : t.titleColor}`}>
                  {formatDate(reservation.pickupDeadline)}
                </p>
              </div>

              <div className="space-y-1">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${t.subTextColor}`}>
                  <IconCheck size={15} className="text-emerald-500" /> Queue Status
                </span>
                <p className="text-sm font-mono font-medium">
                  {isPending ? (
                    <span className="text-[#b46b00] dark:text-amber-400 font-semibold">#{reservation.queuePosition || 1} in queue</span>
                  ) : isReady ? (
                    <span className="text-emerald-500 font-semibold">Ready at counter</span>
                  ) : isFulfilled ? (
                    <span className="text-emerald-500 font-semibold">Fulfilled</span>
                  ) : (
                    <span className={t.mutedColor}>{formatReservationStatus(reservation.status)}</span>
                  )}
                </p>
              </div>
            </div>

            {reservation.fulfilledAt && (
              <div className={`pt-2 border-t text-xs flex items-center gap-1.5 ${isDark ? 'border-[#22262e]' : 'border-gray-100'} ${t.subTextColor}`}>
                <IconCheck size={14} className="text-emerald-400" />
                <span>Fulfilled on: <strong>{formatDate(reservation.fulfilledAt)}</strong></span>
              </div>
            )}
          </div>

          {/* Section 2: Borrower Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${t.titleColor}`}>
                <IconUser size={16} /> Borrower
              </h3>
            </div>

            <div className="flex items-center gap-3.5">
              {reservation.userId ? (
                <Link
                  to={`/admin/members/${reservation.userId}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border transition-opacity hover:opacity-80 ${
                    isDark ? 'bg-[#252a34] text-gray-300 border-[#3e4756]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {(reservation.userFullName || reservation.userEmail || 'U').charAt(0).toUpperCase()}
                </Link>
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                    isDark ? 'bg-[#252a34] text-gray-300 border-[#3e4756]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {(reservation.userFullName || reservation.userEmail || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                {reservation.userId ? (
                  <Link
                    to={`/admin/members/${reservation.userId}`}
                    className={`font-semibold text-sm truncate hover:text-blue-600 dark:hover:text-blue-400 block transition-colors ${t.titleColor}`}
                  >
                    {reservation.userFullName || `User #${reservation.userId}`}
                  </Link>
                ) : (
                  <p className={`font-semibold text-sm truncate ${t.titleColor}`}>
                    {reservation.userFullName || `User #${reservation.userId}`}
                  </p>
                )}
                <p className={`text-xs mt-0.5 truncate ${t.subTextColor}`}>
                  {reservation.userEmail || 'No email provided'}
                </p>
                {reservation.userPhone && (
                  <p className={`text-xs mt-0.5 ${t.mutedColor}`}>
                    Tel: {reservation.userPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Book Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${t.titleColor}`}>
                <IconBook2 size={16} /> Reserved Book
              </h3>
            </div>

            <div className="flex items-start gap-3.5">
              {reservation.bookId ? (
                <Link
                  to={`/admin/books/${reservation.bookId}`}
                  className={`w-12 h-16 rounded-[2px] border overflow-hidden shrink-0 flex items-center justify-center transition-opacity hover:opacity-85 ${
                    isDark ? 'border-[#333a48] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  {reservation.bookCover ? (
                    <img
                      src={reservation.bookCover}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <IconBook2 size={24} className={t.mutedColor} />
                  )}
                </Link>
              ) : (
                <div
                  className={`w-12 h-16 rounded-[2px] border overflow-hidden shrink-0 flex items-center justify-center ${
                    isDark ? 'border-[#333a48] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  {reservation.bookCover ? (
                    <img
                      src={reservation.bookCover}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <IconBook2 size={24} className={t.mutedColor} />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                {reservation.bookId ? (
                  <Link
                    to={`/admin/books/${reservation.bookId}`}
                    className={`font-semibold text-sm truncate hover:text-blue-600 dark:hover:text-blue-400 block transition-colors ${t.titleColor}`}
                  >
                    {reservation.bookTitle || `Book ID #${reservation.bookId}`}
                  </Link>
                ) : (
                  <p className={`font-semibold text-sm truncate ${t.titleColor}`}>
                    {reservation.bookTitle || `Book ID #${reservation.bookId}`}
                  </p>
                )}

                {reservation.authors && reservation.authors.length > 0 && (
                  <p className={`text-xs ${t.subTextColor} truncate`}>
                    {reservation.authors.join(', ')}
                  </p>
                )}

                {reservation.barcode && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${t.subTextColor} pt-0.5`}>
                    <IconScan size={14} className="shrink-0 opacity-75" />
                    <span>{reservation.barcode}</span>
                    {reservation.location ? <span className="ml-1 text-[11px] font-normal opacity-80">({reservation.location})</span> : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Cancellation Reason (If cancelled) */}
          {reservation.cancellationReason && (
            <div className={`p-4 rounded-xl border space-y-1.5 border-rose-500/30 bg-rose-500/5 ${t.cardBg}`}>
              <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                <IconX size={14} /> Cancellation Reason
              </span>
              <p className={`text-xs ${t.titleColor}`}>
                {reservation.cancellationReason}
              </p>
            </div>
          )}
    </div>
  )
}
