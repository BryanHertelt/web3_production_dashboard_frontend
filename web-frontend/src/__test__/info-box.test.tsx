import React from "react";
import { render, screen } from "@testing-library/react";
import InfoBox from "../shared/info-box/ui/info-box";
import "@testing-library/jest-dom";

describe("InfoBox component", () => {
  test("renders title and value correctly", () => {
    render(<InfoBox title="Test Title" value={900} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("$900")).toBeInTheDocument();
  });

  test("renders color dot when color is provided", () => {
    const { container } = render(
      <InfoBox title="Test Title" value={900} color="bg-blue-500" />
    );
    const colorDot = container.querySelector(".bg-blue-500");
    expect(colorDot).toBeInTheDocument();
    expect(colorDot).toHaveClass("w-3", "h-3", "rounded-full", "mr-2");
  });

  test("does not render color dot when color is not provided", () => {
    const { container } = render(<InfoBox title="Test Title" value={900} />);
    const colorDot = container.querySelector("span");
    expect(colorDot).toBeNull();
  });

  test("renders change with green color for positive change", () => {
    render(<InfoBox title="Test Title" value={900} change={10} />);
    const changeElement = screen.getByText("+10% vs last period");
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass("text-green-600");
  });

  test("renders change with red color for negative change", () => {
    render(<InfoBox title="Test Title" value={900} change={-5} />);
    const changeElement = screen.getByText("-5% vs last period");
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass("text-red-600");
  });

  test("does not render change when change is not provided", () => {
    render(<InfoBox title="Test Title" value={900} />);
    expect(screen.queryByText(/vs last period/)).toBeNull();
  });

  test("does not render footer when footer is not provided", () => {
    render(<InfoBox title="Test Title" value={900} />);
    expect(screen.queryByText("Footer Content")).toBeNull();
  });
});
