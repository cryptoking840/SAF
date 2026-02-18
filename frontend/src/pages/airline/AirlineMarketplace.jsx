import { useEffect, useMemo, useState } from "react";
import {
  fetchMarketplaceListings,
  fetchMyBids,
  placeMarketplaceBid,
  acceptMarketplaceBid,
  acceptCounterOffer,
} from "../../api/safApi";

const fallbackListings = [
  {
    certId: "1029384",
    supplier: "SkyPure Biofuels",
    certification: "ISCC-EU",
    price: 1180,
    co2eReduction: 85,
    volume: 500,
    expiry: "Exp. in 14 days",
    badge: null,
  },
  {
    certId: "884212",
    supplier: "GreenWing Logistics",
    certification: "Gold Standard",
    price: 1450,
    co2eReduction: 92,
    volume: 1200,
    expiry: "+4 active bids",
    badge: null,
  },
  {
    certId: "400401",
    supplier: "BioStream Energy",
    certification: "RSB-Global",
    price: 1210,
    co2eReduction: 78,
    volume: 250,
    expiry: "NEW LISTING",
    badge: "new",
  },
  {
    certId: "1029401",
    supplier: "AeroFuel Sustainable",
    certification: "ISCC-EU",
    price: 1310,
    co2eReduction: 89,
    volume: 750,
    expiry: "Expiring Soon",
    badge: "warning",
  },
];

const mapListing = (item) => {
  // Ensure we have a valid certId - use certId first, then certificateId
  const certIdValue = item.certId ?? item.certificateId;
  
  if (!certIdValue || !Number.isFinite(Number(certIdValue))) {
    console.warn("Invalid certId in listing:", item);
    return null; // Skip invalid listings
  }

  return {
    certId: String(certIdValue),
    supplier: item.supplierName || item.supplierWallet || "Unknown Supplier",
    certification: item.feedstockType || "SAF",
    price: Number(item.price || item.referencePricePerMT || item.bidPricePerMT || 0),
    co2eReduction: Number(item.carbonIntensity || 0),
    volume: Number(item.volume || item.availableQuantity || 0),
    expiry: item.blockchainState === "LISTED" ? "LIVE" : item.blockchainState || "LISTED",
    badge: item.blockchainState === "LISTED" ? "new" : null,
    // Keep original data for debugging
    _originalData: item
  };
};

