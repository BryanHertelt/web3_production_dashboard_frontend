import {
  epochNanos,
  formatTimestamp,
  sanitizePayload,
  shouldSample,
  basicAuthHeader,
  delay,
  normalizeError,
} from "@/shared/logger/server-logger/model/helpers";

class HttpError extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  cause?: unknown;
}

describe("helpers", () => {
  describe("epochNanos", () => {
    it("returns a decimal string representing nanoseconds", () => {
      const ms = 1_700_000_000_000;
      const ns = epochNanos(ms);
      expect(typeof ns).toBe("string");
      expect(ns.endsWith("000000")).toBe(true); // ms * 1e6 ends with 6 zeros
    });

    it("is strictly monotonic for same ms (bumps by 1ns)", () => {
      const ms = 1_700_000_000_001;
      const a = epochNanos(ms);
      const b = epochNanos(ms);
      expect(BigInt(b)).toBe(BigInt(a) + 1n);
    });

    it("increases with larger ms inputs", () => {
      const a = epochNanos(1_800_000_000_000);
      const b = epochNanos(1_800_000_000_001);
      expect(BigInt(b)).toBeGreaterThan(BigInt(a));
    });
  });

  describe("formatTimestamp", () => {
    it("formats as YYYY-MM-DDTHH:mm:ss in Europe/Berlin", () => {
      const ms = Date.parse("2025-10-20T07:15:42.000Z");
      expect(formatTimestamp(ms)).toBe("2025-10-20T09:15:42");
    });
  });

  describe("sanitizePayload", () => {
    it("passes primitives and null through unchanged", () => {
      expect(sanitizePayload(null)).toBeNull();
      expect(sanitizePayload(42)).toBe(42);
      expect(sanitizePayload("x")).toBe("x");
      expect(sanitizePayload(true)).toBe(true);
    });

    it("redacts sensitive top-level keys (case-insensitive)", () => {
      const input = {
        token: "abc",
        PASSWORD: "secret",
        ApiKey: "xyz",
        normal: "keep",
      };
      const out = sanitizePayload(input);
      expect(out).toEqual({
        token: "[REDACTED]",
        PASSWORD: "[REDACTED]",
        ApiKey: "[REDACTED]",
        normal: "keep",
      });
      expect(input.token).toBe("abc");
    });

    it("recursively redacts inside nested objects and arrays", () => {
      const input = {
        nested: {
          authorization: "bearer 123",
          inner: [{ password: "p1" }, { COOKIE: "c" }, "ok"],
        },
      };
      const out = sanitizePayload(input);
      expect(out).toEqual({
        nested: {
          authorization: "[REDACTED]",
          inner: [{ password: "[REDACTED]" }, { COOKIE: "[REDACTED]" }, "ok"],
        },
      });
    });
  });

  describe("shouldSample", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns true when sampleRate >= 1", () => {
      expect(shouldSample(1)).toBe(true);
      expect(shouldSample(2)).toBe(true);
    });

    it("returns false when sampleRate <= 0", () => {
      expect(shouldSample(0)).toBe(false);
      expect(shouldSample(-0.1)).toBe(false);
    });

    it("uses Math.random for 0 < rate < 1", () => {
      const spy = jest.spyOn(Math, "random").mockReturnValue(0.24);
      expect(shouldSample(0.25)).toBe(true);
      spy.mockReturnValue(0.25);
      expect(shouldSample(0.25)).toBe(false);
    });
  });

  describe("basicAuthHeader", () => {
    it("builds a correct Basic authorization header", () => {
      const header = basicAuthHeader("user", "key");
      expect(header).toBe("Basic dXNlcjprZXk=");
    });
  });

  describe("delay", () => {
    it("resolves after the given time", async () => {
      jest.useFakeTimers();
      const p = delay(250);
      jest.advanceTimersByTime(250);
      await expect(p).resolves.toBeUndefined();
      jest.useRealTimers();
    });
  });

  describe("normalizeError", () => {
    it("passes non-Error values through unchanged", () => {
      expect(normalizeError("nope")).toBe("nope");
      const obj = { a: 1 };
      expect(normalizeError(obj)).toBe(obj);
    });

    it("converts Error into a plain NormalizedError object", () => {
      const err = new HttpError("boom");
      err.code = "EFAIL";
      err.status = 500;
      err.method = "GET";
      err.url = "/x";
      err.cause = "root-cause";

      const norm = normalizeError(err) as {
        name?: string;
        message?: string;
        code?: string;
        status?: number;
        method?: string;
        url?: string;
        cause?: string;
        stack?: string;
      };

      expect(norm).toMatchObject({
        name: "Error",
        message: "boom",
        code: "EFAIL",
        status: 500,
        method: "GET",
        url: "/x",
        cause: "root-cause",
      });
      expect(typeof norm.stack === "string" || norm.stack === undefined).toBe(
        true
      );
    });
  });
});
