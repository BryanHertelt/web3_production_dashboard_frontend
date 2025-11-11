import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Toast, ToastContextType } from "../model/types";

/**
 * @context ToastContext
 * Provides global state and functions for showing and removing toast notifications.
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * @component ToastProvider
 * @description
 * Wraps the application and manages toast notifications.
 * Exposes `addToast` and `removeToast` functions through context.
 *
 * @param {{ children: React.ReactNode }} props - Child components to render inside the provider.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 *   <ToastContainer />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const MAX_TOASTS = 7;

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info", duration = 3000) => {
      const id = crypto.randomUUID();
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        return updated.slice(-MAX_TOASTS);
      });

      const timeoutId = setTimeout(() => removeToast(id), duration);
      timeoutsRef.current[id] = timeoutId;
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * @hook useToast
 * @description
 * Accesses the toast context for managing toasts.
 * Throws an error if called outside of `ToastProvider`.
 *
 * @returns {ToastContextType} The current toast context (toasts, addToast, removeToast).
 *
 * @example
 * ```tsx
 * const { addToast } = useToast();
 * addToast("Saved successfully!", "success");
 * ```
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
