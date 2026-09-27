import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import type { BookPublicResponse, BookFormat, GenrePublicResponse } from '@/types/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/button'
import {
  IconSearch,
  IconX,
  IconBook,
  IconBook2,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconBookmark,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react'

interface SearchResultsPageProps {
  onSelectBook: (book: BookPublicResponse) => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
}

export function SearchResultsPage({ onSelectBook, onOpenAuth }: SearchResultsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Primary search query param is 'q' (fallback to 'keyword' if any)
  const q = searchParams.get('q') || searchParams.get('keyword') || ''
  const formatParam = searchParams.get('format') as BookFormat | null
  const genreParam = searchParams.get('genre') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const { user } = useAuth()
  const [searchInput, setSearchInput] = useState(q)
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | ''>(formatParam || '')
  const [selectedGenre, setSelectedGenre] = useState<string>(genreParam)
  const [page, setPage] = useState<number>(isNaN(pageParam) ? 1 : pageParam)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set())
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [reservedBooks, setReservedBooks] = useState<Map<number, 'PENDING' | 'READY_FOR_PICKUP'>>(new Map())
  const [reservingBookId, setReservingBookId] = useState<number | null>(null)

  useDocumentTitle(q ? `Search: "${q}"` : 'Search Books')

  // Keep input in sync with URL param
  useEffect(() => {
    setSearchInput(q)
  }, [q])

  // Fetch bookmarks for logged-in member
  useEffect(() => {
    if (!user || user.role !== 'MEMBER') {
      setBookmarkedIds(new Set())
      return
    }
    api.getBookmarks()
      .then((items) => {
        setBookmarkedIds(new Set(items.map((b) => b.bookId)))
      })
      .catch((err) => console.error('Failed to fetch bookmarks:', err))

    // Fetch active reservations for logged-in member
    api.getMyReservations({ size: 50 })
      .then((res) => {
        const map = new Map<number, 'PENDING' | 'READY_FOR_PICKUP'>()
        for (const r of res.content || []) {
          if (r.bookId && (r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP')) {
            map.set(r.bookId, r.status)
          }
        }
        setReservedBooks(map)
      })
      .catch(() => setReservedBooks(new Map()))
  }, [user])

  // Listen to external bookmark updates
  useEffect(() => {
    const handleBookmarkChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ bookId: number; bookmarked: boolean }>
      if (customEvent.detail) {
        const { bookId, bookmarked } = customEvent.detail
        setBookmarkedIds((prev) => {
          const next = new Set(prev)
          if (bookmarked) {
            next.add(bookId)
          } else {
            next.delete(bookId)
          }
          return next
        })
      }
    }
    window.addEventListener('libro:bookmarks-changed', handleBookmarkChange)
    return () => {
      window.removeEventListener('libro:bookmarks-changed', handleBookmarkChange)
    }
  }, [])

  const handleToggleBookmark = async (bookId: number) => {
    if (!user || user.role !== 'MEMBER') {
      onOpenAuth?.('login')
      return
    }
    if (togglingId === bookId) return
    setTogglingId(bookId)
    try {
      const res = await api.toggleBookmark(bookId)
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        if (res.bookmarked) {
          next.add(bookId)
        } else {
          next.delete(bookId)
        }
        return next
      })
      window.dispatchEvent(
        new CustomEvent('libro:bookmarks-changed', {
          detail: { bookId, bookmarked: res.bookmarked },
        })
      )
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleReserve = async (book: BookPublicResponse) => {
    if (!user || user.role !== 'MEMBER') {
      onOpenAuth?.('login')
      return
    }
    if (!book.id || reservingBookId === book.id) return

    if (reservedBooks.has(book.id)) {
      navigate('/activity?tab=reservations')
      return
    }

    setReservingBookId(book.id)
    try {
      const res = await api.placeReservation({
        bookId: book.id,
        bookHandle: book.handle,
      })
      setReservedBooks((prev) => {
        const next = new Map(prev)
        next.set(book.id!, (res.status as 'PENDING' | 'READY_FOR_PICKUP') || 'PENDING')
        return next
      })
    } catch (err) {
      console.error('Failed to reserve book:', err)
    } finally {
      setReservingBookId(null)
    }
  }

  // Fetch available genres once for the filter bar
  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.content || []))
      .catch(() => setGenres([]))
  }, [])

  // Fetch books matching search query & filters
  const fetchSearchResults = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getBooks({
        keyword: q.trim() || undefined,
        format: selectedFormat || undefined,
        genre: selectedGenre || undefined,
        page,
        size: 12,
      })
      setBooks(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      console.error('Failed to fetch search results:', err)
      setBooks([])
      setTotalPages(1)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [q, selectedFormat, selectedGenre, page])

  useEffect(() => {
    fetchSearchResults()
  }, [fetchSearchResults])

  // Handle search submission from top searchbar
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    const params = new URLSearchParams()
    if (trimmed) params.set('q', trimmed)
    if (selectedFormat) params.set('format', selectedFormat)
    if (selectedGenre) params.set('genre', selectedGenre)
    params.set('page', '1')
    setPage(1)
    setSearchParams(params)
  }

  const handleFormatChange = (format: BookFormat | '') => {
    setSelectedFormat(format)
    setPage(1)
    const params = new URLSearchParams(searchParams)
    if (format) params.set('format', format)
    else params.delete('format')
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleGenreChange = (genreHandle: string) => {
    setSelectedGenre(genreHandle)
    setPage(1)
    const params = new URLSearchParams(searchParams)
    if (genreHandle) params.set('genre', genreHandle)
    else params.delete('genre')
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSelectedFormat('')
    setSelectedGenre('')
    setPage(1)
    navigate('/search')
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-150">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          placeholder="Search books by title, author, or keyword..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full h-11 pl-4 pr-16 text-sm bg-white dark:bg-[#202622] border border-[#d5d2c7] dark:border-[#384239] rounded-lg focus:outline-none focus:border-[#1c5d3e] text-[#1e2320] dark:text-[#f5f3e6] placeholder:text-[#888] dark:placeholder:text-[#777] transition-colors shadow-2xs"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
              }}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              title="Clear"
            >
              <IconX size={16} />
            </button>
          ) : null}
          <button
            type="submit"
            className="p-1.5 text-[#6f7f64] dark:text-[#a0b096] hover:text-[#1c5d3e] dark:hover:text-[#4ade80] cursor-pointer transition-colors rounded-md"
            title="Search"
          >
            <IconSearch size={19} />
          </button>
        </div>
      </form>

      {/* Filter and Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d5d2c7] dark:border-[#384239]">
        <div>
          {q ? (
            <h1 className="text-base sm:text-lg font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
              Search results for <span className="font-serif italic font-normal text-[#1c5d3e] dark:text-[#4ade80]">"{q}"</span>
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                ({totalElements} {totalElements === 1 ? 'book' : 'books'})
              </span>
            </h1>
          ) : (
            <h1 className="text-base sm:text-lg font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
              Browse All Books
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                ({totalElements} titles)
              </span>
            </h1>
          )}
        </div>

        {/* Filter Dropdowns (Format & Genre) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#6f7f64] dark:text-[#a0b096] mr-1">
            <IconFilter size={14} />
            <span>Filters:</span>
          </div>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => handleFormatChange(e.target.value as BookFormat | '')}
            className="h-8 px-2.5 text-xs bg-white dark:bg-[#202622] border border-[#d5d2c7] dark:border-[#384239] rounded-md text-[#1e2320] dark:text-[#f5f3e6] focus:outline-none focus:border-[#1c5d3e] cursor-pointer"
          >
            <option value="">All Formats</option>
            <option value="HARDCOVER">Hardcover</option>
            <option value="PAPERBACK">Paperback</option>
            <option value="EBOOK">E-Book</option>
          </select>

          {/* Genre Filter */}
          <select
            value={selectedGenre}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="h-8 px-2.5 text-xs bg-white dark:bg-[#202622] border border-[#d5d2c7] dark:border-[#384239] rounded-md text-[#1e2320] dark:text-[#f5f3e6] focus:outline-none focus:border-[#1c5d3e] cursor-pointer max-w-[150px]"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.handle} value={g.handle}>
                {g.name}
              </option>
            ))}
          </select>

          {(selectedFormat || selectedGenre) && (
            <button
              type="button"
              onClick={() => {
                setSelectedFormat('')
                setSelectedGenre('')
                const params = new URLSearchParams()
                if (q) params.set('q', q)
                setSearchParams(params)
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Results View */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/40 flex gap-4">
              <div className="w-16 h-24 sm:w-20 sm:h-28 bg-zinc-200 dark:bg-zinc-700 rounded shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-7 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-md" />
                  <div className="h-7 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#202622] rounded-xl border border-[#d5d2c7] dark:border-[#384239] space-y-3">
          <IconBook2 size={42} className="mx-auto text-[#6f7f64] dark:text-[#a0b096] opacity-60" />
          <h3 className="font-semibold text-base text-[#1e2320] dark:text-[#f5f3e6]">
            {q ? `No books found for "${q}"` : 'No books found'}
          </h3>
          <p className="text-xs text-[#555] dark:text-[#c8d0b7] max-w-md mx-auto">
            Try checking for spelling errors, using more general keywords, or clearing your format and genre filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="mt-2 text-xs rounded-md cursor-pointer"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-[#e5e3db] dark:divide-[#333d36]">
          {books.map((book) => (
            <div
              key={book.handle}
              className="py-4.5 sm:py-5 flex items-start gap-4 sm:gap-5 group hover:bg-[#faf9f4]/60 dark:hover:bg-[#252c28]/40 px-2 sm:px-3 rounded-lg transition-colors"
            >
              {/* Book Cover */}
              <Link
                to={`/book/${book.handle}/${book.slug || book.handle}`}
                onClick={() => onSelectBook(book)}
                className="w-16 h-24 sm:w-20 sm:h-28 bg-[#f0ede6] dark:bg-[#202622] rounded-[3px] border border-[#d5d2c7]/60 dark:border-[#384239] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs group-hover:shadow-xs transition-shadow"
              >
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <IconBook size={22} className="text-[#6f7f64] dark:text-[#a0b096] opacity-60" />
                )}
              </Link>

              {/* Book Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div>
                  <Link
                    to={`/book/${book.handle}/${book.slug || book.handle}`}
                    onClick={() => onSelectBook(book)}
                    className="text-sm sm:text-base font-semibold text-[#1e2320] dark:text-[#f5f3e6] group-hover:text-[#1c5d3e] dark:group-hover:text-[#4ade80] hover:underline cursor-pointer transition-colors leading-snug inline-block"
                  >
                    {book.title}
                  </Link>
                  <p className="text-xs sm:text-[13px] text-[#55634d] dark:text-[#c8d0b7] mt-0.5">
                    {book.authors && book.authors.length > 0
                      ? book.authors.map((a) => a.name).join(', ')
                      : 'Unknown Author'}
                  </p>
                </div>

                {/* 2 Action Buttons: Request Pickup / Waitlist & Reading List */}
                <div className="flex items-center gap-2 pt-2.5 flex-wrap">
                  {/* Button 1: Circulation Action */}
                  {book.id && reservedBooks.has(book.id) ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate('/activity?tab=reservations')
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer transition-colors shadow-2xs ${
                        reservedBooks.get(book.id) === 'READY_FOR_PICKUP'
                          ? 'bg-[#f0f7f2] dark:bg-[#1a281e] border-[#1c5d3e] dark:border-[#4ade80] text-[#1c5d3e] dark:text-[#4ade80]'
                          : 'bg-[#fffdf5] dark:bg-[#282012] border-[#c98a0c] dark:border-[#eab308] text-[#8f6402] dark:text-[#fde047]'
                      }`}
                      title="View in Activity"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          reservedBooks.get(book.id) === 'READY_FOR_PICKUP'
                            ? 'bg-[#1c5d3e] dark:bg-[#4ade80] animate-pulse'
                            : 'bg-[#c98a0c] dark:bg-[#eab308]'
                        }`}
                      />
                      <span>
                        {reservedBooks.get(book.id) === 'READY_FOR_PICKUP'
                          ? 'Ready Pickup'
                          : 'Reserved'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleReserve(book)
                      }}
                      disabled={reservingBookId === book.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#1c5d3e] hover:bg-[#164e33] text-white cursor-pointer transition-colors shadow-2xs disabled:opacity-60"
                    >
                      {reservingBookId === book.id ? (
                        <>
                          <IconLoader2 size={13} className="animate-spin" />
                          <span>Requesting...</span>
                        </>
                      ) : book.availableCopies === 0 ? (
                        <span>Join Waitlist</span>
                      ) : (
                        <span>Request Pickup</span>
                      )}
                    </button>
                  )}

                  {/* Button 2: Reading List */}
                  {book.id && bookmarkedIds.has(book.id) ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (book.id) handleToggleBookmark(book.id)
                      }}
                      disabled={togglingId === book.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#1c5d3e]/40 dark:border-[#4ade80]/40 text-[#1c5d3e] dark:text-[#4ade80] bg-[#f0f7f2] dark:bg-[#1a281e] hover:bg-[#e4efe7] dark:hover:bg-[#223528] cursor-pointer transition-colors disabled:opacity-60 shadow-2xs"
                      title="Remove from Reading List"
                    >
                      {togglingId === book.id ? (
                        <IconLoader2 size={13} className="animate-spin" />
                      ) : (
                        <IconCheck size={14} className="stroke-[2.5]" />
                      )}
                      <span>Reading List</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (book.id) handleToggleBookmark(book.id)
                      }}
                      disabled={togglingId === book.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#d6d2c4] dark:border-[#384239] bg-white dark:bg-[#202622] text-[#2c392d] dark:text-[#f0ede6] hover:bg-[#f6f5f0] dark:hover:bg-[#28322a] hover:border-[#b8b3a2] cursor-pointer transition-colors shadow-2xs disabled:opacity-60"
                    >
                      {togglingId === book.id ? (
                        <IconLoader2 size={13} className="animate-spin" />
                      ) : (
                        <IconBookmark size={14} className="text-[#6f7f64] dark:text-[#a0b096]" />
                      )}
                      <span>Reading List</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#d5d2c7] dark:border-[#384239] pt-4 mt-6">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Page <span className="font-semibold text-zinc-800 dark:text-zinc-200">{page}</span> of {totalPages} ({totalElements} titles)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              className="h-7 text-xs px-2.5 rounded-md cursor-pointer"
            >
              <IconChevronLeft size={13} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              className="h-7 text-xs px-2.5 rounded-md cursor-pointer"
            >
              Next <IconChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
