import React from "react";
/**
 * A button group for selecting a time range filter.
 *
 * @remarks
 * - Renders predefined time range options: `"Last 24h"`, `"Last week"`, `"Last month"`, `"Last year"`, `"All time"`.
 * - Currently static: the first option (`"Last 24h"`) is styled as active by default.
 * - Styling uses Tailwind CSS with hover and active states.
 *
 * @example
 * ```tsx
 * <TimeRange />
 * ```
 */
const TimeRange: React.FC = () => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-4">
      <div className="flex space-x-2">
        {["Last 24h", "Last week", "Last month", "Last year", "All time"].map(
          (label, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded border hover:bg-yellow-700 ${
                idx === 0
                  ? "bg-yellow-700 text-white border-yellow-800"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>
    </div>
  </div>
);

export default TimeRange;
