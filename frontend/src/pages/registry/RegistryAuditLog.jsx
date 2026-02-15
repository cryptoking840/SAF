import { useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";

export default function RegistryAuditLog() {
  const [logs] = useState([
    {
      date: "Oct 24, 2023",
      time: "14:22:15 GMT",
      action: "Certificate Issuance",
      by: "System Automator",
      target: "CERT-99283-X",
      result: "APPROVED",
      tx: "0x4a2e...f912",
    },
    {
      date: "Oct 24, 2023",
      time: "13:05:42 GMT",
      action: "Batch Creation",
      by: "Sarah Jenkins",
      target: "BATCH-2023-401",
      result: "REJECTED",
      tx: null,
    },
    {
      date: "Oct 23, 2023",
      time: "09:15:00 GMT",
      action: "Validation Check",
      by: "Cert Validator v2",
      target: "CERT-88412-B",
      result: "APPROVED",
      tx: "0x1c88...e831",
    },
  ]);

  const getResultStyle = (result) => {
    return result === "APPROVED"
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700";
  };

  return (
    <RegistryLayout>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black">
            Audit & Traceability Log
          </h2>
          <p className="text-sm text-gray-500">
            Verify system integrity and blockchain transactions.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm">
            Export PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">
              Search ID
            </label>
            <input
              type="text"
              placeholder="Batch or Certificate ID"
              className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">
              Participant
            </label>
            <select className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50">
              <option>All Participants</option>
              <option>Supplier</option>
              <option>Airline</option>
              <option>Inspector</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">
              From
            </label>
            <input
              type="date"
              className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">
              To
            </label>
            <input
              type="date"
              className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50"
            />
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Action Type</th>
              <th className="px-6 py-4">Decided By</th>
              <th className="px-6 py-4">Target ID</th>
              <th className="px-6 py-4">Result</th>
              <th className="px-6 py-4">Tx Hash</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {logs.map((log, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">
                    {log.date}
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.time}
                  </p>
                </td>

                <td className="px-6 py-4 text-sm font-medium">
                  {log.action}
                </td>

                <td className="px-6 py-4 text-sm">
                  {log.by}
                </td>

                <td className="px-6 py-4 font-mono text-sm text-gray-600">
                  {log.target}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${getResultStyle(
                      log.result
                    )}`}
                  >
                    {log.result}
                  </span>
                </td>

                <td className="px-6 py-4 font-mono text-sm text-primary">
                  {log.tx ? log.tx : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t flex justify-between text-sm text-gray-500">
          <span>
            Showing 1 to {logs.length} of 128 entries
          </span>

          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-lg">
              Previous
            </button>
            <button className="px-3 py-1 bg-primary text-white rounded-lg">
              1
            </button>
            <button className="px-3 py-1 border rounded-lg">
              2
            </button>
            <button className="px-3 py-1 border rounded-lg">
              Next
            </button>
          </div>
        </div>
      </div>

    </RegistryLayout>
  );
}
