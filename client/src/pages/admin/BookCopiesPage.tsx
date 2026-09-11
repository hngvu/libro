import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  IconSearch,
  IconFilter2,
  IconX,
  IconChevronDown,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function BookCopiesPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [books, setBooks] = useState<BookResponse[]>([])
  const [selectedCopyIds, setSelectedCopyIds] = useState<number[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookCopyStatus | ''>('')
  const [loading, setLoading] = useState(false)

  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    barcode: '',
    bookId: 0,
    location: '',
  })

  const getStatusBadge = (status: BookCopyStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return t.statusActive
      case 'BORROWED':
        return t.statusBorrowed
      case 'LOST':
        return t.statusOverdue
      case 'RESERVED':
        return isDark
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border border-blue-300'
      case 'MAINTENANCE':
      default:
        return t.statusMuted
    }
  }

  const fetchCopies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetBookCopies({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page: 1,
        size: 50,
      })
      setCopies(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load physical copies')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter])

  const fetchBooksForSelect = async () => {
    try {
      const res = await api.adminGetBooks({ page: 1, size: 100 })
      setBooks(res.content || [])
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchCopies()
  }, [fetchCopies])

  const toggleSelectCopy = (id: number) => {
    setSelectedCopyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCopyIds.length === copies.length) {
      setSelectedCopyIds([])
    } else {
      setSelectedCopyIds(copies.map((c) => c.id))
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
    fetchBooksForSelect()
    setFormData({
      barcode: `BC-${Math.floor(100000 + Math.random() * 900000)}`,
      bookId: books.length > 0 ? books[0].id : 1,
      location: '',
    })
    setCopyModalOpen(true)
  }

  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateBookCopy({
        barcode: formData.barcode,
        bookId: Number(formData.bookId),
        location: formData.location.trim() || undefined,
      })
      showFeedback('success', 'New physical copy registered successfully!')
      setCopyModalOpen(false)
      fetchCopies()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create physical copy')
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
        <div className="relative w-full sm:w-[60%]">
          <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search barcode number, title, or book ID..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCopies()}
            className={`h-9 pl-9 pr-3 text-xs w-full rounded-md border outline-none transition ${t.inputBg}`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleOpenAddCopy}
            className={`h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Copy
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

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <Select
            value={statusFilter || 'ALL'}
            onValueChange={(val) => setStatusFilter(val === 'ALL' ? '' : (val as BookCopyStatus))}
          >
            <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
              <span className="opacity-70 mr-1">Status:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
              <SelectItem value="BORROWED">BORROWED</SelectItem>
              <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
              <SelectItem value="LOST">LOST</SelectItem>
            </SelectContent>
          </Select>

          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#252a34]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Clear status filter"
            >
              <IconX size={12} />
            </button>
          )}
        </div>

        {/* Reset Button */}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Copies Table - Frameless */}
      {loading ? (
        <div className={`p-10 text-center text-xs ${t.subTextColor}`}>
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
                      copies.length > 0 && selectedCopyIds.length === copies.length
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
                      <span className={`text-xs font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedCopyIds.length} selected
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
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Barcode
                    </span>
                  )}
                </th>
                <th className={`py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Book Title
                </th>
                <th className={`py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Location
                </th>
                <th className={`py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Last Borrowed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {copies.map((c) => {
                const isSelected = selectedCopyIds.includes(c.id)
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

                    {/* Barcode & Status Badge */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-semibold ${t.titleColor}`}>
                          {c.barcode}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 uppercase tracking-wide ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </td>

                    {/* Book Title */}
                    <td className={`py-2.5 px-4 text-xs font-medium max-w-[280px] truncate ${t.titleColor}`}>
                      {c.bookTitle || (c.bookId ? `Book #${c.bookId}` : '—')}
                    </td>

                    {/* Location */}
                    <td className={`py-2.5 px-4 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {c.location || '—'}
                    </td>

                    {/* Last Borrowed */}
                    <td className={`py-2.5 px-4 text-xs font-mono ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      {c.lastLoanDate || '—'}
                    </td>
                  </tr>
                )
              })}
              {copies.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                    No physical copies registered matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Register Copy */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className={`sm:max-w-md rounded-xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Register Physical Copy
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Assign a unique barcode and location to a catalog title
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCopy} className="space-y-3.5 pt-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Barcode Number *</label>
              <input
                required
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className={`w-full h-9 px-3 rounded-md text-xs font-mono border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Shelf / Physical Location</label>
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Shelf A-1, Stack 3, Floor 2"
                className={`w-full h-9 px-3 rounded-md text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Catalog Title *</label>
              <select
                value={formData.bookId}
                onChange={(e) => setFormData({ ...formData, bookId: Number(e.target.value) })}
                className={`w-full h-9 px-3 rounded-md text-xs border outline-none transition cursor-pointer ${t.inputBg}`}
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.handle}] {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Register Copy
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
