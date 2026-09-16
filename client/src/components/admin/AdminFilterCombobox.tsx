import { useState, useRef, useEffect, useMemo } from 'react'
import { IconChevronDown, IconSearch, IconX, IconCheck } from '@tabler/icons-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from './AdminContext'

export interface FilterComboboxOption {
  value: string
  label: string
}

interface AdminFilterComboboxProps {
  label: string
  value: string | string[]
  options: FilterComboboxOption[]
  onChange: (val: string[] | string) => void
  onRemove?: () => void
  multiple?: boolean
  placeholder?: string
  className?: string
}

export function AdminFilterCombobox({
  label,
  value,
  options,
  onChange,
  onRemove,
  multiple = true,
  placeholder = 'Search...',
  className = '',
}: AdminFilterComboboxProps) {
  const { isDark } = useAdmin()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Normalize value to array
  const selectedValues: string[] = useMemo(() => {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string' && value.trim()) return value.split(',').map((s) => s.trim()).filter(Boolean)
    return []
  }, [value])

  const hasValue = selectedValues.length > 0

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const q = search.trim().toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [options, search])

  const toggleOption = (optVal: string) => {
    if (!multiple) {
      onChange(selectedValues.includes(optVal) ? '' : optVal)
      setOpen(false)
      setSearch('')
      return
    }

    let nextValues: string[]
    if (selectedValues.includes(optVal)) {
      nextValues = selectedValues.filter((v) => v !== optVal)
    } else {
      nextValues = [...selectedValues, optVal]
    }
    onChange(nextValues)
  }

  const handleClearAll = () => {
    onChange(multiple ? [] : '')
  }

  // Label text to display in trigger box
  const displayLabel = useMemo(() => {
    if (selectedValues.length === 0) return 'All'
    const selectedLabels = selectedValues
      .map((val) => options.find((o) => o.value === val)?.label || val)
    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ')
    }
    return `${selectedLabels.slice(0, 2).join(', ')} (+${selectedLabels.length - 2})`
  }, [selectedValues, options])

  return (
    <div className={`relative select-none ${className}`} ref={containerRef}>
      {/* Unified Trigger Box */}
      <div
        onClick={() => setOpen(!open)}
        className={`h-9 pl-3 pr-2 rounded-md border text-xs sm:text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
          hasValue
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
          {displayLabel}
        </span>

        {/* If value is set: show X button only; if no value: show chevron */}
        {hasValue && onRemove ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClearAll()
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

      {/* Dropdown Popover */}
      {open && (
        <div
          className={`absolute top-full left-0 mt-1.5 min-w-[260px] w-max max-w-[500px] rounded-lg border shadow-xl z-50 p-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100 ${
            isDark
              ? 'bg-[#1a1d24] border-[#2c323e] text-[#cbd2de]'
              : 'bg-white border-[#dce0e5] text-[#212b36]'
          }`}
        >
          {/* Search Bar inside popover */}
          <div className="relative">
            <IconSearch
              size={14}
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#8c94a5]' : 'text-[#8898aa]'
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className={`w-full h-8 pl-8 pr-2 text-xs sm:text-[13px] rounded-md border outline-none transition-colors ${
                isDark
                  ? 'bg-[#13161a] border-[#2c323e] text-white focus:border-blue-500'
                  : 'bg-[#fafbfc] border-[#d3d8de] text-[#212b36] placeholder:text-[#919eab] focus:border-[#0088ff] focus:bg-white'
              }`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
              >
                <IconX size={13} />
              </button>
            )}
          </div>

          {/* Options List with Checkboxes */}
          <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5 py-0.5">
            {filteredOptions.length === 0 ? (
              <div
                className={`py-3 text-center text-xs ${
                  isDark ? 'text-[#8c94a5]' : 'text-[#8898aa]'
                }`}
              >
                No matching results
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`w-full px-2.5 py-1.5 rounded-md text-xs sm:text-[13px] flex items-center gap-2.5 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-600/15 text-white'
                          : 'bg-blue-50 text-[#0088ff] font-medium'
                        : isDark
                        ? 'hover:bg-[#252b36] text-[#cbd2de]'
                        : 'hover:bg-[#f4f6f8] text-[#212b36]'
                    }`}
                  >
                    {multiple ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOption(opt.value)}
                        className={isDark ? '!border-[#4d576a]' : '!border-[#b0b9c2]'}
                      />
                    ) : (
                      isSelected && <IconCheck size={14} className="text-[#0088ff] shrink-0" />
                    )}
                    <span className="whitespace-nowrap flex-1">{opt.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

