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
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BookCatalog } from '@/components/catalog/BookCatalog'
import { BookDetail } from '@/components/catalog/BookDetail'
import { MyLoansView } from '@/components/loans/MyLoansView'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { BookCatalogPage } from '@/pages/admin/BookCatalogPage'
import { BookDetailPage } from '@/pages/admin/BookDetailPage'
import { BookCopiesPage } from '@/pages/admin/BookCopiesPage'
import { AdminAuthorsPage } from '@/pages/admin/AdminAuthorsPage'
import { AdminAuthorDetailPage } from '@/pages/admin/AdminAuthorDetailPage'
import { AdminGenresPage } from '@/pages/admin/AdminGenresPage'
import { AdminGenreDetailPage } from '@/pages/admin/AdminGenreDetailPage'
import { AuthorDetailPage } from '@/pages/catalog/AuthorDetailPage'
import { GenreDetailPage } from '@/pages/catalog/GenreDetailPage'
import { CirculationDeskPage } from '@/pages/admin/CirculationDeskPage'
import { AdminCirculationDetailPage } from '@/pages/admin/AdminCirculationDetailPage'
import { OverduePage } from '@/pages/admin/OverduePage'
import { RenewalsPage } from '@/pages/admin/RenewalsPage'
import { ReservationsPage } from '@/pages/admin/ReservationsPage'
import { AdminReservationDetailPage } from '@/pages/admin/AdminReservationDetailPage'
import { MemberListPage } from '@/pages/admin/MemberListPage'
import { AdminMemberDetailPage } from '@/pages/admin/AdminMemberDetailPage'
import { MembershipPlansPage } from '@/pages/admin/MembershipPlansPage'
import { AdminPlanDetailPage } from '@/pages/admin/AdminPlanDetailPage'
import { UserSubscriptionsPage } from '@/pages/admin/UserSubscriptionsPage'
import { FinesPage } from '@/pages/admin/FinesPage'
import { AdminFineDetailPage } from '@/pages/admin/AdminFineDetailPage'
import { AdminFineSettingsPage } from '@/pages/admin/AdminFineSettingsPage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { StaffSettingsPage } from '@/pages/admin/StaffSettingsPage'
import { ActivityLogPage } from '@/pages/admin/ActivityLogPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserProfileModal } from '@/components/profile/UserProfileModal'
import { MembershipPlansModal } from '@/components/profile/MembershipPlansModal'
import { MembershipPage } from '@/pages/membership/MembershipPage'
import type { BookPublicResponse } from '@/types/api'

