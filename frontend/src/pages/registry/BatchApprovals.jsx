import { useState, useEffect } from "react";
import RegistryLayout from "../../layout/RegistryLayout";
import BatchDetails from "../../components/BatchDetails";
import Modal from "../../components/Modal";

export default function BatchApprovals() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBatches = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/saf/status?status=INSPECTED"
      );
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/saf/status?status=INSPECTED")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const openModal = (batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBatch(null);
    setIsModalOpen(false);
    fetchBatches(); // refresh after approval
  };

  return (
    <RegistryLayout active="batch-approvals">

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
            {batches.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-400">
                  No batches pending registry approval.
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch._id} className="border-t hover:bg-gray-50">

                  <td className="px-6 py-4">
                    <button
                      onClick={() => openModal(batch)}
                      className="text-blue-600 font-bold hover:underline"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedBatch && (
          <BatchDetails
            batch={selectedBatch}
            onClose={closeModal}
          />
        )}
      </Modal>

    </RegistryLayout>
  );
}
