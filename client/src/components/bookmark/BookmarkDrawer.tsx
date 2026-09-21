import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import type { BookmarkResponse } from '@/types/api'
import {
  IconBookmark,
  IconX,
  IconTrash,
  IconBook,
  IconClock,
  IconCheck,
  IconArrowRight,
  IconCompass,
} from '@tabler/icons-react'

interface BookmarkDrawerProps {
  open: boolean
  onClose: () => void
  onSelectBook?: (book: { handle: string; slug?: string }) => void
}

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

function BookmarkItemCover({ bookmark }: { bookmark: BookmarkResponse }) {
  const [imgStage, setImgStage] = useState(0)

  const getCoverUrl = (): string | null => {
    if (imgStage === 0 && bookmark.bookCover) {
      return bookmark.bookCover
    }
    if (imgStage <= 1 && bookmark.isbn) {
      const cleanIsbn = bookmark.isbn.replace(/[^0-9X]/gi, '')
      const isbn10 = cleanIsbn.length === 13 ? convertIsbn13To10(cleanIsbn) : cleanIsbn
      if (isbn10 && isbn10.length === 10) {
        return `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_SX500_.jpg`
      }
    }
    if (imgStage <= 2 && bookmark.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${bookmark.isbn}-L.jpg`
    }
    return null
  }

  const coverUrl = getCoverUrl()

  return (
    <div className="relative w-16 sm:w-20 aspect-[2/3] shrink-0 rounded-[3px] bg-[#f0ede6] dark:bg-[#252c28] shadow-[0_2px_6px_rgba(0,0,0,0.14)] overflow-hidden flex items-center justify-center border border-[#d6d2c4]/60 dark:border-[#3d4b3e]">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={bookmark.bookTitle}
          className="h-full w-full object-fill select-none"
          onError={() => setImgStage((prev) => prev + 1)}
        />
      ) : (
        <div className="p-1 text-center text-[#888]">
          <IconBook size={20} className="mx-auto text-[#aaa] mb-1" />
          <span className="text-[9px] font-serif leading-none line-clamp-2">{bookmark.bookTitle}</span>
        </div>
      )}
      {/* 3D spine lighting */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[2.5px] bg-gradient-to-r from-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-[2px] w-[0.5px] bg-white/20" />
    </div>
  )
}

export function BookmarkDrawer({ open, onClose, onSelectBook }: BookmarkDrawerProps) {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [reservingId, setReservingId] = useState<number | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const fetchBookmarks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getBookmarks()
      setBookmarks(data || [])
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      setBookmarks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchBookmarks()
      // Lock body scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open, fetchBookmarks])

  // Listen for sync events
  useEffect(() => {
    const handleSync = () => {
      if (open) {
        fetchBookmarks()
      }
    }
    window.addEventListener('libro:bookmarks-changed', handleSync)
    return () => window.removeEventListener('libro:bookmarks-changed', handleSync)
  }, [open, fetchBookmarks])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleRemove = async (bookmark: BookmarkResponse) => {
    setRemovingId(bookmark.bookId)
    try {
      await api.removeBookmark(bookmark.bookId)
      setBookmarks((prev) => prev.filter((b) => b.bookId !== bookmark.bookId))
      window.dispatchEvent(
        new CustomEvent('libro:bookmarks-changed', {
          detail: { bookId: bookmark.bookId, bookmarked: false },
        })
      )
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
    } finally {
      setRemovingId(null)
    }
  }

  const handleViewDetails = (bookmark: BookmarkResponse) => {
    onClose()
    if (onSelectBook) {
      onSelectBook({ handle: bookmark.bookHandle, slug: bookmark.bookSlug })
    } else {
      navigate(`/book/${bookmark.bookHandle}/${bookmark.bookSlug || bookmark.bookHandle}`)
    }
  }

  const handleReserveOrBorrow = async (bookmark: BookmarkResponse) => {
    const isAvailable = (bookmark.availableCopies ?? 0) > 0

    if (isAvailable) {
      // Navigate to book details / activity for checkout
      handleViewDetails(bookmark)
    } else {
      // Direct reservation hold
      setReservingId(bookmark.bookId)
      setActionNotice(null)
      try {
        const res = await api.placeReservation({
          bookId: bookmark.bookId,
          bookHandle: bookmark.bookHandle,
        })
        setActionNotice(`Hold placed! Code: ${res.reservationCode}`)
        setTimeout(() => setActionNotice(null), 4000)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Reservation failed'
        setActionNotice(`Notice: ${msg}`)
        setTimeout(() => setActionNotice(null), 4000)
      } finally {
        setReservingId(null)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-drawer-title"
        className="relative w-full sm:w-[440px] md:w-[480px] h-full bg-[#faf9f4] dark:bg-[#1c221e] border-l border-[#c8d0b7] dark:border-[#3d4b3e] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out font-sans text-[#181818] dark:text-[#f5f3e6]"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#c8d0b7]/60 dark:border-[#3d4b3e] bg-[#f4f1ea]/80 dark:bg-[#232924]/80 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#3d4b3e]/10 dark:bg-[#c8d0b7]/15 flex items-center justify-center text-[#2e7d56] dark:text-[#66bb6a]">
              <IconBookmark size={18} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="bookmark-drawer-title"
                  className="font-serif font-bold text-lg leading-tight text-[#181818] dark:text-[#f5f3e6]"
                >
                  Saved Books
                </h2>
                {bookmarks.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#3d4b3e] text-white dark:bg-[#2e7d56]">
                    {bookmarks.length}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#6f7f64] dark:text-[#a0b096] mt-0.5">
                Personal reading catalog & collection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#666666] dark:text-[#a0b096] hover:text-[#181818] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close drawer"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Action Notice Banner */}
        {actionNotice && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <IconCheck size={14} className="shrink-0" />
            <span className="truncate">{actionNotice}</span>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#2e7d56] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-serif text-[#6f7f64] dark:text-[#a0b096]">
                Opening your reading collection...
              </p>
            </div>
          ) : bookmarks.length === 0 ? (
            /* Empty State with Literary Aesthetic */
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f0ede6] dark:bg-[#252c28] border border-[#c8d0b7]/60 dark:border-[#3d4b3e] flex items-center justify-center text-[#888888] dark:text-[#a0b096] shadow-inner">
                <IconBookmark size={30} stroke={1.5} />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h3 className="font-serif font-bold text-base text-[#181818] dark:text-[#f5f3e6]">
                  Your reading shelf is quiet
                </h3>
                <p className="text-xs text-[#6f7f64] dark:text-[#a0b096] leading-relaxed">
                  Bookmark titles while exploring the library to easily reserve, borrow, or revisit them later.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#f0ede6]/60 dark:bg-[#252c28]/70 border border-[#d6d2c4]/50 dark:border-[#3d4b3e]/60 text-center max-w-xs">
                <p className="font-serif italic text-xs text-[#555555] dark:text-[#c8d0b7]">
                  "There is no friend as loyal as a book."
                </p>
                <span className="text-[10px] text-[#777777] dark:text-[#888888] block mt-1">
                  — Ernest Hemingway
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/')
                }}
                className="mt-2 px-4 py-2 rounded-md bg-[#3d4b3e] hover:bg-[#2e3a2f] dark:bg-[#2e7d56] dark:hover:bg-[#256345] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <IconCompass size={14} />
                <span>Explore Catalog</span>
              </button>
            </div>
          ) : (
            /* Bookmarks List */
            <div className="space-y-3.5">
              {bookmarks.map((b) => {
                const isAvailable = (b.availableCopies ?? 0) > 0
                const authorsText =
                  b.authors && b.authors.length > 0 ? b.authors.join(', ') : 'Unknown Author'

                return (
                  <div
                    key={b.id || b.bookId}
                    className="p-3.5 rounded-lg border border-[#c8d0b7]/70 dark:border-[#3d4b3e] bg-white dark:bg-[#232924] hover:shadow-md transition-all duration-200 flex gap-3.5 group"
                  >
                    {/* Cover thumbnail */}
                    <div
                      onClick={() => handleViewDetails(b)}
                      className="cursor-pointer group-hover:opacity-90 transition-opacity shrink-0"
                    >
                      <BookmarkItemCover bookmark={b} />
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Title & Remove Button */}
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => handleViewDetails(b)}
                            className="font-serif font-bold text-sm text-[#181818] dark:text-[#f5f3e6] line-clamp-2 leading-snug cursor-pointer hover:text-[#2e7d56] dark:hover:text-[#66bb6a] transition-colors"
                          >
                            {b.bookTitle}
                          </h4>

                          <button
                            type="button"
                            onClick={() => handleRemove(b)}
                            disabled={removingId === b.bookId}
                            className="text-[#888888] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                            title="Remove bookmark"
                          >
                            {removingId === b.bookId ? (
                              <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <IconTrash size={15} />
                            )}
                          </button>
                        </div>

                        {/* Author */}
                        <p className="text-xs text-[#55634d] dark:text-[#c8d0b7] truncate mt-0.5">
                          by {authorsText}
                        </p>

                        {/* Status Badge */}
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Available ({b.availableCopies} {b.availableCopies === 1 ? 'copy' : 'copies'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Out of stock · Waitlist open
                            </span>
                          )}

                          {b.publicationYear && (
                            <span className="text-[11px] text-[#767676] dark:text-[#999]">
                              {b.publicationYear}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[#f0ede6] dark:border-[#333d36] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(b)}
                          className="flex-1 h-7 rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#1e2320] hover:bg-[#f0ede6] dark:hover:bg-[#2b332c] text-[11.5px] font-medium text-[#181818] dark:text-[#f5f3e6] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>View Details</span>
                          <IconArrowRight size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReserveOrBorrow(b)}
                          disabled={reservingId === b.bookId}
                          className={`h-7 px-3 rounded-md text-[11.5px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                            isAvailable
                              ? 'bg-[#3d4b3e] hover:bg-[#2e3a2f] text-white dark:bg-[#2e7d56] dark:hover:bg-[#256345]'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          {reservingId === b.bookId ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : isAvailable ? (
                            'Borrow'
                          ) : (
                            <>
                              <IconClock size={12} />
                              <span>Reserve</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {bookmarks.length > 0 && (
          <div className="p-3.5 px-5 border-t border-[#c8d0b7]/60 dark:border-[#3d4b3e] bg-[#f4f1ea]/80 dark:bg-[#232924]/80 flex items-center justify-between text-xs text-[#6f7f64] dark:text-[#a0b096]">
            <span>{bookmarks.length} {bookmarks.length === 1 ? 'saved book' : 'saved books'}</span>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/')
              }}
              className="font-medium text-[#2e7d56] dark:text-[#66bb6a] hover:underline cursor-pointer"
            >
              Browse more books →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
