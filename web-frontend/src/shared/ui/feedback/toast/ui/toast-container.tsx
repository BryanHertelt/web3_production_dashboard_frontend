import React from "react";
import { useToast } from "./toast-context";
import { Toast } from "./toast";

/**
 * @component ToastContainer
 * @description
 * Renders all active toast notifications in a fixed
 * position on the screen (top-right corner).
 * Uses the `useToast` context to retrieve and manage toasts.
 *
 * @returns {JSX.Element} The list of visible toast components.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 *   <ToastContainer />
 * </ToastProvider>
 * ```
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};
