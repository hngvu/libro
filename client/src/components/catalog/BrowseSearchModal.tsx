import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import type { BookPublicResponse } from '@/types/api'
import { IconSearch, IconX, IconBook } from '@tabler/icons-react'

interface BrowseSearchModalProps {
  open: boolean
  onClose: () => void
  onSelectBook: (book: BookPublicResponse) => void
  onSearch?: (keyword: string) => void
}

export function BrowseSearchModal({
  open,
  onClose,
  onSelectBook,
  onSearch,
}: BrowseSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookPublicResponse[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened and reset state
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setLoading(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Debounced search for books (matching old header search)
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.getBooks({ keyword: trimmed, size: 8 })
        setResults(res.content || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    onClose()
    onSearch?.(trimmed)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-2xl rounded-[8px] border border-[#d8d8d8] dark:border-[#3d4b3e] bg-white dark:bg-[#252c28] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className={`relative flex items-center px-4 sm:px-5 py-3.5 sm:py-4 bg-white dark:bg-[#252c28] transition-colors ${
            query.trim() ? 'border-b border-[#e8e8e8] dark:border-[#3d4b3e]' : ''
          }`}
        >
          <IconSearch size={20} className="text-[#6f7f64] dark:text-[#a0b096] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search books"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm sm:text-base bg-transparent border-none text-[#181818] dark:text-[#f5f3e6] placeholder:text-[#767676] focus:outline-none pr-9"
          />
          <div className="absolute right-4 sm:right-5 flex items-center">
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#00635d] border-t-transparent rounded-full animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-[#767676] hover:text-[#181818] dark:hover:text-white cursor-pointer transition-colors"
                title="Clear"
              >
                <IconX size={17} />
              </button>
            ) : null}
          </div>
        </form>

        {/* Search Results: Only expands when text is typed */}
        {query.trim() ? (
          <div className="flex-1 overflow-y-auto">
            {loading && results.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-zinc-500">Searching books...</div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                No books found for "{query}"
              </div>
            ) : (
              <>
                <div className="max-h-96 sm:max-h-[480px] overflow-y-auto divide-y divide-[#e8e8e8] dark:divide-[#3d4b3e]">
                  {results.map((b) => (
                    <div
                      key={b.handle}
                      onClick={() => {
                        onClose()
                        onSelectBook(b)
                      }}
                      className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3.5 sm:gap-4 hover:bg-[#f4f1ea]/60 dark:hover:bg-[#333d36] cursor-pointer transition-colors"
                    >
                      <div className="w-11 h-11 sm:w-13 sm:h-13 bg-[#f0ede6] dark:bg-[#1e2320] shrink-0 rounded-[4px] overflow-hidden flex items-center justify-center">
                        {b.cover ? (
                          <img src={b.cover} alt={b.title} className="h-full w-full object-cover object-top" />
                        ) : (
                          <IconBook size={20} className="text-[#888888]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-[15px] leading-snug text-[#181818] dark:text-[#f5f3e6] truncate">
                          {b.title}
                        </p>
                        <p className="text-xs sm:text-[13.5px] text-[#55634d] dark:text-[#c8d0b7] mt-0.5 truncate">
                          {b.authors && b.authors.length > 0
                            ? b.authors.map((a) => a.name).join(', ')
                            : 'Unknown Author'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  onClick={handleSearchSubmit}
                  className="py-3 sm:py-3.5 px-4 bg-white dark:bg-[#252c28] border-t border-[#e8e8e8] dark:border-[#3d4b3e] text-center text-xs sm:text-sm font-medium text-[#00635d] dark:text-[#4db6ac] hover:underline cursor-pointer"
                >
                  Show all results for "{query}"
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
