import { useState } from "react";
import RegistryLayout from "../../layout/RegistryLayout";

export default function RetirementApprovals() {
  const [selected, setSelected] = useState(0);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const requests = [
    {
      id: "CERT-9901",
      airline: "Global Airways",
      quantity: "50,000 MT",
      region: "EU ETS",
      purpose: "Carbon Neutrality 2024",
      status: "Pending",
    },
    {
      id: "CERT-8842",
      airline: "SkyHigh Intl",
      quantity: "12,500 MT",
      region: "CORSIA",
      purpose: "Net Zero 2050",
      status: "Pending",
    },
  ];

  const active = requests[selected];

  return (
    <RegistryLayout>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">
          Certificate Retirement Approval
        </h2>
      </div>

      <div className="flex gap-8">

        {/* TABLE */}
        <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-6 py-4">Certificate</th>
                <th className="px-6 py-4">Airline</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {requests.map((req, index) => (
                <tr
                  key={index}
                  onClick={() => setSelected(index)}
                  className={`cursor-pointer transition ${
                    selected === index
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 font-bold">{req.id}</td>
                  <td className="px-6 py-4">{req.airline}</td>
                  <td className="px-6 py-4">{req.quantity}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold">
                      {req.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {req.purpose}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-amber-600 font-bold text-xs">
                      ● Pending
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SIDE PANEL */}
        <aside className="w-96 space-y-6">

          {/* PREVIEW */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h4 className="font-bold mb-4">Certificate Preview</h4>

            <div className="border p-4 rounded-lg space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Issued To
                </p>
                <p className="font-bold">{active.airline}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Quantity Retired
                </p>
                <p className="font-bold text-primary">
                  {active.quantity}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  ESG Intent
                </p>
                <p className="italic text-gray-600">
                  {active.purpose}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowApprove(true)}
                className="w-full bg-primary text-background-dark py-3 rounded-lg font-bold"
              >
                Approve Retirement
              </button>

              <button
                onClick={() => setShowReject(true)}
                className="w-full border border-gray-200 text-rose-600 py-2 rounded-lg font-bold"
              >
                Reject Request
              </button>
            </div>
          </div>

          {/* AUDIT TRAIL */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h4 className="font-bold mb-4">Audit Trail</h4>

            <div className="space-y-3 text-sm">
              <p>
                ✔ Request Submitted – Oct 24, 09:42 AM
              </p>
              <p>
                ✔ Eligibility Verified – Oct 24, 11:15 AM
              </p>
              <p className="text-amber-600 font-bold">
                ● Awaiting Final Authorization
              </p>
            </div>
          </div>

        </aside>
      </div>

      {/* APPROVE MODAL */}
      {showApprove && (
        <Modal
          title="Confirm Retirement"
          description="This action will permanently burn this certificate from registry."
          onClose={() => setShowApprove(false)}
        />
      )}

      {/* REJECT MODAL */}
      {showReject && (
        <RejectModal onClose={() => setShowReject(false)} />
      )}

    </RegistryLayout>
  );
}

/* ---------- MODALS ---------- */

function Modal({ title, description, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {description}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-2 rounded-lg font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-primary text-background-dark py-2 rounded-lg font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h3 className="font-bold text-lg mb-3">
          Reject Retirement
        </h3>
        <textarea
          className="w-full border rounded-lg p-3 text-sm mb-4"
          placeholder="Provide reason..."
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-2 rounded-lg font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-bold"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
