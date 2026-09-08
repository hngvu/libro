import type { BookPublicResponse } from '@/types/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBook, IconStarFilled, IconEye } from '@tabler/icons-react'

interface BookCardProps {
  book: BookPublicResponse
  onSelect: (book: BookPublicResponse) => void
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const isAvailable = book.availableCopies > 0

  // Derived mock rating based on handle/isbn hash for that Goodreads feel
  const hash = (book.isbn || book.handle).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = (3.8 + (hash % 12) / 10).toFixed(2)
  const ratingsCount = 120 + (hash % 1400)

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-200 border-[#c8d0b7] dark:border-[#3d4b3e] hover:border-[#6f7f64] bg-[#faf9f4] dark:bg-[#252c28] p-4">
      <div className="flex gap-4">
        {/* Goodreads 3D-feel Book Cover */}
        <div
          onClick={() => onSelect(book)}
          className="relative shrink-0 w-24 h-36 bg-[#c8d0b7]/30 dark:bg-[#1e2320] rounded-sm overflow-hidden book-shadow cursor-pointer transition-transform duration-200 group-hover:-translate-y-1 flex items-center justify-center border-l-2 border-black/20"
        >
          {book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-[#6f7f64]">
              <IconBook size={28} className="mb-1 text-[#6f7f64]/70" />
              <span className="text-[9px] font-serif font-bold uppercase tracking-wider text-[#3d4b3e] dark:text-[#c8d0b7]">Libro</span>
            </div>
          )}
        </div>

        {/* Book Details (Goodreads layout) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3
              onClick={() => onSelect(book)}
              className="font-serif font-bold text-sm sm:text-base text-[#1e2320] dark:text-[#f5f3e6] line-clamp-2 hover:underline cursor-pointer leading-snug"
              title={book.title}
            >
              {book.title}
            </h3>

            {/* Author / Edition */}
            <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1 truncate">
              {book.edition ? `${book.edition}` : 'Library Edition'} • {book.publicationYear || 'N/A'}
            </p>

            {/* Goodreads Star Rating */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#1e2320] dark:text-[#f5f3e6]">
              <div className="flex items-center text-amber-500">
                <IconStarFilled size={13} />
                <IconStarFilled size={13} />
                <IconStarFilled size={13} />
                <IconStarFilled size={13} />
                <IconStarFilled size={13} className="text-amber-300 dark:text-amber-700" />
              </div>
              <span className="font-semibold text-xs">{rating}</span>
              <span className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] hidden sm:inline">
                ({ratingsCount.toLocaleString()} ratings)
              </span>
            </div>

            {/* Snippet */}
            {book.description && (
              <p className="mt-2 text-xs text-[#3d4b3e]/85 dark:text-[#c8d0b7]/90 line-clamp-2 leading-relaxed">
                {book.description}
              </p>
            )}
          </div>

          {/* Bottom Bar: Availability & Action Button */}
          <div className="mt-3 pt-2 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Badge
                variant={isAvailable ? 'success' : 'destructive'}
                className="text-[10px] py-0 px-2 font-medium"
              >
                {isAvailable ? `${book.availableCopies} of ${book.totalCopies} available` : 'All checked out'}
              </Badge>
              {book.format && (
                <span className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] hidden sm:inline">
                  {book.format}
                </span>
              )}
            </div>

            <Button
              size="sm"
              variant="default"
              onClick={() => onSelect(book)}
              className="h-7 text-xs px-2.5 gap-1 shadow-xs"
            >
              <IconEye size={13} />
              Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
