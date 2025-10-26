import { PortfolioAPI } from "../../entities/portfolio/api/portfolio-api";
import { request as realRequest } from "../../shared/api-layer/client/api/request";
import type { Portfolio } from "../../entities/portfolio/model/types";

// --- Mock setup ---------------------------------------------------------------
// We mock ONLY the transport wrapper. We do NOT mock the cancel-registry.
// This keeps the tests focused on what PortfolioAPI passes to `request`.
jest.mock("../../shared/api-layer/client/api/request", () => ({
  request: jest.fn(),
}));

// Strongly-typed handle to the mocked `request`.
const request = realRequest as jest.MockedFunction<typeof realRequest>;

describe("PortfolioAPI (wiring tests)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------- get ------------------------------------------

  test("get (no args, cancel=false) → calls GET /portfolio and does NOT pass a signal", async () => {
    const data: Portfolio[] = [
      {
        id: 1,
        owner: "Nick Guber",
        assets: "bitcoin",
        joined: "2025-09-28T08:23:23.290333Z",
      },
    ];
    request.mockResolvedValueOnce(data);

    const res = await PortfolioAPI.get(); // cancel=false default

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/portfolio",
      method: "GET",
      // no query key when undefined
    });
    expect(signal).toBeUndefined(); // cancel=false should not forward a signal
    expect(res).toBe(data);
  });

  test("get (cancel=true) → passes an AbortSignal", async () => {
    request.mockResolvedValueOnce([]);

    await PortfolioAPI.get(undefined, true);

    const [, signal] = request.mock.calls[0];
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("get (with query, cancel=false) → includes query and no signal", async () => {
    const data: Portfolio[] = [
      {
        id: 1,
        owner: "Nick Guber",
        assets: "bitcoin",
        joined: "2025-09-28T08:23:23.290333Z",
      },
    ];
    request.mockResolvedValueOnce(data);

    const res = await PortfolioAPI.get({ search: "btc", limit: 10 });

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/portfolio",
      method: "GET",
      query: { search: "btc", limit: 10 },
    });
    expect(signal).toBeUndefined();
    expect(res).toEqual(data);
  });

  test("get (with query, cancel=true) → includes query and passes AbortSignal", async () => {
    request.mockResolvedValueOnce([]);

    await PortfolioAPI.get({ search: "x" }, true);

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/portfolio",
      method: "GET",
      query: { search: "x" },
    });
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("get → propagates transport errors", async () => {
    const boom = new Error("transport failed");
    request.mockRejectedValueOnce(boom);

    await expect(PortfolioAPI.get()).rejects.toBe(boom);
  });
});
