import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import type { BookPublicResponse } from '@/types/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  IconSearch,
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
      {
        id: 117,
        title: 'Pride and Prejudice',
        handle: 'pride-and-prejudice',
        slug: 'pride-and-prejudice',
        isbn: '9780141439518',
        publicationYear: 1813,
        cover: 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
        edition: 'Penguin Classics',
        format: 'PAPERBACK',
        pageCount: 279,
        language: 'English',
        description: null,
        totalCopies: 6,
        availableCopies: 3,
        authors: [{ name: 'Jane Austen', handle: 'jane-austen', biography: null }],
        genres: [{ name: 'Classics', handle: 'classics', description: null }],
      },
    ],
  },
  {
    id: 'epic-worlds',
    name: 'Epic Worlds & Fantasy',
    description: 'Captivating sagas, vast realms, and magical wonders',
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
        id: 109,
        title: 'Dune',
        handle: 'dune',
        slug: 'dune',
        isbn: '9780441172719',
        publicationYear: 1965,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
        edition: 'Ace Books',
        format: 'PAPERBACK',
        pageCount: 658,
        language: 'English',
        description: null,
        totalCopies: 7,
        availableCopies: 4,
        authors: [{ name: 'Frank Herbert', handle: 'frank-herbert', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
      },
      {
        id: 110,
        title: 'The Lord of the Rings',
        handle: 'the-lord-of-the-rings',
        slug: 'the-lord-of-the-rings',
        isbn: '9780618640157',
        publicationYear: 1954,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1566425108i/33.jpg',
        edition: '50th Anniversary',
        format: 'HARDCOVER',
        pageCount: 1178,
        language: 'English',
        description: null,
        totalCopies: 9,
        availableCopies: 5,
        authors: [{ name: 'J.R.R. Tolkien', handle: 'j-r-r-tolkien', biography: null }],
        genres: [{ name: 'Fantasy', handle: 'fantasy', description: null }],
      },
      {
        id: 118,
        title: 'A Game of Thrones',
        handle: 'a-game-of-thrones',
        slug: 'a-game-of-thrones',
        isbn: '9780553103540',
        publicationYear: 1996,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1562726234i/13496.jpg',
        edition: 'Bantam Spectra',
        format: 'HARDCOVER',
        pageCount: 694,
        language: 'English',
        description: null,
        totalCopies: 5,
        availableCopies: 2,
        authors: [{ name: 'George R.R. Martin', handle: 'george-r-r-martin', biography: null }],
        genres: [{ name: 'Fantasy', handle: 'fantasy', description: null }],
      },
    ],
  },
  {
    id: 'mind-and-humanity',
    name: 'Mind, Habits & Humanity',
    description: 'Transformative habits, psychology, and the human condition',
    books: [
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
        id: 111,
        title: 'Slaughterhouse-Five',
        handle: 'slaughterhouse-five',
        slug: 'slaughterhouse-five',
        isbn: '9780440180296',
        publicationYear: 1969,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1440319389i/4981.jpg',
        edition: 'Dell',
        format: 'PAPERBACK',
        pageCount: 275,
        language: 'English',
        description: null,
        totalCopies: 4,
        availableCopies: 2,
        authors: [{ name: 'Kurt Vonnegut', handle: 'kurt-vonnegut', biography: null }],
        genres: [{ name: 'Fiction', handle: 'fiction', description: null }],
      },
      {
        id: 112,
        title: 'I, Robot',
        handle: 'i-robot',
        slug: 'i-robot',
        isbn: '9780553382563',
        publicationYear: 1950,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1609035271i/41804.jpg',
        edition: 'Spectra',
        format: 'PAPERBACK',
        pageCount: 256,
        language: 'English',
        description: null,
        totalCopies: 5,
        availableCopies: 3,
        authors: [{ name: 'Isaac Asimov', handle: 'isaac-asimov', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
      },
      {
        id: 119,
        title: 'Thinking, Fast and Slow',
        handle: 'thinking-fast-and-slow',
        slug: 'thinking-fast-and-slow',
        isbn: '9780374533557',
        publicationYear: 2011,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1317793965i/11468377.jpg',
        edition: 'Farrar, Straus and Giroux',
        format: 'PAPERBACK',
        pageCount: 499,
        language: 'English',
        description: null,
        totalCopies: 6,
        availableCopies: 3,
        authors: [{ name: 'Daniel Kahneman', handle: 'daniel-kahneman', biography: null }],
        genres: [{ name: 'Psychology', handle: 'psychology', description: null }],
      },
    ],
  },
  {
    id: 'future-and-frontiers',
    name: 'Future & Frontiers',
    description: 'Visionary epics and adventures beyond the horizon',
    books: [
      {
        id: 113,
        title: 'Foundation',
        handle: 'foundation',
        slug: 'foundation',
        isbn: '9780553293357',
        publicationYear: 1951,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1417900846i/29579.jpg',
        edition: 'Bantam Spectra',
        format: 'PAPERBACK',
        pageCount: 255,
        language: 'English',
        description: null,
        totalCopies: 6,
        availableCopies: 4,
        authors: [{ name: 'Isaac Asimov', handle: 'isaac-asimov', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
      },
      {
        id: 114,
        title: 'Ready Player One',
        handle: 'ready-player-one',
        slug: 'ready-player-one',
        isbn: '9780307887436',
        publicationYear: 2011,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1500930947i/9969571.jpg',
        edition: 'Crown',
        format: 'HARDCOVER',
        pageCount: 374,
        language: 'English',
        description: null,
        totalCopies: 6,
        availableCopies: 3,
        authors: [{ name: 'Ernest Cline', handle: 'ernest-cline', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
      },
      {
        id: 115,
        title: 'The Gods Themselves',
        handle: 'the-gods-themselves',
        slug: 'the-gods-themselves',
        isbn: '9780553288100',
        publicationYear: 1972,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1351076141i/41821.jpg',
        edition: 'Spectra',
        format: 'PAPERBACK',
        pageCount: 288,
        language: 'English',
        description: null,
        totalCopies: 4,
        availableCopies: 2,
        authors: [{ name: 'Isaac Asimov', handle: 'isaac-asimov', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
      },
      {
        id: 116,
        title: 'Starship Troopers',
        handle: 'starship-troopers',
        slug: 'starship-troopers',
        isbn: '9780441783588',
        publicationYear: 1959,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1614054412i/17214.jpg',
        edition: 'Ace',
        format: 'PAPERBACK',
        pageCount: 263,
        language: 'English',
        description: null,
        totalCopies: 5,
        availableCopies: 3,
        authors: [{ name: 'Robert A. Heinlein', handle: 'robert-a-heinlein', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
      },
      {
        id: 120,
        title: 'Neuromancer',
        handle: 'neuromancer',
        slug: 'neuromancer',
        isbn: '9780441569595',
        publicationYear: 1984,
        cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1554437249i/6088007.jpg',
        edition: 'Ace',
        format: 'PAPERBACK',
        pageCount: 271,
        language: 'English',
        description: null,
        totalCopies: 5,
        availableCopies: 3,
        authors: [{ name: 'William Gibson', handle: 'william-gibson', biography: null }],
        genres: [{ name: 'Science Fiction', handle: 'science-fiction', description: null }],
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
  selectedGenre: _selectedGenre = '',
  onGenreChange: _onGenreChange,
  onSelectBook: _onSelectBook,
  onOpenAuth,
}: GuestHomePageProps) {
  useDocumentTitle(keyword ? `Search: "${keyword}"` : _selectedGenre ? `${_selectedGenre} Books` : undefined)

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
    <div>
      {/* Top Header Bar for Guest (Matching banner wall color #f4eddd) */}
      <header className="w-full border-b border-[#dfd9cb] dark:border-[#2f3a31] bg-[#f4eddd] dark:bg-[#181f19] transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center">
          {/* Brand Logo with Title */}
          <div className="flex items-center gap-2 select-none cursor-pointer group">
            <img
              src="/favicon.svg"
              alt="Libro logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain shadow-2xs group-hover:scale-105 transition-transform"
            />
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#2c392d] dark:text-[#d8e2cf] group-hover:text-[#4d664f] transition-colors">
              libro
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO BANNER SECTION (Seamless Tiled Desk Pattern + Grounded Book Object)  */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden w-full border-b border-[#dfd9cb] dark:border-[#2f3a31] bg-[#f4eddd] dark:bg-[#181f19] min-h-[320px] sm:min-h-[380px] lg:min-h-[400px] flex items-stretch">
        {/* Seamless Tiled Wooden Desk Pattern along the bottom (consistent, even color and lowered horizon) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[110px] sm:h-[125px] md:h-[135px] pointer-events-none opacity-95 dark:opacity-35"
          style={{
            backgroundImage: "url('/desk_pattern.jpg')",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left top",
            backgroundSize: "auto 100%",
          }}
        />

        {/* Content Box aligned with max-w-5xl container (text & books locked in golden ratio) */}
        <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col justify-between">
          <div className="max-w-xl">
            <h1
              className="text-3xl sm:text-4xl lg:text-[45px] font-extrabold leading-[1.14] text-[#2c392d] dark:text-[#d8e2cf]"
              style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
            >
              <span className="block whitespace-nowrap tracking-[0.035em]">
                Find your mindful
              </span>
              <span className="block whitespace-nowrap tracking-tight">
                reading sanctuary
              </span>
            </h1>
          </div>

          {/* Action Links Container */}
          <div className="pt-8 sm:pt-11 flex items-end justify-between">
            <div className="flex flex-col items-start w-[220px] sm:w-[224px] space-y-3.5 flex-shrink-0 z-10">
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

            {/* Standalone Book Stack: Grounded firmly on top of the wooden desk */}
            <div className="hidden sm:block absolute right-4 sm:right-6 lg:right-8 bottom-3 sm:bottom-4 md:bottom-5 pointer-events-none select-none">
              <img
                src="/hero_books_grounded.png"
                alt="Mindful books stack"
                className="w-[290px] sm:w-[350px] md:w-[400px] lg:w-[430px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Guest Content */}
      <div className="space-y-10 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
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

        {/* Rich Goodreads-style text links for genres (No badges, purely illustrative) */}
        <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-[#5e6e5c] dark:text-[#9fab97] leading-relaxed">
          <span className="font-semibold text-[#2c392d] dark:text-[#d8e2cf] mr-0.5">
            Subjects:
          </span>
          {POPULAR_GENRES.map((name, idx) => (
            <span key={name} className="inline-flex items-center gap-2.5">
              <span className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] transition-colors select-none cursor-default">
                {name}
              </span>
              {idx < POPULAR_GENRES.length - 1 && (
                <span className="text-[#c8cebe] dark:text-[#384639] select-none text-[10px]">·</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CURATED COLLECTIONS SHOWCASE (Illustrating 2 collections, 4 books each) */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-2">
        <div className="border-b border-[#dfd9cb] dark:border-[#2a352b] pb-3">
          <h3
            className="text-base sm:text-lg font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
          >
            Curated Collections
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7 pt-1">
          {MOCK_COLLECTIONS.map((col) => (
            <div key={col.id} className="space-y-2">
              <h4 className="text-sm font-bold text-[#2c392d] dark:text-[#d8e2cf] tracking-tight">
                {col.name}
              </h4>

              {/* Tightly packed covers */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {col.books.map((b) => (
                  <div
                    key={b.id}
                    title={`${b.title} by ${b.authors?.map((a) => a.name).join(', ')}`}
                    className="select-none"
                  >
                    <div className="w-[64px] sm:w-[80px] aspect-[2/3] rounded-none bg-[#ede8dc] dark:bg-[#202921] border border-[#dfd9cb] dark:border-[#2f3a31] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_14px_rgba(0,0,0,0.18)] cursor-pointer">
                      {b.cover ? (
                        <img
                          src={b.cover}
                          alt={b.title}
                          className="w-full h-full object-cover select-none"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="p-1 flex flex-col items-center justify-center text-center">
                          <IconBook size={14} className="text-[#8f9f8c] opacity-60 mb-0.5" />
                          <span className="text-[7px] font-semibold uppercase tracking-wider text-[#4d5e4b] dark:text-[#a8b89e] line-clamp-2 leading-tight">
                            {b.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
)
}

