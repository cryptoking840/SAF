import { useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";

export default function TradeApprovals() {
  const [selected, setSelected] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const trades = [
    {
      id: "SAF-2023-001",
      seller: "EcoFuel Global",
      buyer: "SkyHigh Airways",
      quantity: 5000,
      value: "$250,000",
      impact: "4,200 tCO2e",
      hash: "0x892a...c3d9e4f2a1b0c7",
    },
    {
      id: "SAF-2023-002",
      seller: "BioEnergy Corp",
      buyer: "Global Connect",
      quantity: 12000,
      value: "$600,000",
      impact: "10,100 tCO2e",
      hash: "0x11aa...9982dd7aa",
    },
    {
      id: "SAF-2023-003",
      seller: "GreenRefine",
      buyer: "EuroFlight",
      quantity: 2500,
      value: "$125,000",
      impact: "2,100 tCO2e",
      hash: "0x7f44...cc99001aa",
    },
  ];

  const activeTrade = trades[selected];

  return (
    <RegistryLayout>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Trade Approvals</h2>
          <p className="text-xs text-gray-500">
            {trades.length} pending certificate transfers require verification
          </p>
        </div>
      </div>

      <div className="flex gap-6">

        {/* TABLE SECTION */}
        <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">Certificate</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Value</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {trades.map((trade, index) => (
                <tr
                  key={index}
                  onClick={() => setSelected(index)}
                  className={`cursor-pointer transition ${
                    selected === index
                      ? "bg-primary/5 border-l-4 border-primary"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 font-mono font-bold">
                    {trade.id}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {trade.seller}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {trade.buyer}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {trade.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {trade.value}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-bold">
                      Pending Registry
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DETAIL PANEL */}
        <aside className="w-96 bg-white rounded-xl border shadow-sm p-6 space-y-6">

          <div>
            <h3 className="font-bold mb-2">Blockchain Verification</h3>
            <div className="p-3 bg-gray-50 rounded text-xs font-mono break-all">
              {activeTrade.hash}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Transfer Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Seller</span>
                <span className="font-semibold">{activeTrade.seller}</span>
              </div>
              <div className="flex justify-between">
                <span>Buyer</span>
                <span className="font-semibold">{activeTrade.buyer}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity</span>
                <span className="font-semibold">{activeTrade.quantity} MT</span>
              </div>
              <div className="flex justify-between">
                <span>Impact</span>
                <span className="font-semibold text-primary">
                  {activeTrade.impact}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-primary text-background-dark font-bold rounded-lg"
            >
              Approve Transfer
            </button>

            <button className="w-full py-3 bg-rose-100 text-rose-600 font-bold rounded-lg">
              Reject Transfer
            </button>
          </div>
        </aside>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
            <h4 className="text-lg font-bold mb-3">
              Confirm Approval
            </h4>

            <p className="text-sm text-gray-600 mb-6">
              Approving this transfer will permanently record the
              transaction on the registry ledger.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg font-bold"
              >
                Cancel
              </button>

              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-primary text-background-dark rounded-lg font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </RegistryLayout>
  );
}
