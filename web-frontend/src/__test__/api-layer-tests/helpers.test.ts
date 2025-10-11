import { AxiosError } from "../../shared/api-layer/model/types";
import {
  logByStatus,
  statusOf,
  extractMessage,
  isCancel,
  isAxiosErr,
} from "../../shared/api-layer/model/helpers";

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

// ---------------------- logByStatus ----------------------

describe("logByStatus", () => {
  const cases: Array<[number, string]> = [
    [400, "Bad Request"],
    [403, "Forbidden"],
    [409, "Conflict"],
    [422, "Unprocessable Entity"],
    [429, "Too Many Requests"],
    [500, "Internal Server Error"],
    [503, "Service Unavailable"],
    [504, "Gateway Timeout"],
  ];

  beforeEach(() => jest.clearAllMocks());

  test.each(cases)(
    "prints readable message for known status codes",
    (status, phrase) => {
      const err = makeAxiosErr(status, "put", "/resource");
      logByStatus(err, status);
      const [msg] = consoleErrorSpy.mock.calls.at(-1)!;
      expect(String(msg)).toContain(`API PUT /resource`);
      expect(String(msg)).toContain(String(status));
      expect(String(msg)).toMatch(phrase);
    }
  );

  test("logByStatus ignores 401 (no console output)", () => {
    const err = makeAxiosErr(401, "get", "/me");
    logByStatus(err, 401);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test("logByStatus prints specific 502 message", () => {
    const err = makeAxiosErr(502, "get", "/upstream");
    logByStatus(err, 502);
    const [msg] = consoleErrorSpy.mock.calls.at(-1)!;
    expect(String(msg)).toContain("API GET /upstream");
    expect(String(msg)).toContain("502");
    expect(String(msg)).toMatch(/Bad Gateway/i);
  });

  test("logByStatus prints a concise 404 message and includes method/url", () => {
    const err = makeAxiosErr(404, "get", "/thing");
    logByStatus(err, 404);
    const last = consoleErrorSpy.mock.calls.at(-1);
    expect(last).toBeTruthy();
    const [msg] = last!;
    expect(String(msg)).toContain("API GET /thing");
    expect(String(msg)).toContain("404");
    expect(String(msg)).toMatch(/Not found/i);
  });

  test("function falls back to default if error code is not covered", () => {
    const errorMessages = [
      { code: 599, msg: "Server" },
      { code: 499, msg: "Client" },
      { code: 299, msg: "Unexpected" },
    ];
    const errArr = errorMessages.map(
      (status: { code: number; msg: string }) => {
        const err = makeAxiosErr(status.code, "get", "/someUrl");
        logByStatus(err, status.code);
        const last = consoleErrorSpy.mock.calls.at(-1);
        expect(last).toBeDefined();
        const msg = last!;
        expect(msg).toContain(
          `[API GET /someUrl] ${status.code} – ${status.msg} error.`
        );
        return err;
      }
    );
    expect(errArr).toBeDefined();
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
