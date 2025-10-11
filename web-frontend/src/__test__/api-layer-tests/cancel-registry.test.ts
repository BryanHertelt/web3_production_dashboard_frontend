import { defineCancelRegistry } from "../../shared/api-layer/api/cancel-registry";
it("returns undefined when enable=false", () => {
  const apiObj = { getAll: {} };
  const cancelRegistry = defineCancelRegistry(apiObj);

  const signal = cancelRegistry.signalFor("getAll", false);

  expect(signal).toBeUndefined();
});

it("returns an AbortSignal when enable=true", () => {
  const apiObj = { getAll: {} };
  const cancelRegistry = defineCancelRegistry(apiObj);

  const signal = cancelRegistry.signalFor("getAll", true);

  expect(signal).toBeInstanceOf(AbortSignal);
});

it("aborts the previous controller if called again for same method", () => {
  const apiObj = { getAll: {} };
  const cancelRegistry = defineCancelRegistry(apiObj);

  const first = cancelRegistry.signalFor("getAll", true);
  const second = cancelRegistry.signalFor("getAll", true);

  expect(first?.aborted).toBe(true); // previous one got aborted
  expect(second?.aborted).toBe(false); // new one is active
});
