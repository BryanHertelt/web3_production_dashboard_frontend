import { POST } from "../../app/api/logging/route";

describe("POST /api/logging", () => {
  let originalFetch;
  let originalEnv;
  let originalResponse;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };
    originalResponse = global.Response;

    // Mock fetch
    global.fetch = jest.fn();

    // Mock Response
    global.Response = jest.fn().mockImplementation((body, options = {}) => ({
      status: options.status || 200,
      text: jest.fn().mockResolvedValue(body),
    }));
    // silence route error logs during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {}); // add this
    // Set environment variables
    process.env.API_USERNAME = "testuser";
    process.env.API_KEY_LOKI = "testkey";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.Response = originalResponse;
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it("should send log to Loki successfully with default level (info)", async () => {
    const mockReq = {
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ message: "test log" })),
    };

    global.fetch.mockResolvedValue({ ok: true });

    const response = await POST(mockReq);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Log sent to Loki");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://logs-prod-021.grafana.net/loki/api/v1/push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: expect.stringContaining("Basic "),
        },
        body: expect.any(String),
      }
    );

    const fetchCall = global.fetch.mock.calls[0][1];
    const body = JSON.parse(fetchCall.body);
    expect(body.streams).toHaveLength(2); // general + info
    expect(body.streams[0].stream.app).toBe("zenet_web_frontend");
    expect(body.streams[1].stream.app).toBe("zenet_web_frontend_info");
  });

  it("should send log to Loki successfully with warn level", async () => {
    const mockReq = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ level: "warn", message: "warn log" })
        ),
    };

    global.fetch.mockResolvedValue({ ok: true });

    const response = await POST(mockReq);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Log sent to Loki");

    const fetchCall = global.fetch.mock.calls[0][1];
    const body = JSON.parse(fetchCall.body);
    expect(body.streams).toHaveLength(2); // general + warn
    expect(body.streams[0].stream.app).toBe("zenet_web_frontend");
    expect(body.streams[1].stream.app).toBe("zenet_web_frontend_warn");
  });

  it("should send log to Loki successfully with error level", async () => {
    const mockReq = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ level: "error", message: "error log" })
        ),
    };

    global.fetch.mockResolvedValue({ ok: true });

    const response = await POST(mockReq);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Log sent to Loki");

    const fetchCall = global.fetch.mock.calls[0][1];
    const body = JSON.parse(fetchCall.body);
    expect(body.streams).toHaveLength(2); // general + error
    expect(body.streams[0].stream.app).toBe("zenet_web_frontend");
    expect(body.streams[1].stream.app).toBe("zenet_web_frontend_error");
  });

  it("should send log to Loki successfully with fatal level", async () => {
    const mockReq = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ level: "fatal", message: "fatal log" })
        ),
    };

    global.fetch.mockResolvedValue({ ok: true });

    const response = await POST(mockReq);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Log sent to Loki");

    const fetchCall = global.fetch.mock.calls[0][1];
    const body = JSON.parse(fetchCall.body);
    expect(body.streams).toHaveLength(2); // general + fatal
    expect(body.streams[0].stream.app).toBe("zenet_web_frontend");
    expect(body.streams[1].stream.app).toBe("zenet_web_frontend_fatal");
  });

  it("should return 400 for invalid JSON body", async () => {
    const mockReq = {
      text: jest.fn().mockResolvedValue("invalid json"),
    };

    const response = await POST(mockReq);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid JSON body");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should return 500 when Loki push fails", async () => {
    const mockReq = {
      text: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ level: "info", message: "test log" })
        ),
    };

    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue("Loki error"),
    });

    const response = await POST(mockReq);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Failed to send to Loki");
  });

  it("should return 500 on internal server error", async () => {
    const mockReq = {
      text: jest.fn().mockRejectedValue(new Error("Request error")),
    };

    const response = await POST(mockReq);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Internal Server Error");
  });
});
