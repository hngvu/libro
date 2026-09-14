import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconChevronDown,
  IconArrowsUpDown,
  IconRefresh,
  IconClock,
  IconBook2,
  IconUser,
  IconCalendarEvent,
  IconCheck,
  IconX,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as
    | 'default'
    | 'date-desc'
    | 'date-asc'
    | 'deadline-asc'
    | 'queue-asc'
    | 'title-asc'
    | 'patron-asc'
  const initialStatus = (searchParams.get('status') || '') as ReservationStatus | ''
  const initialPage = Number(searchParams.get('page')) || 1

  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

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

  // Modal: Reservation Details
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedResDetail, setSelectedResDetail] = useState<ReservationResponse | null>(null)

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
    if (sortBy === 'queue-asc') {
      return list.sort((a, b) => (a.queuePosition || 99) - (b.queuePosition || 99))
    }
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''))
    }
    if (sortBy === 'patron-asc') {
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

  const handleMarkReady = async (id: number) => {
    setActionLoading(id)
    try {
      await api.adminMarkReservationReady(id)
      showFeedback('success', 'Assigned available copy and marked hold as READY FOR PICKUP!')
      if (detailModalOpen) setDetailModalOpen(false)
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to mark reservation ready. No available copies?')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFulfill = async (id: number) => {
    setActionLoading(id)
    try {
      await api.adminFulfillReservation(id)
      showFeedback('success', 'Reservation fulfilled and converted into active checkout loan!')
      if (detailModalOpen) setDetailModalOpen(false)
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to fulfill reservation checkout.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: number) => {
    const reason = prompt('Reason for cancelling this reservation (optional):', 'Cancelled by librarian')
    if (reason === null) return

    setActionLoading(id)
    try {
      await api.adminCancelReservation(id, reason)
      showFeedback('success', 'Reservation cancelled and queue updated.')
      if (detailModalOpen) setDetailModalOpen(false)
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to cancel reservation.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleProcessExpired = async () => {
    setLoading(true)
    try {
      const res = await api.adminProcessExpiredReservations()
      showFeedback('success', `Processed expiry check: ${res.expiredCount} hold(s) expired.`)
      await fetchReservations()
    } catch {
      showFeedback('error', 'Failed to run hold expiry sweep.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PENDING':
        return isDark
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      case 'FULFILLED':
        return isDark
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CANCELLED':
      case 'EXPIRED':
        return isDark
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-rose-50 text-rose-700 border-rose-200'
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
              placeholder="Search patron, book title, or RES code..."
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
                onClick={() => setSortBy('queue-asc')}
                className={sortBy === 'queue-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Queue Position (1st in queue)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('title-asc')}
                className={sortBy === 'title-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Book Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('patron-asc')}
                className={sortBy === 'patron-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Patron Name (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={handleProcessExpired}
            title="Sweep expired pickup holds"
            className={`h-9 px-3.5 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconClock size={14} /> Sweep Expired
          </button>
          <button
            onClick={() => fetchReservations()}
            disabled={loading}
            className={`h-9 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.secondaryBtn}`}
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
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

                {/* Column: Hold Code / Bulk Actions */}
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
                      Hold Code
                    </span>
                  )}
                </th>

                {/* Column: Patron Details */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Patron
                </th>

                {/* Column: Reserved Book */}
                <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Reserved Book
                </th>

                {/* Column: Queue / State */}
                <th className={`w-28 py-3 px-4 text-xs sm:text-[13px] font-semibold text-center ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Queue
                </th>

                {/* Column: Requested Date */}
                <th className={`w-32 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Requested
                </th>

                {/* Column: Pickup Deadline */}
                <th className={`w-36 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Pickup Deadline
                </th>

                {/* Column: Status */}
                <th className={`w-28 py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Status
                </th>

                {/* Column: Actions */}
                <th className={`w-36 py-3 px-4 text-xs sm:text-[13px] font-semibold text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedReservations.map((r) => {
                const isSelected = selectedResIds.includes(r.id)
                const isActionBusy = actionLoading === r.id

                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelectedResDetail(r)
                      setDetailModalOpen(true)
                    }}
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
                    <td className="py-3 px-4 font-mono text-xs font-bold text-blue-500">
                      {r.reservationCode}
                    </td>

                    {/* Patron Info */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold truncate ${t.titleColor}`}>
                          {r.userFullName || r.userEmail || `User #${r.userId}`}
                        </span>
                        {r.userEmail && (
                          <span className={`text-xs font-mono truncate max-w-[160px] ${t.mutedColor}`}>
                            {r.userEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Book Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 max-w-[280px]">
                        {r.bookCover ? (
                          <img
                            src={r.bookCover}
                            alt={r.bookTitle}
                            className="w-8 h-11 object-cover rounded shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-8 h-11 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <IconBook2 size={16} className="text-blue-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${t.titleColor}`}>{r.bookTitle}</p>
                          {r.barcode && (
                            <span className="font-mono text-[10px] text-emerald-400 font-semibold block mt-0.5">
                              Copy: {r.barcode} ({r.location || 'Shelf'})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Queue / Position */}
                    <td className="py-3 px-4 text-center">
                      {r.status === 'PENDING' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                          Queue #{r.queuePosition || 1}
                        </span>
                      ) : r.status === 'READY_FOR_PICKUP' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Ready
                        </span>
                      ) : (
                        <span className={`text-xs ${t.mutedColor}`}>—</span>
                      )}
                    </td>

                    {/* Requested Date */}
                    <td className={`py-3 px-4 text-xs font-mono ${t.subTextColor}`}>
                      {r.reservedAt ? r.reservedAt.split('T')[0] : '—'}
                    </td>

                    {/* Pickup Deadline */}
                    <td className="py-3 px-4 text-xs font-mono">
                      {r.pickupDeadline ? (
                        <span className={r.status === 'READY_FOR_PICKUP' ? 'text-amber-400 font-bold' : t.titleColor}>
                          {r.pickupDeadline.split('T')[0]}
                        </span>
                      ) : (
                        <span className={t.mutedColor}>—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${getStatusBadge(r.status)}`}>
                        {r.status === 'READY_FOR_PICKUP' ? 'READY' : r.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'PENDING' && (
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleMarkReady(r.id)}
                            className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${t.secondaryBtn}`}
                            title="Assign copy and notify patron"
                          >
                            <IconCheck size={13} /> Ready
                          </button>
                        )}
                        {r.status === 'READY_FOR_PICKUP' && (
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleFulfill(r.id)}
                            className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
                            title="Check out to patron"
                          >
                            <IconCheck size={13} /> Check Out
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP') && (
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleCancel(r.id)}
                            className={`h-7 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
                              isDark ? 'border-[#2c323e]' : 'border-gray-200'
                            }`}
                            title="Cancel reservation"
                          >
                            <IconX size={13} />
                          </button>
                        )}
                        {r.status === 'FULFILLED' && (
                          <span className="text-xs text-emerald-500 font-medium">Fulfilled</span>
                        )}
                        {(r.status === 'CANCELLED' || r.status === 'EXPIRED') && (
                          <span className={`text-xs ${t.mutedColor}`}>{r.status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {sortedReservations.length === 0 && (
                <tr>
                  <td colSpan={9} className={`py-12 text-center text-sm ${t.subTextColor}`}>
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

      {/* Modal: Reservation Detail View */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent
          onClose={() => setDetailModalOpen(false)}
          className={`sm:max-w-lg rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Reservation Hold Details
            </DialogTitle>
          </DialogHeader>

          {selectedResDetail && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs ${t.mutedColor}`}>Hold Code</span>
                  <p className="text-sm font-mono font-bold text-blue-500">
                    {selectedResDetail.reservationCode}
                  </p>
                </div>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded border uppercase ${getStatusBadge(selectedResDetail.status)}`}>
                  {selectedResDetail.status}
                </span>
              </div>

              {/* Patron & Book Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className={`p-3 rounded-xl border ${t.cardBg}`}>
                  <span className={`text-[11px] font-medium block mb-1 flex items-center gap-1 ${t.mutedColor}`}>
                    <IconUser size={13} /> Patron
                  </span>
                  <p className={`text-xs font-semibold ${t.titleColor}`}>
                    {selectedResDetail.userFullName || selectedResDetail.userEmail || `User #${selectedResDetail.userId}`}
                  </p>
                  {selectedResDetail.userEmail && (
                    <p className={`text-[11px] font-mono mt-0.5 ${t.subTextColor}`}>
                      {selectedResDetail.userEmail}
                    </p>
                  )}
                  {selectedResDetail.userPhone && (
                    <p className={`text-[11px] mt-0.5 ${t.mutedColor}`}>
                      Tel: {selectedResDetail.userPhone}
                    </p>
                  )}
                </div>

                <div className={`p-3 rounded-xl border ${t.cardBg}`}>
                  <span className={`text-[11px] font-medium block mb-1 flex items-center gap-1 ${t.mutedColor}`}>
                    <IconBook2 size={13} /> Reserved Book
                  </span>
                  <p className={`text-xs font-semibold truncate ${t.titleColor}`}>
                    {selectedResDetail.bookTitle || `Book #${selectedResDetail.bookId}`}
                  </p>
                  {selectedResDetail.barcode ? (
                    <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                      Barcode: {selectedResDetail.barcode} ({selectedResDetail.location || 'Shelf'})
                    </p>
                  ) : (
                    <p className={`text-[11px] mt-0.5 ${t.mutedColor}`}>
                      Queue Position: #{selectedResDetail.queuePosition || 1}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline Dates */}
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${t.cardBg}`}>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 ${t.subTextColor}`}>
                    <IconCalendarEvent size={14} className="text-blue-400" /> Requested Date:
                  </span>
                  <span className={`font-mono font-medium ${t.titleColor}`}>
                    {selectedResDetail.reservedAt ? selectedResDetail.reservedAt.replace('T', ' ') : '—'}
                  </span>
                </div>
                {selectedResDetail.pickupDeadline && (
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${t.subTextColor}`}>
                      <IconClock size={14} className="text-amber-400" /> Pickup Deadline:
                    </span>
                    <span className="font-mono font-bold text-amber-500">
                      {selectedResDetail.pickupDeadline.replace('T', ' ')}
                    </span>
                  </div>
                )}
                {selectedResDetail.fulfilledAt && (
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${t.subTextColor}`}>
                      <IconCheck size={14} className="text-emerald-400" /> Fulfilled Date:
                    </span>
                    <span className="font-mono font-medium text-emerald-500">
                      {selectedResDetail.fulfilledAt.replace('T', ' ')}
                    </span>
                  </div>
                )}
                {selectedResDetail.cancellationReason && (
                  <div className="pt-1 border-t border-gray-100 dark:border-[#262a34]">
                    <span className={`text-[11px] block ${t.mutedColor}`}>Cancellation Reason:</span>
                    <p className="text-rose-400 text-xs mt-0.5">{selectedResDetail.cancellationReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer ${t.secondaryBtn}`}
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  {selectedResDetail.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleMarkReady(selectedResDetail.id)}
                      className={`h-9 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${t.secondaryBtn}`}
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                  {selectedResDetail.status === 'READY_FOR_PICKUP' && (
                    <button
                      type="button"
                      onClick={() => handleFulfill(selectedResDetail.id)}
                      className={`h-9 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
                    >
                      Check Out (Fulfill)
                    </button>
                  )}
                  {(selectedResDetail.status === 'PENDING' || selectedResDetail.status === 'READY_FOR_PICKUP') && (
                    <button
                      type="button"
                      onClick={() => handleCancel(selectedResDetail.id)}
                      className={`h-9 px-3 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
                        isDark ? 'border-[#2c323e]' : 'border-gray-200'
                      }`}
                    >
                      Cancel Hold
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
