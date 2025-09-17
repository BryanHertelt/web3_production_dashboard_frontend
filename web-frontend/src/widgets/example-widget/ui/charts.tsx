import React from "react";

const chartConfig =
  "bg-white rounded p-6 shadow h-48 flex items-center justify-center text-gray-400";

const PlaceholderChart: React.FC = () => (
  <div className="grid grid-cols-3 gap-4">
    <div className={chartConfig}>Chart placeholder 1</div>
    <div className={chartConfig}>Chart placeholder 2</div>
    <div className={chartConfig}>Chart placeholder 3</div>
  </div>
);

export default PlaceholderChart;
