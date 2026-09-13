import React, { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

interface SidebarNavGroupProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: () => void
  defaultOpen?: boolean
}

export function SidebarNavGroup({
  title,
  icon,
  children,
  isOpen: controlledIsOpen,
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

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer ${
          isOpen
            ? isDark
              ? 'text-white'
              : 'text-gray-950 font-medium'
            : isDark
            ? 'text-[#8c94a5] hover:text-white hover:bg-[#1e2228]'
            : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <IconChevronDown
          size={15}
          className={`transition-transform duration-200 text-[#8c94a5] ${isOpen ? 'rotate-180 text-white' : ''}`}
        />
      </button>

      {isOpen && <div className="space-y-1 pl-1">{children}</div>}
    </div>
  )
}
