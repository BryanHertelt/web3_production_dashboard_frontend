import React, { useEffect, useState } from "react";
import { Toast as ToastType } from "../model/types";
import SuccessIcon from "@/shared/assets/icons/ui/feedback/toast/success.svg";
import ErrorIcon from "@/shared/assets/icons/ui/feedback/toast/error.svg";
import InfoIcon from "@/shared/assets/icons/ui/feedback/toast/info.svg";
import WarningIcon from "@/shared/assets/icons/ui/feedback/toast/warning.svg";

/**
 * @constant typeStyles
 * Background/text color for each toast type.
 */
const toastColor: Record<NonNullable<ToastType["type"]>, string> = {
  success: "#00E07D",
  error: "#EF4444",
  info: "#306DDE",
  warning: "#FFD21F",
};

/**
 * @constant typeTitles
 * Fixed titles per toast type.
 */
const typeTitles: Record<NonNullable<ToastType["type"]>, string> = {
  success: "Action Completed",
  error: "Error Occurred",
  info: "Information",
  warning: "Action Required",
};

/**
 * @constant defaultMessages
 * Default messages per toast type (used if no message is passed).
 */
const defaultMessages: Record<NonNullable<ToastType["type"]>, string> = {
  success: "Your action was successful.",
  error: "Something went wrong. Please try again.",
  info: "Here’s some additional information.",
  warning: "Please check the details and try again.",
};

/**
 * @constant typeIcons
 * Maps toast types to SVG icons.
 */
const typeIcons: Record<
  NonNullable<ToastType["type"]>,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  warning: WarningIcon,
};

/**
 * @component Toast
 * Displays a brief notification with icon, title, message,
 * and a progress line that visually counts down its duration.
 */
export const Toast: React.FC<ToastType & { onClose: () => void }> = ({
  message,
  type = "info",
  onClose,
  duration = 3000,
}) => {
  const title = typeTitles[type];
  const displayMessage = message || defaultMessages[type];
  const Icon = typeIcons[type];

  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const newProgress = Math.max(100 - (elapsed / duration) * 100, 0);
      setProgress(newProgress);

      if (elapsed < duration) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return (
    <div
      className={`relative px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-all cursor-pointer w-[90vw] sm:w-[360px] md:w-[400px]
          shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] bg-[linear-gradient(to_right,var(--toast-color)_0%,#191a1f_35%,#191a1f_100%)]
      `}
      role="alert"
      aria-live="assertive"
      onClick={onClose}
      style={{
        ["--toast-color" as string]: `${toastColor[type]}33`,
      }}
    >
      <div className="absolute inset-0 -z-10 rounded-lg bg-[#191a1f]" />
      <Icon
        className="w-6 h-6 flex-shrink-0 mt-1"
        aria-hidden="true"
        style={{
          color: toastColor[type],
          strokeWidth: "1.5px",
        }}
      />

      <div className="flex flex-col">
        <strong className="font-light text-white">{title}</strong>
        <p className="text-sm font-extralight mt-0.5 text-white/60 line-clamp-2">
          {displayMessage}
        </p>
      </div>

      <div
        className="absolute bottom-0 ml-[1.5px] left-1 h-[2px] rounded-b-full transition-[width] ease-linear overflow-hidden"
        style={{
          width: `${0.95 * progress}%`,
          backgroundColor: toastColor[type],
        }}
      />
    </div>
  );
};
