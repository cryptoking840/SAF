import DashboardLayout from "../layout/DashboardLayout";

export default function IncomingBids() {
  const bids = [
    {
      airline: "SkyAir Global",
      price: 845,
      volume: 500,
      status: "Pending",
    },
    {
      airline: "Oceania Airways",
      price: 839.2,
      volume: 1200,
      status: "Countered",
    },
    {
      airline: "EuroConnect",
      price: 841,
      volume: 250,
      status: "Expired",
    },
  ];

  const statusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Countered":
        return "bg-blue-100 text-blue-700";
      case "Expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-6">Incoming Bids</h2>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Airline</th>
              <th className="px-6 py-4">Bid Price</th>
              <th className="px-6 py-4">Volume (MT)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bids.map((bid, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">
                  {bid.airline}
                </td>

                <td className="px-6 py-4">
                  ${bid.price}
                </td>

                <td className="px-6 py-4">
                  {bid.volume}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(
                      bid.status
                    )}`}
                  >
                    {bid.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center space-x-2">
                  <button className="px-3 py-1 bg-green-500 text-white text-xs rounded">
                    Accept
                  </button>
                  <button className="px-3 py-1 border text-xs rounded">
                    Counter
                  </button>
                  <button className="px-3 py-1 text-red-500 text-xs rounded">
                    Deny
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
