import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

function MockSvg(props: React.SVGProps<SVGSVGElement>) {
  return <svg data-testid="mock-svg" {...props} />;
}

jest.mock("@/shared/assets/icons/ui/feedback/toast/success.svg", () => ({
  __esModule: true,
  default: MockSvg,
}));
jest.mock("@/shared/assets/icons/ui/feedback/toast/error.svg", () => ({
  __esModule: true,
  default: MockSvg,
}));
jest.mock("@/shared/assets/icons/ui/feedback/toast/info.svg", () => ({
  __esModule: true,
  default: MockSvg,
}));
jest.mock("@/shared/assets/icons/ui/feedback/toast/warning.svg", () => ({
  __esModule: true,
  default: MockSvg,
}));

import { Toast } from "@/shared/ui/feedback/toast/ui/toast";

jest.useFakeTimers();

describe("Toast component", () => {
  const onClose = jest.fn();

  const realRaf = window.requestAnimationFrame;
  const realCaf = window.cancelAnimationFrame;

  beforeAll(() => {
    window.requestAnimationFrame = ((cb: FrameRequestCallback): number =>
      window.setTimeout(
        () => cb(performance.now()),
        16
      )) as unknown as typeof window.requestAnimationFrame;

    window.cancelAnimationFrame = ((id: number): void => {
      window.clearTimeout(id);
    }) as unknown as typeof window.cancelAnimationFrame;
  });

  afterAll(() => {
    window.requestAnimationFrame = realRaf;
    window.cancelAnimationFrame = realCaf;
  });

  beforeEach(() => {
    jest.clearAllTimers();
    onClose.mockClear();
  });

  it("renders correctly with message and type", () => {
    render(
      <Toast id="1" message="Test message" type="success" onClose={onClose} />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Action Completed")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("renders default message when message prop is missing", () => {
    render(<Toast id="2" type="error" onClose={onClose} />);
    expect(screen.getByText("Error Occurred")).toBeInTheDocument();
    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeInTheDocument();
  });

  it("applies the correct toast color variable for type", () => {
    render(<Toast id="3" message="Hi" type="info" onClose={onClose} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveStyle({ "--toast-color": "#306DDE33" });
  });

  it("calls onClose when toast is clicked", () => {
    render(<Toast id="4" message="Click me" onClose={onClose} />);
    fireEvent.click(screen.getByRole("alert"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("progress bar width decreases over time", () => {
    render(
      <Toast
        id="5"
        message="Timed"
        type="warning"
        duration={2000}
        onClose={onClose}
      />
    );

    const alert = screen.getByRole("alert");
    const bar = alert.querySelector("div[style*='width']");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("style")).toMatch(/width:\s*95/);

    act(() => {
      jest.advanceTimersByTime(1000);
      jest.runOnlyPendingTimers();
    });

    const style = bar?.getAttribute("style") ?? "";
    const match = style.match(/width:\s*([\d.]+)%/);
    expect(match).not.toBeNull();
    const width = parseFloat(match![1]);
    expect(width).toBeLessThan(95);
  });

  it("cleans up animation frame on unmount", () => {
    const cancelSpy = jest.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(
      <Toast id="6" message="Unmount" type="success" onClose={onClose} />
    );
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });

  it("renders correctly for all toast types", () => {
    const types: Array<"success" | "error" | "info" | "warning"> = [
      "success",
      "error",
      "info",
      "warning",
    ];

    types.forEach((type, i) => {
      const { unmount } = render(
        <Toast
          id={`t${i}`}
          message="Type check"
          type={type}
          onClose={onClose}
        />
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      unmount();
    });
  });
});
