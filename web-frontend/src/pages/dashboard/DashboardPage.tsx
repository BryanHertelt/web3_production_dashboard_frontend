import React from "react";
import Navbar from "../../widgets/example-widget/ui/Navbar";
import Searchbar from "@/widgets/example-widget/ui/Searchbar";
import TimeRange from "@/features/select-time-range";

const summaryData = [
  {
    title: "Revenue",
    value: "$25,680",
    change: "+8%",
    color: "bg-purple-500",
  },
  {
    title: "Transactions",
    value: "$18,420",
    change: "+5%",
    color: "bg-blue-400",
  },
  {
    title: "Refunds",
    value: "$3,260",
    change: "-2%",
    color: "bg-orange-400",
  },
  {
    title: "USD balance",
    value: "$25,680",
  },
  {
    title: "Pending payouts",
    value: "$12,340",
  },
];

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
          <div className="grid grid-cols-5 gap-4 mb-6">
            {summaryData.map(({ color, title, value, change }, idx) => (
              <div
                key={idx}
                className="bg-white rounded p-4 shadow flex flex-col justify-between"
              >
                <div className="flex items-center justify-normal mb-2">
                  {color && (
                    <span
                      className={`w-3 h-3 rounded-full ${color} mr-2`}
                    ></span>
                  )}
                  <h2 className="font-semibold">{title}</h2>
                </div>
                <div className="text-xl font-bold">{value}</div>
                {change && (
                  <div
                    className={`text-sm font-semibold ${
                      change.startsWith("+") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {change} vs last period
                  </div>
                )}
                {!change && title === "USD balance" && (
                  <button className="mt-2 w-full border border-gray-300 rounded py-1 text-sm">
                    Withdraw balance
                  </button>
                )}
                {!change && title === "Pending payouts" && (
                  <>
                    <div className="mt-2 text-sm">Expected:</div>
                    <button className="mt-1 w-full border border-gray-300 rounded py-1 text-sm">
                      View more
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded p-6 shadow h-48 flex items-center justify-center text-gray-400">
              Chart placeholder 1
            </div>
            <div className="bg-white rounded p-6 shadow h-48 flex items-center justify-center text-gray-400">
              Chart placeholder 2
            </div>
            <div className="bg-white rounded p-6 shadow h-48 flex items-center justify-center text-gray-400">
              Chart placeholder 3
            </div>
          </div>
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
