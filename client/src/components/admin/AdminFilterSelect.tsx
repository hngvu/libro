import { useState, useRef, useEffect } from 'react'
import { IconChevronDown, IconX, IconCheck } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

export interface FilterSelectOption {
  value: string
  label: string
}

interface AdminFilterSelectProps {
  label: string
  value: string
  options: FilterSelectOption[]
  onChange: (val: string) => void
  onRemove?: () => void
  allLabel?: string
  className?: string
}

export function AdminFilterSelect({
  label,
  value,
  options,
  onChange,
  onRemove,
  allLabel,
  className = '',
}: AdminFilterSelectProps) {
  const { isDark } = useAdmin()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const effectiveAllLabel = allLabel || `All ${label}s`

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div className={`relative select-none ${className}`} ref={containerRef}>
      {/* Unified Trigger Box */}
      <div
        onClick={() => setOpen(!open)}
        className={`h-9 pl-3 pr-2 rounded-md border text-xs sm:text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
          value
            ? isDark
              ? 'bg-[#252a34] border-blue-500/50 text-blue-300'
              : 'bg-blue-50 border-blue-300 text-[#0088ff] font-medium'
            : isDark
            ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de] hover:border-[#4d576a]'
            : 'bg-white border-[#d3d8de] text-[#212b36] hover:border-[#b0b9c2]'
        }`}
      >
        <span className="opacity-70">{label}:</span>
        <span className="font-medium whitespace-nowrap">
          {selectedOption ? selectedOption.label : 'All'}
        </span>

        {/* If value is set: show X button only; if no value: show chevron */}
        {value && onRemove ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className={`h-5 w-5 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-0.5 ${
              isDark
                ? 'text-[#8c94a5] hover:text-white hover:bg-[#343b48]'
                : 'text-[#8898aa] hover:text-[#212b36] hover:bg-[#ebf0f5]'
            }`}
            title={`Remove ${label} filter`}
          >
            <IconX size={13} />
          </button>
        ) : (
          <IconChevronDown size={14} className="opacity-60 shrink-0" />
        )}
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div
          className={`absolute top-full left-0 mt-1.5 min-w-[150px] rounded-lg border shadow-xl z-50 p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 ${
            isDark
              ? 'bg-[#1a1d24] border-[#2c323e] text-[#cbd2de]'
              : 'bg-white border-[#dce0e5] text-[#212b36]'
          }`}
        >
          {/* All Option */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full px-2.5 py-1.5 rounded-md text-xs sm:text-[13px] text-left flex items-center justify-between transition-colors cursor-pointer ${
              !value
                ? isDark
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'bg-blue-50 text-[#0088ff] font-medium'
                : isDark
                ? 'hover:bg-[#252b36] text-[#cbd2de]'
                : 'hover:bg-[#f4f6f8] text-[#212b36]'
            }`}
          >
            <span>{effectiveAllLabel}</span>
            {!value && <IconCheck size={14} className="text-[#0088ff]" />}
          </button>

          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-2.5 py-1.5 rounded-md text-xs sm:text-[13px] text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-blue-600/20 text-blue-400 font-medium'
                      : 'bg-blue-50 text-[#0088ff] font-medium'
                    : isDark
                    ? 'hover:bg-[#252b36] text-[#cbd2de]'
                    : 'hover:bg-[#f4f6f8] text-[#212b36]'
                }`}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {isSelected && <IconCheck size={14} className="text-[#0088ff] shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
