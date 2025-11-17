import {
  instance,
  onFulfilled,
  onRejected,
} from "../../../shared/api-layer/client/configs/axios-config";
import type {
  AxiosHeaders,
  InternalAxiosRequestConfig,
  AxiosResponseHeaders,
} from "axios";

// ---- mock helper functions ----
const isCancelMock = jest.fn<boolean, [unknown]>();
const isAxiosErrMock = jest.fn<boolean, [unknown]>();
const describeStatusMock = jest.fn<
  { level: "warn" | "error"; message: string },
  [unknown]
>();

jest.mock("../../../shared/api-layer/client/model/helpers", () => ({
  isCancel: (e: unknown) => isCancelMock(e),
  isAxiosErr: (e: unknown) => isAxiosErrMock(e),
  describeStatus: (e: unknown) => describeStatusMock(e),
}));

// ---- mock logger (named export with .warn / .error) ----
const loggerWarnMock = jest.fn<void, [unknown, string]>();
const loggerErrorMock = jest.fn<void, [unknown, string]>();
jest.mock("../../shared/logger/client-logger/model/logger", () => ({
  logger: {
    warn: (...args: [unknown, string]) => loggerWarnMock(...args),
    error: (...args: [unknown, string]) => loggerErrorMock(...args),
  },
}));

// Minimal-but-valid Axios shapes for typing
function minimalConfig(): InternalAxiosRequestConfig {
  return {
    headers: {} as typeof AxiosHeaders,
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
      headers: minimalHeaders(),
      config: minimalConfig(),
    } satisfies import("../../../shared/api-layer/client/model/types").AxiosResponse<{
      ok: boolean;
    }>;

    const result = onFulfilled(fakeResponse);
    expect(result).toBe(fakeResponse);
  });

  // ---- onRejected (cancel case) ----
  test("onRejected ignores cancel errors (no logging, just rejects)", async () => {
    const fakeError = { message: "canceled" };
    isCancelMock.mockReturnValue(true);

    await expect(onRejected(fakeError)).rejects.toBe(fakeError);

    expect(isCancelMock).toHaveBeenCalledWith(fakeError);
    expect(isAxiosErrMock).not.toHaveBeenCalled();
    expect(describeStatusMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  // ---- onRejected (axios error → warn) ----
  test("onRejected logs axios errors using logger[level] (warn) and rethrows", async () => {
    const fakeAxiosErr = {
      name: "AxiosError",
      message: "Not Found",
      config: { method: "get", url: "/coins" },
      response: { status: 404 },
    };

    isCancelMock.mockReturnValue(false);
    isAxiosErrMock.mockReturnValue(true);
    describeStatusMock.mockReturnValue({
      level: "warn",
      message: "Not Found",
    });

    await expect(onRejected(fakeAxiosErr)).rejects.toBe(fakeAxiosErr);

    expect(isAxiosErrMock).toHaveBeenCalledWith(fakeAxiosErr);
    expect(describeStatusMock).toHaveBeenCalledWith(fakeAxiosErr);

    // Should use warn level with enriched error context and prefixed message
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    const [objArg, msgArg] = loggerWarnMock.mock.calls[0];

    expect(msgArg).toBe("[API] - Not Found Code - 404");
    expect(objArg).toEqual({
      err: {
        message: "Not Found",
        name: "AxiosError",
        status: 404,
        method: "GET", // should be uppercased by config
        url: "/coins",
      },
    });

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  // ---- onRejected (axios error → error) ----
  test("onRejected logs axios errors using logger[level] (error) and rethrows", async () => {
    const fakeAxiosErr = {
      name: "AxiosError",
      message: "Internal Server Error",
      config: { method: "post", url: "/portfolio" },
      response: { status: 500 },
    };

    isCancelMock.mockReturnValue(false);
    isAxiosErrMock.mockReturnValue(true);
    describeStatusMock.mockReturnValue({
      level: "error",
      message: "Internal Server Error",
    });

    await expect(onRejected(fakeAxiosErr)).rejects.toBe(fakeAxiosErr);

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    const [objArg, msgArg] = loggerErrorMock.mock.calls[0];

    expect(msgArg).toBe("[API] - Internal Server Error Code - 500");
    expect(objArg).toEqual({
      err: {
        message: "Internal Server Error",
        name: "AxiosError",
        status: 500,
        method: "POST",
        url: "/portfolio",
      },
    });

    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  // ---- onRejected (unknown error case) ----
  test("onRejected logs unknown errors once via logger.error and rethrows", async () => {
    const fakeError = { oh: "no" };
    isCancelMock.mockReturnValue(false);
    isAxiosErrMock.mockReturnValue(false);

    await expect(onRejected(fakeError)).rejects.toBe(fakeError);

    expect(isCancelMock).toHaveBeenCalledWith(fakeError);
    expect(isAxiosErrMock).toHaveBeenCalledWith(fakeError);
    expect(describeStatusMock).not.toHaveBeenCalled();

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    const [objArg, msgArg] = loggerErrorMock.mock.calls[0];
    expect(msgArg).toBe("[API] Unknown error object thrown");
    expect(objArg).toEqual({ thrown: String(fakeError) });

    expect(loggerWarnMock).not.toHaveBeenCalled();
  });
});
