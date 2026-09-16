import { IconSun, IconMoon } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'

export function SettingsPage() {
  const { t, isDark, toggleThemeMode } = useAdmin()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Appearance / Theme Toggle */}
      <div className={`p-6 rounded-xl border ${t.cardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <h3 className={`text-base font-bold ${t.titleColor}`}>Appearance</h3>
          <p className="text-xs text-[#637381] dark:text-[#8c94a5] mt-0.5">Customize interface theme</p>
        </div>

        <div className="inline-flex rounded-lg border border-[#d3d8de] dark:border-gray-700 p-1 bg-[#f3f4f6] dark:bg-gray-800">
          <button
            type="button"
            onClick={() => toggleThemeMode('light')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              !isDark
                ? 'bg-white text-[#212b36] shadow-xs font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <IconSun size={15} className={!isDark ? 'text-amber-500' : ''} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => toggleThemeMode('dark')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-gray-700 text-white shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IconMoon size={15} className={isDark ? 'text-blue-400' : ''} />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export { SettingsPage as AdminSettingsPage }
