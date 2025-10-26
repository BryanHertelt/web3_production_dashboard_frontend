import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Table from "../widgets/table/ui/table";
import "@testing-library/jest-dom";

// IMPORTANT: import from the same paths the component uses
import { CoinsAPI } from "@/entities/coins/api/coins-api";
import { ApiError } from "@/shared/api-layer/client/index";

// --- mock the CoinsAPI from its real module path used by the component ---
jest.mock("@/entities/coins/api/coins-api", () => ({
  CoinsAPI: { get: jest.fn() },
}));

// --- mock ApiError from the shared index (so `instanceof ApiError` matches) ---
jest.mock("@/shared/api-layer/client/index", () => {
  return {
    ApiError: class ApiError extends Error {
      status?: number;
      constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
      }
    },
  };
});

interface TableProps {
  headers: string[];
}

interface TableRow {
  coin: string;
  amount: string;
  buyPrice: string;
  currentPrice: string;
  profitLoss: string;
  profitClass: string;
}

const defaultTableConfig: TableProps = {
  headers: ["Coin", "Amount", "Buy Price", "Current Price", "Profit/Loss"],
};

// Helper to always render inside act to avoid state update warnings
const renderWithAct = async (ui: React.ReactElement) => {
  await act(async () => {
    render(ui);
  });
};

describe("Table component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders table headers correctly", async () => {
    (CoinsAPI.get as jest.Mock).mockResolvedValueOnce([]);
    await renderWithAct(<Table tableConfig={defaultTableConfig} />);
    expect(screen.getByText("Coin")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Buy Price")).toBeInTheDocument();
    expect(screen.getByText("Current Price")).toBeInTheDocument();
    expect(screen.getByText("Profit/Loss")).toBeInTheDocument();
  });

  test("renders custom table headers correctly", async () => {
    (CoinsAPI.get as jest.Mock).mockResolvedValueOnce([]);
    const customConfig: TableProps = {
      headers: ["Symbol", "Quantity", "Price"],
    };
    await renderWithAct(<Table tableConfig={customConfig} />);
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
  });

  test("renders data rows when API returns successfully", async () => {
    const mockData: TableRow[] = [
      {
        coin: "Bitcoin",
        amount: "1.5",
        buyPrice: "50000",
        currentPrice: "60000",
        profitLoss: "+10000",
        profitClass: "text-green-500",
      },
      {
        coin: "Ethereum",
        amount: "10",
        buyPrice: "3000",
        currentPrice: "3500",
        profitLoss: "+5000",
        profitClass: "text-green-500",
      },
    ];

    (CoinsAPI.get as jest.Mock).mockResolvedValueOnce(mockData);

    await renderWithAct(<Table tableConfig={defaultTableConfig} />);

    // First row
    await waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.getByText("1.5")).toBeInTheDocument();
      expect(screen.getByText("50000")).toBeInTheDocument();
      expect(screen.getByText("60000")).toBeInTheDocument();
      expect(screen.getByText("+10000")).toBeInTheDocument();
    });

    // Second row
    await waitFor(() => {
      expect(screen.getByText("Ethereum")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("3000")).toBeInTheDocument();
      expect(screen.getByText("3500")).toBeInTheDocument();
      expect(screen.getByText("+5000")).toBeInTheDocument();
    });

    expect(CoinsAPI.get).toHaveBeenCalledTimes(1);
    expect(CoinsAPI.get).toHaveBeenCalledWith(undefined, true);
  });

  test("shows ApiError message with status when API rejects with ApiError", async () => {
    (CoinsAPI.get as jest.Mock).mockRejectedValueOnce(
      new ApiError("Service Unavailable", 503)
    );

    await renderWithAct(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(
        screen.getByText("Error: Service Unavailable (status 503)")
      ).toBeInTheDocument();
    });
  });

  test("shows Error.message when a plain Error is thrown", async () => {
    (CoinsAPI.get as jest.Mock).mockRejectedValueOnce(
      new Error("Network exploded")
    );

    await renderWithAct(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(screen.getByText("Error: Network exploded")).toBeInTheDocument();
    });
  });

  test("shows 'Unknown error' for non-Error values", async () => {
    (CoinsAPI.get as jest.Mock).mockRejectedValueOnce("weird string");
    await renderWithAct(<Table tableConfig={defaultTableConfig} />);
    await waitFor(() => {
      expect(screen.getByText("Error: Unknown error")).toBeInTheDocument();
    });
  });

  test("renders table title correctly", async () => {
    (CoinsAPI.get as jest.Mock).mockResolvedValueOnce([]);
    await renderWithAct(<Table tableConfig={defaultTableConfig} />);
    expect(screen.getByText("Bought Coins")).toBeInTheDocument();
  });

  test("applies profitClass to Profit/Loss cell", async () => {
    const mockData: TableRow[] = [
      {
        coin: "ADA",
        amount: "1000",
        buyPrice: "0.45",
        currentPrice: "0.52",
        profitLoss: "+70",
        profitClass: "text-green-500",
      },
    ];
    (CoinsAPI.get as jest.Mock).mockResolvedValueOnce(mockData);

    await renderWithAct(<Table tableConfig={defaultTableConfig} />);

    const profitCell = await screen.findByText("+70");
    expect(profitCell).toBeInTheDocument();
    expect(profitCell).toHaveClass("text-green-500");
  });
});
