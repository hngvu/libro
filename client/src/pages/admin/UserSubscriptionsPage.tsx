import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  IconSearch,
  IconRefresh,
  IconFilter2,
  IconArrowsUpDown,
  IconPlus,
  IconVip,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/services/api'
import type { MembershipPlanResponse, UserSubscriptionResponse } from '@/types/api'

export function UserSubscriptionsPage() {
  const { t, isDark, showFeedback } = useAdmin()

  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscriptionResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Filters & Sorting
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<
    'default' | 'user-asc' | 'user-desc' | 'date-desc' | 'date-asc' | 'plan-asc'
  >('default')
  const [planFilter, setPlanFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansData, subsData] = await Promise.all([
        api.adminGetMembershipPlans().catch(() => []),
        api.adminGetUserSubscriptions().catch(() => []),
      ])
      setPlans(plansData || [])
      setUserSubscriptions(subsData || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load user subscriptions')
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancelUserSubscription = async (id: number, userEmail?: string) => {
    if (!confirm(`Are you sure you want to cancel the subscription for ${userEmail || 'this user'}?`)) return
    try {
      await api.adminCancelUserSubscription(id)
      showFeedback('success', 'Cancelled successfully')
      fetchData()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to cancel subscription')
    }
  }

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'plan') setPlanFilter('')
    if (field === 'status') setStatusFilter('')
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setPlanFilter('')
    setStatusFilter('')
  }

  // Filtered subscriptions
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

  // Sorted subscriptions
  const sortedSubscriptions = useMemo(() => {
    const list = [...filteredSubscriptions]
    if (sortBy === 'user-asc') {
      return list.sort((a, b) => (a.userEmail || '').localeCompare(b.userEmail || ''))
    }
    if (sortBy === 'user-desc') {
      return list.sort((a, b) => (b.userEmail || '').localeCompare(a.userEmail || ''))
    }
    if (sortBy === 'date-desc') {
      return list.sort((a, b) => (b.currentPeriodStart || '').localeCompare(a.currentPeriodStart || ''))
    }
    if (sortBy === 'date-asc') {
      return list.sort((a, b) => (a.currentPeriodStart || '').localeCompare(b.currentPeriodStart || ''))
    }
    if (sortBy === 'plan-asc') {
      return list.sort((a, b) => (a.planName || a.planCode || '').localeCompare(b.planName || b.planCode || ''))
    }
    return list
  }, [filteredSubscriptions, sortBy])

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
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search user email, plan, stripe ID..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
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
                onClick={() => setSortBy('date-desc')}
                className={sortBy === 'date-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Start Date (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('date-asc')}
                className={sortBy === 'date-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Start Date (Oldest)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('user-asc')}
                className={sortBy === 'user-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Subscriber (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('user-desc')}
                className={sortBy === 'user-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Subscriber (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('plan-asc')}
                className={sortBy === 'plan-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Plan Name (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className={`h-9 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.secondaryBtn}`}
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
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

        {/* Plan Filter */}
        {activeFilterFields.includes('plan') && (
          <AdminFilterSelect
            label="Plan"
            value={planFilter}
            options={plans.map((p) => ({ value: p.code, label: p.name }))}
            onChange={(val) => setPlanFilter(val)}
            onRemove={() => removeFilterField('plan')}
            allLabel="All Plans"
          />
        )}

        {/* Status Filter */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PAST_DUE', label: 'Past Due' },
              { value: 'CANCELED', label: 'Canceled' },
            ]}
            onChange={(val) => setStatusFilter(val)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Status"
          />
        )}

        {/* Add Filter Plus Button */}
        {activeFilterFields.length < 2 && (
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
              {!activeFilterFields.includes('plan') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'plan'])}>
                  Plan
                </DropdownMenuItem>
              )}
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

      {/* Frameless Table */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading user subscriptions...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className={`px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Subscriber
                </th>
                <th className={`w-48 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Plan
                </th>
                <th className={`w-44 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Borrow Limits
                </th>
                <th className={`w-48 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Billing Period
                </th>
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Status
                </th>
                <th className={`w-24 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedSubscriptions.map((sub) => (
                <tr
                  key={sub.id || `${sub.userId}-${sub.planCode}`}
                  className={`group border-b transition-colors ${
                    isDark ? 'border-[#20242c]' : 'border-gray-200'
                  } ${t.tableRow}`}
                >
                  {/* Subscriber Column */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {sub.userEmail || `User #${sub.userId}`}
                    </div>
                    {sub.stripeSubscriptionId && (
                      <span className={`block font-mono text-[11px] mt-0.5 ${t.mutedColor}`}>
                        {sub.stripeSubscriptionId}
                      </span>
                    )}
                  </td>

                  {/* Plan Column */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <IconVip size={15} className="text-amber-500 shrink-0" />
                      <span className={`font-semibold text-xs sm:text-[13px] ${t.titleColor}`}>
                        {sub.planName || sub.planCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`inline-block font-mono text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border ${
                          isDark
                            ? 'bg-[#16181d] text-blue-400 border-[#2c323e]'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {sub.planCode}
                      </span>
                      {sub.billingCycle && (
                        <span className={`font-mono text-[10px] ${t.mutedColor}`}>
                          · {sub.billingCycle} {sub.price != null && Number(sub.price) > 0 ? `($${Number(sub.price).toFixed(2)})` : ''}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Privileges Column */}
                  <td className="py-3 px-4">
                    <div className="text-xs sm:text-[13px] font-medium text-gray-900 dark:text-gray-100">
                      {sub.maxActiveLoans} active loans
                    </div>
                    <span className={`block text-[11px] mt-0.5 ${t.mutedColor}`}>
                      {sub.loanDurationDays}d duration · {sub.maxRenewals} renewals
                    </span>
                  </td>

                  {/* Billing Period Column */}
                  <td className="py-3 px-4">
                    <div className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      {sub.currentPeriodStart ? sub.currentPeriodStart.split('T')[0] : '—'}
                      <span className="mx-1 text-gray-400">→</span>
                      {sub.currentPeriodEnd ? sub.currentPeriodEnd.split('T')[0] : '—'}
                    </div>
                    {sub.cancelAtPeriodEnd && (
                      <span className="text-[11px] text-amber-500 font-medium block mt-0.5">
                        Cancels at period end
                      </span>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                        sub.status
                      )}`}
                    >
                      {sub.status}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="py-3 px-4 text-right">
                    {sub.status === 'ACTIVE' && sub.id && (
                      <button
                        onClick={() => handleCancelUserSubscription(sub.id!, sub.userEmail)}
                        className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-colors cursor-pointer text-rose-500 hover:bg-rose-500/10 ${
                          isDark ? 'border-[#2c323e]' : 'border-gray-200'
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {sortedSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-xs sm:text-sm ${t.subTextColor}`}>
                    No user subscriptions found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
