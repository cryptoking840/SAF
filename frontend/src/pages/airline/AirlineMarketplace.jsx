import { useEffect, useMemo, useState } from "react";
import {
  fetchMarketplaceListings,
  fetchMyBids,
  placeMarketplaceBid,
} from "../../api/safApi";

const fallbackListings = [
  {
    certId: "10293-84",
    supplier: "SkyPure Biofuels",
    certification: "ISCC-EU",
    price: 1180,
    co2eReduction: 85,
    volume: 500,
    expiry: "Exp. in 14 days",
    badge: null,
  },
  {
    certId: "GS-8842-12",
    supplier: "GreenWing Logistics",
    certification: "Gold Standard",
    price: 1450,
    co2eReduction: 92,
    volume: 1200,
    expiry: "+4 active bids",
    badge: null,
  },
  {
    certId: "RSB-004-PQ",
    supplier: "BioStream Energy",
    certification: "RSB-Global",
    price: 1210,
    co2eReduction: 78,
    volume: 250,
    expiry: "NEW LISTING",
    badge: "new",
  },
  {
    certId: "10294-01",
    supplier: "AeroFuel Sustainable",
    certification: "ISCC-EU",
    price: 1310,
    co2eReduction: 89,
    volume: 750,
    expiry: "Expiring Soon",
    badge: "warning",
  },
];

const mapListing = (item) => ({
  certId: String(item.certificateId),
  supplier: item.supplierName || item.supplierWallet || "Unknown Supplier",
  certification: item.feedstockType || "SAF",
  price: Number(item.referencePricePerMT || item.bidPricePerMT || 0),
  co2eReduction: Number(item.carbonIntensity || 0),
  volume: Number(item.availableQuantity || 0),
  expiry: item.blockchainState === "LISTED" ? "LIVE" : item.blockchainState || "LISTED",
  badge: item.blockchainState === "LISTED" ? "new" : null,
});

export default function AirlineMarketplace() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState(fallbackListings);
  const [myBids, setMyBids] = useState([]);
  const [showMyBids, setShowMyBids] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [bidQuantity, setBidQuantity] = useState(1);
  const [bidPrice, setBidPrice] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  const loadMarketplace = async () => {
    try {
      setLoading(true);
      const [listingRes, bidRes] = await Promise.all([fetchMarketplaceListings(), fetchMyBids()]);
      if (Array.isArray(listingRes?.data) && listingRes.data.length > 0) {
        setListings(listingRes.data.map(mapListing));
      }
      setMyBids(Array.isArray(bidRes?.data) ? bidRes.data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load marketplace data");
    } finally {
      setLoading(false);
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
    loadMarketplace();
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

  const openBidDialog = (item) => {
    setSelectedListing(item);
    setBidQuantity(1);
    setBidPrice(item.price || "");
  };

  const submitBid = async () => {
    if (!selectedListing) return;

    const certId = Number(selectedListing.certId);
    const quantity = Number(bidQuantity);
    const price = Number(bidPrice);

    if (!certId || !quantity || !price || quantity <= 0 || price <= 0) {
      setError("Please enter valid bid quantity and price.");
      return;
    }

    try {
      setSubmittingBid(true);
      await placeMarketplaceBid({ certId, quantity, price });
      setSelectedListing(null);
      await loadMarketplace();
      setShowMyBids(true);
      setError("");
    } catch (err) {
      setError(err.message || "Bid submission failed");
    } finally {
      setSubmittingBid(false);
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

        <nav className="mt-2 flex-1 space-y-2 px-4">
          <NavRow icon="storefront" label="Marketplace" active={!showMyBids} onClick={() => setShowMyBids(false)} />
          <NavRow icon="gavel" label="My Bids" pill={String(myBids.length)} active={showMyBids} onClick={() => setShowMyBids(true)} />
          <NavRow icon="inventory_2" label="Inventory" />
          <NavRow icon="monitoring" label="Analytics" />
        </nav>

        <div className="border-t border-primary/10 p-4">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="mb-1 text-xs font-medium text-slate-500">Connected Wallet</p>
            <div className="flex items-center gap-2">
              <div className="size-2 animate-pulse rounded-full bg-primary" />
              <p className="truncate text-sm font-bold">0x4F...9B22</p>
            </div>
          </div>
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

        {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

        <section className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
          <div className="relative min-w-[300px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full rounded-lg bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Search by Cert ID or Seller..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-black" onClick={loadMarketplace}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {!showMyBids && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item) => (
              <article key={item.certId} className="flex flex-col rounded-xl border border-primary/10 bg-white shadow-sm">
                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {item.certification}
                      </span>
                      <h3 className="mt-1 text-lg font-bold">Cert ID: {item.certId}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Current Price</p>
                      <p className="text-lg font-bold text-primary">${Number(item.price || 0).toLocaleString()}/MT</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Supplier</p>
                    <p className="text-sm font-bold">{item.supplier}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">CO2e Reduction</p>
                      <p className="text-lg font-bold text-primary">{item.co2eReduction}%</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Available Qty</p>
                      <p className="text-lg font-bold">{item.volume} MT</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                  <p className={`text-xs font-bold ${item.badge === "warning" ? "text-red-500" : "text-slate-500"}`}>
                    {item.expiry}
                  </p>
                  <button className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-black" onClick={() => openBidDialog(item)}>
                    Place Bid
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {showMyBids && (
          <div className="rounded-xl border border-primary/10 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-lg font-bold">My Bids</h3>
              <p className="text-xs text-slate-500">Bid lifecycle and current status for submitted bids.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3">Bid ID</th>
                    <th className="px-4 py-3">Certificate</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Price/MT</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myBids.map((bid) => (
                    <tr key={bid.bidId} className="border-t border-slate-100">
                      <td className="px-4 py-3">#{bid.bidId}</td>
                      <td className="px-4 py-3">{bid.certificateId}</td>
                      <td className="px-4 py-3">{bid.supplierName || bid.supplierWallet}</td>
                      <td className="px-4 py-3">{bid.quantity}</td>
                      <td className="px-4 py-3">${Number(bid.bidPricePerMT || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">{bid.status}</td>
                    </tr>
                  ))}
                  {myBids.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                        No bids found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-lg font-bold">Place Bid</h3>
            <p className="mt-1 text-sm text-slate-500">Cert ID: {selectedListing.certId}</p>
            <p className="text-sm text-slate-500">Supplier: {selectedListing.supplier}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Quantity (MT)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedListing.volume}
                  value={bidQuantity}
                  onChange={(event) => setBidQuantity(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Price per MT</label>
                <input
                  type="number"
                  min="1"
                  value={bidPrice}
                  onChange={(event) => setBidPrice(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => setSelectedListing(null)}>
                Cancel
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black"
                onClick={submitBid}
                disabled={submittingBid}
              >
                {submittingBid ? "Submitting..." : "Submit Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavRow({ icon, label, active = false, pill, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-left ${
        active ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
      {pill && <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-black">{pill}</span>}
    </button>
  );
}

function StatCard({ label, value, trend, meta }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span
          className={`flex items-center gap-1 text-xs font-bold ${
            trend === "down" ? "text-red-500" : "text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {trend === "down" ? "trending_down" : trend === "group" ? "group" : "trending_up"}
          </span>
          {meta}
        </span>
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
