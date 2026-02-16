import { useState } from "react";

export default function RegistryBatchDetails({ batch, onClose }) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(batch.txHash || null);
  const [certificateId, setCertificateId] = useState(batch.certificateId || null);
  const [status, setStatus] = useState(batch.status);
  const [lastUpdated, setLastUpdated] = useState(batch.updatedAt);

  const approveAndRegister = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/saf/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: batch._id })
      });

      const data = await res.json();

      if (res.ok) {
        setTxHash(data.txHash);
        setCertificateId(data.certificateId);
        setStatus("APPROVED");
        setLastUpdated(new Date().toISOString());
      } else {
        alert(data.error || "Approval failed");
      }

    } catch (err) {
      console.error(err);
      alert("Blockchain transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 w-[700px]">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-black">
            {batch.productionBatchId}
          </h2>
          <p className="text-sm text-gray-500">
            Registry Review
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black"
        >
          ✕
        </button>
      </div>

      {/* Supplier Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">
          Supplier Submission
        </h3>

        <Detail
          label="Production Date"
          value={new Date(batch.productionDate).toLocaleDateString()}
        />
        <Detail
          label="Quantity"
          value={`${batch.quantity} MT`}
        />
        <Detail
          label="Feedstock"
          value={batch.feedstockType}
        />
        <Detail
          label="Carbon Intensity"
          value={batch.carbonIntensity}
        />
        <Detail
          label="Pathway"
          value={batch.productionPathway}
        />
      </div>

      {/* Inspector Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">
          Inspector Review
        </h3>

        <Detail label="Status" value={status} />
        <Detail
          label="Last Updated"
          value={new Date(lastUpdated).toLocaleString()}
        />
      </div>

      {/* Blockchain Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">
          Blockchain Details
        </h3>

        <Detail
          label="Certificate ID"
          value={certificateId || "Not generated"}
        />

        <Detail
          label="Transaction Hash"
          value={
            txHash
              ? txHash
              : "Not registered yet"
          }
        />
      </div>

      {/* Action Button */}
      {status === "INSPECTED" && (
        <div className="flex justify-end mt-10">
          <button
            onClick={approveAndRegister}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-bold text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:opacity-90"
            }`}
          >
            {loading
              ? "Registering on Blockchain..."
              : "Approve & Register on Blockchain"}
          </button>
        </div>
      )}

    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between border-b pb-2 mb-2 text-sm">
      <span className="font-semibold">{label}</span>
      <span className="break-all text-right">{value}</span>
    </div>
  );
}
