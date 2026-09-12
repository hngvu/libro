import React, { useState, useEffect, useCallback } from 'react'
import {
  IconPlus,
  IconRefresh,
  IconCrown,
  IconCheck,
  IconEdit,
  IconTrash,
  IconClock,
  IconRotateClockwise,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { MembershipPlanResponse } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function MembershipPlansPage() {
  const { t, isDark, showFeedback } = useAdmin()

  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Modal: Create / Edit Plan
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MembershipPlanResponse | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'YEARLY' | 'LIFETIME',
    stripePriceId: '',
    stripeProductId: '',
    maxActiveLoans: 3,
    loanDurationDays: 14,
    maxRenewals: 1,
  })
  const [savingPlan, setSavingPlan] = useState(false)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.adminGetMembershipPlans()
      setPlans(data || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load membership plans')
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleOpenCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm({
      name: '',
      code: '',
      description: '',
      price: 0,
      billingCycle: 'MONTHLY',
      stripePriceId: '',
      stripeProductId: '',
      maxActiveLoans: 3,
      loanDurationDays: 14,
      maxRenewals: 1,
    })
    setPlanModalOpen(true)
  }

  const handleOpenEditPlan = (p: MembershipPlanResponse) => {
    setEditingPlan(p)
    setPlanForm({
      name: p.name,
      code: p.code,
      description: p.description || '',
      price: p.price,
      billingCycle: p.billingCycle || 'MONTHLY',
      stripePriceId: p.stripePriceId || '',
      stripeProductId: p.stripeProductId || '',
      maxActiveLoans: p.maxActiveLoans,
      loanDurationDays: p.loanDurationDays,
      maxRenewals: p.maxRenewals,
    })
    setPlanModalOpen(true)
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPlan(true)
    try {
      if (editingPlan) {
        await api.adminUpdateMembershipPlan(editingPlan.id, planForm)
        showFeedback('success', `Plan "${planForm.name}" updated successfully!`)
      } else {
        await api.adminCreateMembershipPlan(planForm)
        showFeedback('success', `Plan "${planForm.name}" created successfully!`)
      }
      setPlanModalOpen(false)
      fetchPlans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save membership plan')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleDeletePlan = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to archive membership plan "${name}"?`)) return
    try {
      await api.adminDeleteMembershipPlan(id)
      showFeedback('success', `Plan "${name}" archived!`)
      fetchPlans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive plan')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`font-sans font-bold text-lg xl:text-xl tracking-tight ${t.titleColor}`}>
            Membership Plans
          </h1>
          <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
            Configure subscription tiers, borrowing limits, renewal rules, and Stripe billing prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className={`h-9 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.secondaryBtn}`}
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreatePlan}
            className={`h-9 px-4 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${t.primaryBtn}`}
          >
            <IconPlus size={15} />
            Create Plan
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {plans.map((p) => {
          const isFree = Number(p.price) === 0
          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border-gray-200 shadow-xs'
              }`}
            >
              <div>
                {/* Top Tier Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <IconCrown size={18} className={isFree ? 'text-gray-400' : 'text-amber-400'} />
                      <h3 className={`font-sans font-bold text-base ${t.titleColor}`}>{p.name}</h3>
                    </div>
                    <span
                      className={`inline-block font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded mt-1.5 ${
                        isDark
                          ? 'bg-[#16181d] text-blue-400 border border-[#2c323e]'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}
                    >
                      {p.code}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                      p.status === 'ACTIVE'
                        ? isDark
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDark
                        ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Price Header */}
                <div className="mt-4 pb-3 border-b border-gray-200 dark:border-[#2c323e]">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold font-sans ${t.titleColor}`}>
                      ${Number(p.price).toFixed(2)}
                    </span>
                    <span className={`text-xs ${t.mutedColor}`}>
                      /{p.billingCycle?.toLowerCase() || 'month'}
                    </span>
                  </div>
                  {p.description && (
                    <p className={`text-xs mt-2 line-clamp-2 ${t.subTextColor}`}>{p.description}</p>
                  )}
                </div>

                {/* Feature Matrix */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${t.subTextColor}`}>
                      <IconCheck size={14} className="text-emerald-400 shrink-0" />
                      Max Active Loans:
                    </span>
                    <span className={`font-semibold font-mono ${t.titleColor}`}>{p.maxActiveLoans} books</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${t.subTextColor}`}>
                      <IconClock size={14} className="text-blue-400 shrink-0" />
                      Borrow Duration:
                    </span>
                    <span className={`font-semibold font-mono ${t.titleColor}`}>{p.loanDurationDays} days</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${t.subTextColor}`}>
                      <IconRotateClockwise size={14} className="text-purple-400 shrink-0" />
                      Max Loan Renewals:
                    </span>
                    <span className={`font-semibold font-mono ${t.titleColor}`}>{p.maxRenewals} times</span>
                  </div>

                  {p.stripePriceId && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-[#262a34]">
                      <span className={`text-[10px] ${t.mutedColor}`}>Stripe Price ID:</span>
                      <span className={`text-[10px] font-mono truncate max-w-[120px] ${t.subTextColor}`}>
                        {p.stripePriceId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Card Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-gray-100 dark:border-[#262a34]">
                <button
                  onClick={() => handleOpenEditPlan(p)}
                  className={`h-8 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${t.secondaryBtn}`}
                >
                  <IconEdit size={13} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlan(p.id, p.name)}
                  className={`h-8 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
                    isDark ? 'border-[#2c323e]' : 'border-gray-200'
                  }`}
                >
                  <IconTrash size={13} />
                  Archive
                </button>
              </div>
            </div>
          )
        })}

        {plans.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-xs text-gray-500">
            No membership plans found. Click "Create Plan" to create the first subscription plan.
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Membership Plan */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent
          onClose={() => setPlanModalOpen(false)}
          className={`sm:max-w-xl rounded-2xl shadow-2xl p-6 border ${t.modalBg}`}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Membership Plan'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                  Plan Name *
                </label>
                <input
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Pro Scholar"
                  className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                  Plan Code * (Unique)
                </label>
                <input
                  required
                  value={planForm.code}
                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PRO_MONTHLY"
                  className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm font-mono border outline-none ${t.inputBg}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                  className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                  Billing Cycle *
                </label>
                <select
                  value={planForm.billingCycle}
                  onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value as any })}
                  className={`w-full h-9 px-3 rounded-md text-xs sm:text-sm border outline-none ${t.inputBg}`}
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="YEARLY">YEARLY</option>
                  <option value="LIFETIME">LIFETIME</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
                Description
              </label>
              <textarea
                rows={2}
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Key benefits and target readers..."
                className={`w-full p-2.5 rounded-md text-xs border outline-none resize-none ${t.inputBg}`}
              />
            </div>

            {/* Privilege Limits */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${t.subTextColor}`}>
                  Max Loans *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={planForm.maxActiveLoans}
                  onChange={(e) => setPlanForm({ ...planForm, maxActiveLoans: parseInt(e.target.value) || 1 })}
                  className={`w-full h-9 px-2.5 rounded-md text-xs border outline-none ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${t.subTextColor}`}>
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={planForm.loanDurationDays}
                  onChange={(e) => setPlanForm({ ...planForm, loanDurationDays: parseInt(e.target.value) || 1 })}
                  className={`w-full h-9 px-2.5 rounded-md text-xs border outline-none ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${t.subTextColor}`}>
                  Max Renewals *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={planForm.maxRenewals}
                  onChange={(e) => setPlanForm({ ...planForm, maxRenewals: parseInt(e.target.value) || 0 })}
                  className={`w-full h-9 px-2.5 rounded-md text-xs border outline-none ${t.inputBg}`}
                />
              </div>
            </div>

            {/* Stripe Integration IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${t.subTextColor}`}>
                  Stripe Price ID (Optional)
                </label>
                <input
                  value={planForm.stripePriceId}
                  onChange={(e) => setPlanForm({ ...planForm, stripePriceId: e.target.value })}
                  placeholder="price_1N..."
                  className={`w-full h-9 px-3 rounded-md text-xs font-mono border outline-none ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${t.subTextColor}`}>
                  Stripe Product ID (Optional)
                </label>
                <input
                  value={planForm.stripeProductId}
                  onChange={(e) => setPlanForm({ ...planForm, stripeProductId: e.target.value })}
                  placeholder="prod_1N..."
                  className={`w-full h-9 px-3 rounded-md text-xs font-mono border outline-none ${t.inputBg}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className={`h-9 px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPlan}
                className={`h-9 px-5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
              >
                {savingPlan ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
