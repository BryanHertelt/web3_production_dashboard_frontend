import React from "react";

const chartConfig =
  "bg-white rounded p-6 shadow h-48 flex items-center justify-center text-gray-400";
/**
 * PlaceholderChart component
 *
 * Displays a grid of placeholder boxes styled to represent charts.
 * Useful during development, skeleton loading states, or when chart
 * data is not yet available.
 *
 * @component
 * @example
 * ```tsx
 * <PlaceholderChart />
 * ```
 *
 * @returns {JSX.Element} A three-column grid with chart placeholders
 */
const PlaceholderChart: React.FC = () => (
  <div className="grid grid-cols-3 gap-4">
    <div className={chartConfig}>Chart placeholder 1</div>
    <div className={chartConfig}>Chart placeholder 2</div>
    <div className={chartConfig}>Chart placeholder 3</div>
  </div>
);

export default PlaceholderChart;
