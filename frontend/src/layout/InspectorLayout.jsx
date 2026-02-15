import { NavLink } from "react-router-dom";

export default function InspectorLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background-light">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-primary/10 flex flex-col fixed h-full">

        {/* Header */}
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-black">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <h1 className="text-sm font-bold">SAFc Portal</h1>
            <p className="text-xs text-primary font-semibold">
              Inspector Dashboard
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-4 mt-6">

          <SidebarItem
            to="/inspector"
            label="Overview"
            icon="dashboard"
          />

          <SidebarItem
            to="/inspection/queue"
            label="Inspection Queue"
            icon="checklist"
          />

          <SidebarItem
            to="/inspector/analytics"
            label="Analytics"
            icon="analytics"
          />

        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>

    </div>
  );
}

function SidebarItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all
        ${
          isActive
            ? "bg-primary/20 border-l-4 border-primary text-black"
            : "text-gray-600 hover:bg-primary/10 hover:text-black"
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
