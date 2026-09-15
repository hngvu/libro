import type {
  ApiResponse,
  Page,
  BookPublicResponse,
  BookResponse,
  BookCopyResponse,
  LoanPublicResponse,
  LoanResponse,
  UserResponse,
  GenrePublicResponse,
  GenreResponse,
  GenreCreateRequest,
  GenreUpdateRequest,
  AuthorPublicResponse,
  AuthorResponse,
  AuthorCreateRequest,
  AuthorUpdateRequest,
  PublisherResponse,
  PublisherCreateRequest,
  BookCreateRequest,
  BookUpdateRequest,
  BookCopyCreateRequest,
  BookCopyUpdateRequest,
  LoanCreateRequest,
  LoanRenewRequest,
  UserCreateRequest,
  UserUpdateRequest,
  BookFormat,
  BookStatus,
  BookCopyStatus,
  LoanStatus,
  UserRole,
  UserStatus,
  FineResponse,
  FinePublicResponse,
  FineStatus,
  FineReason,
  StripeCheckoutResponse,
  MembershipPlanResponse,
  UserSubscriptionResponse,
  DashboardSummaryResponse,
  CirculationTrendResponse,
  TopBorrowedBookResponse,
  CategoryDistributionResponse,
  RevenueReportResponse,
  OperationalAlertsResponse,
  ReservationResponse,
  ReservationStatus,
  ReservationCreateRequest,
  SystemSettingResponse,
  SystemSettingUpdateRequest,
} from '@/types/api'

