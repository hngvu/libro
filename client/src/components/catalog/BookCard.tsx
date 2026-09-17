import type { BookPublicResponse } from '@/types/api'
import { IconBook } from '@tabler/icons-react'

interface BookCardProps {
  book: BookPublicResponse
  onSelect: (book: BookPublicResponse) => void
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const tooltipText = `${book.title}${
    book.authors && book.authors.length > 0
      ? ` by ${book.authors.map((a) => a.name).join(', ')}`
      : ''
  }`

  return (
    <div
      onClick={() => onSelect(book)}
      title={tooltipText}
      className="group flex flex-col cursor-pointer w-[86px] sm:w-[92px] shrink-0 transition-all duration-150 select-none"
    >
      {/* Book Cover with subtle 3D spine shadow */}
      <div className="relative aspect-[2/3] w-full rounded-[3px] bg-zinc-100 dark:bg-zinc-800 shadow-[0_2px_5px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center transition-all duration-150 group-hover:-translate-y-1 group-hover:shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
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
          <div className="flex flex-col items-center justify-center p-1.5 text-center text-zinc-500 dark:text-zinc-400">
            <IconBook size={18} className="mb-1 opacity-50" />
            <span className="text-[9px] font-medium uppercase tracking-wider line-clamp-2">
              {book.title}
            </span>
          </div>
        )}

        {/* Realistic spine crease & lighting overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[2.5px] bg-gradient-to-r from-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-[2px] w-[0.5px] bg-white/20" />
      </div>
    </div>
  )
}


