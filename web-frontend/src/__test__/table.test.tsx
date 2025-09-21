import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Table from "../widgets/table/ui/table";
import "@testing-library/jest-dom";

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

// Mock the global fetch function
global.fetch = jest.fn();

const defaultTableConfig: TableProps = {
  headers: ["Coin", "Amount", "Buy Price", "Current Price", "Profit/Loss"],
};

describe("Table component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  test("renders table headers correctly", () => {
    render(<Table tableConfig={defaultTableConfig} />);
    expect(screen.getByText("Coin")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Buy Price")).toBeInTheDocument();
    expect(screen.getByText("Current Price")).toBeInTheDocument();
    expect(screen.getByText("Profit/Loss")).toBeInTheDocument();
  });

  test("renders custom table headers correctly", () => {
    const customConfig: TableProps = {
      headers: ["Symbol", "Quantity", "Price"],
    };
    render(<Table tableConfig={customConfig} />);
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
  });

  test("renders data rows when fetch is successful", async () => {
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    await act(async () => {
      render(<Table tableConfig={defaultTableConfig} />);
    });

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
  });

  test("renders error message when fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network response was not ok")
    );

    render(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error occured.*Network response was not ok/)
      ).toBeInTheDocument();
    });
  });

  test("renders error message when response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error occured.*Network response was not ok/)
      ).toBeInTheDocument();
    });
  });

  test("renders error message when json throws", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("JSON parse error");
      },
    });

    render(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error occured.*JSON parse error/)
      ).toBeInTheDocument();
    });
  });

  test("renders error message when error is not an Error instance", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce("some string error");

    render(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error occured.*some string error/)
      ).toBeInTheDocument();
    });
  });

  test("fetches data from correct endpoint", async () => {
    const mockData: TableRow[] = [];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<Table tableConfig={defaultTableConfig} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/users");
    });
  });

  test("renders table title correctly", () => {
    render(<Table tableConfig={defaultTableConfig} />);
    expect(screen.getByText("Bought Coins")).toBeInTheDocument();
  });
});
