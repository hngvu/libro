import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import { AdminFilterCombobox } from '@/components/admin/AdminFilterCombobox'
import { api } from '@/services/api'
import type { LoanResponse, LoanStatus, UserResponse } from '@/types/api'

function parseDateTime(dateStr?: string | null) {
  if (!dateStr) return { date: '—', time: '' }
  try {
    if (dateStr.includes('T')) {
      const [dPart, tPart] = dateStr.split('T')
      const dPieces = dPart.split('-')
      const formattedDate = dPieces.length === 3 ? `${dPieces[2]}/${dPieces[1]}/${dPieces[0]}` : dPart
      const timePieces = tPart ? tPart.split(':') : []
      const formattedTime = timePieces.length >= 2 ? `${timePieces[0]}:${timePieces[1]}` : ''
      return { date: formattedDate, time: formattedTime }
    } else {
      const parts = dateStr.split('-')
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
      return { date: formattedDate, time: '' }
    }
  } catch {
    return { date: dateStr, time: '' }
  }
}

function formatDate(dateStr?: string) {
  return parseDateTime(dateStr).date
}

function formatOrdinal(n?: number) {
  if (!n || n <= 0) return '—'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}


export function RenewalsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as
    | 'default'
    | 'renewals-desc'
    | 'renewals-asc'
    | 'renewed-desc'
    | 'renewed-asc'
    | 'borrow-desc'
    | 'borrow-asc'
    | 'borrower-asc'
    | 'title-asc'
  const initialStatus = (searchParams.get('status') || '') as LoanStatus | ''
  const initialUsers = searchParams.get('user') ? searchParams.get('user')!.split(',').filter(Boolean) : []

  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Filters & Sorting state
  const [keyword, setKeyword] = useState(initialKeyword)
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>(initialStatus)
  const [userFilter, setUserFilter] = useState<string[]>(initialUsers)
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>(() => {
    const fields: string[] = []
    if (initialStatus) fields.push('status')
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
    if (statusFilter) params.set('status', statusFilter)
    if (userFilter.length > 0) params.set('user', userFilter.join(','))
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, statusFilter, userFilter, setSearchParams])

  // Load patrons for filter
  useEffect(() => {
    api.adminGetUsers({ page: 1, size: 100 })
      .then((res) => setUsers(res.content || []))
      .catch(() => {})
  }, [])

  const fetchRenewals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetLoans({
        hasRenewals: true,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        userId: userFilter.length > 0 ? userFilter.map(Number).filter(Boolean) : undefined,
        page: 1,
        size: 100,
      })
      setLoans(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load renewed loans')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, userFilter, showFeedback])

  useEffect(() => {
    fetchRenewals()
  }, [fetchRenewals])

  const sortedLoans = useMemo(() => {
    let list = [...loans]
    if (sortBy === 'borrow-desc') {
      return list.sort((a, b) => (b.borrowDate || '').localeCompare(a.borrowDate || ''))
    }
    if (sortBy === 'borrow-asc') {
      return list.sort((a, b) => (a.borrowDate || '').localeCompare(b.borrowDate || ''))
    }
    if (sortBy === 'renewals-desc') {
      return list.sort((a, b) => (b.renewalCount || 0) - (a.renewalCount || 0))
    }
    if (sortBy === 'renewals-asc') {
      return list.sort((a, b) => (a.renewalCount || 0) - (b.renewalCount || 0))
    }
    if (sortBy === 'renewed-desc') {
      return list.sort((a, b) => (b.updatedAt || b.borrowDate || '').localeCompare(a.updatedAt || a.borrowDate || ''))
    }
    if (sortBy === 'renewed-asc') {
      return list.sort((a, b) => (a.updatedAt || a.borrowDate || '').localeCompare(b.updatedAt || b.borrowDate || ''))
    }
    if (sortBy === 'borrower-asc') {
      return list.sort((a, b) => (a.userFullName || a.userEmail || '').localeCompare(b.userFullName || b.userEmail || ''))
    }
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''))
    }
    return list
  }, [loans, sortBy])

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
    if (field === 'user') setUserFilter([])
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setStatusFilter('')
    setUserFilter([])
  }

  const toggleSelectLoan = (id: number) => {
    setSelectedLoanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedLoanIds.length === sortedLoans.length) {
      setSelectedLoanIds([])
    } else {
      setSelectedLoanIds(sortedLoans.map((l) => l.id))
    }
  }

  const handleBulkReturn = async () => {
    if (!selectedLoanIds.length) return
    try {
      await Promise.all(selectedLoanIds.map((id) => api.adminReturnLoan(id)))
      showFeedback('success', `Returned ${selectedLoanIds.length} loans successfully`)
      setSelectedLoanIds([])
      fetchRenewals()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to process bulk returns')
    }
  }



  return (
    <div className="space-y-4">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${t.subTextColor}`}
            />
            <input
              type="text"
              placeholder="Search by code, borrower, book..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`w-full h-9 pl-9 pr-3 rounded-md text-sm border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#181a20] border-[#2c323e] text-white placeholder-[#5a6272] focus:border-[#4d576a]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
              }`}
            />
          </div>

          {/* Sort Dropdown */}
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
                onClick={() => setSortBy('renewed-desc')}
                className={sortBy === 'renewed-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Requested Date (Newest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('renewed-asc')}
                className={sortBy === 'renewed-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Requested Date (Oldest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('borrow-desc')}
                className={sortBy === 'borrow-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Borrow Date (Newest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('borrow-asc')}
                className={sortBy === 'borrow-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Borrow Date (Oldest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('renewals-desc')}
                className={sortBy === 'renewals-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Renewals (Highest count first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('renewals-asc')}
                className={sortBy === 'renewals-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Renewals (Lowest count first)
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

        {/* Status Filter */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'RETURNED', label: 'Returned' },
            ]}
            onChange={(val) => setStatusFilter(val as LoanStatus)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Statuses"
          />
        )}

        {/* Borrower / Patron Filter (Searchable Combobox) */}
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

        {/* Add Filter Plus Button (DropdownMenu) */}
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
              {!activeFilterFields.includes('user') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'user'])}>
                  Borrower Patron
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

      {/* Renewals Table */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading renewal records...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedLoans.length > 0 && selectedLoanIds.length === sortedLoans.length
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
                          <DropdownMenuItem onClick={handleBulkReturn}>
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

                {/* Column: Requested Date & Time (Lần xin renew cuối) */}
                <th className={`w-44 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Requested Date
                </th>

                {/* Column: Borrowed Date (Lần mượn) */}
                <th className={`w-36 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrowed Date
                </th>

                {/* Column: Borrower */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrower
                </th>

                {/* Column: Book */}
                <th className={`max-w-[240px] py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Book
                </th>

                {/* Column: Renewals */}
                <th className={`w-28 py-3 px-4 text-xs sm:text-[13px] font-semibold text-center ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Renewals
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedLoans.map((l) => {
                const isSelected = selectedLoanIds.includes(l.id)
                const lastRenewedDt = parseDateTime(l.updatedAt || l.borrowDate)

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

                    {/* Requested Date (Lần xin renew cuối) */}
                    <td className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${t.titleColor}`}>
                      {lastRenewedDt.time ? `${lastRenewedDt.date} ${lastRenewedDt.time}` : lastRenewedDt.date}
                    </td>

                    {/* Borrowed Date (Lần mượn ban đầu) */}
                    <td className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${t.titleColor}`}>
                      {formatDate(l.borrowDate)}
                    </td>

                    {/* Borrower Info */}
                    <td className="py-3 px-4">
                      <span
                        onClick={(e) => {
                          if (l.userId) {
                            e.stopPropagation()
                            navigate(`/admin/members/${l.userId}`)
                          }
                        }}
                        className={`text-sm font-semibold truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                      >
                        {l.userFullName || `User #${l.userId}`}
                      </span>
                    </td>

                    {/* Book Info */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <span
                        onClick={(e) => {
                          if (l.bookId) {
                            e.stopPropagation()
                            navigate(`/admin/books/${l.bookId}`)
                          }
                        }}
                        className={`text-sm font-medium truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                        title={l.bookTitle}
                      >
                        {l.bookTitle || `Book #${l.bookId || l.bookCopyId}`}
                      </span>
                    </td>

                    {/* Renewals (Plain Text, No Badge, No Icon) */}
                    <td className={`py-3 px-4 text-center text-sm font-medium ${t.titleColor}`}>
                      {formatOrdinal(l.renewalCount)}
                    </td>
                  </tr>
                )
              })}

              {sortedLoans.length === 0 && (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No renewed loan records found matching filter.
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
