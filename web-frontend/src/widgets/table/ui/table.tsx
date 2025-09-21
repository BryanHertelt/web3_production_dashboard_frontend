"use client";

import React, { useEffect, useState } from "react";
import { TableRow, TableProps } from "@/widgets/table/model/table-model";

/**
 * Renders a table displaying data for bought coins, including columns for
 * coin name, amount, buy price, current price, and profit/loss. It fetches
 * data from an API endpoint and displays any errors encountered during fetching.
 *
 * @returns {JSX.Element} A React element containing the table with fetched data.
 */
const Table = (props: { tableConfig: TableProps }) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder API URL - replace with actual endpoint
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/users");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result: TableRow[] = await response.json();
        setData(result);
        setError(null); // Clear error on success
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError(`Error occured: ${error}`);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded p-6 shadow mt-6 overflow-auto">
      <h2 className="text-lg font-semibold mb-4">Bought Coins</h2>
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {props.tableConfig.headers.map((header, index) => (
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
          {data.map((row, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-2">{row.coin}</td>
              <td className="border border-gray-300 px-4 py-2">{row.amount}</td>
              <td className="border border-gray-300 px-4 py-2">
                {row.buyPrice}
              </td>
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
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 font-bold">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default Table;
