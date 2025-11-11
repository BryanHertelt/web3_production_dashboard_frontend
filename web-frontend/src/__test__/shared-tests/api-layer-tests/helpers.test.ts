import { AxiosError } from "../../../shared/api-layer/client/model/types";
import {
  describeStatus,
  statusOf,
  extractMessage,
  isCancel,
  isAxiosErr,
} from "../../../shared/api-layer/client/model/helpers";

// mock console.error so we can inspect logs without polluting test output
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

// reset mocks after each test
afterEach(() => jest.clearAllMocks());
// restore original console.error at the end
afterAll(() => consoleErrorSpy.mockRestore());

/**
 * Helper: creates an AxiosError-like object.
 * We only fill the fields we need for tests.
 * @param status - HTTP status code (optional)
 * @param method - HTTP method (optional, for logging)
 * @param url - Request URL (optional, for logging)
 * @returns An object shaped like AxiosError with specified fields.
 */
function makeAxiosErr(
  status?: number,
  method?: string,
  url?: string
): AxiosError {
  return {
    name: "AxiosError",
    message: "boom",
    config: { method, url },
    isAxiosError: true,
    toJSON: () => ({}),
    response:
      status === undefined
        ? undefined
        : ({ status } as unknown as AxiosError["response"]),
    code: undefined,
    request: undefined,
    status: undefined,
  } as AxiosError;
}

// ---------------------- describeStatus ----------------------
describe("describeStatus", () => {
  type Case = {
    code: number;
    level: "warn" | "error";
    message: string;
  };

  const knownCases: Case[] = [
    { code: 400, level: "warn", message: "Bad Request (invalid client input)" },
    { code: 401, level: "warn", message: "Unauthorized" },
    {
      code: 403,
      level: "warn",
      message: "Forbidden (insufficient permissions)",
    },
    { code: 404, level: "warn", message: "Not Found" },
    { code: 409, level: "warn", message: "Conflict (state/version clash)" },
    {
      code: 422,
      level: "warn",
      message: "Unprocessable Entity (validation failed)",
    },
    { code: 429, level: "warn", message: "Too Many Requests (rate limited)" },
    { code: 500, level: "error", message: "Internal Server Error" },
    {
      code: 502,
      level: "error",
      message: "Bad Gateway (upstream down/misconfigured)",
    },
    {
      code: 503,
      level: "error",
      message: "Service Unavailable (overloaded/maintenance)",
    },
    {
      code: 504,
      level: "error",
      message: "Gateway Timeout (upstream slow/unreachable)",
    },
  ];

  test.each(knownCases)(
    "returns level+message for known status $code",
    ({ code, level, message }) => {
      const err = makeAxiosErr(code, "put", "/resource");
      const res = describeStatus(err);
      expect(res).toEqual({ level, message });
    }
  );

  test("returns 'Server error' for unknown 5xx", () => {
    const err = makeAxiosErr(599, "get", "/x");
    const res = describeStatus(err);
    expect(res).toEqual({ level: "error", message: "Server error" });
  });

  test("returns 'Client error' for unknown 4xx", () => {
    const err = makeAxiosErr(499, "get", "/x");
    const res = describeStatus(err);
    expect(res).toEqual({ level: "warn", message: "Client error" });
  });

  test("no status (network/CORS) -> error + specific message", () => {
    const err = makeAxiosErr(undefined, "get", "/x");
    const res = describeStatus(err);
    expect(res).toEqual({
      level: "error",
      message: "No HTTP status (network/CORS?)",
    });
  });
});

// ---------------------- statusOf ----------------------

test("statusOf returns the HTTP status when present", () => {
  // just checks that helper extracts .response.status correctly
  const err = makeAxiosErr(404) as unknown as unknown;
  expect(statusOf(err as AxiosError)).toBe(404);
});

// ---------------------- isAxiosError ----------------------

test("isAxiosErr true for axios-shaped error, false for plain error", () => {
  const axiosLike: AxiosError = {
    name: "AxiosError",
    message: "x",
    isAxiosError: true,
    toJSON: () => ({}),
    config: {} as unknown as AxiosError["config"],
    request: undefined,
    response: undefined,
    code: undefined,
  };
  expect(isAxiosErr(axiosLike)).toBe(true);
  expect(isAxiosErr(new Error("nope"))).toBe(false);
});

// ---------------------- extractMessage ----------------------
describe("extractMessage", () => {
  test("extractMessage prefers server JSON { message }", () => {
    const err = makeAxiosErr(400) as AxiosError;
    (err as AxiosError).response = {
      status: 400,
      data: { message: "my error message" },
    } as unknown as AxiosError["response"];

    const { message, details } = extractMessage(err, "Fallback");
    expect(message).toBe("my error message");
    expect(details).toEqual({ message: "my error message" });
  });

  test("extractMessage falls back to err.message when payload lacks 'message'", () => {
    const err = makeAxiosErr(400) as AxiosError;
    err.message = "fallback message";
    err.response = {
      status: 400,
      data: { other: "x" },
    } as unknown as AxiosError["response"];
    const { message } = extractMessage(err, "Fallback");
    expect(message).toBe("fallback message");
  });

  test("extractMessage uses provided fallback when both empty", () => {
    const err = makeAxiosErr(500) as AxiosError;
    err.message = "";
    err.response = {
      status: 500,
      data: {},
    } as unknown as AxiosError["response"];
    const { message } = extractMessage(err, "Fallback USED");
    expect(message).toBe("Fallback USED");
  });
});

// ---------------------- isCancel ----------------------
describe("isCancel", () => {
  test("isCancel: true for axios cancel errors, false otherwise", () => {
    const cancelErr: AxiosError = {
      name: "CanceledError",
      message: "canceled",
      code: "ERR_CANCELED",
      isAxiosError: true,
      toJSON: () => ({}),
      config: {} as unknown as AxiosError["config"],
      request: undefined,
      response: undefined,
    };
    expect(isCancel(cancelErr)).toBe(true);

    const nonCancel = makeAxiosErr(500) as AxiosError;
    expect(isCancel(nonCancel)).toBe(false);
  });

  test("isCancel also matches by name only (no code/message)", () => {
    const byNameOnly: AxiosError = {
      name: "CanceledError",
      message: "not standard text",
      isAxiosError: true,
      toJSON: () => ({}),
      config: {} as unknown as AxiosError["config"],
      request: undefined,
      response: undefined,
      code: undefined,
    };
    expect(isCancel(byNameOnly)).toBe(true);
  });
});
