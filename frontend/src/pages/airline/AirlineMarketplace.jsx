import { useEffect, useMemo, useState } from "react";
import {
  fetchMarketplaceListings,
  fetchMyBids,
  placeMarketplaceBid,
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
        setListings(listingRes.data.map(mapListing));
      }

      setMyBids(Array.isArray(bidRes?.data) ? bidRes.data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load marketplace data");
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
    if (!selectedListing) return;

    const certId = Number(selectedListing.certId);
    const quantity = Number(bidQuantity);
    const price = Number(bidPrice);
    const availableVolume = Number(selectedListing.volume);

    if (!Number.isFinite(certId) || certId <= 0) {
      setError("This listing is not ready for bidding yet. Please refresh marketplace data.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter a valid bid quantity greater than 0.");
      return;
    }

    if (Number.isFinite(availableVolume) && availableVolume > 0 && quantity > availableVolume) {
      setError(`Quantity cannot exceed available volume (${availableVolume} MT).`);
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Please enter a valid bid price greater than 0.");
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
    }
  };

  return (
    <div className="min-h-screen bg-background-light text-slate-900">
      <main className="mx-auto flex max-w-7xl gap-6 p-6 lg:p-8">
        <aside className="hidden w-72 shrink-0 rounded-2xl bg-white p-4 shadow-sm md:block">
          <h2 className="px-4 pb-2 text-xl font-bold">Airline Portal</h2>
          <nav className="mt-2 flex-1 space-y-2 px-2">
            <NavRow
              icon="storefront"
              label="Marketplace"
              active={!showMyBids}
              onClick={() => setShowMyBids(false)}
            />
            <NavRow
              icon="gavel"
              label="My Bids"
              pill={String(myBids.length)}
              active={showMyBids}
              onClick={() => setShowMyBids(true)}
            />
          </nav>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold">SAF Marketplace</h1>
            <p className="text-sm text-slate-500">
              Discover SAF listings, place bids, and track bidding lifecycle.
            </p>

            <div className="mt-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by certificate or supplier"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total Listings" value={String(listings.length)} meta="Live" />
            <StatCard label="My Bids" value={String(myBids.length)} meta="Submitted" />
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
            />
          </div>

          {loading && (
            <div className="rounded-xl border border-primary/10 bg-white p-5 text-sm text-slate-500 shadow-sm">
              Loading marketplace data...
            </div>
          )}

          {!loading && !showMyBids && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((item) => (
                <article
                  key={item.certId}
                  className="flex min-h-[220px] flex-col rounded-xl border border-primary/10 bg-white shadow-sm"
                >
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Certificate</p>
                        <h3 className="text-lg font-bold">#{item.certId}</h3>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                          {item.badge.toUpperCase()}
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

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                    <p
                      className={`text-xs font-bold ${
                        item.badge === "warning" ? "text-red-500" : "text-slate-500"
                      }`}
                    >
                      {item.expiry}
                    </p>
                    <button
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-black"
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
            <div className="rounded-xl border border-primary/10 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h3 className="text-lg font-bold">My Bids</h3>
                <p className="text-xs text-slate-500">
                  Bid lifecycle and current status for submitted bids.
                </p>
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
                        <td className="px-4 py-3">
                          ${Number(bid.bidPricePerMT || 0).toLocaleString()}
                        </td>
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
        </section>
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
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
                onClick={() => setSelectedListing(null)}
              >
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

function StatCard({ label, value, meta }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs font-bold text-primary">{meta}</span>
      </div>
    </div>
  );
}
