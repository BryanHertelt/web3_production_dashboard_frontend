import React from "react";

/**
 * Props for the InfoBox component.
 */
interface InfoBoxProps {
  /**
   * Title displayed at the top of the box.
   */
  title: string;

  /**
   * Main value shown prominently in the box.
   */
  value: string;

  /**
   * Optional change indicator compared to a previous period.
   * If provided, positive values should start with `+` to render in green,
   * while negative values render in red.
   */
  change?: string;

  /**
   * Optional Tailwind color class applied to the small circle indicator.
   * Example: `"bg-blue-500"`.
   */
  color?: string;

  /**
   * Optional footer content rendered at the bottom of the box.
   */
  footer?: React.ReactNode;
}
/**
 * A card-like component for displaying key metrics, such as statistics
 * with an optional trend indicator and footer.
 *
 * @example
 * ```tsx
 * <InfoBox
 *   title="Revenue"
 *   value="$25,000"
 *   change="+5%"
 *   color="bg-green-500"
 *   footer={<span className="text-xs text-gray-500">Updated 5m ago</span>}
 * />
 * ```
 */
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
