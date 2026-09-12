import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconFilter2,
  IconBook2,
  IconChevronDown,
  IconArrowsUpDown,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { BookResponse, BookCopyResponse, BookCopyStatus } from '@/types/api'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function cleanCoverUrl(url?: string | null) {
  if (!url) return undefined
  return url.replace(/\._[^.]*(\.[a-zA-Z0-9]+)$/, '$1')
}

export function BookItemCopiesPage() {
  const { id } = useParams<{ id: string }>()
  const bookId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as 'default' | 'barcode-asc' | 'barcode-desc' | 'status-asc' | 'location-asc'
  const initialStatus = (searchParams.get('status') || '') as BookCopyStatus | ''

  const [book, setBook] = useState<BookResponse | null>(null)
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [selectedCopyIds, setSelectedCopyIds] = useState<number[]>([])
  const [keyword, setKeyword] = useState(initialKeyword)
  const [statusFilter, setStatusFilter] = useState<BookCopyStatus | ''>(initialStatus)
  const [loading, setLoading] = useState(false)

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (statusFilter) params.set('status', statusFilter)
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, statusFilter, setSearchParams])

  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [newQuantity, setNewQuantity] = useState<number | ''>('')
  const [newLocation, setNewLocation] = useState('')

  const sortedCopies = useMemo(() => {
    const list = [...copies]
    if (sortBy === 'barcode-asc') {
      return list.sort((a, b) => a.barcode.localeCompare(b.barcode))
    }
    if (sortBy === 'barcode-desc') {
      return list.sort((a, b) => b.barcode.localeCompare(a.barcode))
    }
    if (sortBy === 'status-asc') {
      return list.sort((a, b) => a.status.localeCompare(b.status))
    }
    if (sortBy === 'location-asc') {
      return list.sort((a, b) => (a.location || '').localeCompare(b.location || ''))
    }
    return list
  }, [copies, sortBy])

  const loadData = useCallback(async () => {
    if (!bookId) return
    setLoading(true)
    try {
      const [bookData, copiesData] = await Promise.all([
        api.adminGetBook(bookId),
        api.adminGetBookCopies({
          bookId,
          keyword: keyword || undefined,
          status: statusFilter || undefined,
          size: 100,
        }),
      ])
      setBook(bookData)
      setCopies(copiesData.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load book copies')
    } finally {
      setLoading(false)
    }
  }, [bookId, keyword, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleSelectCopy = (id: number) => {
    setSelectedCopyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCopyIds.length === sortedCopies.length) {
      setSelectedCopyIds([])
    } else {
      setSelectedCopyIds(sortedCopies.map((c) => c.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedCopyIds.length} selected physical copy(ies)?`)) return
    try {
      for (const id of selectedCopyIds) {
        await api.adminDeleteBookCopy(id)
      }
      showFeedback('success', `${selectedCopyIds.length} physical copy(ies) removed!`)
      setSelectedCopyIds([])
      loadData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected copies')
    }
  }

  const handleOpenAddCopy = () => {
    setNewQuantity('')
    setNewLocation('')
    setCopyModalOpen(true)
  }

  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book) return
    if (!newQuantity || Number(newQuantity) <= 0) {
      showFeedback('error', 'Please enter a valid quantity')
      return
    }
    const qty = Math.max(1, Math.min(100, Number(newQuantity)))
    try {
      for (let i = 0; i < qty; i++) {
        await api.adminCreateBookCopy({
          bookId: book.id,
          barcode: '',
          location: newLocation.trim() || undefined,
        })
      }
      showFeedback('success', `Added ${qty} copy(ies) for "${book.title}" successfully!`)
      setCopyModalOpen(false)
      loadData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to add book copies')
    }
  }

  const handleBulkUpdateStatus = async (status: BookCopyStatus) => {
    try {
      for (const id of selectedCopyIds) {
        await api.adminUpdateBookCopy(id, { status })
      }
      showFeedback('success', `Updated ${selectedCopyIds.length} copy(ies) status to ${status}!`)
      setSelectedCopyIds([])
      loadData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update copy status')
    }
  }

  if (loading && !book) {
    return (
      <div className={`p-10 text-center text-xs ${t.subTextColor}`}>
        Loading book copies...
      </div>
    )
  }

  if (!book) {
    return (
      <div className="p-8 text-center text-rose-500">
        Book not found or failed to load.
      </div>
    )
  }

  const availableCount = copies.filter((c) => c.status === 'AVAILABLE').length
  const borrowedCount = copies.filter((c) => c.status === 'BORROWED').length
  const maintenanceCount = copies.filter((c) => c.status === 'MAINTENANCE').length

  return (
    <div className="space-y-4">
      {/* Sub-Navigation Tabs */}
      <div className={`flex items-center gap-1 border-b pb-2 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
        <Link
          to={`/admin/books/${book.id}`}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]' : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
          }`}
        >
          Book Details
        </Link>
        <Link
          to={`/admin/books/${book.id}/copies`}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md border transition-colors ${
            isDark ? 'bg-[#252a34] text-white border-[#333a48]' : 'bg-gray-100 text-gray-900 border-gray-300'
          }`}
        >
          Copies ({copies.length})
        </Link>
      </div>

      {/* Book Summary Card */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap ${t.cardBg}`}>
        <div className="flex items-center gap-3.5 min-w-0">
          {book.cover ? (
            <div className="w-10 h-14 rounded-[2px] overflow-hidden shrink-0 border border-gray-300 dark:border-[#2c323e] bg-gray-100 dark:bg-[#16181d]">
              <img
                src={cleanCoverUrl(book.cover)}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-14 rounded-[2px] flex items-center justify-center shrink-0 border border-gray-300 dark:border-[#2c323e] bg-gray-100 dark:bg-[#16181d]">
              <IconBook2 size={20} className={t.mutedColor} />
            </div>
          )}

          <div className="min-w-0">
            <h2 className={`font-sans font-semibold text-base truncate ${t.titleColor}`}>
              {book.title}
            </h2>
            <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
              {book.authors?.map((a) => a.name).join(', ') || 'Unknown Author'} · {book.format} · ISBN: <span className="font-mono">{book.isbn}</span>
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className={`px-2.5 py-1 rounded-md border font-mono ${isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-gray-50 border-gray-300'}`}>
            Total: <strong className={t.titleColor}>{copies.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md border font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Available: <strong>{availableCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md border font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Borrowed: <strong>{borrowedCount}</strong>
          </span>
          {maintenanceCount > 0 && (
            <span className="px-2.5 py-1 rounded-md border font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
              Maintenance: <strong>{maintenanceCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search barcode number..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
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
                onClick={() => setSortBy('barcode-asc')}
                className={sortBy === 'barcode-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Barcode (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('barcode-desc')}
                className={sortBy === 'barcode-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Barcode (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('location-asc')}
                className={sortBy === 'location-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Location (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('status-asc')}
                className={sortBy === 'status-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleOpenAddCopy}
            className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Copy
          </button>
        </div>
      </div>

      {/* Filter Section */}
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
        <AdminFilterSelect
          label="Status"
          value={statusFilter}
          options={[
            { value: 'AVAILABLE', label: 'AVAILABLE' },
            { value: 'BORROWED', label: 'BORROWED' },
            { value: 'MAINTENANCE', label: 'MAINTENANCE' },
            { value: 'LOST', label: 'LOST' },
            { value: 'RESERVED', label: 'RESERVED' },
          ]}
          onChange={(val) => setStatusFilter(val as BookCopyStatus)}
          onRemove={() => setStatusFilter('')}
          allLabel="All Statuses"
        />

        {/* Reset Button */}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs sm:text-[13px] text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Copies Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
              <th className="w-10 px-3 text-center align-middle">
                <Checkbox
                  checked={
                    sortedCopies.length > 0 && selectedCopyIds.length === sortedCopies.length
                      ? true
                      : selectedCopyIds.length > 0
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
              <th className="px-4 text-left align-middle min-w-[200px]">
                {selectedCopyIds.length > 0 ? (
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                      {selectedCopyIds.length} selected
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
                        <DropdownMenuItem onClick={() => handleBulkUpdateStatus('AVAILABLE')}>
                          Mark as Available
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkUpdateStatus('MAINTENANCE')}>
                          Mark as Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkUpdateStatus('LOST')}>
                          Mark as Lost
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleBulkDelete}
                          className="text-rose-500 focus:text-rose-400"
                        >
                          Remove Selected ({selectedCopyIds.length})
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedCopyIds([])}>
                          Deselect all
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                    Barcode
                  </span>
                )}
              </th>
              <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                Location
              </th>
              <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                Last Borrowed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-transparent">
            {sortedCopies.map((c) => {
              const isSelected = selectedCopyIds.includes(c.id)
              const getStatusBadge = (status: BookCopyStatus) => {
                switch (status) {
                  case 'AVAILABLE':
                    return isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  case 'BORROWED':
                    return isDark
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  case 'MAINTENANCE':
                    return isDark
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  case 'LOST':
                    return isDark
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  case 'RESERVED':
                    return isDark
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  default:
                    return isDark
                      ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                }
              }

              return (
                <tr
                  key={c.id}
                  className={`group border-b transition-colors ${
                    isDark ? 'border-[#20242c]' : 'border-gray-200'
                  } ${
                    isSelected
                      ? isDark
                        ? 'bg-[#1e232b]'
                        : 'bg-blue-50/60'
                      : t.tableRow
                  }`}
                >
                  <td className="w-10 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectCopy(c.id)}
                      title={`Select copy ${c.barcode}`}
                      className={
                        isDark
                          ? '!border-[#3e4756] hover:!border-[#5a667b]'
                          : '!border-gray-400 hover:!border-gray-500'
                      }
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-semibold ${t.titleColor}`}>
                        {c.barcode}
                      </span>
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {c.location || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-xs font-mono ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      {c.lastLoanDate || '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {copies.length === 0 && (
              <tr>
                <td colSpan={4} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                  No physical copies registered for this title yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Copies */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader className="mb-4">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Add Copies
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCopy} className="space-y-4 pt-1">
            {/* Book Info Summary with Cover */}
            <div className={`p-3 rounded-xl border flex items-center gap-3.5 ${isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
              {book.cover ? (
                <div className="w-10 h-14 rounded-[2px] overflow-hidden shrink-0 border border-gray-300 dark:border-[#2c323e] bg-gray-100 dark:bg-[#16181d]">
                  <img
                    src={cleanCoverUrl(book.cover)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 h-14 rounded-[2px] flex items-center justify-center shrink-0 border border-gray-300 dark:border-[#2c323e] bg-gray-100 dark:bg-[#16181d]">
                  <IconBook2 size={20} className={t.mutedColor} />
                </div>
              )}
              <div className="min-w-0">
                <span className={`block font-semibold text-sm truncate ${t.titleColor}`}>{book.title}</span>
                <span className={`block mt-1 text-xs ${t.subTextColor}`}>
                  ISBN: {book.isbn || 'N/A'} • Format: {book.format || 'PAPERBACK'}
                </span>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={newQuantity}
                onChange={(e) =>
                  setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))
                }
                className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border outline-none ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Location
              </label>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border outline-none ${t.inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`h-9 px-5 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer ${t.primaryBtn}`}
              >
                Accession
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}