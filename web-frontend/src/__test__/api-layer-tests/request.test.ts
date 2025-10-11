// request.test.ts
import { request } from "../../shared/api-layer/api/request"; // the wrapper we are testing
import { ApiError } from "../../shared/api-layer/api/errors"; // our custom error
import { instance } from "../../shared/api-layer/configs/axios-config"; // mocked axios instance

// Replace the real api from axios config with a mock
jest.mock("../../shared/api-layer/configs/axios-config", () => ({
  instance: { request: jest.fn() },
}));

describe("request()", () => {
  // Reset mocks before each test so they don't affect each other
  beforeEach(() => jest.clearAllMocks());

  test("returns the response data when the request succeeds", async () => {
    //mock for: axios returned { data: { ok: true } }
    (instance.request as jest.Mock).mockResolvedValue({ data: { ok: true } });

    const result = await request<{ ok: boolean }>({
      url: "/users",
      method: "GET",
    });

    // The wrapper should just give us res.data back
    expect(result).toEqual({ ok: true });
  });

  test("throws custom ApiError with our detailed object", async () => {
    // Pretend axios failed with a typical Axios-like error object
    const axErr = {
      isAxiosError: true,
      message: "Request failed",
      response: { status: 400, data: { message: "Bad input" } },
    };
    (instance.request as jest.Mock).mockRejectedValue(axErr);

    // Check the thrown error is our ApiError
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toBeInstanceOf(ApiError);
    // Check important fields on the error
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toMatchObject({
      message: "Bad input",
      status: 400,
      details: { message: "Bad input" },
    });
  });

  test("treats isAxiosError: false as non-Axios and wraps into ApiError('Unknown error')", async () => {
    const notAxiosErr = {
      isAxiosError: false,
      message: "Pretend axios-shaped error",
      response: { status: 400, data: { message: "Bad input" } },
    };

    (instance.request as jest.Mock).mockRejectedValue(notAxiosErr);

    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toBeInstanceOf(ApiError);

    // Because guard returns false, we should hit the generic branch:
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toMatchObject({
      message: "Unknown error",
      status: undefined,
    });
  });

  test("falls back to Axios error message if response.data has no message", async () => {
    const axErr = {
      isAxiosError: true,
      message: "Server issue",
      // response.data has no message field
      response: { status: 500, data: {} },
    };
    (instance.request as jest.Mock).mockRejectedValue(axErr);

    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toHaveProperty("message", "Server issue");
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toHaveProperty("status", 500);
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toHaveProperty("details", {});
  });

  test("throws ApiError with { canceled: true } when the request is aborted", async () => {
    const axErr = {
      isAxiosError: true,
      code: "ERR_CANCELED",
      message: "canceled",
    };
    (instance.request as jest.Mock).mockRejectedValue(axErr);

    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toHaveProperty("details", { canceled: true });
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toMatchObject({ message: "Request canceled" });
  });

  test("wraps non-Axios errors into a generic ApiError('Unknown error')", async () => {
    // something happened (not an AxiosError)
    (instance.request as jest.Mock).mockRejectedValue(
      new Error("Weird failure")
    );

    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toBeInstanceOf(ApiError);
    // expect our generic message "Unknown error" when all checks fail to know it's not an AxiosError
    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toHaveProperty("message", "Unknown error");
  });

  test("wraps Axios network errors (no response) with message and no status", async () => {
    const axErr = { isAxiosError: true, message: "Network Error", request: {} };
    (instance.request as jest.Mock).mockRejectedValue(axErr);

    await expect(
      request({ url: "/users", method: "GET" })
    ).rejects.toMatchObject({ message: "Network Error", status: undefined });
  });

  // ----------------------------- AbortSignal forwarding --------------------------------------

  test("forwards the provided AbortSignal to axios", async () => {
    const controller = new AbortController();
    (instance.request as jest.Mock).mockResolvedValue({ data: 123 });
    // abort controller.signal is a built-in browser API we have access through AbortController
    await request<number>({ url: "/asdf", method: "GET" }, controller.signal);

    // Verify axios was called with the same AbortSignal
    expect(instance.request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
