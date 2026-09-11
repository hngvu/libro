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
export type LoanStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE'
export type UserRole = 'ADMIN' | 'LIBRARIAN' | 'MEMBER'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED'

export interface BookPublicResponse {
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
}

export interface LoanResponse {
  id: number
  loanCode: string
  userId: number
  username: string
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
}

export interface AuthorPublicResponse {
  name: string
  handle: string
  biography: string | null
}

export interface AuthorResponse {
  id: number
  name: string
  handle: string
  biography: string | null
  status: string
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
  biography?: string
}

export interface PublisherCreateRequest {
  name: string
  address?: string
  website?: string
}

export interface GenreCreateRequest {
  name: string
  description?: string
}

export interface BookCreateRequest {
  title: string
  handle: string
  slug: string
  isbn: string
  publicationYear: number
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
  slug: string
  isbn: string
  publicationYear: number
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
  barcode: string
  bookId: number
  location?: string
}

export interface BookCopyUpdateRequest {
  status: BookCopyStatus
  location?: string
}

export interface LoanCreateRequest {
  userId: number
  bookCopyId: number
  borrowDate?: string
  dueDate: string
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
