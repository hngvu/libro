import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconFilter2,
  IconArrowsUpDown,
  IconChevronDown,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/services/api'
import type { MembershipPlanResponse } from '@/types/api'

export function MembershipPlansPage() {
  const navigate = useNavigate()
  const { t, isDark, showFeedback } = useAdmin()

  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Selection & Bulk Actions
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([])

  // Filters & Sorting
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<
    'default' | 'name-asc' | 'name-desc' | 'loans-desc' | 'duration-desc'
  >('default')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [cycleFilter, setCycleFilter] = useState<string>('')
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([])

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

  const toggleSelectPlan = (id: number) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedPlanIds.length === sortedPlans.length) {
      setSelectedPlanIds([])
    } else {
      setSelectedPlanIds(sortedPlans.map((p) => p.id))
    }
  }

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedPlanIds.length} selected plan(s)?`)) return
    try {
      for (const id of selectedPlanIds) {
        await api.adminDeleteMembershipPlan(id)
      }
      showFeedback('success', 'Archived successfully')
      setSelectedPlanIds([])
      fetchPlans()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to archive selected plans')
    }
  }

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
    if (field === 'cycle') setCycleFilter('')
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setStatusFilter('')
    setCycleFilter('')
  }

  // Filtered & Sorted Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase()
        const nameMatch = p.name?.toLowerCase().includes(q)
        const codeMatch = p.code?.toLowerCase().includes(q)
        const descMatch = p.description?.toLowerCase().includes(q)
        if (!nameMatch && !codeMatch && !descMatch) return false
      }
      if (statusFilter && p.status !== statusFilter) {
        return false
      }
      if (cycleFilter && !p.prices?.some((pr) => pr.billingCycle === cycleFilter)) {
        return false
      }
      return true
    })
  }, [plans, keyword, statusFilter, cycleFilter])

  const sortedPlans = useMemo(() => {
    const list = [...filteredPlans]
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortBy === 'name-desc') {
      return list.sort((a, b) => b.name.localeCompare(a.name))
    }
    if (sortBy === 'loans-desc') {
      return list.sort((a, b) => (b.maxActiveLoans || 0) - (a.maxActiveLoans || 0))
    }
    if (sortBy === 'duration-desc') {
      return list.sort((a, b) => (b.loanDurationDays || 0) - (a.loanDurationDays || 0))
    }
    return list
  }, [filteredPlans, sortBy])

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search plan name, code, description..."
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
              <DropdownMenuItem
                onClick={() => setSortBy('loans-desc')}
                className={sortBy === 'loans-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Limit (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('duration-desc')}
                className={sortBy === 'duration-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Duration (Longest First)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={() => navigate('/admin/membership/plans/new')}
            className={`h-9 px-4 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${t.primaryBtn}`}
          >
            <span>Add Plan</span>
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

        {/* Status Filter */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
            onChange={(val) => setStatusFilter(val)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Status"
          />
        )}

        {/* Billing Cycle Filter */}
        {activeFilterFields.includes('cycle') && (
          <AdminFilterSelect
            label="Cycle"
            value={cycleFilter}
            options={[
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'YEARLY', label: 'Yearly' },
              { value: 'LIFETIME', label: 'Lifetime' },
            ]}
            onChange={(val) => setCycleFilter(val)}
            onRemove={() => removeFilterField('cycle')}
            allLabel="All Cycles"
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
              {!activeFilterFields.includes('status') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'status'])}>
                  Status
                </DropdownMenuItem>
              )}
              {!activeFilterFields.includes('cycle') && (
                <DropdownMenuItem onClick={() => setActiveFilterFields([...activeFilterFields, 'cycle'])}>
                  Billing Cycle
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
          Loading membership plans...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                {/* Column 1: Checkbox */}
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedPlans.length > 0 && selectedPlanIds.length === sortedPlans.length
                        ? true
                        : selectedPlanIds.length > 0
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                    title="Select all"
                    className={
                      isDark
                        ? '!border-[#3e4756] hover:!border-[#5a667b]'
                        : '!border-gray-400 hover:!border-gray-500'
                    }
                  />
                </th>

                {/* Column 2: Plan Name / Selected Action */}
                <th className="px-4 text-left align-middle min-w-[200px]">
                  {selectedPlanIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedPlanIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`h-6 px-2 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer select-none normal-case whitespace-nowrap ${
                              isDark
                                ? 'bg-[#181a20] border-[#3e4756] text-[#cbd2de] hover:text-white hover:border-[#5a667b]'
                                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                            }`}
                          >
                            <span>Actions</span>
                            <IconChevronDown size={12} className="opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={handleBulkArchive}
                            className="text-rose-500 focus:text-rose-400 cursor-pointer"
                          >
                            Archive Selected ({selectedPlanIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedPlanIds([])} className="cursor-pointer">
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Name
                    </span>
                  )}
                </th>

                {/* Column 3: Limit */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Limit
                </th>

                {/* Column 4: Duration */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Duration
                </th>

                {/* Column 5: Renewal */}
                <th className={`w-24 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap text-right ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Renewal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedPlans.map((p) => {
                const isSelected = selectedPlanIds.includes(p.id)

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/admin/membership/plans/${p.id}`)}
                    className={`group border-b transition-colors cursor-pointer ${
                      isDark ? 'border-[#20242c]' : 'border-gray-200'
                    } ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1e232b]'
                          : 'bg-blue-50/60'
                        : t.tableRow
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectPlan(p.id)}
                        className={
                          isDark
                            ? '!border-[#3e4756] hover:!border-[#5a667b]'
                            : '!border-gray-400 hover:!border-gray-500'
                        }
                      />
                    </td>

                    {/* Name Column: Name + Special Status Badge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-xs sm:text-sm ${t.titleColor}`}>
                          {p.name}
                        </span>

                        {p.status && p.status !== 'ACTIVE' && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                              p.status === 'INACTIVE'
                                ? isDark
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-[#fff8eb] text-[#b46b00] border-[#f2be54]'
                                : isDark
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Limit Column */}
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs sm:text-[13px] font-mono font-medium ${t.titleColor}`}>
                        {p.maxActiveLoans}
                      </span>
                    </td>

                    {/* Duration Column */}
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs sm:text-[13px] font-mono font-medium ${t.titleColor}`}>
                        {p.loanDurationDays}
                      </span>
                    </td>

                    {/* Renewal Column */}
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs sm:text-[13px] font-mono font-medium ${t.titleColor}`}>
                        {p.maxRenewals ?? 0}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {sortedPlans.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-12 text-center text-xs sm:text-sm ${t.subTextColor}`}>
                    No membership plans found matching filter.
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
