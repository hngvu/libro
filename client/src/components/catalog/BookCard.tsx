import { useState } from 'react'
import type { BookPublicResponse } from '@/types/api'
import { IconBook } from '@tabler/icons-react'

function convertIsbn13To10(isbn13: string): string | null {
  const clean = isbn13.replace(/[^0-9]/g, '')
  if (clean.length !== 13 || !clean.startsWith('978')) return null
  const body = clean.substring(3, 12)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(body[i], 10) * (10 - i)
  }
  const rem = (11 - (sum % 11)) % 11
  const checkDigit = rem === 10 ? 'X' : rem.toString()
  return body + checkDigit
}

interface BookCardProps {
  book: BookPublicResponse
  onSelect: (book: BookPublicResponse) => void
  bookmarked?: boolean
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const [imgStage, setImgStage] = useState<number>(0)

  const getCoverUrl = (): string | null => {
    if (imgStage === 0 && book.cover) {
      return book.cover
    }

    if (imgStage <= 1 && book.isbn) {
      const cleanIsbn = book.isbn.replace(/[^0-9X]/gi, '')
      const isbn10 = cleanIsbn.length === 13 ? convertIsbn13To10(cleanIsbn) : cleanIsbn
      if (isbn10 && isbn10.length === 10) {
        return `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_SX500_.jpg`
      }
    }

    if (imgStage <= 2 && book.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
    }

    return null
  }

  const coverUrl = getCoverUrl()

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
      <div className="relative aspect-[2/3] w-full rounded-[3px] bg-zinc-100 dark:bg-zinc-800 shadow-[0_2px_5px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="h-full w-full object-fill select-none"
            onError={() => setImgStage((prev) => prev + 1)}
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

      {/* Book Title & Author */}
      <div className="mt-2 text-left">
        <h4 className="font-serif font-bold text-[11px] sm:text-xs leading-snug text-[#181818] dark:text-[#f5f3e6] line-clamp-2 group-hover:text-[#1c5d3e] dark:group-hover:text-[#52a677] transition-colors">
          {book.title}
        </h4>
        {book.authors && book.authors.length > 0 && (
          <p className="text-[10px] sm:text-[10.5px] text-[#6f7f64] dark:text-[#a0b096] truncate mt-0.5">
            {book.authors.map((a) => a.name).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
