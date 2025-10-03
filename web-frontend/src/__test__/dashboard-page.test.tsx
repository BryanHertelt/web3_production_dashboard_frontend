import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CryptoDashboard from "../pages/dashboard/dashboard-page";
import "@testing-library/jest-dom";

interface TableProps {
  headers: string[];
}

jest.mock("@/widgets/navbar/ui/navbar", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock("@/widgets/searchbar/ui/searchbar", () => {
  return function MockSearchbar() {
    return <div data-testid="searchbar">Searchbar</div>;
  };
});

jest.mock("@/features/select-time-range/ui/select-time-range", () => {
  return function MockTimeRange() {
    return <div data-testid="time-range">TimeRange</div>;
  };
});

jest.mock("@/shared/info-box/ui/info-box", () => {
  return function MockInfoBox({
    title,
    value,
    change,
  }: {
    title: string;
    value: number;
    change?: number;
    color?: string;
  }) {
    return (
      <div data-testid="info-box">
        {title}: {value} {change && `(${change}%)`}
      </div>
    );
  };
});

jest.mock("@/widgets/charts/ui/charts", () => {
  return function MockPlaceholderChart() {
    return <div data-testid="charts">Charts</div>;
  };
});

jest.mock("@/widgets/table/ui/table", () => {
  return function MockTable({ tableConfig }: { tableConfig: TableProps }) {
    return (
      <div data-testid="table">
        Table with {tableConfig?.headers?.length || 0} headers
      </div>
    );
  };
});

// Mock fetch globally
global.fetch = jest.fn();

const mockCardData = [
  {
    title: "Revenue",
    value: 25.68,
    change: 8,
    color: "bg-purple-500",
  },
  {
    title: "Transactions",
    value: 18420,
    change: 5,
    color: "bg-blue-400",
  },
  {
    title: "USD balance",
    value: 25.68,
  },
];

describe("CryptoDashboard component", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      json: async () => mockCardData,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  test("renders the dashboard layout correctly", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        {await CryptoDashboard()}
      </QueryClientProvider>
    );

    // Check main container
    const mainContainer = screen.getByRole("main");
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass("flex-grow", "p-6", "overflow-auto");

    // Check sidebar (Navbar)
    expect(screen.getByTestId("navbar")).toBeInTheDocument();

    // Check top bar (Searchbar)
    expect(screen.getByTestId("searchbar")).toBeInTheDocument();

    // Check dashboard content
    expect(screen.getByTestId("time-range")).toBeInTheDocument();
    expect(screen.getAllByTestId("info-box")).toHaveLength(3);
    expect(screen.getByTestId("charts")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  test("renders with correct overall structure", async () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        {await CryptoDashboard()}
      </QueryClientProvider>
    );

    // Check root div
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass(
      "flex",
      "h-screen",
      "bg-gray-50",
      "text-gray-900"
    );

    // Check that main content is present
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  test("fetches and renders card data correctly", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        {await CryptoDashboard()}
      </QueryClientProvider>
    );

    // Verify fetch was called
    expect(fetch).toHaveBeenCalledWith("http://localhost:3001/infocards");

    // Check that InfoBox components are rendered with correct data
    await waitFor(() => {
      expect(screen.getByText(/Revenue: 25.68/)).toBeInTheDocument();
      expect(screen.getByText(/Transactions: 18420/)).toBeInTheDocument();
      expect(screen.getByText(/USD balance: 25.68/)).toBeInTheDocument();
    });
  });

  test("handles fetch error gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    render(
      <QueryClientProvider client={new QueryClient()}>
        {await CryptoDashboard()}
      </QueryClientProvider>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("An error occured")
    );

    consoleSpy.mockRestore();
  });

  test("renders table with correct configuration", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        {await CryptoDashboard()}
      </QueryClientProvider>
    );

    // Check that table is rendered with the correct number of headers
    expect(screen.getByText("Table with 5 headers")).toBeInTheDocument();
  });
});
