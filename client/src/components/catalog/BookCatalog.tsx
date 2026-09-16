import { useState, useEffect, useCallback } from 'react'
import type { BookPublicResponse, BookFormat, GenrePublicResponse } from '@/types/api'
import { api } from '@/services/api'
import { BookCard } from '@/components/catalog/BookCard'
import { Button } from '@/components/ui/button'
import {
  IconChevronLeft,
  IconChevronRight,
  IconBook2,
  IconRefresh,
  IconCategory,
  IconBookmark,
  IconX,
} from '@tabler/icons-react'

interface BookCatalogProps {
  keyword: string
  onKeywordChange: (kw: string) => void
  selectedGenre: string
  onGenreChange: (genre: string) => void
  onSelectBook: (book: BookPublicResponse) => void
}

export function BookCatalog({
  keyword,
  onKeywordChange,
  selectedGenre,
  onGenreChange,
  onSelectBook,
}: BookCatalogProps) {
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
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
  }

  const selectedGenreObj = genres.find((g) => g.handle === selectedGenre)

  return (
    <div className="space-y-6">
      {/* Clean Top Discovery Header */}
      <div className="border-b border-[#c8d0b7] dark:border-[#3d4b3e] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-[#1e2320] dark:text-[#f5f3e6] tracking-tight">
            Explore Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#6f7f64] dark:text-[#c8d0b7] mt-0.5">
            Browse our collection of physical copies, digital titles, and audiobooks.
          </p>
        </div>

        {keyword && (
          <div className="inline-flex items-center gap-2 bg-[#faf9f4] dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 py-1.5 rounded-[4px] text-xs">
            <span className="text-[#6f7f64] dark:text-[#c8d0b7]">Searching:</span>
            <strong className="text-[#1e2320] dark:text-[#f5f3e6]">"{keyword}"</strong>
            <button
              onClick={() => onKeywordChange('')}
              className="text-[#6f7f64] hover:text-rose-600 transition-colors ml-1 cursor-pointer"
              title="Clear search"
            >
              <IconX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Two-Column Goodreads Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters */}
        <aside className="lg:col-span-1">
          <div className="space-y-6">
            {/* Genre Navigation */}
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#c8d0b7] dark:border-[#3d4b3e]">
                <h3 className="font-serif font-bold text-xs text-[#1e2320] dark:text-[#f5f3e6] uppercase tracking-wider flex items-center gap-1.5">
                  <IconCategory size={15} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
                  Browse Genres
                </h3>
                {selectedGenre && (
                  <button
                    onClick={() => {
                      onGenreChange('')
                      setPage(1)
                    }}
                    className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onGenreChange('')
                    setPage(1)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    selectedGenre === ''
                      ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                      : 'text-[#333] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/30 hover:underline'
                  }`}
                >
                  <span>All Genres</span>
                </button>

                {genres.map((g) => (
                  <button
                    key={g.handle}
                    onClick={() => {
                      onGenreChange(g.handle)
                      setPage(1)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selectedGenre === g.handle
                        ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                        : 'text-[#333] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/30 hover:underline'
                    }`}
                  >
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formats Filter */}
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#c8d0b7] dark:border-[#3d4b3e]">
                <h3 className="font-serif font-bold text-xs text-[#1e2320] dark:text-[#f5f3e6] uppercase tracking-wider flex items-center gap-1.5">
                  <IconBookmark size={15} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
                  Format
                </h3>
                {selectedFormat && (
                  <button
                    onClick={() => {
                      setSelectedFormat('')
                      setPage(1)
                    }}
                    className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {(['', 'PAPERBACK', 'HARDCOVER', 'EBOOK', 'AUDIOBOOK'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setSelectedFormat(fmt as BookFormat)
                      setPage(1)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs transition-colors cursor-pointer ${
                      selectedFormat === fmt
                        ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                        : 'text-[#333] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/30 hover:underline'
                    }`}
                  >
                    {fmt === '' ? 'All Formats' : fmt.charAt(0) + fmt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content (Goodreads Shelf) */}
        <main className="lg:col-span-3 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-serif font-bold text-lg text-[#1e2320] dark:text-[#f5f3e6]">
                {selectedGenreObj ? selectedGenreObj.name : 'Library Collection'}
              </h2>
              <span className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                ({totalElements} {totalElements === 1 ? 'book' : 'books'}
                {selectedFormat && ` • ${selectedFormat.charAt(0) + selectedFormat.slice(1).toLowerCase()}`})
              </span>
            </div>

            {(keyword || selectedFormat || selectedGenre) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs gap-1 text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40 cursor-pointer"
              >
                <IconRefresh size={13} /> Reset filters
              </Button>
            )}
          </div>

          {/* Book Cards Grid - Goodreads Compact Size */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-7">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse max-w-[140px]">
                  <div className="aspect-[2/3] w-full rounded-r-[5px] rounded-l-[2px] bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30" />
                  <div className="h-3.5 bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/40 rounded w-4/5" />
                  <div className="h-3 bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e]">
              <IconBook2 size={44} className="mx-auto text-[#6f7f64] mb-3 opacity-60" />
              <h3 className="font-bold text-base text-[#1e2320] dark:text-[#f5f3e6]">
                No books matched your criteria
              </h3>
              <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1">
                Try searching with different keywords or reset your genre and format filters.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 text-xs h-8 rounded-[4px] cursor-pointer">
                Reset all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
              {books.map((book) => (
                <div key={book.handle} className="flex">
                  <BookCard
                    book={book}
                    onSelect={(b) => onSelectBook(b)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#c8d0b7] dark:border-[#3d4b3e] pt-4 mt-6">
              <span className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                Page <span className="font-semibold text-[#1e2320] dark:text-[#f5f3e6]">{page}</span> of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs gap-1 rounded-[4px] cursor-pointer"
                >
                  <IconChevronLeft size={14} /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs gap-1 rounded-[4px] cursor-pointer"
                >
                  Next <IconChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
