import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconBook2,
  IconFilter2,
  IconX,
  IconChevronDown,
} from '@tabler/icons-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from '@/components/admin/AdminContext'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { BookResponse, BookFormat, BookStatus, GenrePublicResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function BookCatalogPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const [books, setBooks] = useState<BookResponse[]>([])
  const [keyword, setKeyword] = useState('')
  const [formatFilter, setFormatFilter] = useState<BookFormat | ''>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([])
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<BookResponse | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    handle: '',
    slug: '',
    isbn: '',
    publicationYear: 2024,
    cover: '',
    edition: '1st Edition',
    format: 'PAPERBACK' as BookFormat,
    pageCount: '' as number | string,
    language: 'English',
    description: '',
    status: 'ACTIVE' as BookStatus,
  })

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
        genre: genreFilter || undefined,
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

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'format') setFormatFilter('')
    if (field === 'status') setStatusFilter('')
    if (field === 'genre') setGenreFilter('')
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setFormatFilter('')
    setStatusFilter('')
    setGenreFilter('')
  }

  const toggleSelectBook = (id: number) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedBookIds.length === books.length) {
      setSelectedBookIds([])
    } else {
      setSelectedBookIds(books.map((b) => b.id))
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

  const handleOpenCreate = () => {
    setEditingBook(null)
    setFormData({
      title: '',
      handle: `BK${String(Math.floor(100000 + Math.random() * 900000))}`,
      slug: '',
      isbn: `978${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      publicationYear: 2024,
      cover: '',
      edition: '1st Edition',
      format: 'PAPERBACK',
      pageCount: '',
      language: 'English',
      description: '',
      status: 'ACTIVE',
    })
    setBookModalOpen(true)
  }

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await api.adminUpdateBook(editingBook.id, {
          title: formData.title,
          slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isbn: formData.isbn,
          publicationYear: Number(formData.publicationYear),
          cover: formData.cover || undefined,
          edition: formData.edition,
          format: formData.format,
          pageCount: formData.pageCount ? Number(formData.pageCount) : undefined,
          language: formData.language || undefined,
          description: formData.description,
          status: formData.status,
        })
        showFeedback('success', 'Book details updated successfully!')
      } else {
        await api.adminCreateBook({
          title: formData.title,
          handle: formData.handle,
          slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isbn: formData.isbn,
          publicationYear: Number(formData.publicationYear),
          cover: formData.cover || undefined,
          edition: formData.edition,
          format: formData.format,
          pageCount: formData.pageCount ? Number(formData.pageCount) : undefined,
          language: formData.language || undefined,
          description: formData.description,
        })
        showFeedback('success', 'New book title added to catalog!')
        refreshCounts()
      }
      setBookModalOpen(false)
      fetchBooks()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save book')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-[60%]">
          <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search title, handle, or ISBN..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
            className={`h-9 pl-9 pr-3 text-xs w-full rounded-md border outline-none transition ${t.inputBg}`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleOpenCreate}
            className={`h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Book
          </button>
        </div>
      </div>

      {/* Filter Section Under Searchbar */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold select-none ${
            isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]' : 'bg-gray-100 border-gray-300 text-gray-800'
          }`}
        >
          <IconFilter2 size={14} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
          <span>Filter</span>
        </div>

        {/* Format Filter (if active) */}
        {activeFilterFields.includes('format') && (
          <div className="flex items-center gap-0.5">
            <Select
              value={formatFilter || 'ALL'}
              onValueChange={(val) => setFormatFilter(val === 'ALL' ? '' : (val as BookFormat))}
            >
              <SelectTrigger className="w-auto min-w-[125px]">
                <span className="opacity-70 mr-1">Format:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Formats</SelectItem>
                <SelectItem value="PAPERBACK">Paperback</SelectItem>
                <SelectItem value="HARDCOVER">Hardcover</SelectItem>
                <SelectItem value="EBOOK">E-Book</SelectItem>
                <SelectItem value="AUDIOBOOK">Audiobook</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => removeFilterField('format')}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#252a34]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Remove Format filter"
            >
              <IconX size={12} />
            </button>
          </div>
        )}

        {/* Status Filter (if active) */}
        {activeFilterFields.includes('status') && (
          <div className="flex items-center gap-0.5">
            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(val) => setStatusFilter(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger className="w-auto min-w-[115px]">
                <span className="opacity-70 mr-1">Status:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => removeFilterField('status')}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#252a34]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Remove Status filter"
            >
              <IconX size={12} />
            </button>
          </div>
        )}

        {/* Genre Filter (if active) */}
        {activeFilterFields.includes('genre') && (
          <div className="flex items-center gap-0.5">
            <Select
              value={genreFilter || 'ALL'}
              onValueChange={(val) => setGenreFilter(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger className="w-auto min-w-[120px]">
                <span className="opacity-70 mr-1">Genre:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Genres</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.handle} value={g.handle}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => removeFilterField('genre')}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#252a34]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Remove Genre filter"
            >
              <IconX size={12} />
            </button>
          </div>
        )}

        {/* Add Filter Plus Button (DropdownMenu) */}
        {activeFilterFields.length < 3 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#8c94a5] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Add filter"
              >
                <IconPlus size={14} />
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
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Catalog Table - Frameless (bỏ viền bọc) */}
      {loading ? (
        <div className={`p-10 text-center text-xs ${t.subTextColor}`}>
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
                      books.length > 0 && selectedBookIds.length === books.length
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
                      <span className={`text-xs font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedBookIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`h-6 px-2 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer select-none normal-case whitespace-nowrap ${
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
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Book
                    </span>
                  )}
                </th>

                {/* Column 3: ISBN */}
                <th className={`w-36 px-4 text-[11px] font-semibold uppercase tracking-wider align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  ISBN
                </th>

                {/* Column 4: Format */}
                <th className={`w-28 px-4 text-[11px] font-semibold uppercase tracking-wider align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Format
                </th>

                {/* Column 5: Copies */}
                <th className={`w-28 px-4 text-[11px] font-semibold uppercase tracking-wider align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Copies
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {books.map((b) => {
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
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        {b.cover ? (
                          <div
                            className={`w-8 h-11 rounded-[2px] overflow-hidden shrink-0 shadow-xs border flex items-start justify-center ${
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
                            className={`w-8 h-11 rounded-[2px] flex items-center justify-center shrink-0 border ${
                              isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            <IconBook2 size={16} className={t.mutedColor} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-sans font-medium text-xs truncate max-w-sm sm:max-w-md transition-colors ${t.titleColor} ${isDark ? 'group-hover:text-white' : 'group-hover:text-[#066fd1]'}`}>
                              {b.title}
                            </span>
                            {b.status !== 'ACTIVE' && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wide ${t.statusMuted}`}
                              >
                                {b.status}
                              </span>
                            )}
                          </div>
                          {b.authors && b.authors.length > 0 && (
                            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-[#8c94a5]' : 'text-gray-500'}`}>
                              {b.authors.map((a) => a.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. ISBN */}
                    <td className={`py-2.5 px-4 font-mono text-xs ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>{b.isbn}</td>

                    {/* 3. Format */}
                    <td className={`py-2.5 px-4 text-xs font-normal ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      {b.format}
                    </td>

                    {/* 4. Copies */}
                    <td
                      className="py-2.5 px-4 text-xs"
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
                  <td colSpan={5} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                    No books matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add / Edit Book */}
      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent onClose={() => setBookModalOpen(false)} className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              {editingBook ? 'Edit Book Details' : 'Add New Title to Catalog'}
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Enter publication metadata adhering to library cataloging standards
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBook} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Title *</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Handle (Public Identifier) *</label>
                <input
                  required
                  disabled={!!editingBook}
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition disabled:opacity-50 ${t.inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>ISBN *</label>
                <input
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Year</label>
                <input
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData({ ...formData, publicationYear: Number(e.target.value) })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Format</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as BookFormat })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                >
                  <option value="PAPERBACK">PAPERBACK</option>
                  <option value="HARDCOVER">HARDCOVER</option>
                  <option value="EBOOK">EBOOK</option>
                  <option value="AUDIOBOOK">AUDIOBOOK</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Page Count</label>
                <input
                  type="number"
                  placeholder="e.g. 320"
                  value={formData.pageCount}
                  onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Language</label>
                <input
                  placeholder="e.g. English, Vietnamese"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Cover Image URL</label>
              <input
                placeholder="https://..."
                value={formData.cover}
                onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Book Synopsis</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full mt-1 p-2.5 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            {editingBook && (
              <div>
                <label className={`text-xs font-medium ${t.subTextColor}`}>Catalog Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
                  className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </div>
            )}

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setBookModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                {editingBook ? 'Save Changes' : 'Create Book'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
