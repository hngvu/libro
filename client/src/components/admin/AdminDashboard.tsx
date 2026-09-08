import { useState, useEffect, useCallback } from 'react'
import type {
  BookResponse,
  BookCopyResponse,
  LoanResponse,
  UserResponse,
  BookFormat,
  BookStatus,
  BookCopyStatus,
  LoanStatus,
  UserRole,
} from '@/types/api'
import { api } from '@/services/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  IconBook,
  IconBarcode,
  IconUsers,
  IconPlus,
  IconPencil,
  IconTrash,
  IconArrowBackUp,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
} from '@tabler/icons-react'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('books')

  // ==========================================
  // 1. BOOKS STATE
  // ==========================================
  const [books, setBooks] = useState<BookResponse[]>([])
  const [bookKeyword, setBookKeyword] = useState('')
  const [bookLoading, setBookLoading] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<BookResponse | null>(null)
  const [bookFormData, setBookFormData] = useState({
    title: '',
    handle: '',
    slug: '',
    isbn: '',
    publicationYear: 2024,
    cover: '',
    edition: '1st Edition',
    format: 'PAPERBACK' as BookFormat,
    description: '',
    status: 'ACTIVE' as BookStatus,
  })

  // ==========================================
  // 2. COPIES STATE
  // ==========================================
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [copyKeyword, setCopyKeyword] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyFormData, setCopyFormData] = useState({
    barcode: '',
    bookId: 0,
  })

  // ==========================================
  // 3. LOANS STATE
  // ==========================================
  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [loanKeyword, setLoanKeyword] = useState('')
  const [loanStatus, setLoanStatus] = useState<LoanStatus | ''>('')
  const [loanLoading, setLoanLoading] = useState(false)
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [loanFormData, setLoanFormData] = useState({
    userId: 0,
    bookCopyId: 0,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedLoanForRenew, setSelectedLoanForRenew] = useState<LoanResponse | null>(null)
  const [renewDays, setRenewDays] = useState(7)

  // ==========================================
  // 4. USERS STATE
  // ==========================================
  const [users, setUsers] = useState<UserResponse[]>([])
  const [userKeyword, setUserKeyword] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'MEMBER' as UserRole,
  })

  // General Notification / Error
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ==========================================
  // FETCHERS
  // ==========================================
  const fetchBooks = useCallback(async () => {
    setBookLoading(true)
    try {
      const res = await api.adminGetBooks({
        keyword: bookKeyword || undefined,
        page: 1,
        size: 50,
      })
      setBooks(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load books')
    } finally {
      setBookLoading(false)
    }
  }, [bookKeyword])

  const fetchCopies = useCallback(async () => {
    setCopyLoading(true)
    try {
      const res = await api.adminGetBookCopies({
        keyword: copyKeyword || undefined,
        page: 1,
        size: 50,
      })
      setCopies(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load copies')
    } finally {
      setCopyLoading(false)
    }
  }, [copyKeyword])

  const fetchLoans = useCallback(async () => {
    setLoanLoading(true)
    try {
      const res = await api.adminGetLoans({
        keyword: loanKeyword || undefined,
        status: loanStatus || undefined,
        page: 1,
        size: 50,
      })
      setLoans(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load loans')
    } finally {
      setLoanLoading(false)
    }
  }, [loanKeyword, loanStatus])

  const fetchUsers = useCallback(async () => {
    setUserLoading(true)
    try {
      const res = await api.adminGetUsers({
        keyword: userKeyword || undefined,
        page: 1,
        size: 50,
      })
      setUsers(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load users')
    } finally {
      setUserLoading(false)
    }
  }, [userKeyword])

  useEffect(() => {
    if (activeTab === 'books') fetchBooks()
    else if (activeTab === 'copies') fetchCopies()
    else if (activeTab === 'loans') fetchLoans()
    else if (activeTab === 'users') fetchUsers()
  }, [activeTab, fetchBooks, fetchCopies, fetchLoans, fetchUsers])

  // ==========================================
  // HANDLERS: BOOKS
  // ==========================================
  const handleOpenCreateBook = () => {
    setEditingBook(null)
    setBookFormData({
      title: '',
      handle: `BK${String(Math.floor(100000 + Math.random() * 900000))}`,
      slug: '',
      isbn: `978${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      publicationYear: 2024,
      cover: '',
      edition: '1st Edition',
      format: 'PAPERBACK',
      description: '',
      status: 'ACTIVE',
    })
    setBookModalOpen(true)
  }

  const handleOpenEditBook = (book: BookResponse) => {
    setEditingBook(book)
    setBookFormData({
      title: book.title,
      handle: book.handle,
      slug: book.slug,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      cover: book.cover || '',
      edition: book.edition || '1st Edition',
      format: (book.format as BookFormat) || 'PAPERBACK',
      description: book.description || '',
      status: book.status,
    })
    setBookModalOpen(true)
  }

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await api.adminUpdateBook(editingBook.id, {
          title: bookFormData.title,
          slug: bookFormData.slug || bookFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isbn: bookFormData.isbn,
          publicationYear: Number(bookFormData.publicationYear),
          cover: bookFormData.cover || undefined,
          edition: bookFormData.edition,
          format: bookFormData.format,
          description: bookFormData.description,
          status: bookFormData.status,
        })
        showFeedback('success', 'Book details updated successfully!')
      } else {
        await api.adminCreateBook({
          title: bookFormData.title,
          handle: bookFormData.handle,
          slug: bookFormData.slug || bookFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isbn: bookFormData.isbn,
          publicationYear: Number(bookFormData.publicationYear),
          cover: bookFormData.cover || undefined,
          edition: bookFormData.edition,
          format: bookFormData.format,
          description: bookFormData.description,
        })
        showFeedback('success', 'New book title added to catalog!')
      }
      setBookModalOpen(false)
      fetchBooks()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save book')
    }
  }

  const handleDeleteBook = async (id: number) => {
    if (!confirm('Are you sure you want to archive this book? It will be hidden from end users.')) return
    try {
      await api.adminDeleteBook(id)
      showFeedback('success', 'Book archived successfully!')
      fetchBooks()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive book')
    }
  }

  // ==========================================
  // HANDLERS: COPIES
  // ==========================================
  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateBookCopy({
        barcode: copyFormData.barcode,
        bookId: Number(copyFormData.bookId),
      })
      showFeedback('success', 'New physical copy registered!')
      setCopyModalOpen(false)
      fetchCopies()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create copy')
    }
  }

  const handleUpdateCopyStatus = async (id: number, status: BookCopyStatus) => {
    try {
      await api.adminUpdateBookCopy(id, { status })
      showFeedback('success', 'Copy status updated successfully!')
      fetchCopies()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update copy status')
    }
  }

  // ==========================================
  // HANDLERS: LOANS
  // ==========================================
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateLoan({
        userId: Number(loanFormData.userId),
        bookCopyId: Number(loanFormData.bookCopyId),
        dueDate: loanFormData.dueDate,
      })
      showFeedback('success', 'Circulation loan ticket issued!')
      setLoanModalOpen(false)
      fetchLoans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to issue loan')
    }
  }

  const handleReturnLoan = async (id: number) => {
    if (!confirm('Confirm book return for this loan ticket?')) return
    try {
      await api.adminReturnLoan(id)
      showFeedback('success', 'Book return processed successfully!')
      fetchLoans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return loan')
    }
  }

  const handleRenewLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoanForRenew) return
    try {
      await api.adminRenewLoan(selectedLoanForRenew.id, {
        extensionDays: Number(renewDays),
      })
      showFeedback('success', 'Loan period extended successfully!')
      setRenewModalOpen(false)
      fetchLoans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to renew loan')
    }
  }

  // ==========================================
  // HANDLERS: USERS
  // ==========================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateUser({
        username: userFormData.username,
        email: userFormData.email,
        password: userFormData.password || 'libro123',
        fullName: userFormData.fullName,
        phone: userFormData.phone || undefined,
        role: userFormData.role,
      })
      showFeedback('success', 'New user account created!')
      setUserModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-[#1e2320] to-[#3d4b3e] text-[#f5f3e6] p-6 rounded-2xl shadow-md border border-[#3d4b3e]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c8d0b7]/20 text-[#c8d0b7] text-xs font-semibold mb-2 border border-[#c8d0b7]/30">
            Library Operations & Staff Portal
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#f5f3e6]">Circulation & Admin Desk</h2>
          <p className="text-xs text-[#c8d0b7] mt-1 font-serif italic">
            Manage catalog titles, barcode copies, reader circulation loans, and member credentials.
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-[#c8d0b7]/40 text-[#1e2320] border border-[#c8d0b7]'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto h-11 bg-[#c8d0b7]/40 dark:bg-[#252c28] border border-[#c8d0b7] dark:border-[#3d4b3e]">
          <TabsTrigger value="books" className="gap-2 text-xs font-semibold">
            <IconBook size={16} /> Titles & Catalog
          </TabsTrigger>
          <TabsTrigger value="copies" className="gap-2 text-xs font-semibold">
            <IconBarcode size={16} /> Physical Copies
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2 text-xs font-semibold">
            <IconClock size={16} /> Circulation Loans
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 text-xs font-semibold">
            <IconUsers size={16} /> Readers & Staff
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            TAB 1: BOOKS
            ========================================== */}
        <TabsContent value="books" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Input
                placeholder="Search title, handle, or ISBN..."
                value={bookKeyword}
                onChange={(e) => setBookKeyword(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={fetchBooks} className="h-9 px-3">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchBooks} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button size="sm" onClick={handleOpenCreateBook} className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]">
                <IconPlus size={15} /> Add New Title
              </Button>
            </div>
          </div>

          {bookLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading catalog titles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Handle</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Copies (Avail/Total)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]">
                      {b.handle}
                    </TableCell>
                    <TableCell>
                      <span className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6] text-xs block hover:underline cursor-pointer">
                        {b.title}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#6f7f64]">{b.isbn}</TableCell>
                    <TableCell className="text-xs">{b.publicationYear}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {b.format}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-[#6f7f64]">{b.availableCopies}</span> / {b.totalCopies}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditBook(b)}
                          className="h-7 w-7 p-0 text-[#6f7f64] hover:text-[#3d4b3e]"
                          title="Edit"
                        >
                          <IconPencil size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBook(b.id)}
                          className="h-7 w-7 p-0 text-[#6f7f64] hover:text-rose-700"
                          title="Archive"
                        >
                          <IconTrash size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ==========================================
            TAB 2: COPIES
            ========================================== */}
        <TabsContent value="copies" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Input
                placeholder="Search barcode number..."
                value={copyKeyword}
                onChange={(e) => setCopyKeyword(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={fetchCopies} className="h-9 px-3">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchCopies} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setCopyFormData({
                    barcode: `BC-${Math.floor(100000 + Math.random() * 900000)}`,
                    bookId: books.length > 0 ? books[0].id : 1,
                  })
                  setCopyModalOpen(true)
                }}
                className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
              >
                <IconPlus size={15} /> Add Copy (Barcode)
              </Button>
            </div>
          </div>

          {copyLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading physical copies...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Catalog Title</TableHead>
                  <TableHead>Book ID</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {copies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                      <span className="flex items-center gap-1.5">
                        <IconBarcode size={16} className="text-[#6f7f64]" />
                        {c.barcode}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-serif font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                      {c.bookTitle || `Book ID #${c.bookId}`}
                    </TableCell>
                    <TableCell className="text-xs text-[#6f7f64] font-mono">{c.bookId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === 'AVAILABLE'
                            ? 'success'
                            : c.status === 'BORROWED'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateCopyStatus(c.id, e.target.value as BookCopyStatus)}
                        className="h-7 px-2 text-[11px] rounded border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BORROWED">BORROWED</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ==========================================
            TAB 3: CIRCULATION LOANS
            ========================================== */}
        <TabsContent value="loans" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search loan code or reader..."
                value={loanKeyword}
                onChange={(e) => setLoanKeyword(e.target.value)}
                className="h-9 text-xs w-64"
              />
              <select
                value={loanStatus}
                onChange={(e) => setLoanStatus(e.target.value as LoanStatus)}
                className="h-9 px-3 text-xs rounded-lg border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] text-[#1e2320] dark:text-[#f5f3e6]"
              >
                <option value="">All Statuses</option>
                <option value="BORROWED">Borrowed</option>
                <option value="RETURNED">Returned</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <Button size="sm" onClick={fetchLoans} className="h-9 px-3">
                Filter
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchLoans} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (users.length === 0) fetchUsers()
                  if (copies.length === 0) fetchCopies()
                  setLoanFormData({
                    userId: users.length > 0 ? (users[0].id || 3) : 3,
                    bookCopyId: copies.length > 0 ? copies[0].id : 1,
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  })
                  setLoanModalOpen(true)
                }}
                className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
              >
                <IconPlus size={15} /> Issue New Loan
              </Button>
            </div>
          </div>

          {loanLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading circulation records...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Code</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Book & Barcode</TableHead>
                  <TableHead>Borrowed Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#3d4b3e] dark:text-[#c8d0b7]">
                      {l.loanCode}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium text-[#1e2320] dark:text-[#f5f3e6] block">
                        {l.userFullName || l.username}
                      </span>
                      <span className="text-[#6f7f64] font-mono text-[11px]">@{l.username}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-serif font-bold block text-[#1e2320] dark:text-[#f5f3e6]">
                        {l.bookTitle}
                      </span>
                      <span className="text-[#6f7f64] font-mono text-[11px] flex items-center gap-1">
                        <IconBarcode size={12} /> {l.barcode}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#6f7f64]">{l.borrowDate}</TableCell>
                    <TableCell className="text-xs font-medium">
                      <span className={l.status === 'OVERDUE' ? 'text-rose-700 font-bold' : 'text-[#1e2320] dark:text-[#f5f3e6]'}>
                        {l.dueDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === 'RETURNED'
                            ? 'success'
                            : l.status === 'OVERDUE'
                            ? 'destructive'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status !== 'RETURNED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturnLoan(l.id)}
                              className="h-7 px-2 text-[11px] gap-1 text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40 border-[#c8d0b7]"
                            >
                              <IconArrowBackUp size={13} /> Return Book
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedLoanForRenew(l)
                                setRenewModalOpen(true)
                              }}
                              className="h-7 px-2 text-[11px] gap-1 text-[#3d4b3e] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/40"
                            >
                              <IconClock size={13} /> Renew
                            </Button>
                          </>
                        )}
                        {l.status === 'RETURNED' && (
                          <span className="text-[11px] text-[#6f7f64]">Completed ({l.returnDate})</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ==========================================
            TAB 4: USERS
            ========================================== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#faf9f4] dark:bg-[#252c28] p-4 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Input
                placeholder="Search user by name or email..."
                value={userKeyword}
                onChange={(e) => setUserKeyword(e.target.value)}
                className="h-9 text-xs"
              />
              <Button size="sm" onClick={fetchUsers} className="h-9 px-3">
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={fetchUsers} className="h-9 gap-1 text-xs">
                <IconRefresh size={14} /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setUserFormData({
                    username: '',
                    email: '',
                    password: '',
                    fullName: '',
                    phone: '',
                    role: 'MEMBER',
                  })
                  setUserModalOpen(true)
                }}
                className="h-9 gap-1 text-xs bg-[#3d4b3e] hover:bg-[#1e2320] text-[#f5f3e6]"
              >
                <IconPlus size={15} /> Add Member Account
              </Button>
            </div>
          </div>

          {userLoading ? (
            <div className="p-8 text-center text-xs text-[#6f7f64]">Loading reader accounts...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.username}>
                    <TableCell className="font-mono text-xs font-semibold text-[#1e2320] dark:text-[#f5f3e6]">
                      @{u.username}
                    </TableCell>
                    <TableCell className="text-xs font-serif font-bold">{u.fullName}</TableCell>
                    <TableCell className="text-xs text-[#6f7f64]">{u.email}</TableCell>
                    <TableCell className="text-xs text-[#6f7f64]">{u.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === 'ADMIN' ? 'destructive' : u.role === 'LIBRARIAN' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                        {u.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* ==========================================
          MODALS IN ENGLISH
          ========================================== */}

      {/* 1. Modal Add / Edit Book */}
      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent onClose={() => setBookModalOpen(false)} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingBook ? 'Edit Book Details' : 'Add New Title to Catalog'}</DialogTitle>
            <DialogDescription>
              Enter publication metadata adhering to library cataloging standards
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBook} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Title *</label>
                <Input
                  required
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Handle (Public Identifier) *</label>
                <Input
                  required
                  disabled={!!editingBook}
                  value={bookFormData.handle}
                  onChange={(e) => setBookFormData({ ...bookFormData, handle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">ISBN *</label>
                <Input
                  required
                  value={bookFormData.isbn}
                  onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Year</label>
                <Input
                  type="number"
                  value={bookFormData.publicationYear}
                  onChange={(e) => setBookFormData({ ...bookFormData, publicationYear: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Format</label>
                <select
                  value={bookFormData.format}
                  onChange={(e) => setBookFormData({ ...bookFormData, format: e.target.value as BookFormat })}
                  className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
                >
                  <option value="PAPERBACK">PAPERBACK</option>
                  <option value="HARDCOVER">HARDCOVER</option>
                  <option value="EBOOK">EBOOK</option>
                  <option value="AUDIOBOOK">AUDIOBOOK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Cover Image URL</label>
              <Input
                placeholder="https://..."
                value={bookFormData.cover}
                onChange={(e) => setBookFormData({ ...bookFormData, cover: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Book Synopsis</label>
              <textarea
                rows={3}
                value={bookFormData.description}
                onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                className="w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] p-2 text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6f7f64]"
              />
            </div>

            {editingBook && (
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Catalog Status</label>
                <select
                  value={bookFormData.status}
                  onChange={(e) => setBookFormData({ ...bookFormData, status: e.target.value as BookStatus })}
                  className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setBookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBook ? 'Save Changes' : 'Create Book'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Add Copy */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent onClose={() => setCopyModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Register Physical Copy (Barcode)</DialogTitle>
            <DialogDescription>
              Assign a unique barcode to a catalog title
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCopy} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Barcode Number *</label>
              <Input
                required
                value={copyFormData.barcode}
                onChange={(e) => setCopyFormData({ ...copyFormData, barcode: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Catalog Title *</label>
              <select
                value={copyFormData.bookId}
                onChange={(e) => setCopyFormData({ ...copyFormData, bookId: Number(e.target.value) })}
                className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.handle}] {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setCopyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Register Copy</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Issue Loan */}
      <Dialog open={loanModalOpen} onOpenChange={setLoanModalOpen}>
        <DialogContent onClose={() => setLoanModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Issue Book Loan Ticket</DialogTitle>
            <DialogDescription>
              Assign a physical copy to a reader with a return deadline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLoan} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Borrower User ID *</label>
              <Input
                type="number"
                required
                placeholder="e.g. 3 (Member Bin)"
                value={loanFormData.userId || ''}
                onChange={(e) => setLoanFormData({ ...loanFormData, userId: Number(e.target.value) })}
              />
              <span className="text-[11px] text-[#6f7f64] block mt-1">
                Tip: Default seeded member Bin has ID = 3
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Book Copy ID *</label>
              <Input
                type="number"
                required
                placeholder="e.g. 1 or 2"
                value={loanFormData.bookCopyId || ''}
                onChange={(e) => setLoanFormData({ ...loanFormData, bookCopyId: Number(e.target.value) })}
              />
              <span className="text-[11px] text-[#6f7f64] block mt-1">
                Refer to copy IDs in the Physical Copies tab
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Due Date *</label>
              <Input
                type="date"
                required
                value={loanFormData.dueDate}
                onChange={(e) => setLoanFormData({ ...loanFormData, dueDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setLoanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Issue Loan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Modal Renew Loan */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent onClose={() => setRenewModalOpen(false)} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Extend Loan Period</DialogTitle>
            <DialogDescription>
              Grant additional borrowing days for loan {selectedLoanForRenew?.loanCode}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenewLoan} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Days to Extend</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={renewDays}
                onChange={(e) => setRenewDays(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setRenewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Renewal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Modal Create User */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent onClose={() => setUserModalOpen(false)} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Create Reader / Staff Account</DialogTitle>
            <DialogDescription>
              Register a new user account with assigned library permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Username *</label>
                <Input
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Full Name *</label>
                <Input
                  required
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Email Address *</label>
              <Input
                type="email"
                required
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Initial Password</label>
                <Input
                  type="password"
                  placeholder="Default: libro123"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Phone Number</label>
                <Input
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">Role *</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                className="h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] px-3 text-xs bg-transparent"
              >
                <option value="MEMBER">MEMBER (Library Reader)</option>
                <option value="LIBRARIAN">LIBRARIAN (Circulation Staff)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#c8d0b7]/50 dark:border-[#3d4b3e]">
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
