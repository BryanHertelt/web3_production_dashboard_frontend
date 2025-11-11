import React from "react";
import { render, screen } from "@testing-library/react";
import { Spinner } from "@/shared/ui/feedback/spinner/ui/spinner";

describe("Spinner", () => {
  it("renders with default props", () => {
    const { container } = render(<Spinner />);
    const spinnerDivs = container.querySelectorAll("div");
    const spinnerCircle = spinnerDivs[1] as HTMLDivElement;

    expect(spinnerCircle.className).toContain("animate-spin");
    expect(spinnerCircle.className).toContain("h-6");
    expect(spinnerCircle.className).toContain("w-6");
    expect(spinnerCircle.className).toContain("border-t-blue-500");
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });

  it("renders with label when provided", () => {
    render(<Spinner label="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Spinner className="extra-class" />);
    const spinnerCircle = container.querySelectorAll(
      "div"
    )[1] as HTMLDivElement;
    expect(spinnerCircle.className).toContain("extra-class");
  });

  it("applies correct size classes", () => {
    const { rerender, container } = render(<Spinner size="sm" />);
    let spinnerCircle = container.querySelectorAll("div")[1] as HTMLDivElement;
    expect(spinnerCircle.className).toContain("h-4");
    expect(spinnerCircle.className).toContain("w-4");

    rerender(<Spinner size="md" />);
    spinnerCircle = container.querySelectorAll("div")[1] as HTMLDivElement;
    expect(spinnerCircle.className).toContain("h-6");
    expect(spinnerCircle.className).toContain("w-6");

    rerender(<Spinner size="lg" />);
    spinnerCircle = container.querySelectorAll("div")[1] as HTMLDivElement;
    expect(spinnerCircle.className).toContain("h-10");
    expect(spinnerCircle.className).toContain("w-10");
  });
});
