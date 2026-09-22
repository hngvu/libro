import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { BookPublicResponse, ReservationResponse, LoanPublicResponse } from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/button'
import {
  IconBook,
  IconCheck,
  IconClock,
  IconChevronDown,
  IconChevronUp,
  IconBookmark,
  IconSparkles,
} from '@tabler/icons-react'

interface BookDetailProps {
  initialBook?: BookPublicResponse | null
  onOpenAuth: (mode?: 'login' | 'register') => void
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

export function BookDetail({
  initialBook = null,
  onOpenAuth,
}: BookDetailProps) {
  const { handle } = useParams<{ handle: string; slug?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [book, setBook] = useState<BookPublicResponse | null>(initialBook)
  const [loadingBook, setLoadingBook] = useState(!initialBook && !!handle)

  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [bookDetailsExpanded, setBookDetailsExpanded] = useState(false)
  const [genresExpanded, setGenresExpanded] = useState(false)

  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [similarBooks, setSimilarBooks] = useState<BookPublicResponse[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [reserveDropdownOpen, setReserveDropdownOpen] = useState(false)

  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const [existingReservation, setExistingReservation] = useState<ReservationResponse | null>(null)
  const [existingLoan, setExistingLoan] = useState<LoanPublicResponse | null>(null)

  const [imgStage, setImgStage] = useState<number>(0)

  // Check active reservation or ongoing loan for this book
  useEffect(() => {
    if (book?.id && user && user.role === 'MEMBER') {
      api.getMyReservations({ size: 50 })
        .then((res) => {
          const myRes = (res.content || []).find(
            (r) =>
              (r.bookId === book.id || (book.handle && r.bookHandle === book.handle)) &&
              (r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP')
          )
          setExistingReservation(myRes || null)
        })
        .catch(() => setExistingReservation(null))

      api.getMyLoans({ status: 'ONGOING', size: 50 })
        .then((res) => {
          const myLoan = (res.content || []).find(
            (l) =>
              ((book.handle && l.bookHandle === book.handle) || (book.title && l.bookTitle === book.title)) &&
              l.status === 'ONGOING'
          )
          setExistingLoan(myLoan || null)
        })
        .catch(() => setExistingLoan(null))
    } else {
      setExistingReservation(null)
      setExistingLoan(null)
    }
  }, [book?.id, book?.handle, book?.title, user])

  // Check bookmark status on load & user change
  useEffect(() => {
    if (book?.id && user && user.role === 'MEMBER') {
      api.checkBookmarked(book.id)
        .then((res) => setIsBookmarked(res.bookmarked))
        .catch(() => setIsBookmarked(false))
    } else {
      setIsBookmarked(false)
    }
  }, [book?.id, user])

  // Sync bookmark state across app
  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent
      if (book?.id && custom.detail?.bookId === book.id) {
        setIsBookmarked(custom.detail.bookmarked)
      } else if (book?.id && user && user.role === 'MEMBER') {
        api.checkBookmarked(book.id)
          .then((res) => setIsBookmarked(res.bookmarked))
          .catch(() => {})
      }
    }
    window.addEventListener('libro:bookmarks-changed', handleSync)
    return () => window.removeEventListener('libro:bookmarks-changed', handleSync)
  }, [book?.id, user])

  // Fetch similar books
  useEffect(() => {
    if (book?.id) {
      setLoadingSimilar(true)
      api.getSimilarBooks(book.id, 6)
        .then((res) => setSimilarBooks(res || []))
        .catch(() => setSimilarBooks([]))
        .finally(() => setLoadingSimilar(false))
    } else {
      setSimilarBooks([])
    }
  }, [book?.id])

  const handleToggleBookmark = async () => {
    if (!user || user.role !== 'MEMBER') {
      onOpenAuth('login')
      return
    }
    if (!book?.id || bookmarkLoading) return
    setBookmarkLoading(true)
    try {
      const res = await api.toggleBookmark(book.id)
      setIsBookmarked(res.bookmarked)
      window.dispatchEvent(
        new CustomEvent('libro:bookmarks-changed', {
          detail: { bookId: book.id, bookmarked: res.bookmarked },
        })
      )
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleReserve = async () => {
    if (!user || user.role !== 'MEMBER') {
      onOpenAuth('login')
      return
    }
    if (!book || reserving) return
    setReserving(true)
    setReserveError(null)
    try {
      const res = await api.placeReservation({ bookId: book.id, bookHandle: book.handle })
      setExistingReservation(res)
      if (book.availableCopies > 0) {
        setBook((prev) => (prev ? { ...prev, availableCopies: Math.max(0, prev.availableCopies - 1) } : prev))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place reservation'
      setReserveError(msg)
    } finally {
      setReserving(false)
    }
  }

  useEffect(() => {
    if (handle) {
      setLoadingBook(true)
      api.getBookByHandle(handle)
        .then((res) => setBook(res))
        .catch(() => setBook(null))
        .finally(() => setLoadingBook(false))
    } else if (initialBook) {
      setBook(initialBook)
    }
  }, [handle, initialBook])

  const bookTitleWithAuthor = book?.title
    ? `${book.title}${book.authors && book.authors.length > 0 ? ` by ${book.authors.map((a) => a.name).join(', ')}` : ''}`
    : 'Book Details'
  useDocumentTitle(bookTitleWithAuthor)

  if (loadingBook) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="w-10 h-10 border-3 border-[#0288d1] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-serif text-[#666666]">Retrieving edition details from library...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <IconBook size={56} className="mx-auto text-[#0288d1]" />
        <h2 className="font-serif font-bold text-2xl text-[#181818]">Edition Not Found</h2>
        <p className="text-xs text-[#666666]">This record does not exist in the open catalog.</p>
        <Button onClick={() => navigate('/')} className="bg-[#0288d1] hover:bg-[#026aa7] text-white">Return to Catalog</Button>
      </div>
    )
  }

  const hash = (book.isbn || book.handle).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const pages = book.pageCount || (320 + (hash % 280))
  const bookFormat = book.format === 'EBOOK' ? 'E-Book' : book.format === 'HARDCOVER' ? 'Hardcover' : 'Paperback'
  const pubYear = book.publicationYear || 2024
  const publisherName = book.publisher?.name || 'Independent Archive'
  const bookLanguage = book.language || 'English'

  const authorsList = book.authors && book.authors.length > 0 ? book.authors : []
  const genresList = book.genres && book.genres.length > 0 ? book.genres : []

  const getCoverUrl = (): string | null => {
    if (imgStage === 0 && book.cover) {
      return book.cover
    }
    if (imgStage <= 1 && book.isbn) {
      const cleanIsbn = book.isbn.replace(/[^0-9X]/gi, '')
      const isbn10 = cleanIsbn.length === 13 ? convertIsbn13To10(cleanIsbn) : cleanIsbn
      if (isbn10 && isbn10.length === 10) {
        return `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_SX500_.jpg`
      }
    }
    if (imgStage <= 2 && book.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
    }
    return null
  }

  const coverUrl = getCoverUrl()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full animate-in fade-in duration-150">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ===== LEFT STICKY COLUMN (Book Cover & Actions) ===== */}
        <div className="md:col-span-4 lg:col-span-4 md:sticky md:top-6 flex flex-col items-stretch gap-3 w-full max-w-[280px] mx-auto md:max-w-none">
          {/* Cover with realistic shadow & archive framing */}
          <div className="relative w-full aspect-[2/3] rounded-sm bg-[#f7f5ee] shadow-[0_4px_16px_rgba(0,0,0,0.16)] border border-[#d6d2c4] overflow-hidden flex items-center justify-center shrink-0 before:absolute before:inset-y-0 before:left-0 before:w-[10px] before:bg-gradient-to-r before:from-black/25 before:to-transparent before:z-10">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="h-full w-full object-fill select-none"
                onError={() => setImgStage((prev) => prev + 1)}
              />
            ) : (
              <div className="p-4 text-center text-[#666] flex flex-col items-center justify-center">
                <IconBook size={44} className="mb-2 text-[#999]" />
                <span className="font-serif font-medium text-xs text-[#444] leading-tight">{book.title}</span>
              </div>
            )}
          </div>

