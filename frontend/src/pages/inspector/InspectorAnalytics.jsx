import InspectorLayout from "../../layout/InspectorLayout";

export default function InspectorAnalytics() {
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
        <KpiCard title="Total Inspections" value="1,284" percent="+12.5%" progress="75%" />
        <KpiCard title="Compliance Rate" value="94.2%" percent="+2.1%" progress="94%" />
        <KpiCard title="Avg. Verification Time" value="4.5 Days" percent="-0.5d" progress="40%" negative />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Pathway Distribution */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg mb-6">
            Inspections by Pathway
          </h3>

          <BarRow label="HEFA" value="482" width="85%" />
          <BarRow label="Alcohol-to-Jet" value="312" width="55%" />
          <BarRow label="Fischer-Tropsch" value="245" width="42%" />
          <BarRow label="SIP" value="120" width="20%" />
        </div>

        {/* Feedstock Donut */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-lg mb-6">
            Feedstock Distribution
          </h3>

          <div className="space-y-4">
            <Legend label="Used Cooking Oil" percent="45%" />
            <Legend label="Animal Fats" percent="25%" />
            <Legend label="Biomass/Waste" percent="30%" />
          </div>
        </div>
      </div>

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
            <FacilityRow name="Neste Rotterdam B.V." pathway="HEFA" inspections="142" score="99.2%" />
            <FacilityRow name="World Energy Paramount" pathway="AtJ" inspections="98" score="98.5%" />
            <FacilityRow name="SkyNRG Harlingen" pathway="HEFA" inspections="76" score="97.8%" />
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
