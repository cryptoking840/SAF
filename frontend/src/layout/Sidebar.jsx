import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-md p-6">
      <h1 className="text-xl font-bold mb-8">EcoFuel Systems</h1>

      <nav className="space-y-4">
        <Link to="/" className="block hover:text-green-600 font-semibold">
          Dashboard
        </Link>

        <Link to="/register" className="block hover:text-green-600 font-semibold">
          Register SAF
        </Link>

        <Link to="/inventory" className="block hover:text-green-600 font-semibold">
          Inventory
        </Link>
      </nav>
    </div>
  );
}
