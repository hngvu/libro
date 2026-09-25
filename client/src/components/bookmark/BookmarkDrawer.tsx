import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import type { BookmarkResponse, CollectionResponse, BookPublicResponse } from '@/types/api'
import {
  IconBookmark,
  IconX,
  IconTrash,
  IconBook,
  IconArrowRight,
  IconCompass,
  IconFolders,
  IconPlus,
  IconArrowLeft,
  IconChevronRight,
} from '@tabler/icons-react'

interface BookmarkDrawerProps {
  open: boolean
  onClose: () => void
  onSelectBook?: (book: { handle: string; slug?: string }) => void
}

function convertIsbn13To10(isbn13: string): string | null {
  const clean = isbn13.replace(/[^0-9]/g, '')
  if (clean.length !== 13 || !clean.startsWith('978')) return null
  const body = clean.substring(3, 12)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(body[i], 10) * (10 - i)
  }
  const rem = (11 - (sum % 11)) % 11
  const checkDigit = rem === 10 ? 'X' : rem.toString()
  return body + checkDigit
}

function BookItemCover({ cover, isbn, title }: { cover?: string | null; isbn?: string; title: string }) {
  const [imgStage, setImgStage] = useState(0)

  const getCoverUrl = (): string | null => {
    if (imgStage === 0 && cover) {
      return cover
    }
    if (imgStage <= 1 && isbn) {
      const cleanIsbn = isbn.replace(/[^0-9X]/gi, '')
      const isbn10 = cleanIsbn.length === 13 ? convertIsbn13To10(cleanIsbn) : cleanIsbn
      if (isbn10 && isbn10.length === 10) {
        return `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_SX500_.jpg`
      }
    }
    if (imgStage <= 2 && isbn) {
      return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    }
    return null
  }

  const coverUrl = getCoverUrl()

  return (
    <div className="relative w-16 sm:w-20 aspect-[2/3] shrink-0 rounded-[3px] bg-[#f0ede6] dark:bg-[#252c28] shadow-[0_2px_6px_rgba(0,0,0,0.14)] overflow-hidden flex items-center justify-center border border-[#d6d2c4]/60 dark:border-[#3d4b3e]">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-fill select-none"
          onError={() => setImgStage((prev) => prev + 1)}
        />
      ) : (
        <div className="p-1 text-center text-[#888]">
          <IconBook size={20} className="mx-auto text-[#aaa] mb-1" />
          <span className="text-[9px] font-serif leading-none line-clamp-2">{title}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[2.5px] bg-gradient-to-r from-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-[2px] w-[0.5px] bg-white/20" />
    </div>
  )
}

