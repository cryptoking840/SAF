import RegistryLayout from "../../layout/RegistryLayout";

export default function ParticipantApprovals() {
  return (
    <RegistryLayout active="participants">

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold">
            Participant Onboarding Approval
          </h2>
          <p className="text-sm text-gray-500">
            Review and approve suppliers, inspectors and institutions
          </p>
        </div>

        <button className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold border border-primary/20 hover:bg-primary/20 transition">
          <span className="material-symbols-outlined text-lg">
            download
          </span>
          Export Report
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-8 border-b mb-6 text-sm font-bold">
        <button className="border-b-2 border-primary pb-2">
          Suppliers (12)
        </button>
        <button className="text-gray-500 hover:text-black pb-2">
          Inspectors (5)
        </button>
        <button className="text-gray-500 hover:text-black pb-2">
          Airlines / Institutions (3)
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Wallet</th>
              <th className="px-6 py-4">KYC</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            <ParticipantRow
              name="Global Aero Parts"
              role="Supplier"
              wallet="0x71C...a29"
              kyc="PENDING"
            />
            <ParticipantRow
              name="SkyHigh Inspections"
              role="Inspector"
              wallet="0x3A2...f1b"
              kyc="VERIFIED"
            />
          </tbody>
        </table>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard
          icon="pending_actions"
          title="Average Wait Time"
          value="2.4 Days"
        />
        <StatCard
          icon="verified"
          title="Approval Rate"
          value="88.5%"
        />
        <StatCard
          icon="history"
          title="Recent Actions"
          value="42 Today"
        />
      </div>

    </RegistryLayout>
  );
}

/* ================= COMPONENTS ================= */

function ParticipantRow({ name, role, wallet, kyc }) {
  const roleStyle =
    role === "Inspector"
      ? "bg-blue-100 text-blue-700"
      : "bg-primary/10 text-primary";

  const kycStyle =
    kyc === "VERIFIED"
      ? "text-green-600"
      : "text-amber-500";

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4">
        <div className="font-bold">{name}</div>
        <div className="text-xs text-gray-400">
          Registered: Oct 12, 2023
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`text-xs font-bold px-2 py-1 rounded ${roleStyle}`}>
          {role}
        </span>
      </td>

      <td className="px-6 py-4 font-mono text-xs text-gray-500">
        {wallet}
      </td>

      <td className={`px-6 py-4 text-xs font-bold ${kycStyle}`}>
        {kyc}
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 text-xs font-bold bg-primary text-white rounded hover:opacity-90">
            Approve
          </button>
          <button className="px-3 py-1 text-xs font-bold border rounded hover:bg-red-50 text-red-600">
            Reject
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
      <div className="p-3 bg-primary/10 rounded-lg text-primary">
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-xs uppercase text-gray-400 font-bold">
          {title}
        </p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
