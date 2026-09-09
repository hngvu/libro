import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { BookPublicResponse, GenrePublicResponse } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconSearch,
  IconClock,
  IconDashboard,
  IconUser,
  IconLogout,
  IconLogin,
  IconUserPlus,
  IconChevronDown,
  IconX,
  IconBook,
  IconBell,
} from '@tabler/icons-react'

interface NavbarProps {
  currentView: 'catalog' | 'loans' | 'admin'
  onViewChange: (view: 'catalog' | 'loans' | 'admin') => void
  onOpenAuth: (mode?: 'login' | 'register') => void
  onOpenProfile: () => void
  onSearch: (keyword: string) => void
  onSelectBook: (book: BookPublicResponse) => void
  onSelectGenre: (genreHandle: string) => void
  searchKeyword?: string
}

export function Navbar({
  currentView,
  onViewChange,
  onOpenAuth,
  onOpenProfile,
  onSearch,
  onSelectBook,
  onSelectGenre,
  searchKeyword = '',
}: NavbarProps) {
  const { user, logout, canAccessAdmin } = useAuth()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [browseDropdownOpen, setBrowseDropdownOpen] = useState(false)
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])

  // Header Search Autocomplete State
  const [searchTerm, setSearchTerm] = useState(searchKeyword)
  const [suggestions, setSuggestions] = useState<BookPublicResponse[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Sync external search keyword
  useEffect(() => {
    setSearchTerm(searchKeyword)
  }, [searchKeyword])

  // Load genres for "Browse" dropdown
  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.content || []))
      .catch(() => setGenres([]))
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced real-time search for header autocomplete
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await api.getBooks({ keyword: searchTerm.trim(), size: 5 })
        setSuggestions(res.content || [])
        setShowDropdown(true)
      } catch {
        setSuggestions([])
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowDropdown(false)
    onSearch(searchTerm.trim())
    onViewChange('catalog')
  }

  const handleSelectSuggestion = (book: BookPublicResponse) => {
    setShowDropdown(false)
    onSelectBook(book)
  }

  const handleGenreClick = (handle: string) => {
    setBrowseDropdownOpen(false)
    onSelectGenre(handle)
    onViewChange('catalog')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#f5f3e6] dark:bg-[#1e2320] shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Goodreads Typography Logo & Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {/* Authentic Goodreads-style lowercase serif logo */}
          <div
            onClick={() => {
              onSearch('')
              onSelectGenre('')
              onViewChange('catalog')
            }}
            className="flex items-baseline gap-1 cursor-pointer select-none group"
            title="Libro - Discover & Read Books"
          >
            <span className="font-serif font-bold text-2xl tracking-tighter text-[#382110] dark:text-[#f5f3e6] group-hover:text-[#3d4b3e] transition-colors">
              libro
            </span>
            <span className="font-serif font-light text-xs text-[#6f7f64] dark:text-[#c8d0b7] tracking-tight">
              reads
            </span>
          </div>

          {/* Goodreads Main Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => {
                onSearch('')
                onSelectGenre('')
                onViewChange('catalog')
              }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentView === 'catalog' && !searchKeyword
                  ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                  : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40'
              }`}
            >
              Home
            </button>

            {user && (
              <button
                onClick={() => onViewChange('loans')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'loans'
                    ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                    : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40'
                }`}
              >
                <IconClock size={16} />
                My Books
              </button>
            )}

            {/* "Browse ▾" Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBrowseDropdownOpen(!browseDropdownOpen)}
                className="px-3 py-1.5 rounded-md text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Browse</span>
                <IconChevronDown size={14} className="text-[#6f7f64]" />
              </button>

              {browseDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBrowseDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-xs font-serif font-bold uppercase text-[#6f7f64] border-b border-[#c8d0b7]/50 pb-1.5 mb-1">
                      Browse by Genre
                    </div>
                    <button
                      onClick={() => handleGenreClick('')}
                      className="w-full text-left px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      All Books & Genres
                    </button>
                    {genres.map((g) => (
                      <button
                        key={g.handle}
                        onClick={() => handleGenreClick(g.handle)}
                        className="w-full text-left px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 rounded-lg transition-colors cursor-pointer"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Admin Desk Link */}
            {canAccessAdmin && (
              <button
                onClick={() => onViewChange('admin')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                    : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40'
                }`}
              >
                <IconDashboard size={16} />
                Admin Desk
              </button>
            )}
          </nav>
        </div>

        {/* Center: Prominent Goodreads Search Bar */}
        <div ref={searchContainerRef} className="flex-1 max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true)
              }}
              className="w-full h-9.5 pl-3.5 pr-10 text-xs sm:text-sm bg-white dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-md shadow-xs focus:outline-none focus:ring-2 focus:ring-[#6f7f64] text-[#1e2320] dark:text-[#f5f3e6] placeholder:text-[#6f7f64]/70 transition-all font-sans"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  onSearch('')
                  setShowDropdown(false)
                }}
                className="absolute right-9 p-1 text-[#6f7f64] hover:text-[#1e2320] cursor-pointer"
              >
                <IconX size={14} />
              </button>
            ) : null}
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-2 text-[#6f7f64] hover:text-[#3d4b3e] dark:hover:text-[#f5f3e6] flex items-center justify-center cursor-pointer transition-colors"
              title="Search"
            >
              <IconSearch size={17} />
            </button>
          </form>

          {/* Real-time Goodreads Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-98">
              <div className="p-2 border-b border-[#c8d0b7]/40 text-[11px] font-semibold text-[#6f7f64] flex justify-between items-center bg-[#faf9f4] dark:bg-[#1e2320]/60">
                <span>Matching Titles</span>
                {searchLoading && <span className="animate-pulse">Searching...</span>}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[#c8d0b7]/30">
                {suggestions.map((b) => (
                  <div
                    key={b.handle}
                    onClick={() => handleSelectSuggestion(b)}
                    className="p-2.5 flex items-center gap-3 hover:bg-[#c8d0b7]/20 dark:hover:bg-[#3d4b3e]/30 cursor-pointer transition-colors"
                  >
                    <div className="w-9 h-13 bg-[#c8d0b7]/30 rounded-xs book-shadow overflow-hidden shrink-0 flex items-center justify-center border-l border-black/20">
                      {b.cover ? (
                        <img src={b.cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <IconBook size={16} className="text-[#6f7f64]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold text-xs text-[#1e2320] dark:text-[#f5f3e6] truncate hover:underline">
                        {b.title}
                      </p>
                      <p className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] mt-0.5">
                        {b.edition || '1st Edition'} • {b.publicationYear || 'N/A'}
                      </p>
                    </div>
                    <Badge
                      variant={b.availableCopies > 0 ? 'success' : 'destructive'}
                      className="text-[9px] py-0 px-1.5 shrink-0"
                    >
                      {b.availableCopies > 0 ? `${b.availableCopies} avail` : 'Out'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div
                onClick={handleSearchSubmit}
                className="p-2 bg-[#faf9f4] dark:bg-[#1e2320]/80 border-t border-[#c8d0b7]/40 text-center text-xs font-semibold text-[#3d4b3e] dark:text-[#c8d0b7] hover:underline cursor-pointer"
              >
                Press Enter to view all results for "{searchTerm}"
              </div>
            </div>
          )}
        </div>

        {/* Right: User Menu & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] rounded-full hover:bg-[#c8d0b7]/30 transition-colors hidden sm:block cursor-pointer"
                title="Notifications"
              >
                <IconBell size={18} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 transition-colors border border-[#c8d0b7] dark:border-[#3d4b3e] cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-[#3d4b3e] text-[#f5f3e6] font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-xs text-[#1e2320] dark:text-[#f5f3e6] hidden md:inline truncate max-w-[100px]">
                    {user.fullName || user.username}
                  </span>
                  <IconChevronDown size={14} className="text-[#6f7f64]" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-[#c8d0b7]/50 dark:border-[#3d4b3e] mb-1">
                        <p className="text-xs font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6]">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] truncate">
                          {user.email}
                        </p>
                        <div className="mt-1">
                          <Badge
                            variant={
                              user.role === 'ADMIN'
                                ? 'destructive'
                                : user.role === 'LIBRARIAN'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-[9px] py-0 px-1.5"
                          >
                            {user.role}
                          </Badge>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onOpenProfile()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <IconUser size={15} /> Account Settings
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onViewChange('loans')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <IconClock size={15} /> My Bookshelf & Loans
                      </button>

                      {canAccessAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            onViewChange('admin')
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          <IconDashboard size={15} /> Library Administration
                        </button>
                      )}

                      <div className="my-1 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <IconLogout size={15} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth('login')}
                className="gap-1 text-xs font-semibold px-2 sm:px-3"
              >
                <IconLogin size={15} /> Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenAuth('register')}
                className="gap-1 text-xs font-semibold px-2 sm:px-3"
              >
                <IconUserPlus size={15} /> Join
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
