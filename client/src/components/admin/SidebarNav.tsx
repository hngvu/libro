import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  IconLayoutDashboard,
  IconBooks,
  IconRefresh,
  IconVip,
  IconReceiptDollar,
  IconUsers,
  IconReportAnalytics,
  IconSettings,
} from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarNavGroup } from './SidebarNavGroup'

const getGroupByPath = (pathname: string): string | null => {
  if (
    pathname.startsWith('/admin/books') ||
    pathname.startsWith('/admin/copies') ||
    pathname.startsWith('/admin/authors') ||
    pathname.startsWith('/admin/genres')
  ) {
    return 'books'
  }
  if (
    pathname.startsWith('/admin/circulation') ||
    pathname.startsWith('/admin/overdue') ||
    pathname.startsWith('/admin/renewals') ||
    pathname.startsWith('/admin/reservations')
  ) {
    return 'circulation'
  }
  if (
    pathname.startsWith('/admin/membership') ||
    pathname.startsWith('/admin/subscriptions') ||
    pathname.startsWith('/admin/membership-plans') ||
    pathname.startsWith('/admin/user-subscriptions')
  ) {
    return 'membership'
  }
  if (pathname.startsWith('/admin/fines')) {
    return 'fines'
  }
  if (
    pathname.startsWith('/admin/staff-settings') ||
    pathname.startsWith('/admin/activity-log')
  ) {
    return 'admin'
  }
  return null
}

export function SidebarNav() {
  const { isAdmin } = useAuth()
  const location = useLocation()

  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    getGroupByPath(location.pathname)
  )

  // Sync open group with URL changes
  useEffect(() => {
    setOpenGroup(getGroupByPath(location.pathname))
  }, [location.pathname])

  const handleToggleGroup = (groupKey: string) => {
    setOpenGroup((prev) => (prev === groupKey ? null : groupKey))
  }

  // When a group is currently open, items outside that group should not be highlighted
  const isOutsideDisabled = openGroup !== null
  const currentActiveGroup = getGroupByPath(location.pathname)

  return (
    <nav className="space-y-3">
      {/* 1. Dashboard (Single standalone overview page) */}
      <div className="space-y-1">
        <SidebarNavItem
          to="/admin"
          end={true}
          icon={<IconLayoutDashboard size={17} />}
          label="Dashboard"
          disableActive={isOutsideDisabled}
        />
      </div>

      {/* 2. Books Group (Catalog, Copies, Taxonomy) */}
      <SidebarNavGroup
        title="Books"
        icon={<IconBooks size={17} />}
        isOpen={openGroup === 'books'}
        isActive={currentActiveGroup === 'books'}
        onToggle={() => handleToggleGroup('books')}
      >
        <SidebarNavItem
          to="/admin/books"
          label="Catalog"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
        <SidebarNavItem
          to="/admin/copies"
          label="Copies"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
        <SidebarNavItem
          to="/admin/authors"
          label="Authors"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
        <SidebarNavItem
          to="/admin/genres"
          label="Genres"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
      </SidebarNavGroup>

      {/* 3. Circulation Group (Desk, Overdue, Renewals, Reservations) */}
      <SidebarNavGroup
        title="Circulation"
        icon={<IconRefresh size={17} />}
        isOpen={openGroup === 'circulation'}
        isActive={currentActiveGroup === 'circulation'}
        onToggle={() => handleToggleGroup('circulation')}
      >
        <SidebarNavItem
          to="/admin/circulation"
          label="Desk"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
          isActiveMatch={(p) => p === '/admin/circulation' || p === '/admin/circulation/desk'}
        />
        <SidebarNavItem
          to="/admin/circulation/overdue"
          label="Overdue"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
        />
        <SidebarNavItem
          to="/admin/circulation/renewals"
          label="Renewals"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
        />
        <SidebarNavItem
          to="/admin/circulation/reservations"
          label="Reservations"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
        />
      </SidebarNavGroup>

      {/* 4. Membership Group (Plans & Subscriptions) */}
      <SidebarNavGroup
        title="Membership"
        icon={<IconVip size={17} />}
        isOpen={openGroup === 'membership'}
        isActive={currentActiveGroup === 'membership'}
        onToggle={() => handleToggleGroup('membership')}
      >
        <SidebarNavItem
          to="/admin/membership/plans"
          label="Plans"
          isSubItem={true}
          disableActive={openGroup !== 'membership'}
        />
        <SidebarNavItem
          to="/admin/membership/subscriptions"
          label="Subscriptions"
          isSubItem={true}
          disableActive={openGroup !== 'membership'}
        />
      </SidebarNavGroup>

      {/* 5. Fines Group (Fees & Penalties) */}
      <SidebarNavGroup
        title="Fines"
        icon={<IconReceiptDollar size={17} />}
        isOpen={openGroup === 'fines'}
        isActive={currentActiveGroup === 'fines'}
        onToggle={() => handleToggleGroup('fines')}
      >
        <SidebarNavItem
          to="/admin/fines/fees"
          label="Fees"
          isSubItem={true}
          disableActive={openGroup !== 'fines'}
          isActiveMatch={(p) =>
            p === '/admin/fines/fees' ||
            p === '/admin/fines/dues' ||
            p === '/admin/fines/settings' ||
            p === '/admin/fines/config' ||
            p === '/admin/fines'
          }
        />
        <SidebarNavItem
          to="/admin/fines/penalties"
          label="Penalties"
          isSubItem={true}
          disableActive={openGroup !== 'fines'}
          isActiveMatch={(p) =>
            p.startsWith('/admin/fines/penalties') ||
            /^\/admin\/fines\/\d+/.test(p)
          }
        />
      </SidebarNavGroup>

      {/* 6. Single Domain Pages (Members, Reports) */}
      <div className="space-y-1 pt-1">
        <SidebarNavItem
          to="/admin/members"
          icon={<IconUsers size={17} />}
          label="Members"
          disableActive={isOutsideDisabled}
        />
        <SidebarNavItem
          to="/admin/reports"
          icon={<IconReportAnalytics size={17} />}
          label="Reports"
          disableActive={isOutsideDisabled}
        />
      </div>

      {/* 7. Admin (Role Admin only) */}
      {isAdmin && (
        <div className="pt-1">
          <SidebarNavGroup
            title="Admin"
            icon={<IconSettings size={17} />}
            isOpen={openGroup === 'admin'}
            isActive={currentActiveGroup === 'admin'}
            onToggle={() => handleToggleGroup('admin')}
          >
            <SidebarNavItem
              to="/admin/staff-settings"
              label="Staff"
              isSubItem={true}
              disableActive={openGroup !== 'admin'}
            />
            <SidebarNavItem
              to="/admin/activity-log"
              label="Logs"
              isSubItem={true}
              disableActive={openGroup !== 'admin'}
            />
          </SidebarNavGroup>
        </div>
      )}
    </nav>
  )
}
