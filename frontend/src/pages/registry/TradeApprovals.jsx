import { useEffect, useMemo, useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";
import { fetchPendingTradeApprovals, approveTrade } from "../../api/safApi";

export default function TradeApprovals() {
  const [trades, setTrades] = useState([]);
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const [approving, setApproving] = useState(false);

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchPendingTradeApprovals();
      setTrades(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      console.error("Error loading trades:", err);
      setError(err.message || "Failed to load pending trades");
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const filteredTrades = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return trades;

    return trades.filter((trade) =>
      [
        String(trade.bidId),
        String(trade.certificateId),
        trade.sellerName.toLowerCase(),
        trade.buyerName.toLowerCase(),
        trade.batchId.toLowerCase(),
      ].some((field) => field.includes(query))
    );
  }, [search, trades]);

  const activeTrade = filteredTrades[selected] || filteredTrades[0];

  const handleApprove = async () => {
    if (!activeTrade) return;

    try {
      setApproving(true);
      await approveTrade(activeTrade.bidId);
      setShowConfirm(false);
      setToast(`Trade #${activeTrade.bidId} approved and recorded on-chain. Certificate transferred to airline.`);
      setTimeout(() => setToast(""), 4000);
      await loadTrades();
      setSelected(0);
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve trade");
    } finally {
      setApproving(false);
    }
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
                placeholder="Search by ID, certificate, or wallet..."
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <button
              onClick={loadTrades}
              className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh List
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading pending trades...
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No pending trades awaiting registry approval.
          </div>
        ) : (
          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Bid ID</th>
                    <th className="px-6 py-4">Certificate</th>
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
                      key={trade.bidId}
                      onClick={() => setSelected(index)}
                      className={`cursor-pointer transition-colors ${
                        activeTrade?.bidId === trade.bidId
                          ? "border-l-4 border-l-primary bg-primary/5"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-4 font-mono text-sm font-bold">#{trade.bidId}</td>
                      <td className="px-6 py-4 text-sm">{trade.certificateId}</td>
                      <td className="px-6 py-4 text-sm">{trade.sellerName}</td>
                      <td className="px-6 py-4 text-sm">{trade.buyerName}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {trade.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        ${trade.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-primary">
                        {trade.impact.toLocaleString()} tCO₂e
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
                  Showing {Math.min(filteredTrades.length, 10)} of {filteredTrades.length} pending transfers
                </p>
              </div>
            </div>

            {activeTrade && (
              <aside className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold">Trade Details</h3>
                    <span className="material-symbols-outlined text-primary">info</span>
                  </div>
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <InfoLine label="Bid ID" value={`#${activeTrade.bidId}`} />
                    <InfoLine label="Certificate ID" value={String(activeTrade.certificateId)} />
                    <InfoLine label="Quantity" value={`${activeTrade.quantity.toLocaleString()} MT`} />
                    <InfoLine label="Price per MT" value={`$${activeTrade.pricePerMT.toLocaleString()}`} />
                    <InfoLine label="Total Value" value={`$${activeTrade.totalValue.toLocaleString()}`} />
                    <InfoLine label="CO₂e Impact" value={`${activeTrade.impact.toLocaleString()} tCO₂e`} />
                    <InfoLine label="Feedstock Type" value={activeTrade.feedstockType} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold">Wallet Addresses</h3>
                  <InfoLine label="Seller (Supplier)" value={activeTrade.sellerWallet} icon="arrow_outward" />
                  <InfoLine label="Buyer (Airline)" value={activeTrade.buyerWallet} icon="arrow_downward" />
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-6">
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={approving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-background-dark disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    {approving ? "Processing..." : "Approve & Record on Chain"}
                  </button>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      {showConfirm && activeTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                <span className="material-symbols-outlined">help</span>
              </div>
              <div>
                <h4 className="text-lg font-bold">Confirm Trade Approval</h4>
                <p className="text-sm text-slate-500">Bid #{activeTrade.bidId}</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Approving this transfer will:
              <ul className="mt-2 ml-4 space-y-1 text-xs">
                <li>✓ Record the transaction on-chain</li>
                <li>✓ Create new certificate in airline wallet</li>
                <li>✓ Update supplier's remaining balance</li>
                <li>✓ Complete the SAF trade</li>
              </ul>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={approving}
                className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-background-dark disabled:opacity-50"
              >
                {approving ? "Processing..." : "Confirm Approval"}
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
        {icon && <span className="material-symbols-outlined text-sm text-slate-400">{icon}</span>}
        <span className="font-mono text-xs text-slate-600 break-all">{value}</span>
      </div>
    </div>
  );
}

