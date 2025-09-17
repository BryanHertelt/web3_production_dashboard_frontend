import React from "react";

interface InfoBoxProps {
  title: string;
  value: string;
  change?: string;
  color?: string;
  footer?: React.ReactNode;
}

const InfoBox: React.FC<InfoBoxProps> = ({
  title,
  value,
  change,
  color,
  footer,
}) => {
  return (
    <div className="bg-white rounded p-4 shadow flex flex-col justify-between">
      <div className="flex items-center justify-normal mb-2">
        {color && (
          <span className={`w-3 h-3 rounded-full ${color} mr-2`}></span>
        )}
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {change && (
        <div
          className={`text-sm font-semibold ${
            change.startsWith("+") ? "text-green-600" : "text-red-600"
          }`}
        >
          {change} vs last period
        </div>
      )}
      {footer}
    </div>
  );
};

export default InfoBox;
