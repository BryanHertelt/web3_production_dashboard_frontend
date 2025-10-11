"use client";

import React, { useEffect, useState } from "react";
import { TableRow, TableProps } from "@/widgets/table/model/table-model";
import { ApiError } from "@/shared/api-layer/index";
import { UsersAPI } from "@/entities/users/api/users-api";

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
  /**
   * @useEffect Fetches data from the UsersAPI on load.
   * @mounted flag prevents state updates(setData, setError) if component unmounts before fetch completes.
   * We tell @getAll what type we expect: TableRow[]Passing `true` enables the cancel-registry to abort a previous call of the same type.
   * @ApiError checks to differentiate between known API errors and unknown errors and show a user-friendly message.
   * @message and @status from ApiError are used to create user-friendly error messages.
   * @returns a cleanup function that sets the mounted flag to false on unmount to prevent state updates on an unmounted component.
   */

  useEffect(() => {
    async function loadData() {
      try {
        const users = await UsersAPI.get<TableRow[]>(undefined, true);
        if (users) {
          setData(users);
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
