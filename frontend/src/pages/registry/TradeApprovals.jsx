import { useMemo, useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";

const trades = [
  {
    id: "SAF-2023-001",
    seller: "EcoFuel Global",
    buyer: "SkyHigh Airways",
    quantity: 5000,
    value: 250000,
    impact: "4,200 tCO2e",
    hash: "0x892ad777bc3d9e4f2a1b0c7",
    sellerWallet: "addr1qx...9h4k2",
    buyerWallet: "addr1z8...m0p1q",
    documents: [
      "Verification_Report_SAF001.pdf",
      "Sustainability_Cert_2023.pdf",
      "Origin_Certificate_EU_v4.pdf",
    ],
  },
  {
    id: "SAF-2023-002",
    seller: "BioEnergy Corp",
    buyer: "Global Connect",
    quantity: 12000,
    value: 600000,
    impact: "10,100 tCO2e",
    hash: "0x11aaef9b9982dd7aa3f05b9",
    sellerWallet: "addr1pq...4n0xd",
    buyerWallet: "addr1uw...h6s8z",
    documents: ["Inspection_Evidence_002.pdf", "Registry_Checklist_002.pdf"],
  },
  {
    id: "SAF-2023-003",
    seller: "GreenRefine",
    buyer: "EuroFlight",
    quantity: 2500,
    value: 125000,
    impact: "2,100 tCO2e",
    hash: "0x7f4429acc99001aa448e2cc",
    sellerWallet: "addr1gh...2s18w",
    buyerWallet: "addr1lk...h920p",
    documents: ["Traceability_Log_003.pdf", "Declaration_003.pdf"],
  },
  {
    id: "SAF-2023-004",
    seller: "SustainablePower",
    buyer: "Pacific Aero",
    quantity: 8200,
    value: 410000,
    impact: "6,900 tCO2e",
    hash: "0x3e88bc99fd0aafcc2719ad2",
    sellerWallet: "addr1we...5tx4z",
    buyerWallet: "addr1da...9ep2v",
    documents: ["Compliance_Packet_004.pdf"],
  },
];

export default function TradeApprovals() {
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");

  const filteredTrades = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return trades;

    return trades.filter((trade) =>
      [trade.id, trade.seller, trade.buyer].some((field) =>
        field.toLowerCase().includes(query)
      )
    );
  }, [search]);

  const activeTrade = filteredTrades[selected] || filteredTrades[0];

  const handleApprove = () => {
    setShowConfirm(false);
    setToast(`${activeTrade.id} approved. Transfer is being finalized on-chain.`);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <RegistryLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Trade Approvals</h2>
            <p className="text-xs text-slate-500">
              {filteredTrades.length} pending certificate transfers require verification
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelected(0);
                }}
                placeholder="Search certificates..."
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <button className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh List
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Certificate ID</th>
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4 text-right">Quantity (MT)</th>
                  <th className="px-6 py-4 text-right">Value</th>
                  <th className="px-6 py-4 text-right">Impact</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTrades.map((trade, index) => (
                  <tr
                    key={trade.id}
                    onClick={() => setSelected(index)}
                    className={`cursor-pointer transition-colors ${
                      activeTrade?.id === trade.id
                        ? "border-l-4 border-l-primary bg-primary/5"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-sm font-bold">{trade.id}</td>
                    <td className="px-6 py-4 text-sm">{trade.seller}</td>
                    <td className="px-6 py-4 text-sm">{trade.buyer}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {trade.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      ${trade.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-primary">
                      {trade.impact}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Pending Registry
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-xs text-slate-500">
                Showing {Math.min(filteredTrades.length, 4)} of {filteredTrades.length} pending transfers
              </p>
              <div className="flex gap-2">
                <button className="rounded border border-slate-200 bg-white px-3 py-1 text-xs">Previous</button>
                <button className="rounded border border-slate-200 bg-white px-3 py-1 text-xs">Next</button>
              </div>
            </div>
          </div>

          {activeTrade && (
            <aside className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold">Blockchain Verification</h3>
                  <span className="material-symbols-outlined text-primary">verified</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference Hash</p>
                  <code className="text-xs text-slate-600">{activeTrade.hash}</code>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold">Wallet Addresses</h3>
                <InfoLine label="Seller (Sender)" value={activeTrade.sellerWallet} icon="arrow_outward" />
                <InfoLine label="Buyer (Receiver)" value={activeTrade.buyerWallet} icon="arrow_downward" />
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold">Supporting Documents</h3>
                {activeTrade.documents.map((doc) => (
                  <button
                    key={doc}
                    className="flex w-full items-center gap-2 rounded p-2 text-left text-xs hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-slate-400">description</span>
                    <span className="flex-1 truncate">{doc}</span>
                    <span className="material-symbols-outlined text-slate-300 text-sm">open_in_new</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-6">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-background-dark"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Approve Transfer
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 py-3 font-bold text-rose-600">
                  <span className="material-symbols-outlined">cancel</span>
                  Reject Transfer
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>

      {showConfirm && activeTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                <span className="material-symbols-outlined">help</span>
              </div>
              <div>
                <h4 className="text-lg font-bold">Confirm Transfer Approval</h4>
                <p className="text-sm text-slate-500">Certificate {activeTrade.id}</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Approving this transfer will permanently record the transaction on-chain and update buyer
              compliance balances.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-background-dark"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </RegistryLayout>
  );
}

function InfoLine({ label, value, icon }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-slate-400">{icon}</span>
        <span className="font-mono text-xs text-slate-600">{value}</span>
      </div>
    </div>
  );
}
