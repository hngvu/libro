import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconChevronDown,
  IconArrowsUpDown,
  IconChevronLeft,
  IconChevronRight,
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
import { api } from '@/services/api'
import type { ReservationResponse, ReservationStatus } from '@/types/api'

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


function formatReservationStatus(status?: ReservationStatus | string) {
  if (!status) return '—'
  switch (status) {
    case 'READY_FOR_PICKUP':
      return 'Ready for Pickup'
    case 'PENDING':
      return 'Pending'
    case 'FULFILLED':
      return 'Fulfilled'
    case 'CANCELLED':
      return 'Cancelled'
    case 'EXPIRED':
      return 'Expired'
    default: {
      const s = status.toLowerCase()
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
  }
}

export function ReservationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as
    | 'default'
    | 'date-desc'
    | 'date-asc'
    | 'deadline-asc'
    | 'title-asc'
    | 'borrower-asc'
  const initialStatus = (searchParams.get('status') || '') as ReservationStatus | ''
  const initialPage = Number(searchParams.get('page')) || 1

  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Filters & Pagination state
  const [keyword, setKeyword] = useState(initialKeyword)
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>(initialStatus)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [activeFilterFields, setActiveFilterFields] = useState<string[]>(() => {
    const fields: string[] = []
    if (initialStatus) fields.push('status')
    return fields
  })

  // Selection for bulk actions
  const [selectedResIds, setSelectedResIds] = useState<number[]>([])

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (statusFilter) params.set('status', statusFilter)
    if (page > 1) params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, statusFilter, page, setSearchParams])

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetReservations({
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
        page: page - 1,
        size: 15,
      })
      setReservations(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch {
      showFeedback('error', 'Failed to load reservations list.')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, page, showFeedback])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const sortedReservations = useMemo(() => {
    let list = [...reservations]
    if (sortBy === 'date-desc') {
      return list.sort((a, b) => (b.reservedAt || '').localeCompare(a.reservedAt || ''))
    }
    if (sortBy === 'date-asc') {
      return list.sort((a, b) => (a.reservedAt || '').localeCompare(b.reservedAt || ''))
    }
    if (sortBy === 'deadline-asc') {
      return list.sort((a, b) => (a.pickupDeadline || '').localeCompare(b.pickupDeadline || ''))
    }
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''))
    }
    if (sortBy === 'borrower-asc') {
      return list.sort((a, b) => (a.userFullName || a.userEmail || '').localeCompare(b.userFullName || b.userEmail || ''))
    }
    return list
  }, [reservations, sortBy])

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
    setPage(1)
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setStatusFilter('')
    setPage(1)
  }

  const toggleSelectRes = (id: number) => {
    setSelectedResIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedResIds.length === sortedReservations.length) {
      setSelectedResIds([])
    } else {
      setSelectedResIds(sortedReservations.map((r) => r.id))
    }
  }

  const getStatusBadge = (status?: ReservationStatus | string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return isDark
          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PENDING':
        return isDark
          ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      case 'FULFILLED':
        return isDark
          ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CANCELLED':
      case 'EXPIRED':
        return isDark
          ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return isDark
          ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
          : 'bg-gray-100 text-gray-700 border-gray-200'
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
              placeholder="Search by code, borrower, book..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
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
                Request Date (Newest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('date-asc')}
                className={sortBy === 'date-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Request Date (Oldest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('deadline-asc')}
                className={sortBy === 'deadline-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Pickup Deadline (Soonest first)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('title-asc')}
                className={sortBy === 'title-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Book Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('borrower-asc')}
                className={sortBy === 'borrower-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Borrower Name (A-Z)
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
              { value: 'PENDING', label: 'In Queue (Pending)' },
              { value: 'READY_FOR_PICKUP', label: 'Ready For Pickup' },
              { value: 'FULFILLED', label: 'Fulfilled' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'EXPIRED', label: 'Expired' },
            ]}
            onChange={(val) => {
              setStatusFilter(val as ReservationStatus)
              setPage(1)
            }}
            onRemove={() => removeFilterField('status')}
            allLabel="All Statuses"
          />
        )}

        {/* Add Filter Plus Button */}
        {!activeFilterFields.includes('status') && (
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
              <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'status'])}>
                Hold Status
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

      {/* Reservations Table - Frameless style */}
      {loading && reservations.length === 0 ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading reservations...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedReservations.length > 0 && selectedResIds.length === sortedReservations.length
                        ? true
                        : selectedResIds.length > 0
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

                {/* Column: Hold Code */}
                <th className="px-4 text-left align-middle min-w-[140px]">
                  {selectedResIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedResIds.length} selected
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
                          <DropdownMenuItem onClick={() => setSelectedResIds([])}>
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

                {/* Column: Requested Date & Time */}
                <th className={`w-44 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Requested Date
                </th>

                {/* Column: Borrower */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrower
                </th>

                {/* Column: Book */}
                <th className={`max-w-[240px] py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Book
                </th>

                {/* Column: Status */}
                <th className={`w-32 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedReservations.map((r) => {
                const isSelected = selectedResIds.includes(r.id)
                const reqDt = parseDateTime(r.reservedAt)

                return (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/admin/circulation/reservations/${r.id}`)}
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
                        onCheckedChange={() => toggleSelectRes(r.id)}
                        title={`Select hold ${r.reservationCode}`}
                        className={
                          isDark
                            ? '!border-[#3e4756] hover:!border-[#5a667b]'
                            : '!border-gray-400 hover:!border-gray-500'
                        }
                      />
                    </td>

                    {/* Hold Code */}
                    <td className={`py-3 px-4 text-xs font-mono font-medium ${t.titleColor}`}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/circulation/reservations/${r.id}`)
                        }}
                        className="text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {r.reservationCode}
                      </span>
                    </td>

                    {/* Requested Date & Time */}
                    <td className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${t.titleColor}`}>
                      {reqDt.time ? `${reqDt.date} ${reqDt.time}` : reqDt.date}
                    </td>

                    {/* Patron Info */}
                    <td className="py-3 px-4">
                      <span
                        onClick={(e) => {
                          if (r.userId) {
                            e.stopPropagation()
                            navigate(`/admin/members/${r.userId}`)
                          }
                        }}
                        className={`text-sm font-semibold truncate block hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                      >
                        {r.userFullName || `User #${r.userId}`}
                      </span>
                    </td>

                    {/* Book Info */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <span
                        onClick={(e) => {
                          if (r.bookId) {
                            e.stopPropagation()
                            navigate(`/admin/books/${r.bookId}`)
                          }
                        }}
                        className={`text-sm font-medium truncate block hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${t.titleColor}`}
                        title={r.bookTitle}
                      >
                        {r.bookTitle || `Book #${r.bookId}`}
                      </span>
                      {r.barcode && (
                        <span className="font-mono text-xs text-emerald-500 dark:text-emerald-400 font-medium block mt-0.5">
                          Copy: {r.barcode} ({r.location || 'Shelf'})
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${getStatusBadge(r.status)}`}>
                        {formatReservationStatus(r.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {sortedReservations.length === 0 && (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No hold reservations found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className={`text-xs ${t.mutedColor}`}>
            Showing page <strong className={t.titleColor}>{page}</strong> of <strong className={t.titleColor}>{totalPages}</strong> ({totalElements} total holds)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 ${t.secondaryBtn}`}
            >
              <IconChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 ${t.secondaryBtn}`}
            >
              Next <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