          {/* Action Buttons (Scholarly Sage Theme) */}
          <div className="w-full flex flex-col gap-2.5">
            {/* Primary Action: Existing Loan / Existing Reservation / Reserve / Join Waitlist */}
            {existingLoan ? (
              <div className="w-full flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/activity')}
                  className="w-full h-[42px] rounded-md bg-[#2e5d4b] hover:bg-[#254b3d] text-white font-sans text-[13.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <IconBook size={16} />
                  <span>On Loan</span>
                </button>
              </div>
            ) : existingReservation ? (
              <div className="w-full flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/activity?tab=reservations')}
                  className="w-full h-[42px] rounded-md bg-[#2e7d56] hover:bg-[#256646] text-white font-sans text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <IconCheck size={17} />
                  <span>
                    {existingReservation.status === 'READY_FOR_PICKUP'
                      ? 'Ready to Pick Up'
                      : `Queued (#${existingReservation.queuePosition || 1})`}
                  </span>
                </button>
                <p className="text-[11px] text-center text-[#6f7f64]">
                  {existingReservation.status === 'READY_FOR_PICKUP'
                    ? `Hold code: ${existingReservation.reservationCode} • Pick up at counter`
                    : 'In waitlist • You will be notified when a copy is ready'}
                </p>
              </div>
            ) : book.availableCopies === 0 ? (
              <div className="w-full flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving}
                  className="w-full h-[42px] rounded-md bg-amber-600 hover:bg-amber-700 text-white font-sans text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  <IconClock size={16} /> {reserving ? 'Joining Waitlist...' : 'Join Waitlist'}
                </button>
                {reserveError && (
                  <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-1.5 animate-in fade-in">
                    <div>{reserveError}</div>
                    {(reserveError.toLowerCase().includes('limit') ||
                      reserveError.toLowerCase().includes('membership') ||
                      reserveError.toLowerCase().includes('plan')) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/membership')}
                        className="text-xs h-6 px-2 w-fit text-rose-800 border-rose-300 hover:bg-rose-100 cursor-pointer"
                      >
                        Upgrade Membership Plan →
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col gap-1.5">
                <div className="relative w-full">
                  <div className="flex h-[42px] rounded-md bg-[#3d4b3e] hover:bg-[#2e3a2f] text-white shadow-xs transition-colors overflow-hidden font-sans">
                    <button
                      type="button"
                      disabled={reserving}
                      onClick={handleReserve}
                      className="flex-1 px-4 text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-60"
                    >
                      {reserving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Reserving Hold...</span>
                        </>
                      ) : (
                        <span>Reserve for Pickup</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReserveDropdownOpen(!reserveDropdownOpen)}
                      className="px-3 border-l border-white/20 hover:bg-black/15 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <IconChevronDown size={14} />
                    </button>
                  </div>
                  {reserveDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReserveDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 rounded-md border border-[#c8d0b7] bg-white shadow-lg py-1 z-50 text-[13px]">
                        <button
                          onClick={() => {
                            setReserveDropdownOpen(false)
                            if (!user || user.role !== 'MEMBER') {
                              onOpenAuth('login')
                              return
                            }
                            navigate('/activity?tab=reservations')
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-[#f0f4f1] text-[#3d4b3e] font-medium"
                        >
                          My Reservations
                        </button>
                        <button
                          onClick={() => {
                            setReserveDropdownOpen(false)
                            if (!user || user.role !== 'MEMBER') {
                              onOpenAuth('login')
                              return
                            }
                            navigate('/activity')
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-[#f0f4f1] text-[#3d4b3e] font-medium"
                        >
                          My Loans
                        </button>
                        <button
                          onClick={() => {
                            setReserveDropdownOpen(false)
                            window.open(`https://www.amazon.com/s?k=${encodeURIComponent(book.title)}`, '_blank')
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-[#fafafa] text-[#666]"
                        >
                          Search on Amazon
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {reserveError && (
                  <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-1.5 animate-in fade-in">
                    <div>{reserveError}</div>
                    {(reserveError.toLowerCase().includes('limit') ||
                      reserveError.toLowerCase().includes('membership') ||
                      reserveError.toLowerCase().includes('plan')) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/membership')}
                        className="text-xs h-6 px-2 w-fit text-rose-800 border-rose-300 hover:bg-rose-100 cursor-pointer"
                      >
                        Upgrade Membership Plan →
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Live Bookmark button */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              className={`w-full h-[40px] rounded-md border font-sans text-[13.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-2xs ${
                isBookmarked
                  ? 'border-[#2e7d56] bg-[#2e7d56]/12 dark:bg-[#2e7d56]/25 text-[#2e7d56] dark:text-[#66bb6a] hover:bg-[#2e7d56]/20'
                  : 'border-[#3d4b3e]/60 dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] hover:bg-[#f0f4f1] dark:hover:bg-[#333d36] text-[#3d4b3e] dark:text-[#c8d0b7]'
              } disabled:opacity-50`}
            >
              {bookmarkLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconBookmark
                  size={17}
                  className={isBookmarked ? 'fill-current text-[#2e7d56] dark:text-[#66bb6a]' : ''}
                />
              )}
              <span>{isBookmarked ? 'Bookmarked 🔖' : 'Bookmark'}</span>
            </button>
          </div>
        </div>

        {/* ===== RIGHT MAIN COLUMN ===== */}
        <div className="md:col-span-8 lg:col-span-8 w-full">
          {/* Title - Exact Goodreads Merriweather 700 Bold typography */}
          <h1 className="font-['Merriweather',serif] font-bold text-[32px] sm:text-[36px] md:text-[40px] text-[#181818] dark:text-[#f5f3e6] leading-[1.18] tracking-normal mb-1.5">
            {book.title}
          </h1>

          {/* Author line - Exact Goodreads Merriweather 400 Serif style with author badge */}
          <div className="font-['Merriweather',serif] text-[18px] sm:text-[20px] font-normal text-[#181818] dark:text-[#f5f3e6] mb-5 flex items-center gap-1.5 flex-wrap">
            {authorsList.length > 0 ? (
              authorsList.map((a, idx) => (
                <span key={a.handle || idx} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      a.handle
                        ? navigate(`/author/${a.handle}`)
                        : navigate(`/?keyword=${encodeURIComponent(a.name)}`)
                    }
                    className="font-['Merriweather',serif] font-normal text-[#181818] dark:text-[#f5f3e6] hover:underline hover:text-[#00635d] dark:hover:text-[#4db6ac] transition-colors cursor-pointer"
                  >
                    {a.name}
                  </button>
                  {idx < authorsList.length - 1 && <span className="text-[#767676]">,</span>}
                </span>
              ))
            ) : (
              <span className="text-[#767676] font-normal italic">Unknown Author</span>
            )}
          </div>

          {/* Description - High readability sans-serif matching reference images */}
          <div className="mb-6 text-[15px] sm:text-[16px] leading-[1.65] text-[#222222] font-sans space-y-3.5">
            <div className={`whitespace-pre-line ${descriptionExpanded ? '' : 'line-clamp-6'}`}>
              {book.description || `Never one to resist an adventure, explore the journey of ${book.title}, an authentic work cataloged in the open library archive.`}
            </div>
            {book.description && book.description.length > 300 && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className="text-[14px] font-medium text-[#2e7d56] hover:underline cursor-pointer inline-block pt-1"
              >
                {descriptionExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Genres row */}
          {genresList.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-[14px] font-sans">
              <span className="text-[#767676] mr-0.5">Genres</span>
              {(genresExpanded ? genresList : genresList.slice(0, 5)).map((g) => (
                <button
                  key={g.handle || g.name}
                  type="button"
                  onClick={() =>
                    g.handle
                      ? navigate(`/genre/${g.handle}`)
                      : navigate(`/?genre=${encodeURIComponent(g.name)}`)
                  }
                  className="text-[#181818] font-medium underline underline-offset-4 decoration-[#2e7d56] decoration-[1.5px] hover:text-[#2e7d56] transition-colors cursor-pointer"
                >
                  {g.name}
                </button>
              ))}
              {genresList.length > 5 && (
                <button
                  type="button"
                  onClick={() => setGenresExpanded(!genresExpanded)}
                  className="text-[#181818] font-medium underline underline-offset-4 decoration-[#2e7d56] decoration-[1.5px] hover:text-[#2e7d56] transition-colors cursor-pointer"
                >
                  {genresExpanded ? '...less' : '...more'}
                </button>
              )}
            </div>
          )}

          {/* Metadata: Pages, format, first published */}
          <div className="text-[14px] text-[#333333] mb-4 leading-relaxed font-sans">
            <p className="text-[#181818]">{pages} pages, {bookFormat}</p>
            <p className="text-[#595959]">First published {pubYear ? pubYear : '2007'}{publisherName ? ` by ${publisherName}` : ''}</p>
          </div>

          {/* Book details & editions accordion */}
          <div className="mb-6 font-sans">
            <button
              type="button"
              onClick={() => setBookDetailsExpanded(!bookDetailsExpanded)}
              className="flex items-center gap-1.5 text-[14px] font-medium text-[#181818] hover:text-[#2e7d56] transition-colors cursor-pointer py-1"
            >
              <span>Book details & editions</span>
              {bookDetailsExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </button>

            {bookDetailsExpanded && (
              <div className="mt-4 pt-4 border-t border-[#e8e8e8] dark:border-[#38423a] space-y-4 animate-in fade-in duration-150 font-sans">
                <h3 className="font-serif font-bold text-[18px] text-[#181818] dark:text-[#f5f3e6]">
                  This edition
                </h3>
                <div className="space-y-2.5 text-[14px]">
                  <div className="flex items-baseline">
                    <span className="w-32 sm:w-36 shrink-0 text-[#767676] dark:text-[#999999]">Format</span>
                    <span className="text-[#181818] dark:text-[#f5f3e6]">{pages} pages, {book.edition || bookFormat}</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="w-32 sm:w-36 shrink-0 text-[#767676] dark:text-[#999999]">Published</span>
                    <span className="text-[#181818] dark:text-[#f5f3e6]">
                      {pubYear ? `${pubYear}` : '2007'}{publisherName ? ` by ${publisherName}` : ''}
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="w-32 sm:w-36 shrink-0 text-[#767676] dark:text-[#999999]">ISBN</span>
                    <span className="text-[#181818] dark:text-[#f5f3e6] font-mono text-[13.5px]">{book.isbn || 'N/A'}</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="w-32 sm:w-36 shrink-0 text-[#767676] dark:text-[#999999]">Language</span>
                    <span className="text-[#181818] dark:text-[#f5f3e6]">{bookLanguage}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== READERS ALSO ENJOYED / BOOKS YOU MIGHT LIKE ===== */}
      {(similarBooks.length > 0 || loadingSimilar) && (
        <section className="mt-14 pt-8 border-t border-[#d6d2c4]/70 dark:border-[#3d4b3e]">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2e7d56] dark:text-[#66bb6a] mb-1">
                <IconSparkles size={14} />
                <span>Readers Also Enjoyed</span>
              </div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#181818] dark:text-[#f5f3e6] tracking-tight">
                Books You Might Like
              </h2>
              <p className="text-xs text-[#6f7f64] dark:text-[#a0b096] mt-0.5">
                Curated recommendations based on this edition's genre, themes, and authors
              </p>
            </div>
          </div>

          {loadingSimilar ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[2/3] bg-stone-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-3 w-3/4 bg-stone-200 dark:bg-zinc-800 rounded-sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {similarBooks.map((simBook) => {
                const authorsText =
                  simBook.authors && simBook.authors.length > 0
                    ? simBook.authors.map((a) => a.name).join(', ')
                    : 'Unknown Author'

                return (
                  <div
                    key={simBook.id || simBook.handle}
                    onClick={() => {
                      navigate(`/book/${simBook.handle}/${simBook.slug || simBook.handle}`)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="group flex flex-col cursor-pointer transition-all duration-200"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-r-[6px] rounded-l-[1px] bg-[#f0ede6] dark:bg-[#252c28] shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-[#d6d2c4]/60 dark:border-[#3d4b3e] overflow-hidden flex items-center justify-center group-hover:scale-105 group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition-all duration-200">
                      {simBook.cover ? (
                        <img
                          src={simBook.cover}
                          alt={simBook.title}
                          className="h-full w-full object-fill select-none"
                        />
                      ) : (
                        <div className="p-2 text-center text-[#888]">
                          <IconBook size={24} className="mx-auto text-[#aaa] mb-1 opacity-60" />
                          <span className="text-[10px] font-serif line-clamp-2">{simBook.title}</span>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/25 to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 left-[2px] w-[0.5px] bg-white/20" />
                    </div>

                    <div className="mt-2.5">
                      <h3 className="font-serif font-bold text-xs sm:text-[13px] leading-snug text-[#181818] dark:text-[#f5f3e6] line-clamp-2 group-hover:text-[#2e7d56] dark:group-hover:text-[#66bb6a] transition-colors">
                        {simBook.title}
                      </h3>
                      <p className="text-[11px] text-[#6f7f64] dark:text-[#a0b096] truncate mt-0.5">
                        {authorsText}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-[#2e7d56] dark:text-[#66bb6a]">
                        {simBook.availableCopies > 0 ? 'Available now' : 'Waitlist open'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
