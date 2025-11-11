import { CoinsAPI } from "../../../entities/coins/api/coins-api";
import { request as realRequest } from "../../../shared/api-layer/client/api/request";
import type { Coins } from "../../../entities/coins/model/types";

// --- Mock setup ---------------------------------------------------------------
// We mock ONLY the transport wrapper. We do NOT mock the cancel-registry.
// This keeps the tests focused on what CoinsAPI passes to `request`.
jest.mock("../../../shared/api-layer/client/api/request", () => ({
  request: jest.fn(),
}));

// Strongly-typed handle to the mocked `request`.
const request = realRequest as jest.MockedFunction<typeof realRequest>;

describe("CoinsAPI (wiring tests)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------- get ------------------------------------------

  test("get (no args, cancel=false) → calls GET /coins and does NOT pass a signal", async () => {
    const data: Coins[] = [
      {
        coin: "BTC",
        amount: 0.25,
        buyPrice: 42000.0,
        currentPrice: 47850.0,
        profitLoss: "+1462.50",
        profitClass: "profit",
      },
    ];
    request.mockResolvedValueOnce(data);

    const res = await CoinsAPI.get(); // cancel=false default

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/coins",
      method: "GET",
      // no query key when undefined
    });
    expect(signal).toBeUndefined(); // cancel=false should not forward a signal
    expect(res).toBe(data);
  });

  test("get (cancel=true) → passes an AbortSignal", async () => {
    request.mockResolvedValueOnce([]);

    await CoinsAPI.get(undefined, true);

    const [, signal] = request.mock.calls[0];
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("get (with query, cancel=false) → includes query and no signal", async () => {
    const data: Coins[] = [
      {
        coin: "ETH",
        amount: 5.75,
        buyPrice: 2800.0,
        currentPrice: 2650.0,
        profitLoss: "-862.50",
        profitClass: "loss",
      },
    ];
    request.mockResolvedValueOnce(data);

    const res = await CoinsAPI.get({ search: "eth", limit: 10 });

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/coins",
      method: "GET",
      query: { search: "eth", limit: 10 },
    });
    expect(signal).toBeUndefined();
    expect(res).toEqual(data);
  });

  test("get (with query, cancel=true) → includes query and passes AbortSignal", async () => {
    request.mockResolvedValueOnce([]);

    await CoinsAPI.get({ search: "ada" }, true);

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/coins",
      method: "GET",
      query: { search: "ada" },
    });
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("get → propagates transport errors", async () => {
    const boom = new Error("transport failed");
    request.mockRejectedValueOnce(boom);

    await expect(CoinsAPI.get()).rejects.toBe(boom);
  });
});
