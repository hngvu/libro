import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconExternalLink,
  IconBook2,
  IconCategory,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import { Switch } from '@/components/ui/switch'
import { api } from '@/services/api'
import type { GenreResponse, BookResponse } from '@/types/api'

export function AdminGenreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const genreId = Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [genre, setGenre] = useState<GenreResponse | null>(null)
  const [books, setBooks] = useState<BookResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    handle: '',
    description: '',
    status: 'ACTIVE',
  })

  const isDirty = useMemo(() => {
    if (!genre) return false
    return (
      editForm.name !== (genre.name || '') ||
      editForm.handle !== (genre.handle || '') ||
      editForm.description !== (genre.description || '') ||
      editForm.status !== (genre.status || 'ACTIVE')
    )
  }, [genre, editForm])

  const loadData = useCallback(async () => {
    if (!genreId) return
    setLoading(true)
    try {
      const [genreData, booksData] = await Promise.all([
        api.adminGetGenre(genreId),
        api.adminGetBooks({ genreId, size: 100 }),
      ])
      setGenre(genreData)
      setBooks(booksData.content || [])
      setEditForm({
        name: genreData.name,
        handle: genreData.handle || '',
        description: genreData.description || '',
        status: genreData.status || 'ACTIVE',
      })
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load genre details')
    } finally {
      setLoading(false)
    }
  }, [genreId, showFeedback])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveGenre = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!genre) return
    setSaving(true)
    try {
      await api.adminUpdateGenre(genre.id, {
        name: editForm.name.trim(),
        handle: editForm.handle.trim(),
        description: editForm.description.trim() || undefined,
        status: editForm.status,
      })
      showFeedback('success', 'Genre details saved successfully!')
      loadData()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update genre')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGenre = async () => {
    if (!genre) return
    if (
      !confirm(
        `Are you sure you want to delete genre "${genre.name}"? This action cannot be undone.`
      )
    )
      return
    try {
      await api.adminDeleteGenre(genre.id)
      showFeedback('success', 'Genre deleted successfully!')
      navigate('/admin/genres')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete genre')
    }
  }


  if (loading) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading category details...
      </div>
    )
  }

  if (!genre) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className={`text-sm ${t.subTextColor}`}>Category not found or has been removed.</p>
        <button
          onClick={() => navigate('/admin/genres')}
          className={`px-4 py-2 text-xs font-medium rounded-md border ${t.secondaryBtn}`}
        >
          Back to Genres
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Sub-Navigation Tabs & Top Action Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 ${
          isDark ? 'border-[#22262e]' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/genres/${genre.id}`}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              isDark
                ? 'bg-[#252a34] text-white border-[#333a48]'
                : 'bg-gray-100 text-gray-900 border-gray-300'
            }`}
          >
            Genre Details
          </Link>
          <a
            href="#books-section"
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isDark
                ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            Books ({books.length})
          </a>
        </div>

        {/* Top Action Bar (Save Changes, Public View, Delete) */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => handleSaveGenre()}
              disabled={saving}
              className={`h-8 px-3.5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          {genre.handle && (
            <a
              href={`/genre/${genre.handle}`}
              target="_blank"
              rel="noreferrer"
              className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${t.secondaryBtn}`}
              title="Open public genre page"
            >
              <IconExternalLink size={14} />
              <span>View</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleDeleteGenre}
            className="h-8 px-3.5 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            title="Delete this genre"
          >
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Genre Overview (Direct Frameless Form matching Book Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0 items-start">
        {/* Left Column (8/12): Genre Info & Editable Fields (utilizing 90% width) */}
        <div className="lg:col-span-8 space-y-4 w-full lg:max-w-[90%] min-w-0">
          {/* Row 1: Genre Name */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Genre / Category Name
            </label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="e.g. Computer Science, Science Fiction, Business"
              className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 2: Description with Rich Text Editor */}
          <div className="pt-1 w-full">
            <AdminRichTextEditor
              label="Description / Scope"
              value={editForm.description}
              onChange={(val) => setEditForm({ ...editForm, description: val })}
              placeholder="Write an overview, classification criteria, or scope for books under this genre (Markdown supported)..."
              minHeight="220px"
            />
          </div>

          {/* Row 3: Books in this Genre Section (List with Cover + Title) */}
          <div id="books-section" className="space-y-3 pt-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-xs sm:text-[13px] ${t.titleColor}`}>
                  Books
                </h3>
              </div>

            </div>

            {books.length === 0 ? (
              <div className={`py-6 text-center text-xs ${t.subTextColor}`}>
                No books currently linked to this genre.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#20242c]">
                {books.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/admin/books/${b.id}`)}
                    className={`group flex items-center justify-between py-2.5 px-3 rounded-md transition-colors cursor-pointer ${t.tableRow}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {b.cover ? (
                        <img
                          src={b.cover}
                          alt={b.title}
                          className="w-9 h-12 object-cover rounded-[2px] border border-gray-300 dark:border-[#2c323e] shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          className={`w-9 h-12 rounded-[2px] flex items-center justify-center shrink-0 border ${
                            isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          <IconBook2 size={16} className={t.mutedColor} />
                        </div>
                      )}
                      <span
                        className={`font-medium text-sm transition-colors truncate block ${t.titleColor} ${
                          isDark ? 'group-hover:text-white' : 'group-hover:text-[#066fd1]'
                        }`}
                      >
                        {b.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4/12): Status + Genre Visual Card */}
        <div className="lg:col-span-4 space-y-4 w-full lg:max-w-[260px]">
          {/* Status (Linear/Stripe Minimal Dot Style) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Status
            </label>
            <div
              onClick={() =>
                setEditForm({
                  ...editForm,
                  status: editForm.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                })
              }
              className="flex items-center justify-between h-9 px-3 rounded-md border border-gray-200 dark:border-[#2c323e] bg-white dark:bg-[#16181d] cursor-pointer hover:border-gray-300 dark:hover:border-[#3e4757] transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    editForm.status === 'ACTIVE'
                      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                      : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                />
                <span className="text-xs font-medium text-gray-900 dark:text-[#e2e8f0]">
                  {editForm.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <Switch
                checked={editForm.status === 'ACTIVE'}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, status: checked ? 'ACTIVE' : 'INACTIVE' })
                }
              />
            </div>
          </div>

          <div
            className={`w-full aspect-[4/3] rounded-md border flex flex-col items-center justify-center gap-2.5 p-4 select-none ${
              isDark ? 'border-[#3e4756] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-md flex items-center justify-center border ${
                isDark
                  ? 'bg-[#252a34] text-blue-400 border-[#3e4756]'
                  : 'bg-white text-blue-600 border-gray-300'
              }`}
            >
              <IconCategory size={26} />
            </div>
            <span className={`text-xs font-semibold text-center ${t.titleColor}`}>
              {editForm.name || 'Category'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
