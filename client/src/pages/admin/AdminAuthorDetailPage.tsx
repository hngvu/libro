import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconExternalLink,
  IconBook2,
  IconEye,
  IconPhotoEdit,
  IconUser,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { api } from '@/services/api'
import type { AuthorResponse, BookResponse } from '@/types/api'

export function AdminAuthorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const authorId = isNew ? null : Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction } = useAdmin()

  const [author, setAuthor] = useState<AuthorResponse | null>(null)
  const [books, setBooks] = useState<BookResponse[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  // Modals state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [urlModalOpen, setUrlModalOpen] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    handle: '',
    biography: '',
    image: '',
    status: 'ACTIVE',
  })

  const isDirty = useMemo(() => {
    if (isNew) {
      return Boolean(editForm.name.trim() || editForm.biography.trim() || editForm.image.trim())
    }
    if (!author) return false
    return (
      editForm.name !== (author.name || '') ||
      editForm.handle !== (author.handle || '') ||
      editForm.biography !== (author.biography || '') ||
      editForm.image !== (author.image || '') ||
      editForm.status !== (author.status || 'ACTIVE')
    )
  }, [isNew, author, editForm])

  const loadData = useCallback(async () => {
    if (isNew || !authorId) return
    setLoading(true)
    try {
      const [authorData, booksData] = await Promise.all([
        api.adminGetAuthor(authorId),
        api.adminGetBooks({ authorId, size: 100 }),
      ])
      setAuthor(authorData)
      setBooks(booksData.content || [])
      setEditForm({
        name: authorData.name,
        handle: authorData.handle || '',
        biography: authorData.biography || '',
        image: authorData.image || '',
        status: authorData.status || 'ACTIVE',
      })
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load author details')
    } finally {
      setLoading(false)
    }
  }, [isNew, authorId, showFeedback])

  useEffect(() => {
    if (isNew) {
      setLoading(false)
    } else {
      loadData()
    }
  }, [isNew, loadData])

  const handleSaveAuthor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editForm.name.trim()) {
      showFeedback('error', 'Author name is required')
      return
    }
    setSaving(true)
    try {
      const finalHandle = editForm.handle?.trim() || editForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
      if (isNew) {
        await api.adminCreateAuthor({
          name: editForm.name.trim(),
          handle: finalHandle,
          biography: editForm.biography.trim() || undefined,
          image: editForm.image.trim() || undefined,
        })
        showFeedback('success', 'Created successfully')
        navigate('/admin/authors')
      } else {
        if (!author) return
        await api.adminUpdateAuthor(author.id, {
          name: editForm.name.trim(),
          handle: finalHandle,
          biography: editForm.biography.trim() || undefined,
          image: editForm.image.trim() || undefined,
          status: editForm.status,
        })
        showFeedback('success', 'Saved successfully')
        loadData()
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save author')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAuthor = async () => {
    if (!author) return
    if (
      !confirm(
        `Are you sure you want to delete author "${author.name}"? This action cannot be undone.`
      )
    )
      return
    try {
      await api.adminDeleteAuthor(author.id)
      showFeedback('success', 'Deleted successfully')
      navigate('/admin/authors')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete author')
    }
  }

  // Discard changes
  const handleDiscard = useCallback(() => {
    if (isNew) {
      navigate('/admin/authors')
      return
    }
    if (!author) return
    setEditForm({
      name: author.name || '',
      handle: author.handle || '',
      biography: author.biography || '',
      image: author.image || '',
      status: author.status || 'ACTIVE',
    })
  }, [isNew, author, navigate])

  // Manage top header action: update on change, clear on unmount
  useEffect(() => {
    if (isDirty) {
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={saving}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.secondaryBtn}`}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => handleSaveAuthor()}
            disabled={saving}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            {saving ? (isNew ? 'Creating...' : 'Updating...') : (isNew ? 'Create Author' : 'Update')}
          </button>
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [isDirty, saving, isNew, t.primaryBtn, t.secondaryBtn, setHeaderAction, handleDiscard])

  // Clear header action on page unmount
  useEffect(() => {
    return () => setHeaderAction(null)
  }, [setHeaderAction])

  if (loading) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading author profile...
      </div>
    )
  }

  if (!isNew && !author) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className={`text-sm ${t.subTextColor}`}>Author not found or has been removed.</p>
        <button
          onClick={() => navigate('/admin/authors')}
          className={`px-4 py-2 text-xs font-medium rounded-md border ${t.secondaryBtn}`}
        >
          Back to Authors
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">

      {/* Main Author Overview (Direct Frameless Form matching Book Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0 items-start">
        {/* Left Column (8/12): Author Info & Editable Fields (utilizing 90% width) */}
        <div className="lg:col-span-8 space-y-4 w-full lg:max-w-[90%] min-w-0">
          {/* Row 1: Author Name */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Author Name
            </label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder={isNew ? '' : "e.g. Robert C. Martin, J.K. Rowling"}
              className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 2: Biography with Rich Text Editor */}
          <div className="pt-1 w-full">
            <AdminRichTextEditor
              label="Biography / Profile"
              value={editForm.biography}
              onChange={(val) => setEditForm({ ...editForm, biography: val })}
              placeholder={isNew ? '' : "Write author biography, literary background, awards, and overview (Markdown supported)..."}
              minHeight="220px"
            />
          </div>

          {/* Row 3: Books by this Author Section (List with Cover + Title) */}
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
                No books currently linked to this author.
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

        {/* Right Column (4/12): Status + Author Avatar */}
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

          {/* Avatar with Hover Actions */}
          <div
            className={`group relative w-full aspect-square rounded-md overflow-hidden shrink-0 border flex items-center justify-center ${
              isDark ? 'border-[#3e4756] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
            }`}
          >
            {editForm.image ? (
              <img
                src={editForm.image}
                alt={editForm.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full select-none">
                <div
                  className={`w-16 h-16 rounded-md flex items-center justify-center font-bold text-2xl border ${
                    isDark
                      ? 'bg-[#252a34] text-gray-300 border-[#3e4756]'
                      : 'bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  {editForm.name ? editForm.name.charAt(0).toUpperCase() : <IconUser size={28} />}
                </div>
              </div>
            )}

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
              {editForm.image && (
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Preview Avatar Image"
                >
                  <IconEye size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setUrlModalOpen(true)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Edit Image URL"
              >
                <IconPhotoEdit size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div
        className={`pt-5 mt-6 border-t flex items-center justify-between gap-4 ${
          isDark ? 'border-[#22262e]' : 'border-gray-200'
        }`}
      >
        {/* Left: Delete & View, or Cancel for new */}
        <div className="flex items-center gap-2">
          {isNew ? (
            <button
              type="button"
              onClick={() => navigate('/admin/authors')}
              className={`h-9 px-4 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer border ${t.secondaryBtn}`}
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDeleteAuthor}
                disabled={saving}
                className="h-9 px-4 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                title="Delete this author"
              >
                Delete
              </button>
              {author?.handle && (
                <a
                  href={`/author/${author.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`h-9 px-3 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${t.secondaryBtn}`}
                  title="Open public author page"
                >
                  <IconExternalLink size={14} />
                  <span>View</span>
                </a>
              )}
            </>
          )}
        </div>

        {/* Right: Update or Create Author */}
        <button
          type="button"
          onClick={() => handleSaveAuthor()}
          disabled={!isDirty || saving}
          className={`h-9 px-5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${t.primaryBtn}`}
        >
          {saving ? (isNew ? 'Creating...' : 'Updating...') : (isNew ? 'Create Author' : 'Update')}
        </button>
      </div>

      {/* Modal: Preview Avatar Image */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent onClose={() => setPreviewModalOpen(false)} className={`sm:max-w-md rounded-xl p-4 border flex flex-col items-center ${t.modalBg}`}>
          <DialogHeader className="w-full text-center pb-2">
            <DialogTitle className={`text-sm font-bold ${t.titleColor}`}>Profile Image Preview</DialogTitle>
          </DialogHeader>
          {editForm.image && (
            <img
              src={editForm.image}
              alt={editForm.name}
              className="max-h-[70vh] w-auto object-contain rounded-md shadow-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Profile Image URL */}
      <Dialog open={urlModalOpen} onOpenChange={setUrlModalOpen}>
        <DialogContent onClose={() => setUrlModalOpen(false)} className={`sm:max-w-md rounded-xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Edit Profile Image URL
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Enter the direct image URL for this author.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Image URL</label>
              <input
                value={editForm.image}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                placeholder="https://..."
                className={`w-full h-9 px-3 text-xs font-mono rounded-md border outline-none ${t.inputBg}`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUrlModalOpen(false)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${t.secondaryBtn}`}
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
