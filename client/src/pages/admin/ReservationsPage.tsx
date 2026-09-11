import { useState } from 'react'
import {
  
  IconSearch,
  IconCheck,
  IconX,
  IconPlus,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'

interface ReservationItem {
  id: number
  reservationCode: string
  patronName: string
  patronUsername: string
  bookTitle: string
  requestDate: string
  expiryDate: string
  status: 'PENDING' | 'READY_FOR_PICKUP' | 'FULFILLED' | 'CANCELLED'
}

const INITIAL_RESERVATIONS: ReservationItem[] = [
  {
    id: 1,
    reservationCode: 'RES-8821',
    patronName: 'Nguyen Van A',
    patronUsername: 'nguyenvana',
    bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    requestDate: '2026-09-08',
    expiryDate: '2026-09-15',
    status: 'READY_FOR_PICKUP',
  },
  {
    id: 2,
    reservationCode: 'RES-8822',
    patronName: 'Tran Thi B',
    patronUsername: 'tranthib',
    bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    requestDate: '2026-09-09',
    expiryDate: '2026-09-16',
    status: 'PENDING',
  },
  {
    id: 3,
    reservationCode: 'RES-8820',
    patronName: 'Le Hoang C',
    patronUsername: 'lehoangc',
    bookTitle: 'The Pragmatic Programmer: Your Journey To Mastery',
    requestDate: '2026-09-05',
    expiryDate: '2026-09-12',
    status: 'FULFILLED',
  },
]

export function ReservationsPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const [reservations, setReservations] = useState<ReservationItem[]>(INITIAL_RESERVATIONS)
  const [keyword, setKeyword] = useState('')

  const handleMarkReady = (id: number) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'READY_FOR_PICKUP' } : r))
    )
    showFeedback('success', 'Book hold marked as READY FOR PICKUP. Patron notified!')
  }

  const handleFulfill = (id: number) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'FULFILLED' } : r))
    )
    showFeedback('success', 'Reservation fulfilled and converted into active checkout!')
  }

  const handleCancel = (id: number) => {
    if (!confirm('Cancel this book hold reservation?')) return
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r))
    )
    showFeedback('success', 'Reservation cancelled.')
  }

  const filtered = reservations.filter(
    (r) =>
      r.patronName.toLowerCase().includes(keyword.toLowerCase()) ||
      r.bookTitle.toLowerCase().includes(keyword.toLowerCase()) ||
      r.reservationCode.toLowerCase().includes(keyword.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${t.cardBg}`}>
        <div className="relative w-full sm:w-80">
          <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search patron, book, or reservation code..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
          />
        </div>

        <button
          onClick={() => showFeedback('success', 'Manual hold creation modal trigger')}
          className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
        >
          <IconPlus size={15} /> Create Hold Request
        </button>
      </div>

      {/* Reservations Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${t.tableHead}`}>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Hold Code</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Patron</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Requested Book Title</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Requested</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Pickup Deadline</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {filtered.map((r) => (
                <tr key={r.id} className={`border-b transition-colors ${t.tableRow}`}>
                  <td className="py-3 px-4 font-mono text-xs font-semibold">{r.reservationCode}</td>
                  <td className="py-3 px-4 text-xs">
                    <div className={`font-medium ${t.titleColor}`}>{r.patronName}</div>
                    <div className={`text-[10px] font-mono ${t.mutedColor}`}>@{r.patronUsername}</div>
                  </td>
                  <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{r.bookTitle}</td>
                  <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{r.requestDate}</td>
                  <td className={`py-3 px-4 text-xs font-semibold ${t.titleColor}`}>{r.expiryDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        r.status === 'READY_FOR_PICKUP'
                          ? isDark ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : r.status === 'PENDING'
                          ? isDark ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          : t.statusMuted
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkReady(r.id)}
                          className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
                        >
                          Mark Ready
                        </button>
                      )}
                      {r.status === 'READY_FOR_PICKUP' && (
                        <button
                          onClick={() => handleFulfill(r.id)}
                          className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
                        >
                          Check Out
                        </button>
                      )}
                      {r.status !== 'FULFILLED' && r.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            isDark ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'
                          }`}
                          title="Cancel Hold"
                        >
                          <IconX size={15} />
                        </button>
                      )}
                      {r.status === 'FULFILLED' && (
                        <span className={`text-[11px] flex items-center gap-1 text-emerald-400 font-medium`}>
                          <IconCheck size={14} /> Checked out
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                    No reservations matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
