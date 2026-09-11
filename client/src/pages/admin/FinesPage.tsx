import { useState } from 'react'
import {
  IconCheck,
  IconCoins,
  IconClock,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FineRecord {
  id: number
  receiptCode: string
  patronName: string
  patronUsername: string
  bookTitle: string
  daysOverdue: number
  amount: number
  status: 'OUTSTANDING' | 'PAID' | 'WAIVED'
  assessedDate: string
  paidDate?: string
}

const INITIAL_FINES: FineRecord[] = [
  {
    id: 1,
    receiptCode: 'FINE-2026-001',
    patronName: 'Tran Van Bao',
    patronUsername: 'tranvanbao',
    bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    daysOverdue: 4,
    amount: 20000,
    status: 'OUTSTANDING',
    assessedDate: '2026-09-08',
  },
  {
    id: 2,
    receiptCode: 'FINE-2026-002',
    patronName: 'Le Thi Mai',
    patronUsername: 'lethimai',
    bookTitle: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
    daysOverdue: 7,
    amount: 35000,
    status: 'OUTSTANDING',
    assessedDate: '2026-09-05',
  },
  {
    id: 3,
    receiptCode: 'FINE-2026-003',
    patronName: 'Hoang Minh',
    patronUsername: 'hoangminh',
    bookTitle: 'Refactoring: Improving the Design of Existing Code',
    daysOverdue: 2,
    amount: 10000,
    status: 'PAID',
    assessedDate: '2026-08-20',
    paidDate: '2026-08-22',
  },
  {
    id: 4,
    receiptCode: 'FINE-2026-004',
    patronName: 'Pham Quoc Huy',
    patronUsername: 'phamquochuy',
    bookTitle: 'Designing Data-Intensive Applications',
    daysOverdue: 10,
    amount: 50000,
    status: 'PAID',
    assessedDate: '2026-08-15',
    paidDate: '2026-08-18',
  },
]

export function FinesPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding')
  const [fines, setFines] = useState<FineRecord[]>(INITIAL_FINES)
  

  const handleCollectFine = (id: number) => {
    setFines((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status: 'PAID',
              paidDate: new Date().toISOString().split('T')[0],
            }
          : f
      )
    )
    showFeedback('success', 'Fee payment recorded and receipt generated!')
  }

  const handleWaiveFine = (id: number) => {
    if (!confirm('Waive this library fee penalty?')) return
    setFines((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'WAIVED' } : f))
    )
    showFeedback('success', 'Fee waived under librarian discretion.')
  }

  const outstanding = fines.filter((f) => f.status === 'OUTSTANDING')
  const history = fines.filter((f) => f.status === 'PAID' || f.status === 'WAIVED')

  const totalOutstanding = outstanding.reduce((sum, f) => sum + f.amount, 0)
  const totalCollected = history.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0)

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

        {/* TAB 1: OUTSTANDING */}
        <TabsContent value="outstanding" className="space-y-4 outline-none pt-3">
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Receipt Code</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Patron</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Overdue Title</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Days Late</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Fine Amount</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {outstanding.map((f) => (
                    <tr key={f.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{f.receiptCode}</td>
                      <td className="py-3 px-4 text-xs">
                        <div className={`font-medium ${t.titleColor}`}>{f.patronName}</div>
                        <div className={`text-[10px] font-mono ${t.mutedColor}`}>@{f.patronUsername}</div>
                      </td>
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{f.bookTitle}</td>
                      <td className="py-3 px-4 text-xs font-bold text-rose-400">+{f.daysOverdue} days</td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-amber-400">
                        {f.amount.toLocaleString('vi-VN')} VND
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
                            Collect Payment
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
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Receipt Code</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Patron</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Title</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Amount Paid</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Date Settled</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {history.map((f) => (
                    <tr key={f.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{f.receiptCode}</td>
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{f.patronName}</td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{f.bookTitle}</td>
                      <td className="py-3 px-4 text-xs font-mono font-semibold text-emerald-400">
                        {f.amount.toLocaleString('vi-VN')} VND
                      </td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{f.paidDate || f.assessedDate}</td>
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
