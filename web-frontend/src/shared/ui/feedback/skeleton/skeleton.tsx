import React from "react";
import { SkeletonProps } from "../spinner/model/types";

/**
 * Skeleton
 *
 * A lightweight placeholder component used to indicate loading content.
 * It renders a pulsing gray block that mimics the shape of the content being loaded.
 *
 * **Props:**
 * - `width` — Width of the skeleton (default: "100%").
 * - `height` — Height of the skeleton (default: "1rem").
 * - `className` — Optional additional Tailwind classes.
 * - `rounded` — Border radius for shape customization (default: "0.25rem").
 *
 * **Usage:**
 * ```tsx
 * <Skeleton width="200px" height="20px" rounded="8px" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "1rem",
  className = "",
  rounded = "0.25rem",
}) => (
  <div
    className={`animate-pulse bg-gray-300 ${className}`}
    style={{
      width,
      height,
      borderRadius: rounded,
    }}
  />
);
