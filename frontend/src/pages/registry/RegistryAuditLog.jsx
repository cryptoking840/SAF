import { useEffect, useMemo, useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";

export default function RegistryAuditLog() {
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/saf");
        if (!res.ok) {
          throw new Error(`Failed to fetch audit data: ${res.status}`);
        }

        const data = await res.json();
        setBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load audit log.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const logs = useMemo(() => {
    const mapped = batches.map((batch) => {
      const timestamp = new Date(batch.updatedAt || batch.createdAt);
      return {
        id: batch._id,
        timestamp,
        action: mapAction(batch.status),
        by: "Registry System",
        target: batch.productionBatchId || batch._id,
        result: batch.status || "UNKNOWN",
        tx: batch.txHash || null,
      };
    });

    return mapped
      .filter((item) => {
        const searchable = `${item.target} ${item.action} ${item.result}`.toLowerCase();
        if (search && !searchable.includes(search.toLowerCase())) {
          return false;
        }

        if (fromDate) {
          const from = new Date(fromDate);
          if (item.timestamp < from) {
            return false;
          }
        }

        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (item.timestamp > to) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [batches, search, fromDate, toDate]);

  const getResultStyle = (result) => {
    return result === "APPROVED"
      ? "bg-green-50 text-green-700"
      : result === "REJECTED"
      ? "bg-red-50 text-red-700"
      : "bg-blue-50 text-blue-700";
  };

  return (
    <RegistryLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black">Audit & Traceability Log</h2>
          <p className="text-sm text-gray-500">Verify system integrity and blockchain transactions.</p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50">Export CSV</button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm">Export PDF</button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Search ID</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Batch or Certificate ID"
              className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Participant</label>
            <select className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50" defaultValue="All Participants">
              <option>All Participants</option>
              <option>Supplier</option>
              <option>Airline</option>
              <option>Inspector</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full mt-2 px-4 py-2 border rounded-lg text-sm bg-gray-50" />
          </div>
        </div>
      </div>

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
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">
                  {isLoading ? "Loading audit entries..." : "No audit entries found."}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{formatDate(log.timestamp)}</p>
                    <p className="text-xs text-gray-500">{formatTime(log.timestamp)}</p>
                  </td>

                  <td className="px-6 py-4 text-sm font-medium">{log.action}</td>
                  <td className="px-6 py-4 text-sm">{log.by}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{log.target}</td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getResultStyle(log.result)}`}>{log.result}</span>
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-primary">{log.tx ? `${log.tx.slice(0, 10)}...` : "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-6 py-4 border-t flex justify-between text-sm text-gray-500">
          <span>Showing 1 to {logs.length} of {logs.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-lg">Previous</button>
            <button className="px-3 py-1 bg-primary text-white rounded-lg">1</button>
            <button className="px-3 py-1 border rounded-lg">Next</button>
          </div>
        </div>
      </div>
    </RegistryLayout>
  );
}

function mapAction(status) {
  if (status === "APPROVED") {
    return "Certificate Issuance";
  }
  if (status === "INSPECTED") {
    return "Inspection Verification";
  }
  if (status === "REJECTED") {
    return "Batch Rejection";
  }
  return "Batch Creation";
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
