import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import {
  IconSearch,
  IconFilter2,
  IconX,
  IconBook2,
  IconChevronDown,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function cleanCoverUrl(url: string) {
  if (!url) return url
  return url.replace(/\._[^.]*(\.[a-zA-Z0-9]+)$/, '$1')
}

export function BookItemCopiesPage() {
  const { id } = useParams<{ id: string }>()
  const bookId = Number(id)
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const [book, setBook] = useState<BookResponse | null>(null)
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [selectedCopyIds, setSelectedCopyIds] = useState<number[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookCopyStatus | ''>('')
  const [loading, setLoading] = useState(true)

  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [newBarcode, setNewBarcode] = useState('')
  const [newLocation, setNewLocation] = useState('')

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
      loadData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected copies')
    }
  }

  const handleOpenAddCopy = () => {
    setNewBarcode(`BC-${Math.floor(100000 + Math.random() * 900000)}`)
    setNewLocation('')
    setCopyModalOpen(true)
  }

  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book) return
    try {
      await api.adminCreateBookCopy({
        bookId: book.id,
        barcode: newBarcode.trim(),
        location: newLocation.trim() || undefined,
      })
      showFeedback('success', 'Physical copy added successfully!')
      setCopyModalOpen(false)
      loadData()
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
      loadData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update copy status')
    }
  }

  if (loading && !book) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading book copies...
      </div>
    )
  }

  if (!book) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className={`text-sm ${t.subTextColor}`}>Book not found or has been removed.</p>
        <Link
          to="/admin/books"
          className={`px-4 py-2 text-xs font-medium rounded-md border ${t.secondaryBtn}`}
        >
          Back to Catalog
        </Link>
      </div>
    )
  }

  const availableCount = copies.filter((c) => c.status === 'AVAILABLE').length
  const borrowedCount = copies.filter((c) => c.status === 'BORROWED').length
  const maintenanceCount = copies.filter((c) => c.status === 'MAINTENANCE' || c.status === 'LOST').length

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Sub-Navigation Tabs */}
      <div className={`flex items-center gap-1 border-b pb-2 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
        <Link
          to={`/admin/books/${book.id}`}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isDark
              ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]'
              : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
          }`}
        >
          Book Details
        </Link>
        <Link
          to={`/admin/books/${book.id}/copies`}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
            isDark
              ? 'bg-[#252a34] text-white border-[#333a48]'
              : 'bg-gray-100 text-gray-900 border-gray-300'
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
              <IconBook2 size={18} className={t.mutedColor} />
            </div>
          )}

          <div className="min-w-0">
            <h2 className={`font-sans font-semibold text-sm truncate ${t.titleColor}`}>
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
        <div className="relative w-full sm:w-[60%]">
          <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search barcode number..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
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

      {/* Filter Section */}
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

      {/* Copies Table */}
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
                  <td className="py-3 px-4">
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {c.location || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-mono ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      {c.lastLoanDate || '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {copies.length === 0 && (
              <tr>
                <td colSpan={4} className={`py-10 text-center text-xs ${t.subTextColor}`}>
                  No physical copies registered for this title yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Copy */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className={`sm:max-w-md rounded-xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Add Physical Copy
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Generates a unique barcode and shelf location for tracking physical inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCopy} className="space-y-4 pt-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Barcode Identifier *</label>
              <input
                required
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="e.g. BC-123456"
                className={`w-full h-9 px-3 text-xs font-mono rounded-md border outline-none ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Shelf / Physical Location</label>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Shelf A-1, Stack 3, Floor 2"
                className={`w-full h-9 px-3 text-xs rounded-md border outline-none ${t.inputBg}`}
              />
            </div>
            <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${t.primaryBtn}`}
              >
                Create Copy
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}