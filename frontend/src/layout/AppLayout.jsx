import { NavLink } from "react-router-dom";

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#cfe7db]">

        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <h2 className="text-lg font-bold">SAFc Registry</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col gap-2">

          <SidebarItem
            to="/dashboard"
            label="Dashboard"
            icon="grid_view"
          />

          {/* ✅ Updated Here */}
          <SidebarItem
            to="/batches"
            label="Batch Management"
            icon="assignment"
          />

          <SidebarItem
            to="/certificates"
            label="Certificates"
            icon="verified_user"
          />

          <SidebarItem
            to="/marketplace/incoming-bids"
            label="Incoming Bids"
            icon="fact_check"
          />

          <div className="mt-auto">
            <SidebarItem
              to="/settings"
              label="Settings"
              icon="settings"
            />
          </div>

        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 overflow-y-auto bg-[#f6f8f7]">

        {/* HEADER */}
        <header className="flex justify-between items-center border-b bg-white px-6 py-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            SAF Batch Management
          </h3>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex rounded-lg h-10 px-4 bg-primary/10 font-bold">
              EcoJet Fuels Inc.
            </button>
          </div>
        </header>

        <main className="p-6 flex-1">
          {children}
        </main>

      </div>
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
            ? "bg-primary text-background-dark shadow-md"
            : "text-gray-600 hover:bg-primary/10 hover:text-primary"
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
