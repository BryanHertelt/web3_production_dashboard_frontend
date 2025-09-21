import React from "react";
import { render, screen } from "@testing-library/react";
import Navbar from "../widgets/navbar/ui/navbar";
import "@testing-library/jest-dom";

describe("Navbar component", () => {
  test("renders the navbar with correct title and button", () => {
    render(<Navbar />);
    const dashboards = screen.getAllByText("Dashboard");
    expect(dashboards).toHaveLength(2);
  });

  test("renders all navigation buttons", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("button", { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /financials/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /analytics/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /integrations & api/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /settings & administration/i })
    ).toBeInTheDocument();
  });

  test("renders the Product section header", () => {
    render(<Navbar />);
    expect(screen.getByText("Product")).toBeInTheDocument();
  });

  test("dashboard button has correct base styling", () => {
    render(<Navbar />);
    const dashboardButton = screen.getByRole("button", { name: /dashboard/i });
    expect(dashboardButton).toHaveClass(
      "text-left",
      "px-3",
      "py-2",
      "rounded",
      "hover:bg-gray-100"
    );
  });

  test("all buttons have consistent styling", () => {
    render(<Navbar />);
    const financialsButton = screen.getByRole("button", {
      name: /financials/i,
    });
    expect(financialsButton).toHaveClass(
      "text-left",
      "px-3",
      "py-2",
      "rounded",
      "hover:bg-gray-100"
    );

    const analyticsButton = screen.getByRole("button", { name: /analytics/i });
    expect(analyticsButton).toHaveClass(
      "text-left",
      "px-3",
      "py-2",
      "rounded",
      "hover:bg-gray-100"
    );
  });

  test("renders correct sidebar structure", () => {
    render(<Navbar />);
    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveClass(
      "w-64",
      "bg-white",
      "border-r",
      "border-gray-200",
      "p-4",
      "flex",
      "flex-col"
    );
  });

  test("renders navigation with correct structure", () => {
    render(<Navbar />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("flex", "flex-col", "space-y-2", "flex-grow");
  });
});
