import { useEffect, useMemo, useState } from "react";
import InspectorLayout from "../../layout/InspectorLayout";

const WEEKLY_GOAL = 60;

export default function InspectorDashboard() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/saf");
        if (!res.ok) {
          throw new Error(`Failed to fetch inspector data: ${res.status}`);
        }

        const data = await res.json();
        if (isMounted) {
          setBatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load inspector overview.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalVerified = batches.filter(
      (batch) => batch.status === "INSPECTED" || batch.status === "APPROVED"
    ).length;

    const pendingReview = batches.filter((batch) => batch.status === "SUBMITTED").length;

    const completedBatches = batches.filter(
      (batch) => batch.status !== "SUBMITTED" && batch.createdAt && batch.updatedAt
    );

    const averageVerificationHours = completedBatches.length
      ? completedBatches.reduce((total, batch) => {
          const createdAt = new Date(batch.createdAt).getTime();
          const updatedAt = new Date(batch.updatedAt).getTime();
          return total + Math.max((updatedAt - createdAt) / 3_600_000, 0);
        }, 0) / completedBatches.length
      : 0;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const verifiedThisWeek = batches.filter(
      (batch) =>
        (batch.status === "INSPECTED" || batch.status === "APPROVED") &&
        new Date(batch.updatedAt || batch.createdAt).getTime() >= oneWeekAgo
    ).length;

    const recentActivity = [...batches]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 6)
      .map((batch) => ({
        id: batch.productionBatchId || batch._id,
        fuel: batch.feedstockType || "Unknown",
        time: formatTimestamp(batch.updatedAt || batch.createdAt),
        status: batch.status || "UNKNOWN",
      }));

    const feedstockCount = batches.reduce((acc, batch) => {
      const key = batch.feedstockType || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topFeedstocks = Object.entries(feedstockCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    return {
      totalVerified,
      pendingReview,
      averageVerificationHours,
      verifiedThisWeek,
      recentActivity,
      topFeedstocks,
    };
  }, [batches]);

  const weeklyPercent = Math.min((metrics.verifiedThisWeek / WEEKLY_GOAL) * 100, 100);
  const progressOffset = 364.4 - (weeklyPercent / 100) * 364.4;

  return (
    <InspectorLayout active="overview">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Inspector Overview
          </h2>
          <p className="text-gray-500 text-sm">
            Real-time verification summary from submitted and inspected SAF batches.
          </p>
        </div>

        <button className="bg-primary hover:bg-primary/80 text-background-dark px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition">
          <span className="material-symbols-outlined text-[20px]">
            refresh
          </span>
          Live Data
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Total Verified Batches"
          value={isLoading ? "..." : metrics.totalVerified.toLocaleString()}
          trend={isLoading ? "Loading" : `${batches.length} total`}
          icon="verified"
        />
        <KpiCard
          title="Avg. Verification Time"
          value={isLoading ? "..." : `${metrics.averageVerificationHours.toFixed(1)}h`}
          trend="Completed only"
          icon="timer"
        />
        <KpiCard
          title="Pending Review"
          value={isLoading ? "..." : `${metrics.pendingReview}`}
          highlight
          icon="priority_high"
          trend={metrics.pendingReview > 0 ? "Needs action" : "Clear"}
          negative={metrics.pendingReview > 0}
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
              Last {metrics.recentActivity.length}
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
                {metrics.recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                      {isLoading ? "Loading recent activity..." : "No activity found."}
                    </td>
                  </tr>
                ) : (
                  metrics.recentActivity.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      id={activity.id}
                      fuel={activity.fuel}
                      time={activity.time}
                      status={activity.status}
                    />
                  ))
                )}
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
              {metrics.verifiedThisWeek} of {WEEKLY_GOAL} Batches Verified
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
                  strokeDashoffset={progressOffset}
                />
              </svg>
              <div className="absolute text-2xl font-bold">
                {Math.round(weeklyPercent)}%
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
              title="Top Feedstock"
              desc={
                metrics.topFeedstocks[0]
                  ? `${metrics.topFeedstocks[0][0]} (${metrics.topFeedstocks[0][1]} batches)`
                  : "No feedstock data available"
              }
              color="blue"
            />
            <Insight
              title="Second Highest Feedstock"
              desc={
                metrics.topFeedstocks[1]
                  ? `${metrics.topFeedstocks[1][0]} (${metrics.topFeedstocks[1][1]} batches)`
                  : "Not enough data for second ranking"
              }
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

function ActivityRow({ id, fuel, time, status }) {
  const statusStyle =
    status === "APPROVED" || status === "INSPECTED"
      ? "bg-primary/20 text-primary"
      : status === "SUBMITTED"
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

function formatTimestamp(value) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
