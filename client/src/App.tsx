import { useState } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { BookCatalog } from '@/components/catalog/BookCatalog'
import { MyLoansView } from '@/components/loans/MyLoansView'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserProfileModal } from '@/components/profile/UserProfileModal'
import { BookDetailModal } from '@/components/catalog/BookDetailModal'
import type { BookPublicResponse } from '@/types/api'
import { IconBooks, IconHeart } from '@tabler/icons-react'

function AppContent() {
  const [currentView, setCurrentView] = useState<'catalog' | 'loans' | 'admin'>('catalog')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Search & Navigation state
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedBook, setSelectedBook] = useState<BookPublicResponse | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleSearch = (kw: string) => {
    setSearchKeyword(kw)
    setCurrentView('catalog')
  }

  const handleSelectBook = (book: BookPublicResponse) => {
    setSelectedBook(book)
    setDetailModalOpen(true)
  }

  const handleSelectGenre = (genreHandle: string) => {
    setSelectedGenre(genreHandle)
    setCurrentView('catalog')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3e6] dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6] transition-colors">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
        onSearch={handleSearch}
        onSelectBook={handleSelectBook}
        onSelectGenre={handleSelectGenre}
        searchKeyword={searchKeyword}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'catalog' && (
          <BookCatalog
            keyword={searchKeyword}
            onKeywordChange={setSearchKeyword}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            onSelectBook={handleSelectBook}
            onDetailOpenChange={setDetailModalOpen}
          />
        )}

        {currentView === 'loans' && (
          <MyLoansView onOpenAuth={() => handleOpenAuth('login')} />
        )}

        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#1e2320] py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#3d4b3e] flex items-center justify-center text-[#f5f3e6]">
              <IconBooks size={14} />
            </div>
            <span className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6]">Libro Community Library</span>
            <span>&copy; 2026 Libro, Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Goodreads-inspired reader catalog in Scholarly Sage</span>
            <IconHeart size={14} className="text-[#6f7f64] fill-[#6f7f64] ml-1" />
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
      />

      <UserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      <BookDetailModal
        book={selectedBook}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onNavigateToLoan={() => setCurrentView('loans')}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
