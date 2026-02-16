import { useEffect, useMemo, useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";

export default function RegistryDashboard() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/saf");
        if (!res.ok) {
          throw new Error(`Failed to fetch registry data: ${res.status}`);
        }

        const data = await res.json();
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load registry overview.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const metrics = useMemo(() => {
    const totalCertified = batches
      .filter((batch) => batch.status === "APPROVED")
      .reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);

    const pendingBatches = batches.filter((batch) => batch.status === "INSPECTED").length;
    const pendingTransactions = batches.filter((batch) => batch.status === "SUBMITTED").length;
    const rejectedCount = batches.filter((batch) => batch.status === "REJECTED").length;

    const participantSet = new Set(batches.map((batch) => batch.supplierWallet).filter(Boolean));

    const decisions = [...batches]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 6)
      .map((batch) => ({
        action: mapAction(batch.status),
        entity: batch.productionBatchId || batch._id,
        by: "Registry System",
        status: batch.status || "UNKNOWN",
        time: formatRelativeTime(batch.updatedAt || batch.createdAt),
      }));

    const totalParticipants = participantSet.size || 1;
    const suppliers = participantSet.size;
    const airlines = Math.round(totalParticipants * 0.3);
    const inspectors = Math.max(1, Math.round(totalParticipants * 0.15));

    return {
      totalCertified,
      pendingBatches,
      pendingTransactions,
      rejectedCount,
      participants: participantSet.size,
      decisions,
      distribution: {
        suppliers,
        airlines,
        inspectors,
        total: suppliers + airlines + inspectors,
      },
    };
  }, [batches]);

  return (
    <RegistryLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Registry Overview</h2>
        <p className="text-sm text-gray-500">Governance and approval control center</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <KpiCard icon="verified" title="Total Certified SAF (MT)" value={isLoading ? "..." : metrics.totalCertified.toLocaleString()} color="green" />
        <KpiCard icon="pending_actions" title="Pending Batches" value={isLoading ? "..." : metrics.pendingBatches} badge={metrics.pendingBatches > 0 ? "Urgent" : "Clear"} color="amber" />
        <KpiCard icon="sync_alt" title="Pending Transactions" value={isLoading ? "..." : metrics.pendingTransactions} color="blue" />
        <KpiCard icon="do_not_disturb_on" title="Rejected Batches" value={isLoading ? "..." : metrics.rejectedCount} color="red" />
        <KpiCard icon="groups" title="Active Participants" value={isLoading ? "..." : metrics.participants} subtitle={`${batches.length} total batches`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold">Recent Decisions</h3>
            <button className="text-primary text-xs font-bold hover:underline">View Ledger</button>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Authorized By</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {metrics.decisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">
                    {isLoading ? "Loading decisions..." : "No decisions found."}
                  </td>
                </tr>
              ) : (
                metrics.decisions.map((item) => (
                  <DecisionRow key={`${item.entity}-${item.time}`} action={item.action} entity={item.entity} by={item.by} status={item.status} time={item.time} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-bold mb-6">Participant Distribution</h3>

          <ProgressBar
            label="Suppliers"
            value={metrics.distribution.suppliers}
            width={`${calcPercent(metrics.distribution.suppliers, metrics.distribution.total)}%`}
            color="bg-primary"
          />
          <ProgressBar
            label="Airlines"
            value={metrics.distribution.airlines}
            width={`${calcPercent(metrics.distribution.airlines, metrics.distribution.total)}%`}
            color="bg-blue-500"
          />
          <ProgressBar
            label="Inspectors / Auditors"
            value={metrics.distribution.inspectors}
            width={`${calcPercent(metrics.distribution.inspectors, metrics.distribution.total)}%`}
            color="bg-purple-500"
          />
        </div>
      </div>
    </RegistryLayout>
  );
}

function KpiCard({ icon, title, value, trend, badge, subtitle, color }) {
  const colorMap = {
    green: "text-green-600 bg-green-100",
    amber: "text-amber-600 bg-amber-100",
    blue: "text-blue-600 bg-blue-100",
    red: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
  };

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <div className="flex justify-between mb-2">
        <span className={`p-2 rounded-lg ${colorMap[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        {trend && <span className="text-xs font-bold text-green-600">{trend}</span>}
        {badge && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{badge}</span>}
      </div>

      <p className="text-xs uppercase text-gray-500 font-medium">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function DecisionRow({ action, entity, by, status, time }) {
  const statusStyle =
    status === "APPROVED"
      ? "bg-green-100 text-green-700"
      : status === "REJECTED"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 font-medium">{action}</td>
      <td className="px-6 py-4 text-gray-500">{entity}</td>
      <td className="px-6 py-4">{by}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded-full font-bold ${statusStyle}`}>{status}</span>
      </td>
      <td className="px-6 py-4 text-xs text-gray-400">{time}</td>
    </tr>
  );
}

function ProgressBar({ label, value, width, color }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs font-medium mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width }} />
      </div>
    </div>
  );
}

function mapAction(status) {
  if (status === "APPROVED") {
    return "Batch Approval";
  }
  if (status === "INSPECTED") {
    return "Inspection Review";
  }
  if (status === "REJECTED") {
    return "Batch Rejection";
  }
  return "Batch Submission";
}

function formatRelativeTime(value) {
  if (!value) {
    return "Unknown";
  }

  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) {
    return "Unknown";
  }

  const minutes = Math.floor((Date.now() - ts) / (1000 * 60));
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

function calcPercent(part, total) {
  if (!total) {
    return 0;
  }
  return Math.round((part / total) * 100);
}
