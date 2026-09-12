import { useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'

interface ActivityLogItem {
  id: number
  timestamp: string
  operator: string
  action: string
  entityType: 'LOAN' | 'BOOK' | 'USER' | 'SETTINGS' | 'FINE'
  detail: string
  ipAddress: string
}

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 1,
    timestamp: '2026-09-11 09:15:22',
    operator: 'admin@libro.com',
    action: 'CHECKOUT_ISSUED',
    entityType: 'LOAN',
    detail: 'Issued loan LN-88129 to patron @nguyenvana (Barcode: BC-391821)',
    ipAddress: '127.0.0.1',
  },
  {
    id: 2,
    timestamp: '2026-09-11 08:42:10',
    operator: 'lucia@libro.com',
    action: 'BOOK_RETURNED',
    entityType: 'LOAN',
    detail: 'Processed return for LN-88104 (Clean Code)',
    ipAddress: '192.168.1.15',
  },
  {
    id: 3,
    timestamp: '2026-09-10 16:20:05',
    operator: 'admin@libro.com',
    action: 'BOOK_CREATED',
    entityType: 'BOOK',
    detail: 'Created new title: Refactoring (2nd Edition) [BK992812]',
    ipAddress: '127.0.0.1',
  },
  {
    id: 4,
    timestamp: '2026-09-10 14:11:45',
    operator: 'lucia@libro.com',
    action: 'FINE_COLLECTED',
    entityType: 'FINE',
    detail: 'Collected 20,000 VND overdue fee for ticket FINE-2026-001',
    ipAddress: '192.168.1.15',
  },
  {
    id: 5,
    timestamp: '2026-09-09 11:05:30',
    operator: 'admin@libro.com',
    action: 'POLICIES_UPDATED',
    entityType: 'SETTINGS',
    detail: 'Updated default loan period from 10 to 14 days',
    ipAddress: '127.0.0.1',
  },
  {
    id: 6,
    timestamp: '2026-09-08 09:30:12',
    operator: 'admin@libro.com',
    action: 'USER_REGISTERED',
    entityType: 'USER',
    detail: 'Registered patron account @tranthib (Tran Thi B)',
    ipAddress: '127.0.0.1',
  },
]

export function ActivityLogPage() {
  const { t } = useAdmin()
  const [logs] = useState<ActivityLogItem[]>(INITIAL_LOGS)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filtered = logs.filter((item) => {
    const matchesKeyword =
      item.operator.toLowerCase().includes(keyword.toLowerCase()) ||
      item.detail.toLowerCase().includes(keyword.toLowerCase()) ||
      item.action.toLowerCase().includes(keyword.toLowerCase())

    const matchesType = typeFilter ? item.entityType === typeFilter : true
    return matchesKeyword && matchesType
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${t.cardBg}`}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Filter audit logs..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`h-9 px-3 text-xs rounded-xl border outline-none cursor-pointer ${t.inputBg}`}
          >
            <option value="">All Event Types</option>
            <option value="LOAN">Loans & Circulation</option>
            <option value="BOOK">Catalog & Copies</option>
            <option value="USER">Patrons & Staff</option>
            <option value="FINE">Fines & Fees</option>
            <option value="SETTINGS">System Settings</option>
          </select>
        </div>

        <div className={`text-xs ${t.subTextColor}`}>
          Showing {filtered.length} audit entries
        </div>
      </div>

      {/* Activity Log Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${t.tableHead}`}>
                <th className="py-3 px-4 text-xs font-semibold">Timestamp</th>
                <th className="py-3 px-4 text-xs font-semibold">Staff Operator</th>
                <th className="py-3 px-4 text-xs font-semibold">Event Action</th>
                <th className="py-3 px-4 text-xs font-semibold">Details</th>
                <th className="py-3 px-4 text-xs font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {filtered.map((l) => (
                <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                  <td className="py-3 px-4 font-mono text-xs">{l.timestamp}</td>
                  <td className="py-3 px-4 text-xs">
                    <span className={`font-semibold ${t.titleColor}`}>{l.operator}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold ${
                      l.entityType === 'LOAN'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : l.entityType === 'BOOK'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : l.entityType === 'FINE'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : t.statusMuted
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{l.detail}</td>
                  <td className={`py-3 px-4 text-right font-mono text-[11px] ${t.mutedColor}`}>
                    {l.ipAddress}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                    No log events found matching your filter.
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
