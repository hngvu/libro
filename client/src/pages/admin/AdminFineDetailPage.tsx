import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconArrowLeft,
  IconCheck,
  IconPrinter,
  IconExternalLink,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { FineResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '—'
  try {
    const [dPart, tPart] = dateStr.includes('T') ? dateStr.split('T') : [dateStr, '']
    const parts = dPart.split('-')
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dPart
    const formattedTime = tPart ? tPart.slice(0, 5) : ''
    return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate
  } catch {
    return dateStr
  }
}

export function AdminFineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction, setHeaderTitle, circulationSettings } = useAdmin()

  const [fine, setFine] = useState<FineResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modals
  const [collectDialogOpen, setCollectDialogOpen] = useState(false)
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false)
  const [waiveReason, setWaiveReason] = useState('')

  const fetchFineDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await api.adminGetFine(Number(id))
      setFine(data)
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to load fine record')
    } finally {
      setLoading(false)
    }
  }, [id, showFeedback])

  useEffect(() => {
    fetchFineDetail()
  }, [fetchFineDetail])

  useEffect(() => {
    if (fine?.fineCode) {
      setHeaderTitle(`Penalty • #${fine.fineCode}`)
    } else if (fine?.id) {
      setHeaderTitle(`Penalty • #FN-${fine.id}`)
    } else {
      setHeaderTitle('Penalty')
    }
  }, [fine, setHeaderTitle])

  const handleCollectCash = async () => {
    if (!fine) return
    setActionLoading(true)
    try {
      await api.adminCollectFineCash(fine.id)
      showFeedback('success', 'Fee payment recorded via Cash and receipt issued!')
      setCollectDialogOpen(false)
      fetchFineDetail()
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to process cash payment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWaive = async () => {
    if (!fine) return
    if (!waiveReason.trim()) {
      showFeedback('error', 'Please provide a waiver reason')
      return
    }
    setActionLoading(true)
    try {
      await api.adminWaiveFine(fine.id, waiveReason.trim())
      showFeedback('success', 'Fine has been waived')
      setWaiveDialogOpen(false)
      setWaiveReason('')
      fetchFineDetail()
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to waive fine')
    } finally {
      setActionLoading(false)
    }
  }

  // Header Actions (Exact AdminPlanDetailPage style)
  useEffect(() => {
    if (!fine) {
      setHeaderAction(null)
      return
    }

    const isPending = fine.status === 'PENDING'

    setHeaderAction(
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin/fines/penalties')}
          className={`h-8 min-w-[75px] px-3.5 text-xs font-semibold rounded-md border inline-flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${t.secondaryBtn}`}
        >
          <IconArrowLeft size={13} />
          <span>Penalties</span>
        </button>

        {isPending && (
          <>
            <button
              type="button"
              onClick={() => {
                setWaiveReason('')
                setWaiveDialogOpen(true)
              }}
              className={`h-8 min-w-[70px] px-3.5 text-xs font-semibold rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs ${t.secondaryBtn}`}
            >
              Waive
            </button>

            <button
              type="button"
              onClick={() => setCollectDialogOpen(true)}
              className={`h-8 min-w-[100px] px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white`}
            >
              <IconCheck size={14} />
              <span>Collect Cash</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className={`h-8 w-8 rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs ${t.secondaryBtn}`}
          title="Print receipt"
        >
          <IconPrinter size={14} />
        </button>
      </div>
    )

    return () => setHeaderAction(null)
  }, [fine, navigate, t, setHeaderAction])

  if (loading) {
    return (
      <div className={`p-16 text-center text-sm ${t.subTextColor}`}>
        Loading due details...
      </div>
    )
  }

  if (!fine) {
    return (
      <div className={`p-16 text-center text-sm ${t.subTextColor}`}>
        Fine record not found.
      </div>
    )
  }

  const isPending = fine.status === 'PENDING'
  const isPaid = fine.status === 'PAID'

  return (
    <div className="space-y-4 pb-12">
      {/* Main Frameless Content Grid (Exact AdminPlanDetailPage 12-column split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0 items-start">
        {/* Left Column (8/12): Due Fields (90% width) */}
        <div className="lg:col-span-8 space-y-4 xl:space-y-4.5 w-full lg:max-w-[90%] min-w-0">
          {/* Row 1: Loan Reference & Violation Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div className="space-y-1 w-full">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Loan Reference
              </label>
              <div className={`w-full h-9 px-3 text-xs xl:text-sm flex items-center justify-between rounded-md border ${t.inputBg}`}>
                <span className="font-mono font-semibold text-blue-500 dark:text-blue-400">
                  {fine.loanCode ? `#${fine.loanCode}` : fine.loanId ? `#LN-${fine.loanId}` : '—'}
                </span>
                {fine.loanId && (
                  <Link
                    to="/admin/circulation"
                    className="text-xs text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                  >
                    <span>Desk</span>
                    <IconExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-1 w-full">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Violation Reason
              </label>
              <input
                readOnly
                value={fine.reason?.replace('_', ' ') || 'OVERDUE'}
                className={`w-full h-9 px-3 text-xs xl:text-sm font-medium uppercase rounded-md border outline-none cursor-default ${t.inputBg}`}
              />
            </div>
          </div>

          {/* Row 2: Patron Info */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Patron
            </label>
            <div className={`w-full h-9 px-3 text-xs xl:text-sm flex items-center justify-between rounded-md border ${t.inputBg}`}>
              <span className={`font-medium ${t.titleColor}`}>
                {fine.userFullName || fine.userEmail || `User #${fine.userId}`}
              </span>
              {fine.userId && (
                <Link
                  to={`/admin/members/${fine.userId}`}
                  className="text-xs text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                >
                  <span>Profile</span>
                  <IconExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>

          {/* Row 3: Associated Borrowed Material */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Borrowed Material
            </label>
            <input
              readOnly
              value={fine.bookTitle || 'General Material'}
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none cursor-default truncate ${t.inputBg}`}
            />
          </div>

          {/* Row 4: Assessment Numbers (Borrow Limit / Duration style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div className="space-y-1 w-full">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Days Overdue
              </label>
              <input
                readOnly
                value={fine.daysOverdue !== undefined && fine.daysOverdue !== null ? `${fine.daysOverdue} days` : 'N/A'}
                className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none cursor-default ${t.inputBg}`}
              />
            </div>

            <div className="space-y-1 w-full">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Applicable Rate
              </label>
              <input
                readOnly
                value={`$${Number(circulationSettings.finePerDayOverdue || 0.5).toFixed(2)}/day`}
                className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none cursor-default ${t.inputBg}`}
              />
            </div>
          </div>

          {/* Row 5: Pricing Section (Exact AdminPlanDetailPage Pricing style) */}
          <div className="space-y-1 pt-3 w-full">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-[#262a34]">
              <label className={`block text-sm font-semibold ${t.titleColor}`}>
                Assessment & Settlement
              </label>
            </div>

            <div className={`divide-y ${isDark ? 'divide-[#262a34]' : 'divide-gray-200'}`}>
              <div className="flex items-center justify-between py-3.5 px-2 select-none">
                <span className={`text-sm font-medium ${t.titleColor}`}>Total Assessed Fee</span>
                <span className={`font-mono text-sm sm:text-base font-semibold ${t.titleColor}`}>
                  ${Number(fine.amount || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5 px-2 select-none">
                <span className={`text-sm font-medium ${t.titleColor}`}>Outstanding Balance</span>
                <span className={`font-mono text-sm sm:text-base font-semibold ${isPending ? 'text-[#b46b00] dark:text-amber-400' : 'text-emerald-500'}`}>
                  ${isPending ? Number(fine.amount || 0).toFixed(2) : '0.00'}
                </span>
              </div>

              {fine.paidAt && (
                <div className="flex items-center justify-between py-3.5 px-2 select-none">
                  <span className={`text-sm font-medium ${t.titleColor}`}>Settlement Method</span>
                  <span className={`font-mono text-xs font-semibold uppercase ${t.titleColor}`}>
                    {fine.paymentMethod || 'CASH'}
                  </span>
                </div>
              )}

              {fine.waivedReason && (
                <div className="flex flex-col gap-1 py-3 px-2">
                  <span className={`text-xs font-medium ${t.subTextColor}`}>Waiver Justification</span>
                  <span className={`text-xs italic ${t.titleColor}`}>"{fine.waivedReason}"</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4/12): Status & Metadata (Exact AdminPlanDetailPage style) */}
        <div className="lg:col-span-4 space-y-4 w-full lg:max-w-[280px]">
          {/* Status (Minimal dot indicator box) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Status
            </label>
            <div className="flex items-center justify-between h-9 px-3 rounded-md border border-gray-200 dark:border-[#2c323e] bg-white dark:bg-[#16181d] select-none cursor-default">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaid ? 'bg-emerald-500' : isPending ? 'bg-[#b46b00] dark:bg-amber-400' : 'bg-blue-400'
                  }`}
                />
                <span className={`text-xs font-semibold uppercase ${t.titleColor}`}>
                  {fine.status}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Right Column */}
          {isPending && (
            <div className="space-y-2 pt-1 w-full">
              <button
                type="button"
                onClick={() => setCollectDialogOpen(true)}
                className="w-full h-9 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconCheck size={14} />
                <span>Collect Cash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWaiveReason('')
                  setWaiveDialogOpen(true)
                }}
                className={`w-full h-9 text-xs font-semibold rounded-md border transition-all cursor-pointer ${t.secondaryBtn}`}
              >
                Waive Fine
              </button>
            </div>
          )}

          {/* Timeline & Metadata */}
          <div className="space-y-2 pt-2 text-xs border-t border-gray-200 dark:border-[#262a34]">
            <div className="flex justify-between">
              <span className={t.subTextColor}>Issued:</span>
              <span className={`font-mono ${t.titleColor}`}>{formatDateTime(fine.createdAt)}</span>
            </div>
            {fine.paidAt && (
              <div className="flex justify-between">
                <span className={t.subTextColor}>Paid:</span>
                <span className={`font-mono ${t.titleColor}`}>{formatDateTime(fine.paidAt)}</span>
              </div>
            )}
            {fine.waivedAt && (
              <div className="flex justify-between">
                <span className={t.subTextColor}>Waived:</span>
                <span className={`font-mono ${t.titleColor}`}>{formatDateTime(fine.waivedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collect Cash Modal */}
      <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={`text-base font-bold ${t.titleColor}`}>
              Collect Cash Payment &bull; #{fine.fineCode}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className={`p-3 rounded-md border ${isDark ? 'bg-[#121316] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className={t.subTextColor}>Patron:</span>
                <span className={`font-semibold ${t.titleColor}`}>{fine.userFullName || fine.userEmail}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200 dark:border-[#22262e]">
                <span className={`font-semibold ${t.titleColor}`}>Amount to Collect:</span>
                <span className="font-mono font-bold text-base text-emerald-500">
                  ${Number(fine.amount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            <p className={`text-xs ${t.subTextColor}`}>
              Confirm that cash payment has been received directly from the patron at the circulation desk.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCollectDialogOpen(false)}
                className={`h-8 px-3 text-xs font-semibold rounded-md border transition cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCollectCash}
                disabled={actionLoading}
                className="h-8 px-4 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <IconCheck size={14} />
                <span>{actionLoading ? 'Recording...' : 'Confirm Received'}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waive Fine Modal */}
      <Dialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={`text-base font-bold ${t.titleColor}`}>
              Waive Fine &bull; #{fine.fineCode}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className={`p-3 rounded-md border ${isDark ? 'bg-[#121316] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className={t.subTextColor}>Patron:</span>
                <span className={`font-semibold ${t.titleColor}`}>{fine.userFullName || fine.userEmail}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={t.subTextColor}>Amount:</span>
                <span className="font-mono font-bold text-[#b46b00] dark:text-amber-400">
                  ${Number(fine.amount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Waiver Justification
              </label>
              <textarea
                rows={3}
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="e.g. Authorized first-time waiver per policy..."
                className={`w-full text-xs p-2.5 rounded-md border outline-none ${
                  isDark ? 'bg-[#121316] border-[#2c323e] text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-600'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaiveDialogOpen(false)}
                className={`h-8 px-3 text-xs font-semibold rounded-md border transition cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWaive}
                disabled={actionLoading || !waiveReason.trim()}
                className="h-8 px-4 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Waiving...' : 'Confirm Waive'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
