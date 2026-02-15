import RegistryLayout from "../../layout/RegistryLayout";

export default function RegistryDashboard() {
  return (
    <RegistryLayout>

      {/* PAGE TITLE */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Registry Overview</h2>
        <p className="text-sm text-gray-500">
          Governance and approval control center
        </p>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <KpiCard
          icon="verified"
          title="Total Certified SAF (MT)"
          value="1,240,500"
          trend="+12%"
          color="green"
        />
        <KpiCard
          icon="pending_actions"
          title="Pending Batches"
          value="14"
          badge="Urgent"
          color="amber"
        />
        <KpiCard
          icon="sync_alt"
          title="Pending Transactions"
          value="142"
          color="blue"
        />
        <KpiCard
          icon="do_not_disturb_on"
          title="Pending Retirements"
          value="28"
          color="red"
        />
        <KpiCard
          icon="groups"
          title="Active Participants"
          value="850"
          subtitle="42 New"
          color="purple"
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* RECENT DECISIONS */}
        <div className="lg:col-span-8 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold">Recent Decisions</h3>
            <button className="text-primary text-xs font-bold hover:underline">
              View Ledger
            </button>
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
              <DecisionRow
                action="Batch Approval"
                entity="Neste Oyj - B9022"
                by="Alex Rivera"
                status="APPROVED"
                time="2 mins ago"
                type="approved"
              />
              <DecisionRow
                action="Participant Registry"
                entity="Delta Air Lines"
                by="System"
                status="ONBOARDED"
                time="45 mins ago"
                type="info"
              />
              <DecisionRow
                action="Retirement Request"
                entity="United Airlines - TX98"
                by="Alex Rivera"
                status="FINALIZED"
                time="2 hours ago"
                type="approved"
              />
              <DecisionRow
                action="Batch Rejection"
                entity="Shell Aviation - B881"
                by="Alex Rivera"
                status="REJECTED"
                time="3 hours ago"
                type="rejected"
              />
            </tbody>
          </table>
        </div>

        {/* PARTICIPANT DISTRIBUTION */}
        <div className="lg:col-span-4 bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-bold mb-6">Participant Distribution</h3>

          <ProgressBar label="Suppliers" value="420" width="49%" color="bg-primary" />
          <ProgressBar label="Airlines" value="280" width="33%" color="bg-blue-500" />
          <ProgressBar label="Inspectors / Auditors" value="150" width="18%" color="bg-purple-500" />
        </div>

      </div>

    </RegistryLayout>
  );
}

/* ================= COMPONENTS ================= */

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
        {trend && (
          <span className="text-xs font-bold text-green-600">
            {trend}
          </span>
        )}
        {badge && (
          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>

      <p className="text-xs uppercase text-gray-500 font-medium">
        {title}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function DecisionRow({ action, entity, by, status, time, type }) {
  const statusStyle =
    type === "approved"
      ? "bg-green-100 text-green-700"
      : type === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 font-medium">{action}</td>
      <td className="px-6 py-4 text-gray-500">{entity}</td>
      <td className="px-6 py-4">{by}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded-full font-bold ${statusStyle}`}>
          {status}
        </span>
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
