import React from "react";

interface TableRow {
  coin: string;
  amount: string;
  buyPrice: string;
  currentPrice: string;
  profitLoss: string;
  profitClass: string;
}

const tableConfig = {
  headers: ["Coin", "Amount", "Buy Price", "Current Price", "Profit/Loss"],
  data: [
    {
      coin: "Bitcoin (BTC)",
      amount: "1.5",
      buyPrice: "$40,000",
      currentPrice: "$45,000",
      profitLoss: "+$7,500",
      profitClass: "text-green-600",
    },
    {
      coin: "Ethereum (ETH)",
      amount: "10",
      buyPrice: "$2,500",
      currentPrice: "$2,300",
      profitLoss: "-$2,000",
      profitClass: "text-red-600",
    },
    {
      coin: "Cardano (ADA)",
      amount: "5000",
      buyPrice: "$1.20",
      currentPrice: "$1.50",
      profitLoss: "+$1,500",
      profitClass: "text-green-600",
    },
  ],
};

const Table = () => (
  <div className="bg-white rounded p-6 shadow mt-6 overflow-auto">
    <h2 className="text-lg font-semibold mb-4">Bought Coins</h2>
    <table className="min-w-full table-auto border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          {tableConfig.headers.map((header, index) => (
            <th
              key={index}
              className="border border-gray-300 px-4 py-2 text-left"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableConfig.data.map((row, index) => (
          <tr key={index}>
            <td className="border border-gray-300 px-4 py-2">{row.coin}</td>
            <td className="border border-gray-300 px-4 py-2">{row.amount}</td>
            <td className="border border-gray-300 px-4 py-2">{row.buyPrice}</td>
            <td className="border border-gray-300 px-4 py-2">
              {row.currentPrice}
            </td>
            <td
              className={`border border-gray-300 px-4 py-2 ${row.profitClass}`}
            >
              {row.profitLoss}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
