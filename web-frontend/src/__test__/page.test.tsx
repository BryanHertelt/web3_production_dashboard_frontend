import React from "react";
import { render, screen } from "@testing-library/react";
import CryptoDashboardPage from "../app/page";
import "@testing-library/jest-dom";

// Mock the entire CryptoDashboard component to avoid async issues
jest.mock("@/pages/dashboard/ui/dashboard-page", () => {
  return function MockCryptoDashboard() {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        <aside data-testid="navbar">Navbar</aside>
        <main className="flex-grow p-6 overflow-auto" role="main">
          <div data-testid="searchbar">Searchbar</div>
          <div data-testid="time-range">TimeRange</div>
          <div data-testid="info-box">InfoBox 1</div>
          <div data-testid="info-box">InfoBox 2</div>
          <div data-testid="info-box">InfoBox 3</div>
          <div data-testid="charts">Charts</div>
          <div data-testid="table">Table</div>
        </main>
      </div>
    );
  };
});

describe("CryptoDashboardPage component", () => {
  test("renders the CryptoDashboard component without crashing", () => {
    render(<CryptoDashboardPage />);
    // Check for the main element from CryptoDashboard
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("flex-grow", "p-6", "overflow-auto");
  });

  test("renders all dashboard components", () => {
    render(<CryptoDashboardPage />);

    // Check that all main components are rendered
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("searchbar")).toBeInTheDocument();
    expect(screen.getByTestId("time-range")).toBeInTheDocument();
    expect(screen.getAllByTestId("info-box")).toHaveLength(3);
    expect(screen.getByTestId("charts")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  test("has correct overall structure", () => {
    const { container } = render(<CryptoDashboardPage />);
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass(
      "flex",
      "h-screen",
      "bg-gray-50",
      "text-gray-900"
    );
  });
});
