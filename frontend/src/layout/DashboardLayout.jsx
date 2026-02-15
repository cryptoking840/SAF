import { Link } from "react-router-dom";

export default function DashboardLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className="w-64 bg-white p-6 shadow-md">

        <h1 className="text-xl font-bold mb-8">
          EcoFuel Systems
        </h1>

        <ul className="space-y-4 text-gray-700">
          <li>
            <Link to="/dashboard" className="hover:text-green-600">
              Dashboard
            </Link>
          </li>

          <li>
            <Link to="/register" className="hover:text-green-600">
              Batch Registration
            </Link>
          </li>

          <li>
            <Link to="/inventory" className="hover:text-green-600">
              Inventory
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">

        {title && (
          <h2 className="text-2xl font-bold mb-6">
            {title}
          </h2>
        )}

        {children}

      </div>
    </div>
  );
}
