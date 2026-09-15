import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  IconUser,
  IconArrowLeft,
  IconBook2,
  IconLock,
  IconLockOpen,
  IconTrash,
  IconMail,
  IconPhone,
  IconId,
  IconCheck,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { UserResponse, LoanResponse, UserRole, UserStatus } from '@/types/api'

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateStr
}

function formatLoanStatus(status?: string) {
  if (!status) return '—'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export function AdminMemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction } = useAdmin()
  const { isAdmin } = useAuth()

  const [user, setUser] = useState<UserResponse | null>(null)
  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'MEMBER' as UserRole,
    status: 'ACTIVE' as UserStatus,
  })

  const loadMemberData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [userData, loansData] = await Promise.all([
        api.adminGetUser(userId),
        api.adminGetLoans({ userId: [userId], size: 100 }),
      ])
      setUser(userData)
      setLoans(loansData.content || [])
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role,
        status: userData.status,
      })
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load member profile')
    } finally {
      setLoading(false)
    }
  }, [userId, showFeedback])

  useEffect(() => {
    loadMemberData()
  }, [loadMemberData])

  const isDirty = useMemo(() => {
    if (!user) return false
    return (
      formData.fullName !== (user.fullName || '') ||
      formData.phone !== (user.phone || '') ||
      formData.role !== user.role ||
      formData.status !== user.status
    )
  }, [user, formData])

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user || !user.id) return

    setSaving(true)
    try {
      const updated = await api.adminUpdateUser(user.id, {
        fullName: formData.fullName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        status: formData.status,
      })
      setUser(updated)
      setFormData({
        fullName: updated.fullName || '',
        email: updated.email || '',
        phone: updated.phone || '',
        role: updated.role,
        status: updated.status,
      })
      showFeedback('success', 'Member profile updated successfully')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update member profile')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCardStatus = async () => {
    if (!user || !user.id) return
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setActionLoading(true)
    try {
      const updated = await api.adminUpdateUser(user.id, {
        status: newStatus,
      })
      setUser(updated)
      setFormData((prev) => ({ ...prev, status: newStatus }))
      showFeedback(
        'success',
        `Library card is now ${newStatus === 'ACTIVE' ? 'ACTIVATED' : 'LOCKED'}!`
      )
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update card status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!user || !user.id) return
    if (!confirm(`Are you sure you want to delete member ${user.fullName || user.username}? This action cannot be undone.`)) return

    setActionLoading(true)
    try {
      await api.adminDeleteUser(user.id)
      showFeedback('success', 'Member account deleted successfully')
      navigate('/admin/members')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete member')
    } finally {
      setActionLoading(false)
    }
  }

  // Header Actions
  useEffect(() => {
    if (user) {
      setHeaderAction(
        <div className="flex items-center gap-2">
          {user.status === 'ACTIVE' ? (
            <button
              type="button"
              onClick={handleToggleCardStatus}
              disabled={actionLoading}
              className={`h-8 px-3 text-xs font-medium rounded-md border flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-rose-500 hover:bg-rose-500/10 border-rose-500/30 ${t.secondaryBtn}`}
            >
              <IconLock size={14} />
              Lock Card
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleCardStatus}
              disabled={actionLoading}
              className={`h-8 px-3 text-xs font-medium rounded-md border flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/30 ${t.secondaryBtn}`}
            >
              <IconLockOpen size={14} />
              Activate Card
            </button>
          )}

          {isDirty && (
            <button
              type="button"
              onClick={() => handleSaveChanges()}
              disabled={saving}
              className={`h-8 px-4 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 ${t.primaryBtn}`}
            >
              <IconCheck size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [user, isDirty, saving, actionLoading, t.primaryBtn, t.secondaryBtn, setHeaderAction])

  useEffect(() => {
    return () => setHeaderAction(null)
  }, [setHeaderAction])

  const stats = useMemo(() => {
    const total = loans.length
    const borrowed = loans.filter((l) => l.status === 'ONGOING').length
    const overdue = loans.filter((l) => l.status === 'OVERDUE').length
    const returned = loans.filter((l) => l.status === 'RETURNED').length
    return { total, borrowed, overdue, returned }
  }, [loans])

  if (loading) {
    return (
      <div className={`p-16 text-center text-sm ${t.subTextColor}`}>
        Loading member record...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className={`text-sm ${t.subTextColor}`}>Member not found or has been removed.</p>
        <button
          onClick={() => navigate('/admin/members')}
          className={`h-8 px-3 text-xs font-medium rounded-md border ${t.secondaryBtn}`}
        >
          Return to Member Directory
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back link & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/members')}
            className={`text-xs font-medium inline-flex items-center gap-1 mb-2 hover:underline cursor-pointer ${t.subTextColor}`}
          >
            <IconArrowLeft size={14} />
            Back to Member Directory
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base border shrink-0 ${
                isDark ? 'bg-[#252a34] text-gray-200 border-[#3e4756]' : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : <IconUser size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className={`text-lg sm:text-xl font-bold font-serif ${t.titleColor}`}>
                  {user.fullName || user.username}
                </h1>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                    user.status === 'ACTIVE'
                      ? isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {user.status}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase ${
                    isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <p className={`text-xs font-mono mt-0.5 ${t.subTextColor}`}>
                Username: @{user.username} • Card ID #{user.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form & Loan History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Member Information Form */}
          <div className={`p-5 rounded-xl border space-y-4 ${t.cardBg}`}>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${t.titleColor}`}>
              <IconId size={16} /> Member Profile Details
            </h2>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${t.titleColor}`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    className={`h-9 px-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${t.titleColor}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <IconMail size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition opacity-70 cursor-not-allowed ${t.inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${t.titleColor}`}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <IconPhone size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 0901234567"
                      className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${t.titleColor}`}>
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className={`h-9 px-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BANNED">BANNED</option>
                  </select>
                </div>
              </div>

              {isDirty && (
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`h-9 px-4 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
                  >
                    {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Borrowing / Circulation History */}
          <div className={`p-5 rounded-xl border space-y-4 ${t.cardBg}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-bold flex items-center gap-2 ${t.titleColor}`}>
                <IconBook2 size={16} /> Circulation & Borrowing History ({loans.length})
              </h2>
            </div>

            {loans.length === 0 ? (
              <div className={`p-8 text-center text-xs ${t.subTextColor}`}>
                No loans recorded for this member yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`h-9 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} text-xs font-semibold ${t.subTextColor}`}>
                      <th className="py-2 px-3">Loan Code</th>
                      <th className="py-2 px-3">Book Title</th>
                      <th className="py-2 px-3">Borrowed</th>
                      <th className="py-2 px-3">Due Date</th>
                      <th className="py-2 px-3">Returned</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent text-xs">
                    {loans.map((l) => (
                      <tr
                        key={l.id}
                        className={`border-b transition-colors ${
                          isDark ? 'border-[#20242c]' : 'border-gray-200'
                        } ${t.tableRow}`}
                      >
                        <td className="py-2.5 px-3 font-mono font-medium">
                          <Link
                            to={`/admin/circulation/${l.id}`}
                            className="hover:underline text-blue-600 dark:text-blue-400"
                          >
                            {l.loanCode}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3">
                          {l.bookId ? (
                            <Link
                              to={`/admin/books/${l.bookId}`}
                              className={`font-medium hover:underline hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[200px] block ${t.titleColor}`}
                            >
                              {l.bookTitle || `Book #${l.bookId}`}
                            </Link>
                          ) : (
                            <span className={t.titleColor}>{l.bookTitle}</span>
                          )}
                        </td>
                        <td className={`py-2.5 px-3 font-mono ${t.subTextColor}`}>
                          {formatDate(l.borrowDate)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          <span className={l.status === 'OVERDUE' ? 'text-rose-500 font-bold' : t.titleColor}>
                            {formatDate(l.dueDate)}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 font-mono ${t.subTextColor}`}>
                          {formatDate(l.returnDate || undefined)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                              l.status === 'ONGOING'
                                ? isDark
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                : l.status === 'OVERDUE'
                                ? isDark
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                                : isDark
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {formatLoanStatus(l.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics & Danger Zone */}
        <div className="space-y-6">
          {/* Patron Activity Stats Card */}
          <div className={`p-5 rounded-xl border space-y-4 ${t.cardBg}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.subTextColor}`}>
              Circulation Overview
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181a20] border-[#252a34]' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[11px] ${t.subTextColor}`}>Active Borrowed</p>
                <p className="text-xl font-bold font-mono text-blue-500 mt-1">{stats.borrowed}</p>
              </div>

              <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181a20] border-[#252a34]' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[11px] ${t.subTextColor}`}>Overdue Books</p>
                <p className={`text-xl font-bold font-mono mt-1 ${stats.overdue > 0 ? 'text-rose-500' : t.titleColor}`}>
                  {stats.overdue}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181a20] border-[#252a34]' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[11px] ${t.subTextColor}`}>Returned Books</p>
                <p className="text-xl font-bold font-mono text-emerald-500 mt-1">{stats.returned}</p>
              </div>

              <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181a20] border-[#252a34]' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[11px] ${t.subTextColor}`}>Lifetime Loans</p>
                <p className={`text-xl font-bold font-mono mt-1 ${t.titleColor}`}>{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Account Meta Card */}
          <div className={`p-5 rounded-xl border space-y-3 ${t.cardBg}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.subTextColor}`}>
              Account Meta
            </h3>

            <div className={`text-xs space-y-2.5 ${t.titleColor}`}>
              <div className="flex items-center justify-between">
                <span className={t.subTextColor}>Member ID</span>
                <span className="font-mono font-medium">#{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={t.subTextColor}>Username</span>
                <span className="font-mono font-medium">@{user.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={t.subTextColor}>Role</span>
                <span className="font-mono font-medium uppercase">{user.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={t.subTextColor}>Card Status</span>
                <span className="font-mono font-medium uppercase">{user.status}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {isAdmin && (
            <div className={`p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Danger Zone
              </h3>
              <p className={`text-xs ${t.subTextColor}`}>
                Permanently delete this reader account and all associated records.
              </p>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={actionLoading}
                className="w-full h-8 px-3 text-xs font-medium rounded-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <IconTrash size={14} />
                Delete Member
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
