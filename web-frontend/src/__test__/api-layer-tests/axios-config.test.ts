import {
  instance,
  onFulfilled,
  onRejected,
} from "../../shared/api-layer/configs/axios-config";
import type {
  AxiosHeaders,
  InternalAxiosRequestConfig,
  AxiosResponseHeaders,
} from "axios";

// ---- mock helper functions ----
//  created our own mock functions with precise types:
const isCancelMock = jest.fn<boolean, [unknown]>();
const isAxiosErrMock = jest.fn<boolean, [unknown]>();
const statusOfMock = jest.fn<number | undefined, [unknown]>();
const logByStatusMock = jest.fn<void, [unknown, number | undefined]>();

// then we mock the entire helpers module to use them:
jest.mock("../../shared/api-layer/model/helpers", () => ({
  isCancel: (e: unknown) => isCancelMock(e),
  isAxiosErr: (e: unknown) => isAxiosErrMock(e),
  statusOf: (e: unknown) => statusOfMock(e),
  logByStatus: (err: unknown, status?: number) => logByStatusMock(err, status),
}));

const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {}); // silence console output during tests

// A helper to build a minimal-but-valid Axios config for tests
function minimalConfig(): InternalAxiosRequestConfig {
  return {
    headers: {} as AxiosHeaders, // satisfies the required shape
  } as InternalAxiosRequestConfig;
}

function minimalHeaders(): AxiosResponseHeaders {
  return {} as AxiosResponseHeaders;
}

describe("axios-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Instance configuration ----
  test("instance has correct default settings", () => {
    // These are the defaults we expect for every axios call
    expect(instance.defaults.baseURL).toBe(
      process.env.NEXT_PUBLIC_API_BASE_URL
    );
    expect(instance.defaults.timeout).toBe(10000);
    expect(instance.defaults.withCredentials).toBe(false);
  });

  // ---- onFulfilled ----
  test("onFulfilled simply returns the same response (pass-through)", () => {
    const fakeResponse = {
      data: { ok: true },
      status: 200,
      statusText: "OK",
      // Axios v1 AxiosResponse type requires these fields so we had to mock them:
      headers: minimalHeaders(),
      config: minimalConfig(),
    } satisfies import("../../shared/api-layer/model/types").AxiosResponse<{
      ok: boolean;
    }>;

    const result = onFulfilled(fakeResponse);
    expect(result).toBe(fakeResponse); // should return the same object
  });

  // ---- onRejected (cancel case) ----
  test("onRejected ignores cancel errors (no logging, just rejects)", async () => {
    const fakeError = { message: "canceled" };
    isCancelMock.mockReturnValue(true);

    await expect(onRejected(fakeError)).rejects.toBe(fakeError);
    expect(isCancelMock).toHaveBeenCalledWith(fakeError);
    expect(isAxiosErrMock).not.toHaveBeenCalled();
    expect(logByStatusMock).not.toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  // ---- onRejected (axios error case) ----
  test("onRejected logs axios errors by status and rethrows", async () => {
    const fakeError = { response: { status: 404 } };
    isCancelMock.mockReturnValue(false);
    isAxiosErrMock.mockReturnValue(true);
    statusOfMock.mockReturnValue(404);

    await expect(onRejected(fakeError)).rejects.toBe(fakeError);

    expect(isAxiosErrMock).toHaveBeenCalledWith(fakeError);
    expect(statusOfMock).toHaveBeenCalledWith(fakeError);
    expect(logByStatusMock).toHaveBeenCalledWith(fakeError, 404);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  // ---- onRejected (unknown error case) ----
  test("onRejected logs unknown errors once and rethrows", async () => {
    const fakeError = { message: "something unexpected" };
    isCancelMock.mockReturnValue(false);
    isAxiosErrMock.mockReturnValue(false);

    await expect(onRejected(fakeError)).rejects.toBe(fakeError);

    expect(isCancelMock).toHaveBeenCalledWith(fakeError);
    expect(isAxiosErrMock).toHaveBeenCalledWith(fakeError);
    expect(logByStatusMock).not.toHaveBeenCalled();

    // Should log one readable message to console
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError.mock.calls[0][0]).toContain("[API]");
  });
});
