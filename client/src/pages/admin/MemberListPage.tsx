import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  IconSearch,
  IconPlus,
  IconLock,
  IconLockOpen,
  IconArrowsUpDown,
  IconUser,
  IconFilter2,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from '@/components/admin/AdminContext'
import { useAuth } from '@/context/AuthContext'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
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
  const [sortBy, setSortBy] = useState<'default' | 'name-asc' | 'name-desc'>('default')
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])

  const removeFilterField = (field: string) => {
    setActiveFilterFields(activeFilterFields.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
  }

  const resetAllFilters = () => {
    setStatusFilter('')
    setActiveFilterFields([])
  }

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
        size: 100,
      })
      setUsers(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load member list')
    } finally {
      setLoading(false)
    }
  }, [keyword, showFeedback])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = useMemo(() => {
    let list = [...users]
    if (statusFilter) {
      list = list.filter((u) => u.status === statusFilter)
    }
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => (a.fullName || a.username).localeCompare(b.fullName || b.username))
    }
    if (sortBy === 'name-desc') {
      return list.sort((a, b) => (b.fullName || b.username).localeCompare(a.fullName || a.username))
    }
    return list
  }, [users, statusFilter, sortBy])

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const validIds = filteredUsers
      .map((u) => u.id)
      .filter((id): id is number => typeof id === 'number')
    if (selectedUserIds.length === validIds.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(validIds)
    }
  }

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
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password || 'libro123',
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
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
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search reader by name or email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  sortBy !== 'default'
                    ? isDark
                      ? 'bg-[#252a34] border-blue-500/50 text-blue-400'
                      : 'bg-blue-50 border-blue-300 text-blue-600'
                    : isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Sort options"
              >
                <IconArrowsUpDown size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSortBy('default')}
                className={sortBy === 'default' ? 'font-semibold text-blue-500' : ''}
              >
                Default
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-asc')}
                className={sortBy === 'name-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-desc')}
                className={sortBy === 'name-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Name (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          {isAdmin && (
            <button
              onClick={() => {
                setFormData({ username: '', email: '', password: '', fullName: '', phone: '' })
                setAddModalOpen(true)
              }}
              className={`h-9 px-4 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
            >
              <IconPlus size={15} /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Filter Section Under Searchbar */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <div
          className={`h-9 flex items-center gap-1.5 px-3 rounded-md border text-xs sm:text-[13px] font-semibold select-none ${
            isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]' : 'bg-gray-100 border-gray-300 text-gray-800'
          }`}
        >
          <IconFilter2 size={15} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
          <span>Filter</span>
        </div>

        {/* Status Filter (if active) */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Locked' },
            ]}
            onChange={(val) => setStatusFilter(val)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Status"
          />
        )}

        {/* Add Filter Plus Button (DropdownMenu) */}
        {activeFilterFields.length < 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#8c94a5] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title="Add filter"
              >
                <IconPlus size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {!activeFilterFields.includes('status') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'status'])}>
                  Status
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset Button */}
        {activeFilterFields.length > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-xs sm:text-[13px] text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Counter & Bulk Actions */}
      <div className="flex items-center justify-between pt-0.5 text-xs font-mono">
        <span className={t.mutedColor}>Total {filteredUsers.length} members</span>
        {selectedUserIds.length > 0 && (
          <span className="text-blue-500 font-semibold">
            {selectedUserIds.length} selected
          </span>
        )}
      </div>

      {/* Member List Table - Frameless style matching BookCatalogPage */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading member directory...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length
                        ? true
                        : selectedUserIds.length > 0
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="py-2.5 px-4 text-xs sm:text-[13px] font-semibold">
                  Member
                </th>
                <th className="py-2.5 px-4 text-xs sm:text-[13px] font-semibold">
                  Email
                </th>
                <th className="py-2.5 px-4 text-xs sm:text-[13px] font-semibold">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => handleOpenDetail(u)}
                  className={`group border-b transition-colors cursor-pointer ${
                    isDark ? 'border-[#20242c]' : 'border-gray-200'
                  } ${t.tableRow}`}
                >
                  <td
                    className="w-10 px-3 text-center align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={u.id != null && selectedUserIds.includes(u.id)}
                      onCheckedChange={() => u.id != null && toggleSelectUser(u.id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                          isDark
                            ? 'bg-[#252a34] text-gray-300 border-[#3e4756]'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {u.fullName ? u.fullName.charAt(0).toUpperCase() : <IconUser size={16} />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium text-sm transition-colors block ${t.titleColor} ${
                            isDark ? 'group-hover:text-white' : 'group-hover:text-[#066fd1]'
                          }`}
                        >
                          {u.fullName || u.username}
                        </span>
                        {u.status !== 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {u.status === 'BANNED' ? 'Banned' : 'Locked'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>
                    {u.email}
                  </td>
                  <td className={`py-3 px-4 text-xs font-mono ${t.subTextColor}`}>
                    {u.phone || '—'}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className={`py-10 text-center text-sm ${t.subTextColor}`}
                  >
                    No members matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MEMBER DETAIL MODAL (Profile + Loan History + Lock Toggle) */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent onClose={() => setDetailModalOpen(false)} className={`sm:max-w-xl rounded-xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg flex items-center justify-between ${t.titleColor}`}>
              <span>Patron Profile & Reading History</span>
              {selectedUser && selectedUser.status !== 'ACTIVE' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {selectedUser.status === 'BANNED' ? 'Banned' : 'Locked'}
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
              <div className={`p-4 rounded-md border flex items-center justify-between ${isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <h4 className={`text-sm font-semibold ${t.titleColor}`}>{selectedUser.fullName || selectedUser.username}</h4>
                  <div className={`text-xs mt-0.5 ${t.subTextColor}`}>{selectedUser.email}</div>
                  <div className={`text-[11px] mt-0.5 font-mono ${t.mutedColor}`}>Phone: {selectedUser.phone || 'None'} · User ID #{selectedUser.id}</div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleCardLock(selectedUser)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${
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
                  <h5 className={`text-xs font-semibold uppercase tracking-wider ${t.titleColor}`}>Borrowing History</h5>
                  <span className={`text-xs ${t.subTextColor}`}>{userLoans.length} total loans</span>
                </div>

                {loadingLoans ? (
                  <div className={`p-6 text-center text-xs ${t.subTextColor}`}>Loading history...</div>
                ) : userLoans.length > 0 ? (
                  <div className={`rounded-md border overflow-hidden max-h-56 overflow-y-auto ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${t.tableHead}`}>
                          <th className="py-2.5 px-3 font-semibold">Loan</th>
                          <th className="py-2.5 px-3 font-semibold">Book Title</th>
                          <th className="py-2.5 px-3 font-semibold">Due Date</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Status</th>
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
                  <div className={`p-6 text-center text-xs rounded-md border ${isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-gray-200 bg-gray-50'} ${t.subTextColor}`}>
                    No loans on record for this member.
                  </div>
                )}
              </div>

              <div className={`flex justify-end pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
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
        <DialogContent onClose={() => setAddModalOpen(false)} className={`sm:max-w-md rounded-xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Register Member Account
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Create a library patron account with card borrowing rights
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMember} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>Full Name *</label>
              <input
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. John Doe"
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>Username *</label>
              <input
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. johndoe"
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. john@example.com"
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>Initial Password</label>
              <input
                type="password"
                placeholder="Default: libro123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>Phone Number</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 555-0199"
                className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${t.primaryBtn}`}
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
