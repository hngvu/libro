import { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { BookCatalog } from '@/components/catalog/BookCatalog'
import { BookDetail } from '@/components/catalog/BookDetail'
import { MyLoansView } from '@/components/loans/MyLoansView'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserProfileModal } from '@/components/profile/UserProfileModal'
import type { BookPublicResponse } from '@/types/api'

function CatalogRouteWrapper({
  onSelectBook,
}: {
  onSelectBook: (book: BookPublicResponse) => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  const selectedGenre = searchParams.get('genre') || ''

  const handleKeywordChange = (kw: string) => {
    const params = new URLSearchParams(searchParams)
    if (kw) params.set('keyword', kw)
    else params.delete('keyword')
    setSearchParams(params)
  }

  const handleGenreChange = (genre: string) => {
    const params = new URLSearchParams(searchParams)
    if (genre) params.set('genre', genre)
    else params.delete('genre')
    setSearchParams(params)
  }

  return (
    <BookCatalog
      keyword={keyword}
      onKeywordChange={handleKeywordChange}
      selectedGenre={selectedGenre}
      onGenreChange={handleGenreChange}
      onSelectBook={onSelectBook}
    />
  )
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Current view derived from URL
  const currentView: 'catalog' | 'loans' | 'admin' | 'book-detail' =
    location.pathname.startsWith('/book/')
      ? 'book-detail'
      : location.pathname === '/loans'
      ? 'loans'
      : location.pathname === '/admin'
      ? 'admin'
      : 'catalog'

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleViewChange = (view: 'catalog' | 'loans' | 'admin' | 'book-detail') => {
    if (view === 'catalog') navigate('/')
    else if (view === 'loans') navigate('/loans')
    else if (view === 'admin') navigate('/admin')
  }

  const handleSearch = (kw: string) => {
    if (kw) {
      navigate(`/?keyword=${encodeURIComponent(kw)}`)
    } else {
      navigate('/')
    }
  }

  const handleSelectBook = (book: BookPublicResponse) => {
    navigate(`/book/${book.handle}/${book.slug || book.handle}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectGenre = (genreHandle: string) => {
    if (genreHandle) {
      navigate(`/?genre=${encodeURIComponent(genreHandle)}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6] transition-colors">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
        onSearch={handleSearch}
        onSelectBook={handleSelectBook}
        onSelectGenre={handleSelectGenre}
        searchKeyword={searchParams.get('keyword') || ''}
      />

      {/* Main Content Area Routing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Routes>
          <Route
            path="/"
            element={<CatalogRouteWrapper onSelectBook={handleSelectBook} />}
          />
          <Route
            path="/book/:handle/:slug"
            element={<BookDetail onOpenAuth={handleOpenAuth} />}
          />
          <Route
            path="/book/:handle"
            element={<BookDetail onOpenAuth={handleOpenAuth} />}
          />
          <Route
            path="/loans"
            element={<MyLoansView onOpenAuth={() => handleOpenAuth('login')} />}
          />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
