import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CryptoDashboard from "../pages/dashboard/dashboard-page";
import "@testing-library/jest-dom";

interface TableProps {
  headers: string[];
}

// Mock the logger to prevent errors during tests
jest.mock("@/lib/model/logger", () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    startOperation: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      endOperation: jest.fn(),
      withSampleRate: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      })),
    })),
  },
}));

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
    id,
    owner,
    assets,
    joined,
  }: {
    id: number;
    owner: string;
    assets: string;
    joined: string;
  }) {
    return (
      <div data-testid="info-box">
        {id} {owner} {assets} {joined}
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
    id: 1,
    owner: "Owner1",
    assets: "Asset1",
    joined: "2023-01-01",
  },
  {
    id: 2,
    owner: "Owner2",
    assets: "Asset2",
    joined: "2023-02-01",
  },
  {
    id: 3,
    owner: "Owner3",
    assets: "Asset3",
    joined: "2023-03-01",
  },
];

describe("CryptoDashboard component", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCardData,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the dashboard layout correctly", async () => {
    render(<CryptoDashboard />);

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

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId("info-box")).toHaveLength(3);
    });

    expect(screen.getByTestId("charts")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  test("renders with correct overall structure", async () => {
    const { container } = render(<CryptoDashboard />);

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
    render(<CryptoDashboard />);

    // Verify fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/portfolio");
    });

    // Check that InfoBox components are rendered with correct data
    await waitFor(() => {
      expect(
        screen.getByText("1 Owner1 Asset1 2023-01-01")
      ).toBeInTheDocument();
      expect(
        screen.getByText("2 Owner2 Asset2 2023-02-01")
      ).toBeInTheDocument();
      expect(
        screen.getByText("3 Owner3 Asset3 2023-03-01")
      ).toBeInTheDocument();
    });
  });

  test("handles fetch error gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    render(<CryptoDashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("An error occured")
      );
    });

    consoleSpy.mockRestore();
  });

  test("renders table with correct configuration", async () => {
    render(<CryptoDashboard />);

    // Check that table is rendered with the correct number of headers
    expect(screen.getByText("Table with 5 headers")).toBeInTheDocument();
  });

  test("shows loading state initially", () => {
    render(<CryptoDashboard />);

    // During loading, InfoBox components should not be rendered yet
    expect(screen.queryAllByTestId("info-box")).toHaveLength(0);
  });

  test("renders InfoBox components after data loads", async () => {
    render(<CryptoDashboard />);

    // Wait for InfoBox components to appear
    await waitFor(() => {
      const infoBoxes = screen.getAllByTestId("info-box");
      expect(infoBoxes).toHaveLength(3);
    });
  });

  test("handles empty card data array", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<CryptoDashboard />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Should not render any InfoBox when data is empty
    expect(screen.queryAllByTestId("info-box")).toHaveLength(0);
  });
});
