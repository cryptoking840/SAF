import { useCallback, useEffect, useState } from "react";
import AppLayout from "../../layout/AppLayout";
import Modal from "../../components/Modal";
import CertificateDetails from "../../components/CertificateDetails";

const formatCertificateId = (certificateId) => {
  if (certificateId === null || certificateId === undefined) {
    return "Not generated";
  }

  return `SAF-${String(certificateId).padStart(6, "0")}`;
};

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApprovedCertificates = useCallback(async () => {
    try {
      setError("");

      const res = await fetch("http://localhost:5000/api/saf");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch certificates");
      }

      const approvedCertificates = data
        .filter((batch) => batch.certificateId !== null && batch.certificateId !== undefined)
        .filter((batch) => batch.status === "APPROVED" || batch.status === "LISTED")
        .map((batch) => ({
          id: formatCertificateId(batch.certificateId),
          key: `${batch._id}-${batch.certificateId}`,
          batchId: batch.productionBatchId,
          issueDate: new Date(batch.updatedAt).toLocaleDateString(),
          quantity: batch.quantity,
          status: batch.status === "LISTED" ? "Listed for Sale" : "Certified",
          txHash: batch.txHash,
        }));

      setCertificates(approvedCertificates);
    } catch (err) {
      console.error("Fetch certificates error:", err);
      setError(err.message || "Unable to load certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchApprovedCertificates();

    const refreshTimer = setInterval(fetchApprovedCertificates, 30000); // Polling every 30 seconds

    return () => clearInterval(refreshTimer);
  }, [fetchApprovedCertificates]);

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
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  Loading certificates...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  No approved certificates yet.
                </td>
              </tr>
            ) : (
              certificates.map((cert) => (
                <tr key={cert.key} className="border-t hover:bg-gray-50">
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
                  <td className="px-6 py-4"><CertificateStatusBadge status={cert.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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


function CertificateStatusBadge({ status }) {
  const listed = status === "Listed for Sale";
  return (
    <span className={`px-3 py-1 text-xs rounded-full font-bold ${listed ? "bg-primary/20 text-green-700" : "bg-blue-100 text-blue-700"}`}>
      {status}
    </span>
  );
}
