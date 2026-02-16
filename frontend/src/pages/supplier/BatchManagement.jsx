import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import AppLayout from "../../layout/AppLayout";
import RegisterSAF from "./RegisterSAF";
import Modal from "../../components/Modal";

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/saf/all")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const total = batches.length;
  const verified = batches.filter((b) => b.status === 2).length;
  const pending = batches.filter((b) => b.status === 0).length;
  const draft = batches.filter((b) => b.status === 3).length;

  const chartData = [
    { name: "Verified", value: verified },
    { name: "Pending", value: pending },
    { name: "Draft", value: draft },
  ];

  const COLORS = ["#13ec80", "#f97316", "#9ca3af"];

  const monthlyData = [
    { month: "Jan", batches: 3 },
    { month: "Feb", batches: 6 },
    { month: "Mar", batches: 4 },
    { month: "Apr", batches: 8 },
    { month: "May", batches: 5 },
  ];

  return (
    <AppLayout>

      {/* HERO SECTION */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-xl border shadow-sm mb-8">
        <div>
          <h1 className="text-4xl font-black">
            SAF Batch Management
          </h1>
          <p className="text-gray-600 mt-2 max-w-xl">
            Register and monitor Sustainable Aviation Fuel batches.
            Track compliance, certification progress and ownership.
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 rounded-lg h-14 px-6 bg-primary text-background-dark font-bold shadow-lg hover:scale-[1.02] transition-transform"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Register New Batch
        </button>
      </section>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Total Batches" value={total} />
        <StatCard title="Verified" value={verified} highlight />
        <StatCard title="Pending" value={pending} warning />
        <StatCard title="Draft" value={draft} muted />
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">Batch Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} dataKey="value" outerRadius={100} label>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">Monthly Registrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="batches" fill="#13ec80" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#f6f8f7] text-xs uppercase text-gray-600">
            <tr>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-5xl text-gray-300">
                      inventory_2
                    </span>
                    No batches found
                    <button
                      onClick={() => setOpenModal(true)}
                      className="mt-3 px-4 py-2 bg-primary rounded-lg font-bold"
                    >
                      Register First Batch
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-5 font-bold">
                    SAF-{batch.id}
                  </td>
                  <td className="px-6 py-5">
                    {batch.originalQuantity} MT
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500">
                    {batch.owner?.slice(0, 6)}...
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => navigate(`/batch/${batch.id}`)}
                      className="text-primary font-bold text-sm hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REGISTER SAF MODAL */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      >
        <RegisterSAF onSuccess={() => setOpenModal(false)} />
      </Modal>

    </AppLayout>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ title, value, highlight, warning, muted }) {
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm">
      <div className="text-xs uppercase text-gray-500 font-bold">
        {title}
      </div>
      <div
        className={`text-3xl font-black
          ${highlight ? "text-primary" : ""}
          ${warning ? "text-orange-500" : ""}
          ${muted ? "text-gray-400" : ""}
        `}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    0: { label: "Registered", style: "bg-blue-100 text-blue-800" },
    1: { label: "Inspected", style: "bg-yellow-100 text-yellow-800" },
    2: { label: "Certified", style: "bg-primary/20 text-green-700" },
    3: { label: "Draft", style: "bg-gray-100 text-gray-600" },
  };

  const config = map[status] || {
    label: "Unknown",
    style: "bg-gray-200 text-gray-600",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-bold ${config.style}`}
    >
      {config.label}
    </span>
  );
}
