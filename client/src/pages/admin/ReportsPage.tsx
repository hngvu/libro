import { useState } from 'react'
import { IconDownload } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'

const TOP_BOOKS = [
  { id: 1, title: 'Clean Code: A Handbook of Agile Software Craftsmanship', loansCount: 42, copiesTotal: 5 },
  { id: 2, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', loansCount: 38, copiesTotal: 4 },
  { id: 3, title: 'The Pragmatic Programmer: Your Journey To Mastery', loansCount: 29, copiesTotal: 3 },
  { id: 4, title: 'Harry Potter and the Philosopher\'s Stone', loansCount: 25, copiesTotal: 3 },
  { id: 5, title: 'Refactoring: Improving the Design of Existing Code', loansCount: 19, copiesTotal: 2 },
]

const MONTHLY_STATS = [
  { month: 'April 2026', checkouts: 120, returns: 112, newMembers: 18 },
  { month: 'May 2026', checkouts: 145, returns: 138, newMembers: 24 },
  { month: 'June 2026', checkouts: 160, returns: 151, newMembers: 30 },
  { month: 'July 2026', checkouts: 190, returns: 182, newMembers: 35 },
  { month: 'August 2026', checkouts: 215, returns: 204, newMembers: 41 },
  { month: 'September 2026', checkouts: 94, returns: 88, newMembers: 16 },
]

export function ReportsPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const [reportType, setReportType] = useState<'top-books' | 'monthly' | 'distribution'>('top-books')

  const handleExport = (format: 'csv' | 'json') => {
    const dataStr =
      format === 'json'
        ? JSON.stringify({ topBooks: TOP_BOOKS, monthlyStats: MONTHLY_STATS }, null, 2)
        : `Report,Metric,Value\nTop Book,Clean Code,42 loans\nMonthly Volume,August 2026,215 checkouts\n`

    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `libro_report_${Date.now()}.${format}`
    a.click()
    URL.revokeObjectURL(url)

    showFeedback('success', `Report exported as ${format.toUpperCase()} successfully!`)
  }

  return (
    <div className="space-y-4">
      {/* Control Header & Export Action */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${t.cardBg}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReportType('top-books')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              reportType === 'top-books' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            Top Borrowed Books
          </button>
          <button
            type="button"
            onClick={() => setReportType('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              reportType === 'monthly' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            Monthly Trends
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconDownload size={14} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconDownload size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* Report View: Top Borrowed */}
      {reportType === 'top-books' && (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
          <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>Most Borrowed Library Titles</h3>
            <p className={`text-[11px] ${t.subTextColor}`}>Ranked by total historical checkout transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${t.tableHead}`}>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Rank</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book Title</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Total Checkouts</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Total Copies</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Utilization Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {TOP_BOOKS.map((b, idx) => (
                  <tr key={b.id} className={`border-b transition-colors ${t.tableRow}`}>
                    <td className="py-3 px-4 font-mono text-xs font-bold">
                      <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center ${
                        idx === 0 ? 'bg-amber-400/20 text-amber-300 font-bold' : idx === 1 ? 'bg-gray-400/20 text-gray-300' : 'bg-transparent text-gray-400'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{b.title}</td>
                    <td className="py-3 px-4 text-xs font-bold text-blue-400">{b.loansCount} times</td>
                    <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{b.copiesTotal} copies</td>
                    <td className="py-3 px-4">
                      <div className="w-32 bg-gray-700/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (b.loansCount / 45) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report View: Monthly Volume */}
      {reportType === 'monthly' && (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
          <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>Monthly Circulation Trends (2026)</h3>
            <p className={`text-[11px] ${t.subTextColor}`}>Book checkouts, returns, and reader registrations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${t.tableHead}`}>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Month</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Checkouts</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Returns</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">New Member Registrations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {MONTHLY_STATS.map((m) => (
                  <tr key={m.month} className={`border-b transition-colors ${t.tableRow}`}>
                    <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{m.month}</td>
                    <td className="py-3 px-4 text-xs font-bold text-blue-400">{m.checkouts} loans</td>
                    <td className="py-3 px-4 text-xs font-bold text-emerald-400">{m.returns} returned</td>
                    <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>+{m.newMembers} patrons</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
