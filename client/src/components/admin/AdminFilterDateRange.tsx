import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker'
import { IconX } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

export interface AdminFilterDateRangeProps {
  label: string
  value?: DateRange
  onChange: (range: DateRange) => void
  onRemove?: () => void
  placeholder?: string
  className?: string
}

export function AdminFilterDateRange({
  label,
  value,
  onChange,
  onRemove,
  placeholder,
  className = '',
}: AdminFilterDateRangeProps) {
  const { isDark } = useAdmin()

  const hasValue = Boolean(value?.start)

  return (
    <div className={`relative flex items-center ${className}`}>
      <div
        className={`h-9 pl-3 pr-2 rounded-md border text-xs sm:text-[13px] flex items-center gap-1.5 transition-colors whitespace-nowrap ${
          hasValue
            ? isDark
              ? 'bg-[#252a34] border-blue-500/50 text-blue-300'
              : 'bg-blue-50 border-blue-300 text-[#0088ff] font-medium'
            : isDark
            ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]'
            : 'bg-white border-[#d3d8de] text-[#212b36]'
        }`}
      >
        <span className={isDark ? 'text-[#8c94a5]' : 'text-[#637381]'}>
          {label}:
        </span>

        <DateRangePicker
          value={value}
          onChange={onChange}
          allowClear={false}
          placeholder={placeholder || 'All dates'}
          className="h-7 border-none bg-transparent hover:border-none hover:bg-transparent dark:hover:bg-transparent shadow-none px-1 text-xs font-semibold focus:border-none focus:ring-0"
        />

        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className={`p-0.5 rounded transition-colors ml-0.5 cursor-pointer ${
              hasValue
                ? isDark
                  ? 'hover:bg-blue-500/20 text-blue-300'
                  : 'hover:bg-blue-100 text-[#0088ff]'
                : isDark
                ? 'hover:bg-[#252b36] text-gray-400 hover:text-white'
                : 'hover:bg-[#ebf0f5] text-[#8898aa] hover:text-[#212b36]'
            }`}
            title="Remove filter"
          >
            <IconX size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
