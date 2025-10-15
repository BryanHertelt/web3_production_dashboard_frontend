import React from "react";
import { render, screen } from "@testing-library/react";
import PlaceholderChart from "../widgets/charts/ui/charts";
import "@testing-library/jest-dom";

describe("PlaceholderChart component", () => {
  test("renders the grid of placeholder charts", () => {
    const { container } = render(<PlaceholderChart />);
    const gridElement = container.querySelector(".grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass("grid", "grid-cols-3", "gap-4");
  });

  test("renders three placeholder chart divs with correct text", () => {
    render(<PlaceholderChart />);
    expect(screen.getByText("Chart placeholder 1")).toBeInTheDocument();
    expect(screen.getByText("Chart placeholder 2")).toBeInTheDocument();
    expect(screen.getByText("Chart placeholder 3")).toBeInTheDocument();
  });

  test("each placeholder has the correct CSS classes", () => {
    render(<PlaceholderChart />);
    const placeholders = screen.getAllByText(/Chart placeholder \d/);
    placeholders.forEach((placeholder) => {
      expect(placeholder).toHaveClass(
        "bg-white",
        "rounded",
        "p-6",
        "shadow",
        "h-48",
        "flex",
        "items-center",
        "justify-center",
        "text-gray-400"
      );
    });
  });
});
