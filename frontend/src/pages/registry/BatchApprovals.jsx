import RegistryLayout from "../../layout/RegistryLayout";

export default function BatchApprovals() {
  return (
    <RegistryLayout active="batch-approvals">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold">Pending Batch Minting</h2>
          <p className="text-sm text-gray-500">
            12 batches approved by inspectors awaiting registry mint
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-slate-900 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
          <span className="material-symbols-outlined text-[18px]">
            task_alt
          </span>
          Bulk Mint Selected
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Inspector</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4 text-right">CI</th>
              <th className="px-6 py-4">Pathway</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            <BatchRow
              id="#SAF-99281"
              supplier="SkyPure Biofuels"
              inspector="John Doe"
              quantity="45,000 Gallons"
              ci="12.5"
              pathway="HEFA-SPK"
            />
            <BatchRow
              id="#SAF-99285"
              supplier="GreenHorizon"
              inspector="Sarah Miller"
              quantity="120,000 Gallons"
              ci="14.2"
              pathway="ATJ-SPK"
            />
          </tbody>
        </table>
      </div>

    </RegistryLayout>
  );
}

/* ---------------- COMPONENT ---------------- */

function BatchRow({ id, supplier, inspector, quantity, ci, pathway }) {
  return (
    <tr className="hover:bg-gray-50 transition cursor-pointer">
      <td className="px-6 py-4 font-bold">{id}</td>
      <td className="px-6 py-4 text-sm">{supplier}</td>
      <td className="px-6 py-4 text-sm">{inspector}</td>
      <td className="px-6 py-4 text-sm text-right font-medium">
        {quantity}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">
          {ci}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-bold text-gray-500">
        {pathway}
      </td>
      <td className="px-6 py-4">
        <span className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase">
          <span className="size-1.5 rounded-full bg-primary"></span>
          Inspector Approved
        </span>
      </td>
    </tr>
  );
}
