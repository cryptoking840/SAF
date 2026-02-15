import { useState } from "react";
import AppLayout from "../../layout/AppLayout";
import Modal from "../../components/Modal";
import CertificateDetails from "../../components/CertificateDetails";

export default function Certificates() {

  const [certificates] = useState([
    {
      id: "SAF-2023-001",
      batchId: "Batch-882",
      issueDate: "Oct 12, 2023",
      quantity: 150.5,
      status: "Certified",
    },
    {
      id: "SAF-2023-002",
      batchId: "Batch-890",
      issueDate: "Oct 15, 2023",
      quantity: 210.0,
      status: "Certified",
    }
  ]);

  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (cert) => {
    setSelectedCertificate(cert);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCertificate(null);
    setIsModalOpen(false);
  };

  return (
    <AppLayout active="certificates">

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-4">Certificate ID</th>
              <th className="px-6 py-4">Batch</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {certificates.map((cert, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button
                    onClick={() => openModal(cert)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {cert.id}
                  </button>
                </td>
                <td className="px-6 py-4">{cert.batchId}</td>
                <td className="px-6 py-4">{cert.issueDate}</td>
                <td className="px-6 py-4 text-right">{cert.quantity}</td>
                <td className="px-6 py-4">{cert.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedCertificate && (
          <CertificateDetails
            certificate={selectedCertificate}
            onClose={closeModal}
          />
        )}
      </Modal>

    </AppLayout>
  );
}
