import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconBook2,
  IconUser,
  IconCalendarEvent,
  IconClock,
  IconCheck,
  IconRotateClockwise,
  IconBarcode,
  IconExternalLink,
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

export function AdminCirculationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const loanId = Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction, circulationSettings } = useAdmin()

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
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRenewDays(circulationSettings.defaultRenewDays)
              setRenewModalOpen(true)
            }}
            disabled={actionLoading}
            className={`h-8 px-3.5 text-xs font-semibold rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.secondaryBtn}`}
          >
            Renew Loan
          </button>
          <button
            type="button"
            onClick={handleReturnBook}
            disabled={actionLoading}
            className={`h-8 px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            Return Book
          </button>
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [loan, actionLoading, t.primaryBtn, t.secondaryBtn, setHeaderAction, circulationSettings.defaultRenewDays])

  // Clear header action on unmount
  useEffect(() => {
    return () => setHeaderAction(null)
  }, [setHeaderAction])

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

  const isOverdue = loan.status === 'OVERDUE'
  const isReturned = loan.status === 'RETURNED'
  const isCancelled = loan.status === 'CANCELLED'

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0 items-start">
        {/* Left Column (8/12): Main Loan Information */}
        <div className="lg:col-span-8 space-y-5 w-full lg:max-w-[90%] min-w-0">
          
          {/* Section 1: Ticket Header & Timeline */}
          <div className={`p-4 rounded-xl border space-y-3.5 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#22262e]">
              <div>
                <span className={`text-[11px] block font-mono ${t.mutedColor}`}>LOAN TICKET CODE</span>
                <span className={`text-base font-mono font-bold ${t.titleColor}`}>
                  {loan.loanCode}
                </span>
              </div>
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border uppercase ${getStatusBadge(loan.status)}`}>
                {loan.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <span className={`text-[11px] flex items-center gap-1.5 ${t.subTextColor}`}>
                   <IconCalendarEvent size={14} className="text-blue-500" /> Borrow Date
                </span>
                <p className={`text-sm font-mono font-medium ${t.titleColor}`}>
                  {formatDate(loan.borrowDate)}
                </p>
              </div>

              <div className="space-y-1">
                <span className={`text-[11px] flex items-center gap-1.5 ${isOverdue ? 'text-rose-500 font-semibold' : t.subTextColor}`}>
                  <IconClock size={14} className={isOverdue ? 'text-rose-500' : 'text-amber-500'} /> Due Date
                </span>
                <p className={`text-sm font-mono font-medium ${isOverdue ? 'text-rose-500 font-bold' : t.titleColor}`}>
                  {formatDate(loan.dueDate)}
                </p>
              </div>

              <div className="space-y-1">
                <span className={`text-[11px] flex items-center gap-1.5 ${t.subTextColor}`}>
                  <IconCheck size={14} className="text-emerald-500" /> Return Date
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
              <h3 className={`font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 ${t.titleColor}`}>
                <IconUser size={15} /> Borrower Patron
              </h3>
              {loan.userId && (
                <Link
                  to={`/admin/members/${loan.userId}`}
                  className={`text-xs font-medium inline-flex items-center gap-1 hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  <span>View Member</span>
                  <IconExternalLink size={12} />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                isDark ? 'bg-[#252a34] text-gray-300 border-[#3e4756]' : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}>
                {(loan.userFullName || loan.userEmail || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                {loan.userId ? (
                  <Link
                    to={`/admin/members/${loan.userId}`}
                    className={`font-semibold text-sm truncate hover:underline hover:text-blue-600 dark:hover:text-blue-400 block ${t.titleColor}`}
                  >
                    {loan.userFullName || `User #${loan.userId}`}
                  </Link>
                ) : (
                  <p className={`font-semibold text-sm truncate ${t.titleColor}`}>
                    {loan.userFullName || `User #${loan.userId}`}
                  </p>
                )}
                <p className={`text-xs font-mono mt-0.5 truncate ${t.subTextColor}`}>
                  {loan.userEmail || 'No email provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Book & Physical Copy Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${t.cardBg}`}>
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <h3 className={`font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 ${t.titleColor}`}>
                <IconBook2 size={15} /> Book & Physical Copy
              </h3>
              {loan.bookId && (
                <Link
                  to={`/admin/books/${loan.bookId}`}
                  className={`text-xs font-medium inline-flex items-center gap-1 hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  <span>View Book</span>
                  <IconExternalLink size={12} />
                </Link>
              )}
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`w-12 h-16 rounded-[2px] border overflow-hidden shrink-0 flex items-center justify-center ${
                isDark ? 'border-[#333a48] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
              }`}>
                <IconBook2 size={24} className={t.mutedColor} />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <p className={`font-semibold text-sm ${t.titleColor}`}>
                  {loan.bookTitle || `Book ID #${loan.bookId || loan.bookCopyId}`}
                </p>
                <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                    isDark ? 'bg-[#181a20] border-[#2c323e] text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    <IconBarcode size={13} />
                    {loan.barcode}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4/12): Quick Actions & Overview */}
        <div className="lg:col-span-4 space-y-4 w-full lg:max-w-[280px]">
          {/* Actions Box */}
          <div className={`p-4 rounded-xl border space-y-3 ${t.cardBg}`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${t.subTextColor}`}>
              Quick Actions
            </h4>

            {!isReturned && !isCancelled ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleReturnBook}
                  disabled={actionLoading}
                  className={`w-full h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs ${t.primaryBtn}`}
                >
                  Return Book
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenewDays(circulationSettings.defaultRenewDays)
                    setRenewModalOpen(true)
                  }}
                  disabled={actionLoading}
                  className={`w-full h-9 px-4 text-xs font-medium rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
                >
                  Renew Loan
                </button>
                <button
                  type="button"
                  onClick={handleCancelLoan}
                  disabled={actionLoading}
                  className="w-full h-9 px-4 text-xs font-medium rounded-md transition-colors cursor-pointer text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  Cancel Loan
                </button>
              </div>
            ) : (
              <div className={`p-3 rounded-lg text-xs text-center ${isDark ? 'bg-[#181a20] text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                {isReturned ? 'This loan has been completed and returned.' : 'This loan was cancelled.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div
        className={`pt-5 mt-6 border-t flex items-center justify-between gap-4 ${
          isDark ? 'border-[#22262e]' : 'border-gray-200'
        }`}
      >
        <button
          type="button"
          onClick={() => navigate('/admin/circulation')}
          className={`h-9 px-4 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer border ${t.secondaryBtn}`}
        >
          Back to Circulation Desk
        </button>

        {!isReturned && !isCancelled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRenewDays(circulationSettings.defaultRenewDays)
                setRenewModalOpen(true)
              }}
              disabled={actionLoading}
              className={`h-9 px-4 text-xs font-medium rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
            >
              Renew Loan
            </button>
            <button
              type="button"
              onClick={handleReturnBook}
              disabled={actionLoading}
              className={`h-9 px-5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs ${t.primaryBtn}`}
            >
              Return Book
            </button>
          </div>
        )}
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
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${t.cardBg}`}>
              <p className={`font-semibold ${t.titleColor}`}>{loan.bookTitle}</p>
              <p className={`font-mono text-[11px] ${t.mutedColor}`}>Ticket: {loan.loanCode}</p>
              <p className={`text-[11px] ${t.subTextColor}`}>Current Due Date: <strong className={t.titleColor}>{formatDate(loan.dueDate)}</strong></p>
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
              <span className={`text-[11px] block mt-1 ${t.mutedColor}`}>
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
