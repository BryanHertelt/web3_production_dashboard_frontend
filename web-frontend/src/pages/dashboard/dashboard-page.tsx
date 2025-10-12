"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../widgets/navbar/ui/navbar";
import Searchbar from "@/widgets/searchbar/ui/searchbar";
import TimeRange from "@/features/select-time-range/ui/select-time-range";
import InfoBox from "@/shared/info-box/ui/info-box";
import PlaceholderChart from "@/widgets/charts/ui/charts";
import Table from "@/widgets/table/ui/table";
import logger from "@/lib/model/logger";

interface Card {
  id: number;
  owner: string;
  assets: string;
  joined: string;
}

function testOperationLogging() {
  // @ts-expect-error - Pino bindings allow custom properties
  const opLogger = logger.startOperation("test_operation");

  opLogger.info("First log entry");
  opLogger.info("Second log entry");
  opLogger.warn("Warning entry");
  opLogger.info("Third log entry");
  opLogger.error("Error entry");

  opLogger.endOperation();
}

// Run logging tests only once
if (typeof window !== "undefined") {
  testOperationLogging();

  logger.debug({ userId: "123", action: "login" }, "User logged in");

  // Operation 1: Sampled Logging Test
  // @ts-expect-error - Pino bindings allow custom properties
  const opLogger1 = logger.startOperation("sampled_logging_test");
  const sampledLogger = opLogger1.withSampleRate(0.1); // 10% Rate
  sampledLogger.info("Maybe sent"); // 10% Chance
  opLogger1.endOperation();

  // Operation 2: Fifty Percent Test
  // @ts-expect-error - Pino bindings allow custom properties
  const opLogger2 = logger.startOperation("fifty_percent_test");
  const Loggerfifty = opLogger2.withSampleRate(0.5);
  Loggerfifty.info("Fifty Chance");
  opLogger2.endOperation();

  // Operation 3: Dashboard Loading
  // @ts-expect-error - Pino bindings allow custom properties
  const opLogger3 = logger.startOperation("dashboard_loading");
  opLogger3.info("Dashboard successfully loaded");
  opLogger3.warn("Dashboard loaded not correctly");
  opLogger3.error("Dashboard loaded with an error");
  opLogger3.fatal("Dashboard crashed");
  opLogger3.endOperation();
}

/**
 * Renders the main dashboard page for the crypto application, including the sidebar
 * navigation, search bar, time range selector, informational boxes, placeholder charts,
 * and a table of bought coins.
 *
 * @export
 * @returns {JSX.Element} A React element representing the dashboard page layout.
 */
export default function CryptoDashboard() {
  const [cardData, setCardData] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawCardData = await fetch("http://localhost:8000/portfolio");
        const data = await rawCardData.json();
        console.log(data);
        setCardData(data);
      } catch (error) {
        console.log(`An error occured ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
            {!isLoading && cardData.length > 0
              ? cardData.map((card: Card, index: number) => {
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
