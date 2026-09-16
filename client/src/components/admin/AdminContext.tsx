import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export interface CirculationSettings {
  defaultLoanDays: number
  defaultRenewDays: number
  maxRenewalsAllowed: number
  finePerDayOverdue: number
}

export interface AdminThemeTokens {
  pageBg: string
  sidebarBg: string
  headerBorder: string
  cardBg: string
  cardHover: string
  titleColor: string
  subTextColor: string
  mutedColor: string
  inputBg: string
  primaryBtn: string
  secondaryBtn: string
  tableWrapper: string
  tableHead: string
  tableRow: string
  tableCell: string
  statusActive: string
  statusBorrowed: string
  statusOverdue: string
  statusMuted: string
  modalBg: string
}

interface AdminContextType {
  themeMode: 'dark' | 'light'
  isDark: boolean
  toggleThemeMode: (mode: 'dark' | 'light') => void
  t: AdminThemeTokens
  feedback: { type: 'success' | 'error'; text: string } | null
  showFeedback: (type: 'success' | 'error', text: string) => void
  dismissFeedback: () => void
  circulationSettings: CirculationSettings
  setCirculationSettings: React.Dispatch<React.SetStateAction<CirculationSettings>>
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  headerAction: React.ReactNode
  setHeaderAction: React.Dispatch<React.SetStateAction<React.ReactNode>>
  headerTitle: React.ReactNode | null
  setHeaderTitle: React.Dispatch<React.SetStateAction<React.ReactNode | null>>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('libro_admin_theme') as 'dark' | 'light') || 'dark'
  })

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [headerAction, setHeaderAction] = useState<React.ReactNode>(null)
  const [headerTitle, setHeaderTitle] = useState<React.ReactNode | null>(null)

  const [circulationSettings, setCirculationSettings] = useState<CirculationSettings>({
    defaultLoanDays: 14,
    defaultRenewDays: 7,
    maxRenewalsAllowed: 2,
    finePerDayOverdue: 0.5,
  })

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 4000)
  }, [])

  const dismissFeedback = useCallback(() => {
    setFeedback(null)
  }, [])

  const toggleThemeMode = useCallback((mode: 'dark' | 'light') => {
    setThemeMode(mode)
    localStorage.setItem('libro_admin_theme', mode)
  }, [])

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeMode])

  const isDark = themeMode === 'dark'

  const t: AdminThemeTokens = useMemo(() => ({
    pageBg: isDark ? 'bg-[#16181d] text-[#cbd2de]' : 'bg-[#f3f4f6] text-[#212b36]',
    sidebarBg: isDark ? 'bg-[#121316] border-[#22262e]' : 'bg-[#ebedf0] border-r border-[#d8dce2]',
    headerBorder: isDark ? 'border-[#262a34]' : 'border-[#d8dce2]',
    cardBg: isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border border-[#dce0e5] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    cardHover: isDark ? 'hover:border-[#3d4554]' : 'hover:border-[#c4cdd5] hover:shadow-xs',
    titleColor: isDark ? 'text-[#e2e6ed]' : 'text-[#212b36]',
    subTextColor: isDark ? 'text-[#8c94a5]' : 'text-[#475467]',
    mutedColor: isDark ? 'text-[#5d6575]' : 'text-[#637381]',
    inputBg: isDark
      ? 'bg-[#16181d] border-[#2c323e] text-[#e2e8f0] placeholder:text-[#5d6575] focus:border-[#066fd1]'
      : 'bg-white border-[#d3d8de] text-[#212b36] placeholder:text-[#919eab] hover:border-[#b0b9c2] focus:border-[#0088ff] focus:ring-1 focus:ring-[#0088ff]',
    primaryBtn: isDark
      ? 'bg-[#066fd1] hover:bg-[#2979ff] text-white shadow-xs font-semibold'
      : 'bg-[#0088ff] hover:bg-[#0077e6] text-white shadow-xs font-semibold',
    secondaryBtn: isDark
      ? 'bg-[#16181d] border border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#3e4757]'
      : 'bg-white border border-[#d3d8de] text-[#212b36] hover:bg-[#f4f6f8] hover:border-[#b0b9c2] shadow-2xs',
    tableWrapper: isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border border-[#dce0e5] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    tableHead: isDark ? 'bg-[#191c22] border-[#2c323e] text-[#8c94a5]' : 'bg-[#f9fafb] border-b border-[#e1e5eb] text-[#475467] font-semibold',
    tableRow: isDark ? 'border-[#2c323e]/50 hover:bg-[#252a34]' : 'border-b border-[#eef1f4] hover:bg-[#f9fafb]',
    tableCell: isDark ? 'text-[#cbd2de]' : 'text-[#212b36]',
    statusActive: isDark
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium',
    statusBorrowed: isDark
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : 'bg-[#fff8eb] text-[#b46b00] border border-[#f2be54] font-medium',
    statusOverdue: isDark
      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      : 'bg-rose-50 text-rose-700 border border-rose-300 font-medium',
    statusMuted: isDark
      ? 'bg-[#16181d] text-[#7d8697] border border-[#2c323e]'
      : 'bg-[#f4f6f8] text-[#475467] border border-[#dce0e5] font-medium',
    modalBg: isDark ? 'bg-[#1f232b] border-[#2c323e] text-[#cbd2de]' : 'bg-white border-[#dce0e5] text-[#212b36] shadow-xl',
  }), [isDark])

  const contextValue = useMemo(() => ({
    themeMode,
    isDark,
    toggleThemeMode,
    t,
    feedback,
    showFeedback,
    dismissFeedback,
    circulationSettings,
    setCirculationSettings,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    headerAction,
    setHeaderAction,
    headerTitle,
    setHeaderTitle,
  }), [
    themeMode,
    isDark,
    toggleThemeMode,
    t,
    feedback,
    showFeedback,
    dismissFeedback,
    circulationSettings,
    mobileSidebarOpen,
    headerAction,
    headerTitle,
  ])

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
