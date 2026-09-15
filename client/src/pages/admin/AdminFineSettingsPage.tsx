import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'

interface UnitNumberInputProps {
  label: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  unitSingular: string
  unitPlural: string
  inputBg: string
  subTextColor: string
}

function UnitNumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  unitSingular,
  unitPlural,
  inputBg,
  subTextColor,
}: UnitNumberInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [rawText, setRawText] = useState(value.toString())

  useEffect(() => {
    if (!isFocused) {
      setRawText(value.toString())
    }
  }, [value, isFocused])

  const displayUnit = value === 1 ? unitSingular : unitPlural

  return (
    <div className="space-y-1 w-full">
      <label className={`block text-xs font-medium ${subTextColor}`}>
        {label}
      </label>
      <input
        type={isFocused ? 'number' : 'text'}
        min={min}
        max={max}
        value={isFocused ? rawText : `${value} ${displayUnit}`}
        onFocus={() => {
          setIsFocused(true)
          setRawText(value.toString())
        }}
        onBlur={() => {
          setIsFocused(false)
          const num = parseInt(rawText, 10)
          if (!isNaN(num)) {
            const clamped = Math.max(min, Math.min(max, num))
            onChange(clamped)
            setRawText(clamped.toString())
          } else {
            onChange(min)
            setRawText(min.toString())
          }
        }}
        onChange={(e) => {
          setRawText(e.target.value)
          const num = parseInt(e.target.value, 10)
          if (!isNaN(num)) {
            onChange(num)
          }
        }}
        className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${inputBg}`}
      />
    </div>
  )
}

interface UnitPriceInputProps {
  label: string
  value: number | string
  unitSuffix: string
  onChange: (val: number | string) => void
  inputBg: string
  subTextColor: string
}

function UnitPriceInput({
  label,
  value,
  unitSuffix,
  onChange,
  inputBg,
  subTextColor,
}: UnitPriceInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [rawText, setRawText] = useState(value.toString())

  useEffect(() => {
    if (!isFocused) {
      setRawText(value.toString())
    }
  }, [value, isFocused])

  const formatDisplay = () => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : Number(value) || 0
    const formattedNum = num % 1 === 0 ? num.toString() : num.toFixed(2)
    return `$${formattedNum}${unitSuffix ? ` ${unitSuffix}` : ''}`
  }

  return (
    <div className="space-y-1 w-full">
      <label className={`block text-xs font-medium ${subTextColor}`}>
        {label}
      </label>
      <input
        type={isFocused ? 'number' : 'text'}
        step="0.05"
        min="0"
        value={isFocused ? rawText : formatDisplay()}
        onFocus={() => {
          setIsFocused(true)
          setRawText(value.toString())
        }}
        onBlur={() => {
          setIsFocused(false)
          const num = parseFloat(rawText)
          if (!isNaN(num)) {
            const clamped = Math.max(0, num)
            onChange(clamped)
            setRawText(clamped.toString())
          } else {
            onChange(0)
            setRawText('0')
          }
        }}
        onChange={(e) => {
          setRawText(e.target.value)
          const num = parseFloat(e.target.value)
          if (!isNaN(num)) {
            onChange(num)
          }
        }}
        className={`w-full h-9 px-3 text-xs xl:text-sm font-normal rounded-md border outline-none transition ${inputBg}`}
      />
    </div>
  )
}

export function AdminFineSettingsPage() {
  const { t, showFeedback, setHeaderAction, setHeaderTitle, circulationSettings, setCirculationSettings } = useAdmin()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const initialForm = useMemo(() => ({
    dailyRate: Number(circulationSettings.finePerDayOverdue || 0.5),
    graceDays: 1,
    maxOverdueFine: 25.0,
    lostFee: 20.0,
    damagedFee: 10.0,
  }), [circulationSettings.finePerDayOverdue])

  const [form, setForm] = useState(initialForm)
  const [savedForm, setSavedForm] = useState(initialForm)

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(savedForm)
  }, [form, savedForm])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.adminGetSettings()
      const map: Record<string, string> = {}
      data.forEach((item) => {
        map[item.settingKey] = item.settingValue
      })

      const loaded = {
        dailyRate: Number(map['fine.daily_rate'] ?? '0.5'),
        graceDays: Number(map['fine.grace_period_days'] ?? '1'),
        maxOverdueFine: Number(map['fine.max_overdue_fine'] ?? '25.0'),
        lostFee: Number(map['fine.default_lost_fee'] ?? '20.0'),
        damagedFee: Number(map['fine.default_damaged_fee'] ?? '10.0'),
      }

      setForm(loaded)
      setSavedForm(loaded)

      if (map['fine.daily_rate']) {
        setCirculationSettings((prev) => ({
          ...prev,
          finePerDayOverdue: Number(map['fine.daily_rate']) || prev.finePerDayOverdue,
        }))
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to load fine settings')
    } finally {
      setLoading(false)
    }
  }, [setCirculationSettings, showFeedback])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    setHeaderTitle('Fees')
  }, [setHeaderTitle])

  const handleDiscard = useCallback(() => {
    setForm(savedForm)
  }, [savedForm])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, string> = {
        'fine.daily_rate': String(form.dailyRate),
        'fine.default_lost_fee': String(form.lostFee),
        'fine.default_damaged_fee': String(form.damagedFee),
        'fine.grace_period_days': String(form.graceDays),
        'fine.max_overdue_fine': String(form.maxOverdueFine),
      }

      await api.adminBulkUpdateSettings(payload)

      setSavedForm(form)
      setCirculationSettings((prev) => ({
        ...prev,
        finePerDayOverdue: form.dailyRate,
      }))

      showFeedback('success', 'Penalty configuration updated successfully')
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Header Save / Discard (Exact AdminPlanDetailPage style)
  useEffect(() => {
    if (isDirty) {
      setHeaderAction(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={saving}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.secondaryBtn}`}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className={`h-8 min-w-[80px] px-3.5 text-xs font-semibold rounded-md border border-transparent inline-flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60 ${t.primaryBtn}`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )
    } else {
      setHeaderAction(null)
    }
  }, [isDirty, saving, handleDiscard, form, t, setHeaderAction])

  useEffect(() => {
    return () => setHeaderAction(null)
  }, [setHeaderAction])

  if (loading) {
    return (
      <div className={`p-16 text-center text-sm ${t.subTextColor}`}>
        Loading penalty configuration...
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12 max-w-2xl">
      {/* Penalty Fields */}
      <div className="space-y-4 xl:space-y-4.5 w-full min-w-0">
        {/* Row 1: Overdue Rate & Grace Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <UnitPriceInput
            label="Daily Overdue Rate"
            value={form.dailyRate}
            unitSuffix="/ day"
            onChange={(val) => setForm({ ...form, dailyRate: Number(val) })}
            inputBg={t.inputBg}
            subTextColor={t.subTextColor}
          />

          <UnitNumberInput
            label="Grace Period"
            value={form.graceDays}
            onChange={(val) => setForm({ ...form, graceDays: val })}
            min={0}
            max={30}
            unitSingular="day"
            unitPlural="days"
            inputBg={t.inputBg}
            subTextColor={t.subTextColor}
          />
        </div>

        {/* Row 2: Max Overdue Fine Cap */}
        <UnitPriceInput
          label="Maximum Overdue Cap"
          value={form.maxOverdueFine}
          unitSuffix="max"
          onChange={(val) => setForm({ ...form, maxOverdueFine: Number(val) })}
          inputBg={t.inputBg}
          subTextColor={t.subTextColor}
        />

        {/* Row 3: Material Loss & Damage Charges */}
        <div className="space-y-1 pt-3 w-full">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-[#262a34]">
            <label className={`block text-sm font-semibold ${t.titleColor}`}>
              Inventory Replacement & Assessments
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
            <UnitPriceInput
              label="Lost Book Replacement Fee"
              value={form.lostFee}
              unitSuffix=""
              onChange={(val) => setForm({ ...form, lostFee: Number(val) })}
              inputBg={t.inputBg}
              subTextColor={t.subTextColor}
            />

            <UnitPriceInput
              label="Damaged Item Repair Fee"
              value={form.damagedFee}
              unitSuffix=""
              onChange={(val) => setForm({ ...form, damagedFee: Number(val) })}
              inputBg={t.inputBg}
              subTextColor={t.subTextColor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
