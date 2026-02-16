import { useEffect, useMemo, useState } from "react";
import InspectorLayout from "../../layout/InspectorLayout";

export default function InspectorAnalytics() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchBatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/saf");
        if (!res.ok) {
          throw new Error(`Failed to fetch analytics: ${res.status}`);
        }

        const data = await res.json();
        if (isMounted) {
          setBatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load analytics details.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalInspections = batches.filter(
      (batch) => batch.status === "INSPECTED" || batch.status === "APPROVED"
    ).length;
    const reviewed = batches.filter((batch) => batch.status !== "SUBMITTED").length;
    const complianceRate = reviewed ? (totalInspections / reviewed) * 100 : 0;

    const pathwayCount = batches.reduce((acc, batch) => {
      const pathway = batch.productionPathway || "Unknown";
      acc[pathway] = (acc[pathway] || 0) + 1;
      return acc;
    }, {});

    const feedstockCount = batches.reduce((acc, batch) => {
      const feedstock = batch.feedstockType || "Unknown";
      acc[feedstock] = (acc[feedstock] || 0) + 1;
      return acc;
    }, {});

    const facilities = batches.reduce((acc, batch) => {
      const facility = batch.supplierWallet || "Unknown Facility";

      if (!acc[facility]) {
        acc[facility] = {
          name: facility,
          pathway: batch.productionPathway || "Unknown",
          inspections: 0,
          reviewed: 0
        };
      }

      if (batch.status === "INSPECTED" || batch.status === "APPROVED") {
        acc[facility].inspections += 1;
      }

      if (batch.status !== "SUBMITTED") {
        acc[facility].reviewed += 1;
      }

      return acc;
    }, {});

    const topFacilities = Object.values(facilities)
      .map((facility) => ({
        ...facility,
        score: facility.reviewed
          ? `${((facility.inspections / facility.reviewed) * 100).toFixed(1)}%`
          : "0.0%"
      }))
      .sort((a, b) => b.inspections - a.inspections)
      .slice(0, 5);

    return {
      totalInspections,
      complianceRate,
      pathwayCount,
      feedstockCount,
      topFacilities
    };
  }, [batches]);

  const pathwayDistribution = Object.entries(metrics.pathwayCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const feedstockDistribution = Object.entries(metrics.feedstockCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <InspectorLayout active="analytics">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">
            Performance Analytics
          </h2>
          <p className="text-gray-500 text-base">
            Real-time inspection metrics and pathway compliance data overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg p-1 border">
            <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-primary text-black">
              30 Days
            </button>
            <button className="px-4 py-1.5 text-xs font-medium text-gray-500">
              90 Days
            </button>
            <button className="px-4 py-1.5 text-xs font-medium text-gray-500">
              YTD
            </button>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-sm">
              download
            </span>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Total Inspections"
          value={isLoading ? "..." : metrics.totalInspections.toLocaleString()}
          percent={isLoading ? "Loading" : `${batches.length} Batches`}
          progress={batches.length ? `${Math.min((metrics.totalInspections / batches.length) * 100, 100)}%` : "0%"}
        />
        <KpiCard
          title="Compliance Rate"
          value={isLoading ? "..." : `${metrics.complianceRate.toFixed(1)}%`}
          percent={error ? "Unavailable" : "Reviewed Batches"}
          progress={isLoading ? "0%" : `${Math.min(metrics.complianceRate, 100)}%`}
          negative={Boolean(error)}
        />
        <KpiCard
          title="Open Reviews"
          value={isLoading ? "..." : `${batches.filter((batch) => batch.status === "SUBMITTED").length}`}
          percent={error ? "Action needed" : "Pending"}
          progress={
            batches.length
              ? `${Math.min((batches.filter((batch) => batch.status === "SUBMITTED").length / batches.length) * 100, 100)}%`
              : "0%"
          }
          negative
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Pathway Distribution */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg mb-6">
            Inspections by Pathway
          </h3>

          {pathwayDistribution.length === 0 ? (
            <p className="text-sm text-gray-500">No pathway details available yet.</p>
          ) : (
            pathwayDistribution.map(([label, value]) => (
              <BarRow
                key={label}
                label={label}
                value={value}
                width={`${Math.min((value / pathwayDistribution[0][1]) * 100, 100)}%`}
              />
            ))
          )}
        </div>

        {/* Feedstock Donut */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg mb-6">
            Feedstock Distribution
          </h3>

          <div className="space-y-4">
            {feedstockDistribution.length === 0 ? (
              <p className="text-sm text-gray-500">No feedstock details available yet.</p>
            ) : (
              feedstockDistribution.map(([label, value]) => (
                <Legend
                  key={label}
                  label={label}
                  percent={`${((value / batches.length) * 100 || 0).toFixed(1)}%`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Top Facilities */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">
            Top Performing Facilities
          </h3>
          <button className="text-sm text-primary font-bold hover:underline">
            View All
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Facility Name</th>
              <th className="px-6 py-4">Primary Pathway</th>
              <th className="px-6 py-4">Inspections</th>
              <th className="px-6 py-4 text-right">Compliance Score</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {metrics.topFacilities.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-sm text-gray-500" colSpan={4}>
                  {isLoading ? "Loading facility details..." : "No facility details found."}
                </td>
              </tr>
            ) : (
              metrics.topFacilities.map((facility) => (
                <FacilityRow
                  key={facility.name}
                  name={facility.name}
                  pathway={facility.pathway}
                  inspections={facility.inspections}
                  score={facility.score}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

    </InspectorLayout>
  );
}

/* ================= Components ================= */

function KpiCard({ title, value, percent, progress, negative }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm text-gray-500">{title}</p>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            negative
              ? "bg-red-100 text-red-600"
              : "bg-primary/10 text-primary"
          }`}
        >
          {percent}
        </span>
      </div>

      <p className="text-3xl font-black">{value}</p>

      <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: progress }}
        />
      </div>
    </div>
  );
}

function BarRow({ label, value, width }) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width }} />
      </div>
    </div>
  );
}

function Legend({ label, percent }) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span className="font-bold">{percent}</span>
    </div>
  );
}

function FacilityRow({ name, pathway, inspections, score }) {
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 font-bold">{name}</td>
      <td className="px-6 py-4">{pathway}</td>
      <td className="px-6 py-4">{inspections}</td>
      <td className="px-6 py-4 text-right font-bold text-primary">
        {score}
      </td>
    </tr>
  );
}
