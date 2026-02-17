import { useMemo, useState } from "react";

const listings = [
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

export default function AirlineMarketplace() {
  const [query, setQuery] = useState("");

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return listings;

    return listings.filter((item) => {
      return (
        item.certId.toLowerCase().includes(normalized) ||
        item.supplier.toLowerCase().includes(normalized) ||
        item.certification.toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900">
      <aside className="fixed flex h-full w-64 flex-col border-r border-primary/10 bg-white">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">eco</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">SAFc</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Airline Marketplace</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-2 px-4">
          <NavRow icon="storefront" label="Marketplace" active />
          <NavRow icon="gavel" label="My Bids" pill="3" />
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
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <header className="mb-8 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
            <p className="text-slate-500">Live trading of Sustainable Aviation Fuel certificates</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Avg. Price per MT" value="$1,240" trend="up" meta="2.4%" />
            <StatCard label="Total Volume Traded" value="45,200 MT" trend="down" meta="1.2%" />
            <StatCard label="Active Sellers" value="128" trend="group" meta="+5%" />
          </div>
        </header>

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

          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-black">Place Bid</button>
        </section>

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
                    <p className="text-lg font-bold text-primary">${item.price.toLocaleString()}/MT</p>
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
                <button className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-black">Place Bid</button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function NavRow({ icon, label, active = false, pill }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
        active ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
      {pill && <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-black">{pill}</span>}
    </div>
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
    </div>
  );
}
