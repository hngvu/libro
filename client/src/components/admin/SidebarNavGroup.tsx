import React, { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

interface SidebarNavGroupProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SidebarNavGroup({
  title,
  icon,
  children,
  defaultOpen = true,
}: SidebarNavGroupProps) {
  const { isDark } = useAdmin()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer ${
          isDark
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
          className={`transition-transform duration-200 text-[#8c94a5] ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && <div className="space-y-1 pl-1">{children}</div>}
    </div>
  )
}