function CatalogRouteWrapper({
  onSelectBook,
  onOpenAuth,
}: {
  onSelectBook: (book: BookPublicResponse) => void
  onOpenAuth: (mode?: 'login' | 'register') => void
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
      onOpenAuth={onOpenAuth}
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
  const [plansModalOpen, setPlansModalOpen] = useState(false)

  // Current view derived from URL
  const currentView: 'catalog' | 'loans' | 'membership' | 'admin' | 'book-detail' =
    location.pathname.startsWith('/book/')
      ? 'book-detail'
      : location.pathname === '/activity' || location.pathname === '/loans'
      ? 'loans'
      : location.pathname === '/membership'
      ? 'membership'
      : location.pathname.startsWith('/admin')
      ? 'admin'
      : 'catalog'

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleViewChange = (view: 'catalog' | 'loans' | 'membership' | 'admin' | 'book-detail') => {
    if (view === 'catalog') navigate('/')
    else if (view === 'loans') navigate('/activity')
    else if (view === 'membership') navigate('/membership')
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

  const { user } = useAuth()
  const isGuestHomePage = (!user || user.role !== 'MEMBER') && location.pathname === '/'

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isAdminView
          ? 'bg-[#f3f4f6] dark:bg-[#16181d] text-[#212b36] dark:text-[#cbd2de]'
          : 'bg-[#fafafa] dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]'
      } transition-colors`}
    >
      {/* Top Navigation: Shown on public reader views only, except guest homepage */}
      {!isAdminView && !isGuestHomePage && (
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
      <main className={isAdminView ? 'flex-1 w-full min-h-screen' : 'flex-1 w-full'}>
        <Routes>
          <Route
            path="/"
            element={
              <CatalogRouteWrapper
                onSelectBook={handleSelectBook}
                onOpenAuth={handleOpenAuth}
              />
            }
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
            path="/activity"
            element={<MyLoansView onOpenAuth={() => handleOpenAuth('login')} />}
          />
          <Route
            path="/loans"
            element={<Navigate to="/activity" replace />}
          />
          <Route
            path="/membership"
            element={<MembershipPage onOpenAuth={handleOpenAuth} />}
          />
          <Route
            path="/pricing"
            element={<Navigate to="/membership" replace />}
          />
          <Route path="/author/:handle" element={<AuthorDetailPage />} />
          <Route path="/genre/:handle" element={<GenreDetailPage />} />

          {/* Admin Nested Sub-routes with AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="books" element={<BookCatalogPage />} />
            <Route path="books/:id" element={<BookDetailPage />} />
            <Route path="copies" element={<BookCopiesPage />} />
            <Route path="authors" element={<AdminAuthorsPage />} />
            <Route path="authors/:id" element={<AdminAuthorDetailPage />} />
            <Route path="genres" element={<AdminGenresPage />} />
            <Route path="genres/:id" element={<AdminGenreDetailPage />} />
            {/* Circulation Group */}
            <Route path="circulation" element={<CirculationDeskPage />} />
            <Route path="circulation/desk" element={<CirculationDeskPage />} />
            <Route path="circulation/overdue" element={<OverduePage />} />
            <Route path="circulation/renewals" element={<RenewalsPage />} />
            <Route path="circulation/reservations" element={<ReservationsPage />} />
            <Route path="circulation/reservations/:id" element={<AdminReservationDetailPage />} />
            <Route path="circulation/:id" element={<AdminCirculationDetailPage />} />
            <Route path="overdue" element={<Navigate to="/admin/circulation/overdue" replace />} />
            <Route path="renewals" element={<Navigate to="/admin/circulation/renewals" replace />} />
            <Route path="reservations" element={<Navigate to="/admin/circulation/reservations" replace />} />
            <Route path="reservations/:id" element={<AdminReservationDetailPage />} />
            <Route path="members" element={<MemberListPage />} />
            <Route path="members/:id" element={<AdminMemberDetailPage />} />
            <Route path="membership" element={<Navigate to="plans" replace />} />
            <Route path="membership/plans" element={<MembershipPlansPage />} />
            <Route path="membership/plans/:id" element={<AdminPlanDetailPage />} />
            <Route path="membership/subscriptions" element={<UserSubscriptionsPage />} />
            <Route path="subscriptions" element={<Navigate to="/admin/membership/plans" replace />} />
            <Route path="subscriptions/plans" element={<Navigate to="/admin/membership/plans" replace />} />
            <Route path="subscriptions/plans/:id" element={<AdminPlanDetailPage />} />
            <Route path="subscriptions/history" element={<Navigate to="/admin/membership/subscriptions" replace />} />
            <Route path="membership-plans" element={<Navigate to="/admin/membership/plans" replace />} />
            <Route path="membership-plans/:id" element={<Navigate to="/admin/membership/plans" replace />} />
            {/* Fines Group */}
            <Route path="fines" element={<Navigate to="/admin/fines/fees" replace />} />
            <Route path="fines/fees" element={<AdminFineSettingsPage />} />
            <Route path="fines/dues" element={<Navigate to="/admin/fines/fees" replace />} />
            <Route path="fines/settings" element={<Navigate to="/admin/fines/fees" replace />} />
            <Route path="fines/config" element={<Navigate to="/admin/fines/fees" replace />} />
            <Route path="fines/penalties" element={<FinesPage />} />
            <Route path="fines/penalties/:id" element={<AdminFineDetailPage />} />
            <Route path="fines/:id" element={<AdminFineDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="staff-settings" element={<StaffSettingsPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer: Shown on public reader views only */}
      {!isAdminView && <Footer onOpenAuth={handleOpenAuth} />}

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

      <MembershipPlansModal
        open={plansModalOpen}
        onOpenChange={setPlansModalOpen}
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
