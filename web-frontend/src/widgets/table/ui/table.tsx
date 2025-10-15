"use client";

import React, { useEffect, useState } from "react";
import { ApiError } from "@/shared/api-layer/index";
import { CoinsAPI } from "@/entities/coins/api/coins-api";
import type { Coins } from "@/entities/coins/model/types";
import type { TableProps } from "@/widgets/table/model/table-model";

/**
 * Renders a table displaying data for bought coins, including columns for
 * coin name, amount, buy price, current price, and profit/loss. It fetches
 * data from an API endpoint and displays any errors encountered during fetching.
 *
 * @returns {JSX.Element} A React element containing the table with fetched data.
 */

const Table = (props: { tableConfig: TableProps }) => {
  const [data, setData] = useState<Coins[]>([]);
  const [error, setError] = useState<string | null>(null);
  /**
   * Fetches the user's portfolio on initial render.
   *
   * Handles API success and error cases:
   * - On success: stores the fetched coins in state.
   * - On error: extracts a readable message (supports ApiError from api-layer and generic Error).
   * - clears the loading state when finished.
   *
   */
  useEffect(() => {
    async function loadData() {
      try {
        const coins = await CoinsAPI.get(undefined, true);
        if (coins) {
          setData(coins);
        }
      } catch (e: unknown) {
        let msg = "Unknown error";
        if (e instanceof ApiError) {
          msg = e.status ? `${e.message} (status ${e.status})` : e.message;
        } else if (e instanceof Error) {
          msg = e.message;
        }
        setError(msg);
      }
    }

    loadData();
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
