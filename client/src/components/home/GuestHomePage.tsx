import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import type { BookPublicResponse } from '@/types/api'
import {
  IconSearch,
  IconArrowRight,
  IconBook,
  IconBooks,
  IconBookDownload,
  IconBookmark,
} from '@tabler/icons-react'

const POPULAR_GENRES = [
  'Art',
  'Biography',
  'Business',
  "Children's",
  'Classics',
  'Comics',
  'Contemporary',
  'Cookbooks',
  'Crime',
  'Essays',
  'Fantasy',
  'Fiction',
  'Graphic Novels',
  'Historical Fiction',
  'History',
  'Horror',
  'Literature',
  'Memoir',
  'Music',
  'Mystery',
  'Nonfiction',
  'Philosophy',
  'Poetry',
  'Psychology',
  'Romance',
  'Science',
  'Science Fiction',
  'Self Help',
  'Short Stories',
  'Suspense',
  'Thriller',
  'Travel',
  'Young Adult',
]

interface MockCollection {
  id: string
  name: string
  description: string
  books: BookPublicResponse[]
}

const MOCK_COLLECTIONS: MockCollection[] = [
  {
    id: 'timeless-classics',
    name: 'Timeless Literary Classics',
    description: 'Essential world masterpieces and enduring stories',
    books: [
      {
        id: 101,
        title: 'The Great Gatsby',
        handle: 'the-great-gatsby',
        slug: 'the-great-gatsby',
        isbn: '9780743273565',
        publicationYear: 1925,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1738790966i/4671.jpg',
        edition: 'First Edition',
        format: 'HARDCOVER',
        pageCount: 180,
        language: 'English',
        description: null,
        totalCopies: 5,
        availableCopies: 3,
        authors: [{ name: 'F. Scott Fitzgerald', handle: 'f-scott-fitzgerald', biography: null }],
        genres: [{ name: 'Classics', handle: 'classics', description: null }],
      },
      {
        id: 102,
        title: '1984',
        handle: '1984',
        slug: '1984',
        isbn: '9780451524935',
        publicationYear: 1949,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
        edition: 'Signet Classic',
        format: 'PAPERBACK',
        pageCount: 328,
        language: 'English',
        description: null,
        totalCopies: 4,
        availableCopies: 2,
        authors: [{ name: 'George Orwell', handle: 'george-orwell', biography: null }],
        genres: [{ name: 'Fiction', handle: 'fiction', description: null }],
      },
      {
        id: 103,
        title: 'To Kill a Mockingbird',
        handle: 'to-kill-a-mockingbird',
        slug: 'to-kill-a-mockingbird',
        isbn: '9780061120084',
        publicationYear: 1960,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
        edition: '50th Anniversary Edition',
        format: 'PAPERBACK',
        pageCount: 281,
        language: 'English',
        description: null,
        totalCopies: 6,
        availableCopies: 4,
        authors: [{ name: 'Harper Lee', handle: 'harper-lee', biography: null }],
        genres: [{ name: 'Classics', handle: 'classics', description: null }],
      },
      {
        id: 106,
        title: 'The Catcher in the Rye',
        handle: 'the-catcher-in-the-rye',
        slug: 'the-catcher-in-the-rye',
        isbn: '9780316769488',
        publicationYear: 1951,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1398034300i/5107.jpg',
        edition: 'Little, Brown',
        format: 'PAPERBACK',
        pageCount: 234,
        language: 'English',
        description: null,
        totalCopies: 4,
        availableCopies: 1,
        authors: [{ name: 'J.D. Salinger', handle: 'j-d-salinger', biography: null }],
        genres: [{ name: 'Classics', handle: 'classics', description: null }],
      },
    ],
  },
  {
    id: 'mind-and-adventure',
    name: 'Mind & Modern Worlds',
    description: 'Captivating epics, transformative habits, and timeless wisdom',
    books: [
      {
        id: 104,
        title: "Harry Potter and the Sorcerer's Stone",
        handle: 'harry-potter-and-the-sorcerers-stone',
        slug: 'harry-potter-and-the-sorcerers-stone',
        isbn: '9780439708180',
        publicationYear: 1997,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg',
        edition: 'Scholastic Edition',
        format: 'PAPERBACK',
        pageCount: 309,
        language: 'English',
        description: null,
        totalCopies: 8,
        availableCopies: 6,
        authors: [{ name: 'J.K. Rowling', handle: 'j-k-rowling', biography: null }],
        genres: [{ name: 'Fantasy', handle: 'fantasy', description: null }],
      },
      {
        id: 105,
        title: 'The Hobbit',
        handle: 'the-hobbit',
        slug: 'the-hobbit',
        isbn: '9780547928227',
        publicationYear: 1937,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1546071216i/5907.jpg',
        edition: 'Illustrated Edition',
        format: 'HARDCOVER',
        pageCount: 310,
        language: 'English',
        description: null,
        totalCopies: 8,
        availableCopies: 5,
        authors: [{ name: 'J.R.R. Tolkien', handle: 'j-r-r-tolkien', biography: null }],
        genres: [{ name: 'Fantasy', handle: 'fantasy', description: null }],
      },
      {
        id: 107,
        title: 'Crime and Punishment',
        handle: 'crime-and-punishment',
        slug: 'crime-and-punishment',
        isbn: '9780140449136',
        publicationYear: 1866,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1382846449i/7144.jpg',
        edition: 'Vintage Classics',
        format: 'PAPERBACK',
        pageCount: 671,
        language: 'English',
        description: null,
        totalCopies: 3,
        availableCopies: 2,
        authors: [{ name: 'Fyodor Dostoevsky', handle: 'fyodor-dostoevsky', biography: null }],
        genres: [{ name: 'Classics', handle: 'classics', description: null }],
      },
      {
        id: 108,
        title: 'Atomic Habits',
        handle: 'atomic-habits',
        slug: 'atomic-habits',
        isbn: '9780735211292',
        publicationYear: 2018,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
        edition: 'Avery',
        format: 'HARDCOVER',
        pageCount: 320,
        language: 'English',
        description: null,
        totalCopies: 10,
        availableCopies: 7,
        authors: [{ name: 'James Clear', handle: 'james-clear', biography: null }],
        genres: [{ name: 'Self Help', handle: 'self-help', description: null }],
      },
    ],
  },
]

