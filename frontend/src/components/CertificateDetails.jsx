export default function CertificateDetails({ certificate, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold">
            Certificate Details
          </h3>
          <span className="text-gray-400 font-normal">
            {certificate.id}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary uppercase">
            Active
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition"
        >
          <span className="material-symbols-outlined text-gray-500">
            close
          </span>
        </button>
      </div>

      {/* Scrollable Body (ONLY SCROLL AREA) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Intro Section */}
        <div className="flex gap-6 items-start">
          <div className="w-32 h-32 rounded-lg bg-primary/5 border flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-5xl">
              verified_user
            </span>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                  Status
                </p>
                <h4 className="text-lg font-bold">
                  Verified Production
                </h4>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Issued on {certificate.issueDate}. This certificate represents{" "}
                  {certificate.quantity} Metric Tons of Sustainable Aviation Fuel production.
                </p>
              </div>

              <button className="flex items-center gap-2 px-3 py-1.5 border bg-primary/5 rounded-lg text-xs font-bold hover:bg-primary/10 transition">
                <span className="material-symbols-outlined text-sm">
                  picture_as_pdf
                </span>
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Producer */}
        <section>
          <h5 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              factory
            </span>
            Producer & Origin
          </h5>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
            <Info label="Producer Name" value="SkyFuel Renewables LLC" />
            <Info label="Facility ID" value="FAC-88902-TX" />
            <Info label="Location" value="Houston, Texas, USA" />
            <Info label="Production Date" value="Oct 28 - Nov 05, 2023" />
          </div>
        </section>

        {/* Commercial */}
        <section>
          <h5 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              payments
            </span>
            Commercial Details
          </h5>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
            <Info label="Total Quantity" value={`${certificate.quantity} MT`} />
            <Info label="Transaction ID" value="TXN-4421-9901" />
            <Info label="Expiry Date" value="Nov 15, 2025" />
            <Info label="Purchase Order" value="PO-GLOBAL-2023-42" />
          </div>
        </section>

        {/* Sustainability */}
        <section>
          <h5 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              analytics
            </span>
            Sustainability Metrics
          </h5>

          <div className="grid grid-cols-3 gap-4">
            <Metric label="Carbon Intensity" value="18.4" sub="gCO2e/MJ" />
            <Metric label="GHG Reduction" value="82%" sub="vs Fossil Baseline" />
            <Metric label="Feedstock" value="Used Cooking Oil" sub="Waste Residual" />
          </div>
        </section>

        {/* Blockchain */}
        <section>
          <div className="bg-slate-900 text-white rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h5 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  hub
                </span>
                Blockchain Verification
              </h5>

              <button className="bg-primary text-black font-bold px-4 py-2 rounded text-xs">
                Verify on Explorer
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <InfoDark label="Network" value="Hyperledger Besu (Private Network)" />
              <InfoDark label="Block Number" value="18402932" mono />
              <InfoDark
                label="Transaction Hash"
                value="0x9c3e4142d8f8a2f4c7e6b5a3d1c9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1"
                mono
              />
              <InfoDark
                label="Smart Contract"
                value="0x13EC80A4B3C2D1D3E2F1A0B9C8D7E6F5A4B3C2D1"
                mono
              />
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t flex justify-end bg-gray-50">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 font-bold rounded-lg text-sm transition"
        >
          Close Details
        </button>
      </div>
    </>
  );
}

/* Helpers */

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-700">
        {value}
      </p>
    </div>
  );
}

function InfoDark({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`${mono ? "font-mono text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="p-4 border rounded-lg text-center bg-primary/5">
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">
        {label}
      </p>
      <p className="text-xl font-bold text-primary leading-none">
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-1">
        {sub}
      </p>
    </div>
  );
}
