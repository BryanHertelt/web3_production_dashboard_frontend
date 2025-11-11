import React from "react";
import { SpinnerProps, SpinnerSize } from "../model/types";

/**
 * @constant sizeClasses
 * @description
 * Maps spinner size variants to corresponding Tailwind CSS classes
 * for consistent dimensions and border thickness.
 */
const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

/**
 * @component Spinner
 * @description
 * A simple, reusable loading spinner that visually indicates
 * that a background operation (e.g. API call or data fetch) is in progress.
 *
 * The spinner is animated using Tailwind's `animate-spin` utility
 * and can optionally display a text label below it.
 *
 * @param {SpinnerProps} props - Component props.
 * @param {"sm" | "md" | "lg"} [props.size="md"] - Size variant of the spinner.
 * @param {string} [props.label] - Optional text displayed under the spinner.
 * @param {string} [props.className] - Additional custom Tailwind classes.
 *
 * @example
 * ```tsx
 * <Spinner size="lg" label="Loading data..." />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  label,
  className = "",
}) => (
  <div className="flex flex-col items-center justify-center">
    <div
      className={`rounded-full border-gray-300 border-t-blue-500 animate-spin ${sizeClasses[size]} ${className}`}
    />
    {label && <span className="mt-2 text-sm text-gray-500">{label}</span>}
  </div>
);
