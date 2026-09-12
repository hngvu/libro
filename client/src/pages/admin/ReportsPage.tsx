import { useState, useEffect, useCallback } from 'react'
import {
  IconDownload,
  IconBooks,
  IconChartBar,
  IconCategory,
  IconCoins,
  IconRefresh,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconCreditCard,
  IconCash,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type {
  TopBorrowedBookResponse,
  CirculationTrendResponse,
  CategoryDistributionResponse,
  RevenueReportResponse,
} from '@/types/api'

type ReportTab = 'top-books' | 'circulation' | 'categories' | 'revenue'

export function ReportsPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const [activeTab, setActiveTab] = useState<ReportTab>('top-books')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filters & State
  const [topLimit, setTopLimit] = useState<number>(10)
  const [trendPeriod, setTrendPeriod] = useState<string>('12m')

  // Live Data Stores
  const [topBooks, setTopBooks] = useState<TopBorrowedBookResponse[]>([])
  const [trends, setTrends] = useState<CirculationTrendResponse | null>(null)
  const [categories, setCategories] = useState<CategoryDistributionResponse | null>(null)
  const [revenue, setRevenue] = useState<RevenueReportResponse | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'top-books') {
        const data = await api.adminGetTopBorrowedBooks(topLimit)
        setTopBooks(data)
      } else if (activeTab === 'circulation') {
        const data = await api.adminGetCirculationTrends(trendPeriod)
        setTrends(data)
      } else if (activeTab === 'categories') {
        const data = await api.adminGetCategoryDistribution()
        setCategories(data)
      } else if (activeTab === 'revenue') {
        const data = await api.adminGetRevenueReport()
        setRevenue(data)
      }
    } catch {
      showFeedback('error', 'Failed to load report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, topLimit, trendPeriod, showFeedback])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real CSV & JSON Export
  const handleExportCsv = async () => {
    setExporting(true)
    try {
      let exportType = 'top-books'
      if (activeTab === 'circulation') exportType = 'circulation'
      else if (activeTab === 'categories') exportType = 'categories'
      else if (activeTab === 'revenue') exportType = 'subscriptions'

      const blob = await api.adminExportReport(exportType)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `libro_${exportType}_report_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)

      showFeedback('success', `Exported ${exportType} report as CSV!`)
    } catch {
      showFeedback('error', 'Failed to download report CSV.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportJson = () => {
    let payload: unknown = null
    if (activeTab === 'top-books') payload = topBooks
    else if (activeTab === 'circulation') payload = trends
    else if (activeTab === 'categories') payload = categories
    else if (activeTab === 'revenue') payload = revenue

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `libro_${activeTab}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    showFeedback('success', 'Exported report data as JSON!')
  }

  // Derived summaries
  const maxCheckouts = topBooks.length > 0 ? Math.max(...topBooks.map((b) => b.totalCheckouts), 1) : 1
  const totalTrendCheckouts = trends?.dataPoints.reduce((acc, p) => acc + p.checkouts, 0) || 0
  const totalTrendReturns = trends?.dataPoints.reduce((acc, p) => acc + p.returns, 0) || 0
  const totalTrendOverdues = trends?.dataPoints.reduce((acc, p) => acc + p.overdues, 0) || 0
  const returnRate = totalTrendCheckouts > 0 ? Math.round((totalTrendReturns / totalTrendCheckouts) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Top Header Controls */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xs ${t.cardBg}`}>
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('top-books')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'top-books' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            <IconBooks size={16} /> Top Titles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('circulation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'circulation' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            <IconChartBar size={16} /> Circulation Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'categories' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            <IconCategory size={16} /> Category Distribution
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'revenue' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            <IconCoins size={16} /> Revenue & Fines
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Sub-filter for top books */}
          {activeTab === 'top-books' && (
            <select
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value))}
              aria-label="Filter number of top books"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border cursor-pointer outline-hidden ${
                isDark ? 'bg-[#1a1f2c] border-[#2c323e] text-gray-200' : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
            </select>
          )}

          {/* Sub-filter for trends */}
          {activeTab === 'circulation' && (
            <div className="flex items-center gap-1">
              {(['7d', '30d', '12m'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTrendPeriod(p)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    trendPeriod === p
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-[#1a1f2c] text-gray-400 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '12 Months'}
                </button>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            title="Refresh Data"
            className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-center cursor-pointer transition-colors ${t.secondaryBtn} ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <IconRefresh size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Export Buttons */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${t.secondaryBtn}`}
          >
            <IconDownload size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${t.secondaryBtn}`}
          >
            <IconDownload size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-xs ${t.subTextColor}`}>Retrieving library analytics from database...</p>
        </div>
      )}

      {/* TAB 1: Top Borrowed Titles */}
      {!loading && activeTab === 'top-books' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Analyzed Titles</span>
              <p className={`text-2xl font-black mt-1 ${t.titleColor}`}>{topBooks.length}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Highest Checkouts</span>
              <p className="text-2xl font-black mt-1 text-blue-500">
                {topBooks[0] ? `${topBooks[0].totalCheckouts} loans` : '0'}
              </p>
            </div>
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Most Popular Title</span>
              <p className={`text-xs font-bold mt-2 truncate ${t.titleColor}`}>
                {topBooks[0] ? topBooks[0].title : 'None'}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>
                Most Borrowed Library Titles
              </h3>
              <p className={`text-[11px] ${t.subTextColor}`}>
                Ranked by lifetime checkout transactions recorded in circulation logs
              </p>
            </div>
            {topBooks.length === 0 ? (
              <div className={`p-8 text-center text-xs ${t.subTextColor}`}>No loan records found in library history.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${t.tableHead}`}>
                      <th className="py-3 px-4 text-xs font-semibold">Rank</th>
                      <th className="py-3 px-4 text-xs font-semibold">Book Title & Authors</th>
                      <th className="py-3 px-4 text-xs font-semibold text-center">Total Checkouts</th>
                      <th className="py-3 px-4 text-xs font-semibold text-center">Inventory Availability</th>
                      <th className="py-3 px-4 text-xs font-semibold">Circulation Demand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {topBooks.map((b, idx) => {
                      const demandPercent = Math.round((b.totalCheckouts / maxCheckouts) * 100)
                      return (
                        <tr key={b.bookId} className={`border-b transition-colors ${t.tableRow}`}>
                          <td className="py-3 px-4 font-mono text-xs font-bold">
                            <span
                              className={`w-7 h-7 rounded-xl inline-flex items-center justify-center font-black ${
                                idx === 0
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : idx === 1
                                    ? 'bg-slate-300/20 text-slate-300 border border-slate-400/30'
                                    : idx === 2
                                      ? 'bg-amber-700/20 text-amber-500 border border-amber-600/30'
                                      : 'bg-transparent text-gray-400'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {b.cover ? (
                                <img
                                  src={b.cover}
                                  alt={b.title}
                                  className="w-9 h-13 object-cover rounded-md shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-13 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                  <IconBooks size={18} className="text-blue-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate max-w-sm sm:max-w-md ${t.titleColor}`}>{b.title}</p>
                                <p className={`text-[11px] truncate ${t.subTextColor}`}>
                                  {b.authors && b.authors.length > 0 ? b.authors.join(', ') : 'Unknown Author'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/20">
                              {b.totalCheckouts} loans
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                b.availableCopies === 0
                                  ? 'bg-red-500/15 text-red-400'
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              {b.availableCopies} / {b.totalCopies} available
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-28 sm:w-36 bg-gray-700/30 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(5, demandPercent)}%` }}
                                />
                              </div>
                              <span className={`text-[11px] font-mono font-medium ${t.subTextColor}`}>
                                {demandPercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Circulation Trends */}
      {!loading && activeTab === 'circulation' && (
        <div className="space-y-4">
          {/* Trends Key Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Total Checkouts</span>
                <IconTrendingUp size={16} className="text-blue-400" />
              </div>
              <p className={`text-2xl font-black mt-2 text-blue-400`}>{totalTrendCheckouts}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Total Returns</span>
                <IconCheck size={16} className="text-emerald-400" />
              </div>
              <p className={`text-2xl font-black mt-2 text-emerald-400`}>{totalTrendReturns}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Return Rate</span>
                <IconClock size={16} className="text-purple-400" />
              </div>
              <p className={`text-2xl font-black mt-2 text-purple-400`}>{returnRate}%</p>
            </div>
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Overdue Incidents</span>
                <IconAlertTriangle size={16} className="text-amber-400" />
              </div>
              <p className={`text-2xl font-black mt-2 text-amber-400`}>{totalTrendOverdues}</p>
            </div>
          </div>

          {/* Time Series Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>
                  Circulation History ({trendPeriod.toUpperCase()})
                </h3>
                <p className={`text-[11px] ${t.subTextColor}`}>
                  Activity breakdown by time intervals across loans, checkouts, and returns
                </p>
              </div>
            </div>
            {(!trends || trends.dataPoints.length === 0) ? (
              <div className={`p-8 text-center text-xs ${t.subTextColor}`}>No circulation transactions found in this time range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${t.tableHead}`}>
                      <th className="py-3 px-4 text-xs font-semibold">Time Period</th>
                      <th className="py-3 px-4 text-xs font-semibold">Checkouts</th>
                      <th className="py-3 px-4 text-xs font-semibold">Returns</th>
                      <th className="py-3 px-4 text-xs font-semibold">Active Overdues</th>
                      <th className="py-3 px-4 text-xs font-semibold">Flow Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {trends.dataPoints.map((dp) => {
                      const maxPointVal = Math.max(dp.checkouts, dp.returns, 1)
                      return (
                        <tr key={dp.label} className={`border-b transition-colors ${t.tableRow}`}>
                          <td className={`py-3 px-4 text-xs font-bold ${t.titleColor}`}>{dp.label}</td>
                          <td className="py-3 px-4 text-xs font-bold text-blue-400">
                            +{dp.checkouts} loans
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-emerald-400">
                            {dp.returns} returned
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            {dp.overdues > 0 ? (
                              <span className="text-amber-400 font-bold">⚠️ {dp.overdues} overdue</span>
                            ) : (
                              <span className="text-gray-500">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-700/30 rounded-full h-2 flex overflow-hidden">
                                <div
                                  className="bg-blue-500 h-2"
                                  style={{ width: `${(dp.checkouts / maxPointVal) * 50}%` }}
                                />
                                <div
                                  className="bg-emerald-500 h-2"
                                  style={{ width: `${(dp.returns / maxPointVal) * 50}%` }}
                                />
                              </div>
                              <span className={`text-[10px] ${t.subTextColor}`}>
                                {dp.checkouts}:{dp.returns}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Category Distribution */}
      {!loading && activeTab === 'categories' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>
                Genre & Category Circulation Share
              </h3>
              <p className={`text-[11px] ${t.subTextColor}`}>
                Proportional breakdown of reader borrow activity grouped by catalog genres
              </p>
            </div>
            {(!categories || categories.categories.length === 0) ? (
              <div className={`p-8 text-center text-xs ${t.subTextColor}`}>No genre categories configured.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${t.tableHead}`}>
                      <th className="py-3 px-4 text-xs font-semibold">Genre Name</th>
                      <th className="py-3 px-4 text-xs font-semibold">Genre Slug</th>
                      <th className="py-3 px-4 text-xs font-semibold text-center">Catalog Titles</th>
                      <th className="py-3 px-4 text-xs font-semibold text-center">Historical Loans</th>
                      <th className="py-3 px-4 text-xs font-semibold">Circulation Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {categories.categories.map((cat) => (
                      <tr key={cat.genreId} className={`border-b transition-colors ${t.tableRow}`}>
                        <td className={`py-3 px-4 text-xs font-bold ${t.titleColor}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {cat.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-400">
                          {cat.handle}
                        </td>
                        <td className={`py-3 px-4 text-xs text-center font-medium ${t.titleColor}`}>
                          {cat.bookCount} books
                        </td>
                        <td className="py-3 px-4 text-xs text-center font-bold text-blue-400">
                          {cat.loanCount} checkouts
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-32 sm:w-44 bg-gray-700/30 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(2, cat.percentage)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold font-mono ${t.titleColor}`}>
                              {cat.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Revenue & Financials */}
      {!loading && activeTab === 'revenue' && revenue && (
        <div className="space-y-4">
          {/* High-level Revenue Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Monthly Subscriptions (MRR)</span>
                <IconCreditCard size={16} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black mt-2 text-emerald-400">
                ${revenue.subscriptionRevenue.totalMRR.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                {revenue.subscriptionRevenue.activeSubscribers} paying patrons
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Fines Collected</span>
                <IconCash size={16} className="text-blue-400" />
              </div>
              <p className="text-2xl font-black mt-2 text-blue-400">
                ${revenue.finesRevenue.totalCollected.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                Paid through Cash & Stripe
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Outstanding Fines</span>
                <IconClock size={16} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black mt-2 text-amber-400">
                ${revenue.finesRevenue.totalPending.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                Unpaid penalty balance
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.subTextColor}`}>Waived Penalties</span>
                <IconAlertTriangle size={16} className="text-purple-400" />
              </div>
              <p className="text-2xl font-black mt-2 text-purple-400">
                ${revenue.finesRevenue.totalWaived.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                Forgiven by librarian discretion
              </p>
            </div>
          </div>

          {/* Plan Breakdown & Fines Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subscription Plans */}
            <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
              <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>
                  Subscription Tier Performance
                </h3>
                <p className={`text-[11px] ${t.subTextColor}`}>Active membership breakdown per recurring plan</p>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-2.5 px-4 text-xs font-semibold">Tier</th>
                    <th className="py-2.5 px-4 text-xs font-semibold text-center">Subscribers</th>
                    <th className="py-2.5 px-4 text-xs font-semibold text-right">Fee</th>
                    <th className="py-2.5 px-4 text-xs font-semibold text-right">MRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {revenue.subscriptionRevenue.planBreakdown.map((p) => (
                    <tr key={p.planCode} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className={`py-3 px-4 text-xs font-bold ${t.titleColor}`}>
                        {p.planName} <span className="font-mono text-[10px] text-gray-500">({p.planCode})</span>
                      </td>
                      <td className={`py-3 px-4 text-xs text-center font-bold text-blue-400`}>
                        {p.subscribersCount}
                      </td>
                      <td className={`py-3 px-4 text-xs text-right font-mono ${t.subTextColor}`}>
                        ${p.price.toFixed(2)}/mo
                      </td>
                      <td className="py-3 px-4 text-xs text-right font-black font-mono text-emerald-400">
                        ${p.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fines Breakdown */}
            <div className={`rounded-2xl border p-4 shadow-xs space-y-4 ${t.cardBg}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${t.titleColor}`}>
                Fines Revenue Channels & Causes
              </h3>

              {/* By Method */}
              <div>
                <span className={`text-[11px] font-semibold uppercase ${t.subTextColor}`}>Payment Settlement Method</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'border-[#2c323e] bg-[#1a1f2c]' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <IconCash size={15} className="text-amber-400" /> Cash Desk
                    </span>
                    <span className="text-xs font-black font-mono text-emerald-400">
                      ${(revenue.finesRevenue.methodBreakdown['CASH'] || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'border-[#2c323e] bg-[#1a1f2c]' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <IconCreditCard size={15} className="text-blue-400" /> Stripe Card
                    </span>
                    <span className="text-xs font-black font-mono text-emerald-400">
                      ${(revenue.finesRevenue.methodBreakdown['STRIPE'] || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* By Reason */}
              <div>
                <span className={`text-[11px] font-semibold uppercase ${t.subTextColor}`}>Penalty Causes</span>
                <div className="space-y-2 mt-2">
                  {Object.entries(revenue.finesRevenue.reasonBreakdown).map(([reason, amt]) => (
                    <div
                      key={reason}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'border-[#2c323e] bg-[#1a1f2c]' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <span className="font-medium text-gray-300">
                        {reason === 'OVERDUE' ? 'Late Return Overdue' : reason === 'LOST_BOOK' ? 'Lost Book Replacement' : 'Book Damage Fee'}
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        ${amt.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

