import { NavLink, useNavigate } from "react-router-dom";

export default function InspectorLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("saf_auth");
    navigate("/login", { replace: true });
  };

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
            end
          />

          <SidebarItem
            to="/inspection/queue"
            label="Inspection Queue"
            icon="checklist"
            end
          />

          <SidebarItem
            to="/inspector/analytics"
            label="Analytics"
            icon="analytics"
            end
          />

        </nav>

        <div className="mt-auto p-4 border-t border-primary/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>

    </div>
  );
}

function SidebarItem({ to, label, icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all
        ${
          isActive
            ? "bg-primary/20 border-l-4 border-primary text-primary"
            : "text-gray-600 hover:bg-primary/10 hover:text-primary"
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
