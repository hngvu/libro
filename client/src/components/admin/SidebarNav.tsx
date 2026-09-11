
import {
  IconLayoutDashboard,
  IconBooks,
  IconBook2,
  IconStack2,
  IconTags,
  IconArrowsExchange,
  IconTransferOut,
  IconClockExclamation,
  IconCalendarEvent,
  IconUsers,
  IconReceipt2,
  IconReportAnalytics,
  IconSettings,
  IconUserCog,
  IconHistory,
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
        icon={<IconBooks size={16} />}
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
          to="/admin/taxonomy"
          icon={<IconTags size={15} />}
          label="Taxonomy"
          isSubItem={true}
        />
      </SidebarNavGroup>

      {/* 3. Borrow & Return Group (Checkout & Returns, Overdue, Reservations) */}
      <SidebarNavGroup
        title="Borrow & Return"
        icon={<IconArrowsExchange size={16} />}
        defaultOpen={true}
      >
        <SidebarNavItem
          to="/admin/circulation"
          icon={<IconTransferOut size={15} />}
          label="Checkout & Returns"
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

      {/* 4. Single Domain Pages (Members, Fines, Reports) */}
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
            icon={<IconSettings size={16} />}
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
