import { useState, useEffect } from "react";
import InspectorLayout from "../../layout/InspectorLayout";
import Modal from "../../components/Modal";
import BatchDetails from "../../components/BatchDetails";


export default function InspectionQueue() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBatches = async () => {
    const res = await fetch(
      "http://localhost:5000/api/saf/status?status=SUBMITTED"
    );
    const data = await res.json();
    setBatches(data);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openModal = (batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBatch(null);
    setIsModalOpen(false);
  };

  const approveBatch = async () => {
    await fetch("http://localhost:5000/api/saf/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedBatch._id })
    });

    closeModal();
    fetchBatches();
  };

  const rejectBatch = async () => {
    await fetch("http://localhost:5000/api/saf/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedBatch._id })
    });

    closeModal();
    fetchBatches();
  };

  return (
    <InspectorLayout active="queue">

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Feedstock</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {batches.map((batch) => (
              <tr key={batch._id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button
                    onClick={() => openModal(batch)}
                    className="text-primary font-bold hover:underline"
                  >
                    {batch.productionBatchId}
                  </button>
                </td>

                <td className="px-6 py-4">
                  {batch.feedstockType}
                </td>

                <td className="px-6 py-4">
                  {batch.quantity} MT
                </td>

                <td className="px-6 py-4">
                  {batch.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedBatch && (
          <BatchDetails
            batch={selectedBatch}
            onApprove={approveBatch}
            onReject={rejectBatch}
            onClose={closeModal}
          />
        )}
      </Modal>

    </InspectorLayout>
  );
}
