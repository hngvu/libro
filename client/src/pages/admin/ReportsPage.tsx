import { useState, useEffect, useCallback, useMemo } from 'react'
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

const GENRE_COLORS = [
  '#0088ff',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
  '#84cc16',
]

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

  // Interactive Chart Hover States
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null)
  const [hoveredGenreIdx, setHoveredGenreIdx] = useState<number | null>(null)

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

  // 1. Circulation Trends SVG Chart Calculations
  const trendChartMetrics = useMemo(() => {
    if (!trends || !trends.dataPoints || trends.dataPoints.length === 0) {
      return null
    }
    const points = trends.dataPoints
    const maxVal = Math.max(...points.map((p) => Math.max(p.checkouts, p.returns, p.overdues)), 5)
    const chartW = 760
    const chartH = 220
    const padL = 40
    const padR = 25
    const padT = 20
    const padB = 35
    const usableW = chartW - padL - padR
    const usableH = chartH - padT - padB

    const coords = points.map((p, i) => {
      const x = points.length > 1 ? padL + (i / (points.length - 1)) * usableW : padL + usableW / 2
      const yCheckouts = padT + usableH - (p.checkouts / maxVal) * usableH
      const yReturns = padT + usableH - (p.returns / maxVal) * usableH
      const yOverdues = padT + usableH - (p.overdues / maxVal) * usableH
      return { ...p, x, yCheckouts, yReturns, yOverdues }
    })

    const makePath = (key: 'yCheckouts' | 'yReturns' | 'yOverdues') => {
      if (coords.length === 0) return ''
      return coords.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x},${pt[key]}`
        const prev = coords[i - 1]
        const cpx1 = prev.x + (pt.x - prev.x) / 2
        const cpy1 = prev[key]
        const cpx2 = prev.x + (pt.x - prev.x) / 2
        const cpy2 = pt[key]
        return `${acc} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${pt.x},${pt[key]}`
      }, '')
    }

    const pathCheckouts = makePath('yCheckouts')
    const pathReturns = makePath('yReturns')
    const pathOverdues = makePath('yOverdues')

    const baselineY = padT + usableH
    const areaCheckouts = coords.length > 0 ? `${pathCheckouts} L ${coords[coords.length - 1].x},${baselineY} L ${coords[0].x},${baselineY} Z` : ''
    const areaReturns = coords.length > 0 ? `${pathReturns} L ${coords[coords.length - 1].x},${baselineY} L ${coords[0].x},${baselineY} Z` : ''

    const yTicks = [0, Math.round(maxVal / 2), maxVal]

    return {
      chartW,
      chartH,
      padL,
      padR,
      padT,
      padB,
      usableW,
      usableH,
      baselineY,
      coords,
      pathCheckouts,
      pathReturns,
      pathOverdues,
      areaCheckouts,
      areaReturns,
      maxVal,
      yTicks,
    }
  }, [trends])

  // 2. Category Distribution Donut Chart Calculations
  const donutSlices = useMemo(() => {
    if (!categories || !categories.categories || categories.categories.length === 0) {
      return []
    }
    const total = categories.categories.reduce((acc, c) => acc + (c.bookCount || 0), 0) || 1
    const size = 180
    const cx = size / 2
    const cy = size / 2
    const radius = 68
    const strokeWidth = 24
    const circumference = 2 * Math.PI * radius

    let currentAngle = -90

    return categories.categories.map((cat, i) => {
      const percentage = (cat.bookCount / total) * 100
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
      const rotation = currentAngle
      currentAngle += (percentage / 100) * 360
      const color = GENRE_COLORS[i % GENRE_COLORS.length]

      return {
        ...cat,
        color,
        cx,
        cy,
        radius,
        strokeWidth,
        strokeDasharray,
        rotation,
        percentage: Number(percentage.toFixed(1)),
      }
    })
  }, [categories])

  return (
    <div className="space-y-5">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] dark:border-[#22262e] pb-0">
        {/* Navigation Tabs (Clean Underline Style) */}
        <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('top-books')}
            className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer relative select-none whitespace-nowrap border-b-2 ${
              activeTab === 'top-books'
                ? isDark
                  ? 'text-white border-[#0088ff] font-semibold'
                  : 'text-[#212b36] border-[#0088ff] font-semibold'
                : isDark
                ? 'text-[#8c94a5] border-transparent hover:text-white'
                : 'text-[#64748b] border-transparent hover:text-[#212b36]'
            }`}
          >
            <IconBooks size={17} className={activeTab === 'top-books' ? 'text-[#0088ff]' : isDark ? 'text-[#8c94a5]' : 'text-[#94a3b8]'} />
            <span>Top Titles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('circulation')}
            className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer relative select-none whitespace-nowrap border-b-2 ${
              activeTab === 'circulation'
                ? isDark
                  ? 'text-white border-[#0088ff] font-semibold'
                  : 'text-[#212b36] border-[#0088ff] font-semibold'
                : isDark
                ? 'text-[#8c94a5] border-transparent hover:text-white'
                : 'text-[#64748b] border-transparent hover:text-[#212b36]'
            }`}
          >
            <IconChartBar size={17} className={activeTab === 'circulation' ? 'text-[#0088ff]' : isDark ? 'text-[#8c94a5]' : 'text-[#94a3b8]'} />
            <span>Circulation Trends</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer relative select-none whitespace-nowrap border-b-2 ${
              activeTab === 'categories'
                ? isDark
                  ? 'text-white border-[#0088ff] font-semibold'
                  : 'text-[#212b36] border-[#0088ff] font-semibold'
                : isDark
                ? 'text-[#8c94a5] border-transparent hover:text-white'
                : 'text-[#64748b] border-transparent hover:text-[#212b36]'
            }`}
          >
            <IconCategory size={17} className={activeTab === 'categories' ? 'text-[#0088ff]' : isDark ? 'text-[#8c94a5]' : 'text-[#94a3b8]'} />
            <span>Category Distribution</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer relative select-none whitespace-nowrap border-b-2 ${
              activeTab === 'revenue'
                ? isDark
                  ? 'text-white border-[#0088ff] font-semibold'
                  : 'text-[#212b36] border-[#0088ff] font-semibold'
                : isDark
                ? 'text-[#8c94a5] border-transparent hover:text-white'
                : 'text-[#64748b] border-transparent hover:text-[#212b36]'
            }`}
          >
            <IconCoins size={17} className={activeTab === 'revenue' ? 'text-[#0088ff]' : isDark ? 'text-[#8c94a5]' : 'text-[#94a3b8]'} />
            <span>Revenue & Fines</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pb-2.5 sm:pb-3 justify-end">
          {/* Sub-filter for top books */}
          {activeTab === 'top-books' && (
            <select
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value))}
              aria-label="Filter number of top books"
              className={`h-8.5 px-3 rounded-lg text-xs font-medium border cursor-pointer outline-hidden transition ${t.inputBg}`}
            >
              <option value={5}>Top 5 Titles</option>
              <option value={10}>Top 10 Titles</option>
              <option value={25}>Top 25 Titles</option>
              <option value={50}>Top 50 Titles</option>
            </select>
          )}

          {/* Sub-filter for trends */}
          {activeTab === 'circulation' && (
            <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-[#121316] border border-gray-200 dark:border-[#22262e] gap-0.5">
              {(['7d', '30d', '12m'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTrendPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    trendPeriod === p
                      ? 'bg-white dark:bg-[#252932] text-[#212b36] dark:text-white font-semibold shadow-xs'
                      : isDark
                      ? 'text-[#8c94a5] hover:text-white'
                      : 'text-[#64748b] hover:text-[#212b36]'
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
            className={`h-8.5 w-8.5 rounded-lg text-xs font-medium border flex items-center justify-center cursor-pointer transition-colors ${t.secondaryBtn} ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Export Buttons */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className={`h-8.5 px-3 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${t.secondaryBtn}`}
          >
            <IconDownload size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className={`h-8.5 px-3 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${t.secondaryBtn}`}
          >
            <IconDownload size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0088ff] border-t-transparent rounded-full animate-spin" />
          <p className={`text-xs ${t.subTextColor}`}>Retrieving library analytics from database...</p>
        </div>
      )}

      {/* TAB 1: Top Borrowed Titles */}
      {!loading && activeTab === 'top-books' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <span className={`text-xs font-semibold ${t.subTextColor}`}>Analyzed Titles</span>
              <p className={`text-2xl font-bold tracking-tight mt-1.5 ${t.titleColor} tabular-nums`}>{topBooks.length}</p>
            </div>
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <span className={`text-xs font-semibold ${t.subTextColor}`}>Highest Checkouts</span>
              <p className="text-2xl font-bold tracking-tight mt-1.5 text-[#0088ff] dark:text-blue-400 tabular-nums">
                {topBooks[0] ? `${topBooks[0].totalCheckouts} loans` : '0'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <span className={`text-xs font-semibold ${t.subTextColor}`}>Most Popular Title</span>
              <p className={`text-sm font-bold mt-2 truncate ${t.titleColor}`}>
                {topBooks[0] ? topBooks[0].title : 'None'}
              </p>
            </div>
          </div>

          {/* Top Titles Visual Ranking Bars Chart */}
          {topBooks.length > 0 && (
            <div className={`p-4 sm:p-5 rounded-xl border space-y-3.5 ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold ${t.titleColor}`}>Top Borrowed Books Distribution</h3>
                  <p className={`text-xs ${t.subTextColor} mt-0.5`}>Comparative checkout volume among library favorites</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0088ff]/10 text-[#0088ff] border border-[#0088ff]/20 tabular-nums">
                  {Math.min(5, topBooks.length)} Top Featured
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {topBooks.slice(0, 5).map((b, idx) => {
                  const pct = Math.round((b.totalCheckouts / maxCheckouts) * 100)
                  return (
                    <div key={b.bookId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              idx === 0
                                ? 'bg-[#fff8eb] text-[#b46b00] border border-[#f2be54] dark:bg-amber-500/20 dark:text-amber-400'
                                : idx === 1
                                ? 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-300/20 dark:text-slate-300'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-700/20 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className={`font-semibold truncate ${t.titleColor}`}>{b.title}</span>
                          <span className={`hidden sm:inline text-[11px] truncate ${t.mutedColor}`}>
                            by {b.authors?.join(', ') || 'Unknown'}
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-xs text-[#0088ff] dark:text-blue-400 shrink-0">
                          {b.totalCheckouts} loans ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700/40 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full transition-all duration-700 bg-gradient-to-r from-[#0088ff] to-[#38bdf8]"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Table View */}
          <div className={`rounded-xl border overflow-hidden ${t.tableWrapper}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-[#dce0e5]'}`}>
              <h3 className={`text-sm font-bold ${t.titleColor}`}>
                Detailed Circulation Ranking
              </h3>
              <p className={`text-xs ${t.subTextColor} mt-0.5`}>
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
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs ${
                                idx === 0
                                  ? isDark
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-[#fff8eb] text-[#b46b00] border border-[#f2be54]'
                                  : idx === 1
                                  ? isDark
                                    ? 'bg-slate-300/15 text-slate-300 border border-slate-400/30'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : idx === 2
                                  ? isDark
                                    ? 'bg-amber-700/20 text-amber-400 border border-amber-600/30'
                                    : 'bg-amber-50 text-amber-800 border border-amber-300'
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
                                  className="w-9 h-12 object-cover rounded-md shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-12 rounded-md bg-[#0088ff]/10 border border-[#0088ff]/20 flex items-center justify-center shrink-0">
                                  <IconBooks size={18} className="text-[#0088ff]" />
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
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums bg-[#0088ff]/10 text-[#0088ff] dark:bg-blue-500/15 dark:text-blue-400 border border-[#0088ff]/20 dark:border-blue-500/20">
                              {b.totalCheckouts} loans
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold tabular-nums border ${
                                b.availableCopies === 0
                                  ? isDark
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isDark
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {b.availableCopies} / {b.totalCopies} available
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-28 sm:w-36 bg-gray-200 dark:bg-gray-700/40 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-[#0088ff] h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(5, demandPercent)}%` }}
                                />
                              </div>
                              <span className={`text-[11px] font-semibold tabular-nums ${t.subTextColor}`}>
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
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Total Checkouts</span>
                <IconTrendingUp size={16} className="text-[#0088ff] dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-[#0088ff] dark:text-blue-400 tabular-nums">{totalTrendCheckouts}</p>
            </div>
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Total Returns</span>
                <IconCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-emerald-600 dark:text-emerald-400 tabular-nums">{totalTrendReturns}</p>
            </div>
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Return Rate</span>
                <IconClock size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-purple-600 dark:text-purple-400 tabular-nums">{returnRate}%</p>
            </div>
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Overdue Incidents</span>
                <IconAlertTriangle size={16} className="text-[#b46b00] dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-[#b46b00] dark:text-amber-400 tabular-nums">{totalTrendOverdues}</p>
            </div>
          </div>

          {/* Interactive Multi-Series SVG Diagram Chart */}
          {trendChartMetrics && trendChartMetrics.coords.length > 0 && (
            <div className={`p-4 sm:p-5 rounded-xl border space-y-3 select-none ${t.cardBg}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-bold ${t.titleColor}`}>
                    Circulation Flow Diagram ({trendPeriod.toUpperCase()})
                  </h3>
                  <p className={`text-xs ${t.subTextColor} mt-0.5`}>
                    Interactive chart plotting checkouts vs returns over timeline
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#0088ff]" />
                    <span className={t.titleColor}>Checkouts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#10b981]" />
                    <span className={t.titleColor}>Returns</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#f59e0b] border-b border-dashed" />
                    <span className={t.titleColor}>Overdues</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Chart Container */}
              <div className="relative w-full overflow-x-auto pt-2">
                <svg
                  viewBox={`0 0 ${trendChartMetrics.chartW} ${trendChartMetrics.chartH}`}
                  className="w-full h-56 sm:h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0088ff" stopOpacity={isDark ? "0.25" : "0.18"} />
                      <stop offset="100%" stopColor="#0088ff" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="areaGradientGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? "0.22" : "0.15"} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {trendChartMetrics.yTicks.map((val) => {
                    const y = trendChartMetrics.padT + trendChartMetrics.usableH - (val / trendChartMetrics.maxVal) * trendChartMetrics.usableH
                    return (
                      <g key={val}>
                        <line
                          x1={trendChartMetrics.padL}
                          y1={y}
                          x2={trendChartMetrics.chartW - trendChartMetrics.padR}
                          y2={y}
                          stroke={isDark ? '#2c323e' : '#e5e7eb'}
                          strokeDasharray="4 4"
                        />
                        <text
                          x={trendChartMetrics.padL - 8}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="10"
                          fill={isDark ? '#8c94a5' : '#9ca3af'}
                          className="tabular-nums"
                        >
                          {val}
                        </text>
                      </g>
                    )
                  })}

                  {/* Area fills */}
                  <path d={trendChartMetrics.areaCheckouts} fill="url(#areaGradientBlue)" />
                  <path d={trendChartMetrics.areaReturns} fill="url(#areaGradientGreen)" />

                  {/* Stroke lines */}
                  <path
                    d={trendChartMetrics.pathCheckouts}
                    fill="none"
                    stroke="#0088ff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={trendChartMetrics.pathReturns}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={trendChartMetrics.pathOverdues}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />

                  {/* Interactive Crosshair & Data Points */}
                  {trendChartMetrics.coords.map((pt, idx) => {
                    const isHovered = hoveredTrendIdx === idx
                    return (
                      <g
                        key={pt.label}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTrendIdx(idx)}
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                      >
                        {/* Hover trigger column area */}
                        <rect
                          x={pt.x - 18}
                          y={trendChartMetrics.padT}
                          width="36"
                          height={trendChartMetrics.usableH}
                          fill="transparent"
                        />

                        {/* Hover Vertical Guide */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={trendChartMetrics.padT}
                            x2={pt.x}
                            y2={trendChartMetrics.baselineY}
                            stroke={isDark ? '#475467' : '#94a3b8'}
                            strokeDasharray="3 3"
                            strokeWidth="1.2"
                          />
                        )}

                        {/* Dots */}
                        <circle
                          cx={pt.x}
                          cy={pt.yCheckouts}
                          r={isHovered ? '5' : '3.5'}
                          fill="#0088ff"
                          stroke={isDark ? '#1f232b' : '#ffffff'}
                          strokeWidth="2"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.yReturns}
                          r={isHovered ? '5' : '3.5'}
                          fill="#10b981"
                          stroke={isDark ? '#1f232b' : '#ffffff'}
                          strokeWidth="2"
                        />
                        {pt.overdues > 0 && (
                          <circle
                            cx={pt.x}
                            cy={pt.yOverdues}
                            r={isHovered ? '4' : '3'}
                            fill="#f59e0b"
                            stroke={isDark ? '#1f232b' : '#ffffff'}
                            strokeWidth="1.5"
                          />
                        )}

                        {/* X-axis Label */}
                        <text
                          x={pt.x}
                          y={trendChartMetrics.chartH - 8}
                          textAnchor="middle"
                          fontSize="10.5"
                          fontWeight={isHovered ? '600' : '400'}
                          fill={isHovered ? (isDark ? '#ffffff' : '#111827') : isDark ? '#8c94a5' : '#6b7280'}
                        >
                          {pt.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Floating Tooltip */}
                {hoveredTrendIdx !== null && trendChartMetrics.coords[hoveredTrendIdx] && (
                  <div
                    className="absolute z-20 pointer-events-none bg-gray-900/95 dark:bg-[#121418]/95 backdrop-blur-sm text-white p-2.5 rounded-xl shadow-xl border border-gray-700/60 text-xs whitespace-nowrap space-y-1 transform -translate-x-1/2"
                    style={{
                      left: `${(trendChartMetrics.coords[hoveredTrendIdx].x / trendChartMetrics.chartW) * 100}%`,
                      top: '10px',
                    }}
                  >
                    <p className="font-bold border-b border-gray-700/60 pb-1 text-gray-200">
                      Period: {trendChartMetrics.coords[hoveredTrendIdx].label}
                    </p>
                    <div className="flex flex-col gap-1 pt-0.5">
                      <div className="flex items-center justify-between gap-4 text-blue-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0088ff]" /> Checkouts:</span>
                        <span className="font-bold tabular-nums text-white">+{trendChartMetrics.coords[hoveredTrendIdx].checkouts}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Returns:</span>
                        <span className="font-bold tabular-nums text-white">{trendChartMetrics.coords[hoveredTrendIdx].returns}</span>
                      </div>
                      {trendChartMetrics.coords[hoveredTrendIdx].overdues > 0 && (
                        <div className="flex items-center justify-between gap-4 text-amber-400">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Overdues:</span>
                          <span className="font-bold tabular-nums text-white">{trendChartMetrics.coords[hoveredTrendIdx].overdues}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Series Table */}
          <div className={`rounded-xl border overflow-hidden ${t.tableWrapper}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#2c323e]' : 'border-[#dce0e5]'}`}>
              <div>
                <h3 className={`text-sm font-bold ${t.titleColor}`}>
                  Circulation History Log
                </h3>
                <p className={`text-xs ${t.subTextColor} mt-0.5`}>
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
                          <td className={`py-3 px-4 text-xs font-semibold ${t.titleColor}`}>{dp.label}</td>
                          <td className="py-3 px-4 text-xs font-semibold tabular-nums text-[#0088ff] dark:text-blue-400">
                            +{dp.checkouts} loans
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {dp.returns} returned
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            {dp.overdues > 0 ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold tabular-nums border ${
                                isDark
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                  : 'bg-[#fff8eb] text-[#b46b00] border-[#f2be54]'
                              }`}>
                                {dp.overdues} overdue
                              </span>
                            ) : (
                              <span className={t.mutedColor}>0</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700/40 rounded-full h-2 flex overflow-hidden">
                                <div
                                  className="bg-[#0088ff] h-2"
                                  style={{ width: `${(dp.checkouts / maxPointVal) * 50}%` }}
                                />
                                <div
                                  className="bg-emerald-500 h-2"
                                  style={{ width: `${(dp.returns / maxPointVal) * 50}%` }}
                                />
                              </div>
                              <span className={`text-[11px] font-semibold tabular-nums ${t.subTextColor}`}>
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
          {/* Interactive Donut & Category Breakdown Chart */}
          {donutSlices.length > 0 && (
            <div className={`p-4 sm:p-6 rounded-xl border ${t.cardBg}`}>
              <div className="mb-4">
                <h3 className={`text-sm font-bold ${t.titleColor}`}>Category Breakdown Diagram</h3>
                <p className={`text-xs ${t.subTextColor} mt-0.5`}>Visual representation of catalog titles and checkout volume by genre</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Donut Chart Visual */}
                <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                  <svg width="190" height="190" viewBox="0 0 180 180" className="transform -rotate-90">
                    {donutSlices.map((slice, i) => {
                      const isHovered = hoveredGenreIdx === i
                      return (
                        <circle
                          key={slice.genreId}
                          cx={slice.cx}
                          cy={slice.cy}
                          r={slice.radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={isHovered ? slice.strokeWidth + 4 : slice.strokeWidth}
                          strokeDasharray={slice.strokeDasharray}
                          transform={`rotate(${slice.rotation} ${slice.cx} ${slice.cy})`}
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setHoveredGenreIdx(i)}
                          onMouseLeave={() => setHoveredGenreIdx(null)}
                        />
                      )
                    })}
                  </svg>
                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className={`text-[11px] font-medium ${t.subTextColor}`}>Total Titles</span>
                    <span className={`text-2xl font-bold tracking-tight tabular-nums ${t.titleColor}`}>
                      {categories?.categories.reduce((acc, c) => acc + (c.bookCount || 0), 0) || 0}
                    </span>
                    <span className="text-[11px] text-[#0088ff] font-semibold tabular-nums">
                      {categories?.categories.reduce((acc, c) => acc + (c.loanCount || 0), 0) || 0} loans
                    </span>
                  </div>
                </div>

                {/* Donut Legends and Bars */}
                <div className="md:col-span-7 space-y-2.5">
                  {donutSlices.map((slice, i) => {
                    const isHovered = hoveredGenreIdx === i
                    return (
                      <div
                        key={slice.genreId}
                        className={`p-2 rounded-lg transition-all cursor-pointer border ${
                          isHovered
                            ? isDark
                              ? 'bg-[#252932] border-blue-500/40'
                              : 'bg-blue-50/60 border-blue-200'
                            : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        onMouseEnter={() => setHoveredGenreIdx(i)}
                        onMouseLeave={() => setHoveredGenreIdx(null)}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                            <span className={`font-semibold ${t.titleColor}`}>{slice.name}</span>
                            <span className={`text-[11px] ${t.mutedColor}`}>({slice.bookCount} books)</span>
                          </div>
                          <span className="font-semibold tabular-nums text-xs" style={{ color: slice.color }}>
                            {slice.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700/40 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${slice.percentage}%`, backgroundColor: slice.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Table List */}
          <div className={`rounded-xl border overflow-hidden ${t.tableWrapper}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-[#dce0e5]'}`}>
              <h3 className={`text-sm font-bold ${t.titleColor}`}>
                Genre & Category Circulation Share
              </h3>
              <p className={`text-xs ${t.subTextColor} mt-0.5`}>
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
                    {categories.categories.map((cat, i) => (
                      <tr key={cat.genreId} className={`border-b transition-colors ${t.tableRow}`}>
                        <td className={`py-3 px-4 text-xs font-bold ${t.titleColor}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                            {cat.name}
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>
                          {cat.handle}
                        </td>
                        <td className={`py-3 px-4 text-xs text-center font-medium tabular-nums ${t.titleColor}`}>
                          {cat.bookCount} books
                        </td>
                        <td className="py-3 px-4 text-xs text-center font-semibold tabular-nums text-[#0088ff] dark:text-blue-400">
                          {cat.loanCount} checkouts
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-32 sm:w-44 bg-gray-200 dark:bg-gray-700/40 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(2, cat.percentage)}%`, backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length] }}
                              />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${t.titleColor}`}>
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
            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Monthly Subscriptions (MRR)</span>
                <IconCreditCard size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-emerald-600 dark:text-emerald-400 tabular-nums">
                ${revenue.subscriptionRevenue.totalMRR.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 tabular-nums ${t.subTextColor}`}>
                {revenue.subscriptionRevenue.activeSubscribers} paying patrons
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Fines Collected</span>
                <IconCash size={16} className="text-[#0088ff] dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-[#0088ff] dark:text-blue-400 tabular-nums">
                ${revenue.finesRevenue.totalCollected.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                Paid through Cash & Stripe
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Outstanding Fines</span>
                <IconClock size={16} className="text-[#b46b00] dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-[#b46b00] dark:text-amber-400 tabular-nums">
                ${revenue.finesRevenue.totalPending.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                Unpaid penalty balance
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${t.cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.subTextColor}`}>Waived Penalties</span>
                <IconAlertTriangle size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold tracking-tight mt-2 text-purple-600 dark:text-purple-400 tabular-nums">
                ${revenue.finesRevenue.totalWaived.toFixed(2)}
              </p>
              <p className={`text-[11px] mt-1 ${t.subTextColor}`}>
                Forgiven by librarian discretion
              </p>
            </div>
          </div>

          {/* Revenue Distribution Diagram Visual Bar */}
          <div className={`p-4 sm:p-5 rounded-xl border space-y-3 ${t.cardBg}`}>
            <h3 className={`text-sm font-bold ${t.titleColor}`}>Financial Composition Meter</h3>
            <div className="space-y-2">
              {(() => {
                const mrr = revenue.subscriptionRevenue.totalMRR
                const collected = revenue.finesRevenue.totalCollected
                const pending = revenue.finesRevenue.totalPending
                const totalFin = mrr + collected + pending

                if (totalFin === 0) {
                  return (
                    <>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 flex overflow-hidden">
                        <div className="w-full bg-gray-200 dark:bg-gray-700/60 h-3" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Subscriptions MRR: 0% ($0.00)
                        </div>
                        <div className="flex items-center gap-1.5 text-[#0088ff] dark:text-blue-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0088ff]" />
                          Collected Fines: 0% ($0.00)
                        </div>
                        <div className="flex items-center gap-1.5 text-[#b46b00] dark:text-amber-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                          Outstanding: 0% ($0.00)
                        </div>
                      </div>
                    </>
                  )
                }

                const mrrPct = Math.round((mrr / totalFin) * 100)
                const collectedPct = Math.round((collected / totalFin) * 100)
                const pendingPct = Math.max(0, 100 - mrrPct - collectedPct)

                return (
                  <>
                    <div className="w-full bg-gray-200 dark:bg-gray-700/40 rounded-full h-3 flex overflow-hidden">
                      {mrrPct > 0 && (
                        <div
                          className="bg-emerald-500 h-3 transition-all duration-500"
                          style={{ width: `${mrrPct}%` }}
                          title={`MRR: ${mrrPct}%`}
                        />
                      )}
                      {collectedPct > 0 && (
                        <div
                          className="bg-[#0088ff] h-3 transition-all duration-500"
                          style={{ width: `${collectedPct}%` }}
                          title={`Collected: ${collectedPct}%`}
                        />
                      )}
                      {pendingPct > 0 && (
                        <div
                          className="bg-[#f59e0b] h-3 transition-all duration-500"
                          style={{ width: `${pendingPct}%` }}
                          title={`Outstanding: ${pendingPct}%`}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Subscriptions MRR: {mrrPct}% (${mrr.toFixed(2)})
                      </div>
                      <div className="flex items-center gap-1.5 text-[#0088ff] dark:text-blue-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0088ff]" />
                        Collected Fines: {collectedPct}% (${collected.toFixed(2)})
                      </div>
                      <div className="flex items-center gap-1.5 text-[#b46b00] dark:text-amber-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                        Outstanding: {pendingPct}% (${pending.toFixed(2)})
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Plan Breakdown & Fines Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subscription Plans */}
            <div className={`rounded-xl border overflow-hidden ${t.tableWrapper}`}>
              <div className={`p-4 border-b ${isDark ? 'border-[#2c323e]' : 'border-[#dce0e5]'}`}>
                <h3 className={`text-sm font-bold ${t.titleColor}`}>
                  Subscription Tier Performance
                </h3>
                <p className={`text-xs ${t.subTextColor} mt-0.5`}>Active membership breakdown per recurring plan</p>
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
                      <td className={`py-3 px-4 text-xs font-semibold ${t.titleColor}`}>
                        {p.planName} <span className="text-[11px] text-gray-400 font-medium">({p.planCode})</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-center font-semibold tabular-nums text-[#0088ff] dark:text-blue-400">
                        {p.subscribersCount}
                      </td>
                      <td className={`py-3 px-4 text-xs text-right font-medium tabular-nums ${t.subTextColor}`}>
                        ${p.price.toFixed(2)}/mo
                      </td>
                      <td className="py-3 px-4 text-xs text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        ${p.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fines Breakdown */}
            <div className={`rounded-xl border p-4 space-y-4 ${t.cardBg}`}>
              <div>
                <h3 className={`text-sm font-bold ${t.titleColor}`}>
                  Fines Revenue Channels & Causes
                </h3>
                <p className={`text-xs ${t.subTextColor} mt-0.5`}>Breakdown by payment methods and penalty reasons</p>
              </div>

              {/* By Method */}
              <div>
                <span className={`text-xs font-semibold ${t.titleColor}`}>Payment Settlement Method</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-[#dce0e5] bg-[#f9fafb]'}`}>
                    <span className={`text-xs font-medium flex items-center gap-1.5 ${t.titleColor}`}>
                      <IconCash size={15} className="text-[#b46b00] dark:text-amber-400" /> Cash Desk
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${(revenue.finesRevenue.methodBreakdown['CASH'] || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-[#dce0e5] bg-[#f9fafb]'}`}>
                    <span className={`text-xs font-medium flex items-center gap-1.5 ${t.titleColor}`}>
                      <IconCreditCard size={15} className="text-[#0088ff] dark:text-blue-400" /> Stripe Card
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${(revenue.finesRevenue.methodBreakdown['STRIPE'] || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* By Reason */}
              <div>
                <span className={`text-xs font-semibold ${t.titleColor}`}>Penalty Causes</span>
                <div className="space-y-2 mt-2">
                  {Object.keys(revenue.finesRevenue.reasonBreakdown).length === 0 ? (
                    <div className={`p-3 rounded-xl border text-center text-xs border-dashed ${isDark ? 'border-[#2c323e] text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                      No penalty records logged
                    </div>
                  ) : (
                    Object.entries(revenue.finesRevenue.reasonBreakdown).map(([reason, amt]) => (
                      <div
                        key={reason}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-[#dce0e5] bg-[#f9fafb]'
                        }`}
                      >
                        <span className={`font-medium ${t.titleColor}`}>
                          {reason === 'OVERDUE' ? 'Late Return Overdue' : reason === 'LOST_BOOK' ? 'Lost Book Replacement' : 'Book Damage Fee'}
                        </span>
                        <span className="font-semibold tabular-nums text-xs text-[#b46b00] dark:text-amber-400">
                          ${amt.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

