export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type BookFormat = 'PAPERBACK' | 'HARDCOVER' | 'EBOOK' | 'AUDIOBOOK'
export type BookStatus = 'ACTIVE' | 'ARCHIVED' | 'HIDDEN'
export type BookCopyStatus = 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RESERVED'
export type LoanStatus = 'ONGOING' | 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'
export type UserRole = 'ADMIN' | 'LIBRARIAN' | 'MEMBER'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED'

export interface BookPublicResponse {
  id?: number
  title: string
  handle: string
  slug: string
  isbn: string
  publicationYear: number
  cover: string | null
  edition: string | null
  format: BookFormat | null
  pageCount: number | null
  language: string | null
  description: string | null
  totalCopies: number
  availableCopies: number
  authors?: AuthorPublicResponse[]
  genres?: GenrePublicResponse[]
  publisher?: PublisherPublicResponse | null
}

export interface BookResponse {
  id: number
  title: string
  handle: string
  slug: string
  isbn: string
  publicationYear: number
  cover: string | null
  edition: string | null
  format: BookFormat | null
  pageCount: number | null
  language: string | null
  description: string | null
  totalCopies: number
  availableCopies: number
  status: BookStatus
  authors?: AuthorResponse[]
  genres?: GenreResponse[]
  publisher?: PublisherResponse | null
}

export interface BookCopyPublicResponse {
  barcode: string
  status: BookCopyStatus
  location?: string | null
}

export interface BookCopyResponse {
  id: number
  barcode: string
  status: BookCopyStatus
  location?: string | null
  bookId: number
  bookTitle?: string
  bookCover?: string | null
  authors?: string[]
  lastLoanDate?: string | null
}

export interface LoanPublicResponse {
  loanCode: string
  bookTitle: string
  bookHandle: string
  bookCover: string | null
  barcode: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: LoanStatus
  renewalCount?: number
}

export interface LoanResponse {
  id: number
  loanCode: string
  userId: number
  userEmail?: string
  userFullName: string
  bookCopyId: number
  barcode: string
  bookId: number
  bookTitle: string
  bookHandle: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: LoanStatus
  renewalCount?: number
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
}

export interface UserResponse {
  id?: number
  username: string
  email: string
  fullName: string
  phone: string | null
  role: UserRole
  status: UserStatus
}

export interface GenrePublicResponse {
  name: string
  handle: string
  description: string | null
}

export interface GenreResponse {
  id: number
  name: string
  handle: string
  description: string | null
  status: string
  bookCount?: number
}

export interface AuthorPublicResponse {
  name: string
  handle: string
  biography: string | null
  image?: string | null
}

export interface AuthorResponse {
  id: number
  name: string
  handle: string
  biography: string | null
  image?: string | null
  status: string
  bookCount?: number
}

export interface PublisherPublicResponse {
  name: string
  handle: string
  address: string | null
  website: string | null
}

export interface PublisherResponse {
  id: number
  name: string
  handle: string
  address: string | null
  website: string | null
  status: string
}

// Request types
export interface AuthorCreateRequest {
  name: string
  handle?: string
  biography?: string
  image?: string
}

export interface AuthorUpdateRequest {
  name: string
  handle?: string
  biography?: string
  image?: string
  status?: string
}

export interface PublisherCreateRequest {
  name: string
  address?: string
  website?: string
}

export interface GenreCreateRequest {
  name: string
  handle?: string
  description?: string
}

export interface GenreUpdateRequest {
  name: string
  handle?: string
  description?: string
  status?: string
}

export interface BookCreateRequest {
  title: string
  handle: string
  slug: string
  isbn?: string
  publicationYear?: number
  cover?: string
  edition?: string
  format: BookFormat
  pageCount?: number
  language?: string
  work?: string
  description?: string
  publisherId?: number | null
  authorIds?: number[]
  genreIds?: number[]
}

export interface BookUpdateRequest {
  title: string
  slug?: string
  isbn?: string
  publicationYear?: number
  cover?: string
  edition?: string
  format: BookFormat
  pageCount?: number
  language?: string
  work?: string
  description?: string
  status?: BookStatus
  publisherId?: number | null
  authorIds?: number[]
  genreIds?: number[]
}

export interface BookCopyCreateRequest {
  barcode?: string
  bookId: number
  location?: string
}

export interface BookCopyUpdateRequest {
  barcode?: string
  status?: BookCopyStatus
  location?: string
}

export interface LoanCreateRequest {
  userId: number
  bookCopyId?: number
  barcode?: string
  borrowDate?: string
  dueDate?: string
}

export interface LoanRenewRequest {
  extensionDays?: number
  newDueDate?: string
}

