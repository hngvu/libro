import { useState, useEffect, useCallback } from 'react'
import type {
  BookPublicResponse,
  BookFormat,
  GenrePublicResponse,
  LoanPublicResponse,
  ReservationResponse,
  UserSubscriptionResponse,
  CollectionResponse,
} from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { BookCard } from '@/components/catalog/BookCard'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  IconChevronLeft,
  IconChevronRight,
  IconBook2,
  IconSearch,
  IconX,
  IconBook,
  IconClock,
  IconBookmark,
  IconCheck,
  IconFolders,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return dateStr
  }
}

import { GuestHomePage } from '@/components/home/GuestHomePage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface BookCatalogProps {
  keyword?: string
  onKeywordChange?: (kw: string) => void
  selectedGenre?: string
  onGenreChange?: (genre: string) => void
  onSelectBook: (book: BookPublicResponse) => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
}

type ShelfType = 'catalog' | 'all' | 'loans' | 'reservations' | 'read' | string

export function BookCatalog(props: BookCatalogProps) {
  const { user } = useAuth()

  // If user is guest / not a logged-in member, show the dedicated OpenLibrary-style Guest Home Page
  if (!user || user.role !== 'MEMBER') {
    return <GuestHomePage {...props} />
  }

  return <MemberCatalogContent {...props} user={user} />
}

