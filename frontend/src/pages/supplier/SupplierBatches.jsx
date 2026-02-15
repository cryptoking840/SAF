import DashboardLayout from "../../layout/DashboardLayout";

export default function SupplierBatches() {
  const batches = [
    {
      id: "SAF-98231",
      quantity: 450,
      date: "12 Oct 2023",
      status: "Pending",
    },
    {
      id: "SAF-87120",
      quantity: 1200.5,
      date: "05 Oct 2023",
      status: "Approved",
    },
    {
      id: "SAF-77211",
      quantity: 800,
      date: "28 Sep 2023",
      status: "Traded",
    },
  ];

  const statusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Approved":
        return "bg-blue-100 text-blue-700";
      case "Traded":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-6">My SAF Batches</h2>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Certificate ID</th>
              <th className="px-6 py-4">Quantity (MT)</th>
              <th className="px-6 py-4">Production Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">
                  {batch.id}
                </td>

                <td className="px-6 py-4">
                  {batch.quantity}
                </td>

                <td className="px-6 py-4">
                  {batch.date}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(
                      batch.status
                    )}`}
                  >
                    {batch.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
