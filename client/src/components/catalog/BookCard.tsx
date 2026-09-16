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

  const isAvailable = book.availableCopies > 0
  const formatLabel = book.format
    ? book.format.charAt(0) + book.format.slice(1).toLowerCase()
    : null

  return (
    <div
      onClick={() => onSelect(book)}
      className="group flex flex-col cursor-pointer w-full max-w-[140px] transition-all duration-200"
    >
      {/* Goodreads Book Cover with 3D Spine Shadow */}
      <div className="relative aspect-[2/3] w-full rounded-r-[5px] rounded-l-[2px] bg-[#f0ede6] dark:bg-[#1e2320] shadow-[0_3px_10px_rgba(0,0,0,0.16),0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.24)]">
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
          <div className="flex flex-col items-center justify-center p-2.5 text-center text-[#6f7f64] dark:text-[#c8d0b7]">
            <IconBook size={26} className="mb-1.5 opacity-50" />
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider line-clamp-2">
              {book.title}
            </span>
          </div>
        )}

        {/* Realistic spine crease & lighting overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-[3px] w-[1px] bg-white/25" />

        {/* Availability Pill */}
        <div className="absolute top-1.5 right-1.5 pointer-events-none">
          {isAvailable ? (
            <span className="px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-semibold bg-white/90 dark:bg-[#1e2320]/90 text-[#254628] dark:text-[#c8d0b7] backdrop-blur-xs shadow-2xs border border-black/5 dark:border-white/10">
              {book.availableCopies} left
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-medium bg-black/70 text-white backdrop-blur-xs shadow-2xs">
              Waitlist
            </span>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="pt-2 flex flex-col">
        {formatLabel && (
          <span className="text-[10px] font-semibold text-[#6f7f64] dark:text-[#c8d0b7]/70 uppercase tracking-wider mb-0.5">
            {formatLabel}
          </span>
        )}

        <h3
          className="font-serif font-bold text-[13px] text-[#1e2320] dark:text-[#f5f3e6] line-clamp-2 leading-[1.25] group-hover:text-[#3d4b3e] dark:group-hover:text-[#c8d0b7] group-hover:underline"
          title={book.title}
        >
          {book.title}
        </h3>

        {authorsText && (
          <p className="text-[11.5px] text-[#6f7f64] dark:text-[#c8d0b7] mt-0.5 truncate font-normal hover:underline">
            {authorsText}
          </p>
        )}
      </div>
    </div>
  )
}