function MemberCatalogContent({
  keyword = '',
  onKeywordChange = () => {},
  selectedGenre = '',
  onGenreChange = () => {},
  onSelectBook,
  user,
}: BookCatalogProps & { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  // Dynamic Shelf State ('catalog' for full library catalog, 'all' for all user's shelved books)
  const [selectedShelf, setSelectedShelf] = useState<ShelfType>('catalog')

  // Catalog State (All Books)
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Member's Shelves Data
  const [ongoingLoans, setOngoingLoans] = useState<LoanPublicResponse[]>([])
  const [readLoans, setReadLoans] = useState<LoanPublicResponse[]>([])
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null)

  // Personal Lists & Collections Data
  const [myCollections, setMyCollections] = useState<CollectionResponse[]>([])
  const [selectedCollection, setSelectedCollection] = useState<CollectionResponse | null>(null)
  const [collectionBooks, setCollectionBooks] = useState<BookPublicResponse[]>([])
  const [loadingCollectionBooks, setLoadingCollectionBooks] = useState(false)
  const [showCreateCollInput, setShowCreateCollInput] = useState(false)
  const [newCollName, setNewCollName] = useState('')
  const [creatingColl, setCreatingColl] = useState(false)

  // Filters & Pagination for Catalog
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [recRefreshKey, setRecRefreshKey] = useState(0)

  // Table In-Memory Search Filter
  const [searchInput, setSearchInput] = useState('')

  const filterQuery = searchInput.trim().toLowerCase()

  const displayedBooks = filterQuery && selectedShelf === 'catalog'
    ? books.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(filterQuery) ||
          (b.authors || []).some((a) => a.name.toLowerCase().includes(filterQuery))
      )
    : books

  const displayedOngoingLoans = filterQuery && selectedShelf === 'loans'
    ? ongoingLoans.filter(
        (l) =>
          (l.bookTitle || '').toLowerCase().includes(filterQuery) ||
          (l.authors || []).some((a) => a.toLowerCase().includes(filterQuery))
      )
    : ongoingLoans

  const displayedReadLoans = filterQuery && selectedShelf === 'read'
    ? readLoans.filter(
        (l) =>
          (l.bookTitle || '').toLowerCase().includes(filterQuery) ||
          (l.authors || []).some((a) => a.toLowerCase().includes(filterQuery))
      )
    : readLoans

  const displayedReservations = filterQuery && selectedShelf === 'reservations'
    ? reservations.filter(
        (r) =>
          (r.bookTitle || '').toLowerCase().includes(filterQuery) ||
          (r.authors || []).some((a) => a.toLowerCase().includes(filterQuery))
      )
    : reservations

  const displayedCollectionBooks = filterQuery && selectedCollection
    ? collectionBooks.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(filterQuery) ||
          (b.authors || []).some((a) => a.name.toLowerCase().includes(filterQuery))
      )
    : collectionBooks

  // Automatically switch to 'catalog' view if user performs search or selects genre filter
  useEffect(() => {
    if (keyword || selectedGenre) {
      setSelectedShelf('catalog')
      setSelectedCollection(null)
    }
  }, [keyword, selectedGenre])

  // Fetch Genres once
  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.content || []))
      .catch(() => setGenres([]))
  }, [])

  // Fetch Member Loans, Reservations, Subscription & Collections if logged in
  useEffect(() => {
    if (user && user.role === 'MEMBER') {
      Promise.allSettled([
        api.getMyLoans({ size: 100 }),
        api.getMyReservations({ size: 50 }),
        api.getMySubscription(),
        api.getMyCollections(),
      ]).then(([loansRes, resRes, subRes, collsRes]) => {
        if (loansRes.status === 'fulfilled') {
          const all = loansRes.value.content || []
          setOngoingLoans(all.filter((l) => l.status === 'ONGOING' || l.status === 'OVERDUE'))
          setReadLoans(all.filter((l) => l.status === 'RETURNED'))
        }
        if (resRes.status === 'fulfilled') {
          const allRes = resRes.value.content || []
          setReservations(allRes.filter((r) => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP'))
        }
        if (subRes.status === 'fulfilled') {
          setSubscription(subRes.value)
        }
        if (collsRes.status === 'fulfilled') {
          setMyCollections(collsRes.value || [])
        }
      })
    } else {
      setOngoingLoans([])
      setReadLoans([])
      setReservations([])
      setSubscription(null)
      setMyCollections([])
      setSelectedShelf('catalog')
      setSelectedCollection(null)
    }
  }, [user])

  // Real-time synchronization listeners for collections
  useEffect(() => {
    const handleCollectionsSync = () => {
      api.getMyCollections()
        .then((cols) => setMyCollections(cols || []))
        .catch(() => {})
      if (selectedCollection) {
        api.getCollectionBooks(selectedCollection.id, 1, 50)
          .then((res) => setCollectionBooks(res.content || []))
          .catch(() => {})
      }
    }
    window.addEventListener('libro:collections-changed', handleCollectionsSync)
    return () => {
      window.removeEventListener('libro:collections-changed', handleCollectionsSync)
    }
  }, [selectedCollection])

  const handleSelectCollection = (col: CollectionResponse) => {
    setSelectedShelf(`col-${col.id}`)
    setSelectedCollection(col)
    setSearchInput('')
    onKeywordChange('')
    setLoadingCollectionBooks(true)
    api.getCollectionBooks(col.id, 1, 50)
      .then((res) => setCollectionBooks(res.content || []))
      .catch(() => setCollectionBooks([]))
      .finally(() => setLoadingCollectionBooks(false))
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollName.trim() || creatingColl) return
    setCreatingColl(true)
    try {
      const res = await api.createCollection({ name: newCollName.trim() })
      setMyCollections((prev) => [...prev, res])
      setNewCollName('')
      setShowCreateCollInput(false)
      window.dispatchEvent(new CustomEvent('libro:collections-changed'))
      handleSelectCollection(res)
    } catch (err) {
      console.error('Failed to create collection:', err)
    } finally {
      setCreatingColl(false)
    }
  }

  const handleDeleteCollection = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return
    try {
      await api.deleteCollection(id)
      setMyCollections((prev) => prev.filter((c) => c.id !== id))
      if (selectedShelf === `col-${id}`) {
        setSelectedShelf('catalog')
        setSelectedCollection(null)
      }
      window.dispatchEvent(new CustomEvent('libro:collections-changed'))
    } catch (err) {
      console.error('Failed to delete collection:', err)
    }
  }

  const handleRemoveFromCollection = async (e: React.MouseEvent, collectionId: number, bookId: number) => {
    e.stopPropagation()
    try {
      await api.removeBookFromCollection(collectionId, bookId)
      setCollectionBooks((prev) => prev.filter((b) => (b as any).id !== bookId && b.handle !== String(bookId)))
      api.getMyCollections().then((cols) => setMyCollections(cols || [])).catch(() => {})
      window.dispatchEvent(new CustomEvent('libro:collections-changed'))
    } catch (err) {
      console.error('Failed to remove book from collection:', err)
    }
  }

  const isRecommendations =
    selectedShelf === 'catalog' && !keyword.trim() && !selectedGenre && !selectedFormat

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      if (isRecommendations) {
        try {
          const recs = await api.getPersonalizedRecommendations(6)
          if (recs && recs.length > 0) {
            setBooks(recs.slice(0, 6))
            setTotalPages(1)
            setTotalElements(Math.min(6, recs.length))
            return
          }
        } catch (recErr) {
          console.warn('Failed to load personalized recommendations, falling back to books catalog:', recErr)
        }
      }

      const res = await api.getBooks({
        keyword: keyword.trim() || undefined,
        format: selectedFormat || undefined,
        genre: selectedGenre || undefined,
        page,
        size: 12,
      })
      setBooks(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch books:', err)
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [isRecommendations, keyword, selectedFormat, selectedGenre, page, recRefreshKey])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleResetFilters = () => {
    setSearchInput('')
    onKeywordChange('')
    setSelectedFormat('')
    onGenreChange('')
    setPage(1)
    setSelectedShelf('catalog')
    setSelectedCollection(null)
    setRecRefreshKey((k) => k + 1)
  }

  // Convert Loan to Book for BookCard display
  const loanToBook = (l: LoanPublicResponse): BookPublicResponse => ({
    title: l.bookTitle,
    handle: l.bookHandle,
    slug: l.bookHandle,
    isbn: '',
    publicationYear: 0,
    cover: l.bookCover,
    edition: null,
    format: null,
    pageCount: null,
    language: null,
    description: null,
    totalCopies: 1,
    availableCopies: 1,
    authors: l.authors ? l.authors.map((name) => ({ name, handle: name, biography: null })) : [],
  })

  // Convert Reservation to Book for BookCard display
  const reservationToBook = (r: ReservationResponse): BookPublicResponse => ({
    title: r.bookTitle || '',
    handle: r.bookHandle || '',
    slug: r.bookHandle || '',
    isbn: '',
    publicationYear: 0,
    cover: r.bookCover || null,
    edition: null,
    format: null,
    pageCount: null,
    language: null,
    description: null,
    totalCopies: 1,
    availableCopies: 0,
    authors: r.authors ? r.authors.map((name) => ({ name, handle: name, biography: null })) : [],
  })


  const selectedGenreObj = genres.find((g) => g.handle === selectedGenre)
  const catalogTitle = keyword
    ? `Search: "${keyword}"`
    : selectedGenre
    ? `${selectedGenreObj?.name || selectedGenre} Books`
    : selectedShelf === 'catalog'
    ? 'Recommendations'
    : selectedShelf === 'loans'
    ? 'Currently Borrowing'
    : selectedShelf === 'reservations'
    ? 'Saved Reservations'
    : 'Reading History'

  useDocumentTitle(catalogTitle)

  const maxLoans = subscription?.maxActiveLoans ?? 1
  const activeQuotaUsed = ongoingLoans.length + reservations.length
  const quotaPercentage = Math.min(100, Math.round((activeQuotaUsed / maxLoans) * 100))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
      {/* 2-Column Library Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* === COLUMN 1: LEFT SIDEBAR (Shelf Controller & Plan Quota) === */}
        <aside className="w-full lg:w-48 shrink-0 space-y-4 lg:pr-1">
          {/* Plan Quota Widget */}
          {user ? (
            <div className="p-3 bg-[#faf9f4] dark:bg-[#202622] rounded-md border border-[#d5d2c7] dark:border-[#384239] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1e2320] dark:text-[#f5f3e6]">
                  {subscription?.planName || 'Free Reader'}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-[#555] dark:text-[#c8d0b7]">Quota</span>
                  <span className="font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                    {activeQuotaUsed} / {maxLoans}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#e5e3db] dark:bg-[#333d36] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      activeQuotaUsed >= maxLoans
                        ? 'bg-amber-500'
                        : 'bg-[#256345] dark:bg-[#52a677]'
                    }`}
                    style={{ width: `${quotaPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#faf9f4] dark:bg-[#202622] rounded-md border border-[#d5d2c7] dark:border-[#384239] shadow-2xs space-y-1.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#6f7f64] dark:text-[#a0b096] block">
                Library Card
              </span>
              <p className="text-[11.5px] text-[#555] dark:text-[#c8d0b7] leading-snug">
                Borrow up to 3 titles at once with online renewals.
              </p>
            </div>
          )}

          {/* Explore Section */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[#6f7f64] dark:text-[#a0b096] px-2">
              Explore
            </h3>
            <nav className="space-y-0.5 text-[13px]">
              <button
                onClick={() => {
                  setSelectedShelf('catalog')
                  setSelectedCollection(null)
                  setSearchInput('')
                  onKeywordChange('')
                  onGenreChange('')
                  setSelectedFormat('')
                  setPage(1)
                  setRecRefreshKey((k) => k + 1)
                }}
                className={`w-full flex items-center py-1.5 px-2 rounded-md transition-colors cursor-pointer text-left ${
                  isRecommendations
                    ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                    : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                }`}
              >
                <span className="truncate block flex-1">Recommendations</span>
              </button>
            </nav>
          </div>

          {/* Bookshelves (Core + Custom Shelves) */}
          {user ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold text-[#6f7f64] dark:text-[#a0b096]">
                  Bookshelves
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateCollInput((v) => !v)}
                  className="text-[#6f7f64] dark:text-[#a0b096] hover:text-[#1c5d3e] dark:hover:text-[#4ade80] transition-colors p-0.5 rounded cursor-pointer"
                  title="Create new shelf"
                >
                  <IconPlus size={14} />
                </button>
              </div>

              <nav className="space-y-0.5 text-[13px]">
                {/* Core Shelf: Currently Reading */}
                <button
                  onClick={() => {
                    setSelectedShelf('loans')
                    setSelectedCollection(null)
                    setSearchInput('')
                    onKeywordChange('')
                  }}
                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer text-left ${
                    selectedShelf === 'loans'
                      ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                      : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                  }`}
                >
                  <span className="truncate block flex-1">Currently Reading</span>
                  <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] shrink-0 ml-1">
                    ({ongoingLoans.length})
                  </span>
                </button>

                {/* Core Shelf: Read */}
                <button
                  onClick={() => {
                    setSelectedShelf('read')
                    setSelectedCollection(null)
                    setSearchInput('')
                    onKeywordChange('')
                  }}
                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer text-left ${
                    selectedShelf === 'read'
                      ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                      : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                  }`}
                >
                  <span className="truncate block flex-1">Read</span>
                  <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] shrink-0 ml-1">
                    ({readLoans.length})
                  </span>
                </button>

                {/* Divider between core reading shelves and custom shelves */}
                <div className="my-1.5 border-t border-[#e5e3db] dark:border-[#384239]" />

                {/* Custom Shelves (User Collections) */}
                {myCollections.map((col) => {
                  const isSelected = selectedShelf === `col-${col.id}`
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => handleSelectCollection(col)}
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                          : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                      }`}
                    >
                      <span className="truncate block flex-1" title={col.name}>
                        {col.name}
                      </span>
                      <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] shrink-0 ml-1">
                        ({col.bookCount || 0})
                      </span>
                    </button>
                  )
                })}

                {/* Inline Create Input */}
                {showCreateCollInput && (
                  <form onSubmit={handleCreateCollection} className="flex items-center gap-1.5 pt-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="New shelf..."
                      value={newCollName}
                      onChange={(e) => setNewCollName(e.target.value)}
                      className="flex-1 h-7 px-2 text-xs rounded border border-[#ccc] dark:border-[#444] bg-white dark:bg-[#252c28] text-[#181818] dark:text-[#f5f3e6] focus:outline-none focus:border-[#1c5d3e]"
                    />
                    <button
                      type="submit"
                      disabled={!newCollName.trim() || creatingColl}
                      className="h-7 px-2.5 rounded bg-[#1c5d3e] hover:bg-[#164e33] text-white text-[11.5px] font-semibold disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {creatingColl ? '...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCollInput(false)
                        setNewCollName('')
                      }}
                      className="h-7 px-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[#888] cursor-pointer shrink-0"
                    >
                      <IconX size={13} />
                    </button>
                  </form>
                )}

                {/* If no custom collections & not creating */}
                {!showCreateCollInput && myCollections.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCollInput(true)}
                    className="w-full text-left py-1 px-2 text-xs text-[#6f7f64] hover:text-[#1c5d3e] dark:text-[#a0b096] dark:hover:text-[#4ade80] transition-colors cursor-pointer"
                  >
                    <span>+ New shelf...</span>
                  </button>
                )}
              </nav>
            </div>
          ) : null}
        </aside>

        {/* === COLUMN 2: CENTER MAIN CONTENT (Dynamic Bookshelf) === */}
        <main className="flex-1 min-w-0 lg:max-w-[620px] space-y-4">
          {/* Table Search & Filter Bar */}
          <div className="relative flex items-center">
            <IconSearch
              size={15}
              className="absolute left-3 text-[#6f7f64] dark:text-[#a0b096] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Filter by title, author..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-8.5 pl-9 pr-8 text-xs sm:text-[13px] bg-white dark:bg-[#202622] border border-[#d5d2c7] dark:border-[#384239] rounded-md focus:outline-none focus:border-[#1c5d3e] text-[#1e2320] dark:text-[#f5f3e6] placeholder:text-[#888] dark:placeholder:text-[#777] transition-colors shadow-2xs"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                title="Clear filter"
              >
                <IconX size={14} />
              </button>
            ) : null}
          </div>

          {/* Dynamic Header based on Selected Shelf */}
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedShelf === 'catalog'
                  ? selectedGenreObj ? selectedGenreObj.name : 'Recommendations'
                  : selectedShelf === 'loans'
                  ? `Currently Reading (${displayedOngoingLoans.length})`
                  : selectedShelf === 'reservations'
                  ? `Want to Read (${reservations.length})`
                  : selectedShelf === 'read'
                  ? `Read (${displayedReadLoans.length})`
                  : selectedCollection
                  ? `${selectedCollection.name} (${displayedCollectionBooks.length})`
                  : 'Books'}
              </h1>
              {selectedCollection?.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedCollection.description}
                </p>
              )}
            </div>

            {selectedCollection && (
              <button
                type="button"
                onClick={() => handleDeleteCollection(selectedCollection.id)}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Delete this collection"
              >
                <IconTrash size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Bookshelf Section */}
          <div className="space-y-3">
            {/* DYNAMIC SHELF: LIBRARY CATALOG */}
            {selectedShelf === 'catalog' && (
              <>
                {loading ? (
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {[...Array(isRecommendations ? 6 : 12)].map((_, i) => (
                      <div key={i} className="animate-pulse w-[86px] sm:w-[92px] shrink-0 space-y-1.5">
                        <div className="aspect-[2/3] w-full rounded-[3px] bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : books.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <IconBook2 size={36} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books matched your criteria
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Try searching with different keywords or clear your genre filters.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Reset filters
                    </Button>
                  </div>
                ) : displayedBooks.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books matched "{searchInput}"
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      No books in this view match your search filter.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="mt-3 text-xs h-7 rounded-md cursor-pointer"
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {displayedBooks.map((book) => (
                      <BookCard
                        key={book.handle}
                        book={book}
                        onSelect={(b) => onSelectBook(b)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Page <span className="font-semibold text-zinc-800 dark:text-zinc-200">{page}</span> of {totalPages} ({totalElements} titles)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-7 text-xs px-2.5 rounded-md cursor-pointer"
                      >
                        <IconChevronLeft size={13} /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-7 text-xs px-2.5 rounded-md cursor-pointer"
                      >
                        Next <IconChevronRight size={13} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DYNAMIC SHELF 2: CURRENTLY READING (GOODREADS TABLE) */}
            {selectedShelf === 'loans' && (
              <div>
                {ongoingLoans.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <IconClock size={36} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books currently being read
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      You are not currently reading any books. Browse our catalog to find your next great read!
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('catalog')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
                    </Button>
                  </div>
                ) : displayedOngoingLoans.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books matched "{searchInput}"
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      No currently reading books match your search.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="mt-3 text-xs h-7 rounded-md cursor-pointer"
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow className="bg-[#faf9f4] dark:bg-[#202622] border-b border-[#d5d2c7] dark:border-[#384239] hover:bg-[#faf9f4] dark:hover:bg-[#202622]">
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-12 px-2 py-1.5 h-7">cover</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[42%] px-2.5 py-1.5 h-7">title</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[32%] px-2.5 py-1.5 h-7">author</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[26%] px-2.5 py-1.5 h-7 whitespace-nowrap">date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedOngoingLoans.map((loan) => (
                        <TableRow key={loan.loanCode} className="border-b border-[#d5d2c7]/50 dark:border-[#384239]/50 hover:bg-[#faf9f4]/80 dark:hover:bg-[#252c28]/60 transition-colors">
                          <TableCell className="w-12 px-2 py-2 align-top">
                            <div
                              onClick={() => loan.bookHandle && onSelectBook(loanToBook(loan))}
                              className="w-8 h-11.5 rounded-[2px] bg-[#d5d2c7]/20 dark:bg-[#384239]/30 border border-[#d5d2c7]/60 dark:border-[#384239] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs group"
                            >
                              {loan.bookCover ? (
                                <img
                                  src={loan.bookCover}
                                  alt={loan.bookTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                              ) : (
                                <IconBook size={14} className="text-[#6f7f64] dark:text-[#c8d0b7] opacity-60" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[42%] px-2.5 py-2 align-top">
                            <span
                              onClick={() => loan.bookHandle && onSelectBook(loanToBook(loan))}
                              className="font-normal text-[12px] text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer block leading-snug"
                              title={loan.bookTitle}
                            >
                              {loan.bookTitle || 'Untitled Book'}
                            </span>
                          </TableCell>
                          <TableCell className="w-[32%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top leading-snug">
                            {loan.authors && loan.authors.length > 0 ? loan.authors.join(', ') : '—'}
                          </TableCell>
                          <TableCell className="w-[26%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top whitespace-nowrap">
                            {formatDate(loan.borrowDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* DYNAMIC SHELF 3: WANT TO READ (GOODREADS TABLE) */}
            {selectedShelf === 'reservations' && (
              <div>
                {reservations.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <IconBookmark size={36} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      Your Want to Read list is empty
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Add books or place holds to keep track of what you'd like to read next.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('catalog')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
                    </Button>
                  </div>
                ) : displayedReservations.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books matched "{searchInput}"
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      No saved books match your search.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="mt-3 text-xs h-7 rounded-md cursor-pointer"
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow className="bg-[#faf9f4] dark:bg-[#202622] border-b border-[#d5d2c7] dark:border-[#384239] hover:bg-[#faf9f4] dark:hover:bg-[#202622]">
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-12 px-2 py-1.5 h-7">cover</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[42%] px-2.5 py-1.5 h-7">title</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[32%] px-2.5 py-1.5 h-7">author</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[26%] px-2.5 py-1.5 h-7 whitespace-nowrap">date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedReservations.map((res) => (
                        <TableRow key={res.reservationCode} className="border-b border-[#d5d2c7]/50 dark:border-[#384239]/50 hover:bg-[#faf9f4]/80 dark:hover:bg-[#252c28]/60 transition-colors">
                          <TableCell className="w-12 px-2 py-2 align-top">
                            <div
                              onClick={() => res.bookHandle && onSelectBook(reservationToBook(res))}
                              className="w-8 h-11.5 rounded-[2px] bg-[#d5d2c7]/20 dark:bg-[#384239]/30 border border-[#d5d2c7]/60 dark:border-[#384239] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs group"
                            >
                              {res.bookCover ? (
                                <img
                                  src={res.bookCover}
                                  alt={res.bookTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                              ) : (
                                <IconBook size={14} className="text-[#6f7f64] dark:text-[#c8d0b7] opacity-60" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[42%] px-2.5 py-2 align-top">
                            <span
                              onClick={() => res.bookHandle && onSelectBook(reservationToBook(res))}
                              className="font-normal text-[12px] text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer block leading-snug"
                              title={res.bookTitle}
                            >
                              {res.bookTitle || 'Untitled Book'}
                            </span>
                          </TableCell>
                          <TableCell className="w-[32%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top leading-snug">
                            {res.authors && res.authors.length > 0 ? res.authors.join(', ') : '—'}
                          </TableCell>
                          <TableCell className="w-[26%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top whitespace-nowrap">
                            {formatDate(res.reservedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* DYNAMIC SHELF 4: READ (GOODREADS TABLE) */}
            {selectedShelf === 'read' && (
              <div>
                {readLoans.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <IconCheck size={36} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No completed reads recorded
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Books you finish reading will be collected on this shelf to track your reading journey.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('catalog')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
                    </Button>
                  </div>
                ) : displayedReadLoans.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books matched "{searchInput}"
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      No books in your Read shelf match your search.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="mt-3 text-xs h-7 rounded-md cursor-pointer"
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow className="bg-[#faf9f4] dark:bg-[#202622] border-b border-[#d5d2c7] dark:border-[#384239] hover:bg-[#faf9f4] dark:hover:bg-[#202622]">
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-12 px-2 py-1.5 h-7">cover</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[42%] px-2.5 py-1.5 h-7">title</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[32%] px-2.5 py-1.5 h-7">author</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[26%] px-2.5 py-1.5 h-7 whitespace-nowrap">date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedReadLoans.map((loan) => (
                        <TableRow key={loan.loanCode} className="border-b border-[#d5d2c7]/50 dark:border-[#384239]/50 hover:bg-[#faf9f4]/80 dark:hover:bg-[#252c28]/60 transition-colors">
                          <TableCell className="w-12 px-2 py-2 align-top">
                            <div
                              onClick={() => loan.bookHandle && onSelectBook(loanToBook(loan))}
                              className="w-8 h-11.5 rounded-[2px] bg-[#d5d2c7]/20 dark:bg-[#384239]/30 border border-[#d5d2c7]/60 dark:border-[#384239] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs group"
                            >
                              {loan.bookCover ? (
                                <img
                                  src={loan.bookCover}
                                  alt={loan.bookTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                              ) : (
                                <IconBook size={14} className="text-[#6f7f64] dark:text-[#c8d0b7] opacity-60" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[42%] px-2.5 py-2 align-top">
                            <span
                              onClick={() => loan.bookHandle && onSelectBook(loanToBook(loan))}
                              className="font-normal text-[12px] text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer block leading-snug"
                              title={loan.bookTitle}
                            >
                              {loan.bookTitle || 'Untitled Book'}
                            </span>
                          </TableCell>
                          <TableCell className="w-[32%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top leading-snug">
                            {loan.authors && loan.authors.length > 0 ? loan.authors.join(', ') : '—'}
                          </TableCell>
                          <TableCell className="w-[26%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top whitespace-nowrap">
                            {formatDate(loan.returnDate || loan.borrowDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}


            {/* DYNAMIC SHELF 6: CUSTOM COLLECTION (GOODREADS TABLE) */}
            {selectedShelf.startsWith('col-') && selectedCollection && (
              <div>
                {loadingCollectionBooks ? (
                  <div className="p-8 text-center text-xs text-zinc-500">Loading collection books...</div>
                ) : collectionBooks.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <IconFolders size={36} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books in this collection yet
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Add books to "{selectedCollection.name}" by clicking "Reading List ▾" &rarr; "Add to custom shelf..." on any book page.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('catalog')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
                    </Button>
                  </div>
                ) : displayedCollectionBooks.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      No books matched "{searchInput}"
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      No books in this shelf match your search.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="mt-3 text-xs h-7 rounded-md cursor-pointer"
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : (
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow className="bg-[#faf9f4] dark:bg-[#202622] border-b border-[#d5d2c7] dark:border-[#384239] hover:bg-[#faf9f4] dark:hover:bg-[#202622]">
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-12 px-2 py-1.5 h-7">cover</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[42%] px-2.5 py-1.5 h-7">title</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[32%] px-2.5 py-1.5 h-7">author</TableHead>
                        <TableHead className="text-[12px] font-normal text-zinc-500 dark:text-zinc-400 w-[26%] px-2.5 py-1.5 h-7 whitespace-nowrap">format</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedCollectionBooks.map((book) => (
                        <TableRow key={book.handle} className="group border-b border-[#d5d2c7]/50 dark:border-[#384239]/50 hover:bg-[#faf9f4]/80 dark:hover:bg-[#252c28]/60 transition-colors">
                          <TableCell className="w-12 px-2 py-2 align-top">
                            <div
                              onClick={() => onSelectBook(book)}
                              className="w-8 h-11.5 rounded-[2px] bg-[#d5d2c7]/20 dark:bg-[#384239]/30 border border-[#d5d2c7]/60 dark:border-[#384239] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs group"
                            >
                              {book.cover ? (
                                <img
                                  src={book.cover}
                                  alt={book.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                              ) : (
                                <IconBook size={14} className="text-[#6f7f64] dark:text-[#c8d0b7] opacity-60" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[42%] px-2.5 py-2 align-top">
                            <span
                              onClick={() => onSelectBook(book)}
                              className="font-normal text-[12px] text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer block leading-snug"
                              title={book.title}
                            >
                              {book.title || 'Untitled Book'}
                            </span>
                          </TableCell>
                          <TableCell className="w-[32%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top leading-snug">
                            {book.authors && book.authors.length > 0 ? book.authors.map((a) => a.name).join(', ') : '—'}
                          </TableCell>
                          <TableCell className="w-[26%] text-[12px] font-normal text-zinc-800 dark:text-zinc-200 px-2.5 py-2 align-top whitespace-nowrap">
                            <div className="flex items-center justify-between">
                              <span>{book.format || (book.publicationYear ? `${book.publicationYear}` : '—')}</span>
                              <button
                                type="button"
                                onClick={(e) => (book as any).id && handleRemoveFromCollection(e, selectedCollection.id, (book as any).id)}
                                className="opacity-0 group-hover:opacity-100 text-[#888] hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                                title="Remove from collection"
                              >
                                <IconX size={13} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  )
}




