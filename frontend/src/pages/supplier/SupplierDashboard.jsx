import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../../layout/AppLayout";
import RegisterSAF from "./RegisterSAF";
import Modal from "../../components/Modal";

const PRICE_PER_MT = 950;

export default function SupplierDashboard() {
  const [openModal, setOpenModal] = useState(false);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBatches = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:5000/api/saf");
      if (!res.ok) {
        throw new Error(`Failed to fetch supplier dashboard data: ${res.status}`);
      }

      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load supplier dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const metrics = useMemo(() => {
    const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
    const activeRegistrations = batches.filter(
      (batch) =>
        batch.status === "SUBMITTED" ||
        batch.status === "INSPECTED" ||
        batch.status === "PENDING_BLOCKCHAIN"
    ).length;
    const approvedCount = batches.filter((batch) => batch.status === "APPROVED").length;
    const listedCount = batches.filter((batch) => batch.status === "LISTED").length;
    const carbonReduction = totalQuantity * 3;

    const statusMap = {
      APPROVED: 0,
      INSPECTED: 0,
      SUBMITTED: 0,
      REJECTED: 0,
      LISTED: 0,
    };

    batches.forEach((batch) => {
      const status = batch.status || "SUBMITTED";
      if (statusMap[status] !== undefined) {
        statusMap[status] += 1;
      }
    });

    const activity = [...batches]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 6)
      .map((batch) => ({
        id: batch.productionBatchId || batch._id,
        time: formatTimestamp(batch.updatedAt || batch.createdAt),
        activity: getActivityLabel(batch.status),
        status: batch.status || "UNKNOWN",
        value: `$${(Number(batch.quantity || 0) * PRICE_PER_MT).toLocaleString()}`,
      }));

    return {
      totalQuantity,
      activeRegistrations,
      totalRevenue: totalQuantity * PRICE_PER_MT,
      carbonReduction,
      approvedCount,
      listedCount,
      statusMap,
      activity,
    };
  }, [batches]);

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

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <KpiCard
          icon="gas_meter"
          title="Total SAF Produced"
          value={isLoading ? "..." : metrics.totalQuantity.toLocaleString()}
          suffix="MT"
          trend={`${metrics.approvedCount} approved · ${metrics.listedCount} listed`}
        />

        <KpiCard
          icon="assignment"
          title="Active Registrations"
          value={isLoading ? "..." : metrics.activeRegistrations}
          suffix="Batches"
          trend={`${batches.length} total`}
        />

        <KpiCard
          icon="payments"
          title="Estimated Revenue"
          value={isLoading ? "..." : `$${(metrics.totalRevenue / 1_000_000).toFixed(2)}M`}
          trend="At $950/MT"
        />

        <KpiCard
          icon="co2"
          title="CO2 Reduction Impact"
          value={isLoading ? "..." : metrics.carbonReduction.toLocaleString()}
          suffix="Tons"
          highlight
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">
            SAF Production vs Market Demand
          </h3>

          <div className="h-[300px] w-full flex items-center justify-center text-gray-500 text-sm">
            {isLoading ? "Loading production trend..." : `Total tracked production: ${metrics.totalQuantity.toLocaleString()} MT`}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">
            Batch Status Breakdown
          </h3>

          <StatusRow label="Approved" value={metrics.statusMap.APPROVED} color="bg-primary" />
          <StatusRow label="Inspected" value={metrics.statusMap.INSPECTED} color="bg-blue-400" />
          <StatusRow label="Submitted" value={metrics.statusMap.SUBMITTED} color="bg-amber-400" />
          <StatusRow label="Rejected" value={metrics.statusMap.REJECTED} color="bg-red-300" />
          <StatusRow label="Listed" value={metrics.statusMap.LISTED} color="bg-primary" />
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
            {metrics.activity.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-sm text-gray-500">
                  {isLoading ? "Loading activity..." : "No activity found."}
                </td>
              </tr>
            ) : (
              metrics.activity.map((row) => (
                <ActivityRow
                  key={row.id}
                  time={row.time}
                  id={row.id}
                  activity={row.activity}
                  status={row.status}
                  value={row.value}
                  color={row.status === "APPROVED" ? "text-green-500" : "text-blue-500"}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      >
        <RegisterSAF
          onSuccess={() => {
            setOpenModal(false);
            fetchBatches();
          }}
        />
      </Modal>

    </AppLayout>
  );
}

function KpiCard({ icon, title, value, suffix, trend, highlight }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex justify-between mb-4">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {trend && <span className="text-xs font-bold text-green-600">{trend}</span>}
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 ${highlight ? "text-primary" : ""}`}>
        {value}{" "}
        {suffix && <span className="text-sm text-gray-400 italic">{suffix}</span>}
      </h3>
    </div>
  );
}

function StatusRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center text-sm mb-3">
      <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${color}`}></span>{label}</span>
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
      <td className="px-6 py-4 text-sm">{status}</td>
      <td className="px-6 py-4 text-right font-semibold">{value}</td>
    </tr>
  );
}

function formatTimestamp(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getActivityLabel(status) {
  if (status === "APPROVED") {
    return "Batch Certified";
  }
  if (status === "LISTED") {
    return "Listed on Marketplace";
  }
  if (status === "INSPECTED") {
    return "Inspection Completed";
  }
  if (status === "REJECTED") {
    return "Batch Rejected";
  }
  return "New Registration";
}
