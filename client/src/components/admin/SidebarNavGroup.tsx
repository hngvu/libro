import React, { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

interface SidebarNavGroupProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isOpen?: boolean
  isActive?: boolean
  onToggle?: () => void
  defaultOpen?: boolean
}

export function SidebarNavGroup({
  title,
  icon,
  children,
  isOpen: controlledIsOpen,
  isActive = false,
  onToggle,
  defaultOpen = false,
}: SidebarNavGroupProps) {
  const { isDark } = useAdmin()
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle()
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }

  const isGroupActive = isActive || isOpen

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] transition-colors duration-150 cursor-pointer group outline-none select-none border border-transparent ${
          isOpen
            ? isDark
              ? 'text-white font-semibold'
              : 'text-[#212b36] font-semibold'
            : isDark
            ? 'text-[#8c94a5] font-medium hover:text-white hover:bg-[#1e2228]'
            : 'text-[#4b5563] font-medium hover:text-[#212b36] hover:bg-[#dfe2e6]/70'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`transition-colors shrink-0 ${
              isGroupActive
                ? isDark
                  ? 'text-white'
                  : 'text-[#0088ff]'
                : isDark
                ? 'text-[#8c94a5] group-hover:text-white'
                : 'text-[#4b5563] group-hover:text-[#212b36]'
            }`}
          >
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </div>
        <IconChevronDown
          size={15}
          className={`transition-transform duration-200 shrink-0 ${
            isOpen
              ? isDark
                ? 'rotate-180 text-white'
                : 'rotate-180 text-[#212b36]'
              : isDark
              ? 'text-[#8c94a5] group-hover:text-white'
              : 'text-[#4b5563] group-hover:text-[#212b36]'
          }`}
        />
      </button>

      {isOpen && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}
