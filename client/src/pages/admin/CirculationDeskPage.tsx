import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  IconArrowLeftRight,
  IconArrowBackUp,
  IconSearch,
  IconRefresh,
  IconBook2,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminCombobox } from '@/components/admin/AdminCombobox'
import type { AdminLayoutOutletContext } from '@/components/admin/AdminLayout'
import { api } from '@/services/api'
import type { LoanResponse, UserResponse, BookCopyResponse } from '@/types/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function CirculationDeskPage() {
  const { t, isDark, showFeedback, circulationSettings } = useAdmin()
  const { refreshCounts } = useOutletContext<AdminLayoutOutletContext>()

  const [activeTab, setActiveTab] = useState<'checkout' | 'returns'>('checkout')

  // Shared data
  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [copies, setCopies] = useState<BookCopyResponse[]>([])
  const [, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  // Checkout form state
  const [selectedUserId, setSelectedUserId] = useState<number>(0)
  const [scannedCopy, setScannedCopy] = useState<BookCopyResponse | null>(null)
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + circulationSettings.defaultLoanDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  )
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Renew modal
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedLoanForRenew, setSelectedLoanForRenew] = useState<LoanResponse | null>(null)
  const [renewDays, setRenewDays] = useState(circulationSettings.defaultRenewDays)

  const fetchCirculationData = useCallback(async () => {
    setLoading(true)
    try {
      const [loansRes, usersRes, copiesRes] = await Promise.all([
        api.adminGetLoans({ keyword: keyword || undefined, page: 1, size: 50 }),
        api.adminGetUsers({ page: 1, size: 100 }),
        api.adminGetBookCopies({ page: 1, size: 100 }),
      ])
      setLoans(loansRes.content || [])
      setUsers(usersRes.content || [])
      setCopies(copiesRes.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load circulation data')
    } finally {
      setLoading(false)
    }
  }, [keyword, showFeedback])

  useEffect(() => {
    fetchCirculationData()
  }, [fetchCirculationData])

  const handleIssueCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      showFeedback('error', 'Please select a patron borrower')
      return
    }
    if (!scannedCopy) {
      showFeedback('error', 'Please select a book copy')
      return
    }
    if (scannedCopy.status !== 'AVAILABLE') {
      showFeedback('error', `This book copy is currently not available (${scannedCopy.status})`)
      return
    }

    setCheckoutLoading(true)
    try {
      await api.adminCreateLoan({
        userId: Number(selectedUserId),
        bookCopyId: Number(scannedCopy.id),
        dueDate,
      })
      showFeedback('success', `Loan ticket issued successfully for copy ${scannedCopy.barcode}!`)
      setSelectedUserId(0)
      setScannedCopy(null)
      fetchCirculationData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to issue loan ticket')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleReturnBook = async (id: number) => {
    if (!confirm('Confirm return processing for this loan?')) return
    try {
      await api.adminReturnLoan(id)
      showFeedback('success', 'Book returned and checked back into inventory!')
      fetchCirculationData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to return book')
    }
  }

  const handleRenewLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoanForRenew) return
    try {
      await api.adminRenewLoan(selectedLoanForRenew.id, {
        extensionDays: Number(renewDays),
      })
      showFeedback('success', 'Loan extension granted!')
      setRenewModalOpen(false)
      fetchCirculationData()
      refreshCounts()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to renew loan')
    }
  }

  const activeLoans = loans.filter((l) => l.status === 'BORROWED' || l.status === 'OVERDUE')
  const returnedLoans = loans.filter((l) => l.status === 'RETURNED')

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className={`p-1 rounded-xl border ${t.cardBg}`}>
          <TabsTrigger
            value="checkout"
            className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'checkout'
                ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                : t.subTextColor
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconArrowLeftRight size={15} /> Checkout (Issue Loan)
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="returns"
            className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'returns'
                ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                : t.subTextColor
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconArrowBackUp size={15} /> Returns & Extensions ({activeLoans.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CHECKOUT */}
        <TabsContent value="checkout" className="space-y-4 outline-none pt-3">
          <div className={`p-5 rounded-xl border ${t.cardBg}`}>
            <h3 className={`text-sm font-bold font-sans mb-1 ${t.titleColor}`}>
              New Borrowing Transaction
            </h3>
            <p className={`text-xs mb-4 ${t.subTextColor}`}>
              Issue physical book copies to library patrons.
            </p>

            <form onSubmit={handleIssueCheckout} className="space-y-4 max-w-2xl">
              {/* 1. Borrower Patron */}
              <div>
                <AdminCombobox
                  label="Borrower Patron *"
                  options={users.map((u) => ({
                    id: u.id || 0,
                    label: u.fullName,
                    sublabel: `${u.email} • @${u.username}${u.phone ? ` • ${u.phone}` : ''}`,
                    keywords: [u.email, u.username, u.fullName, u.phone || ''],
                  }))}
                  selectedIds={selectedUserId ? [selectedUserId] : []}
                  multiple={false}
                  onChange={(ids) => setSelectedUserId(ids[0] || 0)}
                />
              </div>

              {/* 2. Book Copy Selection (by ISBN, Title or Barcode) */}
              <div>
                <AdminCombobox
                  label="Available Book Copy *"
                  options={copies.filter((c) => c.status === 'AVAILABLE').map((c) => ({
                    id: c.id,
                    label: c.bookTitle || `Book ID #${c.bookId}`,
                    sublabel: `Barcode: ${c.barcode} • Location: ${c.location || 'Unassigned'}`,
                    keywords: [c.barcode, c.bookTitle || '', c.location || ''],
                  }))}
                  selectedIds={scannedCopy ? [scannedCopy.id] : []}
                  multiple={false}
                  onChange={(ids) => {
                    const found = copies.find((c) => c.id === ids[0]) || null
                    setScannedCopy(found)
                  }}
                />

                {/* Scanned Book Preview Card */}
                {scannedCopy && (
                  <div
                    className={`mt-2.5 p-3.5 rounded-lg border flex items-start gap-3.5 transition-all ${
                      scannedCopy.status === 'AVAILABLE'
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-emerald-50/70 border-emerald-200'
                        : isDark
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div
                      className={`w-10 h-14 rounded-[2px] border overflow-hidden shrink-0 flex items-center justify-center ${
                        isDark ? 'border-[#333a48] bg-[#16181d]' : 'border-gray-300 bg-gray-100'
                      }`}
                    >
                      <IconBook2 size={24} className={t.mutedColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs sm:text-sm font-semibold truncate ${t.titleColor}`}>
                          {scannedCopy.bookTitle || `Book ID #${scannedCopy.bookId}`}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                            scannedCopy.status === 'AVAILABLE' ? t.statusActive : t.statusOverdue
                          }`}
                        >
                          {scannedCopy.status}
                        </span>
                      </div>

                      <div className={`mt-1 text-xs space-y-0.5 ${t.subTextColor}`}>
                        <p className="flex items-center gap-2">
                          <span>
                            Barcode: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{scannedCopy.barcode}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Location: <span className="font-medium text-gray-900 dark:text-gray-200">{scannedCopy.location || 'Unassigned'}</span>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Due Return Date & Action Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end pt-1">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full h-9 px-3 rounded-md text-xs border outline-none ${t.inputBg}`}
                  />
                  <span className={`text-[11px] block mt-1 ${t.mutedColor}`}>
                    Default: {circulationSettings.defaultLoanDays} days
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={checkoutLoading || !selectedUserId || !scannedCopy || scannedCopy.status !== 'AVAILABLE'}
                    className={`h-9 px-5 text-xs font-semibold rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.primaryBtn}`}
                  >
                    {checkoutLoading ? 'Processing...' : 'Issue Loan'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Active Checked Out Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className={`p-3.5 border-b flex items-center justify-between ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>Active Circulating Loans</h4>
              <span className={`text-[11px] ${t.subTextColor}`}>{activeLoans.length} active tickets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Loan Code</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrower</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Item Barcode</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrowed</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Due Date</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {activeLoans.map((l) => (
                    <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{l.loanCode}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`font-medium ${t.titleColor}`}>{l.userFullName || l.username}</span>
                        <span className={`block text-[10px] font-mono ${t.mutedColor}`}>@{l.username}</span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`font-medium ${t.titleColor}`}>{l.bookTitle || `Copy #${l.bookCopyId}`}</span>
                        <span className={`block text-[10px] font-mono ${t.mutedColor}`}>{l.barcode}</span>
                      </td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{l.borrowDate}</td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        <span className={l.status === 'OVERDUE' ? 'text-rose-400 font-bold' : t.titleColor}>{l.dueDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            l.status === 'OVERDUE' ? t.statusOverdue : t.statusBorrowed
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReturnBook(l.id)}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${t.secondaryBtn}`}
                          >
                            Return
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLoanForRenew(l)
                              setRenewDays(circulationSettings.defaultRenewDays)
                              setRenewModalOpen(true)
                            }}
                            className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'text-[#8c94a5] hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeLoans.length === 0 && (
                    <tr>
                      <td colSpan={7} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                        No active loans currently in circulation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: RETURNS & HISTORY */}
        <TabsContent value="returns" className="space-y-4 outline-none pt-3">
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${t.cardBg}`}>
            <div className="relative w-full sm:w-80">
              <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
              <input
                placeholder="Search returned loans..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
              />
            </div>
            <button
              onClick={fetchCirculationData}
              className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
            >
              <IconRefresh size={14} /> Refresh
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Loan Code</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrower</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Book</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Borrowed Date</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Returned Date</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {returnedLoans.map((l) => (
                    <tr key={l.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{l.loanCode}</td>
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{l.userFullName || l.username}</td>
                      <td className={`py-3 px-4 text-xs ${t.titleColor}`}>{l.bookTitle || l.barcode}</td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{l.borrowDate}</td>
                      <td className={`py-3 px-4 text-xs font-semibold ${t.titleColor}`}>{l.returnDate || 'Completed'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${t.statusMuted}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {returnedLoans.length === 0 && (
                    <tr>
                      <td colSpan={6} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                        No return records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Renew Modal */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent onClose={() => setRenewModalOpen(false)} className={`sm:max-w-sm rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Extend Loan Period
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Grant additional borrowing days for ticket {selectedLoanForRenew?.loanCode}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenewLoan} className="space-y-3.5 pt-2">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Days to Extend</label>
              <input
                type="number"
                min={1}
                max={30}
                value={renewDays}
                onChange={(e) => setRenewDays(Number(e.target.value))}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setRenewModalOpen(false)}
                className={`h-9 px-4 text-xs font-medium rounded-lg transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`h-9 px-5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Confirm Extension
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
