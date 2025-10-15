"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../widgets/navbar/ui/navbar";
import Searchbar from "@/widgets/searchbar/ui/searchbar";
import TimeRange from "@/features/select-time-range/ui/select-time-range";
import InfoBox from "@/shared/info-box/ui/info-box";
import PlaceholderChart from "@/widgets/charts/ui/charts";
import Table from "@/widgets/table/ui/table";
import { PortfolioAPI, ApiError, Portfolio } from "@/shared/api-layer";

/**
 * Renders the main dashboard page for the crypto application, including the sidebar
 * navigation, search bar, time range selector, informational boxes, placeholder charts,
 * and a table of bought coins.
 *
 * @export
 * @returns {JSX.Element} A React element representing the dashboard page layout.
 */
export default function CryptoDashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches the user's portfolio on initial render.
   *
   * Handles API success and error cases:
   * - On success: stores the fetched portfolio in state.
   * - On error: extracts a readable message (supports ApiError from api-layer and generic Error).
   * - clears the loading state when finished.
   *
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const portfolio = await PortfolioAPI.get(undefined, true);
        if (portfolio) {
          setPortfolio(portfolio);
        }
      } catch (e: unknown) {
        let msg = "Unknown error";
        if (e instanceof ApiError) {
          msg = e.status ? `${e.message} (status ${e.status})` : e.message;
        } else if (e instanceof Error) {
          msg = e.message;
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const tableConfig = {
    headers: ["Coin", "Amount", "Buy Price", "Current Price", "Profit/Loss"],
  };

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
          <div className="flex flex-row w-full h-full">
            {!isLoading && portfolio.length > 0 ? (
              portfolio.map((card: Portfolio, index: number) => {
                return (
                  <div key={index} className="w-1/5 mr-3 h-full mb-6">
                    <InfoBox
                      id={card.id}
                      owner={card.owner}
                      assets={card.assets}
                      joined={card.joined}
                    />
                  </div>
                );
              })
            ) : (
              <p>An error occured: ${error}</p>
            )}
          </div>
          <PlaceholderChart />
          {/* Simple table for bought coins */}
          <Table tableConfig={tableConfig} />
        </section>
      </main>
    </div>
  );
}
