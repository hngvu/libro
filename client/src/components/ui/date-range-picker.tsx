import React, { useState, useEffect } from 'react'
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

export interface DateRange {
  start?: string // YYYY-MM-DD
  end?: string // YYYY-MM-DD
}

export interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  disabled?: boolean
  className?: string
  format?: 'dd/MM/yyyy' | 'yyyy-MM-dd'
  allowClear?: boolean
  showPresets?: boolean
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function formatDisplayDate(dateStr?: string, fmt: 'dd/MM/yyyy' | 'yyyy-MM-dd' = 'dd/MM/yyyy'): string {
  if (!dateStr) return ''
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    if (fmt === 'dd/MM/yyyy') {
      return `${day}/${month}/${year}`
    }
    return `${year}-${month}-${day}`
  }
  return dateStr
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null
  const clean = dateStr.split('T')[0]
  const parts = clean.split('-').map(Number)
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  return null
}

function toDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range...',
  minDate,
  maxDate,
  disabled = false,
  className = '',
  format = 'dd/MM/yyyy',
  allowClear = true,
  showPresets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const todayStr = toDateString(today)

  // Intermediate selection state
  const [tempRange, setTempRange] = useState<DateRange>(value || {})
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Primary calendar view month
  const [viewDate, setViewDate] = useState<Date>(() => {
    const start = parseDate(value?.start)
    return start || new Date()
  })

  useEffect(() => {
    setTempRange(value || {})
  }, [value, open])

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  // Second month view
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1)
  const nextMonthYear = nextMonthDate.getFullYear()
  const nextMonthIdx = nextMonthDate.getMonth()

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Generate calendar days for a specific year and month
  const generateMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    const startOffset = (firstDay + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{
      dateStr: string
      dayNumber: number
      isCurrentMonth: boolean
      isDisabled: boolean
      isToday: boolean
    }> = []

    for (let i = startOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const d = new Date(year, month - 1, day)
      const dStr = toDateString(d)
      days.push({
        dateStr: dStr,
        dayNumber: day,
        isCurrentMonth: false,
        isDisabled: Boolean((minDate && dStr < minDate) || (maxDate && dStr > maxDate)),
        isToday: dStr === todayStr,
      })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const dStr = toDateString(d)
      days.push({
        dateStr: dStr,
        dayNumber: day,
        isCurrentMonth: true,
        isDisabled: Boolean((minDate && dStr < minDate) || (maxDate && dStr > maxDate)),
        isToday: dStr === todayStr,
      })
    }

    const total = days.length
    const padding = (7 - (total % 7)) % 7
    for (let day = 1; day <= padding; day++) {
      const d = new Date(year, month + 1, day)
      const dStr = toDateString(d)
      days.push({
        dateStr: dStr,
        dayNumber: day,
        isCurrentMonth: false,
        isDisabled: Boolean((minDate && dStr < minDate) || (maxDate && dStr > maxDate)),
        isToday: dStr === todayStr,
      })
    }

    return days
  }

  const firstMonthDays = generateMonthDays(currentYear, currentMonth)
  const secondMonthDays = generateMonthDays(nextMonthYear, nextMonthIdx)

  const handleSelectDay = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled || disabled) return

    if (!tempRange.start || (tempRange.start && tempRange.end)) {
      // Start a new range
      setTempRange({ start: dateStr, end: undefined })
    } else {
      // Selecting end date
      if (dateStr < tempRange.start) {
        setTempRange({ start: dateStr, end: tempRange.start })
      } else {
        setTempRange({ start: tempRange.start, end: dateStr })
      }
    }
  }

  const isDateSelected = (dateStr: string) => {
    return dateStr === tempRange.start || dateStr === tempRange.end
  }

  const isDateInRange = (dateStr: string) => {
    if (tempRange.start && tempRange.end) {
      return dateStr > tempRange.start && dateStr < tempRange.end
    }
    if (tempRange.start && !tempRange.end && hoveredDate) {
      const start = tempRange.start
      const end = hoveredDate
      if (start < end) {
        return dateStr > start && dateStr < end
      }
      return dateStr > end && dateStr < start
    }
    return false
  }

  const isRangeStart = (dateStr: string) => {
    if (tempRange.start && tempRange.end) {
      return dateStr === tempRange.start
    }
    if (tempRange.start && !tempRange.end && hoveredDate) {
      return dateStr === (tempRange.start < hoveredDate ? tempRange.start : hoveredDate)
    }
    return dateStr === tempRange.start
  }

  const isRangeEnd = (dateStr: string) => {
    if (tempRange.start && tempRange.end) {
      return dateStr === tempRange.end
    }
    if (tempRange.start && !tempRange.end && hoveredDate) {
      return dateStr === (tempRange.start < hoveredDate ? hoveredDate : tempRange.start)
    }
    return false
  }

  // Presets Handlers
  const handleApplyPreset = (preset: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (preset) {
      case 'today':
        break
      case 'yesterday':
        start.setDate(now.getDate() - 1)
        end.setDate(now.getDate() - 1)
        break
      case 'last7':
        start.setDate(now.getDate() - 6)
        break
      case 'last30':
        start.setDate(now.getDate() - 29)
        break
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
    }

    const newRange = {
      start: toDateString(start),
      end: toDateString(end),
    }
    setTempRange(newRange)
    onChange?.(newRange)
    setViewDate(start)
    setOpen(false)
  }

  const handleApply = () => {
    if (tempRange.start) {
      const finalRange = {
        start: tempRange.start,
        end: tempRange.end || tempRange.start,
      }
      onChange?.(finalRange)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setTempRange({})
    onChange?.({})
  }

  const displayText = (() => {
    if (value?.start && value?.end) {
      return `${formatDisplayDate(value.start, format)} – ${formatDisplayDate(value.end, format)}`
    }
    if (value?.start) {
      return `${formatDisplayDate(value.start, format)} – ...`
    }
    return placeholder
  })()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'group h-9 px-3 text-xs sm:text-sm rounded-md border flex items-center justify-between gap-2 transition-colors cursor-pointer outline-none select-none text-left',
            'border-gray-300 dark:border-[#2c323e] bg-white dark:bg-[#181a20] text-gray-900 dark:text-[#cbd2de]',
            'hover:border-gray-400 dark:hover:border-[#4d576a]',
            'focus:border-blue-500 dark:focus:border-blue-500',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IconCalendar size={15} className="text-gray-400 dark:text-[#6e7787] shrink-0" />
            <span className={cn('truncate', !value?.start && 'text-gray-400 dark:text-[#6e7787]')}>
              {displayText}
            </span>
          </div>

          {value?.start && allowClear && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#252b36] text-gray-400 hover:text-gray-600 dark:hover:text-white transition cursor-pointer"
            >
              <IconX size={13} />
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0 shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Presets Sidebar */}
        {showPresets && (
          <div className="w-full md:w-36 p-2.5 border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#262c38] flex flex-row md:flex-col gap-1 flex-wrap bg-gray-50/50 dark:bg-[#16181d]/50">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6e7787] px-2 py-1 hidden md:block">
              Presets
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('today')}
              className="px-2.5 py-1 text-xs text-left rounded-md hover:bg-gray-200/70 dark:hover:bg-[#252b36] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('yesterday')}
              className="px-2.5 py-1 text-xs text-left rounded-md hover:bg-gray-200/70 dark:hover:bg-[#252b36] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('last7')}
              className="px-2.5 py-1 text-xs text-left rounded-md hover:bg-gray-200/70 dark:hover:bg-[#252b36] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
            >
              Last 7 days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('last30')}
              className="px-2.5 py-1 text-xs text-left rounded-md hover:bg-gray-200/70 dark:hover:bg-[#252b36] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
            >
              Last 30 days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('thisMonth')}
              className="px-2.5 py-1 text-xs text-left rounded-md hover:bg-gray-200/70 dark:hover:bg-[#252b36] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
            >
              This month
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('lastMonth')}
              className="px-2.5 py-1 text-xs text-left rounded-md hover:bg-gray-200/70 dark:hover:bg-[#252b36] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
            >
              Last month
            </button>
          </div>
        )}

        {/* Calendars area */}
        <div className="p-3 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* First Month Calendar */}
            <div className="w-[240px]">
              <div className="flex items-center justify-between gap-1 mb-2 pb-2 border-b border-gray-100 dark:border-[#262c38]">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-600 dark:text-gray-400 transition cursor-pointer"
                  title="Previous month"
                >
                  <IconChevronLeft size={15} />
                </button>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 font-mono">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
                <div className="w-5 sm:hidden">
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-600 dark:text-gray-400 transition cursor-pointer"
                  >
                    <IconChevronRight size={15} />
                  </button>
                </div>
                <div className="w-5 hidden sm:block" />
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_NAMES.map((d) => (
                  <span key={d} className="text-[10px] font-semibold text-gray-400 dark:text-[#6e7787]">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {firstMonthDays.map((d, index) => {
                  const isSelected = isDateSelected(d.dateStr)
                  const inRange = isDateInRange(d.dateStr)
                  const isStart = isRangeStart(d.dateStr)
                  const isEnd = isRangeEnd(d.dateStr)

                  return (
                    <div
                      key={`m1-${d.dateStr}-${index}`}
                      className={cn(
                        'relative flex items-center justify-center h-7',
                        inRange && 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
                        isStart && (tempRange.end || hoveredDate) && 'rounded-l-md bg-blue-50 dark:bg-blue-950/40',
                        isEnd && (tempRange.start || hoveredDate) && 'rounded-r-md bg-blue-50 dark:bg-blue-950/40'
                      )}
                      onMouseEnter={() => !tempRange.end && tempRange.start && setHoveredDate(d.dateStr)}
                    >
                      <button
                        type="button"
                        disabled={d.isDisabled}
                        onClick={() => handleSelectDay(d.dateStr, d.isDisabled)}
                        className={cn(
                          'h-7 w-7 text-xs rounded-md flex items-center justify-center font-medium transition cursor-pointer font-mono select-none',
                          !d.isCurrentMonth && 'text-gray-300 dark:text-gray-600 opacity-60',
                          d.isCurrentMonth && !isSelected && !inRange && 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252b36]',
                          d.isToday && !isSelected && 'border border-blue-500 font-bold text-blue-600 dark:text-blue-400',
                          isSelected && 'bg-blue-600 text-white font-bold shadow-xs z-10 hover:bg-blue-700',
                          d.isDisabled && 'opacity-20 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        {d.dayNumber}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Second Month Calendar (Hidden on very small screens, visible on sm+) */}
            <div className="w-[240px] hidden sm:block">
              <div className="flex items-center justify-between gap-1 mb-2 pb-2 border-b border-gray-100 dark:border-[#262c38]">
                <div className="w-5" />
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 font-mono">
                  {MONTH_NAMES[nextMonthIdx]} {nextMonthYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-600 dark:text-gray-400 transition cursor-pointer"
                  title="Next month"
                >
                  <IconChevronRight size={15} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_NAMES.map((d) => (
                  <span key={d} className="text-[10px] font-semibold text-gray-400 dark:text-[#6e7787]">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {secondMonthDays.map((d, index) => {
                  const isSelected = isDateSelected(d.dateStr)
                  const inRange = isDateInRange(d.dateStr)
                  const isStart = isRangeStart(d.dateStr)
                  const isEnd = isRangeEnd(d.dateStr)

                  return (
                    <div
                      key={`m2-${d.dateStr}-${index}`}
                      className={cn(
                        'relative flex items-center justify-center h-7',
                        inRange && 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
                        isStart && (tempRange.end || hoveredDate) && 'rounded-l-md bg-blue-50 dark:bg-blue-950/40',
                        isEnd && (tempRange.start || hoveredDate) && 'rounded-r-md bg-blue-50 dark:bg-blue-950/40'
                      )}
                      onMouseEnter={() => !tempRange.end && tempRange.start && setHoveredDate(d.dateStr)}
                    >
                      <button
                        type="button"
                        disabled={d.isDisabled}
                        onClick={() => handleSelectDay(d.dateStr, d.isDisabled)}
                        className={cn(
                          'h-7 w-7 text-xs rounded-md flex items-center justify-center font-medium transition cursor-pointer font-mono select-none',
                          !d.isCurrentMonth && 'text-gray-300 dark:text-gray-600 opacity-60',
                          d.isCurrentMonth && !isSelected && !inRange && 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252b36]',
                          d.isToday && !isSelected && 'border border-blue-500 font-bold text-blue-600 dark:text-blue-400',
                          isSelected && 'bg-blue-600 text-white font-bold shadow-xs z-10 hover:bg-blue-700',
                          d.isDisabled && 'opacity-20 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        {d.dayNumber}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-[#262c38]">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {tempRange.start ? (
                <span>
                  {formatDisplayDate(tempRange.start, format)} {tempRange.end ? `– ${formatDisplayDate(tempRange.end, format)}` : '– ...'}
                </span>
              ) : (
                <span>No dates selected</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1 text-xs rounded-md border border-gray-200 dark:border-[#2c323e] hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-700 dark:text-gray-300 transition cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!tempRange.start}
                className="px-3.5 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