export interface UserCreateRequest {
  username: string
  email: string
  password?: string
  fullName: string
  phone?: string
  role: UserRole
}

export interface UserUpdateRequest {
  fullName?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
}

export type FineReason = 'OVERDUE' | 'LOST_BOOK' | 'DAMAGED_BOOK' | 'OTHER'
export type FineStatus = 'PENDING' | 'PAID' | 'WAIVED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'STRIPE' | 'WAIVED'

export interface FineResponse {
  id: number
  fineCode: string
  userId?: number
  userEmail?: string
  userFullName?: string
  loanId?: number
  loanCode?: string
  bookId?: number
  bookTitle?: string
  bookHandle?: string
  amount: number
  reason: FineReason
  daysOverdue?: number
  status: FineStatus
  paymentMethod?: PaymentMethod
  stripeSessionId?: string
  stripePaymentIntentId?: string
  paidAt?: string
  waivedAt?: string
  waivedReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface FinePublicResponse {
  fineCode: string
  loanCode?: string
  bookTitle?: string
  bookHandle?: string
  bookCover?: string
  amount: number
  reason: FineReason
  daysOverdue?: number
  status: FineStatus
  paymentMethod?: PaymentMethod
  paidAt?: string
  createdAt?: string
}

export interface StripeCheckoutResponse {
  checkoutUrl: string
  sessionId: string
}

export interface MembershipPlanPriceResponse {
  id?: number
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
  price: number
  stripePriceId?: string
}

export interface MembershipPlanResponse {
  id: number
  name: string
  code: string
  description?: string
  stripeProductId?: string
  maxActiveLoans: number
  loanDurationDays: number
  maxRenewals: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  prices: MembershipPlanPriceResponse[]
  createdAt?: string
  updatedAt?: string
}

export interface UserSubscriptionResponse {
  id?: number
  userId?: number
  userEmail?: string
  planId?: number
  planName: string
  planCode: string
  planPriceId?: number
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
  price?: number
  maxActiveLoans: number
  loanDurationDays: number
  maxRenewals: number
  status: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  canceledAt?: string
}

// Dashboard & Analytics Types
export interface DashboardSummaryResponse {
  totalBooks: number
  totalCopies: number
  availableCopies: number
  activeLoans: number
  overdueLoans: number
  totalMembers: number
  activeSubscriptions: number
  pendingFinesCount: number
  pendingFinesAmount: number
  collectedFinesAmount: number
  estimatedMonthlyRecurringRevenue: number
}

export interface CirculationTrendPoint {
  label: string
  checkouts: number
  returns: number
  overdues: number
}

export interface CirculationTrendResponse {
  period: string
  dataPoints: CirculationTrendPoint[]
}

export interface TopBorrowedBookResponse {
  bookId: number
  bookHandle: string
  title: string
  cover?: string
  authors: string[]
  totalCheckouts: number
  totalCopies: number
  availableCopies: number
}

export interface CategoryShare {
  genreId: number
  name: string
  handle: string
  bookCount: number
  loanCount: number
  percentage: number
}

export interface CategoryDistributionResponse {
  categories: CategoryShare[]
}

export interface PlanRevenueBreakdown {
  planCode: string
  planName: string
  subscribersCount: number
  price: number
  revenue: number
}

export interface RevenueReportResponse {
  subscriptionRevenue: {
    totalMRR: number
    activeSubscribers: number
    planBreakdown: PlanRevenueBreakdown[]
  }
  finesRevenue: {
    totalCollected: number
    totalPending: number
    totalWaived: number
    methodBreakdown: Record<string, number>
    reasonBreakdown: Record<string, number>
  }
}

export interface SevereOverdueAlert {
  loanId: number
  loanCode: string
  bookTitle: string
  bookHandle?: string
  borrowerName: string
  borrowerEmail?: string
  dueDate: string
  daysOverdue: number
  estimatedFine: number
}

export interface OutOfStockBookAlert {
  bookId: number
  bookHandle: string
  title: string
  totalCopies: number
}

export interface OperationalAlertsResponse {
  severeOverdues: SevereOverdueAlert[]
  outOfStockBooks: OutOfStockBookAlert[]
  totalSevereOverdues: number
  totalOutOfStock: number
}

export type ReservationStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED'

export interface ReservationResponse {
  id: number
  reservationCode: string
  userId?: number
  userEmail?: string
  userFullName?: string
  userPhone?: string
  bookId?: number
  bookTitle?: string
  bookHandle?: string
  bookCover?: string
  bookCopyId?: number
  barcode?: string
  location?: string
  status: ReservationStatus
  reservedAt: string
  pickupDeadline?: string
  fulfilledAt?: string
  queuePosition?: number
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface ReservationCreateRequest {
  bookId?: number
  bookHandle?: string
}


