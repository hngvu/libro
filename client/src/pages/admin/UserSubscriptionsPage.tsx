import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  IconSearch,
  IconRefresh,
  IconSparkles,
  IconUsers,
  IconTrendingUp,
  IconReceipt2,
  IconHistory,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { MembershipPlanResponse, UserSubscriptionResponse } from '@/types/api'

export function UserSubscriptionsPage() {
  const { t, isDark, showFeedback } = useAdmin()

  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscriptionResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [keyword, setKeyword] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansData, subsData] = await Promise.all([
        api.adminGetMembershipPlans().catch(() => []),
        api.adminGetUserSubscriptions().catch(() => []),
      ])
      setPlans(plansData)
      setUserSubscriptions(subsData)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load user subscriptions')
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed KPIs
  const activeSubsCount = useMemo(
    () => userSubscriptions.filter((s) => s.status === 'ACTIVE').length,
    [userSubscriptions]
  )

  const monthlyRevenueEstimate = useMemo(() => {
    return userSubscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((acc, s) => {
        const p = plans.find((plan) => plan.code === s.planCode || plan.id === s.planId)
        if (!p) return acc
        const price = Number(p.price) || 0
        if (p.billingCycle === 'YEARLY') return acc + price / 12
        return acc + price
      }, 0)
  }, [userSubscriptions, plans])

  const filteredSubscriptions = useMemo(() => {
    return userSubscriptions.filter((sub) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase()
        const email = sub.userEmail?.toLowerCase() || ''
        const code = sub.planCode?.toLowerCase() || ''
        const name = sub.planName?.toLowerCase() || ''
        const stripeId = sub.stripeSubscriptionId?.toLowerCase() || ''
        if (!email.includes(q) && !code.includes(q) && !name.includes(q) && !stripeId.includes(q)) {
          return false
        }
      }
      if (planFilter && sub.planCode !== planFilter) {
        return false
      }
      if (statusFilter && sub.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [userSubscriptions, keyword, planFilter, statusFilter])

  const handleCancelUserSubscription = async (id: number, userEmail?: string) => {
    if (!confirm(`Are you sure you want to cancel the subscription for ${userEmail || 'this user'}?`)) return
    try {
      await api.adminCancelUserSubscription(id)
      showFeedback('success', 'Subscription canceled successfully!')
      fetchData()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to cancel subscription')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'PAST_DUE':
        return isDark
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CANCELED':
        return isDark
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return isDark
          ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          : 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`font-sans font-bold text-lg xl:text-xl tracking-tight ${t.titleColor}`}>
            User Subscriptions History
          </h1>
          <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
            Track member subscription orders, active statuses, billing cycles, and cancellation actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className={`h-9 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.secondaryBtn}`}
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${t.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${t.subTextColor}`}>Active Subscribers</span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <IconUsers size={16} />
            </div>
          </div>
          <p className={`text-xl font-bold font-sans mt-2 ${t.titleColor}`}>{activeSubsCount}</p>
          <p className={`text-[11px] mt-1 ${t.mutedColor}`}>Active membership holders</p>
        </div>

        <div className={`p-4 rounded-xl border ${t.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${t.subTextColor}`}>Est. Monthly Revenue</span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <IconTrendingUp size={16} />
            </div>
          </div>
          <p className={`text-xl font-bold font-sans mt-2 ${t.titleColor}`}>
            ${monthlyRevenueEstimate.toFixed(2)}
          </p>
          <p className={`text-[11px] mt-1 ${t.mutedColor}`}>Recurring membership MRR</p>
        </div>

        <div className={`p-4 rounded-xl border ${t.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${t.subTextColor}`}>Total Subscriptions</span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <IconHistory size={16} />
            </div>
          </div>
          <p className={`text-xl font-bold font-sans mt-2 ${t.titleColor}`}>{userSubscriptions.length}</p>
          <p className={`text-[11px] mt-1 ${t.mutedColor}`}>Lifetime subscription records</p>
        </div>

        <div className={`p-4 rounded-xl border ${t.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${t.subTextColor}`}>Canceled / Inactive</span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
              <IconReceipt2 size={16} />
            </div>
          </div>
          <p className={`text-xl font-bold font-sans mt-2 ${t.titleColor}`}>
            {userSubscriptions.filter((s) => s.status === 'CANCELED' || s.status === 'EXPIRED').length}
          </p>
          <p className={`text-[11px] mt-1 ${t.mutedColor}`}>Past due or canceled accounts</p>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search user email, plan, stripe ID..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`h-9 pl-9 pr-3 text-xs w-full rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className={`h-9 px-3 rounded-md text-xs border outline-none cursor-pointer ${t.inputBg}`}
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.code}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`h-9 px-3 rounded-md text-xs border outline-none cursor-pointer ${t.inputBg}`}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAST_DUE">PAST_DUE</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${t.tableHead}`}>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Subscriber</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Plan</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Privileges</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Billing Period</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {filteredSubscriptions.map((sub) => (
                <tr
                  key={sub.id || Math.random()}
                  className={`border-b transition-colors ${
                    isDark ? 'border-[#20242c]' : 'border-gray-200'
                  } ${t.tableRow}`}
                >
                  <td className="py-3 px-4 text-xs">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {sub.userEmail || `User #${sub.userId}`}
                    </div>
                    {sub.stripeSubscriptionId && (
                      <span className={`block font-mono text-[10px] mt-0.5 ${t.mutedColor}`}>
                        {sub.stripeSubscriptionId}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <IconSparkles size={14} className="text-amber-400" />
                      <span className={`font-semibold ${t.titleColor}`}>{sub.planName || sub.planCode}</span>
                    </div>
                    <span className={`text-[10px] font-mono block ${t.mutedColor}`}>
                      Code: {sub.planCode}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <div className="space-y-0.5">
                      <span className={`block text-[11px] ${t.subTextColor}`}>
                        Max: <strong className={t.titleColor}>{sub.maxActiveLoans}</strong> active loans
                      </span>
                      <span className={`block text-[10px] ${t.mutedColor}`}>
                        {sub.loanDurationDays}d duration · {sub.maxRenewals} renewals
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <div className="text-[11px] font-mono">
                      {sub.currentPeriodStart ? sub.currentPeriodStart.split('T')[0] : '—'}
                      <span className="mx-1 text-gray-400">→</span>
                      {sub.currentPeriodEnd ? sub.currentPeriodEnd.split('T')[0] : '—'}
                    </div>
                    {sub.cancelAtPeriodEnd && (
                      <span className="text-[10px] text-amber-500 font-medium block mt-0.5">
                        Cancels at period end
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                        sub.status
                      )}`}
                    >
                      {sub.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {sub.status === 'ACTIVE' && sub.id && (
                      <button
                        onClick={() => handleCancelUserSubscription(sub.id!, sub.userEmail)}
                        className={`h-7 px-2.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
                          isDark ? 'border-[#2c323e]' : 'border-gray-200'
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-xs ${t.subTextColor}`}>
                    No user subscriptions found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