const TOKEN_KEY = 'libro_jwt_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function appendMultiParam(search: URLSearchParams, key: string, val?: any) {
  if (val === undefined || val === null || val === '') return
  if (Array.isArray(val)) {
    const filtered = val.filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    if (filtered.length > 0) {
      search.set(key, filtered.join(','))
    }
  } else {
    search.set(key, String(val))
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return {} as T
  }

  const text = await response.text()
  let json: any = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
  }

  if (response.status === 401) {
    removeToken()
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred'
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      errorMsg = 'Cannot connect to backend server. Please make sure the server is running on port 8080.'
    } else if (json) {
      if (typeof json === 'string' && json.trim()) {
        errorMsg = json
      } else if (json.validationErrors && typeof json.validationErrors === 'object') {
        const fieldErrors = Object.values(json.validationErrors).filter(Boolean).join(', ')
        errorMsg = fieldErrors || json.message || errorMsg
      } else if (json.message) {
        errorMsg = json.message
      } else if (json.error) {
        errorMsg = json.error
      } else if (json.errors) {
        errorMsg = Array.isArray(json.errors) ? json.errors.join(', ') : Object.values(json.errors).join(', ')
      }
    }
    throw new Error(errorMsg)
  }

  return json as T
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<ApiResponse<string>> {
    const res = await request<ApiResponse<string>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.data) {
      setToken(res.data)
    }
    return res
  },

  async register(data: {
    email: string
    password: string
    fullName: string
    username?: string
    phone?: string
  }): Promise<ApiResponse<void>> {
    return request<ApiResponse<void>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  logout(): void {
    removeToken()
  },

  // User Profile
  async getCurrentUser(): Promise<UserResponse> {
    return request<UserResponse>('/users/me')
  },

  async updateCurrentUser(data: UserUpdateRequest): Promise<UserResponse> {
    return request<UserResponse>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Public Books
  async getBooks(params: {
    keyword?: string
    format?: BookFormat | BookFormat[]
    genre?: string | string[]
    author?: string | string[]
    page?: number
    size?: number
  } = {}): Promise<Page<BookPublicResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'format', params.format)
    appendMultiParam(search, 'genre', params.genre)
    appendMultiParam(search, 'author', params.author)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<BookPublicResponse>>(`/books${q ? `?${q}` : ''}`)
  },

  async getBookByHandle(handle: string): Promise<BookPublicResponse> {
    return request<BookPublicResponse>(`/books/${handle}`)
  },

  async getAuthorByHandle(handle: string): Promise<AuthorPublicResponse> {
    return request<AuthorPublicResponse>(`/authors/${handle}`)
  },

  async getGenreByHandle(handle: string): Promise<GenrePublicResponse> {
    return request<GenrePublicResponse>(`/genres/${handle}`)
  },

  async getGenres(): Promise<Page<GenrePublicResponse>> {
    return request<Page<GenrePublicResponse>>('/genres?page=1&size=50')
  },

  // Member Loans
  async getMyLoans(params: {
    status?: LoanStatus | LoanStatus[]
    page?: number
    size?: number
  } = {}): Promise<Page<LoanPublicResponse>> {
    const search = new URLSearchParams()
    appendMultiParam(search, 'status', params.status)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<LoanPublicResponse>>(`/loans/my-loans${q ? `?${q}` : ''}`)
  },

  async getMyLoanDetail(loanCode: string): Promise<LoanPublicResponse> {
    return request<LoanPublicResponse>(`/loans/${loanCode}`)
  },

  async renewMyLoan(loanCode: string): Promise<LoanPublicResponse> {
    return request<LoanPublicResponse>(`/loans/${loanCode}/renew`, {
      method: 'POST',
    })
  },

  // Admin: Books
  async adminGetBooks(params: {
    keyword?: string
    format?: BookFormat | BookFormat[]
    status?: BookStatus | BookStatus[]
    genre?: string | string[]
    authorId?: number | number[]
    genreId?: number | number[]
    page?: number
    size?: number
  } = {}): Promise<Page<BookResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'format', params.format)
    appendMultiParam(search, 'status', params.status)
    appendMultiParam(search, 'genre', params.genre)
    appendMultiParam(search, 'authorId', params.authorId)
    appendMultiParam(search, 'genreId', params.genreId)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<BookResponse>>(`/admin/books${q ? `?${q}` : ''}`)
  },

  async adminGetBook(id: number): Promise<BookResponse> {
    return request<BookResponse>(`/admin/books/${id}`)
  },

  async adminCreateBook(data: BookCreateRequest): Promise<BookResponse> {
    return request<BookResponse>('/admin/books', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async adminUpdateBook(id: number, data: BookUpdateRequest): Promise<BookResponse> {
    return request<BookResponse>(`/admin/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async adminDeleteBook(id: number): Promise<void> {
    return request<void>(`/admin/books/${id}`, {
      method: 'DELETE',
    })
  },

  // Admin: Book Copies
  async adminGetBookCopies(params: {
    keyword?: string
    status?: BookCopyStatus | BookCopyStatus[]
    bookId?: number | number[]
    page?: number
    size?: number
  } = {}): Promise<Page<BookCopyResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'status', params.status)
    appendMultiParam(search, 'bookId', params.bookId)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<BookCopyResponse>>(`/admin/book-copies${q ? `?${q}` : ''}`)
  },

  async adminCreateBookCopy(data: BookCopyCreateRequest): Promise<BookCopyResponse> {
    return request<BookCopyResponse>('/admin/book-copies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async adminUpdateBookCopy(id: number, data: BookCopyUpdateRequest): Promise<BookCopyResponse> {
    return request<BookCopyResponse>(`/admin/book-copies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async adminDeleteBookCopy(id: number): Promise<void> {
    return request<void>(`/admin/book-copies/${id}`, {
      method: 'DELETE',
    })
  },

  // Admin: Loans
  async adminGetLoans(params: {
    keyword?: string
    status?: LoanStatus | LoanStatus[]
    userId?: number | number[]
    bookCopyId?: number | number[]
    isOverdue?: boolean
    hasRenewals?: boolean
    page?: number
    size?: number
  } = {}): Promise<Page<LoanResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'status', params.status)
    appendMultiParam(search, 'userId', params.userId)
    appendMultiParam(search, 'bookCopyId', params.bookCopyId)
    if (params.isOverdue !== undefined) search.set('isOverdue', String(params.isOverdue))
    if (params.hasRenewals !== undefined) search.set('hasRenewals', String(params.hasRenewals))
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<LoanResponse>>(`/admin/loans${q ? `?${q}` : ''}`)
  },

  async adminGetLoan(id: number): Promise<LoanResponse> {
    return request<LoanResponse>(`/admin/loans/${id}`)
  },

  async adminCreateLoan(data: LoanCreateRequest): Promise<LoanResponse> {
    return request<LoanResponse>('/admin/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async adminReturnLoan(id: number): Promise<LoanResponse> {
    return request<LoanResponse>(`/admin/loans/${id}/return`, {
      method: 'POST',
    })
  },

  async adminRenewLoan(id: number, data?: LoanRenewRequest): Promise<LoanResponse> {
    return request<LoanResponse>(`/admin/loans/${id}/renew`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async adminCancelLoan(id: number): Promise<void> {
    return request<void>(`/admin/loans/${id}`, {
      method: 'DELETE',
    })
  },

  // Admin: Users
  async adminGetUsers(params: {
    keyword?: string
    role?: UserRole | UserRole[]
    status?: UserStatus | UserStatus[]
    page?: number
    size?: number
  } = {}): Promise<Page<UserResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'role', params.role)
    appendMultiParam(search, 'status', params.status)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<UserResponse>>(`/admin/users${q ? `?${q}` : ''}`)
  },

  async adminGetUser(id: number): Promise<UserResponse> {
    return request<UserResponse>(`/admin/users/${id}`)
  },

  async adminCreateUser(data: UserCreateRequest): Promise<UserResponse> {
    return request<UserResponse>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async adminUpdateUser(id: number, data: UserUpdateRequest): Promise<UserResponse> {
    return request<UserResponse>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async adminDeleteUser(id: number): Promise<void> {
    return request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    })
  },

  // Admin: Authors
  async adminGetAuthors(params: {
    keyword?: string
    page?: number
    size?: number
  } = {}): Promise<Page<AuthorResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<AuthorResponse>>(`/admin/authors${q ? `?${q}` : ''}`)
  },

  async adminGetAuthor(id: number): Promise<AuthorResponse> {
    return request<AuthorResponse>(`/admin/authors/${id}`)
  },

  async adminCreateAuthor(data: AuthorCreateRequest): Promise<AuthorResponse> {
    const payload = {
      ...data,
      handle: data.handle || slugify(data.name) || `author-${Date.now()}`,
    }
    return request<AuthorResponse>('/admin/authors', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async adminUpdateAuthor(id: number, data: AuthorUpdateRequest): Promise<AuthorResponse> {
    return request<AuthorResponse>(`/admin/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async adminDeleteAuthor(id: number): Promise<void> {
    return request<void>(`/admin/authors/${id}`, {
      method: 'DELETE',
    })
  },

  // Admin: Publishers
  async adminGetPublishers(params: {
    keyword?: string
    page?: number
    size?: number
  } = {}): Promise<Page<PublisherResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<PublisherResponse>>(`/admin/publishers${q ? `?${q}` : ''}`)
  },

  async adminCreatePublisher(data: PublisherCreateRequest): Promise<PublisherResponse> {
    return request<PublisherResponse>('/admin/publishers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Admin: Genres
  async adminGetGenres(params: {
    keyword?: string
    page?: number
    size?: number
  } = {}): Promise<Page<GenreResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<GenreResponse>>(`/admin/genres${q ? `?${q}` : ''}`)
  },

  async adminGetGenre(id: number): Promise<GenreResponse> {
    return request<GenreResponse>(`/admin/genres/${id}`)
  },

  async adminCreateGenre(data: GenreCreateRequest): Promise<GenreResponse> {
    const payload = {
      ...data,
      handle: data.handle || slugify(data.name) || `genre-${Date.now()}`,
    }
    return request<GenreResponse>('/admin/genres', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async adminUpdateGenre(id: number, data: GenreUpdateRequest): Promise<GenreResponse> {
    return request<GenreResponse>(`/admin/genres/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async adminDeleteGenre(id: number): Promise<void> {
    return request<void>(`/admin/genres/${id}`, {
      method: 'DELETE',
    })
  },

  // Member: Fines
  async getMyFines(params: {
    status?: FineStatus | FineStatus[]
    page?: number
    size?: number
  } = {}): Promise<Page<FinePublicResponse>> {
    const search = new URLSearchParams()
    appendMultiParam(search, 'status', params.status)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<FinePublicResponse>>(`/fines/my-fines${q ? `?${q}` : ''}`)
  },

  async createFineCheckoutSession(codeOrId: number | string, clientBaseUrl?: string): Promise<StripeCheckoutResponse> {
    const search = new URLSearchParams()
    if (clientBaseUrl) search.set('clientBaseUrl', clientBaseUrl)
    const q = search.toString()
    return request<StripeCheckoutResponse>(`/fines/${codeOrId}/checkout-session${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  // Admin: Loans - Report Lost / Damaged
  async adminReportLoanLost(id: number, amount?: number): Promise<LoanResponse> {
    const search = new URLSearchParams()
    if (amount !== undefined) search.set('amount', String(amount))
    const q = search.toString()
    return request<LoanResponse>(`/admin/loans/${id}/report-lost${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  async adminReportLoanDamaged(id: number, amount?: number, note?: string): Promise<LoanResponse> {
    const search = new URLSearchParams()
    if (amount !== undefined) search.set('amount', String(amount))
    if (note) search.set('note', note)
    const q = search.toString()
    return request<LoanResponse>(`/admin/loans/${id}/report-damaged${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  // Admin: Fines
  async adminGetFines(params: {
    keyword?: string
    status?: FineStatus | FineStatus[]
    reason?: FineReason | FineReason[]
    userId?: number | number[]
    page?: number
    size?: number
  } = {}): Promise<Page<FineResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'status', params.status)
    appendMultiParam(search, 'reason', params.reason)
    appendMultiParam(search, 'userId', params.userId)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<FineResponse>>(`/admin/fines${q ? `?${q}` : ''}`)
  },

  async adminGetFine(id: number): Promise<FineResponse> {
    return request<FineResponse>(`/admin/fines/${id}`)
  },

  async adminCollectFineCash(id: number): Promise<FineResponse> {
    return request<FineResponse>(`/admin/fines/${id}/pay-cash`, {
      method: 'POST',
    })
  },

  async adminWaiveFine(id: number, reason: string): Promise<FineResponse> {
    return request<FineResponse>(`/admin/fines/${id}/waive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  // Membership & Subscriptions
  async getMembershipPlans(): Promise<MembershipPlanResponse[]> {
    return request<MembershipPlanResponse[]>('/membership-plans')
  },

  async getMembershipPlan(code: string): Promise<MembershipPlanResponse> {
    return request<MembershipPlanResponse>(`/membership-plans/${code}`)
  },

  async getMySubscription(): Promise<UserSubscriptionResponse> {
    return request<UserSubscriptionResponse>('/subscriptions/my-subscription')
  },

  async createSubscriptionCheckoutSession(planCode: string, billingCycle: string = 'MONTHLY', clientBaseUrl?: string): Promise<StripeCheckoutResponse> {
    const search = new URLSearchParams()
    search.set('planCode', planCode)
    search.set('billingCycle', billingCycle)
    if (clientBaseUrl) search.set('clientBaseUrl', clientBaseUrl)
    return request<StripeCheckoutResponse>(`/subscriptions/checkout-session?${search.toString()}`, {
      method: 'POST',
    })
  },

  async createCustomerPortalSession(returnUrl?: string): Promise<StripeCheckoutResponse> {
    const search = new URLSearchParams()
    if (returnUrl) search.set('returnUrl', returnUrl)
    const q = search.toString()
    return request<StripeCheckoutResponse>(`/subscriptions/portal-session${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  // Admin Membership & Subscriptions Management
  async adminGetMembershipPlans(): Promise<MembershipPlanResponse[]> {
    return request<MembershipPlanResponse[]>('/admin/membership-plans')
  },

  async adminGetMembershipPlan(id: number): Promise<MembershipPlanResponse> {
    return request<MembershipPlanResponse>(`/admin/membership-plans/${id}`)
  },

  async adminCreateMembershipPlan(data: Partial<MembershipPlanResponse>): Promise<MembershipPlanResponse> {
    return request<MembershipPlanResponse>('/admin/membership-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async adminUpdateMembershipPlan(id: number, data: Partial<MembershipPlanResponse>): Promise<MembershipPlanResponse> {
    return request<MembershipPlanResponse>(`/admin/membership-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async adminDeleteMembershipPlan(id: number): Promise<void> {
    return request<void>(`/admin/membership-plans/${id}`, {
      method: 'DELETE',
    })
  },

  async adminGetUserSubscriptions(): Promise<UserSubscriptionResponse[]> {
    return request<UserSubscriptionResponse[]>('/admin/membership-plans/user-subscriptions')
  },

  async adminCancelUserSubscription(id: number): Promise<UserSubscriptionResponse> {
    return request<UserSubscriptionResponse>(`/admin/membership-plans/user-subscriptions/${id}/cancel`, {
      method: 'POST',
    })
  },

  // Analytics & Dashboard
  async adminGetDashboardSummary(): Promise<DashboardSummaryResponse> {
    return request<DashboardSummaryResponse>('/admin/dashboard/summary')
  },

  async adminGetCirculationTrends(period: string = '30d'): Promise<CirculationTrendResponse> {
    return request<CirculationTrendResponse>(`/admin/dashboard/circulation-trends?period=${encodeURIComponent(period)}`)
  },

  async adminGetOperationalAlerts(): Promise<OperationalAlertsResponse> {
    return request<OperationalAlertsResponse>('/admin/dashboard/operational-alerts')
  },

  // Reports
  async adminGetTopBorrowedBooks(limit: number = 10): Promise<TopBorrowedBookResponse[]> {
    return request<TopBorrowedBookResponse[]>(`/admin/reports/top-books?limit=${limit}`)
  },

  async adminGetCategoryDistribution(): Promise<CategoryDistributionResponse> {
    return request<CategoryDistributionResponse>('/admin/reports/category-distribution')
  },

  async adminGetRevenueReport(): Promise<RevenueReportResponse> {
    return request<RevenueReportResponse>('/admin/reports/revenue')
  },

  async adminExportReport(type: string = 'top-books'): Promise<Blob> {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const response = await fetch(`/api/admin/reports/export?type=${encodeURIComponent(type)}`, {
      headers,
    })
    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`)
    }
    return response.blob()
  },

  // Member: Reservations (Book Holds)
  async placeReservation(data: ReservationCreateRequest): Promise<ReservationResponse> {
    return request<ReservationResponse>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getMyReservations(params: {
    status?: ReservationStatus
    page?: number
    size?: number
  } = {}): Promise<Page<ReservationResponse>> {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<ReservationResponse>>(`/reservations/my-reservations${q ? `?${q}` : ''}`)
  },

  async getMyReservationDetail(id: number): Promise<ReservationResponse> {
    return request<ReservationResponse>(`/reservations/${id}`)
  },

  async cancelMyReservation(id: number, reason?: string): Promise<ReservationResponse> {
    const search = new URLSearchParams()
    if (reason) search.set('reason', reason)
    const q = search.toString()
    return request<ReservationResponse>(`/reservations/${id}/cancel${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  // Admin: Reservations
  async adminGetReservations(params: {
    keyword?: string
    status?: ReservationStatus | ReservationStatus[]
    userId?: number | number[]
    bookId?: number | number[]
    page?: number
    size?: number
  } = {}): Promise<Page<ReservationResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    appendMultiParam(search, 'status', params.status)
    appendMultiParam(search, 'userId', params.userId)
    appendMultiParam(search, 'bookId', params.bookId)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<ReservationResponse>>(`/admin/reservations${q ? `?${q}` : ''}`)
  },

  async adminGetReservation(id: number): Promise<ReservationResponse> {
    return request<ReservationResponse>(`/admin/reservations/${id}`)
  },

  async adminMarkReservationReady(id: number, bookCopyId?: number): Promise<ReservationResponse> {
    const search = new URLSearchParams()
    if (bookCopyId !== undefined) search.set('bookCopyId', String(bookCopyId))
    const q = search.toString()
    return request<ReservationResponse>(`/admin/reservations/${id}/ready${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  async adminFulfillReservation(id: number): Promise<ReservationResponse> {
    return request<ReservationResponse>(`/admin/reservations/${id}/fulfill`, {
      method: 'POST',
    })
  },

  async adminCancelReservation(id: number, reason?: string): Promise<ReservationResponse> {
    const search = new URLSearchParams()
    if (reason) search.set('reason', reason)
    const q = search.toString()
    return request<ReservationResponse>(`/admin/reservations/${id}/cancel${q ? `?${q}` : ''}`, {
      method: 'POST',
    })
  },

  async adminProcessExpiredReservations(): Promise<{ message: string; expiredCount: number }> {
    return request<{ message: string; expiredCount: number }>('/admin/reservations/process-expired', {
      method: 'POST',
    })
  },

  // System Settings
  async adminGetSettings(): Promise<SystemSettingResponse[]> {
    return request<SystemSettingResponse[]>('/admin/settings')
  },

  async adminGetSettingsByCategory(category: string): Promise<SystemSettingResponse[]> {
    return request<SystemSettingResponse[]>(`/admin/settings/category/${encodeURIComponent(category)}`)
  },

  async adminUpdateSetting(key: string, value: string): Promise<SystemSettingResponse> {
    const body: SystemSettingUpdateRequest = { settingValue: value }
    return request<SystemSettingResponse>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  async adminBulkUpdateSettings(settings: Record<string, string>): Promise<SystemSettingResponse[]> {
    return request<SystemSettingResponse[]>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },
}
