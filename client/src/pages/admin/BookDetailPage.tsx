import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import {
  IconTrash,
  IconExternalLink,
  IconBook2,
  IconEye,
  IconPhotoEdit,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminCombobox } from '@/components/admin/AdminCombobox'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type {
  BookResponse,
  BookFormat,
  BookStatus,
  AuthorResponse,
  PublisherResponse,
  GenreResponse,
} from '@/types/api'
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
import { Checkbox } from '@/components/ui/checkbox'

function cleanCoverUrl(url: string) {
  if (!url) return url
  // Strip Amazon CDN's artificial 1px white border parameters (e.g. ._SX376_BO1,204,203,200_.jpg)
  return url.replace(/\._[^.]*(\.[a-zA-Z0-9]+)$/, '$1')
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const [book, setBook] = useState<BookResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Taxonomy lists
  const [authorsList, setAuthorsList] = useState<AuthorResponse[]>([])
  const [publishersList, setPublishersList] = useState<PublisherResponse[]>([])
  const [genresList, setGenresList] = useState<GenreResponse[]>([])

  // Modals state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
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
    publisherId: null as number | null,
    authorIds: [] as number[],
    genreIds: [] as number[],
  })

  const isDirty = React.useMemo(() => {
    if (!book) return false
    const initialAuthorIds = (book.authors || []).map((a) => a.id).sort().join(',')
    const currentAuthorIds = [...editForm.authorIds].sort().join(',')

    const initialGenreIds = (book.genres || []).map((g) => g.id).sort().join(',')
    const currentGenreIds = [...editForm.genreIds].sort().join(',')

    const initialPublisherId = book.publisher?.id || null

    return (
      editForm.title !== (book.title || '') ||
      editForm.isbn !== (book.isbn || '') ||
      editForm.publicationYear !== (book.publicationYear || 2024) ||
      editForm.cover !== (book.cover || '') ||
      editForm.edition !== (book.edition || '') ||
      editForm.format !== (book.format || 'PAPERBACK') ||
      Number(editForm.pageCount || 0) !== (book.pageCount || 0) ||
      editForm.language !== (book.language || 'English') ||
      editForm.description !== (book.description || '') ||
      editForm.status !== (book.status || 'ACTIVE') ||
      editForm.publisherId !== initialPublisherId ||
      initialAuthorIds !== currentAuthorIds ||
      initialGenreIds !== currentGenreIds
    )
  }, [book, editForm])

  const bookId = Number(id)

  const loadData = useCallback(async () => {
    if (!bookId) return
    setLoading(true)
    try {
      const [bookData, authorsRes, pubRes, genRes] = await Promise.all([
        api.adminGetBook(bookId),
        api.adminGetAuthors({ size: 100 }),
        api.adminGetPublishers({ size: 100 }),
        api.adminGetGenres({ size: 100 }),
      ])
      setBook(bookData)
      setAuthorsList(authorsRes.content || [])
      setPublishersList(pubRes.content || [])
      setGenresList(genRes.content || [])

      setEditForm({
        title: bookData.title,
        slug: bookData.slug || '',
        isbn: bookData.isbn,
        publicationYear: bookData.publicationYear,
        cover: cleanCoverUrl(bookData.cover || ''),
        edition: bookData.edition || '',
        format: bookData.format || 'PAPERBACK',
        pageCount: bookData.pageCount || '',
        language: bookData.language || 'English',
        description: bookData.description || '',
        status: bookData.status || 'ACTIVE',
        publisherId: bookData.publisher?.id || null,
        authorIds: (bookData.authors || []).map((a) => a.id),
        genreIds: (bookData.genres || []).map((g) => g.id),
      })
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load book details')
    } finally {
      setLoading(false)
    }
  }, [bookId])

  // Quick creation handlers
  const handleCreateAuthor = async (name: string) => {
    try {
      const newAuthor = await api.adminCreateAuthor({ name })
      setAuthorsList((prev) => [...prev, newAuthor])
      showFeedback('success', `Created author "${name}"`)
      return { id: newAuthor.id, label: newAuthor.name }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create author')
      return null
    }
  }

  const handleCreatePublisher = async (name: string) => {
    try {
      const newPub = await api.adminCreatePublisher({ name })
      setPublishersList((prev) => [...prev, newPub])
      showFeedback('success', `Created publisher "${name}"`)
      return { id: newPub.id, label: newPub.name }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create publisher')
      return null
    }
  }

  const handleCreateGenre = async (name: string) => {
    try {
      const newGenre = await api.adminCreateGenre({ name })
      setGenresList((prev) => [...prev, newGenre])
      showFeedback('success', `Created genre "${name}"`)
      return { id: newGenre.id, label: newGenre.name }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create genre')
      return null
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save Book Edit
  const handleSaveBook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!book) return
    setSaving(true)
    try {
      await api.adminUpdateBook(book.id, {
        ...editForm,
        pageCount: editForm.pageCount ? Number(editForm.pageCount) : undefined,
        language: editForm.language || undefined,
      })
      showFeedback('success', 'Book details saved successfully!')
      loadData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update book details')
    } finally {
      setSaving(false)
    }
  }

  // Archive Book
  const handleArchiveBook = async () => {
    if (!book) return
    if (!confirm('Are you sure you want to archive this book? It will be hidden from public catalog.')) return
    try {
      await api.adminDeleteBook(book.id)
      showFeedback('success', 'Book archived successfully!')
      navigate('/admin/books')
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive book')
    }
  }

  if (loading) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading book details...
      </div>
    )
  }

  if (!book) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className={`text-sm ${t.subTextColor}`}>Book not found or has been removed.</p>
        <button
          onClick={() => navigate('/admin/books')}
          className={`px-4 py-2 text-xs font-medium rounded-xl border ${t.secondaryBtn}`}
        >
          Back to Catalog
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Sub-Navigation Tabs & Top Action Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/books/${book.id}`}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              isDark
                ? 'bg-[#252a34] text-white border-[#333a48]'
                : 'bg-gray-100 text-gray-900 border-gray-300'
            }`}
          >
            Book Details
          </Link>
          <Link
            to={`/admin/books/${book.id}/copies`}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isDark
                ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            Copies ({book.totalCopies ?? 0})
          </Link>
        </div>

        {/* Top Action Bar (Save Changes, Public View, Archive) */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => handleSaveBook()}
              disabled={saving}
              className={`h-8 px-3.5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          {book.handle && (
            <a
              href={`/book/${book.handle}/${book.slug || book.handle}`}
              target="_blank"
              rel="noreferrer"
              className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${t.secondaryBtn}`}
              title="Open public catalog page"
            >
              <IconExternalLink size={14} />
              <span>Public</span>
            </a>
          )}
          <button
            type="button"
            onClick={handleArchiveBook}
            className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
              isDark ? 'border-[#2c323e]' : 'border-gray-200'
            }`}
            title="Archive this title"
          >
            <IconTrash size={14} />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Top Book Overview (Direct Editable Form) */}
      <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8 xl:gap-10">
        {/* Left Column: Book Cover + Genres */}
        <div className="w-full sm:w-52 lg:w-60 xl:w-64 2xl:w-72 shrink-0 space-y-5 lg:space-y-6">
          {/* Book Cover with Hover Actions */}
          <div
            className={`group relative w-full mx-auto md:mx-0 rounded-md overflow-hidden shrink-0 border flex items-center justify-center ${
              editForm.cover ? 'h-fit' : 'aspect-[2/3]'
            } ${isDark ? 'border-[#3e4756] bg-[#16181d]' : 'border-gray-300 bg-gray-100'}`}
          >
            {editForm.cover ? (
              <img
                src={cleanCoverUrl(editForm.cover)}
                alt={editForm.title}
                className="w-full h-auto block object-cover transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <IconBook2 size={48} className={t.mutedColor} />
              </div>
            )}

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
              {editForm.cover && (
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Preview Full Cover Image"
                >
                  <IconEye size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setUrlModalOpen(true)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Edit Cover Image URL"
              >
                <IconPhotoEdit size={18} />
              </button>
            </div>
          </div>

          {/* Genres / Categories under Book Cover */}
          <div className="pt-1">
            <AdminCombobox
              label="Genres"
              placeholder="Search or add genres..."
              options={genresList.map((g) => ({ id: g.id, label: g.name }))}
              selectedIds={editForm.genreIds}
              multiple
              chipsPlacement="below"
              showChevron={false}
              onChange={(ids) => setEditForm({ ...editForm, genreIds: ids })}
              onCreateOption={handleCreateGenre}
              createPrefix="Add"
            />
          </div>
        </div>

        {/* Book Info & Editable Fields (Right of Cover) */}
        <div className="flex-1 min-w-0 space-y-4 xl:space-y-4.5 w-full">
          {/* Row 1: Book Title + Visibility */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3.5 xl:gap-4">
            <div className="space-y-1 w-full sm:w-[70%]">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Book Title
              </label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Book Title"
                className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className="space-y-1 shrink-0">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Visibility
              </label>
              <div
                onClick={() =>
                  setEditForm({
                    ...editForm,
                    status: editForm.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE',
                  })
                }
                className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-200 dark:border-[#2c323e] bg-white dark:bg-[#16181d] cursor-pointer hover:border-gray-300 dark:hover:border-[#3e4757] transition-colors select-none"
              >
                <Checkbox
                  id="visibility-checkbox"
                  checked={editForm.status === 'ACTIVE'}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, status: checked ? 'ACTIVE' : 'HIDDEN' })
                  }
                />
                <label
                  htmlFor="visibility-checkbox"
                  className="text-xs font-normal text-gray-900 dark:text-[#e2e8f0] cursor-pointer pointer-events-none"
                >
                  {editForm.status === 'ACTIVE' ? 'Active' : 'Hidden'}
                </label>
              </div>
            </div>
          </div>

          {/* Row 2: Authors (70% width, 1 row) */}
          <div className="w-full sm:w-[70%]">
            <AdminCombobox
              label="Authors"
              placeholder="Select or enter authors..."
              options={authorsList.map((a) => ({ id: a.id, label: a.name }))}
              selectedIds={editForm.authorIds}
              multiple
              displayMode="comma"
              onChange={(ids) => setEditForm({ ...editForm, authorIds: ids })}
              onCreateOption={handleCreateAuthor}
              createPrefix="Add"
            />
          </div>

          {/* Row 3: Publisher (70% width, 1 row) */}
          <div className="w-full sm:w-[70%]">
            <AdminCombobox
              label="Publisher"
              placeholder="Select publisher..."
              options={publishersList.map((p) => ({
                id: p.id,
                label: p.name,
                sublabel: p.website || undefined,
              }))}
              selectedIds={editForm.publisherId ? [editForm.publisherId] : []}
              multiple={false}
              onChange={(ids) => setEditForm({ ...editForm, publisherId: ids[0] || null })}
              onCreateOption={handleCreatePublisher}
              createPrefix="Add"
            />
          </div>

          {/* Row 4: ISBN (70% width, 1 row) */}
          <div className="space-y-1 w-full sm:w-[70%]">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              ISBN
            </label>
            <input
              value={editForm.isbn}
              onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
              placeholder="ISBN-13"
              className={`w-full h-9 px-3 text-xs xl:text-sm font-mono rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 5: Publication Year (70% width, 1 row) */}
          <div className="space-y-1 w-full sm:w-[70%]">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Publication Year
            </label>
            <input
              type="number"
              value={editForm.publicationYear}
              onChange={(e) => setEditForm({ ...editForm, publicationYear: Number(e.target.value) })}
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 6: Format (70% width, 1 row) */}
          <div className="space-y-1 w-full sm:w-[70%]">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Format
            </label>
            <Select
              value={editForm.format}
              onValueChange={(val) => setEditForm({ ...editForm, format: val as BookFormat })}
            >
              <SelectTrigger className="w-full h-9 text-xs xl:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAPERBACK">Paperback</SelectItem>
                <SelectItem value="HARDCOVER">Hardcover</SelectItem>
                <SelectItem value="EBOOK">E-Book</SelectItem>
                <SelectItem value="AUDIOBOOK">Audiobook</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 7: Edition (70% width, 1 row) */}
          <div className="space-y-1 w-full sm:w-[70%]">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Edition
            </label>
            <input
              value={editForm.edition}
              onChange={(e) => setEditForm({ ...editForm, edition: e.target.value })}
              placeholder="1st Edition"
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 7.5: Page Count & Language (70% width) */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-[70%]">
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Page Count
              </label>
              <input
                type="number"
                value={editForm.pageCount}
                onChange={(e) => setEditForm({ ...editForm, pageCount: e.target.value })}
                placeholder="e.g. 320"
                className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Language
              </label>
              <input
                value={editForm.language}
                onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                placeholder="e.g. English, Vietnamese"
                className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
              />
            </div>
          </div>

          {/* Row 8: Description with Rich Text Editor (70% width) */}
          <div className="pt-1 w-full sm:w-[70%]">
            <AdminRichTextEditor
              label="Description"
              value={editForm.description}
              onChange={(val) => setEditForm({ ...editForm, description: val })}
              placeholder="Enter synopsis or bibliographic description (supports Markdown)..."
              minHeight="260px"
            />
          </div>
        </div>
      </div>

      {/* Modal: Preview Full Cover Image */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent onClose={() => setPreviewModalOpen(false)} className={`sm:max-w-md rounded-xl p-4 border flex flex-col items-center ${t.modalBg}`}>
          <DialogHeader className="w-full text-center pb-2">
            <DialogTitle className={`text-sm font-bold ${t.titleColor}`}>Cover Preview</DialogTitle>
          </DialogHeader>
          {editForm.cover && (
            <img
              src={editForm.cover}
              alt={editForm.title}
              className="max-h-[70vh] w-auto object-contain rounded-md shadow-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Cover Image URL */}
      <Dialog open={urlModalOpen} onOpenChange={setUrlModalOpen}>
        <DialogContent onClose={() => setUrlModalOpen(false)} className={`sm:max-w-md rounded-xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Edit Cover Image URL
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Enter the direct image URL for this book cover.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>Image URL</label>
              <input
                value={editForm.cover}
                onChange={(e) => setEditForm({ ...editForm, cover: e.target.value })}
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
