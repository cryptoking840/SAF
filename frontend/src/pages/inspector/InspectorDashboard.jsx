import InspectorLayout from "../../layout/InspectorLayout";

export default function InspectorDashboard() {
  return (
    <InspectorLayout active="overview">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Inspector Overview
          </h2>
          <p className="text-gray-500 text-sm">
            Welcome back. Here’s your verification summary.
          </p>
        </div>

        <button className="bg-primary hover:bg-primary/80 text-background-dark px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition">
          <span className="material-symbols-outlined text-[20px]">
            add_circle
          </span>
          New Audit
        </button>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Total Verified Batches"
          value="1,284"
          trend="+12.5%"
          icon="verified"
        />
        <KpiCard
          title="Avg. Verification Time"
          value="4.2h"
          trend="-0.8%"
          icon="timer"
          negative
        />
        <KpiCard
          title="Pending Review"
          value="12"
          highlight
          icon="priority_high"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b flex justify-between">
            <h4 className="font-bold">
              Recent Verification Activity
            </h4>
            <button className="text-primary text-xs font-bold hover:underline">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Fuel Type</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                <ActivityRow
                  id="SAF-78291"
                  fuel="Bio-Kerosene"
                  time="Oct 24, 09:45 AM"
                  status="APPROVED"
                  type="approved"
                />
                <ActivityRow
                  id="SAF-78285"
                  fuel="HVO Fuel"
                  time="Oct 23, 04:20 PM"
                  status="PENDING"
                  type="pending"
                />
                <ActivityRow
                  id="SAF-78282"
                  fuel="HEFA Fuel"
                  time="Oct 23, 11:15 AM"
                  status="FLAGGED"
                  type="flagged"
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* WEEKLY GOAL */}
          <div className="bg-background-dark text-white p-6 rounded-xl shadow-lg">
            <h4 className="font-bold mb-1">
              Weekly Verification Goal
            </h4>
            <p className="text-primary text-xs mb-6">
              45 of 60 Batches Verified
            </p>

            <div className="relative flex justify-center items-center mb-6">
              <svg className="size-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#13ec80"
                  strokeWidth="8"
                  strokeDasharray="364.4"
                  strokeDashoffset="91.1"
                />
              </svg>
              <div className="absolute text-2xl font-bold">
                75%
              </div>
            </div>

            <button className="w-full bg-primary text-background-dark font-bold py-2 rounded-lg text-sm hover:opacity-90 transition">
              View Details
            </button>
          </div>

          {/* QUICK INSIGHTS */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h4 className="font-bold mb-4 text-sm">
              Quick Insights
            </h4>

            <Insight
              title="HVO Output Spike"
              desc="30% more batches than last week"
              color="blue"
            />
            <Insight
              title="Delayed Feedstock Data"
              desc="Region: Northern Europe (3 batches)"
              color="orange"
            />
          </div>

        </div>
      </div>

    </InspectorLayout>
  );
}


/* ================= COMPONENTS ================= */

function KpiCard({ title, value, trend, icon, highlight, negative }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm relative">
      <div className="absolute right-4 top-4 opacity-10">
        <span className="material-symbols-outlined text-6xl">
          {icon}
        </span>
      </div>

      <p className="text-gray-500 text-xs font-bold uppercase mb-2">
        {title}
      </p>

      <div className="flex items-end gap-3">
        <h3 className={`text-3xl font-bold ${highlight ? "text-primary" : ""}`}>
          {value}
        </h3>

        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              negative
                ? "text-red-600 bg-red-100"
                : "text-green-600 bg-green-100"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ id, fuel, time, status, type }) {
  const statusStyle =
    type === "approved"
      ? "bg-primary/20 text-primary"
      : type === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 text-sm font-bold">#{id}</td>
      <td className="px-6 py-4 text-sm">{fuel}</td>
      <td className="px-6 py-4 text-xs text-gray-500">{time}</td>
      <td className="px-6 py-4 text-right">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyle}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function Insight({ title, desc, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-500",
    orange: "bg-orange-50 text-orange-500",
  };

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className={`p-1.5 rounded ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-[18px]">
          info
        </span>
      </div>
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] text-gray-500">{desc}</p>
      </div>
    </div>
  );
}
