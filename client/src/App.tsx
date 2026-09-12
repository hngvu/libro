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
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { BookCatalogPage } from '@/pages/admin/BookCatalogPage'
import { BookDetailPage } from '@/pages/admin/BookDetailPage'
import { BookItemCopiesPage } from '@/pages/admin/BookItemCopiesPage'
import { BookCopiesPage } from '@/pages/admin/BookCopiesPage'
import { AdminAuthorsPage } from '@/pages/admin/AdminAuthorsPage'
import { AdminAuthorDetailPage } from '@/pages/admin/AdminAuthorDetailPage'
import { AdminGenresPage } from '@/pages/admin/AdminGenresPage'
import { AdminGenreDetailPage } from '@/pages/admin/AdminGenreDetailPage'
import { AuthorDetailPage } from '@/pages/catalog/AuthorDetailPage'
import { GenreDetailPage } from '@/pages/catalog/GenreDetailPage'
import { CirculationDeskPage } from '@/pages/admin/CirculationDeskPage'
import { OverduePage } from '@/pages/admin/OverduePage'
import { ReservationsPage } from '@/pages/admin/ReservationsPage'
import { MemberListPage } from '@/pages/admin/MemberListPage'
import { MembershipPlansPage } from '@/pages/admin/MembershipPlansPage'
import { UserSubscriptionsPage } from '@/pages/admin/UserSubscriptionsPage'
import { FinesPage } from '@/pages/admin/FinesPage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { StaffSettingsPage } from '@/pages/admin/StaffSettingsPage'
import { ActivityLogPage } from '@/pages/admin/ActivityLogPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
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
      : location.pathname.startsWith('/admin')
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

  const isAdminView = currentView === 'admin'

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isAdminView
          ? 'bg-[#16181d] text-[#cbd2de]'
          : 'bg-[#fafafa] dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]'
      } transition-colors`}
    >
      {/* Top Navigation: Shown on public reader views only */}
      {!isAdminView && (
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
      )}

      {/* Main Content Area Routing */}
      <main
        className={
          isAdminView
            ? 'flex-1 w-full min-h-screen'
            : 'flex-1 max-w-[1060px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8'
        }
      >
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
          <Route path="/author/:handle" element={<AuthorDetailPage />} />
          <Route path="/genre/:handle" element={<GenreDetailPage />} />

          {/* Admin Nested Sub-routes with AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="books" element={<BookCatalogPage />} />
            <Route path="books/:id" element={<BookDetailPage />} />
            <Route path="books/:id/copies" element={<BookItemCopiesPage />} />
            <Route path="copies" element={<BookCopiesPage />} />
            <Route path="authors" element={<AdminAuthorsPage />} />
            <Route path="authors/:id" element={<AdminAuthorDetailPage />} />
            <Route path="genres" element={<AdminGenresPage />} />
            <Route path="genres/:id" element={<AdminGenreDetailPage />} />
            <Route path="circulation" element={<CirculationDeskPage />} />
            <Route path="overdue" element={<OverduePage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="members" element={<MemberListPage />} />
            <Route path="subscriptions" element={<Navigate to="plans" replace />} />
            <Route path="subscriptions/plans" element={<MembershipPlansPage />} />
            <Route path="subscriptions/history" element={<UserSubscriptionsPage />} />
            <Route path="membership-plans" element={<MembershipPlansPage />} />
            <Route path="user-subscriptions" element={<UserSubscriptionsPage />} />
            <Route path="fines" element={<FinesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="staff-settings" element={<StaffSettingsPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

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
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
