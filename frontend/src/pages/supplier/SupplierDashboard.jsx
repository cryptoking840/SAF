import { useState } from "react";
import AppLayout from "../../layout/AppLayout";
import RegisterSAF from "./RegisterSAF";
import Modal from "../../components/Modal";

export default function SupplierDashboard() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <AppLayout>

      {/* HEADER + ACTION */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Supplier Dashboard</h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-primary hover:bg-primary/90 text-background-dark px-6 py-2 rounded-lg font-bold shadow transition"
        >
          + Register New Batch
        </button>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <KpiCard
          icon="gas_meter"
          title="Total SAF Produced"
          value="12,450"
          suffix="MT"
          trend="+12.5%"
        />

        <KpiCard
          icon="assignment"
          title="Active Registrations"
          value="18"
          suffix="Batches"
          trend="+4 new"
        />

        <KpiCard
          icon="payments"
          title="Total Revenue"
          value="$2.45M"
          trend="+8.2%"
        />

        <KpiCard
          icon="co2"
          title="CO2 Reduction Impact"
          value="38,000"
          suffix="Tons"
          highlight
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Production Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">
            SAF Production vs Market Demand
          </h3>

          <div className="h-[300px] w-full">
            <svg viewBox="0 0 800 300" className="w-full h-full">
              <path
                d="M0 240 Q 100 220, 200 180 T 400 120 T 600 90 T 800 70"
                fill="none"
                stroke="#13ec80"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">
            Batch Status Breakdown
          </h3>

          <StatusRow label="Listed" value={24} color="bg-primary" />
          <StatusRow label="Verified" value={12} color="bg-blue-400" />
          <StatusRow label="Pending" value={4} color="bg-amber-400" />
          <StatusRow label="Draft" value={2} color="bg-gray-300" />
        </div>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b flex justify-between">
          <h3 className="text-lg font-bold">
            Recent Marketplace Activity
          </h3>
          <button className="text-primary text-sm font-bold hover:underline">
            View All
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Activity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Value</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            <ActivityRow
              time="Oct 24, 14:20"
              id="SAF-0042"
              activity="Batch Sold"
              status="COMPLETED"
              value="$142,500"
              color="text-green-500"
            />

            <ActivityRow
              time="Oct 23, 09:15"
              id="SAF-0048"
              activity="New Bid"
              status="ACTIVE"
              value="$118,200"
              color="text-blue-500"
            />
          </tbody>
        </table>
      </div>

      {/* ✅ MODAL FIXED */}
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

function KpiCard({ icon, title, value, suffix, trend, highlight }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex justify-between mb-4">
        <span className="material-symbols-outlined text-primary">
          {icon}
        </span>

        {trend && (
          <span className="text-xs font-bold text-green-600">
            {trend}
          </span>
        )}
      </div>

      <p className="text-gray-500 text-sm">{title}</p>

      <h3
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}{" "}
        {suffix && (
          <span className="text-sm text-gray-400 italic">
            {suffix}
          </span>
        )}
      </h3>
    </div>
  );
}

function StatusRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center text-sm mb-3">
      <span className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${color}`}></span>
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ActivityRow({ time, id, activity, status, value, color }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-500">{time}</td>
      <td className="px-6 py-4 font-bold">{id}</td>
      <td className={`px-6 py-4 text-sm ${color}`}>{activity}</td>
      <td className="px-6 py-4">
        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-bold">
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-bold">{value}</td>
    </tr>
  );
}
