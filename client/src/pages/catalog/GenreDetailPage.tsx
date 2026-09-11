import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconArrowLeft,
  IconBook2,
  IconCategory,
  IconBooks,
} from '@tabler/icons-react'
import { api } from '@/services/api'
import type { GenrePublicResponse, BookPublicResponse } from '@/types/api'
import { BookCard } from '@/components/catalog/BookCard'

export function GenreDetailPage() {
  const { handle } = useParams<{ handle: string }>()
  const navigate = useNavigate()

  const [genre, setGenre] = useState<GenrePublicResponse | null>(null)
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!handle) return
    setLoading(true)
    try {
      const [genreData, booksData] = await Promise.all([
        api.getGenreByHandle(handle),
        api.getBooks({ genre: handle, size: 50 }),
      ])
      setGenre(genreData)
      setBooks(booksData.content || [])
    } catch {
      setGenre(null)
    } finally {
      setLoading(false)
    }
  }, [handle])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 rounded" />
        <div className="space-y-3">
          <div className="h-8 w-64 bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 rounded" />
          <div className="h-4 w-full bg-[#c8d0b7]/20 dark:bg-[#3d4b3e]/20 rounded" />
        </div>
      </div>
    )
  }

  if (!genre) {
    return (
      <div className="w-full max-w-xl mx-auto py-20 text-center space-y-4">
        <IconCategory size={48} className="mx-auto text-[#6f7f64] opacity-50" />
        <h2 className="font-serif font-bold text-2xl text-[#1e2320] dark:text-[#f5f3e6]">
          Category Not Found
        </h2>
        <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
          We could not find the genre or category you are looking for.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2e7d56] hover:underline"
        >
          <IconArrowLeft size={14} /> Back to Catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Back Navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6f7f64] dark:text-[#c8d0b7] hover:text-[#1e2320] dark:hover:text-white transition-colors"
        >
          <IconArrowLeft size={14} />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Genre Header Banner */}
      <div className="bg-[#faf9f4] dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#3d4b3e] dark:text-[#c8d0b7] flex items-center justify-center shrink-0 border border-[#3d4b3e]/20">
            <IconCategory size={36} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1e2320] dark:text-[#f5f3e6] leading-tight">
                {genre.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#3d4b3e] dark:text-[#c8d0b7]">
                <IconBooks size={13} />
                <span>{books.length} {books.length === 1 ? 'Book' : 'Books'}</span>
              </span>
            </div>

            {genre.description ? (
              <p className="mt-3 text-[14px] leading-relaxed text-[#444] dark:text-[#c8d0b7] font-sans">
                {genre.description}
              </p>
            ) : (
              <p className="mt-2 text-xs italic text-[#777] dark:text-[#888]">
                Curated literary category in our public library catalog.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Books Grid */}
      <section className="space-y-4">
        <div className="border-b border-[#c8d0b7] dark:border-[#3d4b3e] pb-3 flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#1e2320] dark:text-[#f5f3e6] flex items-center gap-2">
            <IconBook2 size={20} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
            <span>Books in {genre.name}</span>
          </h2>
          <span className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
            {books.length} available in collection
          </span>
        </div>

        {books.length === 0 ? (
          <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] space-y-2">
            <IconBook2 size={36} className="mx-auto text-[#6f7f64] opacity-50" />
            <p className="text-sm font-serif font-medium text-[#1e2320] dark:text-[#f5f3e6]">
              No active books currently cataloged in this genre.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {books.map((book) => (
              <BookCard
                key={book.handle}
                book={book}
                onSelect={(b) =>
                  navigate(`/book/${b.handle}/${b.slug || b.handle}`)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
