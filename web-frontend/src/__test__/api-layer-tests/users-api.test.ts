// users-api.test.ts
// Purpose: verify that UsersAPI correctly wires URL/method/query,
// forwards (or not) an AbortSignal depending on `cancel`,
// and propagates errors from the transport wrapper.

import { UsersAPI } from "../../entities/users/api/users-api";
import { request as realRequest } from "../../shared/api-layer/api/request";
import type { Users } from "../../entities/users/model/types";

// --- Mock setup ---------------------------------------------------------------
// We mock ONLY the transport wrapper. We do NOT mock the cancel-registry.
// This keeps the tests focused on what UsersAPI passes to `request`.
jest.mock("../../shared/api-layer/api/request", () => ({
  request: jest.fn(),
}));

// Strongly-typed handle to the mocked `request`.
const request = realRequest as jest.MockedFunction<typeof realRequest>;

describe("UsersAPI (wiring tests)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------- get ------------------------------------------

  test("get (no args, cancel=false) → calls GET /users and does NOT pass a signal", async () => {
    const data: Users[] = [
      {
        coin: "BTC",
        amount: 1,
        buyPrice: 30000,
        currentPrice: 35000,
        profitLoss: 5000,
        profitClass: "profit",
      },
    ];
    request.mockResolvedValueOnce(data);

    const res = await UsersAPI.get(); // cancel=false default

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/users",
      method: "GET",
      // no query key when undefined
    });
    expect(signal).toBeUndefined(); // cancel=false should not forward a signal
    expect(res).toBe(data);
  });

  test("get (cancel=true) → passes an AbortSignal", async () => {
    request.mockResolvedValueOnce([]);

    await UsersAPI.get(undefined, true);

    const [, signal] = request.mock.calls[0];
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("get (with query, cancel=false) → includes query and no signal", async () => {
    const data: Users[] = [
      {
        coin: "BTC",
        amount: 1,
        buyPrice: 30000,
        currentPrice: 35000,
        profitLoss: 5000,
        profitClass: "profit",
      },
    ];
    request.mockResolvedValueOnce(data);

    const res = await UsersAPI.get({ search: "btc", limit: 10 });

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/users",
      method: "GET",
      query: { search: "btc", limit: 10 },
    });
    expect(signal).toBeUndefined();
    expect(res).toEqual(data);
  });

  test("get (with query, cancel=true) → includes query and passes AbortSignal", async () => {
    request.mockResolvedValueOnce([]);

    await UsersAPI.get({ search: "x" }, true);

    const [cfg, signal] = request.mock.calls[0];
    expect(cfg).toEqual({
      url: "/users",
      method: "GET",
      query: { search: "x" },
    });
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("get → propagates transport errors", async () => {
    const boom = new Error("transport failed");
    request.mockRejectedValueOnce(boom);

    await expect(UsersAPI.get()).rejects.toBe(boom);
  });
});
