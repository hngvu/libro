import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { api } from '@/services/api'
import type {
  LoanPublicResponse,
  BookPublicResponse,
  GenrePublicResponse,
} from '@/types/api'
import {
  IconBook,
  IconChevronRight,
  IconSparkles,
  IconArrowRight,
  IconFlame,
  IconBookmark,
  IconCompass,
  IconStar,
  IconQuote,
  IconArrowUpRight,
} from '@tabler/icons-react'

const LITERARY_QUOTES = [
  {
    quote: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.',
    author: 'George R.R. Martin',
  },
  {
    quote: 'There is no friend as loyal as a book.',
    author: 'Ernest Hemingway',
  },
  {
    quote: 'Books are a uniquely portable magic.',
    author: 'Stephen King',
  },
  {
    quote: 'I have always imagined that Paradise will be a kind of a library.',
    author: 'Jorge Luis Borges',
  },
]

interface MemberHomePageProps {
  onSelectBook: (book: BookPublicResponse) => void
  onBrowseCatalog: () => void
}

export function MemberHomePage({
  onSelectBook,
  onBrowseCatalog,
}: MemberHomePageProps) {
  useDocumentTitle('Reading Lounge')
  const navigate = useNavigate()
  const { user } = useAuth()

  // State
  const [loading, setLoading] = useState(true)
  const [activeLoans, setActiveLoans] = useState<LoanPublicResponse[]>([])
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'MEMBER') return
    setLoading(true)
    try {
      const [loansRes, booksRes, genresRes] = await Promise.all([
        api.getMyLoans({ size: 20 }).catch(() => ({ content: [] })),
        api.getBooks({ page: 1, size: 30 }).catch(() => ({ content: [] })),
        api.getGenres().catch(() => ({ content: [] })),
      ])

      const allLoans: LoanPublicResponse[] = loansRes.content || []
      const active = allLoans.filter((l) => l.status !== 'RETURNED')
      setActiveLoans(active)

      setBooks(booksRes.content || [])
      setGenres(genresRes.content || [])
    } catch (err) {
      console.error('Failed to load member dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Split books into curated editorial sections
  const currentRead = activeLoans.length > 0 ? activeLoans[0] : null
  const heroBook = books.length > 0 ? books[0] : null
  const trendingBooks = books.slice(1, 6)
  const recommendedForYou = books.slice(6, 12)
  const quickPicks = books.slice(12, 18)

  const randomQuote = LITERARY_QUOTES[Math.floor(Math.random() * LITERARY_QUOTES.length)]

  if (loading) {
    return (
      <div className="space-y-12 pb-16 animate-pulse">
        <div className="h-12 w-64 bg-stone-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-80 w-full bg-stone-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[2/3] bg-stone-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 animate-in fade-in duration-500">
      {/* ================= 1. EDITORIAL GREETING & JUMP BACK IN ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-stone-200/70 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-emerald-700 dark:text-emerald-400 mb-1.5">
            <IconCompass size={15} />
            <span>Curated Reading Lounge</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-4xl text-stone-900 dark:text-stone-100 tracking-tight">
            Discover Your Next Read
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
            Welcome back, {user?.fullName || user?.email?.split('@')[0] || 'Reader'}. Explore handcrafted recommendations, library trends, and literary picks.
          </p>
        </div>

        {/* "Jump Back In" Minimalist Reader Widget */}
        {currentRead && (
          <div
            onClick={() => navigate(`/book/${currentRead.bookHandle}`)}
            className="group flex items-center gap-3.5 p-3 sm:px-4 sm:py-3 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 cursor-pointer shrink-0 max-w-md"
            title="Resume your current read"
          >
            {/* 3D Mini Book Cover */}
            <div className="relative w-11 aspect-[2/3] shrink-0 rounded-r-[4px] rounded-l-[1px] bg-stone-200 dark:bg-zinc-800 shadow-[0_3px_8px_rgba(0,0,0,0.15)] overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
              {currentRead.bookCover ? (
                <img
                  src={currentRead.bookCover}
                  alt={currentRead.bookTitle}
                  className="h-full w-full object-cover select-none"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <IconBook size={14} className="text-stone-400" />
              )}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-r from-black/25 to-transparent" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Jump Back In
                </span>
              </div>
              <p className="font-serif font-bold text-xs sm:text-[13px] text-stone-900 dark:text-stone-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {currentRead.bookTitle}
              </p>
              <p className="text-[10.5px] text-stone-400 truncate">
                {currentRead.authors && currentRead.authors.length > 0
                  ? currentRead.authors.join(', ')
                  : 'Currently reading'}
              </p>
            </div>

            <div className="pl-1">
              <span className="w-7 h-7 rounded-full bg-stone-200/60 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-stone-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <IconArrowRight size={13} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. HERO EDITORIAL SPOTLIGHT (Staff Pick of the Week) ================= */}
      {heroBook && (
        <section
          onClick={() => onSelectBook(heroBook)}
          className="relative rounded-3xl bg-[#1c221e] dark:bg-[#121614] text-white p-7 sm:p-10 lg:p-12 shadow-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-emerald-950/20"
        >
          {/* Subtle Ambient Lighting Effects */}
          <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center lg:items-stretch justify-between gap-8 lg:gap-14">
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between text-center lg:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold tracking-wider uppercase mb-4">
                  <IconStar size={14} className="fill-emerald-300 text-emerald-300" />
                  <span>Librarian's Choice · Book of the Week</span>
                </div>

                <h2 className="font-serif font-bold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15] group-hover:text-emerald-200 transition-colors">
                  {heroBook.title}
                </h2>

                <p className="text-sm sm:text-base text-stone-300 mt-2 font-light">
                  by{' '}
                  <span className="font-medium text-white">
                    {heroBook.authors && heroBook.authors.length > 0
                      ? heroBook.authors.map((a) => a.name).join(', ')
                      : 'Featured Author'}
                  </span>
                </p>

                {heroBook.description && (
                  <p className="text-xs sm:text-sm text-stone-300/90 mt-4 line-clamp-3 leading-relaxed max-w-2xl font-sans">
                    {heroBook.description.replace(/<[^>]*>?/gm, '')}
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectBook(heroBook)
                  }}
                  className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-emerald-500/30 cursor-pointer active:scale-95"
                >
                  <span>Borrow This Book</span>
                  <IconArrowRight size={16} />
                </button>

                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 font-medium uppercase text-[10px]">
                    {heroBook.format || 'Standard'}
                  </span>
                  <span className="text-emerald-300 font-medium">
                    {heroBook.availableCopies > 0
                      ? `${heroBook.availableCopies} copies available`
                      : 'Waitlist open'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Immersive 3D Floating Book Cover */}
            <div className="shrink-0 flex items-center justify-center py-2">
              <div className="relative w-44 sm:w-56 lg:w-64 aspect-[2/3] rounded-r-[10px] rounded-l-[2px] bg-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden group-hover:-translate-y-2 group-hover:shadow-[0_28px_60px_rgba(0,0,0,0.7)] transition-all duration-300 flex items-center justify-center">
                {heroBook.cover ? (
                  <img
                    src={heroBook.cover}
                    alt={heroBook.title}
                    className="h-full w-full object-fill select-none"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="p-4 text-center">
                    <IconBook size={40} className="mx-auto text-stone-500 mb-2" />
                    <span className="text-xs font-serif font-bold uppercase tracking-wider block">
                      {heroBook.title}
                    </span>
                  </div>
                )}
                {/* 3D Spine Crease Overlay */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-[6px] bg-gradient-to-r from-black/40 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-[4px] w-[1px] bg-white/30" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= 3. TRENDING IN THE LIBRARY (Leaderboard / Ranks) ================= */}
      {trendingBooks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between pb-3 border-b border-stone-200/70 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <IconFlame size={16} />
                <span>Popular Reads</span>
              </div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                Trending in the Library
              </h2>
            </div>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all trending</span>
              <IconChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {trendingBooks.map((book, idx) => {
              const authorsText =
                book.authors && book.authors.length > 0
                  ? book.authors.map((a) => a.name).join(', ')
                  : 'Unknown Author'

              return (
                <div
                  key={book.id || book.handle}
                  onClick={() => onSelectBook(book)}
                  className="group flex flex-col cursor-pointer transition-all duration-300"
                >
                  <div className="relative w-full aspect-[2/3] rounded-r-[8px] rounded-l-[2px] bg-stone-100 dark:bg-zinc-800 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.15)] overflow-hidden flex items-center justify-center group-hover:-translate-y-2 group-hover:shadow-[0_16px_30px_-6px_rgba(0,0,0,0.25)] transition-all duration-300">
                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/75 backdrop-blur-md text-white font-serif font-bold text-xs flex items-center justify-center shadow-md">
                      0{idx + 1}
                    </div>

                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="h-full w-full object-fill select-none"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="p-3 text-center text-stone-400">
                        <IconBook size={24} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] font-serif font-bold uppercase tracking-wider block line-clamp-2">
                          {book.title}
                        </span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/30 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 left-[3px] w-[1px] bg-white/20" />
                  </div>

                  <div className="mt-3 text-left">
                    <h3 className="font-serif font-bold text-xs sm:text-[13.5px] leading-snug text-stone-900 dark:text-stone-100 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {authorsText}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {book.availableCopies > 0 ? 'Available now' : 'Reserved'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ================= 4. CURATED COLLECTIONS (Literal.club-style Cards) ================= */}
      {recommendedForYou.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between pb-3 border-b border-stone-200/70 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <IconSparkles size={16} />
                <span>Handpicked Selection</span>
              </div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                Recommended For You
              </h2>
            </div>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Browse all</span>
              <IconChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedForYou.map((book) => {
              const authorsText =
                book.authors && book.authors.length > 0
                  ? book.authors.map((a) => a.name).join(', ')
                  : 'Unknown Author'

              return (
                <div
                  key={book.id || book.handle}
                  onClick={() => onSelectBook(book)}
                  className="group flex flex-col justify-between p-5 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div>
                    {/* Floating Book Cover with Soft Background Glow */}
                    <div className="relative w-full aspect-[16/10] rounded-2xl bg-stone-50 dark:bg-zinc-900 flex items-center justify-center p-4 mb-4 overflow-hidden">
                      <div className="relative h-full aspect-[2/3] rounded-r-[6px] rounded-l-[1px] bg-stone-200 dark:bg-zinc-800 shadow-[0_10px_24px_rgba(0,0,0,0.18)] overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        {book.cover ? (
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="h-full w-full object-fill select-none"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <IconBook size={24} className="text-stone-400 opacity-50" />
                        )}
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/30 to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 left-[2px] w-[1px] bg-white/20" />
                      </div>

                      {/* Format Badge */}
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 dark:bg-zinc-800/90 text-stone-700 dark:text-stone-300 shadow-xs uppercase">
                        {book.format || 'Book'}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-1">
                      {authorsText}
                    </p>

                    {book.description && (
                      <p className="text-xs text-stone-600 dark:text-stone-300/80 line-clamp-2 mt-2 leading-relaxed">
                        {book.description.replace(/<[^>]*>?/gm, '')}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline inline-flex items-center gap-1">
                      <span>View & Borrow</span>
                      <IconArrowUpRight size={14} />
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Waitlist'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ================= 5. QUICK PICKS (Short & Inspiring Reads) ================= */}
      {quickPicks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between pb-3 border-b border-stone-200/70 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <IconBookmark size={16} />
                <span>Library Highlights</span>
              </div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                New Additions to the Stacks
              </h2>
            </div>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Explore stacks</span>
              <IconChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickPicks.map((book) => (
              <div
                key={book.id || book.handle}
                onClick={() => onSelectBook(book)}
                className="group flex flex-col cursor-pointer transition-all duration-200"
              >
                <div className="relative aspect-[2/3] w-full rounded-r-[6px] rounded-l-[1px] bg-stone-100 dark:bg-zinc-800 shadow-[0_6px_16px_rgba(0,0,0,0.12)] overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-full w-full object-fill select-none"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="p-2 text-center text-stone-400">
                      <IconBook size={20} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-serif font-bold line-clamp-2 uppercase">
                        {book.title}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/25 to-transparent" />
                </div>

                <div className="mt-2 text-left">
                  <h4 className="font-serif font-bold text-xs sm:text-[13px] leading-snug text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {book.authors && book.authors.length > 0
                      ? book.authors.map((a) => a.name).join(', ')
                      : 'Author'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= 6. BROWSE BY MOOD & THEME (Curated Genres) ================= */}
      {genres.length > 0 && (
        <section className="rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-900/40 p-7 sm:p-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                Explore by Theme & Genre
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Browse our curated catalogue across all literary domains.
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-left"
            >
              Browse complete index →
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {genres.slice(0, 16).map((genre) => (
              <button
                key={genre.handle}
                type="button"
                onClick={() => navigate(`/?genre=${encodeURIComponent(genre.handle)}`)}
                className="px-4 py-2 rounded-full text-xs font-medium border border-stone-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-stone-300 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 hover:border-stone-900 dark:hover:border-white transition-all cursor-pointer shadow-2xs"
              >
                {genre.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ================= 7. LITERARY QUOTE OF THE DAY ================= */}
      <div className="py-8 px-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-center max-w-3xl mx-auto space-y-2">
        <IconQuote size={24} className="mx-auto text-emerald-600/40" />
        <p className="font-serif italic text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed">
          "{randomQuote.quote}"
        </p>
        <span className="block text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
          — {randomQuote.author}
        </span>
      </div>
    </div>
  )
}
