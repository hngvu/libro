import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconChevronDown,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { GenreResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function AdminGenresPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [keyword, setKeyword] = useState('')
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<GenreResponse | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
  })

  const fetchGenres = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetGenres({
        keyword: keyword || undefined,
        page: 1,
        size: 100,
      })
      setGenres(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load genres')
    } finally {
      setLoading(false)
    }
  }, [keyword, showFeedback])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  const toggleSelectGenre = (id: number) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedGenreIds.length === genres.length) {
      setSelectedGenreIds([])
    } else {
      setSelectedGenreIds(genres.map((g) => g.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedGenreIds.length} selected category(ies)?`)) return
    try {
      for (const id of selectedGenreIds) {
        await api.adminDeleteGenre(id)
      }
      showFeedback('success', `${selectedGenreIds.length} category(ies) deleted successfully!`)
      setSelectedGenreIds([])
      fetchGenres()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected categories')
    }
  }

  const handleDeleteCurrent = async () => {
    if (!editingGenre) return
    if (!confirm(`Are you sure you want to delete category "${editingGenre.name}"?`)) return
    try {
      await api.adminDeleteGenre(editingGenre.id)
      showFeedback('success', `Category "${editingGenre.name}" deleted successfully!`)
      setModalOpen(false)
      fetchGenres()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete category')
    }
  }

  const handleOpenCreate = () => {
    setEditingGenre(null)
    setFormData({
      name: '',
      handle: '',
      description: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (genre: GenreResponse) => {
    setEditingGenre(genre)
    setFormData({
      name: genre.name,
      handle: genre.handle,
      description: genre.description || '',
    })
    setModalOpen(true)
  }

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      handle: editingGenre ? prev.handle : slugify(val),
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showFeedback('error', 'Category name is required')
      return
    }
    const finalHandle = formData.handle.trim() || slugify(formData.name)

    try {
      if (editingGenre) {
        await api.adminUpdateGenre(editingGenre.id, {
          name: formData.name.trim(),
          handle: finalHandle,
          description: formData.description.trim() || undefined,
        })
        showFeedback('success', 'Category updated successfully!')
      } else {
        await api.adminCreateGenre({
          name: formData.name.trim(),
          handle: finalHandle,
          description: formData.description.trim() || undefined,
        })
        showFeedback('success', 'New category added successfully!')
      }
      setModalOpen(false)
      fetchGenres()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save category')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-[60%]">
          <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search genre name..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGenres()}
            className={`h-9 pl-9 pr-3 text-xs w-full rounded-md border outline-none transition ${t.inputBg}`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleOpenCreate}
            className={`h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between pt-0.5 text-[11px] font-mono">
        <span className={t.mutedColor}>Total {genres.length} categories</span>
      </div>

      {/* Genres Table - Frameless style matching BookCatalogPage */}
      {loading ? (
        <div className={`p-10 text-center text-xs ${t.subTextColor}`}>
          Loading categories...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      genres.length > 0 && selectedGenreIds.length === genres.length
                        ? true
                        : selectedGenreIds.length > 0
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

                {/* Category Name / Selected Actions */}
                <th className="px-4 text-left align-middle">
                  {selectedGenreIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedGenreIds.length} selected
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
                            onClick={handleBulkDelete}
                            className="text-rose-500 focus:text-rose-400"
                          >
                            Delete Selected ({selectedGenreIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedGenreIds([])}>
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Category Name
                    </span>
                  )}
                </th>

                {/* Books Column */}
                <th className={`w-44 px-4 text-right text-[11px] font-semibold uppercase tracking-wider align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Books
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {genres.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`py-12 text-center text-xs ${t.subTextColor}`}>
                    No categories found. Click "Add Category" to create one.
                  </td>
                </tr>
              ) : (
                genres.map((g) => {
                  const isSelected = selectedGenreIds.includes(g.id)
                  return (
                    <tr
                      key={g.id}
                      onClick={() => navigate(`/admin/genres/${g.id}`)}
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
                      {/* Selection Checkbox */}
                      <td
                        className="w-10 px-3 text-center align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectGenre(g.id)}
                          className={
                            isDark
                              ? '!border-[#3e4756] hover:!border-[#5a667b]'
                              : '!border-gray-400 hover:!border-gray-500'
                          }
                        />
                      </td>

                      {/* Clean Category Name (No tag icon, no ID) */}
                      <td className="py-3.5 px-4">
                        <span className={`font-medium text-xs ${t.titleColor}`}>
                          {g.name}
                        </span>
                      </td>

                      {/* Books Count & Quick Edit */}
                      <td className="w-44 py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${isDark ? 'bg-[#20252e] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'}`}>
                            {g.bookCount ?? 0} {g.bookCount === 1 ? 'book' : 'books'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(g)
                            }}
                            className={`text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline cursor-pointer ${
                              isDark ? 'text-blue-400' : 'text-blue-600'
                            }`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Genre Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={isDark ? 'bg-[#1c2027] border-[#2c323e]' : 'bg-white border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={`text-base ${t.titleColor}`}>
              {editingGenre ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              {editingGenre
                ? 'Update classification name, slug, and descriptions.'
                : 'Create a new book genre/category to categorize books in your collection.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${t.subTextColor}`}>
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Science Fiction"
                className={`w-full h-9 px-3 rounded-md text-xs border outline-none ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${t.subTextColor}`}>
                Handle / Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                placeholder="e.g. science-fiction"
                className={`w-full h-9 px-3 rounded-md text-xs border font-mono outline-none ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${t.subTextColor}`}>
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category scope and details..."
                className={`w-full p-2.5 rounded-md text-xs border outline-none resize-none ${t.inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {editingGenre ? (
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="h-9 px-3 text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                >
                  Delete Category
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`h-9 px-4 text-xs font-medium rounded-md transition-colors cursor-pointer ${t.secondaryBtn}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
                >
                  {editingGenre ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
