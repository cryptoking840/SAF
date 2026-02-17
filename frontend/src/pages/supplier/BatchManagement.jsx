import { useEffect, useMemo, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/saf");
        if (!res.ok) {
          throw new Error(`Failed to fetch batches: ${res.status}`);
        }

        const data = await res.json();
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load batches.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const metrics = useMemo(() => {
    const approved = batches.filter((b) => b.status === "APPROVED").length;
    const inspected = batches.filter((b) => b.status === "INSPECTED").length;
    const submitted = batches.filter((b) => b.status === "SUBMITTED").length;
    const rejected = batches.filter((b) => b.status === "REJECTED").length;

    const registrationsByMonth = batches.reduce((acc, batch) => {
      const date = new Date(batch.createdAt || Date.now());
      if (Number.isNaN(date.getTime())) {
        return acc;
      }
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = Object.entries(registrationsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, count]) => {
        const [year, month] = key.split("-");
        return {
          month: new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }),
          batches: count,
        };
      });

    return {
      approved,
      inspected,
      submitted,
      rejected,
      monthlyData,
    };
  }, [batches]);

  const chartData = [
    { name: "Approved", value: metrics.approved },
    { name: "Inspected", value: metrics.inspected },
    { name: "Submitted", value: metrics.submitted },
    { name: "Rejected", value: metrics.rejected },
  ];

  const COLORS = ["#13ec80", "#60a5fa", "#f59e0b", "#f87171"];

  return (
    <AppLayout>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-xl border shadow-sm mb-8">
        <div>
          <h1 className="text-4xl font-black">SAF Batch Management</h1>
          <p className="text-gray-600 mt-2 max-w-xl">
            Register and monitor Sustainable Aviation Fuel batches. Track compliance, certification progress and ownership.
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

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Total Batches" value={isLoading ? "..." : batches.length} />
        <StatCard title="Approved" value={isLoading ? "..." : metrics.approved} highlight />
        <StatCard title="Inspected" value={isLoading ? "..." : metrics.inspected} warning />
        <StatCard title="Submitted" value={isLoading ? "..." : metrics.submitted} muted />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">Batch Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} dataKey="value" outerRadius={100} label>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">Monthly Registrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="batches" fill="#13ec80" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
                  {isLoading ? "Loading batches..." : "No batches found"}
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch._id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-5 font-bold">{batch.productionBatchId || batch._id}</td>
                  <td className="px-6 py-5">{Number(batch.quantity || 0)} MT</td>
                  <td className="px-6 py-5 text-sm text-gray-500">{(batch.supplierWallet || "N/A").slice(0, 10)}...</td>
                  <td className="px-6 py-5"><StatusBadge status={batch.status} /></td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => navigate("/certificates")}
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

      <Modal isOpen={openModal} onClose={() => setOpenModal(false)}>
        <RegisterSAF onSuccess={() => setOpenModal(false)} />
      </Modal>
    </AppLayout>
  );
}

function StatCard({ title, value, highlight, warning, muted }) {
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm">
      <div className="text-xs uppercase text-gray-500 font-bold">{title}</div>
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
    SUBMITTED: { label: "Submitted", style: "bg-blue-100 text-blue-800" },
    INSPECTED: { label: "Inspected", style: "bg-yellow-100 text-yellow-800" },
    APPROVED: { label: "Approved", style: "bg-primary/20 text-green-700" },
    REJECTED: { label: "Rejected", style: "bg-red-100 text-red-700" },
    PENDING_BLOCKCHAIN: { label: "Pending", style: "bg-gray-100 text-gray-600" },
    LISTED: { label: "Listed", style: "bg-primary/20 text-green-700" },
  };

  const config = map[status] || { label: status || "Unknown", style: "bg-gray-200 text-gray-600" };

  return <span className={`px-3 py-1 text-xs rounded-full font-bold ${config.style}`}>{config.label}</span>;
}
