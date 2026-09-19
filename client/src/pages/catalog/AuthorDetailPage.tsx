import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconArrowLeft,
  IconBook2,
  IconUser,
  IconBooks,
} from '@tabler/icons-react'
import { api } from '@/services/api'
import type { AuthorPublicResponse, BookPublicResponse } from '@/types/api'
import { BookCard } from '@/components/catalog/BookCard'

export function AuthorDetailPage() {
  const { handle } = useParams<{ handle: string }>()
  const navigate = useNavigate()

  const [author, setAuthor] = useState<AuthorPublicResponse | null>(null)
  const [books, setBooks] = useState<BookPublicResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [bioExpanded, setBioExpanded] = useState(false)

  const loadData = useCallback(async () => {
    if (!handle) return
    setLoading(true)
    try {
      const [authorData, booksData] = await Promise.all([
        api.getAuthorByHandle(handle),
        api.getBooks({ author: handle, size: 50 }),
      ])
      setAuthor(authorData)
      setBooks(booksData.content || [])
    } catch {
      setAuthor(null)
    } finally {
      setLoading(false)
    }
  }, [handle])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 rounded" />
        <div className="flex gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-8 w-64 bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 rounded" />
            <div className="h-4 w-full bg-[#c8d0b7]/20 dark:bg-[#3d4b3e]/20 rounded" />
            <div className="h-4 w-3/4 bg-[#c8d0b7]/20 dark:bg-[#3d4b3e]/20 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <IconUser size={48} className="mx-auto text-[#6f7f64] opacity-50" />
        <h2 className="font-serif font-bold text-2xl text-[#1e2320] dark:text-[#f5f3e6]">
          Author Not Found
        </h2>
        <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
          We could not find the author you are looking for in our library archives.
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-150">
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

      {/* Author Header Profile */}
      <div className="bg-[#faf9f4] dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          {/* Avatar Monogram / Photo */}
          {author.image ? (
            <img
              src={author.image}
              alt={author.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-md shrink-0 border-2 border-white/20"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#2e7d56] text-[#f5f3e6] flex items-center justify-center font-serif text-3xl font-bold shrink-0 shadow-md">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1e2320] dark:text-[#f5f3e6] leading-tight">
                {author.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/40 text-[#3d4b3e] dark:text-[#c8d0b7]">
                <IconBooks size={13} />
                <span>{books.length} {books.length === 1 ? 'Title' : 'Titles'}</span>
              </span>
            </div>

            {author.biography ? (
              <div className="mt-3 text-[14px] leading-relaxed text-[#444] dark:text-[#c8d0b7] font-sans">
                <p className={bioExpanded ? '' : 'line-clamp-3 whitespace-pre-line'}>
                  {author.biography}
                </p>
                {author.biography.length > 220 && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="text-xs font-semibold text-[#2e7d56] hover:underline cursor-pointer mt-1"
                  >
                    {bioExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-[#777] dark:text-[#888]">
                Cataloged literary contributor in the open library archive.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Published Books Grid */}
      <section className="space-y-4">
        <div className="border-b border-[#c8d0b7] dark:border-[#3d4b3e] pb-3 flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#1e2320] dark:text-[#f5f3e6] flex items-center gap-2">
            <IconBook2 size={20} className="text-[#3d4b3e] dark:text-[#c8d0b7]" />
            <span>Books by {author.name}</span>
          </h2>
          <span className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
            {books.length} available in catalog
          </span>
        </div>

        {books.length === 0 ? (
          <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] space-y-2">
            <IconBook2 size={36} className="mx-auto text-[#6f7f64] opacity-50" />
            <p className="text-sm font-serif font-medium text-[#1e2320] dark:text-[#f5f3e6]">
              No active books currently available by this author.
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
