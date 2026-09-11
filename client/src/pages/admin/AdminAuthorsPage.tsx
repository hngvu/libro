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
import type { AuthorResponse } from '@/types/api'
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

export function AdminAuthorsPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [authors, setAuthors] = useState<AuthorResponse[]>([])
  const [keyword, setKeyword] = useState('')
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<AuthorResponse | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    biography: '',
  })

  const fetchAuthors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetAuthors({
        keyword: keyword || undefined,
        page: 1,
        size: 100,
      })
      setAuthors(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load authors')
    } finally {
      setLoading(false)
    }
  }, [keyword, showFeedback])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  const toggleSelectAuthor = (id: number) => {
    setSelectedAuthorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedAuthorIds.length === authors.length) {
      setSelectedAuthorIds([])
    } else {
      setSelectedAuthorIds(authors.map((a) => a.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedAuthorIds.length} selected author(s)?`)) return
    try {
      for (const id of selectedAuthorIds) {
        await api.adminDeleteAuthor(id)
      }
      showFeedback('success', `${selectedAuthorIds.length} author(s) deleted successfully!`)
      setSelectedAuthorIds([])
      fetchAuthors()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected authors')
    }
  }

  const handleDeleteCurrent = async () => {
    if (!editingAuthor) return
    if (!confirm(`Are you sure you want to delete author "${editingAuthor.name}"?`)) return
    try {
      await api.adminDeleteAuthor(editingAuthor.id)
      showFeedback('success', `Author "${editingAuthor.name}" deleted successfully!`)
      setModalOpen(false)
      fetchAuthors()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete author')
    }
  }

  const handleOpenCreate = () => {
    setEditingAuthor(null)
    setFormData({
      name: '',
      handle: '',
      biography: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (author: AuthorResponse) => {
    setEditingAuthor(author)
    setFormData({
      name: author.name,
      handle: author.handle,
      biography: author.biography || '',
    })
    setModalOpen(true)
  }

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      handle: editingAuthor ? prev.handle : slugify(val),
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showFeedback('error', 'Author name is required')
      return
    }
    const finalHandle = formData.handle.trim() || slugify(formData.name)

    try {
      if (editingAuthor) {
        await api.adminUpdateAuthor(editingAuthor.id, {
          name: formData.name.trim(),
          handle: finalHandle,
          biography: formData.biography.trim() || undefined,
        })
        showFeedback('success', 'Author profile updated successfully!')
      } else {
        await api.adminCreateAuthor({
          name: formData.name.trim(),
          handle: finalHandle,
          biography: formData.biography.trim() || undefined,
        })
        showFeedback('success', 'New author added successfully!')
      }
      setModalOpen(false)
      fetchAuthors()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save author')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-[60%]">
          <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search author name..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAuthors()}
            className={`h-9 pl-9 pr-3 text-xs w-full rounded-md border outline-none transition ${t.inputBg}`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={handleOpenCreate}
            className={`h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Author
          </button>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between pt-0.5 text-[11px] font-mono">
        <span className={t.mutedColor}>Total {authors.length} authors</span>
      </div>

      {/* Authors Table - Frameless style matching BookCatalogPage */}
      {loading ? (
        <div className={`p-10 text-center text-xs ${t.subTextColor}`}>
          Loading authors...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      authors.length > 0 && selectedAuthorIds.length === authors.length
                        ? true
                        : selectedAuthorIds.length > 0
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

                {/* Author Name / Selected Actions */}
                <th className="px-4 text-left align-middle">
                  {selectedAuthorIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedAuthorIds.length} selected
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
                            Delete Selected ({selectedAuthorIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedAuthorIds([])}>
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Author Name
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
              {authors.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`py-12 text-center text-xs ${t.subTextColor}`}>
                    No authors found. Click "Add Author" to create one.
                  </td>
                </tr>
              ) : (
                authors.map((a) => {
                  const isSelected = selectedAuthorIds.includes(a.id)
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/admin/authors/${a.id}`)}
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
                          onCheckedChange={() => toggleSelectAuthor(a.id)}
                          className={
                            isDark
                              ? '!border-[#3e4756] hover:!border-[#5a667b]'
                              : '!border-gray-400 hover:!border-gray-500'
                          }
                        />
                      </td>

                      {/* Clean Author Name (No avatar, no ID) */}
                      <td className="py-3.5 px-4">
                        <span className={`font-medium text-xs ${t.titleColor}`}>
                          {a.name}
                        </span>
                      </td>

                      {/* Books Count & Quick Edit */}
                      <td className="w-44 py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${isDark ? 'bg-[#20252e] text-[#8c94a5]' : 'bg-gray-100 text-gray-600'}`}>
                            {a.bookCount ?? 0} {a.bookCount === 1 ? 'book' : 'books'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(a)
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

      {/* Add / Edit Author Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={isDark ? 'bg-[#1c2027] border-[#2c323e]' : 'bg-white border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={`text-base ${t.titleColor}`}>
              {editingAuthor ? 'Edit Author Profile' : 'Add New Author'}
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              {editingAuthor
                ? 'Update author details, biography, and catalog affiliation.'
                : 'Create a new author profile to link with books in your library.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${t.subTextColor}`}>
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Robert C. Martin"
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
                placeholder="e.g. robert-c-martin"
                className={`w-full h-9 px-3 rounded-md text-xs border font-mono outline-none ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${t.subTextColor}`}>
                Biography
              </label>
              <textarea
                rows={3}
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="Brief bio, awards, notable background..."
                className={`w-full p-2.5 rounded-md text-xs border outline-none resize-none ${t.inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {editingAuthor ? (
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="h-9 px-3 text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                >
                  Delete Author
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
                  {editingAuthor ? 'Save Changes' : 'Create Author'}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
