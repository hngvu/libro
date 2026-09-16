import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconArrowsUpDown,
  IconChevronDown,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/services/api'
import type { FineResponse } from '@/types/api'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  try {
    const clean = dateStr.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return clean
  } catch {
    return dateStr
  }
}

export function FinesPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [fines, setFines] = useState<FineResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Search & Filter state
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<
    'default' | 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'user-asc'
  >('default')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [reasonFilter, setReasonFilter] = useState<string>('')
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([])

  const fetchFines = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetFines({ page: 1, size: 200 })
      setFines(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load penalty records')
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchFines()
  }, [fetchFines])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedFines.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedFines.map((f) => f.id))
    }
  }

  const handleBulkWaive = async () => {
    if (!confirm(`Are you sure you want to waive ${selectedIds.length} selected fine(s)?`)) return
    try {
      for (const id of selectedIds) {
        await api.adminWaiveFine(id, 'Bulk administrative waiver')
      }
      showFeedback('success', 'Selected fines waived successfully')
      setSelectedIds([])
      fetchFines()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to waive selected fines')
    }
  }

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
    if (field === 'reason') setReasonFilter('')
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setStatusFilter('')
    setReasonFilter('')
  }

  // Filtered Fines
  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase()
        const codeMatch = f.fineCode?.toLowerCase().includes(q)
        const nameMatch = f.userFullName?.toLowerCase().includes(q)
        const emailMatch = f.userEmail?.toLowerCase().includes(q)
        const bookMatch = f.bookTitle?.toLowerCase().includes(q)
        const loanMatch = f.loanCode?.toLowerCase().includes(q)
        if (!codeMatch && !nameMatch && !emailMatch && !bookMatch && !loanMatch) return false
      }
      if (statusFilter && f.status !== statusFilter) {
        return false
      }
      if (reasonFilter && f.reason !== reasonFilter) {
        return false
      }
      return true
    })
  }, [fines, keyword, statusFilter, reasonFilter])

  // Sorted Fines
  const sortedFines = useMemo(() => {
    const list = [...filteredFines]
    if (sortBy === 'date-desc') {
      return list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    }
    if (sortBy === 'date-asc') {
      return list.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    }
    if (sortBy === 'amount-desc') {
      return list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    }
    if (sortBy === 'amount-asc') {
      return list.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
    }
    if (sortBy === 'user-asc') {
      return list.sort((a, b) => (a.userFullName || a.userEmail || '').localeCompare(b.userFullName || b.userEmail || ''))
    }
    return list
  }, [filteredFines, sortBy])

  const formatReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'OVERDUE':
        return 'Overdue'
      case 'LOST_BOOK':
        return 'Lost Book'
      case 'DAMAGED_BOOK':
        return 'Damaged'
      default:
        return 'Fine'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PENDING':
        return isDark
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-[#fff8eb] text-[#b46b00] border-[#f2be54]'
      case 'WAIVED':
        return isDark
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return isDark
          ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          : 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar (Exact MembershipPlansPage layout) */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search penalty, borrower, loan code..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  sortBy !== 'default'
                    ? isDark
                      ? 'bg-[#252a34] border-blue-500/50 text-blue-400'
                      : 'bg-blue-50 border-blue-300 text-blue-600'
                    : isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Sort options"
              >
                <IconArrowsUpDown size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSortBy('default')}
                className={sortBy === 'default' ? 'font-semibold text-blue-500' : ''}
              >
                Default
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('date-desc')}
                className={sortBy === 'date-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Newest Issued First
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('date-asc')}
                className={sortBy === 'date-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Oldest Issued First
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('amount-desc')}
                className={sortBy === 'amount-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Amount (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('amount-asc')}
                className={sortBy === 'amount-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Amount (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('user-asc')}
                className={sortBy === 'user-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Borrower Name (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Section Under Searchbar (Exact MembershipPlansPage style) */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <div
          className={`h-9 flex items-center gap-1.5 px-3 rounded-md border text-xs sm:text-[13px] font-semibold select-none ${
            isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]' : 'bg-gray-100 border-gray-300 text-gray-800'
          }`}
        >
          <IconFilter2 size={15} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
          <span>Filter</span>
        </div>

        {/* Status Filter */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'PAID', label: 'Paid' },
              { value: 'WAIVED', label: 'Waived' },
            ]}
            onChange={(val) => setStatusFilter(val)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Statuses"
          />
        )}

        {/* Reason Filter */}
        {activeFilterFields.includes('reason') && (
          <AdminFilterSelect
            label="Reason"
            value={reasonFilter}
            options={[
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'LOST_BOOK', label: 'Lost Book' },
              { value: 'DAMAGED_BOOK', label: 'Damaged' },
              { value: 'OTHER', label: 'Other' },
            ]}
            onChange={(val) => setReasonFilter(val)}
            onRemove={() => removeFilterField('reason')}
            allLabel="All Reasons"
          />
        )}

        {/* Add Filter Plus Button */}
        {activeFilterFields.length < 2 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#8c94a5] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Add filter"
              >
                <IconPlus size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {!activeFilterFields.includes('status') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'status'])}>
                  Status
                </DropdownMenuItem>
              )}
              {!activeFilterFields.includes('reason') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'reason'])}>
                  Fine Reason
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset Button */}
        {activeFilterFields.length > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-xs sm:text-[13px] text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Frameless Table (Exact MembershipPlansPage structure) */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading fine records...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                {/* Column 1: Checkbox */}
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedFines.length > 0 && selectedIds.length === sortedFines.length
                        ? true
                        : selectedIds.length > 0
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                    title="Select all"
                    className={
                      isDark
                        ? '!border-[#3e4756] hover:!border-[#5a667b]'
                        : '!border-gray-400 hover:!border-gray-500'
                    }
                  />
                </th>

                {/* Column 2: Code / Actions */}
                <th className={`w-36 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-left ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`h-6 px-2 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer select-none normal-case whitespace-nowrap ${
                              isDark
                                ? 'bg-[#181a20] border-[#3e4756] text-[#cbd2de] hover:text-white hover:border-[#5a667b]'
                                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                            }`}
                          >
                            <span>Actions</span>
                            <IconChevronDown size={12} className="opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={handleBulkWaive}
                            className="text-rose-500 focus:text-rose-400 cursor-pointer"
                          >
                            Waive Selected ({selectedIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedIds([])} className="cursor-pointer">
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    'Code'
                  )}
                </th>

                {/* Column 3: Borrower */}
                <th className={`w-52 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-left ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrower
                </th>

                {/* Column 4: Loan Code */}
                <th className={`w-36 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-left ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Loan
                </th>

                {/* Column 5: Reason */}
                <th className={`px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-left ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Reason
                </th>

                {/* Column 6: Amount */}
                <th className={`w-32 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Amount
                </th>

                {/* Column 7: Status */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-center ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Status
                </th>

                {/* Column 8: Date */}
                <th className={`w-32 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Issued
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedFines.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`p-10 text-center text-sm ${t.subTextColor}`}>
                    No fine records found.
                  </td>
                </tr>
              ) : (
                sortedFines.map((f) => {
                  const isSelected = selectedIds.includes(f.id)

                  return (
                    <tr
                      key={f.id}
                      onClick={() => navigate(`/admin/fines/penalties/${f.id}`)}
                      className={`group border-b transition-colors cursor-pointer ${
                        isDark ? 'border-[#20242c]' : 'border-gray-200'
                      } ${
                        isSelected
                          ? isDark
                          ? 'bg-[#1e232b]'
                          : 'bg-blue-50/60'
                        : t.tableRow
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="w-10 px-3 py-3 text-center align-middle"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(f.id)
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(f.id)}
                          className={
                            isDark
                              ? '!border-[#3e4756] hover:!border-[#5a667b]'
                              : '!border-gray-400 hover:!border-gray-500'
                          }
                        />
                      </td>

                      {/* Code */}
                      <td className="w-36 px-4 py-3 align-middle text-left">
                        <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                          {f.fineCode ? `#${f.fineCode}` : `#FN-${f.id}`}
                        </span>
                      </td>

                      {/* Borrower */}
                      <td className="w-52 px-4 py-3 align-middle text-left">
                        <span className={`font-medium text-sm truncate block ${t.titleColor}`}>
                          {f.userFullName || f.userEmail || `User #${f.userId}`}
                        </span>
                      </td>

                      {/* Loan Code */}
                      <td className="w-36 px-4 py-3 align-middle text-left">
                        <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                          {f.loanCode ? `#${f.loanCode}` : f.loanId ? `#LN-${f.loanId}` : '—'}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 align-middle text-left">
                        <span className={`text-sm font-normal ${isDark ? 'text-[#cbd2de]' : 'text-gray-700'}`}>
                          {formatReasonLabel(f.reason)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="w-32 px-4 py-3 text-right align-middle">
                        <span className={`font-mono text-sm font-medium ${t.titleColor}`}>
                          ${Number(f.amount || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Status (Badge without dot) */}
                      <td className="w-28 px-4 py-3 text-center align-middle">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                            f.status
                          )}`}
                        >
                          {f.status === 'PENDING'
                            ? 'Pending'
                            : f.status === 'PAID'
                            ? 'Paid'
                            : f.status === 'WAIVED'
                            ? 'Waived'
                            : f.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className={`w-32 px-4 py-3 text-right text-sm align-middle whitespace-nowrap ${t.subTextColor}`}>
                        {formatDate(f.createdAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
