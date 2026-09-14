import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  IconExternalLink,
  IconBook2,
  IconEye,
  IconPhotoEdit,
  IconSearch,
  IconArrowsUpDown,
  IconChevronDown,
  IconFilter2,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminCombobox } from '@/components/admin/AdminCombobox'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type {
  BookResponse,
  BookFormat,
  BookStatus,
  BookCopyResponse,
  BookCopyStatus,
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
import { Switch } from '@/components/ui/switch'

function cleanCoverUrl(url: string) {
  if (!url) return url
  // Strip Amazon CDN's artificial 1px white border parameters (e.g. ._SX376_BO1,204,203,200_.jpg)
  return url.replace(/\._[^.]*(\.[a-zA-Z0-9]+)$/, '$1')
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const bookId = isNew ? null : Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction } = useAdmin()
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
    publicationYear: '' as number | string,
    cover: '',
    edition: '',
    format: 'PAPERBACK' as BookFormat,
    pageCount: '' as number | string,
    language: '',
    description: '',
    status: 'ACTIVE' as BookStatus,
    publisherId: null as number | null,
    authorIds: [] as number[],
    genreIds: [] as number[],
  })

  // Copies state
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [copiesLoading, setCopiesLoading] = useState(false)
  const [copyKeyword, setCopyKeyword] = useState('')
  const [copySortBy, setCopySortBy] = useState<'default' | 'barcode-asc' | 'barcode-desc' | 'status-asc' | 'location-asc'>('default')
  const [copyStatusFilter, setCopyStatusFilter] = useState<BookCopyStatus | ''>('')
  const [selectedCopyIds, setSelectedCopyIds] = useState<number[]>([])

  // Add copy modal
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [newCopyQuantity, setNewCopyQuantity] = useState<number | ''>('')
  const [newCopyLocation, setNewCopyLocation] = useState('')

  const isDirty = React.useMemo(() => {
    if (isNew) {
      return Boolean(editForm.title.trim())
    }
    if (!book) return false
    const initialAuthorIds = (book.authors || []).map((a) => a.id).sort().join(',')
    const currentAuthorIds = [...editForm.authorIds].sort().join(',')

    const initialGenreIds = (book.genres || []).map((g) => g.id).sort().join(',')
    const currentGenreIds = [...editForm.genreIds].sort().join(',')

    const initialPublisherId = book.publisher?.id || null

    return (
      editForm.title !== (book.title || '') ||
      editForm.isbn !== (book.isbn || '') ||
      Number(editForm.publicationYear || 0) !== (book.publicationYear || 0) ||
      editForm.cover !== (book.cover || '') ||
      editForm.edition !== (book.edition || '') ||
      editForm.format !== (book.format || 'PAPERBACK') ||
      Number(editForm.pageCount || 0) !== (book.pageCount || 0) ||
      editForm.language !== (book.language || '') ||
      editForm.description !== (book.description || '') ||
      editForm.status !== (book.status || 'ACTIVE') ||
      editForm.publisherId !== initialPublisherId ||
      initialAuthorIds !== currentAuthorIds ||
      initialGenreIds !== currentGenreIds
    )
  }, [isNew, book, editForm])

  const sortedCopies = React.useMemo(() => {
    const list = [...copies]
    if (copySortBy === 'barcode-asc') {
      return list.sort((a, b) => a.barcode.localeCompare(b.barcode))
    }
    if (copySortBy === 'barcode-desc') {
      return list.sort((a, b) => b.barcode.localeCompare(a.barcode))
    }
    if (copySortBy === 'status-asc') {
      return list.sort((a, b) => a.status.localeCompare(b.status))
    }
    if (copySortBy === 'location-asc') {
      return list.sort((a, b) => (a.location || '').localeCompare(b.location || ''))
    }
    return list
  }, [copies, copySortBy])

  const fetchCopies = useCallback(async () => {
    if (isNew || !bookId) return
    setCopiesLoading(true)
    try {
      const res = await api.adminGetBookCopies({
        bookId,
        keyword: copyKeyword || undefined,
        status: copyStatusFilter || undefined,
        size: 100,
      })
      setCopies(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load book copies')
    } finally {
      setCopiesLoading(false)
    }
  }, [isNew, bookId, copyKeyword, copyStatusFilter, showFeedback])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (isNew) {
        const [authorsRes, pubRes, genRes] = await Promise.all([
          api.adminGetAuthors({ size: 100 }),
          api.adminGetPublishers({ size: 100 }),
          api.adminGetGenres({ size: 100 }),
        ])
        setBook(null)
        setCopies([])
        setAuthorsList(authorsRes.content || [])
        setPublishersList(pubRes.content || [])
        setGenresList(genRes.content || [])
        setEditForm({
          title: '',
          slug: '',
          isbn: '',
          publicationYear: '',
          cover: '',
          edition: '',
          format: 'PAPERBACK',
          pageCount: '',
          language: '',
          description: '',
          status: 'ACTIVE',
          publisherId: null,
          authorIds: [],
          genreIds: [],
        })
      } else if (bookId) {
        const [bookData, authorsRes, pubRes, genRes, copiesData] = await Promise.all([
          api.adminGetBook(bookId),
          api.adminGetAuthors({ size: 100 }),
          api.adminGetPublishers({ size: 100 }),
          api.adminGetGenres({ size: 100 }),
          api.adminGetBookCopies({ bookId, size: 100 }),
        ])
        setBook(bookData)
        setCopies(copiesData.content || [])
        setAuthorsList(authorsRes.content || [])
        setPublishersList(pubRes.content || [])
        setGenresList(genRes.content || [])

        setEditForm({
          title: bookData.title,
          slug: bookData.slug || '',
          isbn: bookData.isbn || '',
          publicationYear: bookData.publicationYear || '',
          cover: cleanCoverUrl(bookData.cover || ''),
          edition: bookData.edition || '',
          format: bookData.format || 'PAPERBACK',
          pageCount: bookData.pageCount || '',
          language: bookData.language || '',
          description: bookData.description || '',
          status: bookData.status || 'ACTIVE',
          publisherId: bookData.publisher?.id || null,
          authorIds: (bookData.authors || []).map((a) => a.id),
          genreIds: (bookData.genres || []).map((g) => g.id),
        })
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load details')
    } finally {
      setLoading(false)
    }
  }, [bookId, isNew, showFeedback])

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

  useEffect(() => {
    if (!isNew && bookId) {
      fetchCopies()
    }
  }, [fetchCopies, isNew, bookId])

  // Book Copies Handlers
  const toggleSelectCopy = (id: number) => {
    setSelectedCopyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAllCopies = () => {
    if (selectedCopyIds.length === sortedCopies.length) {
      setSelectedCopyIds([])
    } else {
      setSelectedCopyIds(sortedCopies.map((c) => c.id))
    }
  }

  const handleBulkDeleteCopies = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedCopyIds.length} selected physical copy(ies)?`)) return
    try {
      for (const id of selectedCopyIds) {
        await api.adminDeleteBookCopy(id)
      }
      showFeedback('success', 'Deleted successfully')
      setSelectedCopyIds([])
      fetchCopies()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected copies')
    }
  }

  const handleBulkUpdateCopyStatus = async (status: BookCopyStatus) => {
    try {
      for (const id of selectedCopyIds) {
        await api.adminUpdateBookCopy(id, { status })
      }
      showFeedback('success', 'Saved successfully')
      setSelectedCopyIds([])
      fetchCopies()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update copy status')
    }
  }

  const handleOpenAddCopy = () => {
    setNewCopyQuantity('')
    setNewCopyLocation('')
    setCopyModalOpen(true)
  }

  const handleSaveCopies = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book) return
    if (!newCopyQuantity || Number(newCopyQuantity) <= 0) {
      showFeedback('error', 'Please enter a valid quantity')
      return
    }
    const qty = Math.max(1, Math.min(100, Number(newCopyQuantity)))
    try {
      for (let i = 0; i < qty; i++) {
        await api.adminCreateBookCopy({
          bookId: book.id,
          barcode: '',
          location: newCopyLocation.trim() || undefined,
        })
      }
      showFeedback('success', 'Created successfully')
      setCopyModalOpen(false)
      fetchCopies()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to add book copies')
    }
  }

  const getStatusBadge = (status: BookCopyStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'BORROWED':
        return isDark
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      case 'MAINTENANCE':
        return isDark
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      case 'LOST':
        return isDark
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      case 'RESERVED':
        return isDark
          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
          : 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return isDark
          ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          : 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Save / Create Book
  const handleSaveBook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editForm.title.trim()) {
      showFeedback('error', 'Book title is required')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const handle = `BK${String(Math.floor(100000 + Math.random() * 900000))}`
        const slug = editForm.slug || editForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'book'

        const created = await api.adminCreateBook({
          title: editForm.title.trim(),
          handle,
          slug,
          isbn: editForm.isbn.trim() || undefined,
          publicationYear: editForm.publicationYear ? Number(editForm.publicationYear) : undefined,
          cover: editForm.cover.trim() || undefined,
          edition: editForm.edition.trim() || undefined,
          format: editForm.format,
          pageCount: editForm.pageCount ? Number(editForm.pageCount) : undefined,
          language: editForm.language.trim() || undefined,
          description: editForm.description.trim() || undefined,
          publisherId: editForm.publisherId,
          authorIds: editForm.authorIds,
          genreIds: editForm.genreIds,
        })
        showFeedback('success', 'Created successfully')
        refreshCounts()
        navigate(`/admin/books/${created.id}`)
      } else if (book) {
        const finalSlug = editForm.slug?.trim() || book.slug || editForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'book'
        await api.adminUpdateBook(book.id, {
          ...editForm,
          slug: finalSlug,
          isbn: editForm.isbn.trim() || undefined,
          publicationYear: editForm.publicationYear ? Number(editForm.publicationYear) : undefined,
          cover: editForm.cover.trim() || undefined,
          edition: editForm.edition.trim() || undefined,
          pageCount: editForm.pageCount ? Number(editForm.pageCount) : undefined,
          language: editForm.language.trim() || undefined,
          description: editForm.description.trim() || undefined,
        })
        showFeedback('success', 'Saved successfully')
        loadData()
        refreshCounts()
      }
    } catch (err: any) {
      showFeedback('error', err.message || (isNew ? 'Failed to create book' : 'Failed to save book'))
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
      showFeedback('success', 'Archived successfully')
      navigate('/admin/books')
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive book')
    }
  }

  // Discard changes
  const handleDiscard = useCallback(() => {
    if (!book) return
    setEditForm({
      title: book.title || '',
      slug: book.slug || '',
      isbn: book.isbn || '',
      publicationYear: book.publicationYear || '',
      cover: book.cover || '',
      edition: book.edition || '',
      format: book.format || 'PAPERBACK',
      pageCount: book.pageCount || '',
      language: book.language || '',
      description: book.description || '',
      status: book.status || 'ACTIVE',
      publisherId: book.publisher?.id || null,
      authorIds: (book.authors || []).map((a) => a.id),
      genreIds: (book.genres || []).map((g) => g.id),
    })
  }, [book])

  // Manage top header action: update on change, clear on unmount
  useEffect(() => {
    if (isNew) {
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/books')}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs ${t.secondaryBtn}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveBook()}
            disabled={!editForm.title.trim() || saving}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            {saving ? 'Creating...' : 'Create Book'}
          </button>
        </div>
      )
    } else if (isDirty) {
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
            onClick={() => handleSaveBook()}
            disabled={saving}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [isNew, isDirty, saving, editForm.title, t.secondaryBtn, t.primaryBtn, setHeaderAction, handleDiscard])

  // Clear header action on page unmount
  useEffect(() => {
    return () => setHeaderAction(null)
  }, [setHeaderAction])

  if (loading) {
    return (
      <div className={`p-12 text-center text-xs ${t.subTextColor}`}>
        Loading book details...
      </div>
    )
  }

  if (!isNew && !book) {
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
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">

      {/* Top Book Overview (Direct Editable Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0 items-start">
        {/* Left Column (8/12): Book Info & Editable Fields (utilizing 90% width) */}
        <div className="lg:col-span-8 space-y-4 xl:space-y-4.5 w-full lg:max-w-[90%] min-w-0">
          {/* Row 1: Title */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Title
            </label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder={isNew ? '' : "Enter book title..."}
              className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 2: Authors */}
          <div className="w-full">
            <AdminCombobox
              label="Authors"
              placeholder={isNew ? '' : "Select or add authors..."}
              options={authorsList.map((a) => ({ id: a.id, label: a.name }))}
              selectedIds={editForm.authorIds}
              multiple
              displayMode="comma"
              onChange={(ids) => setEditForm({ ...editForm, authorIds: ids })}
              onCreateOption={handleCreateAuthor}
              createPrefix="Add"
            />
          </div>

          {/* Row 3: Description with Rich Text Editor */}
          <div className="pt-0.5 w-full">
            <AdminRichTextEditor
              label="Description"
              value={editForm.description}
              onChange={(val) => setEditForm({ ...editForm, description: val })}
              placeholder={isNew ? '' : "Write a synopsis, overview, or bibliographic notes (Markdown supported)..."}
              minHeight="200px"
            />
          </div>

          {/* Row 4: Publisher */}
          <div className="w-full">
            <AdminCombobox
              label="Publisher"
              placeholder={isNew ? '' : "Select or add publisher..."}
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

          {/* Row 5: Publication Year */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Publication Year
            </label>
            <input
              type="number"
              value={editForm.publicationYear}
              onChange={(e) => setEditForm({ ...editForm, publicationYear: e.target.value })}
              placeholder={isNew ? '' : "e.g. 2024"}
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 6: ISBN */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              ISBN
            </label>
            <input
              value={editForm.isbn}
              onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
              placeholder={isNew ? '' : "e.g. 978-0-13-235088-4"}
              className={`w-full h-9 px-3 text-xs xl:text-sm font-mono rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 7: Format / Binding */}
          <div className="space-y-1 w-full">
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

          {/* Row 8: Edition */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Edition
            </label>
            <input
              value={editForm.edition}
              onChange={(e) => setEditForm({ ...editForm, edition: e.target.value })}
              placeholder={isNew ? '' : "e.g. 1st Edition"}
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 9: Page Count */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Page Count
            </label>
            <input
              type="number"
              value={editForm.pageCount}
              onChange={(e) => setEditForm({ ...editForm, pageCount: e.target.value })}
              placeholder={isNew ? '' : "e.g. 320"}
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 10: Language */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Language
            </label>
            <input
              value={editForm.language}
              onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
              placeholder={isNew ? '' : "e.g. Vietnamese"}
              className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 11: Copies Section */}
          <div id="copies-section" className="space-y-3 pt-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-[#22262e]">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-xs sm:text-[13px] ${t.titleColor}`}>
                  Copies
                </h3>
                {!isNew && (
                  <span className={`text-xs font-mono ${t.mutedColor}`}>
                    ({copies.length})
                  </span>
                )}
              </div>
            </div>

            {isNew ? (
              <div className={`py-6 text-center text-xs ${t.subTextColor}`}>
                Physical copies can be added after creating the book.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search & Actions Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="flex items-center gap-2 w-full sm:w-[65%]">
                    <div className="relative flex-1">
                      <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                      <input
                        placeholder="Search barcode number..."
                        value={copyKeyword}
                        onChange={(e) => setCopyKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchCopies()}
                        className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            copySortBy !== 'default'
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
                          onClick={() => setCopySortBy('default')}
                          className={copySortBy === 'default' ? 'font-semibold text-blue-500' : ''}
                        >
                          Default
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCopySortBy('barcode-asc')}
                          className={copySortBy === 'barcode-asc' ? 'font-semibold text-blue-500' : ''}
                        >
                          Barcode (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCopySortBy('barcode-desc')}
                          className={copySortBy === 'barcode-desc' ? 'font-semibold text-blue-500' : ''}
                        >
                          Barcode (Z-A)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCopySortBy('location-asc')}
                          className={copySortBy === 'location-asc' ? 'font-semibold text-blue-500' : ''}
                        >
                          Location (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCopySortBy('status-asc')}
                          className={copySortBy === 'status-asc' ? 'font-semibold text-blue-500' : ''}
                        >
                          Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={handleOpenAddCopy}
                      className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
                    >
                      Add Copy
                    </button>
                  </div>
                </div>

                {/* Filter Section */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <div
                    className={`h-9 flex items-center gap-1.5 px-3 rounded-md border text-xs sm:text-[13px] font-semibold select-none ${
                      isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]' : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    <IconFilter2 size={15} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                    <span>Filter</span>
                  </div>

                  <AdminFilterSelect
                    label="Status"
                    value={copyStatusFilter}
                    options={[
                      { value: 'AVAILABLE', label: 'AVAILABLE' },
                      { value: 'BORROWED', label: 'BORROWED' },
                      { value: 'MAINTENANCE', label: 'MAINTENANCE' },
                      { value: 'LOST', label: 'LOST' },
                      { value: 'RESERVED', label: 'RESERVED' },
                    ]}
                    onChange={(val) => setCopyStatusFilter(val as BookCopyStatus)}
                    onRemove={() => setCopyStatusFilter('')}
                    allLabel="All Statuses"
                  />

                  {copyStatusFilter && (
                    <button
                      type="button"
                      onClick={() => setCopyStatusFilter('')}
                      className="text-xs sm:text-[13px] text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Copies Table */}
                {copiesLoading ? (
                  <div className={`p-8 text-center text-xs ${t.subTextColor}`}>
                    Loading copies...
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                          <th className="w-10 px-3 text-center align-middle">
                            <Checkbox
                              checked={
                                sortedCopies.length > 0 && selectedCopyIds.length === sortedCopies.length
                                  ? true
                                  : selectedCopyIds.length > 0
                                  ? 'indeterminate'
                                  : false
                              }
                              onCheckedChange={toggleSelectAllCopies}
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
                                <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                                  {selectedCopyIds.length} selected
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
                                    <DropdownMenuItem onClick={() => handleBulkUpdateCopyStatus('AVAILABLE')}>
                                      Mark as Available
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkUpdateCopyStatus('MAINTENANCE')}>
                                      Mark as Maintenance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkUpdateCopyStatus('LOST')}>
                                      Mark as Lost
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={handleBulkDeleteCopies}
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
                              <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                                Barcode
                              </span>
                            )}
                          </th>
                          <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                            Location
                          </th>
                          <th className={`py-3 px-4 text-xs sm:text-[13px] font-semibold text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                            Last Borrowed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-transparent">
                        {sortedCopies.length === 0 ? (
                          <tr>
                            <td colSpan={4} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                              No physical copies registered for this title yet. Click "Add Copy" to create one.
                            </td>
                          </tr>
                        ) : (
                          sortedCopies.map((c) => {
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
                                    <span className={`font-mono text-sm font-semibold ${t.titleColor}`}>
                                      {c.barcode}
                                    </span>
                                    <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${getStatusBadge(c.status)}`}>
                                      {c.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {c.location || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className={`text-xs font-mono ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                                    {c.lastLoanDate || '—'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4/12): Status + Book Cover + Genres (Wider max-w-[280px]) */}
        <div className="lg:col-span-4 space-y-4 w-full lg:max-w-[280px]">
          {/* Status (Linear/Stripe Minimal Dot + Toggle Switch Style) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Status
            </label>
            <div
              onClick={() =>
                setEditForm({
                  ...editForm,
                  status: editForm.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE',
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
                  {editForm.status === 'ACTIVE' ? 'Published' : 'Draft'}
                </span>
              </div>
              <Switch
                checked={editForm.status === 'ACTIVE'}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, status: checked ? 'ACTIVE' : 'HIDDEN' })
                }
              />
            </div>
          </div>

          {/* Book Cover with Hover Actions */}
          <div
            className={`group relative w-full rounded-md overflow-hidden shrink-0 border flex items-center justify-center ${
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
              <div className="flex items-center justify-center h-full w-full aspect-[2/3]">
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
          <div className="pt-1 w-full">
            <AdminCombobox
              label="Genres"
              placeholder={isNew ? '' : "Search or add genres..."}
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
      </div>

      {/* Bottom Actions Bar (Luôn xuất hiện) */}
      <div
        className={`pt-5 mt-6 border-t flex items-center justify-between gap-4 ${
          isDark ? 'border-[#22262e]' : 'border-gray-200'
        }`}
      >
        {/* Góc trái: Nút Delete (hoặc Cancel khi mới) */}
        {isNew ? (
          <button
            type="button"
            onClick={() => navigate('/admin/books')}
            className={`h-9 px-4 text-xs font-medium rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
          >
            Cancel
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleArchiveBook}
              disabled={saving}
              className="h-9 px-4 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              title="Delete this book"
            >
              Delete
            </button>
            {book?.handle && (
              <a
                href={`/book/${book.handle}/${book.slug || book.handle}`}
                target="_blank"
                rel="noreferrer"
                className={`h-9 px-3 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${t.secondaryBtn}`}
                title="Open public catalog page"
              >
                <IconExternalLink size={14} />
                <span>View</span>
              </a>
            )}
          </div>
        )}

        {/* Góc phải: Nút Update (hoặc Create Book khi mới) */}
        <button
          type="button"
          onClick={() => handleSaveBook()}
          disabled={isNew ? (!editForm.title.trim() || saving) : (!isDirty || saving)}
          className={`h-9 px-5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${t.primaryBtn}`}
        >
          {saving ? (isNew ? 'Creating...' : 'Updating...') : (isNew ? 'Create Book' : 'Update')}
        </button>
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

      {/* Modal: Add Copies */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader className="mb-4">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              Add Copies
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCopies} className="space-y-4 pt-1">
            {/* Book Info Summary with Cover */}
            {book && (
              <div className={`p-3 rounded-xl border flex items-center gap-3.5 ${isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
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
                    <IconBook2 size={20} className={t.mutedColor} />
                  </div>
                )}
                <div className="min-w-0">
                  <span className={`block font-semibold text-sm truncate ${t.titleColor}`}>{book.title}</span>
                  <span className={`block mt-1 text-xs ${t.subTextColor}`}>
                    ISBN: {book.isbn || 'N/A'} • Format: {book.format || 'PAPERBACK'}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={newCopyQuantity}
                onChange={(e) =>
                  setNewCopyQuantity(e.target.value === '' ? '' : Number(e.target.value))
                }
                className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border outline-none ${t.inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Location
              </label>
              <input
                value={newCopyLocation}
                onChange={(e) => setNewCopyLocation(e.target.value)}
                className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border outline-none ${t.inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`h-9 px-5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Accession
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
