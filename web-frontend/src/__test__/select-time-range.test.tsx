import React from "react";
import { render, screen } from "@testing-library/react";
import TimeRange from "../features/select-time-range/ui/select-time-range";
import "@testing-library/jest-dom";

describe("TimeRange component", () => {
  test("renders all time range buttons with correct labels", () => {
    render(<TimeRange />);
    const labels = [
      "Last 24h",
      "Last week",
      "Last month",
      "Last year",
      "All time",
    ];
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test("renders the correct number of buttons", () => {
    render(<TimeRange />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  test("first button has active styling", () => {
    render(<TimeRange />);
    const firstButton = screen.getByText("Last 24h");
    expect(firstButton).toHaveClass(
      "bg-yellow-700",
      "text-white",
      "border-yellow-800"
    );
  });

  test("other buttons have default styling", () => {
    render(<TimeRange />);
    const labels = ["Last week", "Last month", "Last year", "All time"];
    labels.forEach((label) => {
      const button = screen.getByText(label);
      expect(button).toHaveClass("border-gray-300", "text-gray-700");
      expect(button).not.toHaveClass(
        "bg-yellow-700",
        "text-white",
        "border-yellow-800"
      );
    });
  });

  test("all buttons have base classes", () => {
    render(<TimeRange />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveClass(
        "px-3",
        "py-1",
        "rounded",
        "border",
        "hover:bg-yellow-700"
      );
    });
  });

  test("renders with correct container structure", () => {
    const { container } = render(<TimeRange />);
    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveClass(
      "flex",
      "items-center",
      "justify-between",
      "mb-4"
    );

    const innerDiv = outerDiv?.firstChild;
    expect(innerDiv).toHaveClass("flex", "items-center", "space-x-4");

    const buttonContainer = innerDiv?.firstChild;
    expect(buttonContainer).toHaveClass("flex", "space-x-2");
  });
});
