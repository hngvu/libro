import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconChevronDown,
  IconArrowsUpDown,
  IconBook2,
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
import { AdminCombobox } from '@/components/admin/AdminCombobox'
import { AdminDatePicker } from '@/components/admin/AdminDatePicker'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { LoanResponse, LoanStatus, UserResponse, BookCopyResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

export function CirculationDeskPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback, circulationSettings } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as
    | 'default'
    | 'due-asc'
    | 'due-desc'
    | 'borrow-desc'
    | 'borrow-asc'
    | 'borrower-asc'
    | 'title-asc'
  const initialStatus = (searchParams.get('status') || '') as LoanStatus | ''
  const initialUsers = searchParams.get('user') ? searchParams.get('user')!.split(',').filter(Boolean) : []

  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
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

  // Modal: Check Out (Issue Loan)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number>(0)
  const [scannedCopy, setScannedCopy] = useState<BookCopyResponse | null>(null)
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + circulationSettings.defaultLoanDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  )
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (statusFilter) params.set('status', statusFilter)
    if (userFilter.length > 0) params.set('user', userFilter.join(','))
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, statusFilter, userFilter, setSearchParams])

  // Load patrons and available copies for check out modal
  useEffect(() => {
    api.adminGetUsers({ page: 1, size: 100 })
      .then((res) => setUsers(res.content || []))
      .catch(() => {})

    api.adminGetBookCopies({ page: 1, size: 100 })
      .then((res) => setCopies(res.content || []))
      .catch(() => {})
  }, [])

  const fetchCirculationData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetLoans({
        keyword: keyword || undefined,
        status: statusFilter ? statusFilter : undefined,
        userId: userFilter.length > 0 ? userFilter.map(Number).filter(Boolean) : undefined,
        page: 1,
        size: 100,
      })
      setLoans(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load circulation records')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, userFilter, showFeedback])

  useEffect(() => {
    fetchCirculationData()
  }, [fetchCirculationData])

  const sortedLoans = useMemo(() => {
    let list = [...loans]
    if (sortBy === 'due-asc') {
      return list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    }
    if (sortBy === 'due-desc') {
      return list.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))
    }
    if (sortBy === 'borrow-desc') {
      return list.sort((a, b) => (b.borrowDate || '').localeCompare(a.borrowDate || ''))
    }
    if (sortBy === 'borrow-asc') {
      return list.sort((a, b) => (a.borrowDate || '').localeCompare(b.borrowDate || ''))
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

  const handleOpenCheckoutModal = () => {
    setSelectedUserId(0)
    setScannedCopy(null)
    setDueDate(
      new Date(Date.now() + circulationSettings.defaultLoanDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    )
    setCheckoutModalOpen(true)
  }

  const handleIssueCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      showFeedback('error', 'Please select a borrower patron')
      return
    }
    if (!scannedCopy) {
      showFeedback('error', 'Please select a book copy')
      return
    }
    if (scannedCopy.status !== 'AVAILABLE') {
      showFeedback('error', `This book copy is currently not available (${scannedCopy.status})`)
      return
    }

    setCheckoutLoading(true)
    try {
      await api.adminCreateLoan({
        userId: Number(selectedUserId),
        bookCopyId: Number(scannedCopy.id),
        dueDate,
      })
      showFeedback('success', `Loan issued successfully for copy ${scannedCopy.barcode}!`)
      setCheckoutModalOpen(false)
      fetchCirculationData()
      refreshCounts()
      api.adminGetBookCopies({ page: 1, size: 100 }).then((res) => setCopies(res.content || [])).catch(() => {})
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to issue loan')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleBulkReturn = async () => {
    const activeSelected = sortedLoans.filter(
      (l) => selectedLoanIds.includes(l.id) && l.status !== 'RETURNED'
    )
    if (activeSelected.length === 0) {
      showFeedback('error', 'None of the selected loans are currently active/borrowed.')
      return
    }
    if (!confirm(`Return ${activeSelected.length} selected active book(s)?`)) return
    try {
      for (const l of activeSelected) {
        await api.adminReturnLoan(l.id)
      }
      showFeedback('success', `${activeSelected.length} book(s) returned successfully!`)
      setSelectedLoanIds([])
      fetchCirculationData()
      refreshCounts()
      api.adminGetBookCopies({ page: 1, size: 100 }).then((res) => setCopies(res.content || [])).catch(() => {})
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to process bulk return')
    }
  }

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'BORROWED':
        return isDark
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'OVERDUE':
        return isDark
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      case 'RETURNED':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default:
        return isDark
          ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          : 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search loan code, borrower, book title, or barcode..."
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
                onClick={() => setSortBy('due-asc')}
                className={sortBy === 'due-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Due Date (Soonest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('due-desc')}
                className={sortBy === 'due-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Due Date (Latest first)
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

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleOpenCheckoutModal}
            className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${t.primaryBtn}`}
          >
            <IconPlus size={15} />
            Check Out
          </button>
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
              { value: 'BORROWED', label: 'BORROWED' },
              { value: 'OVERDUE', label: 'OVERDUE' },
              { value: 'RETURNED', label: 'RETURNED' },
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

      {/* Circulation Desk Table - Frameless style matching Book Catalog */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading circulation records...
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

                {/* Column: Borrower */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrower
                </th>

                {/* Column: Book */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Book
                </th>

                {/* Column: Borrowed Date */}
                <th className={`w-32 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrowed
                </th>

                {/* Column: Due Date */}
                <th className={`w-36 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Due Date
                </th>

                {/* Column: Status */}
                <th className={`w-28 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedLoans.map((l) => {
                const isSelected = selectedLoanIds.includes(l.id)
                const isOverdue = l.status === 'OVERDUE'

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
                        className="hover:underline text-blue-600 dark:text-blue-400 cursor-pointer"
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
                        className={`text-sm font-semibold truncate hover:underline hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
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
                        className={`text-sm font-medium truncate hover:underline hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                      >
                        {l.bookTitle || `Book #${l.bookId || l.bookCopyId}`}
                      </span>
                    </td>

                    {/* Borrowed Date */}
                    <td className={`py-3 px-4 text-xs font-mono ${t.subTextColor}`}>
                      {formatDate(l.borrowDate)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 text-xs font-mono">
                      <span className={isOverdue ? 'text-rose-500 font-bold' : t.titleColor}>
                        {formatDate(l.dueDate)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${getStatusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {sortedLoans.length === 0 && (
                <tr>
                  <td colSpan={7} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No circulation loan records found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Check Out (Issue Loan) */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent
          onClose={() => setCheckoutModalOpen(false)}
          className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Issue New Loan (Check Out)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleIssueCheckout} className="space-y-4 pt-1">
            {/* 1. Borrower Patron Selection */}
            <div>
              <AdminCombobox
                label="Borrower Patron *"
                placeholder="Search by name, phone, or email..."
                options={users.map((u) => ({
                  id: u.id || 0,
                  label: u.fullName || u.email,
                  keywords: [u.fullName || '', u.phone || '', u.email || ''],
                }))}
                selectedIds={selectedUserId ? [selectedUserId] : []}
                multiple={false}
                onChange={(ids) => setSelectedUserId(ids[0] || 0)}
              />
            </div>

            {/* 2. Available Book Copy Selection */}
            <div>
              <AdminCombobox
                label="Available Book Copy *"
                placeholder="Search barcode or title..."
                options={copies
                  .filter((c) => c.status === 'AVAILABLE')
                  .map((c) => ({
                    id: c.id,
                    label: c.bookTitle || `Book #${c.bookId || c.id}`,
                    sublabel: c.authors && c.authors.length > 0 ? c.authors.join(', ') : undefined,
                    image: c.bookCover || '',
                    keywords: [c.barcode || '', c.bookTitle || '', ...(c.authors || [])],
                  }))}
                selectedIds={scannedCopy ? [scannedCopy.id] : []}
                multiple={false}
                onChange={(ids) => {
                  const found = copies.find((c) => c.id === ids[0]) || null
                  setScannedCopy(found)
                }}
              />

              {/* Scanned Copy Preview Card */}
              {scannedCopy && (
                <div
                  className={`mt-2.5 p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    scannedCopy.status === 'AVAILABLE'
                      ? isDark
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-emerald-50/70 border-emerald-200'
                      : isDark
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div
                    className={`w-10 h-14 rounded-md border overflow-hidden shrink-0 flex items-center justify-center ${
                      isDark ? 'border-[#333a48] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
                    }`}
                  >
                    {scannedCopy.bookCover ? (
                      <img
                        src={scannedCopy.bookCover}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <IconBook2 size={22} className={t.mutedColor} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${t.titleColor}`}>
                        {scannedCopy.bookTitle || `Book ID #${scannedCopy.bookId}`}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase shrink-0 ${
                          scannedCopy.status === 'AVAILABLE'
                            ? isDark
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDark
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {scannedCopy.status}
                      </span>
                    </div>

                    {scannedCopy.authors && scannedCopy.authors.length > 0 && (
                      <p className={`text-xs ${t.subTextColor} truncate mt-0.5`}>
                        {scannedCopy.authors.join(', ')}
                      </p>
                    )}

                    <div className={`mt-1 text-xs space-y-0.5 ${t.subTextColor}`}>
                      <p className="flex items-center gap-2">
                        <span>
                          Barcode: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{scannedCopy.barcode}</span>
                        </span>
                        {scannedCopy.location && (
                          <>
                            <span>•</span>
                            <span>
                              Location: <span className="font-medium text-gray-900 dark:text-gray-200">{scannedCopy.location}</span>
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Due Date Picker */}
            <div>
              <AdminDatePicker
                label="Due Return Date"
                required
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                minDate={new Date().toISOString().split('T')[0]}
                format="dd/MM/yyyy"
              />
              <span className={`text-[11px] block mt-1 ${t.mutedColor}`}>
                Default period: {circulationSettings.defaultLoanDays} days from today
              </span>
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={checkoutLoading || !selectedUserId || !scannedCopy || scannedCopy.status !== 'AVAILABLE'}
                className={`h-9 px-5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
              >
                {checkoutLoading ? 'Processing...' : 'Complete Check Out'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
