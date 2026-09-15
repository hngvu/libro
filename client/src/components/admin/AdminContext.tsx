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
    pageBg: isDark ? 'bg-[#16181d] text-[#cbd2de]' : 'bg-[#f8fafc] text-gray-900',
    sidebarBg: isDark ? 'bg-[#121316] border-[#22262e]' : 'bg-white border-gray-200',
    headerBorder: isDark ? 'border-[#262a34]' : 'border-gray-200',
    cardBg: isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border-gray-200 shadow-xs',
    cardHover: isDark ? 'hover:border-[#3d4554]' : 'hover:border-gray-300 hover:shadow-xs',
    titleColor: isDark ? 'text-[#e2e6ed]' : 'text-gray-900',
    subTextColor: isDark ? 'text-[#8c94a5]' : 'text-gray-600',
    mutedColor: isDark ? 'text-[#5d6575]' : 'text-gray-400',
    inputBg: isDark
      ? 'bg-[#16181d] border-[#2c323e] text-[#e2e8f0] placeholder:text-[#5d6575] focus:border-[#066fd1]'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-[#066fd1]',
    primaryBtn: isDark
      ? 'bg-[#066fd1] hover:bg-[#2979ff] text-white shadow-xs font-semibold'
      : 'bg-[#066fd1] hover:bg-[#005bb5] text-white shadow-xs font-semibold',
    secondaryBtn: isDark
      ? 'bg-[#16181d] border border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#3e4757]'
      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 shadow-2xs',
    tableWrapper: isDark ? 'bg-[#1f232b] border-[#2c323e]' : 'bg-white border-gray-200 shadow-xs',
    tableHead: isDark ? 'bg-[#191c22] border-[#2c323e] text-[#8c94a5]' : 'bg-gray-50/80 border-gray-200 text-gray-600 font-semibold',
    tableRow: isDark ? 'border-[#2c323e]/50 hover:bg-[#252a34]' : 'border-gray-200 hover:bg-gray-50/90',
    tableCell: isDark ? 'text-[#cbd2de]' : 'text-gray-700',
    statusActive: isDark
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    statusBorrowed: isDark
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : 'bg-amber-50 text-amber-700 border border-amber-300',
    statusOverdue: isDark
      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      : 'bg-rose-50 text-rose-700 border border-rose-300',
    statusMuted: isDark
      ? 'bg-[#16181d] text-[#7d8697] border border-[#2c323e]'
      : 'bg-gray-100 text-gray-700 border border-gray-300 font-medium',
    modalBg: isDark ? 'bg-[#1f232b] border-[#2c323e] text-[#cbd2de]' : 'bg-white border-gray-200 text-gray-900 shadow-xl',
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
