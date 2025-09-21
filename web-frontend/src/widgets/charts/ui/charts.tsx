import React from "react";

const chartConfig =
  "bg-white rounded p-6 shadow h-48 flex items-center justify-center text-gray-400";

/**
 * Renders a grid of three placeholder chart elements for display purposes.
 * Each placeholder is a styled div with centered text indicating it's a placeholder.
 *
 * @returns {JSX.Element} A React element containing a grid of placeholder charts.
 */
const PlaceholderChart: React.FC = () => (
  <div className="grid grid-cols-3 gap-4">
    <div className={chartConfig}>Chart placeholder 1</div>
    <div className={chartConfig}>Chart placeholder 2</div>
    <div className={chartConfig}>Chart placeholder 3</div>
  </div>
);

export default PlaceholderChart;
