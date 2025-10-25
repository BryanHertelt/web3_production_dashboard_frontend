import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CryptoDashboard from "@/pages/dashboard/ui/dashboard-page";
import "@testing-library/jest-dom";
import { PortfolioAPI, ApiError } from "@/shared/api-layer/client";

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

jest.mock("@/shared/api-layer/client", () => {
  class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }
  return {
    __esModule: true,
    ApiError,
    PortfolioAPI: {
      get: jest.fn(),
    },
  };
});

const mockPortfolio = [
  { id: 1, owner: "Owner1", assets: "Asset1", joined: "2023-01-01" },
  { id: 2, owner: "Owner2", assets: "Asset2", joined: "2023-02-01" },
  { id: 3, owner: "Owner3", assets: "Asset3", joined: "2023-03-01" },
];

// Helper: render and wait until the useEffect request fires
async function renderAndWaitForRequest() {
  const utils = render(<CryptoDashboard />);
  await waitFor(() => {
    expect(PortfolioAPI.get).toHaveBeenCalledWith(undefined, true);
  });
  return utils;
}

describe("CryptoDashboard component", () => {
  beforeEach(() => {
    (PortfolioAPI.get as jest.Mock).mockResolvedValue(mockPortfolio);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the dashboard layout correctly", async () => {
    await renderAndWaitForRequest();

    const mainContainer = screen.getByRole("main");
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass("flex-grow", "p-6", "overflow-auto");

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("searchbar")).toBeInTheDocument();
    expect(screen.getByTestId("time-range")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId("info-box")).toHaveLength(3);
    });

    expect(screen.getByTestId("charts")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  test("renders with correct overall structure", async () => {
    const { container } = await renderAndWaitForRequest();

    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass(
      "flex",
      "h-screen",
      "bg-gray-50",
      "text-gray-900"
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  test("fetches and renders card data correctly", async () => {
    await renderAndWaitForRequest();

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
    (PortfolioAPI.get as jest.Mock).mockRejectedValue(
      new ApiError("Network error", 500)
    );

    await renderAndWaitForRequest();

    // During error, InfoBoxes should not render; table still renders
    expect(screen.queryAllByTestId("info-box")).toHaveLength(0);
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  test("renders table with correct configuration", async () => {
    await renderAndWaitForRequest();
    expect(screen.getByText("Table with 5 headers")).toBeInTheDocument();
  });

  test("shows loading state initially", async () => {
    // Keep the promise pending to keep loading state
    (PortfolioAPI.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<CryptoDashboard />);

    // During loading, InfoBox components should not be rendered yet
    expect(screen.queryAllByTestId("info-box")).toHaveLength(0);
  });

  test("renders InfoBox components after data loads", async () => {
    await renderAndWaitForRequest();

    await waitFor(() => {
      const infoBoxes = screen.getAllByTestId("info-box");
      expect(infoBoxes).toHaveLength(3);
    });
  });

  test("handles empty card data array", async () => {
    (PortfolioAPI.get as jest.Mock).mockResolvedValue([]);

    await renderAndWaitForRequest();

    expect(screen.queryAllByTestId("info-box")).toHaveLength(0);
  });
});
