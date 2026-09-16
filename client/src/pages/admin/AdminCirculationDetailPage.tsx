import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconBook2,
  IconUser,
  IconCalendarEvent,
  IconClock,
  IconCheck,
  IconRotateClockwise,
  IconScan,
  IconDotsVertical,
  IconX,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { LoanResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateStr
}

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

function formatLoanStatus(status?: string) {
  if (!status) return '—'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function getOverdueDays(dueDateStr?: string) {
  if (!dueDateStr) return 0
  const due = new Date(dueDateStr.split('T')[0])
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function AdminCirculationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const loanId = Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction, setHeaderTitle, circulationSettings } = useAdmin()

  const [loan, setLoan] = useState<LoanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Renew Modal
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [renewDays, setRenewDays] = useState(circulationSettings.defaultRenewDays)
  const [renewLoading, setRenewLoading] = useState(false)

  const loadLoan = useCallback(async () => {
    if (!loanId) return
    setLoading(true)
    try {
      const data = await api.adminGetLoan(loanId)
      setLoan(data)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load loan record')
    } finally {
      setLoading(false)
    }
  }, [loanId, showFeedback])

  useEffect(() => {
    loadLoan()
  }, [loadLoan])

  // Set header title with loan code
  useEffect(() => {
    if (loan?.loanCode) {
      setHeaderTitle(`Loan #${loan.loanCode}`)
    } else {
      setHeaderTitle('Loan')
    }
  }, [loan, setHeaderTitle])

  const handleReturnBook = async () => {
    if (!loan) return
    if (!confirm('Confirm return processing for this loan?')) return
    setActionLoading(true)
    try {
      await api.adminReturnLoan(loan.id)
      showFeedback('success', 'Returned successfully')
      loadLoan()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return book')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRenewLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loan) return
    setRenewLoading(true)
    try {
      await api.adminRenewLoan(loan.id, {
        extensionDays: Number(renewDays),
      })
      showFeedback('success', 'Renewed successfully')
      setRenewModalOpen(false)
      loadLoan()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to renew loan')
    } finally {
      setRenewLoading(false)
    }
  }

  const handleCancelLoan = async () => {
    if (!loan) return
    if (!confirm('Are you sure you want to cancel this loan? The book copy will be returned to inventory.')) return
    setActionLoading(true)
    try {
      await api.adminCancelLoan(loan.id)
      showFeedback('success', 'Cancelled successfully')
      navigate('/admin/circulation')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to cancel loan')
    } finally {
      setActionLoading(false)
    }
  }

  // Manage top header action
  useEffect(() => {
    if (loan && loan.status !== 'RETURNED' && loan.status !== 'CANCELLED') {
      const isMaxRenewals = loan.renewalCount !== undefined && loan.renewalCount >= circulationSettings.maxRenewalsAllowed
      setHeaderAction(
        <div className="flex items-center gap-2">
          {/* Primary Action: Return Book */}
          <button
            type="button"
            onClick={handleReturnBook}
            disabled={actionLoading}
            className={`h-8 px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            Return Book
          </button>

          {/* Secondary More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={actionLoading}
                className={`h-8 w-8 rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.secondaryBtn}`}
                title="More Actions"
              >
                <IconDotsVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled={actionLoading || isMaxRenewals}
                onClick={() => {
                  setRenewDays(circulationSettings.defaultRenewDays)
                  setRenewModalOpen(true)
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <IconRotateClockwise size={14} className="text-purple-400" />
                <span>{isMaxRenewals ? 'Max Renewals Reached' : 'Renew Loan'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={actionLoading}
                onClick={handleCancelLoan}
                className="flex items-center gap-2 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 dark:focus:bg-rose-500/10"
              >
                <IconX size={14} />
                <span>Cancel Loan</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [loan, actionLoading, t.primaryBtn, t.secondaryBtn, setHeaderAction, circulationSettings.defaultRenewDays, circulationSettings.maxRenewalsAllowed])

  // Clear header action and title on unmount
  useEffect(() => {
    return () => {
      setHeaderAction(null)
      setHeaderTitle(null)
    }
  }, [setHeaderAction, setHeaderTitle])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BORROWED':
      case 'ONGOING':
        return isDark
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'OVERDUE':
        return isDark
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      case 'RETURNED':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default:
        return isDark
          ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          : 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const isOverdue = loan ? (loan.status === 'OVERDUE' || (loan.status === 'ONGOING' && getOverdueDays(loan.dueDate) > 0)) : false
  const isReturned = loan?.status === 'RETURNED'
  const isCancelled = loan?.status === 'CANCELLED'

  interface TimelineEvent {
    id: string
    date: string
    time: string
    title: string
    description: string
    type: 'issued' | 'renewed' | 'overdue' | 'returned' | 'cancelled'
  }

  const timelineEvents = useMemo(() => {
    if (!loan) return {}
    const list: TimelineEvent[] = []

    // 1. Issued
    const issuedDt = parseDateTime(loan.createdAt || loan.borrowDate)
    list.push({
      id: 'issued',
      date: formatDate(loan.borrowDate),
      time: issuedDt.time,
      title: 'Loan Issued',
      description: `Checked out copy barcode [${loan.barcode}]`,
      type: 'issued',
    })

    // 2. Renewed
    if (loan.renewalCount !== undefined && loan.renewalCount > 0) {
      const renewDt = parseDateTime(loan.updatedAt || loan.borrowDate)
      list.push({
        id: 'renewed',
        date: renewDt.date !== '—' ? renewDt.date : formatDate(loan.borrowDate),
        time: renewDt.time,
        title: `Renewed (${loan.renewalCount} time${loan.renewalCount > 1 ? 's' : ''})`,
        description: `Extended loan duration via ${loan.renewalCount} renewal request${loan.renewalCount > 1 ? 's' : ''}`,
        type: 'renewed',
      })
    }

    // 3. Overdue Milestone
    if (isOverdue && !isReturned && !isCancelled) {
      list.push({
        id: 'overdue',
        date: formatDate(loan.dueDate),
        time: '',
        title: 'Overdue Milestone',
        description: `Exceeded scheduled return deadline (${getOverdueDays(loan.dueDate)} day${getOverdueDays(loan.dueDate) > 1 ? 's' : ''} overdue)`,
        type: 'overdue',
      })
    }

    // 4. Book Returned
    if (isReturned) {
      const returnDt = parseDateTime(loan.updatedAt || loan.returnDate)
      list.push({
        id: 'returned',
        date: formatDate(loan.returnDate || undefined),
        time: returnDt.time,
        title: 'Book Returned',
        description: 'Returned and checked in to library inventory',
        type: 'returned',
      })
    }

    // 5. Cancelled
    if (isCancelled) {
      const cancelDt = parseDateTime(loan.updatedAt || loan.borrowDate)
      list.push({
        id: 'cancelled',
        date: cancelDt.date !== '—' ? cancelDt.date : formatDate(loan.borrowDate),
        time: cancelDt.time,
        title: 'Loan Cancelled',
        description: 'Loan record was cancelled',
        type: 'cancelled',
      })
    }

    // Group by date
    const groups: Record<string, TimelineEvent[]> = {}
    for (const item of list) {
      if (!groups[item.date]) {
        groups[item.date] = []
      }
      groups[item.date].push(item)
    }
    return groups
  }, [loan, isOverdue, isReturned, isCancelled])

  if (loading) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading loan record details...
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className={`text-sm ${t.subTextColor}`}>Loan record not found or has been removed.</p>
        <button
          onClick={() => navigate('/admin/circulation')}
          className={`px-4 py-2 text-xs font-medium rounded-md border ${t.secondaryBtn}`}
        >
          Back to Circulation Desk
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-12 max-w-4xl animate-in fade-in duration-150">

          {/* Section 1: Ticket Header & Basic Dates */}
          <div className={`p-4 rounded-xl border space-y-3.5 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#22262e]">
              <div>
                <span className={`text-xs block font-mono font-medium ${t.mutedColor}`}>LOAN TICKET CODE</span>
                <span className={`text-lg font-mono font-bold ${t.titleColor}`}>
                  {loan.loanCode}
                </span>
              </div>
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${getStatusBadge(loan.status)}`}>
                {formatLoanStatus(loan.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${t.subTextColor}`}>
                  <IconCalendarEvent size={15} className="text-blue-500" /> Borrow Date
                </span>
                <p className={`text-sm font-mono font-medium ${t.titleColor}`}>
                  {formatDate(loan.borrowDate)}
                </p>
              </div>

              <div className="space-y-1">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${loan.status === 'OVERDUE' ? 'text-rose-500 font-semibold' : t.subTextColor}`}>
                  <IconClock size={15} className={loan.status === 'OVERDUE' ? 'text-rose-500' : 'text-[#b46b00] dark:text-amber-400'} /> Due Date
                </span>
                <p className={`text-sm font-mono font-medium ${loan.status === 'OVERDUE' ? 'text-rose-500 font-bold' : t.titleColor}`}>
                  {formatDate(loan.dueDate)}
                </p>
              </div>

              <div className="space-y-1">
                <span className={`text-xs font-medium flex items-center gap-1.5 ${t.subTextColor}`}>
                  <IconCheck size={15} className="text-emerald-500" /> Return Date
                </span>
                <p className={`text-sm font-mono font-medium ${isReturned ? 'text-emerald-500' : t.mutedColor}`}>
                  {loan.returnDate ? formatDate(loan.returnDate) : 'Pending Return'}
                </p>
              </div>
            </div>

            {loan.renewalCount !== undefined && loan.renewalCount > 0 && (
              <div className={`pt-2 border-t text-xs flex items-center gap-1.5 ${isDark ? 'border-[#22262e]' : 'border-gray-100'} ${t.subTextColor}`}>
                <IconRotateClockwise size={14} className="text-purple-400" />
                <span>Renewed <strong>{loan.renewalCount}</strong> time{loan.renewalCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Section 2: Borrower Patron Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${t.titleColor}`}>
                <IconUser size={16} /> Borrower Patron
              </h3>
            </div>

            <div className="flex items-center gap-3.5">
              {loan.userId ? (
                <Link
                  to={`/admin/members/${loan.userId}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border transition-opacity hover:opacity-80 ${
                    isDark ? 'bg-[#252a34] text-gray-300 border-[#3e4756]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {(loan.userFullName || loan.userEmail || 'U').charAt(0).toUpperCase()}
                </Link>
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                    isDark ? 'bg-[#252a34] text-gray-300 border-[#3e4756]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {(loan.userFullName || loan.userEmail || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                {loan.userId ? (
                  <Link
                    to={`/admin/members/${loan.userId}`}
                    className={`font-semibold text-sm truncate hover:text-blue-600 dark:hover:text-blue-400 block transition-colors ${t.titleColor}`}
                  >
                    {loan.userFullName || `User #${loan.userId}`}
                  </Link>
                ) : (
                  <p className={`font-semibold text-sm truncate ${t.titleColor}`}>
                    {loan.userFullName || `User #${loan.userId}`}
                  </p>
                )}
                <p className={`text-xs mt-0.5 truncate ${t.subTextColor}`}>
                  {loan.userEmail || 'No email provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Book & Physical Copy Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${t.titleColor}`}>
                <IconBook2 size={16} /> Book Copy
              </h3>
            </div>

            <div className="flex items-start gap-3.5">
              {loan.bookId ? (
                <Link
                  to={`/admin/books/${loan.bookId}`}
                  className={`w-12 h-16 rounded-[2px] border overflow-hidden shrink-0 flex items-center justify-center transition-opacity hover:opacity-85 ${
                    isDark ? 'border-[#333a48] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  {loan.bookCover ? (
                    <img
                      src={loan.bookCover}
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
                  {loan.bookCover ? (
                    <img
                      src={loan.bookCover}
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
                {loan.bookId ? (
                  <Link
                    to={`/admin/books/${loan.bookId}`}
                    className={`font-semibold text-sm truncate hover:text-blue-600 dark:hover:text-blue-400 block transition-colors ${t.titleColor}`}
                  >
                    {loan.bookTitle || `Book ID #${loan.bookId || loan.bookCopyId}`}
                  </Link>
                ) : (
                  <p className={`font-semibold text-sm truncate ${t.titleColor}`}>
                    {loan.bookTitle || `Book ID #${loan.bookId || loan.bookCopyId}`}
                  </p>
                )}

                {loan.authors && loan.authors.length > 0 && (
                  <p className={`text-xs ${t.subTextColor} truncate`}>
                    {loan.authors.join(', ')}
                  </p>
                )}

                {loan.barcode && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${t.subTextColor} pt-0.5`}>
                    <IconScan size={14} className="shrink-0 opacity-75" />
                    <span>{loan.barcode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Circulation Timeline */}
          <div className={`p-4 rounded-xl border space-y-4 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#22262e]">
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${t.titleColor}`}>
                <IconClock size={16} /> Circulation Timeline
              </h3>
            </div>

            <div className="space-y-5 pt-1">
              {Object.entries(timelineEvents).map(([date, dateEvents]) => (
                <div key={date} className="space-y-2.5">
                  {/* Date above dot */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded border ${
                      isDark ? 'bg-[#181a20] border-[#2c323e] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}>
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-[#22262e]" />
                  </div>

                  {/* Events under this date */}
                  <div className="relative pl-5 space-y-4 ml-1.5 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-200 dark:before:bg-[#2c323e]">
                    {dateEvents.map((ev) => (
                      <div key={ev.id} className="relative">
                        <div
                          className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#1a1d24] ${
                            ev.type === 'returned'
                              ? 'bg-emerald-600 dark:bg-emerald-400'
                              : ev.type === 'overdue'
                              ? 'bg-rose-500'
                              : ev.type === 'cancelled'
                              ? 'bg-gray-400 dark:bg-gray-600'
                              : 'bg-gray-900 dark:bg-gray-100'
                          }`}
                        />
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={`text-sm font-medium ${
                            ev.type === 'returned'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : ev.type === 'overdue'
                              ? 'text-rose-500 font-semibold'
                              : ev.type === 'cancelled'
                              ? t.mutedColor
                              : t.titleColor
                          }`}>
                            {ev.title}
                          </span>
                          {ev.time ? (
                            <span className={`text-xs font-mono shrink-0 ${t.subTextColor}`}>
                              {ev.time}
                            </span>
                          ) : null}
                        </div>
                        <p className={`text-xs mt-0.5 ${t.mutedColor}`}>
                          {ev.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/* Modal: Renew Loan */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent
          onClose={() => setRenewModalOpen(false)}
          className={`sm:max-w-sm rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}
        >
          <DialogHeader className="mb-3">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Extend Loan Period
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRenewLoan} className="space-y-4 pt-1">
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${t.cardBg}`}>
              <p className={`font-semibold text-sm ${t.titleColor}`}>{loan.bookTitle}</p>
              <p className={`font-mono text-xs ${t.mutedColor}`}>Ticket: {loan.loanCode}</p>
              <p className={`text-xs ${t.subTextColor}`}>Current Due Date: <strong className={t.titleColor}>{formatDate(loan.dueDate)}</strong></p>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Days to Extend *
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={renewDays}
                onChange={(e) => setRenewDays(parseInt(e.target.value) || 1)}
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none ${t.inputBg}`}
              />
              <span className={`text-xs block mt-1 ${t.mutedColor}`}>
                Default extension: {circulationSettings.defaultRenewDays} days
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setRenewModalOpen(false)}
                className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renewLoading}
                className={`h-9 px-5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
              >
                {renewLoading ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
