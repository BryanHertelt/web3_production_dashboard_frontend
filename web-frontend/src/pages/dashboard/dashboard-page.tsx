import React from "react";
import Navbar from "../../widgets/navbar/ui/navbar";
import Searchbar from "@/widgets/searchbar/ui/searchbar";
import TimeRange from "@/features/select-time-range/ui/select-time-range";
import InfoBox from "@/shared/info-box/ui/info-box";
import PlaceholderChart from "@/widgets/charts/ui/charts";
import Table from "@/widgets/table/ui/table";

interface Card {
  title: string;
  value: number;
  change?: number;
  color?: string;
}

/**
 * Renders the main dashboard page for the crypto application, including the sidebar
 * navigation, search bar, time range selector, informational boxes, placeholder charts,
 * and a table of bought coins.
 *
 * @export
 * @returns {JSX.Element} A React element representing the dashboard page layout.
 */
export default async function CryptoDashboard() {
  const fetchData = async () => {
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";
    try {
      const rawCardData = await fetch(`${apiUrl}/infocards`);
      const cardData = await rawCardData.json();
      return cardData;
    } catch (error) {
      console.error(`An error occured ${error}`);
    }
  };

  const cardData: Card[] = await fetchData();

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
            {cardData != undefined
              ? cardData.map((card: Card, index: number) => {
                  return (
                    <div key={index} className="w-1/5 mr-3 h-full mb-6">
                      <InfoBox
                        title={card.title}
                        value={card.value}
                        change={card.change}
                        color={card.color}
                      />
                    </div>
                  );
                })
              : null}
          </div>
          <PlaceholderChart />
          {/* Simple table for bought coins */}
          <Table tableConfig={tableConfig} />
        </section>
      </main>
    </div>
  );
}
