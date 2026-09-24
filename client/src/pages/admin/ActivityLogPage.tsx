import { useState, useEffect, useCallback } from 'react'
import { IconSearch, IconRefresh } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { ActivityLogItem } from '@/types/api'

export function ActivityLogPage() {
  const { t, isDark } = useAdmin()
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetAuditLogs({
        keyword: keyword.trim() || undefined,
        entityType: typeFilter || undefined,
        page,
        size: 50,
      })
      setLogs(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [keyword, typeFilter, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchLogs])

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
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(0)
            }}
            className={`h-9 px-3 text-xs rounded-xl border outline-none cursor-pointer ${t.inputBg}`}
          >
            <option value="">All Event Types</option>
            <option value="LOAN">Loans & Circulation</option>
            <option value="BOOK">Catalog & Copies</option>
            <option value="USER">Patrons & Staff</option>
            <option value="FINE">Fines & Fees</option>
            <option value="SETTINGS">System Settings</option>
          </select>

          <button
            onClick={() => fetchLogs()}
            title="Refresh logs"
            disabled={loading}
            className={`h-9 w-9 flex items-center justify-center rounded-xl border transition ${t.inputBg} hover:opacity-80 cursor-pointer`}
          >
            <IconRefresh size={14} className={`${loading ? 'animate-spin' : ''} ${t.subTextColor}`} />
          </button>
        </div>

        <div className={`text-xs ${t.subTextColor}`}>
          Showing {logs.length} of {totalElements} audit entries
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
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`py-12 text-center text-xs ${t.subTextColor}`}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.map((l) => (
                <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                  <td className="py-3 px-4 font-mono text-xs">{l.timestamp || (l.createdAt ? l.createdAt.replace('T', ' ').substring(0, 19) : '')}</td>
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
                        ? isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[#fff8eb] text-[#b46b00] border border-[#f2be54]'
                        : l.entityType === 'USER'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
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
              {!loading && logs.length === 0 && (
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
