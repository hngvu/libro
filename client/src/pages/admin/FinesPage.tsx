import { useState, useEffect, useCallback } from 'react'
import {
  IconCheck,
  IconCoins,
  IconClock,
  IconRefresh,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/services/api'
import type { FineResponse } from '@/types/api'

export function FinesPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding')
  const [fines, setFines] = useState<FineResponse[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFines = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetFines({ page: 1, size: 100 })
      setFines(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to fetch library fines')
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchFines()
  }, [fetchFines])

  const handleCollectFine = async (id: number) => {
    try {
      await api.adminCollectFineCash(id)
      showFeedback('success', 'Fee payment recorded via Cash and receipt generated!')
      fetchFines()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to collect payment')
    }
  }

  const handleWaiveFine = async (id: number) => {
    const reason = prompt('Enter reason for waiving this penalty:')
    if (!reason || !reason.trim()) return
    try {
      await api.adminWaiveFine(id, reason.trim())
      showFeedback('success', 'Fee waived under librarian discretion.')
      fetchFines()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to waive fine')
    }
  }

  const outstanding = fines.filter((f) => f.status === 'PENDING')
  const history = fines.filter((f) => f.status === 'PAID' || f.status === 'WAIVED')

  const totalOutstanding = outstanding.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
  const totalCollected = history.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + (Number(f.amount) || 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
          <div className={`flex items-center justify-between text-xs font-medium mb-1 ${t.subTextColor}`}>
            <span>Total Outstanding Fines</span>
            <IconCoins size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-sans text-amber-400">
            {totalOutstanding.toLocaleString('vi-VN')} VND
          </div>
          <p className={`text-[11px] mt-0.5 ${t.subTextColor}`}>
            {outstanding.length} pending fee tickets
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
          <div className={`flex items-center justify-between text-xs font-medium mb-1 ${t.subTextColor}`}>
            <span>Total Collected Fees</span>
            <IconCheck size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-sans text-emerald-400">
            {totalCollected.toLocaleString('vi-VN')} VND
          </div>
          <p className={`text-[11px] mt-0.5 ${t.subTextColor}`}>
            Deposited into library account
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <div className="flex items-center justify-between">
          <TabsList className={`p-1 rounded-xl border ${t.cardBg}`}>
            <TabsTrigger
              value="outstanding"
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'outstanding'
                  ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                  : t.subTextColor
              }`}
            >
              <span className="flex items-center gap-1.5">
                <IconCoins size={15} /> Outstanding Fines ({outstanding.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                  : t.subTextColor
              }`}
            >
              <span className="flex items-center gap-1.5">
                <IconClock size={15} /> Payment History ({history.length})
              </span>
            </TabsTrigger>
          </TabsList>
          <button
            onClick={fetchFines}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${t.secondaryBtn} disabled:opacity-50`}
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* TAB 1: OUTSTANDING */}
        <TabsContent value="outstanding" className="space-y-4 outline-none pt-3">
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-xs font-semibold">Fine Code</th>
                    <th className="py-3 px-4 text-xs font-semibold">Patron</th>
                    <th className="py-3 px-4 text-xs font-semibold">Reason & Title</th>
                    <th className="py-3 px-4 text-xs font-semibold">Details</th>
                    <th className="py-3 px-4 text-xs font-semibold">Amount</th>
                    <th className="py-3 px-4 text-xs font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {outstanding.map((f) => (
                    <tr key={f.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{f.fineCode}</td>
                      <td className="py-3 px-4 text-xs">
                        <div className={`font-medium ${t.titleColor}`}>{f.userFullName || 'Patron'}</div>
                        <div className={`text-[10px] font-mono ${t.mutedColor}`}>{f.userEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-semibold text-rose-400 mr-1.5 uppercase text-[11px]">[{f.reason}]</span>
                        <span className={`font-medium ${t.titleColor}`}>{f.bookTitle || 'Library Resource'}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {f.daysOverdue ? (
                          <span className="font-bold text-rose-400">+{f.daysOverdue} days late</span>
                        ) : (
                          <span className={t.subTextColor}>{f.waivedReason || '—'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-amber-400">
                        ${Number(f.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleWaiveFine(f.id)}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${t.secondaryBtn}`}
                          >
                            Waive
                          </button>
                          <button
                            onClick={() => handleCollectFine(f.id)}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
                          >
                            Collect Cash
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {outstanding.length === 0 && (
                    <tr>
                      <td colSpan={6} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                        🎉 All reader fines are settled!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: HISTORY */}
        <TabsContent value="history" className="space-y-4 outline-none pt-3">
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-xs font-semibold">Fine Code</th>
                    <th className="py-3 px-4 text-xs font-semibold">Patron</th>
                    <th className="py-3 px-4 text-xs font-semibold">Title</th>
                    <th className="py-3 px-4 text-xs font-semibold">Amount</th>
                    <th className="py-3 px-4 text-xs font-semibold">Payment Method</th>
                    <th className="py-3 px-4 text-xs font-semibold">Date Settled</th>
                    <th className="py-3 px-4 text-xs font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {history.map((f) => (
                    <tr key={f.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{f.fineCode}</td>
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{f.userFullName || f.userEmail}</td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{f.bookTitle || 'Library Resource'}</td>
                      <td className="py-3 px-4 text-xs font-mono font-semibold text-emerald-400">
                        ${Number(f.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-medium">
                        {f.paymentMethod ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            f.paymentMethod === 'STRIPE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {f.paymentMethod}
                          </span>
                        ) : '—'}
                      </td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>
                        {f.paidAt ? f.paidAt.split('T')[0] : (f.waivedAt ? f.waivedAt.split('T')[0] : (f.createdAt ? f.createdAt.split('T')[0] : '—'))}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            f.status === 'PAID' ? t.statusActive : t.statusMuted
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
