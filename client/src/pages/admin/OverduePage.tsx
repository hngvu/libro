import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconChevronDown,
  IconArrowsUpDown,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminFilterCombobox } from '@/components/admin/AdminFilterCombobox'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { LoanResponse, UserResponse } from '@/types/api'

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

export function OverduePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback, circulationSettings } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as
    | 'default'
    | 'days-desc'
    | 'days-asc'
    | 'due-asc'
    | 'fine-desc'
    | 'borrower-asc'
    | 'title-asc'
  const initialUsers = searchParams.get('user') ? searchParams.get('user')!.split(',').filter(Boolean) : []

  const [overdueLoans, setOverdueLoans] = useState<LoanResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Filters & Sorting state
  const [keyword, setKeyword] = useState(initialKeyword)
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [userFilter, setUserFilter] = useState<string[]>(initialUsers)
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>(() => {
    const fields: string[] = []
    if (initialUsers.length > 0) fields.push('user')
    return fields
  })

  // Selection for bulk actions
  const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([])

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (userFilter.length > 0) params.set('user', userFilter.join(','))
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, userFilter, setSearchParams])

  // Load patrons for filter
  useEffect(() => {
    api.adminGetUsers({ page: 1, size: 100 })
      .then((res) => setUsers(res.content || []))
      .catch(() => {})
  }, [])

  const fetchOverdueLoans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetLoans({
        status: 'OVERDUE',
        keyword: keyword || undefined,
        userId: userFilter.length > 0 ? userFilter.map(Number).filter(Boolean) : undefined,
        page: 1,
        size: 100,
      })
      setOverdueLoans(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load overdue list')
    } finally {
      setLoading(false)
    }
  }, [keyword, userFilter, showFeedback])

  useEffect(() => {
    fetchOverdueLoans()
  }, [fetchOverdueLoans])

  const calculateDaysOverdue = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime()
    const now = Date.now()
    const diffDays = Math.max(1, Math.ceil((now - due) / (1000 * 60 * 60 * 24)))
    return diffDays
  }

  const sortedOverdueLoans = useMemo(() => {
    let list = [...overdueLoans]
    if (sortBy === 'days-desc') {
      return list.sort((a, b) => calculateDaysOverdue(b.dueDate) - calculateDaysOverdue(a.dueDate))
    }
    if (sortBy === 'days-asc') {
      return list.sort((a, b) => calculateDaysOverdue(a.dueDate) - calculateDaysOverdue(b.dueDate))
    }
    if (sortBy === 'due-asc') {
      return list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    }
    if (sortBy === 'fine-desc') {
      return list.sort((a, b) => calculateDaysOverdue(b.dueDate) - calculateDaysOverdue(a.dueDate))
    }
    if (sortBy === 'borrower-asc') {
      return list.sort((a, b) => (a.userFullName || a.userEmail || '').localeCompare(b.userFullName || b.userEmail || ''))
    }
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''))
    }
    return list
  }, [overdueLoans, sortBy])

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'user') setUserFilter([])
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setUserFilter([])
  }

  const toggleSelectLoan = (id: number) => {
    setSelectedLoanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedLoanIds.length === sortedOverdueLoans.length) {
      setSelectedLoanIds([])
    } else {
      setSelectedLoanIds(sortedOverdueLoans.map((l) => l.id))
    }
  }

  const handleBulkReturn = async () => {
    if (selectedLoanIds.length === 0) return
    if (!confirm(`Return ${selectedLoanIds.length} selected overdue book(s)?`)) return
    try {
      for (const id of selectedLoanIds) {
        await api.adminReturnLoan(id)
      }
      showFeedback('success', `${selectedLoanIds.length} overdue book(s) checked back in!`)
      setSelectedLoanIds([])
      fetchOverdueLoans()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return selected books')
    }
  }

  const handleBulkSendReminders = () => {
    if (selectedLoanIds.length === 0) return
    showFeedback('success', `Reminder notices sent to ${selectedLoanIds.length} overdue borrower(s)!`)
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search overdue borrower, book title, or barcode..."
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
                onClick={() => setSortBy('days-desc')}
                className={sortBy === 'days-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Days Overdue (Most overdue first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('days-asc')}
                className={sortBy === 'days-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Days Overdue (Least overdue first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('due-asc')}
                className={sortBy === 'due-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Due Date (Oldest deadline first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('borrower-asc')}
                className={sortBy === 'borrower-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Borrower Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('title-asc')}
                className={sortBy === 'title-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Book Title (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Section Under Searchbar */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <div
          className={`h-9 flex items-center gap-1.5 px-3 rounded-md border text-xs sm:text-[13px] font-semibold select-none ${
            isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]' : 'bg-gray-100 border-gray-300 text-gray-800'
          }`}
        >
          <IconFilter2 size={15} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
          <span>Filter</span>
        </div>

        {/* Borrower Filter */}
        {activeFilterFields.includes('user') && (
          <AdminFilterCombobox
            label="Borrower"
            value={userFilter}
            options={users.map((u) => ({
              value: String(u.id),
              label: `${u.fullName || u.email} (${u.email})`,
            }))}
            onChange={(val) => setUserFilter(Array.isArray(val) ? val : val ? [val] : [])}
            onRemove={() => removeFilterField('user')}
            multiple={true}
            placeholder="Search borrower..."
          />
        )}

        {/* Add Filter Plus Button */}
        {!activeFilterFields.includes('user') && (
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
              <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'user'])}>
                Borrower Patron
              </DropdownMenuItem>
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

      {/* Overdue Table - Frameless style */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading overdue records...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedOverdueLoans.length > 0 && selectedLoanIds.length === sortedOverdueLoans.length
                        ? true
                        : selectedLoanIds.length > 0
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

                {/* Column: Code / Selected Action */}
                <th className="px-4 text-left align-middle min-w-[140px]">
                  {selectedLoanIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedLoanIds.length} selected
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
                          <DropdownMenuItem onClick={handleBulkSendReminders}>
                            Send Notice to Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkReturn} className="text-emerald-500">
                            Return Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedLoanIds([])}>
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Code
                    </span>
                  )}
                </th>

                {/* Column: Borrower */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrower
                </th>

                {/* Column: Book */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Book
                </th>

                {/* Column: Due Date */}
                <th className={`w-36 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Due Date
                </th>

                {/* Column: Days Overdue */}
                <th className={`w-32 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Days Overdue
                </th>

                {/* Column: Accrued Fine */}
                <th className={`w-36 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Accrued Fine
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedOverdueLoans.map((l) => {
                const isSelected = selectedLoanIds.includes(l.id)
                const days = calculateDaysOverdue(l.dueDate)
                const fine = days * circulationSettings.finePerDayOverdue

                return (
                  <tr
                    key={l.id}
                    onClick={() => navigate(`/admin/circulation/${l.id}`)}
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
                    <td className="w-10 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectLoan(l.id)}
                        title={`Select loan ${l.loanCode}`}
                        className={
                          isDark
                            ? '!border-[#3e4756] hover:!border-[#5a667b]'
                            : '!border-gray-400 hover:!border-gray-500'
                        }
                      />
                    </td>

                    {/* Code */}
                    <td className={`py-3 px-4 text-xs font-mono font-medium ${t.titleColor}`}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/circulation/${l.id}`)
                        }}
                        className="text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {l.loanCode}
                      </span>
                    </td>

                    {/* Borrower Info */}
                    <td className="py-3 px-4">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          if (l.userId) {
                            navigate(`/admin/members/${l.userId}`)
                          }
                        }}
                        className={`text-sm font-semibold truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                      >
                        {l.userFullName || `User #${l.userId}`}
                      </span>
                    </td>

                    {/* Book Info */}
                    <td className="py-3 px-4">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          if (l.bookId) {
                            navigate(`/admin/books/${l.bookId}`)
                          }
                        }}
                        className={`text-sm font-medium truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                      >
                        {l.bookTitle || `Book #${l.bookId || l.bookCopyId}`}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${t.titleColor}`}>
                      {formatDate(l.dueDate)}
                    </td>

                    {/* Days Overdue */}
                    <td className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${t.titleColor}`}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </td>

                    {/* Accrued Fine */}
                    <td className="py-3 px-4 text-sm font-medium whitespace-nowrap text-amber-500 font-mono">
                      ${fine.toFixed(2)}
                    </td>
                  </tr>
                )
              })}

              {sortedOverdueLoans.length === 0 && (
                <tr>
                  <td colSpan={7} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    🎉 Excellent! There are no overdue book returns in the library system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
