import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconArrowLeft,
  IconExternalLink,
  IconTrash,
  IconBook2,
  IconCategory,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { GenreResponse, BookResponse } from '@/types/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const isDirty = React.useMemo(() => {
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
      showFeedback('success', 'Genre updated successfully!')
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
      <div className="py-20 text-center text-xs opacity-60">
        Loading category details...
      </div>
    )
  }

  if (!genre) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className={`text-sm ${t.subTextColor}`}>Category not found.</p>
        <Link
          to="/admin/genres"
          className="text-xs text-blue-500 hover:underline font-medium"
        >
          &larr; Back to Genres
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/genres"
            className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${t.secondaryBtn}`}
          >
            <IconArrowLeft size={14} />
            <span>Genres</span>
          </Link>
          <span className="text-sm opacity-40">/</span>
          <span className={`text-sm font-semibold ${t.titleColor}`}>
            {genre.name}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
              editForm.status === 'ACTIVE' ? t.statusActive : t.statusMuted
            }`}
          >
            {editForm.status}
          </span>
        </div>

        {/* Action Buttons */}
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
              title="View public genre page"
            >
              <IconExternalLink size={14} />
              <span>Public</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleDeleteGenre}
            className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
              isDark ? 'border-[#2c323e]' : 'border-gray-200'
            }`}
            title="Delete this genre"
          >
            <IconTrash size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Stats Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Genre Form */}
        <div
          className={`lg:col-span-2 rounded-xl border p-5 sm:p-6 space-y-4 shadow-xs ${t.cardBg}`}
        >
          <div className="flex items-center gap-2 border-b pb-3 mb-4">
            <IconCategory size={18} className={t.mutedColor} />
            <h2 className={`font-semibold text-sm ${t.titleColor}`}>
              Genre Information
            </h2>
          </div>

          <form onSubmit={handleSaveGenre} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                  Genre Name *
                </label>
                <input
                  required
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className={`w-full h-9 px-3 rounded-md text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                  Handle (Slug) *
                </label>
                <input
                  required
                  type="text"
                  value={editForm.handle}
                  onChange={(e) =>
                    setEditForm({ ...editForm, handle: e.target.value })
                  }
                  className={`w-full h-9 px-3 rounded-md text-xs font-mono border outline-none transition ${t.inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Status
              </label>
              <Select
                value={editForm.status}
                onValueChange={(val) => setEditForm({ ...editForm, status: val })}
              >
                <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Description
              </label>
              <textarea
                rows={5}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Write an overview or scope for books classified under this genre..."
                className={`w-full p-3 rounded-md text-xs border outline-none resize-y leading-relaxed transition ${t.inputBg}`}
              />
            </div>
          </form>
        </div>

        {/* Right Column: Statistics & Highlights */}
        <div className="space-y-4">
          <div className={`rounded-xl border p-5 shadow-xs ${t.cardBg}`}>
            <h3 className={`font-semibold text-xs uppercase tracking-wider mb-3 ${t.subTextColor}`}>
              Genre Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-lg border ${
                  isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`text-[11px] block font-medium ${t.subTextColor}`}>
                  Total Titles
                </span>
                <span className={`text-xl font-bold font-mono mt-1 block ${t.titleColor}`}>
                  {books.length}
                </span>
              </div>
              <div
                className={`p-3.5 rounded-lg border ${
                  isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`text-[11px] block font-medium ${t.subTextColor}`}>
                  Physical Copies
                </span>
                <span className={`text-xl font-bold font-mono mt-1 block ${t.titleColor}`}>
                  {books.reduce((sum, b) => sum + (b.totalCopies || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books under this Genre Section */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
        <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconBook2 size={16} className={t.mutedColor} />
            <h3 className={`font-semibold text-xs uppercase tracking-wider ${t.titleColor}`}>
              Books in {genre.name} ({books.length})
            </h3>
          </div>
          <Link
            to="/admin/books"
            className="text-xs text-blue-500 hover:underline font-medium"
          >
            Catalog &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-10 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider">
                  Book Title
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider">
                  ISBN
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider">
                  Format
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider">
                  Copies
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {books.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/admin/books/${b.id}`)}
                  className={`group border-b transition-colors cursor-pointer ${
                    isDark ? 'border-[#20242c]' : 'border-gray-200'
                  } ${t.tableRow}`}
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      {b.cover ? (
                        <img
                          src={b.cover}
                          alt={b.title}
                          className="w-7 h-10 object-cover rounded shadow-2xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          className={`w-7 h-10 rounded flex items-center justify-center shrink-0 border ${
                            isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          <IconBook2 size={14} className={t.mutedColor} />
                        </div>
                      )}
                      <div>
                        <span
                          className={`font-medium text-xs transition-colors ${t.titleColor} ${
                            isDark ? 'group-hover:text-white' : 'group-hover:text-[#066fd1]'
                          }`}
                        >
                          {b.title}
                        </span>
                        {b.publicationYear && (
                          <span className={`text-[11px] block ${t.subTextColor}`}>
                            {b.publicationYear}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`py-2.5 px-4 text-xs font-mono ${t.subTextColor}`}>
                    {b.isbn}
                  </td>
                  <td className={`py-2.5 px-4 text-xs ${t.subTextColor}`}>
                    {b.format}
                  </td>
                  <td className="py-2.5 px-4 text-xs">
                    <span className={`font-semibold ${t.titleColor}`}>
                      {b.availableCopies}
                    </span>
                    <span className={t.subTextColor}> / {b.totalCopies}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide ${
                        b.status === 'ACTIVE' ? t.statusActive : t.statusMuted
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={`py-8 text-center text-xs ${t.subTextColor}`}
                  >
                    No books currently linked to this genre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