export default function AirlineMarketplace() {
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
      const [listingRes, bidRes] = await Promise.all([
        fetchMarketplaceListings(),
        fetchMyBids(),
      ]);

      if (Array.isArray(listingRes?.data) && listingRes.data.length > 0) {
        // Map listings and filter out any that are invalid (null)
        const mappedListings = listingRes.data
          .map(mapListing)
          .filter(item => item !== null); // Remove null entries from invalid mappings
        
        console.log(`Loaded ${listingRes.data.length} listings, ${mappedListings.length} valid`);
        
        if (mappedListings.length > 0) {
          setListings(mappedListings);
        } else {
          console.warn("No valid listings after mapping");
          setListings(fallbackListings);
        }
      } else {
        console.warn("No listings returned from API, using fallback");
        setListings(fallbackListings);
      }

      setMyBids(Array.isArray(bidRes?.data) ? bidRes.data : []);
      setError("");
    } catch (err) {
      console.error("Error loading marketplace:", err);
      setError(err.message || "Unable to load marketplace data");
      // Keep fallback listings visible on error
      setListings(fallbackListings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return listings;
    }

    return listings.filter((item) => {
      return (
        String(item.certId).toLowerCase().includes(normalized) ||
        String(item.supplier).toLowerCase().includes(normalized)
      );
    });
  }, [listings, query]);

  const openBidDialog = (item) => {
    setSelectedListing(item);
    setBidQuantity(1);
    setBidPrice(item.price || "");
  };

  const submitBid = async () => {
    if (!selectedListing) {
      setError("No listing selected. Please select a listing first.");
      return;
    }

    // Ensure certId is a valid finite number
    const certId = Number(selectedListing.certId);
    const quantity = Number(bidQuantity);
    const price = Number(bidPrice);
    const availableVolume = Number(selectedListing.volume);

    console.log("Submitting bid:", { certId, quantity, price, availableVolume });

    // Validate certId
    if (!Number.isFinite(certId) || certId <= 0) {
      setError(`Invalid certificate ID (${selectedListing.certId}). Please refresh and try again.`);
      return;
    }

    // Validate quantity
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter a valid bid quantity greater than 0.");
      return;
    }

    // Validate quantity doesn't exceed available
    if (availableVolume > 0 && quantity > availableVolume) {
      setError(`Quantity cannot exceed available volume (${availableVolume} MT).`);
      return;
    }

    // Validate price
    if (!Number.isFinite(price) || price <= 0) {
      setError("Please enter a valid bid price greater than 0.");
      return;
    }

    try {
      setSubmittingBid(true);
      console.log("Calling placeMarketplaceBid with:", { certId, quantity, price });
      
      // Call API with explicit certId to ensure it's sent
      await placeMarketplaceBid({ certId, quantity, price });
      
      setSelectedListing(null);
      setError("");
      setBidQuantity(1);
      setBidPrice("");
      await loadMarketplace();
      setShowMyBids(true);
    } catch (err) {
      console.error("Bid submission error:", err);
      setError(err.message || "Bid submission failed");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptCounter = async (bidId) => {
    try {
      setSubmittingBid(true);
      console.log("Accepting counter offer for bid:", bidId);
      
      await acceptCounterOffer(bidId);
      
      setError("");
      await loadMarketplace();
      // Stay on My Bids tab to show updated status
      setShowMyBids(true);
    } catch (err) {
      console.error("Error accepting counter offer:", err);
      setError(err.message || "Failed to accept counter offer");
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <div className="w-full p-8 bg-background-light min-h-screen overflow-auto">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-xl border shadow-sm mb-8">
        <div>
          <h1 className="text-4xl font-black">SAF Marketplace</h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            Discover SAF listings, place bids, and track bidding lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMarketplace}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          <button
            onClick={() => setShowMyBids(!showMyBids)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              showMyBids
                ? "bg-primary text-slate-900 hover:brightness-105"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span className="material-symbols-outlined">gavel</span>
            {showMyBids ? "Back to Listings" : `My Bids (${myBids.length})`}
          </button>
        </div>
      </section>

      <div className="mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 mb-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by certificate or supplier"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard label="Total Listings" value={String(listings.length)} meta="Live" icon="storefront" />
          <StatCard label="My Bids" value={String(myBids.length)} meta="Submitted" icon="gavel" />
          <StatCard
            label="Bid Conversion"
            value={`${
              myBids.length
                ? Math.round(
                    (myBids.filter((item) => item.status === "Accepted").length /
                      myBids.length) *
                      100
                  )
                : 0
            }%`}
            meta="Accepted"
            icon="trending_up"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading marketplace data...
        </div>
      )}

      {!loading && !showMyBids && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((item) => (
                <article
                  key={item.certId}
                  className="flex min-h-[220px] flex-col rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificate</p>
                        <h3 className="text-lg font-bold mt-1">#{item.certId}</h3>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary uppercase tracking-wide">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Supplier:</span> {item.supplier}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Certification:</span> {item.certification}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Volume:</span> {item.volume} MT
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">CO₂e Reduction:</span> {item.co2eReduction}%
                    </p>
                    <p className="text-base font-bold text-primary">
                      ${Number(item.price || 0).toLocaleString()} / MT
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50 p-6">
                    <p
                      className={`text-xs font-bold ${
                        item.badge === "warning" ? "text-red-500" : "text-slate-500"
                      }`}
                    >
                      {item.expiry}
                    </p>
                    <button
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-black hover:brightness-105 transition-all"
                      onClick={() => openBidDialog(item)}
                    >
                      Place Bid
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && showMyBids && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900">My Bids</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bid lifecycle and current status for submitted bids.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-700">Bid ID</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Certificate</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Supplier</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Quantity</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Original Price/MT</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Current Price/MT</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBids.map((bid) => (
                      <tr 
                        key={bid.bidId} 
                        className={`border-t border-slate-100 ${
                          bid.status === "Countered" ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-6 py-3">#{bid.bidId}</td>
                        <td className="px-6 py-3">{bid.certificateId}</td>
                        <td className="px-6 py-3">{bid.supplierName || bid.supplierWallet}</td>
                        <td className="px-6 py-3">{bid.quantity} MT</td>
                        <td className="px-6 py-3">
                          ${Number(bid.originalPricePerMT || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-semibold">
                          ${Number(bid.bidPricePerMT || 0).toLocaleString()}
                          {bid.status === "Countered" && (
                            <span className="ml-2 text-xs text-blue-600">(Countered)</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            bid.approvedByRegistry ? "bg-purple-100 text-purple-700" :
                            bid.status === "Accepted" ? "bg-green-100 text-green-700" :
                            bid.status === "Countered" ? "bg-blue-100 text-blue-700" :
                            bid.status === "Denied" ? "bg-red-100 text-red-700" :
                            bid.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {bid.approvedByRegistry ? "Trade Approved ✓" : bid.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-600">
                          {bid.approvedByRegistry && (
                            <span className="text-purple-600 font-semibold">✓ Ready to Receive Certificate</span>
                          )}
                          {!bid.approvedByRegistry && bid.status === "Pending" && (
                            <span className="text-yellow-600 font-semibold">⏳ Awaiting Supplier Response</span>
                          )}
                          {!bid.approvedByRegistry && bid.status === "Accepted" && (
                            <span className="text-green-600 font-semibold">📋 Pending Registry Approval</span>
                          )}
                          {!bid.approvedByRegistry && bid.status === "Countered" && (
                            <div className="flex flex-col gap-2">
                              <div className="text-xs text-blue-600 font-semibold">
                                Counter: ${Number(bid.bidPricePerMT || 0).toLocaleString()}/MT
                              </div>
                              <button
                                onClick={() => handleAcceptCounter(bid.bidId)}
                                disabled={submittingBid}
                                className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                              >
                                Accept Counter Offer
                              </button>
                            </div>
                          )}
                          {bid.status === "Denied" && (
                            <span className="text-red-600 font-semibold">❌ Rejected by Supplier</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {myBids.length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-center text-slate-500" colSpan={8}>
                          No bids found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold">Place Bid</h3>
            <p className="mt-1 text-sm text-slate-500">Cert ID: {selectedListing.certId}</p>
            <p className="text-sm text-slate-500">Supplier: {selectedListing.supplier}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity (MT)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedListing.volume}
                  value={bidQuantity}
                  onChange={(event) => setBidQuantity(Number(event.target.value) || 1)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Price per MT ($)</label>
                <input
                  type="number"
                  min="1"
                  value={bidPrice}
                  onChange={(event) => setBidPrice(Number(event.target.value) || "")}
                  placeholder="Enter bid price"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
                onClick={() => setSelectedListing(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:brightness-105 transition-all"
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
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium ${
        active ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
      {pill && (
        <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-black">
          {pill}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, meta, icon = "storefront" }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-6xl text-primary">{icon}</span>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-slate-900">{value}</h3>
        <span className="text-slate-500 font-bold text-sm">{meta}</span>
      </div>
    </div>
  );
}
