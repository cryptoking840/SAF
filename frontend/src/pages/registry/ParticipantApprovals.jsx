import { useEffect, useMemo, useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";
import {
  approveParticipantRegistration,
  fetchParticipantRegistrations,
  rejectParticipantRegistration,
} from "../../api/safApi";

export default function ParticipantApprovals() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [actingId, setActingId] = useState(null);

  const loadParticipants = async (status = activeStatus) => {
    try {
      setLoading(true);
      setError("");
      const statusFilter = status === "ALL" ? undefined : status;
      const response = await fetchParticipantRegistrations(statusFilter);
      setParticipants(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Failed to load participant registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants(activeStatus);
  }, [activeStatus]);

  const stats = useMemo(() => {
    const pending = participants.filter((item) => item.status === "PENDING").length;
    const approved = participants.filter((item) => item.status === "APPROVED").length;
    const rejected = participants.filter((item) => item.status === "REJECTED").length;
    return { pending, approved, rejected };
  }, [participants]);

  const runAction = async (id, actionType) => {
    try {
      setActingId(id);
      setError("");
      if (actionType === "approve") {
        await approveParticipantRegistration(id);
      } else {
        await rejectParticipantRegistration(id);
      }
      await loadParticipants(activeStatus);
    } catch (err) {
      setError(err.message || `Failed to ${actionType} participant`);
    } finally {
      setActingId(null);
    }
  };

  return (
    <RegistryLayout active="participants">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Participant Onboarding Approval</h2>
          <p className="text-sm text-gray-500">Review registration requests and control platform access.</p>
        </div>
        <button
          onClick={() => loadParticipants(activeStatus)}
          className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b mb-6 pb-3">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 text-xs font-bold rounded ${
              activeStatus === status
                ? "bg-primary text-black"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Org Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>
                  Loading participants...
                </td>
              </tr>
            )}
            {!loading && participants.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>
                  No participant registrations found.
                </td>
              </tr>
            )}
            {!loading &&
              participants.map((participant) => {
                const canAct = participant.status === "PENDING";
                return (
                  <tr key={participant._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold">{participant.organizationName}</div>
                      <div className="text-xs text-gray-400">
                        Registered: {participant.createdAt ? new Date(participant.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary uppercase">
                        {participant.organizationType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{participant.officialEmail}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={participant.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={!canAct || actingId === participant._id}
                          onClick={() => runAction(participant._id, "approve")}
                          className="px-3 py-1 text-xs font-bold bg-primary text-black rounded hover:opacity-90 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          disabled={!canAct || actingId === participant._id}
                          onClick={() => runAction(participant._id, "reject")}
                          className="px-3 py-1 text-xs font-bold border rounded hover:bg-red-50 text-red-600 disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard icon="pending_actions" title="Pending Requests" value={String(stats.pending)} />
        <StatCard icon="verified" title="Approved Participants" value={String(stats.approved)} />
        <StatCard icon="block" title="Rejected Participants" value={String(stats.rejected)} />
      </div>
    </RegistryLayout>
  );
}

function StatusBadge({ status }) {
  if (status === "APPROVED") {
    return <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">APPROVED</span>;
  }
  if (status === "REJECTED") {
    return <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">REJECTED</span>;
  }
  return <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">PENDING</span>;
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
      <div className="p-3 bg-primary/10 rounded-lg text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-xs uppercase text-gray-400 font-bold">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
