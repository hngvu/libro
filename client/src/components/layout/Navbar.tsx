import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { BookPublicResponse, GenrePublicResponse } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import {
  IconSearch,
  IconClock,
  IconDashboard,
  IconUser,
  IconLogout,
  IconChevronDown,
  IconX,
  IconBook,
  IconBell,
  IconShieldLock,
} from '@tabler/icons-react'

interface NavbarProps {
  currentView: 'catalog' | 'loans' | 'admin' | 'book-detail'
  onViewChange: (view: 'catalog' | 'loans' | 'admin' | 'book-detail') => void
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
    <header className="sticky top-0 z-40 w-full border-b border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#fafafa] dark:bg-[#1e2320] shadow-xs transition-colors">
      <div className="max-w-[1060px] mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Logo & Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {/* Logo only */}
          <div
            onClick={() => {
              onSearch('')
              onSelectGenre('')
              onViewChange('catalog')
            }}
            className="flex items-center cursor-pointer select-none group"
            title="Libro"
          >
            <img
              src="/favicon.svg"
              alt="Libro logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Goodreads Main Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
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

            {canAccessAdmin && (
              <button
                onClick={() => onViewChange('admin')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-[#3d4b3e] text-[#f5f3e6] font-semibold'
                    : 'text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40'
                }`}
              >
                <IconShieldLock size={16} />
                Staff Desk
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
              placeholder="Search books"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true)
              }}
              className={`w-full h-9 sm:h-10 pl-3 sm:pl-3.5 ${
                searchTerm ? 'pr-14 sm:pr-16' : 'pr-8 sm:pr-10'
              } text-xs sm:text-sm bg-white dark:bg-[#252c28] border border-[#d8d8d8] dark:border-[#3d4b3e] focus:outline-none focus:border-[#999999] text-[#181818] dark:text-[#f5f3e6] placeholder:text-[#767676] transition-colors font-sans ${
                showDropdown && suggestions.length > 0 ? 'rounded-t-sm rounded-b-none border-b-transparent' : 'rounded-sm shadow-xs'
              }`}
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  onSearch('')
                  setShowDropdown(false)
                }}
                className="absolute right-8 sm:right-10 p-1 text-[#767676] hover:text-[#181818] cursor-pointer"
              >
                <IconX size={14} className="sm:w-[15px] sm:h-[15px]" />
              </button>
            ) : null}
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-2 sm:px-3 text-[#333333] dark:text-[#c8d0b7] hover:text-black dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Search"
            >
              {searchLoading ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#00635d] border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconSearch size={18} className="sm:w-[19px] sm:h-[19px]" stroke={1.75} />
              )}
            </button>
          </form>

          {/* Real-time Goodreads Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-0 bg-white dark:bg-[#252c28] border border-[#d8d8d8] dark:border-[#3d4b3e] border-t-0 rounded-b-sm shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-99">
              <div className="max-h-80 overflow-y-auto divide-y divide-[#e8e8e8] dark:divide-[#3d4b3e]">
                {suggestions.map((b) => (
                  <div
                    key={b.handle}
                    onClick={() => handleSelectSuggestion(b)}
                    className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3.5 hover:bg-[#f4f1ea]/60 dark:hover:bg-[#333d36] cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f0ede6] dark:bg-[#1e2320] shrink-0 overflow-hidden flex items-center justify-center">
                      {b.cover ? (
                        <img src={b.cover} alt={b.title} className="h-full w-full object-cover object-top" />
                      ) : (
                        <IconBook size={18} className="sm:w-5 sm:h-5 text-[#888888]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold text-xs sm:text-[14.5px] leading-snug text-[#181818] dark:text-[#f5f3e6] truncate">
                        {b.title}
                      </p>
                      <p className="font-serif text-[11px] sm:text-[13.5px] text-[#333333] dark:text-[#c8d0b7] mt-0.5 truncate">
                        by {b.authors && b.authors.length > 0
                          ? b.authors.map((a) => a.name).join(', ')
                          : 'Unknown Author'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div
                onClick={handleSearchSubmit}
                className="py-2 sm:py-2.5 px-2 bg-white dark:bg-[#252c28] border-t border-[#e8e8e8] dark:border-[#3d4b3e] text-center text-xs sm:text-[14px] font-medium text-[#00635d] dark:text-[#4db6ac] hover:underline cursor-pointer"
              >
                Show all results for "{searchTerm}"
              </div>
            </div>
          )}
        </div>

        {/* Right: User Menu & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
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
                  className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-2 pr-1.5 sm:pr-2.5 rounded-full hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 transition-colors border border-[#c8d0b7] dark:border-[#3d4b3e] cursor-pointer"
                >
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[#3d4b3e] text-[#f5f3e6] font-bold text-xs flex items-center justify-center shadow-xs">
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
                          if (currentView === 'admin') {
                            onViewChange('catalog')
                          }
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
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="text-sm sm:text-base font-semibold text-[#1e2320] dark:text-[#f5f3e6] hover:text-[#3d4b3e] dark:hover:text-[#c8d0b7] hover:underline underline-offset-4 transition-colors cursor-pointer select-none px-2 py-1"
              >
                Join
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
