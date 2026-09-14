import { DateRangePicker, type DateRangePickerProps } from '@/components/ui/date-range-picker'
import { useAdmin } from './AdminContext'
import { cn } from '@/lib/utils'

export interface AdminDateRangePickerProps extends DateRangePickerProps {
  label?: string
  required?: boolean
  error?: string
}

export function AdminDateRangePicker({
  label,
  required = false,
  error,
  className = '',
  ...props
}: AdminDateRangePickerProps) {
  const { t, isDark } = useAdmin()

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className={`block text-xs font-medium ${t.subTextColor}`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <DateRangePicker
        className={cn(
          'w-full h-9 rounded-md transition-colors',
          isDark
            ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de] hover:border-[#4d576a]'
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400',
          error && 'border-rose-500 dark:border-rose-500',
          className
        )}
        {...props}
      />

      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  )
}