interface GuestHomePageProps {
  keyword?: string
  onKeywordChange?: (kw: string) => void
  selectedGenre?: string
  onGenreChange?: (genre: string) => void
  onSelectBook?: (book: BookPublicResponse) => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
}

export function GuestHomePage({
  keyword = '',
  onKeywordChange,
  selectedGenre = '',
  onGenreChange,
  onSelectBook,
  onOpenAuth,
}: GuestHomePageProps) {
  const [, setBooks] = useState<BookPublicResponse[]>([])
  const [localSearch, setLocalSearch] = useState(keyword)

  useEffect(() => {
    let isMounted = true

    api.getBooks({ page: 1, size: 36 })
      .then((res) => {
        if (!isMounted) return
        setBooks(res.content || [])
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onKeywordChange?.(localSearch.trim())
  }

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-0">
      {/* ========================================================================= */}
      {/* HERO BANNER SECTION (Harmonized with Warm Parchment & Deep Sage)          */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-none border border-t-0 border-[#dfd9cb] dark:border-[#2f3a31] shadow-2xs bg-[#f8f5ee] dark:bg-[#181f19] min-h-[300px] sm:min-h-[360px] flex items-stretch">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-right opacity-95 dark:opacity-35 transition-opacity duration-300 pointer-events-none"
          style={{ backgroundImage: "url('/banner.jpg')" }}
        />
        {/* Harmonious Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f8f5ee] via-[#f8f5ee]/90 to-transparent dark:from-[#181f19] dark:via-[#181f19]/85 dark:to-transparent w-full sm:w-3/4 pointer-events-none" />

        {/* Content Box (Headline at top, CTA pushed down near bottom) */}
        <div className="relative z-10 px-6 sm:px-8 md:px-10 pt-7 sm:pt-9 pb-7 sm:pb-8 max-w-2xl flex flex-col justify-between w-full">
          <h1 className="text-3xl sm:text-4xl lg:text-[45px] font-extrabold leading-[1.14] w-fit" style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}>
            <span className="block whitespace-nowrap tracking-[0.035em] text-[#2c392d] dark:text-[#d8e2cf]">
              Find your mindful
            </span>
            <span className="block whitespace-nowrap tracking-tight text-[#2c392d] dark:text-[#d8e2cf] text-center">
              reading sanctuary
            </span>
          </h1>

          {/* Action Links Container (Near bottom of banner, matching width) */}
          <div className="pt-8 sm:pt-11">
            <div className="flex flex-col items-center w-[220px] sm:w-[224px] space-y-3.5">
              <Button
                onClick={() => onOpenAuth?.('register')}
                className="w-full bg-[#2d3a2e] hover:bg-[#1e271f] text-[#f8f6f0] dark:bg-[#c9d5be] dark:text-[#182219] dark:hover:bg-[#b8c6ab] h-10 text-xs sm:text-[13px] font-semibold rounded-md shadow-2xs cursor-pointer transition-all tracking-wide flex items-center justify-center text-center"
              >
                Join our readers
              </Button>

              <div className="w-full text-[#5e6d5b] dark:text-[#9fab97] flex items-center justify-center gap-1.5 font-medium text-[11px] sm:text-xs">
                <span>Already have an account?</span>
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="font-semibold text-[#2d3a2e] dark:text-[#c9d5be] hover:underline underline-offset-4 cursor-pointer transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Curated Catalog (Discovery) */}
          <div className="group p-6 rounded-xl bg-[#f8f5ee] dark:bg-[#182019] border border-[#dfd9cb] dark:border-[#2a352b] shadow-2xs hover:border-[#8f9f8c] transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#ebf0e6] dark:bg-[#253227] text-[#2c392d] dark:text-[#c9d5be] flex items-center justify-center mb-4">
                <IconBooks size={20} strokeWidth={2} />
              </div>
              <h3
                className="text-base font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
              >
                Curated Catalog
              </h3>
              <p className="text-xs sm:text-[13px] text-[#5e6e5c] dark:text-[#9fab97] leading-relaxed">
                Explore handpicked editions and rich literary subjects, completely free from ads and distracting algorithms.
              </p>
            </div>
            
            <div className="pt-5 flex flex-wrap gap-1.5">
              {['Classics', 'Philosophy', 'Essays'].map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eeeae0] dark:bg-[#232d24] text-[#4a5a48] dark:text-[#b0c0a9]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: Borrow & Reserve (Library Circulation) */}
          <div className="group p-6 rounded-xl bg-[#f8f5ee] dark:bg-[#182019] border border-[#dfd9cb] dark:border-[#2a352b] shadow-2xs hover:border-[#8f9f8c] transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#ebf0e6] dark:bg-[#253227] text-[#2c392d] dark:text-[#c9d5be] flex items-center justify-center mb-4">
                <IconBookDownload size={20} strokeWidth={2} />
              </div>
              <h3
                className="text-base font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
              >
                Borrow & Reserve
              </h3>
              <p className="text-xs sm:text-[13px] text-[#5e6e5c] dark:text-[#9fab97] leading-relaxed">
                Check real-time shelf availability, reserve titles in advance, and borrow physical or digital copies with ease.
              </p>
            </div>

            <div className="pt-5 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eeeae0] dark:bg-[#232d24] text-[#4a5a48] dark:text-[#b0c0a9]">
                Available
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eeeae0] dark:bg-[#232d24] text-[#4a5a48] dark:text-[#b0c0a9]">
                Reserved
              </span>
            </div>
          </div>

          {/* Card 3: Personal Shelves (Tracking) */}
          <div className="group p-6 rounded-xl bg-[#f8f5ee] dark:bg-[#182019] border border-[#dfd9cb] dark:border-[#2a352b] shadow-2xs hover:border-[#8f9f8c] transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#ebf0e6] dark:bg-[#253227] text-[#2c392d] dark:text-[#c9d5be] flex items-center justify-center mb-4">
                <IconBookmark size={20} strokeWidth={2} />
              </div>
              <h3
                className="text-base font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
              >
                Personal Shelves
              </h3>
              <p className="text-xs sm:text-[13px] text-[#5e6e5c] dark:text-[#9fab97] leading-relaxed">
                Organize your wishlist, track ongoing volumes, and note memorable reflections in one private log.
              </p>
            </div>

            <div className="pt-5 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eeeae0] dark:bg-[#232d24] text-[#4a5a48] dark:text-[#b0c0a9]">
                Want to read
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eeeae0] dark:bg-[#232d24] text-[#4a5a48] dark:text-[#b0c0a9]">
                Currently reading
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eeeae0] dark:bg-[#232d24] text-[#4a5a48] dark:text-[#b0c0a9]">
                Read
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. COMMAND / SEARCH BAR + GENRES (Goodreads-style rich text links)        */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2
            className="text-lg font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
          >
            Explore by Genre
          </h2>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search title, author, ISBN..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-[#dfd9cb] dark:border-[#2f3a31] bg-[#f8f5ee] dark:bg-[#182019] text-[#2c392d] dark:text-[#d8e2cf] placeholder-[#8a9988] focus:outline-none focus:ring-1 focus:ring-[#475b49] transition-all shadow-2xs"
            />
            <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7a8a78]" />
          </form>
        </div>

        {/* Rich Goodreads-style text links for genres (No badges) */}
        <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-[#5e6e5c] dark:text-[#9fab97] leading-relaxed">
          <span className="font-semibold text-[#2c392d] dark:text-[#d8e2cf] mr-0.5">
            Subjects:
          </span>
          {POPULAR_GENRES.map((name, idx) => {
            const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            const isSelected = selectedGenre === handle
            return (
              <span key={name} className="inline-flex items-center gap-2.5">
                <button
                  onClick={() => onGenreChange?.(isSelected ? '' : handle)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'font-bold text-[#2c392d] dark:text-[#d8e2cf] underline underline-offset-4'
                      : 'hover:text-[#2c392d] dark:hover:text-[#d8e2cf]'
                  }`}
                >
                  {name}
                </button>
                {idx < POPULAR_GENRES.length - 1 && (
                  <span className="text-[#c8cebe] dark:text-[#384639] select-none text-[10px]">·</span>
                )}
              </span>
            )
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CURATED COLLECTIONS SHOWCASE (Illustrating 2 collections, 4 books each) */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-2">
        <div className="flex items-center justify-between border-b border-[#dfd9cb] dark:border-[#2a352b] pb-3">
          <h3
            className="text-base sm:text-lg font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
          >
            Curated Collections
          </h3>
          
          <button
            onClick={() => onOpenAuth?.('register')}
            className="text-xs font-semibold text-[#2d3a2e] dark:text-[#c9d5be] hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Explore all collections</span>
            <IconArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-5 pt-1">
          {MOCK_COLLECTIONS.map((col) => (
            <div key={col.id} className="space-y-2">
              <h4 className="text-sm font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight">
                {col.name}
              </h4>

              {/* Tightly packed covers with View collection right next to covers, no arrow */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-fit">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {col.books.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBook?.(b)}
                      title={`${b.title} by ${b.authors?.map((a) => a.name).join(', ')}`}
                      className="cursor-pointer select-none"
                    >
                      <div className="w-20 sm:w-24 aspect-[2/3] rounded bg-[#ede8dc] dark:bg-[#202921] border border-[#dfd9cb] dark:border-[#2f3a31] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center p-0.5">
                        {b.cover ? (
                          <img
                            src={b.cover}
                            alt={b.title}
                            className="w-full h-full object-contain select-none"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="p-1 flex flex-col items-center justify-center text-center">
                            <IconBook size={16} className="text-[#8f9f8c] opacity-60 mb-0.5" />
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-[#4d5e4b] dark:text-[#a8b89e] line-clamp-2 leading-tight">
                              {b.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="text-xs font-semibold text-[#4a5f4b] dark:text-[#a8bca5] hover:underline cursor-pointer select-none whitespace-nowrap pl-1"
                >
                  View collection
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

