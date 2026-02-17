import { useEffect, useMemo, useState } from "react";
import {
  fetchMarketplaceListings,
  fetchMyBids,
  placeMarketplaceBid,
} from "../../api/safApi";


export default function AirlineMarketplace() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingBids, setLoadingBids] = useState(false);
  const [error, setError] = useState("");
  const [bidForm, setBidForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadListings = async () => {
    setLoadingListings(true);
    setError("");
    try {
      const response = await fetchMarketplaceListings();
      setListings(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to load marketplace listings");
    } finally {
      setLoadingListings(false);
    }
  };

  const loadMyBids = async () => {
    setLoadingBids(true);
    setError("");
    try {
      const response = await fetchMyBids();
      setMyBids(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to load bids");
    } finally {
      setLoadingBids(false);
    }
  };

  useEffect(() => {
    loadListings();
    loadMyBids();
  }, []);

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return listings;

    return listings.filter((item) => {
      return (
        String(item.certificateId).toLowerCase().includes(normalized) ||
        item.supplierName.toLowerCase().includes(normalized) ||
        String(item.productionBatchId || "").toLowerCase().includes(normalized)
      );
    });
  }, [listings, query]);

  const openBidModal = (listing) => {
    setBidForm({
      certId: listing.certificateId,
      quantity: 1,
      price: "",
      maxQuantity: listing.availableQuantity,
      supplierName: listing.supplierName,
    });
  };

  const submitBid = async () => {
    if (!bidForm) return;

    const quantity = Number(bidForm.quantity);
    const price = Number(bidForm.price);

    if (!quantity || !price || quantity <= 0 || price <= 0 || quantity > Number(bidForm.maxQuantity)) {
      setError("Enter a valid quantity and price.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await placeMarketplaceBid({
        certId: Number(bidForm.certId),
        quantity,
        price,
      });
      setBidForm(null);
      await Promise.all([loadListings(), loadMyBids()]);
      setActiveTab("my-bids");
    } catch (err) {
      setError(err.message || "Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light text-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h2 className="text-3xl font-bold tracking-tight">Airline Marketplace</h2>
          <p className="text-slate-500">View supplier listings, place bids, and track lifecycle in My Bids.</p>
        </header>

        {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-4 py-2 rounded ${activeTab === "marketplace" ? "bg-primary text-black font-bold" : "bg-white border"}`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab("my-bids")}
            className={`px-4 py-2 rounded ${activeTab === "my-bids" ? "bg-primary text-black font-bold" : "bg-white border"}`}
          >
            My Bids ({myBids.length})
          </button>
        </div>

        {activeTab === "marketplace" ? (
          <>
            <section className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
              <input
                className="w-full md:w-96 rounded-lg bg-slate-50 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Search by cert ID, supplier, or batch..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button onClick={loadListings} className="rounded-lg border px-4 py-2 text-sm font-semibold">Refresh</button>
            </section>

            {loadingListings ? (
              <p className="text-sm text-slate-500">Loading listings...</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((item) => (
                  <article key={item.certificateId} className="flex flex-col rounded-xl border border-primary/10 bg-white shadow-sm">
                    <div className="space-y-4 p-6">
                      <div>
                        <h3 className="text-lg font-bold">Cert #{item.certificateId}</h3>
                        <p className="text-xs text-slate-500">Batch: {item.productionBatchId}</p>
                      </div>
                      <p className="text-sm"><span className="font-semibold">Supplier:</span> {item.supplierName}</p>
                      <p className="text-sm"><span className="font-semibold">Feedstock:</span> {item.feedstockType}</p>
                      <p className="text-sm"><span className="font-semibold">Available Qty:</span> {item.availableQuantity} MT</p>
                    </div>
                    <div className="mt-auto border-t bg-slate-50/40 p-4">
                      <button
                        onClick={() => openBidModal(item)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black"
                      >
                        Place Bid
                      </button>
                    </div>
                  </article>
                ))}
                {!filteredListings.length && <p className="text-sm text-slate-500">No listed certificates found.</p>}
              </div>
            )}
          </>
        ) : loadingBids ? (
          <p className="text-sm text-slate-500">Loading my bids...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Bid ID</th>
                  <th className="px-4 py-3">Certificate</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Qty (MT)</th>
                  <th className="px-4 py-3">Price / MT</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {myBids.map((bid) => (
                  <tr key={bid.bidId} className="border-t">
                    <td className="px-4 py-3">#{bid.bidId}</td>
                    <td className="px-4 py-3">{bid.certificateId}</td>
                    <td className="px-4 py-3">{bid.supplierName}</td>
                    <td className="px-4 py-3">{bid.quantity}</td>
                    <td className="px-4 py-3">${Number(bid.bidPricePerMT).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{bid.status}</td>
                  </tr>
                ))}
                {!myBids.length && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No bids submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bidForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
            <h3 className="text-xl font-bold">Place Bid for Cert #{bidForm.certId}</h3>
            <p className="text-sm text-slate-500">Supplier: {bidForm.supplierName}</p>
            <div>
              <label className="text-sm font-medium">Quantity (max {bidForm.maxQuantity} MT)</label>
              <input
                type="number"
                min="1"
                max={bidForm.maxQuantity}
                className="mt-1 w-full border rounded px-3 py-2"
                value={bidForm.quantity}
                onChange={(e) => setBidForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price per MT</label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full border rounded px-3 py-2"
                value={bidForm.price}
                onChange={(e) => setBidForm((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="px-4 py-2 border rounded" onClick={() => setBidForm(null)} disabled={submitting}>Cancel</button>
              <button className="px-4 py-2 bg-primary rounded font-bold" onClick={submitBid} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
