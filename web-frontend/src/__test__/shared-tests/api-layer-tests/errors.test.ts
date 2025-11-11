import { ApiError } from "../../../shared/api-layer/client/api/errors";

describe("ApiError", () => {
  it("is an instance of ApiError and Error", () => {
    const err = new ApiError("test error");
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
  });

  it("sets name and message", () => {
    const err = new ApiError("Not Found");
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Not Found");
  });

  it("sets optional status and details when provided", () => {
    const details = { endpoint: "/portfolio/1" };
    const err = new ApiError("Oops", 404, details);
    expect(err.status).toBe(404);
    expect(err.details).toBe(details);
  });

  it("leaves status and details undefined when not provided", () => {
    const err = new ApiError("Oops");
    expect(err.status).toBeUndefined();
    expect(err.details).toBeUndefined();
  });

  it("toString includes name and message", () => {
    const err = new ApiError("Bad things");
    // Default Error.toString() => `${name}: ${message}`
    expect(err.toString()).toContain("ApiError");
    expect(err.toString()).toContain("Bad things");
  });
});
