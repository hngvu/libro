import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconChevronDown,
  IconArrowsUpDown,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminCombobox } from '@/components/admin/AdminCombobox'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import { AdminFilterCombobox } from '@/components/admin/AdminFilterCombobox'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { BookCopyResponse, BookCopyStatus, BookResponse } from '@/types/api'
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

const standardLocations = [
  'Main Stacks - 1F',
  'Main Stacks - 2F',
  'Main Stacks - 3F',
  'Reserve Shelf - 1F',
  'Reading Room - 2F',
  'Archive Section - B1',
  'Reference Section - 2F',
]

export function BookCopiesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as 'default' | 'barcode-asc' | 'barcode-desc' | 'status-asc' | 'book-asc'
  const initialStatus = (searchParams.get('status') || '') as BookCopyStatus | ''
  const initialBooks = searchParams.get('book') ? searchParams.get('book')!.split(',').filter(Boolean) : []
  const initialLocations = searchParams.get('location') ? searchParams.get('location')!.split(',').filter(Boolean) : []

  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [books, setBooks] = useState<BookResponse[]>([])
  const [selectedCopyIds, setSelectedCopyIds] = useState<number[]>([])
  const [keyword, setKeyword] = useState(initialKeyword)
  const [statusFilter, setStatusFilter] = useState<BookCopyStatus | ''>(initialStatus)
  const [bookFilter, setBookFilter] = useState<string[]>(initialBooks)
  const [locationFilter, setLocationFilter] = useState<string[]>(initialLocations)
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>(() => {
    const fields: string[] = []
    if (initialStatus) fields.push('status')
    if (initialBooks.length > 0) fields.push('book')
    if (initialLocations.length > 0) fields.push('location')
    return fields
  })
  const [loading, setLoading] = useState(false)

  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [formData, setFormData] = useState<{
    bookId: number
    quantity: number | ''
    location: string
  }>({
    bookId: 0,
    quantity: '',
    location: '',
  })

  // Load books catalog on mount for book filter and modal
  useEffect(() => {
    api.adminGetBooks({ page: 1, size: 100 })
      .then((res) => setBooks(res.content || []))
      .catch(() => {})
  }, [])

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (statusFilter) params.set('status', statusFilter)
    if (bookFilter.length > 0) params.set('book', bookFilter.join(','))
    if (locationFilter.length > 0) params.set('location', locationFilter.join(','))
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, statusFilter, bookFilter, locationFilter, setSearchParams])

  const availableLocations = useMemo(() => {
    const set = new Set(standardLocations)
    copies.forEach((c) => {
      if (c.location && c.location.trim()) {
        set.add(c.location.trim())
      }
    })
    return Array.from(set).map((loc) => ({ value: loc, label: loc }))
  }, [copies])

  const sortedCopies = useMemo(() => {
    let list = [...copies]
    if (locationFilter.length > 0) {
      list = list.filter((c) => c.location && locationFilter.includes(c.location))
    }
    if (sortBy === 'barcode-asc') {
      return list.sort((a, b) => a.barcode.localeCompare(b.barcode))
    }
    if (sortBy === 'barcode-desc') {
      return list.sort((a, b) => b.barcode.localeCompare(a.barcode))
    }
    if (sortBy === 'status-asc') {
      return list.sort((a, b) => a.status.localeCompare(b.status))
    }
    if (sortBy === 'book-asc') {
      return list.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''))
    }
    return list
  }, [copies, sortBy, locationFilter])

  const fetchCopies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetBookCopies({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        bookId: bookFilter.length > 0 ? bookFilter.map(Number) : undefined,
        page: 1,
        size: 50,
      })
      setCopies(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load physical copies')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, bookFilter, showFeedback])

  useEffect(() => {
    fetchCopies()
  }, [fetchCopies])

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
    if (field === 'book') setBookFilter([])
    if (field === 'location') setLocationFilter([])
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setStatusFilter('')
    setBookFilter([])
    setLocationFilter([])
  }

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
      fetchCopies()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove selected copies')
    }
  }

  const handleOpenAddCopy = () => {
    if (books.length === 0) {
      api.adminGetBooks({ page: 1, size: 100 }).then((res) => {
        const list = res.content || []
        setBooks(list)
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, bookId: list[0].id }))
        }
      })
    }
    setFormData({
      bookId: books.length > 0 ? books[0].id : 0,
      quantity: '',
      location: '',
    })
    setCopyModalOpen(true)
  }

  const handleSaveCopies = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.bookId) {
      showFeedback('error', 'Please select a book edition')
      return
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      showFeedback('error', 'Please enter a valid quantity')
      return
    }
    const qty = Math.max(1, Math.min(100, Number(formData.quantity)))
    try {
      for (let i = 0; i < qty; i++) {
        await api.adminCreateBookCopy({
          barcode: '',
          bookId: Number(formData.bookId),
          location: formData.location.trim() || undefined,
        })
      }
      showFeedback('success', `Added ${qty} copy(ies) successfully!`)
      setCopyModalOpen(false)
      fetchCopies()
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
      fetchCopies()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update copy status')
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
              placeholder="Search barcode number..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCopies()}
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
                onClick={() => setSortBy('book-asc')}
                className={sortBy === 'book-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Book Title (A-Z)
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
              { value: 'AVAILABLE', label: 'AVAILABLE' },
              { value: 'BORROWED', label: 'BORROWED' },
              { value: 'MAINTENANCE', label: 'MAINTENANCE' },
              { value: 'LOST', label: 'LOST' },
              { value: 'RESERVED', label: 'RESERVED' },
            ]}
            onChange={(val) => setStatusFilter(val as BookCopyStatus)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Statuses"
          />
        )}

        {/* Book Title Filter (Searchable Combobox) */}
        {activeFilterFields.includes('book') && (
          <AdminFilterCombobox
            label="Book Title"
            value={bookFilter}
            options={books.map((b) => ({ value: String(b.id), label: b.title }))}
            onChange={(val) => setBookFilter(Array.isArray(val) ? val : val ? [val] : [])}
            onRemove={() => removeFilterField('book')}
            multiple={true}
            placeholder="Search book title..."
          />
        )}

        {/* Location Filter (Searchable Combobox) */}
        {activeFilterFields.includes('location') && (
          <AdminFilterCombobox
            label="Location"
            value={locationFilter}
            options={availableLocations}
            onChange={(val) => setLocationFilter(Array.isArray(val) ? val : val ? [val] : [])}
            onRemove={() => removeFilterField('location')}
            multiple={true}
            placeholder="Search location..."
          />
        )}

        {/* Add Filter Plus Button (DropdownMenu) */}
        {activeFilterFields.length < 3 && (
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
              {!activeFilterFields.includes('book') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'book'])}>
                  Book Title
                </DropdownMenuItem>
              )}
              {!activeFilterFields.includes('location') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'location'])}>
                  Location
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

      {/* Copies Table - Frameless */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading physical copies...
        </div>
      ) : (
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
                  Book Title
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
                    onClick={() => c.bookId && navigate(`/admin/books/${c.bookId}`)}
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
                        onCheckedChange={() => toggleSelectCopy(c.id)}
                        title={`Select copy ${c.barcode}`}
                        className={
                          isDark
                            ? '!border-[#3e4756] hover:!border-[#5a667b]'
                            : '!border-gray-400 hover:!border-gray-500'
                        }
                      />
                    </td>

                    {/* Barcode with inline status badge */}
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

                    {/* Book Title */}
                    <td className={`py-3 px-4 text-sm font-medium max-w-[320px] truncate ${t.titleColor}`}>
                      {c.bookTitle || (c.bookId ? `Book #${c.bookId}` : '—')}
                    </td>

                    {/* Location */}
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {c.location || '—'}
                    </td>

                    {/* Last Borrowed */}
                    <td className={`py-3 px-4 text-xs font-mono text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      {c.lastLoanDate || '—'}
                    </td>
                  </tr>
                )
              })}
              {copies.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No physical copies registered matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Copies */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader className="mb-4">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Add Copies
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCopies} className="space-y-4 pt-1">
            {/* Field 1: Book Edition / ISBN */}
            <div>
              <AdminCombobox
                label="Book Edition *"
                options={books.map((b) => {
                  const authors = b.authors && b.authors.length > 0 ? b.authors.map((a) => a.name).join(', ') : ''

                  return {
                    id: b.id,
                    label: b.title,
                    sublabel: authors || undefined,
                    image: cleanCoverUrl(b.cover),
                    keywords: [b.title, b.isbn || '', b.handle, authors].filter(Boolean) as string[],
                  }
                })}
                selectedIds={formData.bookId ? [formData.bookId] : []}
                multiple={false}
                onChange={(ids) => setFormData({ ...formData, bookId: ids[0] || 0 })}
              />
            </div>

            {/* Field 2: Quantity */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>

            {/* Field 3: Location */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Location
              </label>
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`h-9 px-5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
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
