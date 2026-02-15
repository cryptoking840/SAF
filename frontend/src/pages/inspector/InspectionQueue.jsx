import { useState } from "react";
import InspectorLayout from "../../layout/InspectorLayout";

export default function InspectionQueue() {
  const [batches] = useState([
    {
      id: "SAF-2023-1102",
      supplier: "SkyEnergy Solutions",
      location: "Rotterdam, NL",
      pathway: "HEFA-SPK",
      submitted: "2023-10-24",
      status: "PENDING",
    },
    {
      id: "SAF-2023-1098",
      supplier: "GreenAviation Corp",
      location: "Texas, USA",
      pathway: "AtJ (Alcohol-to-Jet)",
      submitted: "2023-10-23",
      status: "IN_PROGRESS",
    },
    {
      id: "SAF-2023-1095",
      supplier: "BioFuels Intl",
      location: "Singapore",
      pathway: "SIP (F-T)",
      submitted: "2023-10-22",
      status: "FLAGGED",
    },
    {
      id: "SAF-2023-1088",
      supplier: "Nordic Sustainable",
      location: "Oslo, NO",
      pathway: "HEFA-SPK",
      submitted: "2023-10-20",
      status: "VERIFIED",
    },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "FLAGGED":
        return "bg-red-100 text-red-600";
      case "VERIFIED":
        return "bg-primary/20 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <InspectorLayout active="queue">

      {/* Page Heading */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black">
            Inspection Queue
          </h2>
          <p className="text-sm text-gray-500">
            Manage and verify pending SAF batch submissions.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold hover:bg-primary/20 transition">
          <span className="material-symbols-outlined text-base">
            download
          </span>
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-8 text-sm font-bold">
          <button className="border-b-2 border-primary pb-2">
            All Pending
          </button>
          <button className="text-gray-500 hover:text-black">
            In Progress
          </button>
          <button className="text-gray-500 hover:text-black">
            Flagged
          </button>
          <button className="text-gray-500 hover:text-black">
            Verified
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Pathway</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {batches.map((batch, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <button className="text-primary font-bold hover:underline">
                    {batch.id}
                  </button>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {batch.supplier}
                    </span>
                    <span className="text-xs text-gray-500">
                      {batch.location}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm">
                  {batch.pathway}
                </td>

                <td className="px-6 py-4 text-xs text-gray-500">
                  {batch.submitted}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                      batch.status
                    )}`}
                  >
                    {batch.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between text-xs text-gray-500">
          <span>Showing 4 of 24 batches</span>

          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-lg font-bold hover:bg-gray-100">
              Previous
            </button>
            <button className="px-3 py-1 border rounded-lg font-bold hover:bg-gray-100">
              Next
            </button>
          </div>
        </div>
      </div>

    </InspectorLayout>
  );
}
