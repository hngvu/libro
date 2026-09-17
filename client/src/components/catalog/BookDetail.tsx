import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { BookPublicResponse } from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  IconBook,
  IconCheck,
  IconClock,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'

interface BookDetailProps {
  initialBook?: BookPublicResponse | null
  onOpenAuth: (mode?: 'login' | 'register') => void
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

  const [shelfStatus, setShelfStatus] = useState<'want_to_read' | 'currently_reading' | 'read' | null>(null)
  const [shelfDropdownOpen, setShelfDropdownOpen] = useState(false)
  const [borrowDropdownOpen, setBorrowDropdownOpen] = useState(false)

  const [reserving, setReserving] = useState(false)
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const handleReserve = async () => {
    if (!user || user.role !== 'MEMBER') {
      onOpenAuth('login')
      return
    }
    if (!book) return
    setReserving(true)
    setReserveSuccess(null)
    setReserveError(null)
    try {
      const res = await api.placeReservation({ bookId: book.id, bookHandle: book.handle })
      setReserveSuccess(`Book hold placed! Code: ${res.reservationCode} (Queue #${res.queuePosition || 1})`)
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

  // Set document title to "book title | Libro"
  useEffect(() => {
    if (book?.title) {
      document.title = `${book.title} | Libro`
    } else {
      document.title = 'Libro | Discover Books & Library Catalog'
    }
    return () => {
      document.title = 'Libro | Discover Books & Library Catalog'
    }
  }, [book?.title])

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

  return (
    <div className="w-full animate-in fade-in duration-150">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ===== LEFT STICKY COLUMN (Book Cover & Actions) ===== */}
        <div className="md:col-span-4 lg:col-span-4 md:sticky md:top-6 flex flex-col items-stretch gap-3 w-full max-w-[280px] mx-auto md:max-w-none">
          {/* Cover with realistic shadow & archive framing */}
          <div className="relative w-full aspect-[2/3] rounded-sm bg-[#f7f5ee] shadow-[0_4px_16px_rgba(0,0,0,0.16)] border border-[#d6d2c4] overflow-hidden flex items-center justify-center shrink-0 before:absolute before:inset-y-0 before:left-0 before:w-[10px] before:bg-gradient-to-r before:from-black/25 before:to-transparent before:z-10">
            {book.cover ? (
              <img src={book.cover} alt={book.title} className="h-full w-full object-fill select-none" />
            ) : (
              <div className="p-4 text-center text-[#666] flex flex-col items-center justify-center">
                <IconBook size={44} className="mb-2 text-[#999]" />
                <span className="font-serif font-medium text-xs text-[#444] leading-tight">{book.title}</span>
              </div>
            )}
          </div>

          {/* Action Buttons (Scholarly Sage Theme) */}
          <div className="w-full flex flex-col gap-2.5">
            {/* Primary Borrow or Reserve button */}
            {book.availableCopies === 0 ? (
              <div className="w-full flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving}
                  className="w-full h-[42px] rounded-md bg-amber-600 hover:bg-amber-700 text-white font-sans text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  <IconClock size={16} /> {reserving ? 'Placing Hold...' : 'Reserve (Out of Stock)'}
                </button>
                {reserveSuccess && (
                  <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                    <IconCheck size={14} className="shrink-0" /> {reserveSuccess}
                  </div>
                )}
                {reserveError && (
                  <div className="p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {reserveError}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex h-[42px] rounded-md bg-[#3d4b3e] hover:bg-[#2e3a2f] text-white shadow-xs transition-colors overflow-hidden font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user || user.role !== 'MEMBER') {
                        onOpenAuth('login')
                        return
                      }
                      navigate('/activity')
                    }}
                    className="flex-1 px-4 text-[14px] font-semibold flex items-center justify-center cursor-pointer select-none"
                  >
                    Borrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDropdownOpen(!borrowDropdownOpen)}
                    className="px-3 border-l border-white/20 hover:bg-black/15 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <IconChevronDown size={14} />
                  </button>
                </div>
                {borrowDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBorrowDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 rounded-md border border-[#c8d0b7] bg-white shadow-lg py-1 z-50 text-[13px]">
                      <button
                        onClick={() => {
                          setBorrowDropdownOpen(false)
                          if (!user || user.role !== 'MEMBER') {
                            onOpenAuth('login')
                            return
                          }
                          navigate('/activity')
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#f0f4f1] text-[#3d4b3e] font-medium"
                      >
                        My Activity
                      </button>
                      <button onClick={() => { setBorrowDropdownOpen(false); window.open(`https://www.amazon.com/s?k=${encodeURIComponent(book.title)}`, '_blank') }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#fafafa] text-[#666]">
                        Search on Amazon
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Want to Read button */}
            <div className="relative w-full">
              <div className="flex h-[38px] rounded-md border border-[#3d4b3e]/60 bg-white hover:bg-[#f0f4f1] text-[#3d4b3e] transition-colors overflow-hidden font-sans">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { onOpenAuth('login'); return }
                    setShelfStatus(shelfStatus === 'want_to_read' ? null : 'want_to_read')
                  }}
                  className="flex-1 px-3 text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none"
                >
                  {shelfStatus === 'want_to_read' ? <><IconCheck size={14} /> In Reading Log</>
                    : shelfStatus === 'currently_reading' ? <><IconClock size={14} /> Currently Reading</>
                    : shelfStatus === 'read' ? <><IconCheck size={14} /> Already Read</>
                    : 'Want to Read'}
                </button>
                <button
                  type="button"
                  onClick={() => setShelfDropdownOpen(!shelfDropdownOpen)}
                  className="px-2.5 border-l border-[#3d4b3e]/25 hover:bg-[#3d4b3e]/10 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <IconChevronDown size={13} />
                </button>
              </div>
              {shelfDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShelfDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 rounded-md border border-[#c8d0b7] bg-white shadow-lg py-1 z-50 text-[13px]">
                    {(['want_to_read', 'currently_reading', 'read'] as const).map((s) => (
                      <button key={s} onClick={() => { setShelfStatus(s); setShelfDropdownOpen(false) }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-[#f0f4f1] ${shelfStatus === s ? 'font-semibold text-[#3d4b3e] bg-[#f0f4f1]/60' : 'text-[#333]'}`}>
                        <span>{s === 'want_to_read' ? 'Want to Read' : s === 'currently_reading' ? 'Currently Reading' : 'Already Read'}</span>
                        {shelfStatus === s && <IconCheck size={14} className="text-[#3d4b3e]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT MAIN COLUMN ===== */}
        <div className="md:col-span-8 lg:col-span-8 w-full">
          {/* Title - Bold Serif matching reference samples */}
          <h1 className="font-serif font-bold text-[34px] sm:text-[38px] md:text-[40px] text-[#181818] leading-[1.12] tracking-tight mb-2">
            {book.title}
          </h1>

          {/* Author line - Goodreads thin serif style */}
          <div className="font-serif text-[16px] sm:text-[17px] text-[#333333] dark:text-[#c8d0b7] mb-5 flex items-center gap-1.5 flex-wrap">
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
                    className="font-light text-[#181818] dark:text-[#f5f3e6] hover:underline hover:text-[#00635d] dark:hover:text-[#4db6ac] transition-colors cursor-pointer"
                  >
                    {a.name}
                  </button>
                  {idx < authorsList.length - 1 && <span className="text-[#767676]">,</span>}
                </span>
              ))
            ) : (
              <span className="text-[#767676] font-light italic">Unknown Author</span>
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
    </div>
  )
}
