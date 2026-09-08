import { useState, useEffect, useCallback } from 'react'
import type { BookPublicResponse, BookFormat, GenrePublicResponse } from '@/types/api'
import { api } from '@/services/api'
import { BookCard } from '@/components/catalog/BookCard'
import { BookDetailModal } from '@/components/catalog/BookDetailModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconBook2,
  IconRefresh,
  IconCategory,
  IconBookmark,
  IconInfoCircle,
} from '@tabler/icons-react'

interface BookCatalogProps {
  onNavigateToLoan?: () => void
}

export function BookCatalog({ onNavigateToLoan }: BookCatalogProps) {
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [keyword, setKeyword] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | ''>('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Selected Book for Detail Modal
  const [selectedBook, setSelectedBook] = useState<BookPublicResponse | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch Genres once
  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.content || []))
      .catch(() => setGenres([]))
  }, [])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getBooks({
        keyword: keyword.trim() || undefined,
        format: selectedFormat || undefined,
        genre: selectedGenre || undefined,
        page,
        size: 8,
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchBooks()
  }

  const handleResetFilters = () => {
    setKeyword('')
    setSelectedFormat('')
    setSelectedGenre('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Goodreads-style Top Discovery Header */}
      <div className="border-b border-[#c8d0b7] dark:border-[#3d4b3e] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1e2320] dark:text-[#f5f3e6] tracking-tight">
            Discover Great Reads
          </h1>
          <p className="text-xs sm:text-sm text-[#6f7f64] dark:text-[#c8d0b7] mt-1 font-serif italic">
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </p>
        </div>

        {/* Goodreads Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-96">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-2.5 text-[#6f7f64]" size={17} />
            <Input
              type="text"
              placeholder="Search title, author, or ISBN..."
              className="pl-9 h-10 bg-white dark:bg-[#252c28] border-[#c8d0b7] dark:border-[#3d4b3e] text-xs shadow-xs focus-visible:ring-[#6f7f64]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-10 px-4 text-xs font-semibold">
            Search
          </Button>
        </form>
      </div>

      {/* Two-Column Goodreads Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar (Goodreads Genres & Shelf Navigation) */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Genre Navigation */}
          <div className="bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] shadow-xs">
            <h3 className="font-serif font-bold text-sm text-[#1e2320] dark:text-[#f5f3e6] uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <IconCategory size={16} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
              Browse by Genre
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedGenre('')
                  setPage(1)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  selectedGenre === ''
                    ? 'bg-[#3d4b3e] text-[#f5f3e6]'
                    : 'text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40'
                }`}
              >
                <span>All Genres</span>
                <span className="text-[10px] opacity-70">★</span>
              </button>

              {genres.map((g) => (
                <button
                  key={g.handle}
                  onClick={() => {
                    setSelectedGenre(g.handle)
                    setPage(1)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    selectedGenre === g.handle
                      ? 'bg-[#3d4b3e] text-[#f5f3e6]'
                      : 'text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formats Filter */}
          <div className="bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] shadow-xs">
            <h3 className="font-serif font-bold text-sm text-[#1e2320] dark:text-[#f5f3e6] uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <IconBookmark size={16} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
              Format
            </h3>
            <div className="space-y-1">
              {(['', 'PAPERBACK', 'HARDCOVER', 'EBOOK', 'AUDIOBOOK'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setSelectedFormat(fmt as BookFormat)
                    setPage(1)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-[#3d4b3e] text-[#f5f3e6]'
                      : 'text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40'
                  }`}
                >
                  {fmt === '' ? 'All Formats' : fmt.charAt(0) + fmt.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Library Info Card */}
          <div className="bg-[#c8d0b7]/25 dark:bg-[#1e2320]/60 p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#3d4b3e] dark:text-[#c8d0b7]">
              <IconInfoCircle size={16} />
              <span>Library Circulation</span>
            </div>
            <p className="text-[#1e2320] dark:text-[#c8d0b7] leading-relaxed">
              Browse physical and digital copies available across all library shelves. Check barcodes to borrow at circulation desks.
            </p>
          </div>
        </aside>

        {/* Right Main Content (Goodreads Feed / Shelf) */}
        <main className="lg:col-span-3 space-y-4">
          {/* Active Filter Bar */}
          <div className="flex items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] px-4 py-2.5 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
            <div>
              Showing <strong className="text-[#1e2320] dark:text-[#f5f3e6]">{totalElements}</strong> books
              {selectedGenre && <span> in <strong className="text-[#1e2320] dark:text-[#f5f3e6]">{selectedGenre}</strong></span>}
              {selectedFormat && <span> ({selectedFormat})</span>}
            </div>

            {(keyword || selectedFormat || selectedGenre) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs gap-1 text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40"
              >
                <IconRefresh size={13} /> Clear filters
              </Button>
            )}
          </div>

          {/* Book Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-[#c8d0b7]/20 dark:bg-[#3d4b3e]/30 animate-pulse border border-[#c8d0b7]/40 dark:border-[#3d4b3e]"
                />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
              <IconBook2 size={48} className="mx-auto text-[#6f7f64] mb-3" />
              <h3 className="font-serif font-bold text-lg text-[#1e2320] dark:text-[#f5f3e6]">
                No books matched your criteria
              </h3>
              <p className="text-xs text-[#6f7f64] mt-1">
                Try searching with different keywords or reset your genre and format filters.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4">
                Reset all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.handle}
                  book={book}
                  onSelect={(b) => {
                    setSelectedBook(b)
                    setDetailOpen(true)
                  }}
                />
              ))}
            </div>
          )}

          {/* Goodreads-style Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#c8d0b7] dark:border-[#3d4b3e] pt-4 mt-6">
              <span className="text-xs text-[#6f7f64]">
                Page <span className="font-semibold text-[#1e2320] dark:text-[#f5f3e6]">{page}</span> of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs gap-1"
                >
                  <IconChevronLeft size={14} /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs gap-1"
                >
                  Next <IconChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onNavigateToLoan={onNavigateToLoan}
      />
    </div>
  )
}
