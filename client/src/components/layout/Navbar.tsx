import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { BookPublicResponse } from '@/types/api'
import {
  IconSearch,
  IconUser,
  IconLogout,
  IconActivity,
  IconBell,
  IconCrown,
  IconBookmark,
} from '@tabler/icons-react'
import { BookmarkDrawer } from '@/components/bookmark/BookmarkDrawer'
import { BrowseSearchModal } from '@/components/catalog/BrowseSearchModal'

interface NavbarProps {
  currentView: 'catalog' | 'loans' | 'membership' | 'admin' | 'book-detail'
  onViewChange: (view: 'catalog' | 'loans' | 'membership' | 'admin' | 'book-detail') => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
  onOpenProfile: () => void
  onSearch?: (keyword: string) => void
  onSelectBook: (book: BookPublicResponse) => void
  onSelectGenre?: (genreHandle: string) => void
  searchKeyword?: string
}

export function Navbar({
  currentView,
  onViewChange,
  onOpenProfile,
  onSearch,
  onSelectBook,
  onSelectGenre,
}: NavbarProps) {
  const { user, logout } = useAuth()
  const isMemberUser = user?.role === 'MEMBER'
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [bookmarkDrawerOpen, setBookmarkDrawerOpen] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [browseModalOpen, setBrowseModalOpen] = useState(false)

  // Keyboard shortcut Ctrl+K / Cmd+K to open browse modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setBrowseModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isMemberUser) {
      setBookmarkCount(0)
      return
    }

    const fetchBookmarkCount = () => {
      api.getBookmarkCount()
        .then((res) => setBookmarkCount(res.count))
        .catch(() => {})
    }

    fetchBookmarkCount()

    const handleSync = () => {
      fetchBookmarkCount()
    }
    window.addEventListener('libro:bookmarks-changed', handleSync)
    return () => window.removeEventListener('libro:bookmarks-changed', handleSync)
  }, [isMemberUser])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#fafafa] dark:bg-[#1e2320] shadow-xs transition-colors">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center justify-start shrink-0">
          <div
            onClick={() => {
              onSearch?.('')
              onSelectGenre?.('')
              onViewChange('catalog')
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Libro"
          >
            <img
              src="/favicon.svg"
              alt="Libro logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain shadow-2xs group-hover:scale-105 transition-transform"
            />
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-[#3d4b3e] dark:group-hover:text-[#c8d0b7] transition-colors">
              libro
            </span>
          </div>
        </div>

        {/* Right: User Menu & Controls */}
        <div className="flex items-center justify-end shrink-0 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setBrowseModalOpen(true)}
            className="p-1.5 text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] rounded-[6px] hover:bg-[#c8d0b7]/30 transition-colors cursor-pointer"
            title="Browse library catalog (Ctrl+K)"
          >
            <IconSearch size={18} />
          </button>

          {isMemberUser && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                className="p-1.5 text-[#6f7f64] hover:text-[#1e2320] dark:hover:text-[#f5f3e6] rounded-[6px] hover:bg-[#c8d0b7]/30 transition-colors hidden sm:block cursor-pointer"
                title="Notifications"
              >
                <IconBell size={18} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 py-1.5 pl-3 pr-2 rounded-[6px] hover:bg-[#c8d0b7]/30 dark:hover:bg-[#3d4b3e]/40 transition-colors border border-[#c8d0b7] dark:border-[#3d4b3e] cursor-pointer select-none"
                >
                  <span className="font-medium text-xs text-[#1e2320] dark:text-[#f5f3e6] truncate max-w-[120px]">
                    {user.fullName || user.username}
                  </span>
                  <div className="h-6 w-6 rounded-full bg-[#3d4b3e] text-[#f5f3e6] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {(user.fullName || user.username || 'U').trim()[0].toUpperCase()}
                  </div>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-[#c8d0b7]/50 dark:border-[#3d4b3e] mb-1">
                        <p className="text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-[11px] text-[#6f7f64] dark:text-[#c8d0b7] truncate">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setBookmarkDrawerOpen(true)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-[4px] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <IconBookmark size={15} /> Saved Bookmarks
                        </span>
                        {bookmarkCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#2e7d56] text-white text-[10px] font-bold rounded-full">
                            {bookmarkCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onViewChange('loans')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-[4px] transition-colors cursor-pointer"
                      >
                        <IconActivity size={15} /> My Activity
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onViewChange('membership')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-[4px] transition-colors cursor-pointer"
                      >
                        <IconCrown size={15} /> Membership & Plans
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onOpenProfile()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]/40 dark:hover:bg-[#3d4b3e]/40 rounded-[4px] transition-colors cursor-pointer"
                      >
                        <IconUser size={15} /> Account Settings
                      </button>

                      <div className="my-1 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          logout()
                          if (currentView === 'admin') {
                            onViewChange('catalog')
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1e2320] dark:text-[#f5f3e6] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[4px] transition-colors cursor-pointer"
                      >
                        <IconLogout size={15} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {isMemberUser && (
      <BookmarkDrawer
        open={bookmarkDrawerOpen}
        onClose={() => setBookmarkDrawerOpen(false)}
        onSelectBook={(b) => {
          setBookmarkDrawerOpen(false)
          api.getBookByHandle(b.handle)
            .then((fullBook) => onSelectBook(fullBook))
            .catch(() => {
              onSelectBook({
                title: '',
                handle: b.handle,
                slug: b.slug || b.handle,
                isbn: '',
                publicationYear: 0,
                cover: null,
                edition: null,
                format: null,
                pageCount: null,
                language: null,
                description: null,
                totalCopies: 0,
                availableCopies: 0,
              })
            })
        }}
      />
    )}

    {/* Global Catalog Search Modal */}
    <BrowseSearchModal
      open={browseModalOpen}
      onClose={() => setBrowseModalOpen(false)}
      onSelectBook={onSelectBook}
      onSearch={onSearch}
    />
  </>
  )
}
