import type { BookPublicResponse } from '@/types/api'
import { IconBook } from '@tabler/icons-react'

interface BookCardProps {
  book: BookPublicResponse
  onSelect: (book: BookPublicResponse) => void
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const authorsText =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(', ')
      : null

  return (
    <div
      onClick={() => onSelect(book)}
      className="group flex flex-col cursor-pointer transition-all duration-200"
    >
      {/* Goodreads Book Cover with realistic 3D spine shadow */}
      <div className="relative aspect-[2/3] w-full rounded-r-[11px] rounded-l-[3px] bg-[#f0ede6] dark:bg-[#1e2320] shadow-[0_4px_14px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.1)]">
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
          <div className="flex flex-col items-center justify-center p-3 text-center text-[#777]">
            <IconBook size={28} className="mb-1 text-[#888]" />
            <span className="text-[9.5px] font-serif font-semibold uppercase tracking-wider text-[#444] dark:text-[#c8d0b7] line-clamp-2">
              {book.title}
            </span>
          </div>
        )}

        {/* Subtle spine crease & highlight overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-[3px] w-[1px] bg-white/20" />
      </div>

      {/* Book Title */}
      <h3
        className="font-serif font-medium text-[14px] sm:text-[14.5px] text-[#181818] dark:text-[#f5f3e6] line-clamp-2 mt-2 leading-[1.3] group-hover:underline"
        title={book.title}
      >
        {book.title}
      </h3>

      {/* Author Name */}
      {authorsText && (
        <p className="font-sans text-[12px] sm:text-[12.5px] text-[#333333] dark:text-[#c8d0b7] mt-0.5 truncate hover:underline">
          {authorsText}
        </p>
      )}
    </div>
  )
}
