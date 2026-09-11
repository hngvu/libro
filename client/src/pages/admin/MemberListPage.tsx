import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  
  IconLock,
  IconLockOpen,
  IconEye,
  
  
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { UserResponse, LoanResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function MemberListPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const { isAdmin } = useAuth()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  // Member Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [userLoans, setUserLoans] = useState<LoanResponse[]>([])
  const [loadingLoans, setLoadingLoans] = useState(false)

  // Add Member Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetUsers({
        keyword: keyword || undefined,
        role: 'MEMBER',
        page: 1,
        size: 50,
      })
      setUsers(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load member list')
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleOpenDetail = async (user: UserResponse) => {
    setSelectedUser(user)
    setDetailModalOpen(true)
    setLoadingLoans(true)
    try {
      const res = await api.adminGetLoans({ userId: user.id, page: 1, size: 20 })
      setUserLoans(res.content || [])
    } catch {
      setUserLoans([])
    } finally {
      setLoadingLoans(false)
    }
  }

  const handleToggleCardLock = async (user: UserResponse) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const confirmMsg =
      newStatus === 'INACTIVE'
        ? `Are you sure you want to lock the library card for ${user.fullName || user.username}? They won't be able to borrow books.`
        : `Unlock and activate the library card for ${user.fullName || user.username}?`

    if (!confirm(confirmMsg)) return

    try {
      if (user.id) await api.adminUpdateUser(user.id, { status: newStatus as any })
      showFeedback(
        'success',
        `Library card for ${user.fullName || user.username} is now ${newStatus === 'ACTIVE' ? 'ACTIVATED' : 'LOCKED'}!`
      )
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, status: newStatus as any })
      }
      fetchUsers()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to change card status')
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateUser({
        username: formData.username,
        email: formData.email,
        password: formData.password || 'libro123',
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: 'MEMBER',
      })
      showFeedback('success', 'New reader account registered successfully!')
      setAddModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create member')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${t.cardBg}`}>
        <div className="relative w-full sm:w-80">
          <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
          <input
            placeholder="Search reader by name, username, or email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchUsers}
            className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
          >
            <IconRefresh size={14} /> Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setFormData({ username: '', email: '', password: '', fullName: '', phone: '' })
                setAddModalOpen(true)
              }}
              className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
            >
              <IconPlus size={15} /> Add Reader Account
            </button>
          )}
        </div>
      </div>

      {/* Member List Table */}
      {loading ? (
        <div className={`p-10 text-center text-xs rounded-2xl border ${t.cardBg} ${t.subTextColor}`}>
          Loading reader directory...
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${t.tableHead}`}>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Username</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Patron Full Name</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Email Address</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Card Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {users.map((u) => (
                  <tr key={u.id} className={`border-b transition-colors ${t.tableRow}`}>
                    <td className="py-3 px-4 font-mono text-xs font-semibold">@{u.username}</td>
                    <td className="py-3 px-4 text-xs font-medium">
                      <span
                        onClick={() => handleOpenDetail(u)}
                        className={`cursor-pointer hover:underline ${t.titleColor}`}
                      >
                        {u.fullName || u.username}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{u.email}</td>
                    <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          u.status === 'ACTIVE'
                            ? t.statusActive
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'CARD ACTIVE' : 'LOCKED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(u)}
                          className={`h-7 px-2.5 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${t.secondaryBtn}`}
                          title="View Profile & Borrow History"
                        >
                          <IconEye size={14} /> Profile
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleCardLock(u)}
                            className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Lock Library Card' : 'Unlock Card'}
                          >
                            {u.status === 'ACTIVE' ? <IconLock size={15} /> : <IconLockOpen size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`py-8 text-center text-xs ${t.subTextColor}`}>
                      No members matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL MODAL (Profile + Loan History + Lock Toggle) */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent onClose={() => setDetailModalOpen(false)} className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg flex items-center justify-between ${t.titleColor}`}>
              <span>Patron Profile & Reading History</span>
              {selectedUser && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    selectedUser.status === 'ACTIVE' ? t.statusActive : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {selectedUser.status}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Member card information, contact details, and lifetime borrowing record
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 pt-2">
              {/* Profile Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <h4 className={`text-sm font-bold ${t.titleColor}`}>{selectedUser.fullName || selectedUser.username}</h4>
                  <div className={`text-xs mt-0.5 ${t.subTextColor}`}>{selectedUser.email}</div>
                  <div className={`text-[11px] mt-0.5 font-mono ${t.mutedColor}`}>Phone: {selectedUser.phone || 'None'} · User ID #{selectedUser.id}</div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleCardLock(selectedUser)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                      selectedUser.status === 'ACTIVE'
                        ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                  >
                    {selectedUser.status === 'ACTIVE' ? (
                      <>
                        <IconLock size={14} /> Lock Card
                      </>
                    ) : (
                      <>
                        <IconLockOpen size={14} /> Unlock Card
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Borrowing History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>Borrowing History</h5>
                  <span className={`text-[11px] ${t.subTextColor}`}>{userLoans.length} total loans</span>
                </div>

                {loadingLoans ? (
                  <div className={`p-6 text-center text-xs ${t.subTextColor}`}>Loading history...</div>
                ) : userLoans.length > 0 ? (
                  <div className={`rounded-xl border overflow-hidden max-h-56 overflow-y-auto ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${t.tableHead}`}>
                          <th className="py-2 px-3">Loan</th>
                          <th className="py-2 px-3">Book Title</th>
                          <th className="py-2 px-3">Due Date</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-transparent">
                        {userLoans.map((l) => (
                          <tr key={l.id} className={`border-b ${t.tableRow}`}>
                            <td className="py-2 px-3 font-mono">{l.loanCode}</td>
                            <td className={`py-2 px-3 font-medium ${t.titleColor}`}>{l.bookTitle || l.barcode}</td>
                            <td className={`py-2 px-3 ${t.subTextColor}`}>{l.dueDate}</td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                  l.status === 'RETURNED'
                                    ? t.statusMuted
                                    : l.status === 'OVERDUE'
                                    ? t.statusOverdue
                                    : t.statusBorrowed
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`p-6 text-center text-xs rounded-xl border ${isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-gray-200 bg-gray-50'} ${t.subTextColor}`}>
                    No loans on record for this member.
                  </div>
                )}
              </div>

              <div className={`flex justify-end pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE MEMBER MODAL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent onClose={() => setAddModalOpen(false)} className={`sm:max-w-md rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Register Reader Account
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Create a library patron account with card borrowing rights
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMember} className="space-y-3 pt-2">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Full Name *</label>
              <input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Username *</label>
              <input
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Initial Password</label>
              <input
                type="password"
                placeholder="Default: libro123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Phone Number</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Create Account
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
