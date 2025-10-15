import React from "react";
import InfoBoxProps from "@/shared/info-box/model/info-box-model";

/**
 * A reusable component that renders an informational box displaying a title, value,
 * optional change indicator with color coding, and an optional footer.
 *
 * @param {string} owner - The title of the info box.
 * @param {number} value - The main value to display in the box.
 * @param {number} [change] - Optional change percentage or value (e.g., "+8%").
 * @param {string} [color] - Optional CSS class for the color indicator dot.
 * @param {React.ReactNode} [footer] - Optional footer content, such as buttons or additional text.
 * @returns {JSX.Element} A React element representing the info box.
 */
const InfoBox: React.FC<InfoBoxProps> = ({ id, owner, assets, joined }) => {
  return (
    <div className="bg-white rounded p-4 shadow flex flex-col justify-between h-35">
      <div className="flex items-center justify-normal mb-2">
        <h2 className="font-semibold">{id}</h2>
      </div>
      <div className="text-xl font-bold"> {owner}</div>
      <div className="text-l"> {assets}</div>
      <div className="text-l"> {joined}</div>
    </div>
  );
};

export default InfoBox;
