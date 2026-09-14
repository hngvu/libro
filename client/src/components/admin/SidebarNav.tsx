import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  IconLayoutDashboard,
  IconBooks,
  IconBook2,
  IconStack2,
  IconRefresh,
  IconDesk,
  IconClockExclamation,
  IconCalendarEvent,
  IconUsers,
  IconId,
  IconUserStar,
  IconLabel,
  IconReceipt2,
  IconReportAnalytics,
  IconSettings,
  IconUserCog,
  IconHistory,
  IconCreditCard,
  IconVip,
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
        onToggle={() => handleToggleGroup('books')}
      >
        <SidebarNavItem
          to="/admin/books"
          icon={<IconBook2 size={15} />}
          label="Catalog"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
        <SidebarNavItem
          to="/admin/copies"
          icon={<IconStack2 size={15} />}
          label="Copies"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
        <SidebarNavItem
          to="/admin/authors"
          icon={<IconUserStar size={15} />}
          label="Authors"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
        <SidebarNavItem
          to="/admin/genres"
          icon={<IconLabel size={15} />}
          label="Genres"
          isSubItem={true}
          disableActive={openGroup !== 'books'}
        />
      </SidebarNavGroup>

      {/* 3. Circulation Group (Checkout, Overdue, Reservations) */}
      <SidebarNavGroup
        title="Circulation"
        icon={<IconRefresh size={17} />}
        isOpen={openGroup === 'circulation'}
        onToggle={() => handleToggleGroup('circulation')}
      >
        <SidebarNavItem
          to="/admin/circulation"
          icon={<IconDesk size={15} />}
          label="Desk"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
        />
        <SidebarNavItem
          to="/admin/overdue"
          icon={<IconClockExclamation size={15} />}
          label="Overdue"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
        />
        <SidebarNavItem
          to="/admin/reservations"
          icon={<IconCalendarEvent size={15} />}
          label="Reservations"
          isSubItem={true}
          disableActive={openGroup !== 'circulation'}
        />
      </SidebarNavGroup>

      {/* 4. Membership Group (Plans & Subscriptions) */}
      <SidebarNavGroup
        title="Membership"
        icon={<IconId size={17} />}
        isOpen={openGroup === 'membership'}
        onToggle={() => handleToggleGroup('membership')}
      >
        <SidebarNavItem
          to="/admin/membership/plans"
          icon={<IconVip size={15} />}
          label="Plans"
          isSubItem={true}
          disableActive={openGroup !== 'membership'}
        />
        <SidebarNavItem
          to="/admin/membership/subscriptions"
          icon={<IconCreditCard size={15} />}
          label="Subscriptions"
          isSubItem={true}
          disableActive={openGroup !== 'membership'}
        />
      </SidebarNavGroup>

      {/* 5. Single Domain Pages (Members, Fines, Reports) */}
      <div className="space-y-1 pt-1">
        <SidebarNavItem
          to="/admin/members"
          icon={<IconUsers size={17} />}
          label="Members"
          disableActive={isOutsideDisabled}
        />
        <SidebarNavItem
          to="/admin/fines"
          icon={<IconReceipt2 size={17} />}
          label="Fines"
          disableActive={isOutsideDisabled}
        />
        <SidebarNavItem
          to="/admin/reports"
          icon={<IconReportAnalytics size={17} />}
          label="Reports"
          disableActive={isOutsideDisabled}
        />
      </div>

      {/* 6. Admin (Role Admin only) */}
      {isAdmin && (
        <div className="pt-1">
          <SidebarNavGroup
            title="Admin"
            icon={<IconSettings size={17} />}
            isOpen={openGroup === 'admin'}
            onToggle={() => handleToggleGroup('admin')}
          >
            <SidebarNavItem
              to="/admin/staff-settings"
              icon={<IconUserCog size={15} />}
              label="Staff"
              isSubItem={true}
              disableActive={openGroup !== 'admin'}
            />
            <SidebarNavItem
              to="/admin/activity-log"
              icon={<IconHistory size={15} />}
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
