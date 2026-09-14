import React, { useState, useRef, useEffect } from 'react'
import {
  IconChevronDown,
  IconCirclePlus,
  IconX,
  IconLoader2,
  IconBook2,
} from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

export interface OptionItem {
  id: number
  label: string
  sublabel?: string
  image?: string
  keywords?: string[]
}

interface AdminComboboxProps {
  label?: string
  placeholder?: string
  options: OptionItem[]
  selectedIds: number[]
  multiple?: boolean
  loading?: boolean
  chipsPlacement?: 'inside' | 'below'
  displayMode?: 'chips' | 'comma'
  showChevron?: boolean
  onChange: (selectedIds: number[]) => void
  onCreateOption?: (name: string) => Promise<OptionItem | null>
  createPrefix?: string
  createPlaceholder?: string
  className?: string
}

export function AdminCombobox({
  label,
  placeholder = 'Select or type...',
  options,
  selectedIds,
  multiple = false,
  loading = false,
  chipsPlacement = 'inside',
  displayMode = 'chips',
  showChevron = true,
  onChange,
  onCreateOption,
  createPrefix,
  createPlaceholder,
  className = '',
}: AdminComboboxProps) {
  const finalPrefix = createPrefix || createPlaceholder || 'Add'
  const { t, isDark } = useAdmin()
  const isCommaMode = displayMode === 'comma'
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id))
  const commaText = selectedOptions.map((opt) => opt.label).join(', ')

  const [query, setQuery] = useState(() => {
    if (isCommaMode) {
      return commaText
    }
    if (!multiple) {
      return selectedOptions[0]?.label || ''
    }
    return ''
  })

  // For single select or comma mode, sync display value when closed or on external change
  useEffect(() => {
    if (isCommaMode) {
      if (!open) {
        setQuery(commaText)
      }
    } else if (!multiple) {
      if (!open) {
        setQuery(selectedOptions[0]?.label || '')
      }
    }
  }, [selectedIds, options, open, multiple, isCommaMode, commaText])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (isCommaMode) {
          // Format cleanly on blur if there are valid selections
          if (commaText) {
            setQuery(commaText)
          }
        } else if (!multiple) {
          setQuery(selectedOptions[0]?.label || '')
        } else {
          setQuery('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [multiple, selectedOptions, isCommaMode, commaText])

  const createTarget = (isCommaMode ? (query.split(',').pop() || '') : query).trim()

  const isSelectedQuery =
    !multiple &&
    selectedOptions.length > 0 &&
    query.trim().toLowerCase() === (selectedOptions[0]?.label || '').trim().toLowerCase()

  const filteredOptions = isCommaMode
    ? createTarget
      ? options.filter((opt) => opt.label.toLowerCase().includes(createTarget.toLowerCase()))
      : options
    : isSelectedQuery || !query.trim()
    ? options
    : options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query.trim().toLowerCase()) ||
          Boolean(opt.sublabel && opt.sublabel.toLowerCase().includes(query.trim().toLowerCase())) ||
          Boolean(opt.keywords && opt.keywords.some((k) => k.toLowerCase().includes(query.trim().toLowerCase())))
      )

  const exactMatchExists = Boolean(
    createTarget &&
      options.some((opt) => opt.label.trim().toLowerCase() === createTarget.toLowerCase())
  )

  const handleSelectOption = (opt: OptionItem) => {
    if (isCommaMode) {
      const parts = query.split(',').map((p) => p.trim()).filter(Boolean)
      const alreadyHas = parts.some((p) => p.toLowerCase() === opt.label.toLowerCase())

      let newParts: string[]
      if (alreadyHas) {
        newParts = parts.filter((p) => p.toLowerCase() !== opt.label.toLowerCase())
      } else {
        if (parts.length > 0 && createTarget && parts[parts.length - 1].toLowerCase().includes(createTarget.toLowerCase())) {
          newParts = [...parts.slice(0, -1), opt.label]
        } else {
          newParts = [...parts, opt.label]
        }
      }

      const newQuery = newParts.join(', ')
      setQuery(newQuery)

      const newIds = options
        .filter((o) => newParts.some((np) => np.toLowerCase() === o.label.toLowerCase()))
        .map((o) => o.id)
      onChange(newIds)
      inputRef.current?.focus()
      return
    }

    if (multiple) {
      if (selectedIds.includes(opt.id)) {
        onChange(selectedIds.filter((id) => id !== opt.id))
      } else {
        onChange([...selectedIds, opt.id])
      }
      setQuery('')
      inputRef.current?.focus()
    } else {
      onChange([opt.id])
      setQuery(opt.label)
      setOpen(false)
    }
  }

  const handleRemoveChip = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    onChange(selectedIds.filter((item) => item !== id))
    inputRef.current?.focus()
  }

  const handleCreate = async () => {
    const targetToCreate = createTarget
    if (!targetToCreate || !onCreateOption || creating) return
    setCreating(true)
    try {
      const newItem = await onCreateOption(targetToCreate)
      if (newItem) {
        if (isCommaMode) {
          const parts = query.split(',').map((p) => p.trim()).filter(Boolean)
          const withoutActive = parts.filter((p) => p.toLowerCase() !== createTarget.toLowerCase())
          const newParts = [...withoutActive, newItem.label]
          const newQuery = newParts.join(', ')
          setQuery(newQuery)
          onChange([...selectedIds, newItem.id])
        } else if (multiple) {
          onChange([...selectedIds, newItem.id])
          setQuery('')
        } else {
          onChange([newItem.id])
          setQuery(newItem.label)
          setOpen(false)
        }
      }
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }

      const currentSearch = createTarget
      if (currentSearch && !exactMatchExists && onCreateOption) {
        handleCreate()
      } else {
        const firstAvailable = filteredOptions.find((opt) => !selectedIds.includes(opt.id))
        if (firstAvailable) {
          handleSelectOption(firstAvailable)
        }
      }
      return
    }

    if (e.key === 'Backspace' && multiple && chipsPlacement === 'inside' && !query && selectedIds.length > 0) {
      onChange(selectedIds.slice(0, -1))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (!open) setOpen(true)

    if (isCommaMode) {
      const parts = val.split(',').map((p) => p.trim()).filter(Boolean)
      const matchedIds = options
        .filter((o) => parts.some((p) => p.toLowerCase() === o.label.toLowerCase()))
        .map((o) => o.id)
      onChange(matchedIds)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
    setQuery('')
    inputRef.current?.focus()
    setOpen(true)
  }

  const isChipsBelow = multiple && chipsPlacement === 'below'

  return (
    <div className={`${className}`} ref={containerRef}>
      {label && (
        <label className={`block text-xs font-medium mb-1 ${t.subTextColor}`}>
          {label}
        </label>
      )}

      {/* Relative container for Trigger Input & Popover */}
      <div className="relative">
        {/* Main Input Box (Dropdown Trigger) */}
        <div
          onClick={() => {
            setOpen(true)
            inputRef.current?.focus()
            if (!multiple) {
              inputRef.current?.select()
            }
          }}
          className={`min-h-[34px] xl:min-h-[38px] w-full px-2.5 xl:px-3 py-1 xl:py-1.5 rounded-md border flex items-center justify-between gap-1.5 cursor-text text-xs xl:text-sm transition ${
            open
              ? isDark
                ? 'border-[#066fd1] ring-1 ring-[#066fd1]'
                : 'border-[#066fd1] ring-1 ring-[#066fd1]'
              : ''
          } ${t.inputBg}`}
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {/* Multiple Selected Chips (Inside Mode) */}
            {multiple &&
              !isChipsBelow &&
              !isCommaMode &&
              selectedOptions.map((item) => (
                <span
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 xl:py-1 rounded text-[11px] xl:text-xs font-medium leading-none select-none ${
                    isDark
                      ? 'bg-[#252a34] text-[#cbd2de] border border-[#333a48]'
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                  }`}
                >
                  <span>{item.label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChip(e, item.id)}
                    className="hover:text-rose-500 p-0.5 rounded focus:outline-none cursor-pointer"
                  >
                    <IconX size={11} />
                  </button>
                </span>
              ))}

            {/* Inline Typing Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                setOpen(true)
                if (!multiple) {
                  inputRef.current?.select()
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                multiple && !isChipsBelow && !isCommaMode && selectedOptions.length > 0
                  ? ''
                  : placeholder
              }
              className="flex-1 min-w-[60px] bg-transparent border-none outline-none text-xs xl:text-sm p-0 focus:ring-0 text-gray-900 dark:text-[#e2e8f0] font-normal placeholder:text-gray-400 dark:placeholder:text-[#5d6575]"
            />
          </div>

          {/* Right Actions: Clear & Chevron */}
          <div className="flex items-center gap-1 shrink-0">
            {creating && <IconLoader2 size={13} className="animate-spin text-[#066fd1]" />}
            {(!multiple || isCommaMode) && selectedOptions.length > 0 && !creating && (
              <button
                type="button"
                onClick={handleClear}
                className={`p-0.5 hover:text-rose-500 rounded transition cursor-pointer ${t.mutedColor}`}
                title="Clear selection"
              >
                <IconX size={12} />
              </button>
            )}
            {showChevron && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(!open)
                  if (!open) {
                    inputRef.current?.focus()
                    if (!multiple) inputRef.current?.select()
                  }
                }}
                className={`p-0.5 transition-transform cursor-pointer ${t.mutedColor} ${
                  open ? 'rotate-180' : ''
                }`}
              >
                <IconChevronDown size={14} className="opacity-70" />
              </button>
            )}
          </div>
        </div>

        {/* Popover Dropdown */}
        {open && (
          <div
            className={`absolute left-0 right-0 top-full mt-1 z-[100] rounded-md border shadow-2xl max-h-48 overflow-y-auto ${
              isDark ? 'bg-[#181b22] border-[#2c323e]' : 'bg-white border-gray-300'
            }`}
          >
            {/* Top Action: Add "createTarget" */}
            {createTarget && !exactMatchExists && onCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className={`w-full px-3 py-2 text-xs font-medium flex items-center gap-2 border-b transition text-left cursor-pointer ${
                  isDark
                    ? 'border-[#262a34] bg-[#1a202c]/60 hover:bg-[#202736] text-blue-400'
                    : 'border-gray-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-600'
                }`}
              >
                {creating ? (
                  <IconLoader2 size={15} className="animate-spin shrink-0" />
                ) : (
                  <IconCirclePlus size={15} className="shrink-0" />
                )}
                <span className="truncate">
                  {finalPrefix} <strong className="font-semibold">"{createTarget}"</strong>
                </span>
              </button>
            )}

            {/* Options List */}
            <div className="py-1">
              {loading ? (
                <div className={`p-3 text-center text-xs ${t.mutedColor} flex items-center justify-center gap-1.5`}>
                  <IconLoader2 size={13} className="animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : filteredOptions.length === 0 ? (
                !query.trim() || !onCreateOption ? (
                  <div className={`p-3 text-center text-xs ${t.mutedColor}`}>No options found</div>
                ) : null
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedIds.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => !isSelected && handleSelectOption(opt)}
                      className={`w-full px-3 py-2 text-xs flex items-center gap-3 transition text-left ${
                        isSelected
                          ? 'opacity-40 cursor-not-allowed bg-transparent text-gray-400 dark:text-[#5d6575]'
                          : isDark
                          ? 'hover:bg-[#1f232b] text-[#cbd2de] cursor-pointer'
                          : 'hover:bg-gray-100 text-gray-800 cursor-pointer'
                      }`}
                    >
                      {opt.image !== undefined && (
                        <div className="w-7 h-10 rounded-[2px] overflow-hidden shrink-0 border border-gray-200 dark:border-[#333a48] bg-gray-100 dark:bg-[#16181d] flex items-center justify-center">
                          {opt.image ? (
                            <img
                              src={opt.image}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <IconBook2 size={15} className="opacity-40" />
                          )}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="truncate font-medium">{opt.label}</span>
                        {opt.sublabel && (
                          <span className={`text-[11px] ${t.mutedColor} truncate mt-0.5`}>{opt.sublabel}</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Chips Below Input */}
      {isChipsBelow && !isCommaMode && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedOptions.map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium select-none transition-colors ${
                isDark
                  ? 'bg-[#252a34] text-[#cbd2de] border border-[#333a48]'
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
            >
              <span>{item.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveChip(e, item.id)}
                className="hover:text-rose-500 p-0.5 rounded focus:outline-none cursor-pointer opacity-70 hover:opacity-100"
                title="Remove tag"
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
