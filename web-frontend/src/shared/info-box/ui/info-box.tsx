import React from "react";
import InfoBoxProps from "@/shared/info-box/model/info-box-model";

/**
 * A reusable component that renders an informational box displaying a title, value,
 * optional change indicator with color coding, and an optional footer.
 *
 * @param {string} title - The title of the info box.
 * @param {number} value - The main value to display in the box.
 * @param {number} [change] - Optional change percentage or value (e.g., "+8%").
 * @param {string} [color] - Optional CSS class for the color indicator dot.
 * @param {React.ReactNode} [footer] - Optional footer content, such as buttons or additional text.
 * @returns {JSX.Element} A React element representing the info box.
 */
const InfoBox: React.FC<InfoBoxProps> = ({ title, value, change, color }) => {
  return (
    <div className="bg-white rounded p-4 shadow flex flex-col justify-between h-28">
      <div className="flex items-center justify-normal mb-2">
        {color && (
          <span className={`w-3 h-3 rounded-full ${color} mr-2`}></span>
        )}
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="text-xl font-bold"> ${value}</div>
      {change && (
        <div
          className={`text-sm font-semibold ${
            change > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {change > 0 ? `+${change}` : `${change}`}% vs last period
        </div>
      )}
    </div>
  );
};

export default InfoBox;
