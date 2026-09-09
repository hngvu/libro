import type {
  ApiResponse,
  Page,
  BookPublicResponse,
  BookResponse,
  BookCopyPublicResponse,
  BookCopyResponse,
  LoanPublicResponse,
  LoanResponse,
  UserResponse,
  GenrePublicResponse,
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
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

  if (!response.ok) {
    let errorMsg = 'An error occurred'
    if (json) {
      if (json.validationErrors && typeof json.validationErrors === 'object') {
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
    format?: BookFormat
    genre?: string
    page?: number
    size?: number
  } = {}): Promise<Page<BookPublicResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.format) search.set('format', params.format)
    if (params.genre) search.set('genre', params.genre)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<BookPublicResponse>>(`/books${q ? `?${q}` : ''}`)
  },

  async getBookByHandle(handle: string): Promise<BookPublicResponse> {
    return request<BookPublicResponse>(`/books/${handle}`)
  },

  async getBookCopies(bookHandle: string): Promise<Page<BookCopyPublicResponse>> {
    return request<Page<BookCopyPublicResponse>>(`/book-copies/book/${bookHandle}`)
  },

  async getGenres(): Promise<Page<GenrePublicResponse>> {
    return request<Page<GenrePublicResponse>>('/genres?page=1&size=50')
  },

  // Member Loans
  async getMyLoans(params: {
    status?: LoanStatus
    page?: number
    size?: number
  } = {}): Promise<Page<LoanPublicResponse>> {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<LoanPublicResponse>>(`/loans/my-loans${q ? `?${q}` : ''}`)
  },

  async getMyLoanDetail(loanCode: string): Promise<LoanPublicResponse> {
    return request<LoanPublicResponse>(`/loans/${loanCode}`)
  },

  // Admin: Books
  async adminGetBooks(params: {
    keyword?: string
    format?: BookFormat
    status?: BookStatus
    genre?: string
    page?: number
    size?: number
  } = {}): Promise<Page<BookResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.format) search.set('format', params.format)
    if (params.status) search.set('status', params.status)
    if (params.genre) search.set('genre', params.genre)
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
    status?: BookCopyStatus
    bookId?: number
    page?: number
    size?: number
  } = {}): Promise<Page<BookCopyResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.status) search.set('status', params.status)
    if (params.bookId !== undefined) search.set('bookId', String(params.bookId))
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
    status?: LoanStatus
    userId?: number
    bookCopyId?: number
    isOverdue?: boolean
    page?: number
    size?: number
  } = {}): Promise<Page<LoanResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.status) search.set('status', params.status)
    if (params.userId !== undefined) search.set('userId', String(params.userId))
    if (params.bookCopyId !== undefined) search.set('bookCopyId', String(params.bookCopyId))
    if (params.isOverdue !== undefined) search.set('isOverdue', String(params.isOverdue))
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<LoanResponse>>(`/admin/loans${q ? `?${q}` : ''}`)
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
    role?: UserRole
    status?: UserStatus
    page?: number
    size?: number
  } = {}): Promise<Page<UserResponse>> {
    const search = new URLSearchParams()
    if (params.keyword) search.set('keyword', params.keyword)
    if (params.role) search.set('role', params.role)
    if (params.status) search.set('status', params.status)
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.size !== undefined) search.set('size', String(params.size))

    const q = search.toString()
    return request<Page<UserResponse>>(`/admin/users${q ? `?${q}` : ''}`)
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
}
