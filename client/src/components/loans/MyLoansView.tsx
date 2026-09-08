import { useState, useEffect, useCallback } from 'react'
import type { LoanPublicResponse, LoanStatus } from '@/types/api'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  IconBook,
  IconCalendar,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconBarcode,
  IconRefresh,
  IconLogin,
  IconChevronLeft,
  IconChevronRight,
  IconBooks,
} from '@tabler/icons-react'

interface MyLoansViewProps {
  onOpenAuth: () => void
}

export function MyLoansView({ onOpenAuth }: MyLoansViewProps) {
  const { user } = useAuth()
  const [loans, setLoans] = useState<LoanPublicResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchMyLoans = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.getMyLoans({
        status: statusFilter || undefined,
        page,
        size: 10,
      })
      setLoans(res.content || [])
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch loans:', err)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [user, statusFilter, page])

  useEffect(() => {
    fetchMyLoans()
  }, [fetchMyLoans])

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-2xl border border-[#c8d0b7] dark:border-[#3d4b3e] shadow-sm max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/50 flex items-center justify-center text-[#3d4b3e] dark:text-[#c8d0b7] mx-auto mb-4">
          <IconLogin size={28} />
        </div>
        <h2 className="font-serif font-bold text-xl text-[#1e2320] dark:text-[#f5f3e6] mb-2">
          Sign In to Access Your Bookshelf
        </h2>
        <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mb-6">
          Log in with your library account to view your borrowed titles, track return dates, and manage your reading shelves.
        </p>
        <Button onClick={onOpenAuth} className="gap-2">
          <IconLogin size={16} /> Sign In to Libro
        </Button>
      </div>
    )
  }

  const getLoanStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'BORROWED':
        return (
          <Badge variant="warning" className="gap-1">
            <IconClock size={12} /> Borrowed
          </Badge>
        )
      case 'RETURNED':
        return (
          <Badge variant="success" className="gap-1">
            <IconCheck size={12} /> Returned
          </Badge>
        )
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="gap-1">
            <IconAlertTriangle size={12} /> Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Quick stats
  const activeLoansCount = loans.filter((l) => l.status === 'BORROWED').length
  const overdueLoansCount = loans.filter((l) => l.status === 'OVERDUE').length
  const returnedLoansCount = loans.filter((l) => l.status === 'RETURNED').length

  return (
    <div className="space-y-6">
      {/* Goodreads "My Books" Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c8d0b7] dark:border-[#3d4b3e] pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#1e2320] dark:text-[#f5f3e6]">
            My Bookshelf & Circulation Loans
          </h2>
          <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] mt-1 font-serif italic">
            Reader profile for <strong className="text-[#3d4b3e] dark:text-[#f5f3e6]">@{user.username}</strong> ({user.fullName || 'Member'})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMyLoans} className="gap-1.5 self-start sm:self-auto text-xs">
          <IconRefresh size={14} /> Refresh Shelf
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#c8d0b7]/25 dark:bg-[#252c28]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-serif font-bold uppercase text-[#3d4b3e] dark:text-[#c8d0b7]">Currently Reading</p>
              <h3 className="text-2xl font-extrabold text-[#1e2320] dark:text-[#f5f3e6] mt-1">{activeLoansCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#c8d0b7]/50 dark:bg-[#3d4b3e] flex items-center justify-center text-[#3d4b3e] dark:text-[#f5f3e6]">
              <IconClock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-serif font-bold uppercase text-rose-800 dark:text-rose-400">Overdue Returns</p>
              <h3 className="text-2xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">{overdueLoansCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-200/80 dark:bg-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-300">
              <IconAlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#6f7f64]/15 dark:bg-[#252c28]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-serif font-bold uppercase text-[#3d4b3e] dark:text-[#c8d0b7]">Completed Reads</p>
              <h3 className="text-2xl font-extrabold text-[#1e2320] dark:text-[#f5f3e6] mt-1">{returnedLoansCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#6f7f64]/30 dark:bg-[#3d4b3e] flex items-center justify-center text-[#3d4b3e] dark:text-[#f5f3e6]">
              <IconCheck size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goodreads Shelves Tabs */}
      <div className="flex items-center gap-2 bg-[#faf9f4] dark:bg-[#252c28] p-3 rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
        <span className="text-xs font-bold text-[#6f7f64] dark:text-[#c8d0b7] mr-2 flex items-center gap-1">
          <IconBooks size={15} /> Shelf:
        </span>
        {(['', 'BORROWED', 'OVERDUE', 'RETURNED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st as LoanStatus)
              setPage(1)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-[#3d4b3e] text-[#f5f3e6] shadow-xs'
                : 'bg-[#c8d0b7]/40 dark:bg-[#1e2320] text-[#1e2320] dark:text-[#c8d0b7] hover:bg-[#c8d0b7]/70'
            }`}
          >
            {st === '' ? 'All Books' : st === 'BORROWED' ? 'Currently Borrowed' : st === 'OVERDUE' ? 'Overdue' : 'Read / Returned'}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#6f7f64]">Loading your bookshelf...</div>
      ) : loans.length === 0 ? (
        <div className="p-12 text-center bg-[#faf9f4] dark:bg-[#252c28] rounded-xl border border-[#c8d0b7] dark:border-[#3d4b3e]">
          <IconBook size={40} className="mx-auto text-[#6f7f64] mb-2" />
          <h3 className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6] text-sm">
            Your bookshelf is currently empty
          </h3>
          <p className="text-xs text-[#6f7f64] mt-1">
            Browse our library catalog to discover titles to read and borrow.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Date Borrowed</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Date Returned</TableHead>
              <TableHead>Shelf Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.loanCode}>
                <TableCell className="font-mono font-semibold text-xs text-[#3d4b3e] dark:text-[#c8d0b7]">
                  {loan.loanCode}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-7 bg-[#c8d0b7]/30 rounded-xs book-shadow overflow-hidden shrink-0 flex items-center justify-center">
                      {loan.bookCover ? (
                        <img src={loan.bookCover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <IconBook size={14} className="text-[#6f7f64]" />
                      )}
                    </div>
                    <div>
                      <span className="font-serif font-bold text-[#1e2320] dark:text-[#f5f3e6] block text-xs hover:underline cursor-pointer">
                        {loan.bookTitle}
                      </span>
                      <span className="text-[11px] text-[#6f7f64] font-mono">
                        {loan.bookHandle}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-[#1e2320] dark:text-[#f5f3e6]">
                  <span className="inline-flex items-center gap-1">
                    <IconBarcode size={14} className="text-[#6f7f64]" />
                    {loan.barcode}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                  <span className="inline-flex items-center gap-1">
                    <IconCalendar size={13} className="text-[#6f7f64]" />
                    {loan.borrowDate}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-medium">
                  <span className={`inline-flex items-center gap-1 ${
                    loan.status === 'OVERDUE' ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-[#1e2320] dark:text-[#f5f3e6]'
                  }`}>
                    <IconClock size={13} />
                    {loan.dueDate}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
                  {loan.returnDate || '—'}
                </TableCell>
                <TableCell>{getLoanStatusBadge(loan.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#c8d0b7] dark:border-[#3d4b3e] pt-4">
          <span className="text-xs text-[#6f7f64]">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1"
            >
              <IconChevronLeft size={14} /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs gap-1"
            >
              Next <IconChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
