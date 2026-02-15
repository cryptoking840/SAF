import { NavLink } from "react-router-dom";

export default function RegistryLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">

        {/* Logo / Header */}
        <div className="p-6 border-b">
          <h2 className="font-bold text-lg">SAFc Registry</h2>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Authority Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">

          <SidebarItem
            to="/registry"
            label="Dashboard"
            icon="dashboard"
          />

          <SidebarItem
            to="/registry/batch-approvals"
            label="Batch Approvals"
            icon="verified"
          />

          <SidebarItem
            to="/registry/trade-approvals"
            label="Trade Approvals"
            icon="swap_horiz"
          />

          <SidebarItem
            to="/registry/retirements"
            label="Retirement Approvals"
            icon="local_fire_department"
          />

          <SidebarItem
            to="/registry/participants"
            label="Participant Approvals"
            icon="group"
          />

          <SidebarItem
            to="/registry/audit-log"
            label="Audit Log"
            icon="history_edu"
          />

        </nav>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>

    </div>
  );
}

/* Sidebar Item Component */
function SidebarItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all
        ${
          isActive
            ? "bg-primary/20 text-primary border-l-4 border-primary"
            : "text-gray-600 hover:bg-primary/10 hover:text-primary"
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px]">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}
