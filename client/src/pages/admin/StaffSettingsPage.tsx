import { useState, useEffect, useCallback } from 'react'
import {
  IconSettings,
  IconUsers,
  
  IconPlus,
  IconTrash,
  IconRefresh,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { UserResponse, UserRole } from '@/types/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function StaffSettingsPage() {
  const { t, isDark, showFeedback, circulationSettings, setCirculationSettings } = useAdmin()
  const { user: currentUser } = useAuth()

  const [activeTab, setActiveTab] = useState<'staff' | 'policies'>('staff')
  const [staffUsers, setStaffUsers] = useState<UserResponse[]>([])
  const [, setLoading] = useState(false)

  // Local form for policies
  const [policiesForm, setPoliciesForm] = useState(circulationSettings)

  // Staff creation modal
  const [staffModalOpen, setStaffModalOpen] = useState(false)
  const [staffFormData, setStaffFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'LIBRARIAN' as UserRole,
  })

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetUsers({ page: 1, size: 50 })
      const filtered = (res.content || []).filter((u) => u.role === 'ADMIN' || u.role === 'LIBRARIAN')
      setStaffUsers(filtered)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load staff accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault()
    setCirculationSettings(policiesForm)
    showFeedback('success', 'Circulation policies and limits saved successfully!')
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.adminCreateUser({
        username: staffFormData.username,
        email: staffFormData.email,
        password: staffFormData.password || 'libro123',
        fullName: staffFormData.fullName,
        phone: staffFormData.phone || undefined,
        role: staffFormData.role,
      })
      showFeedback('success', `New ${staffFormData.role} account created!`)
      setStaffModalOpen(false)
      fetchStaff()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create staff account')
    }
  }

  const handleDeleteStaff = async (id: number) => {
    if (id === currentUser?.id) {
      showFeedback('error', 'Cannot remove your own active staff account')
      return
    }
    if (!confirm('Are you sure you want to deactivate or remove this staff account?')) return
    try {
      await api.adminDeleteUser(id)
      showFeedback('success', 'Staff account updated successfully')
      fetchStaff()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove staff account')
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className={`p-1 rounded-xl border ${t.cardBg}`}>
          <TabsTrigger
            value="staff"
            className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'staff'
                ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                : t.subTextColor
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconUsers size={15} /> Staff & Roles ({staffUsers.length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="policies"
            className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'policies'
                ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                : t.subTextColor
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconSettings size={15} /> Lending Policies & Rules
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: STAFF & ROLES */}
        <TabsContent value="staff" className="space-y-4 outline-none pt-3">
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${t.cardBg}`}>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>Staff Accounts Directory</h3>
              <p className={`text-[11px] ${t.subTextColor}`}>Librarians with circulation rights & Administrators with full control</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStaff}
                className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
              >
                <IconRefresh size={14} /> Refresh
              </button>
              <button
                onClick={() => {
                  setStaffFormData({ username: '', email: '', password: '', fullName: '', phone: '', role: 'LIBRARIAN' })
                  setStaffModalOpen(true)
                }}
                className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
              >
                <IconPlus size={15} /> Add Staff Account
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-xs font-semibold">Username</th>
                    <th className="py-3 px-4 text-xs font-semibold">Staff Full Name</th>
                    <th className="py-3 px-4 text-xs font-semibold">Email Address</th>
                    <th className="py-3 px-4 text-xs font-semibold">Assigned Role</th>
                    <th className="py-3 px-4 text-xs font-semibold">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {staffUsers.map((u) => (
                    <tr key={u.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">@{u.username}</td>
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>{u.fullName}</td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${t.statusActive}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => u.id && handleDeleteStaff(u.id)}
                            className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                              isDark ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'
                            }`}
                            title="Remove Staff Account"
                          >
                            <IconTrash size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: POLICIES */}
        <TabsContent value="policies" className="space-y-4 outline-none pt-3">
          <form onSubmit={handleSavePolicies} className={`p-5 rounded-2xl border space-y-4 max-w-xl ${t.cardBg}`}>
            <div>
              <h3 className={`text-sm font-bold font-sans ${t.titleColor}`}>Circulation Lending Policies</h3>
              <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
                Default checkout durations, max allowable renewals, and overdue penalty fee rate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className={`text-xs font-medium block mb-1 ${t.subTextColor}`}>Default Loan Period (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={policiesForm.defaultLoanDays}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      defaultLoanDays: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1 ${t.subTextColor}`}>Renewal Extension (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={policiesForm.defaultRenewDays}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      defaultRenewDays: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={`text-xs font-medium block mb-1 ${t.subTextColor}`}>Max Renewals Allowed</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={policiesForm.maxRenewalsAllowed}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      maxRenewalsAllowed: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1 ${t.subTextColor}`}>Overdue Fine/Day ($ USD)</label>
                <input
                  type="number"
                  step={0.10}
                  value={policiesForm.finePerDayOverdue}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      finePerDayOverdue: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
              </div>
            </div>

            <div className={`flex justify-end pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Save Circulation Policies
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* CREATE STAFF MODAL */}
      <Dialog open={staffModalOpen} onOpenChange={setStaffModalOpen}>
        <DialogContent onClose={() => setStaffModalOpen(false)} className={`sm:max-w-md rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}>
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-lg ${t.titleColor}`}>
              Create Staff Account
            </DialogTitle>
            <DialogDescription className={`text-xs ${t.subTextColor}`}>
              Grant circulation desk access or administrative permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-3 pt-2">
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Full Name *</label>
              <input
                required
                value={staffFormData.fullName}
                onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Username *</label>
              <input
                required
                value={staffFormData.username}
                onChange={(e) => setStaffFormData({ ...staffFormData, username: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Email Address *</label>
              <input
                type="email"
                required
                value={staffFormData.email}
                onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Role *</label>
              <select
                value={staffFormData.role}
                onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as UserRole })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              >
                <option value="LIBRARIAN">LIBRARIAN (Circulation Staff)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium ${t.subTextColor}`}>Password</label>
              <input
                type="password"
                value={staffFormData.password}
                onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                className={`w-full mt-1 h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                Create Staff
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
