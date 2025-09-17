import React from "react";
import Navbar from "../../widgets/example-widget/ui/navbar";
import Searchbar from "@/widgets/example-widget/ui/searchbar";
import TimeRange from "@/features/select-time-range";
import InfoBoxes from "@/widgets/example-widget/ui/info-boxes";
import PlaceholderChart from "@/widgets/example-widget/ui/charts";
import Table from "@/widgets/example-widget/ui/table";

/**
 * A full-page dashboard layout for cryptocurrency analytics.
 *
 * @remarks
 * - Includes a sidebar (`Navbar`) for navigation.
 * - The top bar contains a `Searchbar`.
 * - Main dashboard content includes:
 *   - `TimeRange` selector
 *   - `InfoBoxes` with key metrics
 *   - `PlaceholderChart` for visualization
 *   - `Table` showing coin data
 *
 * @example
 * ```tsx
 * <CryptoDashboard />
 * ```
 */

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
          <Table />
        </section>
      </main>
    </div>
  );
}
