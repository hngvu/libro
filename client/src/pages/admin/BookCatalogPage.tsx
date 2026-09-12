import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconBook2,
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
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { BookResponse, BookFormat, BookStatus, GenrePublicResponse } from '@/types/api'

export function BookCatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as 'default' | 'title-asc' | 'title-desc' | 'year-desc' | 'year-asc' | 'copies-desc'
  const initialFormat = (searchParams.get('format') || '') as BookFormat | ''
  const initialStatus = searchParams.get('status') || ''
  const initialGenres = searchParams.get('genre') ? searchParams.get('genre')!.split(',').filter(Boolean) : []

  const [books, setBooks] = useState<BookResponse[]>([])
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [formatFilter, setFormatFilter] = useState<BookFormat | ''>(initialFormat)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [genreFilter, setGenreFilter] = useState<string[]>(initialGenres)
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>(() => {
    const fields: string[] = []
    if (initialFormat) fields.push('format')
    if (initialStatus) fields.push('status')
    if (initialGenres.length > 0) fields.push('genre')
    return fields
  })
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (formatFilter) params.set('format', formatFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (genreFilter.length > 0) params.set('genre', genreFilter.join(','))
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, formatFilter, statusFilter, genreFilter, setSearchParams])

  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.content || []))
      .catch(() => {})
  }, [])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetBooks({
        keyword: keyword || undefined,
        format: formatFilter || undefined,
        status: (statusFilter as BookStatus) || undefined,
        genre: genreFilter.length > 0 ? genreFilter : undefined,
        page: 1,
        size: 50,
      })
      setBooks(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load books')
    } finally {
      setLoading(false)
    }
  }, [keyword, formatFilter, statusFilter, genreFilter])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const sortedBooks = useMemo(() => {
    const list = [...books]
    if (sortBy === 'title-asc') {
      return list.sort((a, b) => a.title.localeCompare(b.title))
    }
    if (sortBy === 'title-desc') {
      return list.sort((a, b) => b.title.localeCompare(a.title))
    }
    if (sortBy === 'year-desc') {
      return list.sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0))
    }
    if (sortBy === 'year-asc') {
      return list.sort((a, b) => (a.publicationYear || 0) - (b.publicationYear || 0))
    }
    if (sortBy === 'copies-desc') {
      return list.sort((a, b) => (b.totalCopies || 0) - (a.totalCopies || 0))
    }
    return list
  }, [books, sortBy])

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'format') setFormatFilter('')
    if (field === 'status') setStatusFilter('')
    if (field === 'genre') setGenreFilter([])
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setFormatFilter('')
    setStatusFilter('')
    setGenreFilter([])
  }

  const toggleSelectBook = (id: number) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedBookIds.length === sortedBooks.length) {
      setSelectedBookIds([])
    } else {
      setSelectedBookIds(sortedBooks.map((b) => b.id))
    }
  }

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedBookIds.length} selected book(s)?`)) return
    try {
      for (const id of selectedBookIds) {
        await api.adminDeleteBook(id)
      }
      showFeedback('success', `${selectedBookIds.length} book(s) archived successfully!`)
      setSelectedBookIds([])
      fetchBooks()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive selected books')
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
              placeholder="Search title, handle, or ISBN..."
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
                onClick={() => setSortBy('title-asc')}
                className={sortBy === 'title-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('title-desc')}
                className={sortBy === 'title-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Title (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('year-desc')}
                className={sortBy === 'year-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Publication Year (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('year-asc')}
                className={sortBy === 'year-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Publication Year (Oldest)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('copies-desc')}
                className={sortBy === 'copies-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Total Copies (High to Low)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={() => navigate('/admin/books/new')}
            className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Book
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

        {/* Format Filter (if active) */}
        {activeFilterFields.includes('format') && (
          <AdminFilterSelect
            label="Format"
            value={formatFilter}
            options={[
              { value: 'PAPERBACK', label: 'Paperback' },
              { value: 'HARDCOVER', label: 'Hardcover' },
              { value: 'EBOOK', label: 'E-Book' },
              { value: 'AUDIOBOOK', label: 'Audiobook' },
            ]}
            onChange={(val) => setFormatFilter(val as BookFormat)}
            onRemove={() => removeFilterField('format')}
            allLabel="All Formats"
          />
        )}

        {/* Status Filter (if active) */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
            onChange={(val) => setStatusFilter(val as BookStatus)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Status"
          />
        )}

        {/* Genre Filter (Searchable Combobox for dynamic data) */}
        {activeFilterFields.includes('genre') && (
          <AdminFilterCombobox
            label="Genre"
            value={genreFilter}
            options={genres.map((g) => ({ value: g.handle, label: g.name }))}
            onChange={(val) => setGenreFilter(Array.isArray(val) ? val : val ? [val] : [])}
            onRemove={() => removeFilterField('genre')}
            multiple={true}
            placeholder="Search genre..."
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
              {!activeFilterFields.includes('format') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'format'])}>
                  Format
                </DropdownMenuItem>
              )}
              {!activeFilterFields.includes('status') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'status'])}>
                  Status
                </DropdownMenuItem>
              )}
              {!activeFilterFields.includes('genre') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'genre'])}>
                  Genre
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

      {/* Catalog Table - Frameless (bỏ viền bọc) */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading catalog titles...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedBooks.length > 0 && selectedBookIds.length === sortedBooks.length
                        ? true
                        : selectedBookIds.length > 0
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

                {/* Column 2: Book / Selected Action */}
                <th className="px-4 text-left align-middle min-w-[200px]">
                  {selectedBookIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedBookIds.length} selected
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
                            onClick={handleBulkArchive}
                            className="text-rose-500 focus:text-rose-400"
                          >
                            Archive Selected ({selectedBookIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedBookIds([])}>
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Book
                    </span>
                  )}
                </th>

                {/* Column 3: ISBN */}
                <th className={`w-36 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  ISBN
                </th>

                {/* Column 4: Format */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Format
                </th>

                {/* Column 5: Copies */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Copies
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedBooks.map((b) => {
                const isSelected = selectedBookIds.includes(b.id)
                return (
                  <tr
                    key={b.id}
                    onClick={() => navigate(`/admin/books/${b.id}`)}
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
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectBook(b.id)}
                        title={`Select ${b.title}`}
                        className={
                          isDark
                            ? '!border-[#3e4756] hover:!border-[#5a667b]'
                            : '!border-gray-400 hover:!border-gray-500'
                        }
                      />
                    </td>

                    {/* 1. Book Title + Cover + Status Badge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {b.cover ? (
                          <div
                            className={`w-9 h-12 rounded-[2px] overflow-hidden shrink-0 shadow-xs border flex items-start justify-center ${
                              isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
                            }`}
                          >
                            <img
                              src={b.cover}
                              alt={b.title}
                              className="w-full h-auto object-top"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-9 h-12 rounded-[2px] flex items-center justify-center shrink-0 border ${
                              isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            <IconBook2 size={18} className={t.mutedColor} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-sans font-medium text-sm truncate max-w-sm sm:max-w-md md:max-w-lg transition-colors ${t.titleColor} ${isDark ? 'group-hover:text-white' : 'group-hover:text-[#066fd1]'}`}>
                              {b.title}
                            </span>
                            {b.status !== 'ACTIVE' && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wide ${t.statusMuted}`}
                              >
                                {b.status}
                              </span>
                            )}
                          </div>
                          {b.authors && b.authors.length > 0 && (
                            <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-[#8c94a5]' : 'text-gray-500'}`}>
                              {b.authors.map((a) => a.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. ISBN */}
                    <td className={`py-3 px-4 font-mono text-xs ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>{b.isbn}</td>

                    {/* 3. Format */}
                    <td className={`py-3 px-4 text-sm font-normal ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      {b.format}
                    </td>

                    {/* 4. Copies */}
                    <td
                      className="py-3 px-4 text-sm font-mono"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/admin/books/${b.id}/copies`)
                      }}
                      title="View & manage physical copies"
                    >
                      <span className={`hover:underline cursor-pointer ${isDark ? 'text-[#8c94a5] hover:text-white' : 'text-gray-600 hover:text-[#066fd1]'}`}>
                        <strong className={t.titleColor}>{b.availableCopies}</strong> / {b.totalCopies}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {books.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No books matching your criteria.
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

