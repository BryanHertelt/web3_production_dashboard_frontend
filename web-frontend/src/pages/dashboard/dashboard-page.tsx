import React from "react";
import Navbar from "../../widgets/example-widget/ui/Navbar";
import Searchbar from "@/widgets/example-widget/ui/Searchbar";
import TimeRange from "@/features/select-time-range";
import InfoBoxes from "@/widgets/example-widget/ui/info-boxes";
import PlaceholderChart from "@/widgets/example-widget/ui/charts";

export default function CryptoDashboard() {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <Navbar />
      {/* Main content */}
      <main className="flex-grow p-6 overflow-auto">
        {/* Top bar */}
        <Searchbar />
        {/* Dashboard content */}
        <section>
          <TimeRange />
          <InfoBoxes />
          <PlaceholderChart />
          {/* Simple table for bought coins */}
          <div className="bg-white rounded p-6 shadow mt-6 overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Bought Coins</h2>
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Coin
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Buy Price
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Current Price
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Profit/Loss
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Bitcoin (BTC)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">1.5</td>
                  <td className="border border-gray-300 px-4 py-2">$40,000</td>
                  <td className="border border-gray-300 px-4 py-2">$45,000</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">
                    +$7,500
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Ethereum (ETH)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">10</td>
                  <td className="border border-gray-300 px-4 py-2">$2,500</td>
                  <td className="border border-gray-300 px-4 py-2">$2,300</td>
                  <td className="border border-gray-300 px-4 py-2 text-red-600">
                    -$2,000
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Cardano (ADA)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">5000</td>
                  <td className="border border-gray-300 px-4 py-2">$1.20</td>
                  <td className="border border-gray-300 px-4 py-2">$1.50</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">
                    +$1,500
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
