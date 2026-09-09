import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { BookPublicResponse, BookCopyPublicResponse } from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  IconBook,
  IconBarcode,
  IconStarFilled,
  IconStar,
  IconCheck,
  IconClock,
  IconShare,
  IconChevronDown,
  IconChevronUp,
  IconThumbUp,
  IconMessageCircle,
} from '@tabler/icons-react'

interface BookDetailProps {
  initialBook?: BookPublicResponse | null
  onOpenAuth: (mode?: 'login' | 'register') => void
}

interface UserReview {
  id: string
  userName: string
  userAvatar: string
  rating: number
  date: string
  shelvedStatus: string
  comment: string
  likes: number
  likedByUser?: boolean
}

export function BookDetail({
  initialBook = null,
  onOpenAuth,
}: BookDetailProps) {
  const { handle } = useParams<{ handle: string; slug?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [book, setBook] = useState<BookPublicResponse | null>(initialBook)
  const [loadingBook, setLoadingBook] = useState(!initialBook && !!handle)

  const [copies, setCopies] = useState<BookCopyPublicResponse[]>([])
  const [loadingCopies, setLoadingCopies] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [authorBioExpanded, setAuthorBioExpanded] = useState(false)
  const [bookDetailsExpanded, setBookDetailsExpanded] = useState(false)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)

  const [shelfStatus, setShelfStatus] = useState<'want_to_read' | 'currently_reading' | 'read' | null>(null)
  const [shelfDropdownOpen, setShelfDropdownOpen] = useState(false)
  const [buyDropdownOpen, setBuyDropdownOpen] = useState(false)

  const [userRating, setUserRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)

  const [newReviewText, setNewReviewText] = useState('')
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const [reviews, setReviews] = useState<UserReview[]>([])

  useEffect(() => {
    if (handle) {
      setLoadingBook(true)
      api.getBookByHandle(handle)
        .then((res) => setBook(res))
        .catch(() => setBook(null))
        .finally(() => setLoadingBook(false))
    } else if (initialBook) {
      setBook(initialBook)
    }
  }, [handle, initialBook])

  useEffect(() => {
    const bookHandle = book?.handle || handle
    if (bookHandle) {
      setLoadingCopies(true)
      api.getBookCopies(bookHandle)
        .then((res) => setCopies(res.content || []))
        .catch(() => setCopies([]))
        .finally(() => setLoadingCopies(false))
    }
  }, [book?.handle, handle])

  useEffect(() => {
    setReviews([
      {
        id: '1',
        userName: 'Eleanor Vance',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'May 14, 2025',
        shelvedStatus: 'Read',
        comment: `An extraordinary and deeply affecting read. The prose carries a quiet, luminous dignity from the very first chapter. It completely exceeded my expectations and I couldn't put it down over the weekend!`,
        likes: 34,
      },
      {
        id: '2',
        userName: 'Marcus Sterling',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        rating: 4,
        date: 'April 02, 2025',
        shelvedStatus: 'Read',
        comment: `Atmospheric and richly characterized. While the pacing in the middle third takes its time, the thematic payoff in the closing chapters makes every single page worth the journey. A library gem.`,
        likes: 19,
      },
    ])
  }, [book?.handle, handle])

  if (loadingBook) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="w-10 h-10 border-3 border-[#382110] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-serif text-[#666666]">Loading book details...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <IconBook size={56} className="mx-auto text-[#382110]" />
        <h2 className="font-serif font-bold text-2xl text-[#181818]">Book Not Found</h2>
        <p className="text-xs text-[#666666]">The book you are looking for does not exist.</p>
        <Button onClick={() => navigate('/')}>Return to Catalog</Button>
      </div>
    )
  }

  const hash = (book.isbn || book.handle).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const avgRating = (4.1 + (hash % 8) / 10).toFixed(2)
  const ratingsCount = 120000 + ((hash * 43) % 250000)
  const reviewsCount = Math.floor(ratingsCount / 53)
  const currentlyReadingCount = 12000 + (hash % 18000)
  const wantToReadCount = 65000 + (hash % 45000)
  const authorFollowers = (35 + (hash % 50)).toFixed(1)
  const authorBooksCount = 24 + (hash % 120)

  const estimatedPages = 320 + (hash % 280)
  const bookFormat = book.format === 'EBOOK' ? 'E-Book' : book.format === 'HARDCOVER' ? 'Hardcover' : 'Paperback'
  const publicationDate = `Published ${book.publicationYear || 2003}${book.publisher ? ' by ' + book.publisher.name : ''}`

  const authorsList = book.authors && book.authors.length > 0 ? book.authors : []
  const genresList = book.genres && book.genres.length > 0 ? book.genres : []

  const ratingBars = [
    { stars: 5, pct: 52 + (hash % 20) },
    { stars: 4, pct: 26 + (hash % 10) },
    { stars: 3, pct: 12 + (hash % 6) },
    { stars: 2, pct: 5 + (hash % 4) },
    { stars: 1, pct: 3 + (hash % 3) },
  ]
  const totalPct = ratingBars.reduce((s, r) => s + r.pct, 0)

  const ratingTooltips = ['did not like it', 'it was ok', 'liked it', 'really liked it', 'it was amazing']

  const handleToggleLike = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const liked = !r.likedByUser
          return { ...r, likedByUser: liked, likes: liked ? r.likes + 1 : r.likes - 1 }
        }
        return r
      })
    )
  }

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReviewText.trim()) return
    if (!user) { onOpenAuth('login'); return }
    const newRev: UserReview = {
      id: Date.now().toString(),
      userName: user.fullName || user.username,
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      rating: newReviewRating,
      date: 'Just now',
      shelvedStatus: shelfStatus ? (shelfStatus === 'read' ? 'Read' : 'Currently Reading') : 'Reviewed',
      comment: newReviewText.trim(),
      likes: 0,
    }
    setReviews([newRev, ...reviews])
    setNewReviewText('')
    setShowReviewForm(false)
  }

  const StarRow = ({ rating, size = 16 }: { rating: number; size?: number }) => {
    const full = Math.round(rating)
    return (
      <div className="flex items-center gap-px text-[#e77600]">
        {[1, 2, 3, 4, 5].map((s) =>
          s <= full ? <IconStarFilled key={s} size={size} /> : <IconStar key={s} size={size} strokeWidth={1.5} />
        )}
      </div>
    )
  }

  return (
    <div className="w-full animate-in fade-in duration-150">
      <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] lg:grid-cols-[210px_1fr] gap-8 lg:gap-10 items-start">

        {/* ===== LEFT STICKY COLUMN ===== */}
        <div className="md:sticky md:top-6 flex flex-col items-center md:items-start gap-3">
          {/* Cover */}
          <div className="w-[165px] sm:w-[185px] aspect-[2/3] rounded-[4px] bg-[#ebe7d9] shadow-[3px_4px_12px_rgba(0,0,0,0.22)] border border-black/10 overflow-hidden flex items-center justify-center shrink-0">
            {book.cover ? (
              <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="p-5 text-center text-[#555] flex flex-col items-center justify-center">
                <IconBook size={48} className="mb-2 text-[#777]" />
                <span className="font-serif font-bold text-xs tracking-wide">{book.title}</span>
              </div>
            )}
          </div>

          {/* Want to Read */}
          <div className="w-[165px] sm:w-[185px] relative">
              <div className="flex h-[38px] rounded-sm bg-[#409D69] hover:bg-[#38875c] text-white shadow-sm transition-colors overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { onOpenAuth('login'); return }
                    setShelfStatus(shelfStatus === 'want_to_read' ? null : 'want_to_read')
                  }}
                  className="flex-1 px-3 text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none"
                >
                  {shelfStatus === 'want_to_read' ? <><IconCheck size={14} /> Want to Read</>
                    : shelfStatus === 'currently_reading' ? <><IconClock size={14} /> Currently Reading</>
                    : shelfStatus === 'read' ? <><IconCheck size={14} /> Read</>
                    : 'Want to Read'}
                </button>
                <button
                  type="button"
                  onClick={() => setShelfDropdownOpen(!shelfDropdownOpen)}
                  className="px-2.5 border-l border-white/25 hover:bg-black/15 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <IconChevronDown size={14} />
                </button>
              </div>
              {shelfDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShelfDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 rounded border border-[#d0cdc4] bg-white shadow-lg py-1 z-50 text-[13px]">
                    {(['want_to_read', 'currently_reading', 'read'] as const).map((s) => (
                      <button key={s} onClick={() => { setShelfStatus(s); setShelfDropdownOpen(false) }}
                        className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-[#f4f1ea] ${shelfStatus === s ? 'font-semibold text-[#409D69]' : 'text-[#333]'}`}>
                        <span>{s === 'want_to_read' ? 'Want to Read' : s === 'currently_reading' ? 'Currently Reading' : 'Read'}</span>
                        {shelfStatus === s && <IconCheck size={13} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Borrow */}
            <div className="w-[165px] sm:w-[185px] relative">
              <div className="flex h-[38px] rounded-sm border border-[#767676] bg-white hover:bg-[#f4f1ea] text-[#333] transition-colors overflow-hidden">
                <button type="button" onClick={() => setBookDetailsExpanded(true)}
                  className="flex-1 px-3 text-[12px] font-semibold flex items-center justify-center cursor-pointer select-none">
                  Borrow from Library
                </button>
                <button type="button" onClick={() => setBuyDropdownOpen(!buyDropdownOpen)}
                  className="px-2.5 border-l border-[#767676]/30 hover:bg-[#e8e5de] flex items-center justify-center cursor-pointer transition-colors">
                  <IconChevronDown size={13} />
                </button>
              </div>
              {buyDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBuyDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 rounded border border-[#d0cdc4] bg-white shadow-lg py-1 z-50 text-[13px]">
                    <button onClick={() => { setBuyDropdownOpen(false); navigate('/loans') }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea] text-[#333] font-medium">
                      My Bookshelf &amp; Loans
                    </button>
                    <button onClick={() => { setBuyDropdownOpen(false); window.open(`https://www.amazon.com/s?k=${encodeURIComponent(book.title)}`, '_blank') }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea] text-[#666]">
                      Buy on Amazon
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Rate this book */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <p className="text-[11px] text-[#767676] tracking-wide uppercase">Rate this book</p>
              <div className="flex items-center gap-0.5 text-[#ccc]">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = hoverRating ? star <= hoverRating : star <= userRating
                  return (
                    <button key={star} type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => { if (!user) { onOpenAuth('login'); return }; setUserRating(star === userRating ? 0 : star) }}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                      title={ratingTooltips[star - 1]}>
                      {filled
                        ? <IconStarFilled size={22} className="text-[#e77600]" />
                        : <IconStar size={22} strokeWidth={1.5} className="hover:text-[#e77600] transition-colors" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ===== RIGHT MAIN COLUMN ===== */}
          <div>
            {/* Title */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="font-serif font-bold text-[28px] sm:text-[32px] text-[#181818] leading-[1.15] tracking-[-0.01em]">
                {book.title}
              </h1>
              <button type="button"
                onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(window.location.href); alert('Link copied!') } }}
                className="p-1.5 text-[#666] hover:text-[#181818] rounded hover:bg-black/5 transition-colors cursor-pointer shrink-0 mt-1.5">
                <IconShare size={18} />
              </button>
            </div>

            {/* Author */}
            <div className="text-[15px] text-[#333] font-serif mb-4">
              {authorsList.length > 0 ? (
                <span>by {authorsList.map((a, idx) => (
                  <span key={a.handle || idx}>
                    <button type="button" onClick={() => navigate(`/?keyword=${encodeURIComponent(a.name)}`)}
                      className="text-[#333] hover:underline cursor-pointer font-semibold">{a.name}</button>
                    {idx < authorsList.length - 1 && <span className="text-[#767676]">, </span>}
                  </span>
                ))}</span>
              ) : <span className="text-[#767676]">Unknown Author</span>}
            </div>

            {/* Rating row */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="flex items-center gap-px text-[#e77600]">
                {[1, 2, 3, 4, 5].map((s) =>
                  s <= Math.round(parseFloat(avgRating))
                    ? <IconStarFilled key={s} size={16} />
                    : <IconStar key={s} size={16} strokeWidth={1.5} />
                )}
              </div>
              <span className="font-serif font-bold text-[19px] text-[#181818] leading-none">{avgRating}</span>
              <span className="text-[13px] text-[#767676]">
                {ratingsCount.toLocaleString()} ratings &middot; {reviewsCount.toLocaleString()} reviews
              </span>
            </div>

            {/* Description */}
            <div className="mb-5 text-[14px] leading-[1.7] text-[#333]">
              <p className={descriptionExpanded ? '' : 'line-clamp-4'}>
                {book.description || `Explore ${book.title}, an engaging work in the Libro catalog.`}
              </p>
              {book.description && book.description.length > 220 && (
                <button type="button" onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#382110] hover:underline cursor-pointer mt-1">
                  {descriptionExpanded ? <>Show less <IconChevronUp size={13} /></> : '...more'}
                </button>
              )}
            </div>

            {/* Genres - authentic Goodreads tag list */}
            {genresList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-[14px] text-[#767676] font-sans mr-0.5">Genres</span>
                {genresList.map((g) => (
                  <button
                    key={g.handle || g.name}
                    type="button"
                    onClick={() => navigate(`/?genre=${encodeURIComponent(g.handle)}`)}
                    className="px-3.5 py-1 rounded-full border border-[#d8d5ce] bg-transparent hover:bg-black/5 text-[#181818] text-[13px] font-medium hover:underline transition-colors cursor-pointer"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="text-[13px] text-[#767676] mb-1">
              <p><span className="text-[#333] font-medium">{estimatedPages}</span> pages &middot; {bookFormat}</p>
              <p>{publicationDate}</p>
            </div>

            {/* Book details accordion */}
            <div className="mb-6">
              <button type="button" onClick={() => setBookDetailsExpanded(!bookDetailsExpanded)}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#382110] hover:underline cursor-pointer mt-1">
                Book details &amp; editions
                {bookDetailsExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
              </button>
              {bookDetailsExpanded && (
                <div className="mt-3 p-4 bg-white border border-[#ddd] rounded text-xs space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                    <div><span className="text-[#767676] block mb-0.5">ISBN</span><span className="font-mono font-medium">{book.isbn || 'N/A'}</span></div>
                    <div><span className="text-[#767676] block mb-0.5">Language</span><span className="font-medium">English</span></div>
                    <div><span className="text-[#767676] block mb-0.5">Identifier</span><span className="font-mono font-medium">{book.handle}</span></div>
                    <div><span className="text-[#767676] block mb-0.5">Format</span><span className="font-medium">{bookFormat}</span></div>
                    <div><span className="text-[#767676] block mb-0.5">Available</span><span className="font-semibold text-[#409D69]">{book.availableCopies} of {book.totalCopies} copies</span></div>
                    {book.publisher && <div><span className="text-[#767676] block mb-0.5">Publisher</span><span className="font-medium">{book.publisher.name}</span></div>}
                  </div>
                  <div className="pt-2 border-t border-[#e8e8e8]">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-[#767676] mb-2 flex items-center gap-1">
                      <IconBarcode size={13} /> Shelf Barcodes ({copies.length})
                    </p>
                    {loadingCopies ? <p className="text-[11px] text-[#767676]">Loading...</p>
                      : copies.length === 0 ? <p className="text-[11px] text-[#767676]">No physical copies registered.</p>
                      : (
                        <div className="flex flex-wrap gap-1.5">
                          {copies.map((c) => (
                            <span key={c.barcode} className="px-2 py-0.5 rounded bg-[#f9f7f4] border border-[#d0d0d0] font-mono text-[11px] flex items-center gap-1">
                              {c.barcode}
                              <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'}`} title={c.status} />
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#dedbd5] my-6" />

            {/* Social reading stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-[13px] text-[#333]">
              {[
                { srcs: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'], label: `${currentlyReadingCount.toLocaleString()} currently reading` },
                { srcs: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80'], label: `${wantToReadCount.toLocaleString()} want to read` },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="flex -space-x-2.5 shrink-0">
                    {stat.srcs.map((src, j) => <img key={j} src={src} alt="" className="h-7 w-7 rounded-full ring-2 ring-white object-cover" />)}
                  </div>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#dedbd5] my-6" />

            {/* About the author */}
            {authorsList.length > 0 && (
              <>
                <h2 className="font-serif font-bold text-[20px] text-[#181818] mb-4">
                  About the author{authorsList.length > 1 ? 's' : ''}
                </h2>
                {authorsList.map((author) => {
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=409D69&color=fff&size=160&bold=true`
                  return (
                    <div key={author.handle || author.name} className="flex gap-4 mb-6">
                      <img src={avatarUrl} alt={author.name} className="h-16 w-16 rounded-full object-cover border border-black/10 shadow-xs shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div>
                            <h3 onClick={() => navigate(`/?keyword=${encodeURIComponent(author.name)}`)}
                              className="font-bold text-[15px] text-[#181818] hover:underline cursor-pointer">{author.name}</h3>
                            <p className="text-[12px] text-[#767676]">{authorBooksCount} books &middot; {authorFollowers}k followers</p>
                          </div>
                          <button type="button" onClick={() => setIsFollowingAuthor(!isFollowingAuthor)}
                            className={`px-4 py-1.5 rounded-sm text-[12px] font-semibold border transition-colors cursor-pointer shrink-0 ${isFollowingAuthor ? 'bg-[#409D69] text-white border-[#409D69]' : 'bg-white text-[#333] border-[#767676] hover:border-[#333]'}`}>
                            {isFollowingAuthor ? 'Following' : 'Follow'}
                          </button>
                        </div>
                        {author.biography && (
                          <div className="text-[13px] leading-[1.65] text-[#444]">
                            <p className={authorBioExpanded ? '' : 'line-clamp-3'}>{author.biography}</p>
                            {author.biography.length > 150 && (
                              <button type="button" onClick={() => setAuthorBioExpanded(!authorBioExpanded)}
                                className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#382110] hover:underline cursor-pointer mt-0.5">
                                {authorBioExpanded ? <>Show less <IconChevronUp size={13} /></> : '...more'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div className="border-t border-[#dedbd5] my-6" />
              </>
            )}

            {/* ===== RATINGS & REVIEWS ===== */}
            <div id="ReviewsSection">
              <h2 className="font-serif font-bold text-[20px] text-[#181818] mb-5">Ratings &amp; Reviews</h2>

              {/* Rating histogram */}
              <div className="flex gap-6 items-start mb-6">
                <div className="flex flex-col items-center shrink-0">
                  <span className="font-serif font-bold text-[52px] leading-none text-[#181818]">{avgRating}</span>
                  <StarRow rating={parseFloat(avgRating)} size={16} />
                  <span className="text-[12px] text-[#767676] mt-1">{ratingsCount.toLocaleString()} ratings</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1.5 pt-1">
                  {ratingBars.map((bar) => {
                    const pct = Math.round((bar.pct / totalPct) * 100)
                    return (
                      <div key={bar.stars} className="flex items-center gap-2 text-[12px] text-[#767676]">
                        <span className="w-3 text-right shrink-0">{bar.stars}</span>
                        <IconStarFilled size={11} className="text-[#e77600] shrink-0" />
                        <div className="flex-1 h-[8px] bg-[#e8e5de] rounded-full overflow-hidden">
                          <div className="h-full bg-[#e77600] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-7 text-right shrink-0">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Community Reviews header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-semibold text-[17px] text-[#181818]">Community Reviews</h3>
                  <p className="text-[12px] text-[#767676]">Showing {reviews.length} reviews</p>
                </div>
                {!showReviewForm && (
                  <button type="button"
                    onClick={() => { if (!user) { onOpenAuth('login'); return }; setShowReviewForm(true) }}
                    className="px-4 py-1.5 rounded-sm border border-[#409D69] text-[12px] font-semibold text-[#409D69] hover:bg-[#409D69] hover:text-white transition-colors cursor-pointer">
                    Write a review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <form onSubmit={handleAddReview} className="p-4 bg-white border border-[#ddd] rounded space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[13px]">Rate &amp; review {book.title}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setNewReviewRating(s)} className="text-[#e77600] cursor-pointer">
                          {s <= newReviewRating ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea required rows={3} value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Write your thoughts about this book..."
                    className="w-full text-[13px] p-3 rounded border border-[#d0d0d0] bg-white text-[#181818] focus:outline-none focus:ring-1 focus:ring-[#409D69]" />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="bg-[#409D69] hover:bg-[#38875c] text-white">Post Review</Button>
                  </div>
                </form>
              )}

              {/* Reviews */}
              <div className="divide-y divide-[#e8e5de]">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-5">
                    <div className="flex items-start gap-3">
                      <img src={rev.userAvatar} alt={rev.userName} className="h-10 w-10 rounded-full object-cover border border-[#e0e0e0] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-[13px] text-[#181818] hover:underline cursor-pointer">{rev.userName}</span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <IconStarFilled key={i} size={13} className={i < rev.rating ? 'text-[#e77600]' : 'text-[#d8d5ce]'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[12px] text-[#767676] mb-2">shelved as <strong>{rev.shelvedStatus}</strong> &middot; {rev.date}</p>
                        <p className="text-[13px] text-[#333] leading-relaxed">{rev.comment}</p>
                        <div className="flex items-center gap-4 text-[12px] text-[#767676] mt-2">
                          <button type="button" onClick={() => handleToggleLike(rev.id)}
                            className={`flex items-center gap-1 hover:text-[#333] cursor-pointer ${rev.likedByUser ? 'text-rose-600 font-semibold' : ''}`}>
                            <IconThumbUp size={13} /> {rev.likes} {rev.likes === 1 ? 'like' : 'likes'}
                          </button>
                          <button type="button" onClick={() => alert('Comments coming soon!')}
                            className="flex items-center gap-1 hover:text-[#333] cursor-pointer">
                            <IconMessageCircle size={13} /> Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
