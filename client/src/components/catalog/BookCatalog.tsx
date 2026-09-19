import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type {
  BookPublicResponse,
  BookFormat,
  GenrePublicResponse,
  LoanPublicResponse,
  ReservationResponse,
  UserSubscriptionResponse,
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
  IconX,
  IconBook,
  IconClock,
  IconBookmark,
  IconCheck,
  IconNews,
  IconCrown,
  IconQuote,
  IconActivity,
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

interface BookCatalogProps {
  keyword: string
  onKeywordChange: (kw: string) => void
  selectedGenre: string
  onGenreChange: (genre: string) => void
  onSelectBook: (book: BookPublicResponse) => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
}

type ShelfType = 'all' | 'loans' | 'reservations' | 'read'

export function BookCatalog({
  keyword,
  onKeywordChange,
  selectedGenre,
  onGenreChange,
  onSelectBook,
  onOpenAuth,
}: BookCatalogProps) {
  const { user } = useAuth()

  // If user is guest / not a logged-in member, show the dedicated OpenLibrary-style Guest Home Page
  if (!user || user.role !== 'MEMBER') {
    return (
      <GuestHomePage
        keyword={keyword}
        onKeywordChange={onKeywordChange}
        selectedGenre={selectedGenre}
        onGenreChange={onGenreChange}
        onSelectBook={onSelectBook}
        onOpenAuth={onOpenAuth}
      />
    )
  }

  // Dynamic Shelf State
  const [selectedShelf, setSelectedShelf] = useState<ShelfType>('all')

  // Catalog State (All Books)
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Member's Shelves Data
  const [ongoingLoans, setOngoingLoans] = useState<LoanPublicResponse[]>([])
  const [readLoans, setReadLoans] = useState<LoanPublicResponse[]>([])
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null)

  // Filters & Pagination for Catalog
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Fetch Genres once
  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.content || []))
      .catch(() => setGenres([]))
  }, [])

  // Fetch Member Loans, Reservations & Subscription if logged in
  useEffect(() => {
    if (user && user.role === 'MEMBER') {
      Promise.allSettled([
        api.getMyLoans({ size: 100 }),
        api.getMyReservations({ size: 50 }),
        api.getMySubscription(),
      ]).then(([loansRes, resRes, subRes]) => {
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
      })
    } else {
      setOngoingLoans([])
      setReadLoans([])
      setReservations([])
      setSubscription(null)
      setSelectedShelf('all')
    }
  }, [user])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
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
  }, [keyword, selectedFormat, selectedGenre, page])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleResetFilters = () => {
    onKeywordChange('')
    setSelectedFormat('')
    onGenreChange('')
    setPage(1)
    setSelectedShelf('all')
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
  const maxLoans = subscription?.maxActiveLoans || 3
  const quotaPercentage = Math.min(100, Math.round((ongoingLoans.length / maxLoans) * 100))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
      {/* Search status tag if searching from navbar */}
      {keyword && (
        <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Searching:</span>
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">"{keyword}"</strong>
          <button
            onClick={() => onKeywordChange('')}
            className="text-zinc-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
            title="Clear search"
          >
            <IconX size={13} />
          </button>
        </div>
      )}

      {/* 3-Column Modern Library Layout */}
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
                  <span className="text-[#555] dark:text-[#c8d0b7]">Loan Quota</span>
                  <span className="font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                    {ongoingLoans.length} / {maxLoans}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#e5e3db] dark:bg-[#333d36] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ongoingLoans.length >= maxLoans
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

          {/* Reading Shelves Menu */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[#6f7f64] dark:text-[#a0b096] uppercase tracking-wider pb-1.5 border-b border-[#e5e3db] dark:border-[#384239]">
              Reading Shelves
            </h3>
            <nav className="space-y-0.5 pt-1 text-[13px]">
              {/* Shelf: All Books */}
              <button
                onClick={() => {
                  setSelectedShelf('all')
                  onKeywordChange('')
                  onGenreChange('')
                }}
                className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                  selectedShelf === 'all' && !selectedGenre && !keyword
                    ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                    : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                }`}
              >
                <IconBook size={15} className="shrink-0 text-[#6f7f64] dark:text-[#a0b096]" />
                <span>All Books</span>
                {totalElements > 0 && (
                  <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] -ml-0.5">
                    ({totalElements})
                  </span>
                )}
              </button>

              {user ? (
                <>
                  {/* Shelf: Currently Reading */}
                  <button
                    onClick={() => setSelectedShelf('loans')}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                      selectedShelf === 'loans'
                        ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                        : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                    }`}
                  >
                    <IconClock size={15} className="shrink-0 text-[#6f7f64] dark:text-[#a0b096]" />
                    <span>Currently Reading</span>
                    <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] -ml-0.5">
                      ({ongoingLoans.length})
                    </span>
                  </button>

                  {/* Shelf: Want to Read */}
                  <button
                    onClick={() => setSelectedShelf('reservations')}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                      selectedShelf === 'reservations'
                        ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                        : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                    }`}
                  >
                    <IconBookmark size={15} className="shrink-0 text-[#6f7f64] dark:text-[#a0b096]" />
                    <span>Want to Read</span>
                    <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] -ml-0.5">
                      ({reservations.length})
                    </span>
                  </button>

                  {/* Shelf: Read */}
                  <button
                    onClick={() => setSelectedShelf('read')}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                      selectedShelf === 'read'
                        ? 'font-semibold text-[#1e2320] dark:text-white bg-[#ece9e0] dark:bg-[#252c28]'
                        : 'text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60'
                    }`}
                  >
                    <IconCheck size={15} className="shrink-0 text-[#6f7f64] dark:text-[#a0b096]" />
                    <span>Read</span>
                    <span className="text-xs font-normal text-[#777] dark:text-[#a0b096] -ml-0.5">
                      ({readLoans.length})
                    </span>
                  </button>
                </>
              ) : null}
            </nav>
          </div>

          {/* Library Services Section */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[#6f7f64] dark:text-[#a0b096] uppercase tracking-wider pb-1.5 border-b border-[#e5e3db] dark:border-[#384239]">
              Library Services
            </h3>
            <nav className="space-y-0.5 pt-1 text-[13px]">
              {user && (
                <Link
                  to="/activity"
                  className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60 transition-colors"
                >
                  <IconActivity size={15} className="shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <span>Circulation & Activity</span>
                </Link>
              )}
              <Link
                to="/membership"
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-[#444] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white hover:bg-[#faf9f4] dark:hover:bg-[#252c28]/60 transition-colors"
              >
                <IconCrown size={15} className="shrink-0 text-amber-600/90 dark:text-amber-400" />
                <span>Membership Plans</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* === COLUMN 2: CENTER MAIN CONTENT (Dynamic Bookshelf) === */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Dynamic Header based on Selected Shelf */}
          <div className="pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedShelf === 'all'
                ? selectedGenreObj ? selectedGenreObj.name : 'Library Catalog'
                : selectedShelf === 'loans'
                ? `Currently Reading (${ongoingLoans.length})`
                : selectedShelf === 'reservations'
                ? `Want to Read (${reservations.length})`
                : `Read (${readLoans.length})`}
            </h1>
          </div>

          {/* Bookshelf Section */}
          <div className="space-y-3">
            {/* DYNAMIC SHELF 1: ALL BOOKS (CATALOG) */}
            {selectedShelf === 'all' && (
              <>
                {loading ? (
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="animate-pulse w-[86px] sm:w-[92px] shrink-0">
                        <div className="aspect-[2/3] w-full rounded-[3px] bg-zinc-200 dark:bg-zinc-800" />
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
                ) : (
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {books.map((book) => (
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
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('all')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
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
                      {ongoingLoans.map((loan) => (
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
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('all')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
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
                      {reservations.map((res) => (
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
                    <Button variant="outline" size="sm" onClick={() => setSelectedShelf('all')} className="mt-3 text-xs h-7 rounded-md cursor-pointer">
                      Explore Library Catalog
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
                      {readLoans.map((loan) => (
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
          </div>
        </main>

        {/* === COLUMN 3: RIGHT SIDEBAR (News & Announcements) === */}
        <aside className="w-full lg:w-64 shrink-0 lg:border-l lg:border-zinc-200 dark:lg:border-zinc-800 lg:pl-6 space-y-6">
          {/* News & Announcements Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-1.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
              <IconNews size={14} className="text-emerald-700 dark:text-emerald-400" />
              <span>News & Announcements</span>
            </h3>

            <div className="space-y-3 pt-0.5">
              {/* Article 1 */}
              <article className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Library News</span>
                  <span>•</span>
                  <span>Sep 16, 2026</span>
                </div>
                <h4 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                  Autumn Reading Season: Over 200 New Academic & Literary Titles Added
                </h4>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                  Explore fresh additions in computer architecture, clean design patterns, and award-winning fiction.
                </p>
              </article>

              {/* Article 2 */}
              <article className="space-y-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Events</span>
                  <span>•</span>
                  <span>Sep 20, 2026</span>
                </div>
                <h4 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                  Weekend Book Club: Crafting Resilient Software Architecture
                </h4>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                  Join our online discussion panel with senior engineers and book authors this Saturday at 2:00 PM.
                </p>
              </article>

              {/* Article 3 */}
              <article className="space-y-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Policy Update</span>
                  <span>•</span>
                  <span>Sep 12, 2026</span>
                </div>
                <h4 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                  Online Loan Renewals Now Available Directly from Member Portal
                </h4>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                  Eligible readers can now extend active loans online with a single click before the due date.
                </p>
              </article>
            </div>
          </div>

          {/* Reader Quote */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <IconQuote size={14} />
              <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Thought of the Day
              </span>
            </div>
            <p className="text-[12px] italic text-zinc-600 dark:text-zinc-400 leading-relaxed">
              "A reader lives a thousand lives before he dies. The man who never reads lives only one."
            </p>
            <p className="text-[11px] text-zinc-400 text-right font-medium">
              — George R.R. Martin
            </p>
          </div>
        </aside>

      </div>
    </div>
  )
}




