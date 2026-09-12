
import {
  IconLayoutDashboard,
  IconBooks,
  IconBook2,
  IconStack2,
  IconRefresh,
  IconArrowLeftRight,
  IconClockExclamation,
  IconCalendarEvent,
  IconUsers,
  IconUserStar,
  IconLabel,
  IconReceipt2,
  IconReportAnalytics,
  IconSettings,
  IconUserCog,
  IconHistory,
  IconCreditCard,
  IconCrown,
} from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarNavGroup } from './SidebarNavGroup'

export function SidebarNav() {
  const { isAdmin } = useAuth()

  return (
    <nav className="space-y-3">
      {/* 1. Dashboard (Single standalone overview page) */}
      <div className="space-y-1">
        <SidebarNavItem
          to="/admin"
          end={true}
          icon={<IconLayoutDashboard size={17} />}
          label="Dashboard"
        />
      </div>

      {/* 2. Books Group (Catalog, Copies, Taxonomy) */}
      <SidebarNavGroup
        title="Books"
        icon={<IconBooks size={17} />}
        defaultOpen={true}
      >
        <SidebarNavItem
          to="/admin/books"
          icon={<IconBook2 size={15} />}
          label="Catalog"
          isSubItem={true}
        />
        <SidebarNavItem
          to="/admin/copies"
          icon={<IconStack2 size={15} />}
          label="Copies"
          isSubItem={true}
        />
        <SidebarNavItem
          to="/admin/authors"
          icon={<IconUserStar size={15} />}
          label="Authors"
          isSubItem={true}
        />
        <SidebarNavItem
          to="/admin/genres"
          icon={<IconLabel size={15} />}
          label="Genres"
          isSubItem={true}
        />
      </SidebarNavGroup>

      {/* 3. Circulation Group (Checkout, Overdue, Reservations) */}
      <SidebarNavGroup
        title="Circulation"
        icon={<IconRefresh size={17} />}
        defaultOpen={true}
      >
        <SidebarNavItem
          to="/admin/circulation"
          icon={<IconArrowLeftRight size={15} />}
          label="Desk"
          isSubItem={true}
        />
        <SidebarNavItem
          to="/admin/overdue"
          icon={<IconClockExclamation size={15} />}
          label="Overdue"
          isSubItem={true}
        />
        <SidebarNavItem
          to="/admin/reservations"
          icon={<IconCalendarEvent size={15} />}
          label="Reservations"
          isSubItem={true}
        />
      </SidebarNavGroup>

      {/* 4. Subscriptions Group (Plans & Member Subscriptions) */}
      <SidebarNavGroup
        title="Subscriptions"
        icon={<IconCreditCard size={17} />}
        defaultOpen={true}
      >
        <SidebarNavItem
          to="/admin/subscriptions/plans"
          icon={<IconCrown size={15} />}
          label="Membership Plans"
          isSubItem={true}
        />
        <SidebarNavItem
          to="/admin/subscriptions/history"
          icon={<IconHistory size={15} />}
          label="User Subscriptions"
          isSubItem={true}
        />
      </SidebarNavGroup>

      {/* 5. Single Domain Pages (Members, Fines, Reports) */}
      <div className="space-y-1 pt-1">
        <SidebarNavItem
          to="/admin/members"
          icon={<IconUsers size={17} />}
          label="Members"
        />
        <SidebarNavItem
          to="/admin/fines"
          icon={<IconReceipt2 size={17} />}
          label="Fines"
        />
        <SidebarNavItem
          to="/admin/reports"
          icon={<IconReportAnalytics size={17} />}
          label="Reports"
        />
      </div>

      {/* 5. Administration (Role Admin only) */}
      {isAdmin && (
        <div className="pt-1">
          <SidebarNavGroup
            title="Administration"
            icon={<IconSettings size={17} />}
            defaultOpen={true}
          >
            <SidebarNavItem
              to="/admin/staff-settings"
              icon={<IconUserCog size={15} />}
              label="Staff & Roles"
              isSubItem={true}
            />
            <SidebarNavItem
              to="/admin/activity-log"
              icon={<IconHistory size={15} />}
              label="Activity Log"
              isSubItem={true}
            />
          </SidebarNavGroup>
        </div>
      )}
    </nav>
  )
}
