import React from "react";
import { ErrorBoundaryProps, ErrorBoundaryState } from "../spinner/model/types";
import { logger } from "@/shared/logger/client-logger/model/logger";

/**
 * ErrorBoundary
 *
 * A React component that catches errors in its child component tree,
 * logs them via the custom logger, and renders a fallback UI instead of crashing the app.
 *
 * **Flow:**
 * 1. When a child throws an error, `getDerivedStateFromError` marks `hasError` as true.
 * 2. Then, `componentDidCatch` logs the error details and component stack.
 * 3. The `render` method shows the fallback UI or a default message.
 *
 * Use this to wrap components that may fail during rendering or lifecycle execution.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  /** Initialize state with no error. */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Called when a descendant throws an error during render.
   * Updates state so the next render shows the fallback UI.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Called after an error is caught.
   * Logs structured error info to the custom logger (e.g., Grafana Loki).
   */
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(
      { error, info, component: "ErrorBoundary" },
      "ErrorBoundary caught an error"
    );
  }

  /**
   * Renders either:
   * - a custom fallback if provided,
   * - a simple default error message if not,
   * - or the children if no error occurred.
   */
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-red-600">
            <h2 className="font-semibold text-lg">Something went wrong.</h2>
            {this.state.error?.message && (
              <p className="text-sm mt-2 text-gray-500">
                {this.state.error.message}
              </p>
            )}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
