import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Table from "../widgets/table/ui/table";
import "@testing-library/jest-dom";

// IMPORTANT: import from the same paths the component uses
import { UsersAPI } from "@/entities/users/api/users-api";
import { ApiError } from "@/shared/api-layer/index";

// --- mock the UsersAPI from its real module path used by the component ---
jest.mock("@/entities/users/api/users-api", () => ({
  UsersAPI: { get: jest.fn() },
}));

// --- mock ApiError from the shared index (so `instanceof ApiError` matches) ---
jest.mock("@/shared/api-layer/index", () => {
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
    (UsersAPI.get as jest.Mock).mockResolvedValueOnce([]);
    await renderWithAct(<Table tableConfig={defaultTableConfig} />);
    expect(screen.getByText("Coin")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Buy Price")).toBeInTheDocument();
    expect(screen.getByText("Current Price")).toBeInTheDocument();
    expect(screen.getByText("Profit/Loss")).toBeInTheDocument();
  });

  test("renders custom table headers correctly", async () => {
    (UsersAPI.get as jest.Mock).mockResolvedValueOnce([]);
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

    (UsersAPI.get as jest.Mock).mockResolvedValueOnce(mockData);

    await renderWithAct(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.getByText("1.5")).toBeInTheDocument();
      expect(screen.getByText("50000")).toBeInTheDocument();
      expect(screen.getByText("60000")).toBeInTheDocument();
      expect(screen.getByText("+10000")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Ethereum")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("3000")).toBeInTheDocument();
      expect(screen.getByText("3500")).toBeInTheDocument();
      expect(screen.getByText("+5000")).toBeInTheDocument();
    });

    expect(UsersAPI.get).toHaveBeenCalledTimes(1);
    expect(UsersAPI.get).toHaveBeenCalledWith(undefined, true);
  });

  test("shows ApiError message with status when API rejects with ApiError", async () => {
    (UsersAPI.get as jest.Mock).mockRejectedValueOnce(
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
    (UsersAPI.get as jest.Mock).mockRejectedValueOnce(
      new Error("Network exploded")
    );

    await renderWithAct(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(screen.getByText("Error: Network exploded")).toBeInTheDocument();
    });
  });

  test("shows 'Unknown error' for non-Error values", async () => {
    (UsersAPI.get as jest.Mock).mockRejectedValueOnce("weird string");
    await renderWithAct(<Table tableConfig={defaultTableConfig} />);
    await waitFor(() => {
      expect(screen.getByText("Error: Unknown error")).toBeInTheDocument();
    });
  });

  test("renders table title correctly", async () => {
    (UsersAPI.get as jest.Mock).mockResolvedValueOnce([]);
    await renderWithAct(<Table tableConfig={defaultTableConfig} />);
    expect(screen.getByText("Bought Coins")).toBeInTheDocument();
  });
});
