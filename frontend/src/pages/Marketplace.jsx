import DashboardLayout from "../layout/DashboardLayout";

export default function Marketplace() {

  return (
    <DashboardLayout title="Marketplace">

      <div className="bg-white p-6 rounded-xl shadow">

        <h3 className="text-lg font-bold mb-4">
          Active Listings
        </h3>

        <div className="border rounded-lg p-4 mb-4">
          <p><strong>Certificate ID:</strong> 4</p>
          <p><strong>Available:</strong> 500 MT</p>
          <p><strong>Highest Bid:</strong> 300 MT</p>

          <div className="flex gap-3 mt-4">
            <button className="px-4 py-2 bg-green-500 text-white rounded">
              Accept Bid
            </button>

            <button className="px-4 py-2 bg-red-500 text-white rounded">
              Reject
            </button>
          </div>
        </div>

      </div>

    </DashboardLayout>
  );
}