export function BookmarkDrawer({ open, onClose, onSelectBook }: BookmarkDrawerProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'saved' | 'collections'>('saved')

  // Saved Books State
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [reservingId, setReservingId] = useState<number | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Collections State
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<CollectionResponse | null>(null)
  const [collectionBooks, setCollectionBooks] = useState<BookPublicResponse[]>([])
  const [loadingCollectionBooks, setLoadingCollectionBooks] = useState(false)

  // Create Collection Form Modal/State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollName, setNewCollName] = useState('')
  const [newCollDesc, setNewCollDesc] = useState('')
  const [creatingColl, setCreatingColl] = useState(false)

  const fetchBookmarks = useCallback(async () => {
    setLoadingBookmarks(true)
    try {
      const data = await api.getBookmarks()
      setBookmarks(data || [])
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      setBookmarks([])
    } finally {
      setLoadingBookmarks(false)
    }
  }, [])

  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true)
    try {
      const data = await api.getMyCollections()
      setCollections(data || [])
    } catch (err) {
      console.error('Failed to load collections:', err)
      setCollections([])
    } finally {
      setLoadingCollections(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchBookmarks()
      fetchCollections()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setSelectedCollection(null)
      setShowCreateModal(false)
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open, fetchBookmarks, fetchCollections])

  // Sync event listener
  useEffect(() => {
    const handleSync = () => {
      if (open) {
        fetchBookmarks()
        fetchCollections()
        if (selectedCollection) {
          loadBooksInCollection(selectedCollection.id)
        }
      }
    }
    window.addEventListener('libro:bookmarks-changed', handleSync)
    window.addEventListener('libro:collections-changed', handleSync)
    return () => {
      window.removeEventListener('libro:bookmarks-changed', handleSync)
      window.removeEventListener('libro:collections-changed', handleSync)
    }
  }, [open, fetchBookmarks, fetchCollections, selectedCollection])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (selectedCollection) {
          setSelectedCollection(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, selectedCollection])

  const loadBooksInCollection = async (collectionId: number) => {
    setLoadingCollectionBooks(true)
    try {
      const res = await api.getCollectionBooks(collectionId, 1, 50)
      setCollectionBooks(res.content || [])
    } catch (err) {
      console.error('Failed to load collection books:', err)
      setCollectionBooks([])
    } finally {
      setLoadingCollectionBooks(false)
    }
  }

  const handleSelectCollection = (c: CollectionResponse) => {
    setSelectedCollection(c)
    loadBooksInCollection(c.id)
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollName.trim() || creatingColl) return
    setCreatingColl(true)
    try {
      const res = await api.createCollection({
        name: newCollName.trim(),
        description: newCollDesc.trim() || undefined,
      })
      setCollections((prev) => [...prev, res])
      setNewCollName('')
      setNewCollDesc('')
      setShowCreateModal(false)
      setActionNotice(`Created collection "${res.name}"`)
      setTimeout(() => setActionNotice(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection'
      setActionNotice(`Error: ${msg}`)
      setTimeout(() => setActionNotice(null), 3500)
    } finally {
      setCreatingColl(false)
    }
  }

  const handleDeleteCollection = async (collectionId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this collection?')) return
    try {
      await api.deleteCollection(collectionId)
      setCollections((prev) => prev.filter((c) => c.id !== collectionId))
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null)
      }
      setActionNotice('Collection deleted')
      setTimeout(() => setActionNotice(null), 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete'
      setActionNotice(`Error: ${msg}`)
      setTimeout(() => setActionNotice(null), 3000)
    }
  }

  const handleRemoveFromCollection = async (bookId: number) => {
    if (!selectedCollection) return
    try {
      await api.removeBookFromCollection(selectedCollection.id, bookId)
      setCollectionBooks((prev) => prev.filter((b) => b.id !== bookId))
      setSelectedCollection((prev) =>
        prev ? { ...prev, bookCount: Math.max(0, prev.bookCount - 1) } : null
      )
      setCollections((prev) =>
        prev.map((c) =>
          c.id === selectedCollection.id
            ? { ...c, bookCount: Math.max(0, c.bookCount - 1) }
            : c
        )
      )
      window.dispatchEvent(new CustomEvent('libro:collections-changed'))
    } catch (err) {
      console.error('Failed to remove from collection:', err)
    }
  }

  const handleRemoveSavedBook = async (bookmark: BookmarkResponse) => {
    setRemovingId(bookmark.bookId)
    try {
      await api.removeBookmark(bookmark.bookId)
      setBookmarks((prev) => prev.filter((b) => b.bookId !== bookmark.bookId))
      window.dispatchEvent(
        new CustomEvent('libro:bookmarks-changed', {
          detail: { bookId: bookmark.bookId, bookmarked: false },
        })
      )
    } catch (err) {
      console.error('Failed to remove saved book:', err)
    } finally {
      setRemovingId(null)
    }
  }

  const handleViewDetails = (book: { handle: string; slug?: string }) => {
    onClose()
    if (onSelectBook) {
      onSelectBook(book)
    } else {
      navigate(`/book/${book.handle}/${book.slug || book.handle}`)
    }
  }

  const handleReserve = async (bookmark: BookmarkResponse) => {
    setReservingId(bookmark.bookId)
    setActionNotice(null)
    try {
      const res = await api.placeReservation({
        bookId: bookmark.bookId,
        bookHandle: bookmark.bookHandle,
      })
      const isAvailable = (bookmark.availableCopies ?? 0) > 0
      setActionNotice(
        isAvailable
          ? `Reserved! Code: ${res.reservationCode} (Pick up at desk)`
          : `Hold placed! Code: ${res.reservationCode} (Waitlist #${res.queuePosition || 1})`
      )
      setTimeout(() => setActionNotice(null), 4500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reservation failed'
      setActionNotice(`Notice: ${msg}`)
      setTimeout(() => setActionNotice(null), 4000)
    } finally {
      setReservingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-drawer-title"
        className="relative w-full max-w-md bg-[#faf9f5] dark:bg-[#1c221e] text-[#1e2320] dark:text-[#f5f3e6] shadow-2xl flex flex-col h-full border-l border-[#d6d2c4] dark:border-[#384239] z-10 animate-in slide-in-from-right duration-300 ease-out"
      >
        {/* Header with Title & Tabs */}
        <div className="p-4 sm:p-5 border-b border-[#e2ded2] dark:border-[#303831] bg-white/70 dark:bg-[#202722]/80 backdrop-blur-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {selectedCollection ? (
                <button
                  type="button"
                  onClick={() => setSelectedCollection(null)}
                  className="p-1 rounded-md hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-300 cursor-pointer"
                  title="Back to Collections"
                >
                  <IconArrowLeft size={18} />
                </button>
              ) : (
                <span className="w-8 h-8 rounded-lg bg-[#2e7d56]/12 dark:bg-[#2e7d56]/25 text-[#2e7d56] dark:text-[#66bb6a] flex items-center justify-center shrink-0">
                  <IconFolders size={18} />
                </span>
              )}
              <div>
                <h2
                  id="bookmark-drawer-title"
                  className="font-serif font-bold text-lg text-[#181818] dark:text-[#f5f3e6] tracking-tight leading-none"
                >
                  {selectedCollection ? selectedCollection.name : 'Your Library Shelf'}
                </h2>
                <p className="text-[11.5px] text-[#666666] dark:text-[#a0a89f] mt-0.5">
                  {selectedCollection
                    ? `${selectedCollection.bookCount} books in collection`
                    : 'Personal collections & saved titles'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#777] hover:text-[#181818] dark:hover:text-[#f5f3e6] rounded-md hover:bg-stone-200/60 dark:hover:bg-[#2c352d] transition-colors cursor-pointer"
              title="Close shelf (Esc)"
            >
              <IconX size={18} />
            </button>
          </div>

          {/* Segmented Control Tabs (Only if not drilling into a collection) */}
          {!selectedCollection && (
            <div className="flex items-center p-1 rounded-lg bg-[#eeebd9] dark:bg-[#28312a] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-white dark:bg-[#1a1f1b] text-[#181818] dark:text-[#f5f3e6] shadow-xs'
                    : 'text-[#666] dark:text-[#aaa] hover:text-[#181818] dark:hover:text-[#fff]'
                }`}
              >
                <IconBookmark size={14} />
                <span>Saved Books ({bookmarks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('collections')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'collections'
                    ? 'bg-white dark:bg-[#1a1f1b] text-[#181818] dark:text-[#f5f3e6] shadow-xs'
                    : 'text-[#666] dark:text-[#aaa] hover:text-[#181818] dark:hover:text-[#fff]'
                }`}
              >
                <IconFolders size={14} />
                <span>My Collections ({collections.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Action / Error Banner */}
        {actionNotice && (
          <div className="px-4 py-2 bg-[#2e7d56]/15 dark:bg-[#2e7d56]/30 border-b border-[#2e7d56]/30 text-[#1e583b] dark:text-[#81c784] text-xs font-medium flex items-center justify-between animate-in fade-in">
            <span>{actionNotice}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-[#1e583b] dark:text-[#81c784] hover:opacity-75 cursor-pointer"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#ece7db] dark:divide-[#2e372f]">
          {selectedCollection ? (
            /* Collection Detail View inside Drawer */
            <div className="space-y-4">
              {loadingCollectionBooks ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#2e7d56] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#888]">Loading books in collection...</p>
                </div>
              ) : collectionBooks.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <IconBook size={40} className="mx-auto text-stone-300 dark:text-zinc-700" />
                  <h4 className="font-serif font-bold text-sm text-stone-700 dark:text-stone-300">
                    No books in this collection
                  </h4>
                  <p className="text-xs text-stone-500 max-w-[240px] mx-auto">
                    Browse the catalog and click "Add to Collection" on any book.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collectionBooks.map((b) => (
                    <div
                      key={b.id || b.handle}
                      className="flex gap-3 p-3 rounded-xl border border-[#e2ded2] dark:border-[#333d36] bg-white dark:bg-[#202722] hover:border-[#2e7d56]/50 transition-colors group"
                    >
                      <BookItemCover cover={b.cover} isbn={b.isbn} title={b.title} />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4
                            onClick={() => handleViewDetails(b)}
                            className="font-serif font-bold text-xs sm:text-sm text-[#181818] dark:text-[#f5f3e6] line-clamp-2 leading-snug cursor-pointer hover:text-[#2e7d56] transition-colors"
                          >
                            {b.title}
                          </h4>
                          <p className="text-[11px] text-[#666] dark:text-[#a0a89f] truncate mt-0.5">
                            {b.authors && b.authors.length > 0
                              ? b.authors.map((a) => a.name).join(', ')
                              : 'Unknown Author'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#f0ede4] dark:border-[#29322a] mt-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(b)}
                            className="text-[11px] font-semibold text-[#2e7d56] hover:underline cursor-pointer"
                          >
                            View details
                          </button>

                          <button
                            type="button"
                            onClick={() => b.id && handleRemoveFromCollection(b.id)}
                            className="text-[#999] hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="Remove from collection"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'saved' ? (
            /* Saved Books Tab */
            loadingBookmarks ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#2e7d56] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#888]">Loading saved titles...</p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-xs mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#eeebd9] dark:bg-[#28312a] flex items-center justify-center mx-auto text-[#2e7d56]">
                  <IconBookmark size={28} />
                </div>
                <h3 className="font-serif font-bold text-base text-[#181818] dark:text-[#f5f3e6]">
                  Your Shelf is Empty
                </h3>
                <p className="text-xs text-[#666] dark:text-[#a0a89f] leading-relaxed">
                  Bookmark titles you'd like to read later, or create custom collections to organize your study.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate('/')
                  }}
                  className="px-4 py-2 rounded-lg bg-[#2e7d56] hover:bg-[#256646] text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <IconCompass size={15} />
                  <span>Explore Catalog</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="flex gap-3 p-3 rounded-xl border border-[#e2ded2] dark:border-[#333d36] bg-white dark:bg-[#202722] hover:border-[#2e7d56]/50 transition-colors group"
                  >
                    <BookItemCover cover={bm.bookCover} isbn={bm.isbn} title={bm.bookTitle} />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4
                          onClick={() => handleViewDetails({ handle: bm.bookHandle, slug: bm.bookSlug })}
                          className="font-serif font-bold text-xs sm:text-sm text-[#181818] dark:text-[#f5f3e6] line-clamp-2 leading-snug cursor-pointer hover:text-[#2e7d56] transition-colors"
                        >
                          {bm.bookTitle}
                        </h4>
                        <p className="text-[11px] text-[#666] dark:text-[#a0a89f] truncate mt-0.5">
                          {bm.authors && bm.authors.length > 0 ? bm.authors.join(', ') : 'Unknown Author'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#f0ede4] dark:border-[#29322a] mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetails({ handle: bm.bookHandle, slug: bm.bookSlug })}
                            className="text-[11px] font-semibold text-[#2e7d56] hover:underline cursor-pointer"
                          >
                            View
                          </button>
                          <span className="text-[#ccc] text-xs">·</span>
                          <button
                            type="button"
                            disabled={reservingId === bm.bookId}
                            onClick={() => handleReserve(bm)}
                            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {reservingId === bm.bookId ? 'Holding...' : 'Reserve'}
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={removingId === bm.bookId}
                          onClick={() => handleRemoveSavedBook(bm)}
                          className="text-[#999] hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          title="Remove from saved books"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* My Collections Tab */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-[#888] font-medium">Custom book shelves</span>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-2.5 py-1 rounded-md bg-[#2e7d56] hover:bg-[#256646] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <IconPlus size={14} />
                  <span>New Collection</span>
                </button>
              </div>

              {loadingCollections ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#2e7d56] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#888]">Loading collections...</p>
                </div>
              ) : collections.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <IconFolders size={36} className="mx-auto text-stone-300 dark:text-zinc-700" />
                  <h4 className="font-serif font-bold text-sm text-stone-700 dark:text-stone-300">
                    No custom collections yet
                  </h4>
                  <p className="text-xs text-stone-500 max-w-[220px] mx-auto">
                    Group books by theme, project, or season.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {collections.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCollection(c)}
                      className="p-3.5 rounded-xl border border-[#e2ded2] dark:border-[#333d36] bg-white dark:bg-[#202722] hover:border-[#2e7d56]/60 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#2e7d56] transition-colors truncate">
                            {c.name}
                          </h4>
                          {c.isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#2e7d56]/15 text-[#2e7d56]">
                              Default
                            </span>
                          )}
                        </div>

                        {c.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                            {c.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] font-medium text-stone-500">
                            {c.bookCount} {c.bookCount === 1 ? 'book' : 'books'}
                          </span>

                          {/* Preview mini covers stack */}
                          {c.previewBooks && c.previewBooks.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {c.previewBooks.slice(0, 3).map((pb, idx) => (
                                <div
                                  key={pb.id || idx}
                                  className="w-5 h-7 rounded-[1px] bg-stone-200 border border-white dark:border-zinc-800 overflow-hidden shrink-0"
                                >
                                  {pb.cover && (
                                    <img
                                      src={pb.cover}
                                      alt={pb.title}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!c.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCollection(c.id, e)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete collection"
                          >
                            <IconTrash size={15} />
                          </button>
                        )}
                        <IconChevronRight
                          size={16}
                          className="text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2ded2] dark:border-[#303831] bg-white/50 dark:bg-[#202722]/50 text-center">
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/')
            }}
            className="text-xs font-semibold text-[#2e7d56] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Library Catalog</span>
            <IconArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* New Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1f2320] border border-[#d6d2c4] dark:border-[#3d4b3e] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-zinc-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                New Collection
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Summer Reading, Thesis Prep"
                  value={newCollName}
                  onChange={(e) => setNewCollName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#2e7d56]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this collection about?"
                  value={newCollDesc}
                  onChange={(e) => setNewCollDesc(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#2e7d56]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCollName.trim() || creatingColl}
                  className="px-4 py-1.5 rounded-lg bg-[#2e7d56] hover:bg-[#256646] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {creatingColl ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
