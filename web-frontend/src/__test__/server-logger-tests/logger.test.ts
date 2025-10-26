import type { ServerLogger } from "@/shared/logger/server-logger/model/types";

const pinoInstance = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
};

const pinoFn = jest.fn(() => pinoInstance);

(
  pinoFn as unknown as { stdTimeFunctions: { isoTime: () => string } }
).stdTimeFunctions = {
  isoTime: () => "2025-01-01T00:00:00.000Z",
};

jest.mock("pino", () => ({ __esModule: true, default: pinoFn }));

let shouldSampleFlag = true;

jest.mock("@/shared/logger/server-logger/model/helpers", () => {
  const real = jest.requireActual<
    typeof import("@/shared/logger/server-logger/model/helpers")
  >("@/shared/logger/server-logger/model/helpers");

  const delay = jest.fn(async (ms: number) => {
    await Promise.resolve(ms);
  });

  return {
    __esModule: true,
    ...real,
    epochNanos: () => "1000000000000",
    formatTimestamp: () => "TS",
    sanitizePayload: <T>(v: T) => v,
    shouldSample: (rate: number = 1) => shouldSampleFlag && rate > 0,
    basicAuthHeader: () => "Basic MOCK",
    delay,
    normalizeError: (err: unknown) => {
      if (err instanceof Error) return { name: err.name, message: err.message };
      return err;
    },
  };
});

import * as helpers from "@/shared/logger/server-logger/model/helpers";

type ResponseLike = { ok: boolean; status: number; statusText: string };
type FetchArgs = [input: RequestInfo, init?: RequestInit | undefined];
type FetchMock = jest.Mock<Promise<ResponseLike>, FetchArgs>;

let fetchMock: FetchMock;

const getHelpersMock = () =>
  jest.requireMock("@/shared/logger/server-logger/model/helpers") as {
    delay: jest.Mock;
  };

async function loadLoggerWithEnv(
  env: Partial<Record<string, string>>,
  sample = true
) {
  jest.resetModules();
  shouldSampleFlag = sample;

  const original = process.env;
  process.env = { ...original, ...env };

  const mod = await import("@/shared/logger/server-logger/model/logger");
  const logger: ServerLogger = (mod as { serverLogger: ServerLogger })
    .serverLogger;

  process.env = original;
  return logger;
}

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(performance, "now").mockReturnValue(2000);

  fetchMock = jest.fn<Promise<ResponseLike>, FetchArgs>(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
  }));

  // The logger uses the global `fetch`; we assign our stub here.
  // The ts-expect-error acknowledges that `global.fetch` may not be typed.
  // @ts-expect-error assign global fetch for tests
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("serverLogger", () => {
  it("logs locally with normalized error and computed duration", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "", API_USERNAME: "", API_KEY_LOKI: "" },
      true
    );

    const err = new Error("kaboom");
    await logger.error("Failed op", {
      err,
      duration_start_ms: 1500,
      custom: 123,
    });

    expect(pinoFn).toHaveBeenCalledTimes(1);
    expect(pinoInstance.error).toHaveBeenCalledTimes(1);

    const [fields, message] = pinoInstance.error.mock.calls[0] as [
      Record<string, unknown>,
      string,
    ];

    expect(message).toBe("[Server] - Failed op");

    expect(fields).toEqual(
      expect.objectContaining({
        custom: 123,
        duration_ms: 500,
        level: "error",
        service: "zenet_web_server",
        env: expect.any(String),
        pid: expect.any(Number),
        hostname: expect.any(String),
        version: expect.any(String),
        err: { name: "Error", message: "kaboom" },
      })
    );

    expect(
      (fields as Record<string, unknown>).duration_start_ms
    ).toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips remote push when shouldSample returns false", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "https://loki/push", API_USERNAME: "u", API_KEY_LOKI: "k" },
      false
    );

    await logger.info("Hello", { a: 1 });

    expect(pinoInstance.info).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips remote push when sampleRate=0 even if sampling flag is true", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "https://loki/push", API_USERNAME: "u", API_KEY_LOKI: "k" },
      true
    );

    await logger.debug("No remote", { x: 1 }, 0);

    expect(pinoInstance.debug).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pushes to Loki with two streams and auth header when remote enabled", async () => {
    const logger = await loadLoggerWithEnv(
      {
        LOKI_URL: "https://loki.example/push",
        API_USERNAME: "user",
        API_KEY_LOKI: "key",
      },
      true
    );

    await logger.debug("Ping", { x: 7 });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs;

    expect(url).toBe("https://loki.example/push");
    expect(init?.method).toBe("POST");

    expect(init?.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Basic MOCK",
      })
    );

    const sent = JSON.parse(String(init?.body)) as {
      streams: Array<{
        stream: Record<string, string>;
        values: [string, string][];
      }>;
    };

    expect(sent.streams).toHaveLength(2);
    expect(sent.streams[0].stream).toEqual({ service: "zenet_web_server" });
    expect(sent.streams[1].stream).toEqual({
      service: "zenet_web_server_debug",
    });

    for (const s of sent.streams) {
      expect(s.values[0][0]).toBe("1000000000000");

      const body = JSON.parse(s.values[0][1]) as Record<string, unknown>;
      expect(body).toEqual(
        expect.objectContaining({
          level: "debug",
          time: "TS",
          msg: "[Server] - Ping",
          service: "zenet_web_server",
          x: 7,
        })
      );
    }
  });

  it("does not attempt remote push when remote config is missing", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "", API_USERNAME: "", API_KEY_LOKI: "" },
      true
    );

    await logger.warn("Only local");

    expect(pinoInstance.warn).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries on 5xx once, then succeeds (exercises backoff branch)", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "https://loki/push", API_USERNAME: "u", API_KEY_LOKI: "k" },
      true
    );

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
      })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" });

    await logger.info("retry-me");

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const { delay } = getHelpersMock();
    expect(delay).toHaveBeenCalledTimes(1);
    expect(delay.mock.calls[0][0]).toBe(250);
  });

  it("does not retry on 4xx (exercises 'client error' exit branch)", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "https://loki/push", API_USERNAME: "u", API_KEY_LOKI: "k" },
      true
    );

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await logger.error("no-retry");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((helpers.delay as jest.Mock).mock.calls.length).toBe(0);
  });

  it("calls pino for all levels", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "", API_USERNAME: "", API_KEY_LOKI: "" },
      true
    );

    await logger.debug("d");
    await logger.info("i");
    await logger.warn("w");
    await logger.error("e");
    await logger.fatal("f");

    expect(pinoInstance.debug).toHaveBeenCalled();
    expect(pinoInstance.info).toHaveBeenCalled();
    expect(pinoInstance.warn).toHaveBeenCalled();
    expect(pinoInstance.error).toHaveBeenCalled();
    expect(pinoInstance.fatal).toHaveBeenCalled();
  });

  it("exhausts retries on network errors without throwing (fetch rejects)", async () => {
    const logger = await loadLoggerWithEnv(
      { LOKI_URL: "https://loki/push", API_USERNAME: "u", API_KEY_LOKI: "k" },
      true
    );

    fetchMock.mockRejectedValue(new Error("net down"));

    await logger.info("net-fail");

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const { delay } = getHelpersMock();
    expect(delay).toHaveBeenCalledTimes(2);

    expect(delay.mock.calls[0][0]).toBe(250);
    expect(delay.mock.calls[1][0]).toBe(500);
  });
});
