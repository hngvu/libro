import React, { useState, useEffect } from 'react'
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (date: string) => void
  placeholder?: string
  minDate?: string // YYYY-MM-DD
  maxDate?: string // YYYY-MM-DD
  disabled?: boolean
  className?: string
  format?: 'dd/MM/yyyy' | 'yyyy-MM-dd'
  allowClear?: boolean
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

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  minDate,
  maxDate,
  disabled = false,
  className = '',
  format = 'dd/MM/yyyy',
  allowClear = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDate(value)
  const today = new Date()
  const todayStr = toDateString(today)

  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date())

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate)
    }
  }, [value])

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleYearChange = (year: number) => {
    setViewDate(new Date(year, currentMonth, 1))
  }

  const handleMonthChange = (month: number) => {
    setViewDate(new Date(currentYear, month, 1))
  }

  // Days matrix calculation (Monday-first)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  // convert 0 (Sun) to 6, 1 (Mon) to 0
  const startOffset = (firstDayOfMonth + 6) % 7
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  const calendarDays: Array<{
    dateStr: string
    dayNumber: number
    isCurrentMonth: boolean
    isDisabled: boolean
    isSelected: boolean
    isToday: boolean
  }> = []

  // Prev month filler
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const d = new Date(currentYear, currentMonth - 1, day)
    const dStr = toDateString(d)
    calendarDays.push({
      dateStr: dStr,
      dayNumber: day,
      isCurrentMonth: false,
      isDisabled: Boolean((minDate && dStr < minDate) || (maxDate && dStr > maxDate)),
      isSelected: Boolean(value && value === dStr),
      isToday: dStr === todayStr,
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentYear, currentMonth, day)
    const dStr = toDateString(d)
    calendarDays.push({
      dateStr: dStr,
      dayNumber: day,
      isCurrentMonth: true,
      isDisabled: Boolean((minDate && dStr < minDate) || (maxDate && dStr > maxDate)),
      isSelected: Boolean(value && value === dStr),
      isToday: dStr === todayStr,
    })
  }

  // Next month filler (pad to complete grid)
  const totalRendered = calendarDays.length
  const nextMonthPadding = (7 - (totalRendered % 7)) % 7
  for (let day = 1; day <= nextMonthPadding; day++) {
    const d = new Date(currentYear, currentMonth + 1, day)
    const dStr = toDateString(d)
    calendarDays.push({
      dateStr: dStr,
      dayNumber: day,
      isCurrentMonth: false,
      isDisabled: Boolean((minDate && dStr < minDate) || (maxDate && dStr > maxDate)),
      isSelected: Boolean(value && value === dStr),
      isToday: dStr === todayStr,
    })
  }

  const handleSelectDay = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled || disabled) return
    onChange?.(dateStr)
    setOpen(false)
  }

  const handleSelectToday = () => {
    if (disabled) return
    onChange?.(todayStr)
    setViewDate(new Date())
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange?.('')
  }

  // Generate Year range
  const years = []
  for (let y = currentYear - 30; y <= currentYear + 30; y++) {
    years.push(y)
  }

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
            <span className={cn('truncate', !value && 'text-gray-400 dark:text-[#6e7787]')}>
              {value ? formatDisplayDate(value, format) : placeholder}
            </span>
          </div>

          {value && allowClear && !disabled ? (
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

      <PopoverContent align="start" className="w-[280px] p-3 shadow-2xl">
        {/* Header navigation */}
        <div className="flex items-center justify-between gap-1 mb-2 pb-2 border-b border-gray-100 dark:border-[#262c38]">
          <div className="flex items-center gap-1.5">
            <select
              value={currentMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="h-7 text-xs font-semibold rounded bg-transparent hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-900 dark:text-gray-200 outline-none cursor-pointer px-1"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx} className="bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-gray-200">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="h-7 text-xs font-semibold rounded bg-transparent hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-900 dark:text-gray-200 outline-none cursor-pointer px-1 font-mono"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-gray-200">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-600 dark:text-gray-400 transition cursor-pointer"
              title="Previous month"
            >
              <IconChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#232833] text-gray-600 dark:text-gray-400 transition cursor-pointer"
              title="Next month"
            >
              <IconChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Day name labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {DAY_NAMES.map((d) => (
            <span key={d} className="text-[10px] font-semibold text-gray-400 dark:text-[#6e7787] py-0.5">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((d, index) => (
            <button
              key={`${d.dateStr}-${index}`}
              type="button"
              disabled={d.isDisabled}
              onClick={() => handleSelectDay(d.dateStr, d.isDisabled)}
              className={cn(
                'h-7 w-7 text-xs rounded-md flex items-center justify-center font-medium transition cursor-pointer font-mono select-none',
                !d.isCurrentMonth && 'text-gray-300 dark:text-gray-600 opacity-60',
                d.isCurrentMonth && !d.isSelected && 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252b36]',
                d.isToday && !d.isSelected && 'border border-blue-500 font-bold text-blue-600 dark:text-blue-400',
                d.isSelected && 'bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700',
                d.isDisabled && 'opacity-20 cursor-not-allowed pointer-events-none hover:bg-transparent'
              )}
            >
              {d.dayNumber}
            </button>
          ))}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100 dark:border-[#262c38] text-xs">
          <button
            type="button"
            onClick={handleSelectToday}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange?.('')
                setOpen(false)
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
