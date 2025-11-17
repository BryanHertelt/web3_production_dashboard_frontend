import React from "react";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/shared/ui/feedback/error-boundary/error-boundary";

class ThrowError extends React.Component {
  override render(): React.ReactNode {
    const shouldThrow = true;
    if (shouldThrow) {
      throw new Error("Test error");
    }
    return null;
  }
}

describe("ErrorBoundary", () => {
  const originalError = console.error;

  beforeEach(() => {
    // Silence React error logs during test
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
    jest.clearAllMocks();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child OK</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders default fallback when an error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary
        fallback={<div data-testid="fallback">Custom Fallback</div>}
      >
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId("fallback")).toHaveTextContent("Custom Fallback");
  });
});
