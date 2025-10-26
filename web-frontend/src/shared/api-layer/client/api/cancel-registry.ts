import type { CancelRegistryType, AbortRegistryObject } from "../model/types";
/**
 * Keeps one AbortController per method name to cancel the previous request
 * @param apiObj An object whose keys are method names to track if there are ongoing requests.
 * @param AbortController A built-in browser API to abort fetch requests. Used while creating the registry cells.
 * @returns An object with a `signalFor` method to get an AbortSignal for a given method name.
 */
export function defineCancelRegistry(apiObj: CancelRegistryType) {
  const registry: AbortRegistryObject = Object.create(null);

  Object.getOwnPropertyNames(apiObj).forEach((key) => {
    registry[key] = {};
  });
  /**
   * Get an AbortSignal for a specific method.
   * @param methodName The name of the method for which to get an AbortSignal.
   * @param enable Whether to enable the signal.
   * @returns An AbortSignal for the specified method, or undefined if not enabled.
   */
  function signalFor(
    methodName: string,
    enable: boolean
  ): AbortSignal | undefined {
    if (!enable) return undefined;
    const cell = registry[methodName];
    if (cell?.controller) cell.controller.abort();
    const controller = new AbortController();
    registry[methodName] = { controller };
    return controller.signal;
  }

  return { signalFor };
}
