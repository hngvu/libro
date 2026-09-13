import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconPlus,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/services/api'
import type {
  MembershipPlanResponse,
  MembershipPlanPriceResponse,
} from '@/types/api'

export function AdminPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const planId = isNew ? null : Number(id)
  const navigate = useNavigate()
  const { t, isDark, showFeedback, setHeaderAction } = useAdmin()

  const [plan, setPlan] = useState<MembershipPlanResponse | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  // Form State
  const [form, setForm] = useState<{
    name: string
    code: string
    description: string
    stripeProductId: string
    maxActiveLoans: number
    loanDurationDays: number
    maxRenewals: number
    status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE'
    prices: MembershipPlanPriceResponse[]
  }>({
    name: '',
    code: '',
    description: '',
    stripeProductId: '',
    maxActiveLoans: 3,
    loanDurationDays: 14,
    maxRenewals: 1,
    status: 'ACTIVE',
    prices: [{ billingCycle: 'MONTHLY', price: 0, stripePriceId: '' }],
  })

  // Modal State for Editing / Adding Price
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null)
  const [priceForm, setPriceForm] = useState<{
    billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
    price: number | string
  }>({
    billingCycle: 'MONTHLY',
    price: 0,
  })

  const isDirty = useMemo(() => {
    if (isNew) {
      return Boolean(form.name.trim())
    }
    if (!plan) return false
    return (
      form.name !== (plan.name || '') ||
      form.description !== (plan.description || '') ||
      form.maxActiveLoans !== plan.maxActiveLoans ||
      form.loanDurationDays !== plan.loanDurationDays ||
      form.maxRenewals !== plan.maxRenewals ||
      form.status !== (plan.status || 'ACTIVE') ||
      JSON.stringify(form.prices) !== JSON.stringify(plan.prices || [])
    )
  }, [form, plan, isNew])

  const loadData = useCallback(async () => {
    if (isNew || !planId) return
    setLoading(true)
    try {
      const planData = await api.adminGetMembershipPlan(planId)
      setPlan(planData)
      setForm({
        name: planData.name || '',
        code: planData.code || '',
        description: planData.description || '',
        stripeProductId: planData.stripeProductId || '',
        maxActiveLoans: planData.maxActiveLoans ?? 3,
        loanDurationDays: planData.loanDurationDays ?? 14,
        maxRenewals: planData.maxRenewals ?? 1,
        status: (planData.status as 'ACTIVE' | 'ARCHIVED' | 'INACTIVE') || 'ACTIVE',
        prices:
          planData.prices && planData.prices.length > 0
            ? planData.prices
            : [{ billingCycle: 'MONTHLY', price: 0, stripePriceId: '' }],
      })
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load plan details')
    } finally {
      setLoading(false)
    }
  }, [planId, isNew, showFeedback])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openAddPriceModal = () => {
    const existingCycles = form.prices.map((p) => p.billingCycle)
    let nextCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME' = 'YEARLY'
    if (!existingCycles.includes('MONTHLY')) nextCycle = 'MONTHLY'
    else if (!existingCycles.includes('YEARLY')) nextCycle = 'YEARLY'
    else if (!existingCycles.includes('LIFETIME')) nextCycle = 'LIFETIME'

    setPriceForm({
      billingCycle: nextCycle,
      price: 0,
    })
    setEditingPriceIndex(null)
    setPriceModalOpen(true)
  }

  const openEditPriceModal = (idx: number) => {
    const p = form.prices[idx]
    if (!p) return
    setPriceForm({
      billingCycle: p.billingCycle as 'MONTHLY' | 'YEARLY' | 'LIFETIME',
      price: p.price,
    })
    setEditingPriceIndex(idx)
    setPriceModalOpen(true)
  }

  const savePlanWithPrices = async (newPrices: MembershipPlanPriceResponse[]) => {
    if (isNew || !planId) {
      setForm((prev) => ({ ...prev, prices: newPrices }))
      setPriceModalOpen(false)
      return
    }

    const finalCode =
      form.code.trim() ||
      form.name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') ||
      'PLAN_' + Date.now()

    setSaving(true)
    try {
      const payload = {
        ...form,
        code: finalCode,
        description: form.description?.trim() || undefined,
        stripeProductId: form.stripeProductId?.trim() || undefined,
        maxActiveLoans: Number(form.maxActiveLoans) || 1,
        loanDurationDays: Number(form.loanDurationDays) || 1,
        maxRenewals: Number(form.maxRenewals) || 0,
        prices: newPrices.map((p) => ({
          id: p.id,
          billingCycle: p.billingCycle,
          price: Number(p.price || 0),
          stripePriceId: p.stripePriceId?.trim() || undefined,
        })),
      }

      const updated = await api.adminUpdateMembershipPlan(planId, payload as any)
      setPlan(updated)
      setForm({
        name: updated.name,
        code: updated.code,
        description: updated.description || '',
        stripeProductId: updated.stripeProductId || '',
        maxActiveLoans: updated.maxActiveLoans,
        loanDurationDays: updated.loanDurationDays,
        maxRenewals: updated.maxRenewals,
        status: updated.status as any,
        prices: updated.prices && updated.prices.length > 0 ? updated.prices : newPrices,
      })
      showFeedback('success', 'Plan pricing updated successfully!')
      setPriceModalOpen(false)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update pricing')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePriceModal = async () => {
    const numPrice = typeof priceForm.price === 'string' ? parseFloat(priceForm.price) || 0 : priceForm.price
    let newPrices: MembershipPlanPriceResponse[]
    if (editingPriceIndex === null) {
      newPrices = [
        ...form.prices,
        { billingCycle: priceForm.billingCycle, price: numPrice, stripePriceId: '' },
      ]
    } else {
      newPrices = form.prices.map((p, idx) =>
        idx === editingPriceIndex
          ? { ...p, billingCycle: priceForm.billingCycle, price: numPrice }
          : p
      )
    }
    await savePlanWithPrices(newPrices)
  }

  const handleDeletePriceFromModal = async () => {
    if (editingPriceIndex === null) return
    if (form.prices.length <= 1) {
      showFeedback('error', 'A plan must have at least one billing cycle price')
      return
    }
    const newPrices = form.prices.filter((_, i) => i !== editingPriceIndex)
    await savePlanWithPrices(newPrices)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!form.name.trim()) {
      showFeedback('error', 'Plan name is required')
      return
    }
    const finalCode =
      form.code.trim() ||
      form.name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') ||
      'PLAN_' + Date.now()

    if (!form.prices || form.prices.length === 0) {
      showFeedback('error', 'At least one price is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        code: finalCode,
        description: form.description?.trim() || undefined,
        stripeProductId: form.stripeProductId?.trim() || undefined,
        maxActiveLoans: Number(form.maxActiveLoans) || 1,
        loanDurationDays: Number(form.loanDurationDays) || 1,
        maxRenewals: Number(form.maxRenewals) || 0,
        prices: form.prices.map((p) => ({
          id: p.id,
          billingCycle: p.billingCycle,
          price: Number(p.price || 0),
          stripePriceId: p.stripePriceId?.trim() || undefined,
        })),
      }
      if (isNew) {
        const created = await api.adminCreateMembershipPlan(payload as any)
        showFeedback('success', `Plan "${created.name}" created successfully!`)
        navigate(`/admin/subscriptions/plans/${created.id}`, { replace: true })
      } else if (planId) {
        const updated = await api.adminUpdateMembershipPlan(planId, payload as any)
        setPlan(updated)
        showFeedback('success', `Plan "${updated.name}" updated successfully!`)
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!planId || !plan) return
    if (!confirm(`Are you sure you want to delete membership plan "${plan.name}"? This action cannot be undone.`)) return
    try {
      await api.adminDeleteMembershipPlan(planId)
      showFeedback('success', `Plan "${plan.name}" deleted!`)
      navigate('/admin/subscriptions/plans')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete plan')
    }
  }

  // Manage top header action: update on change, clear on unmount
  useEffect(() => {
    if (isNew) {
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/subscriptions/plans')}
            className={`h-8 px-3.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!form.name.trim() || saving}
            className={`h-8 px-3.5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            {saving ? 'Creating...' : 'Create Plan'}
          </button>
        </div>
      )
    } else if (isDirty) {
      setHeaderAction(
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className={`h-8 px-4 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
        >
          {saving ? 'Updating...' : 'Update'}
        </button>
      )
    } else {
      setHeaderAction(null)
    }
  }, [isNew, isDirty, saving, form.name, t.secondaryBtn, t.primaryBtn, setHeaderAction])

  // Clear header action on page unmount
  useEffect(() => {
    return () => setHeaderAction(null)
  }, [setHeaderAction])

  if (loading) {
    return (
      <div className={`p-16 text-center text-sm ${t.subTextColor}`}>
        Loading plan details...
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Main Frameless Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0 items-start">
        {/* Left Column (8/12): Plan Fields (utilizing 90% width) */}
        <div className="lg:col-span-8 space-y-4 xl:space-y-4.5 w-full lg:max-w-[90%] min-w-0">
          {/* Row 1: Plan Name */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Plan Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Standard Reader"
              className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 2: Description with Rich Text Editor */}
          <div className="pt-0.5 w-full">
            <AdminRichTextEditor
              label="Description"
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              placeholder="Write plan benefits, target readers, and circulation privileges (Markdown supported)..."
              minHeight="180px"
            />
          </div>

          {/* Row 3: Limit (Active Loans) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Limit (Active Loans)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.maxActiveLoans}
              onChange={(e) =>
                setForm({ ...form, maxActiveLoans: parseInt(e.target.value) || 1 })
              }
              className={`w-full h-9 px-3 text-xs xl:text-sm font-mono rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 4: Duration (Days) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={form.loanDurationDays}
              onChange={(e) =>
                setForm({ ...form, loanDurationDays: parseInt(e.target.value) || 1 })
              }
              className={`w-full h-9 px-3 text-xs xl:text-sm font-mono rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 5: Renewal (Times) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Renewal (Times)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={form.maxRenewals}
              onChange={(e) =>
                setForm({ ...form, maxRenewals: parseInt(e.target.value) || 0 })
              }
              className={`w-full h-9 px-3 text-xs xl:text-sm font-mono rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* Row 6: Pricing (Unified View Mode + Modal) */}
          <div className="space-y-1 pt-3 w-full">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-[#262a34]">
              <label className={`block text-sm font-semibold ${t.titleColor}`}>
                Pricing
              </label>
              <button
                type="button"
                onClick={openAddPriceModal}
                className="text-sm font-medium inline-flex items-center gap-1.5 text-[#066fd1] hover:text-[#005bb5] dark:text-[#388bfd] dark:hover:text-[#58a6ff] transition-colors cursor-pointer"
              >
                <IconPlus size={15} />
                Add pricing
              </button>
            </div>

            <div className={`divide-y ${isDark ? 'divide-[#262a34]' : 'divide-gray-200'}`}>
              {form.prices.map((pr, idx) => (
                <div
                  key={idx}
                  onClick={() => openEditPriceModal(idx)}
                  className={`group flex items-center justify-between py-3.5 px-2 rounded-md transition-colors cursor-pointer select-none ${
                    isDark ? 'hover:bg-[#1a1e24]' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Góc trái: Billing Cycle */}
                  <span className={`text-sm font-medium capitalize ${t.titleColor}`}>
                    {pr.billingCycle.toLowerCase()}
                  </span>

                  {/* Góc phải: Price */}
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-sm sm:text-base font-semibold ${t.titleColor}`}>
                      ${Number(pr.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4/12): Status + Borrowing Entitlements */}
        <div className="lg:col-span-4 space-y-4 w-full lg:max-w-[280px]">
          {/* Status (Linear/Stripe Minimal Dot + Toggle Switch Style) */}
          <div className="space-y-1 w-full">
            <label className={`block text-xs font-medium ${t.subTextColor}`}>
              Status
            </label>
            <div
              onClick={() =>
                setForm({
                  ...form,
                  status: form.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                })
              }
              className="flex items-center justify-between h-9 px-3 rounded-md border border-gray-200 dark:border-[#2c323e] bg-white dark:bg-[#16181d] cursor-pointer hover:border-gray-300 dark:hover:border-[#3e4757] transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    form.status === 'ACTIVE'
                      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                      : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                />
                <span className="text-xs font-medium text-gray-900 dark:text-[#e2e8f0]">
                  {form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <Switch
                checked={form.status === 'ACTIVE'}
                onCheckedChange={(checked) =>
                  setForm({ ...form, status: checked ? 'ACTIVE' : 'INACTIVE' })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar (Luôn xuất hiện) */}
      <div
        className={`pt-5 mt-6 border-t flex items-center justify-between gap-4 ${
          isDark ? 'border-[#22262e]' : 'border-gray-200'
        }`}
      >
        {/* Góc trái: Nút Delete (hoặc Cancel khi tạo mới) */}
        {isNew ? (
          <button
            type="button"
            onClick={() => navigate('/admin/subscriptions/plans')}
            className={`h-9 px-4 text-xs font-medium rounded-md border transition-colors cursor-pointer ${t.secondaryBtn}`}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="h-9 px-4 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            title="Delete this plan"
          >
            Delete
          </button>
        )}

        {/* Góc phải: Nút Update (hoặc Create Plan khi mới) */}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isNew ? (!form.name.trim() || saving) : (!isDirty || saving)}
          className={`h-9 px-5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${t.primaryBtn}`}
        >
          {saving ? (isNew ? 'Creating...' : 'Updating...') : (isNew ? 'Create Plan' : 'Update')}
        </button>
      </div>

      {/* Modal: Edit / Add Billing Cycle & Price */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent
          onClose={() => setPriceModalOpen(false)}
          className={`sm:max-w-md rounded-xl p-6 border ${t.modalBg}`}
        >
          <DialogHeader>
            <DialogTitle className={`font-sans font-bold text-base ${t.titleColor}`}>
              {editingPriceIndex === null ? 'Add Pricing' : 'Edit Pricing'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Field 1: Billing Cycle */}
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Billing Cycle
              </label>
              <select
                value={priceForm.billingCycle}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    billingCycle: e.target.value as 'MONTHLY' | 'YEARLY' | 'LIFETIME',
                  })
                }
                className={`w-full h-9 px-3 text-xs xl:text-sm rounded-md border outline-none cursor-pointer font-medium transition ${t.inputBg}`}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="LIFETIME">Lifetime</option>
              </select>
            </div>

            {/* Field 2: Price */}
            <div className="space-y-1">
              <label className={`block text-xs font-medium ${t.subTextColor}`}>
                Price
              </label>
              <div className="relative w-full">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono ${t.mutedColor}`}
                >
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceForm.price}
                  onChange={(e) =>
                    setPriceForm({
                      ...priceForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className={`w-full h-9 pl-7 pr-3 text-xs xl:text-sm font-mono rounded-md border outline-none transition ${t.inputBg}`}
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex items-center ${editingPriceIndex !== null ? 'justify-between' : 'justify-end'} pt-3 border-t border-gray-100 dark:border-[#22262e]`}>
              {editingPriceIndex !== null && (
                <button
                  type="button"
                  onClick={handleDeletePriceFromModal}
                  disabled={saving || form.prices.length <= 1}
                  title={form.prices.length <= 1 ? 'A plan must have at least one pricing' : 'Delete this pricing'}
                  className="h-9 px-4 rounded-md text-xs font-medium inline-flex items-center transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button
                type="button"
                onClick={handleSavePriceModal}
                disabled={saving}
                className={`h-9 px-5 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50 ${t.primaryBtn}`}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
