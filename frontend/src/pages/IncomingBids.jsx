import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../layout/AppLayout";
import {
  acceptMarketplaceBid,
  counterMarketplaceBid,
  denyMarketplaceBid,
  fetchIncomingBids,
  listCertificateForSale,
} from "../api/safApi";

const PAGE_SIZE = 5;

const statusClassMap = {
  Pending: "bg-yellow-100 text-yellow-700",
  Countered: "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Denied: "bg-red-100 text-red-700",
  Expired: "bg-gray-200 text-gray-700",
};

export default function IncomingBids() {
  const [bids, setBids] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [counterBid, setCounterBid] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");

  const [certificates, setCertificates] = useState([]);
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [listingQuantity, setListingQuantity] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [listingTerms, setListingTerms] = useState("");
  const [listingSubmitting, setListingSubmitting] = useState(false);

  const loadCertificates = useCallback(async () => {
    const response = await fetch("http://localhost:5000/api/saf/status?status=APPROVED");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load certificates");
    }

    const approved = Array.isArray(data) ? data : [];
    setCertificates(
      approved
        .filter((batch) => batch.certificateId !== null && batch.certificateId !== undefined)
        .map((batch) => ({
          id: Number(batch.certificateId),
          certCode: `SAF-${String(batch.certificateId).padStart(4, "0")}`,
          certificationType: batch.productionPathway || "ISCC PLUS",
          availableQty: Number(batch.quantity || 0),
          status: batch.status,
          batchId: batch.productionBatchId,
        }))
    );
  }, []);

  const loadBids = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [bidResult] = await Promise.all([fetchIncomingBids(), loadCertificates()]);
      setBids(Array.isArray(bidResult.data) ? bidResult.data : []);
    } catch (err) {
      setError(err.message || "Unable to load bid management data");
    } finally {
      setLoading(false);
    }
  }, [loadCertificates]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  useEffect(() => {
    const id = setInterval(loadBids, 30000); // Polling every 30 seconds
    return () => clearInterval(id);
  }, [loadBids]);

  const unlistedCertificates = useMemo(
    () => certificates.filter((certificate) => certificate.status !== "LISTED"),
    [certificates]
  );

  const selectedAggregate = useMemo(
    () => selectedCertificates.reduce((sum, certId) => {
      const certificate = unlistedCertificates.find((item) => item.id === certId);
      return sum + Number(certificate?.availableQty || 0);
    }, 0),
    [selectedCertificates, unlistedCertificates]
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    let list = bids.filter((bid) => {
      const matchesStatus = status === "All" ? true : bid.status === status;
      const matchesSearch =
        bid.airlineName.toLowerCase().includes(query) ||
        String(bid.batchId).toLowerCase().includes(query) ||
        String(bid.status).toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });

    if (sortBy === "value") {
      list = [...list].sort((a, b) => b.totalValue - a.totalValue);
    } else if (sortBy === "price") {
      list = [...list].sort((a, b) => b.bidPricePerMT - a.bidPricePerMT);
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdTimestamp).getTime() - new Date(a.createdTimestamp).getTime()
      );
    }

    return list;
  }, [bids, search, status, sortBy]);

  const totals = useMemo(() => {
    const active = bids.filter((bid) => bid.status === "Pending" || bid.status === "Countered");
    const pendingValue = active.reduce((sum, bid) => sum + bid.totalValue, 0);
    const avgPrice = active.length
      ? active.reduce((sum, bid) => sum + bid.bidPricePerMT, 0) / active.length
      : 0;

    return {
      activeCount: active.length,
      pendingValue,
      avgPrice,
    };
  }, [bids]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const runAction = async (action, airlineName) => {
    try {
      await action();
      await loadBids();
      setToast(`Bid from ${airlineName} has been updated.`);
      setTimeout(() => setToast(""), 3500);
      if (counterBid) {
        setCounterBid(null);
        setCounterPrice("");
      }
    } catch (err) {
      setError(err.message || "Action failed");
    }
  };

  const handleCertificateSelection = (certId, checked) => {
    setSelectedCertificates((prev) =>
      checked ? [...prev, certId] : prev.filter((id) => id !== certId)
    );
  };

  const submitListing = async () => {
    if (selectedCertificates.length === 0) {
      setError("Please select at least one certificate to list.");
      return;
    }

    try {
      setListingSubmitting(true);
      await Promise.all(selectedCertificates.map((certId) => listCertificateForSale(certId)));
      setToast(`Listed ${selectedCertificates.length} certificate(s) for sale.`);
      setTimeout(() => setToast(""), 3500);
      setListingModalOpen(false);
      setSelectedCertificates([]);
      setListingQuantity("");
      setMinimumPrice("");
      setListingTerms("");
      await loadBids();
    } catch (err) {
      setError(err.message || "Failed to list certificates");
    } finally {
      setListingSubmitting(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Bid ID",
      "Airline Name",
      "Batch ID",
      "Price per MT",
      "Volume",
      "Total Value",
      "Status",
      "Expiry",
      "Created",
    ];

    const rows = filtered.map((bid) => [
      bid.bidId,
      bid.airlineName,
      bid.batchId,
      bid.bidPricePerMT,
      bid.volume,
      bid.totalValue,
      bid.status,
      bid.bidExpiryDate,
      bid.createdTimestamp,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "incoming-bids.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white border rounded-xl px-6 py-5">
          <div>
            <h2 className="text-3xl font-black text-[#0d1b13]">Bid Management</h2>
            <p className="text-[#4c9a6c] text-sm">Manage incoming bids and list SAF certificates for sale</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setListingModalOpen(true)} className="px-4 py-2 bg-primary text-background-dark rounded-lg text-sm font-bold hover:opacity-90">
              List Certificate for Sale
            </button>
            <button onClick={exportCsv} className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50">
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Total Active Bids" value={totals.activeCount} />
          <MetricCard label="Pending Value" value={`$${totals.pendingValue.toLocaleString()}`} highlight />
          <MetricCard label="Average Bid Price" value={`$${totals.avgPrice.toFixed(2)}`} suffix="per MT" />
        </div>

        <div className="bg-white p-4 rounded-xl border flex flex-wrap gap-3 items-center">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by airline, status, or batch ID..."
            className="flex-1 min-w-[280px] border rounded-lg px-4 py-2 text-sm"
          />

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Countered">Countered</option>
            <option value="Accepted">Accepted</option>
            <option value="Denied">Denied</option>
            <option value="Expired">Expired</option>
          </select>

          <select className="border rounded-lg px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Sort by: Newest</option>
            <option value="value">Value: High to Low</option>
            <option value="price">Price: High to Low</option>
          </select>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Airline Name</th>
                <th className="px-4 py-3">Batch ID</th>
                <th className="px-4 py-3">Bid Price (MT)</th>
                <th className="px-4 py-3">Volume (MT)</th>
                <th className="px-4 py-3">Total Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-6 text-sm text-gray-500">Loading bids...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-sm text-gray-500">No bids found.</td></tr>
              ) : (
                paginated.map((bid) => {
                  const disabled = bid.status === "Accepted" || bid.status === "Denied" || bid.status === "Expired" || bid.approvedByRegistry;
                  return (
                    <tr key={bid.bidId} className={`hover:bg-gray-50 ${bid.approvedByRegistry ? "bg-purple-50" : ""}`}>
                      <td className="px-4 py-3 font-semibold">{bid.airlineName}</td>
                      <td className="px-4 py-3">{bid.batchId}</td>
                      <td className="px-4 py-3">${Number(bid.bidPricePerMT).toLocaleString()}</td>
                      <td className="px-4 py-3">{bid.volume}</td>
                      <td className="px-4 py-3 font-bold text-primary">${Number(bid.totalValue).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          bid.approvedByRegistry ? "bg-purple-100 text-purple-700" :
                          statusClassMap[bid.status] || "bg-gray-100"
                        }`}>
                          {bid.approvedByRegistry ? "Trade Approved ✓" : bid.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(bid.bidExpiryDate)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(bid.createdTimestamp)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          {bid.approvedByRegistry ? (
                            <span className="text-xs text-purple-600 font-semibold">✓ Complete</span>
                          ) : (
                            <>
                              <button disabled={disabled} onClick={() => runAction(() => acceptMarketplaceBid(bid.bidId), bid.airlineName)} className="px-3 py-1.5 text-xs rounded bg-primary text-white disabled:bg-gray-300">Accept</button>
                              <button disabled={disabled} onClick={() => setCounterBid(bid)} className="px-3 py-1.5 text-xs rounded border disabled:text-gray-400">Counter</button>
                              <button disabled={disabled} onClick={() => runAction(() => denyMarketplaceBid(bid.bidId), bid.airlineName)} className="px-3 py-1.5 text-xs rounded text-red-600 disabled:text-gray-400">Deny</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t text-sm">
            <p>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {listingModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold">Create New SAF Listing</h3>
              <p className="text-sm text-gray-500 mt-1">Select certificates and define listing details.</p>
            </div>

            <div className="p-6 space-y-6">
              <section className="border rounded-xl overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-semibold">1. Select Certificates</h4>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="p-3 w-12">Sel</th>
                      <th className="p-3">Cert ID</th>
                      <th className="p-3">Certification Type</th>
                      <th className="p-3 text-right">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlistedCertificates.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-gray-500">No unlisted certificates available.</td></tr>
                    ) : (
                      unlistedCertificates.map((certificate) => {
                        const checked = selectedCertificates.includes(certificate.id);
                        return (
                          <tr key={certificate.id} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) =>
                                  handleCertificateSelection(certificate.id, event.target.checked)
                                }
                              />
                            </td>
                            <td className="p-3 font-mono">{certificate.certCode}</td>
                            <td className="p-3">{certificate.certificationType}</td>
                            <td className="p-3 text-right font-semibold">{certificate.availableQty.toLocaleString()} MT</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="p-3 border-t bg-gray-50 text-sm text-gray-600 flex justify-between">
                  <span>{selectedCertificates.length} certificate(s) selected from {unlistedCertificates.length} available</span>
                  <span className="font-semibold">Selected Aggregate: <span className="text-primary">{selectedAggregate.toLocaleString()} MT</span></span>
                </div>
              </section>

              <section className="border rounded-xl p-4">
                <h4 className="font-semibold mb-4">2. Listing Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Listing Quantity (MT)</label>
                    <input
                      type="number"
                      value={listingQuantity}
                      onChange={(event) => setListingQuantity(event.target.value)}
                      placeholder="0.00"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Bid Price (per MT)</label>
                    <input
                      type="number"
                      value={minimumPrice}
                      onChange={(event) => setMinimumPrice(event.target.value)}
                      placeholder="0.00"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </section>

              <section className="border rounded-xl p-4">
                <h4 className="font-semibold mb-4">3. Logistics & Terms</h4>
                <textarea
                  rows={4}
                  value={listingTerms}
                  onChange={(event) => setListingTerms(event.target.value)}
                  placeholder="Include delivery and additional terms..."
                  className="w-full border rounded-lg p-3"
                />
              </section>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
              <button
                className="px-6 py-2 border rounded-lg"
                onClick={() => {
                  setListingModalOpen(false);
                  setSelectedCertificates([]);
                }}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-primary text-background-dark rounded-lg font-bold disabled:opacity-60"
                onClick={submitListing}
                disabled={listingSubmitting || selectedCertificates.length === 0}
              >
                {listingSubmitting ? "Creating..." : "Create Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {counterBid && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md">
            <h3 className="text-lg font-bold">Counter Bid</h3>
            <p className="text-sm text-gray-600 mt-1">Enter new price per MT for {counterBid.airlineName}.</p>
            <input
              type="number"
              min="1"
              className="mt-4 w-full border rounded-lg px-3 py-2"
              value={counterPrice}
              onChange={(event) => setCounterPrice(event.target.value)}
              placeholder="New price"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setCounterBid(null)}>Cancel</button>
              <button
                className="px-4 py-2 bg-primary text-white rounded"
                onClick={() => runAction(() => counterMarketplaceBid(counterBid.bidId, Number(counterPrice)), counterBid.airlineName)}
              >
                Submit Counter
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 bg-white border-l-4 border-primary rounded-lg shadow-lg px-4 py-3 text-sm font-medium z-50">
          {toast}
        </div>
      )}
    </AppLayout>
  );
}

function MetricCard({ label, value, suffix, highlight }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-black mt-1 ${highlight ? "text-primary" : "text-[#0d1b13]"}`}>
        {value} {suffix ? <span className="text-sm font-medium text-gray-500">{suffix}</span> : null}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleString();
}
