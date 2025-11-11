import { useState, useCallback, useRef, useEffect } from "react";

/**
 * @function useLoading
 * @description
 * A reusable React hook that manages loading, data, and error states
 * for asynchronous operations such as API calls.
 *
 * It wraps a given async function and provides an `execute` method
 * that runs it while automatically handling state transitions and
 * avoiding state updates after unmount.
 *
 * **Flow:**
 * 1. When `execute` is called → `loading` becomes `true` and `error` resets.
 * 2. The provided async function (`asyncFn`) runs.
 * 3. On success → result is stored in `data`.
 * 4. On failure → caught error is stored in `error`.
 * 5. After completion → `loading` returns to `false`.
 * 6. If the component unmounts before completion, state updates are skipped.
 *
 * @typeParam T - The expected return type of the async function.
 *
 * @param {() => Promise<T>} asyncFn - The asynchronous function to be executed.
 *
 * @returns {{
 *  loading: boolean;
 *  data: T | null;
 *  error: Error | null;
 *  execute: () => Promise<void>;
 * }} An object containing the current `loading`, `data`, and `error` states,
 * and the `execute` trigger.
 *
 * @example
 * ```tsx
 * const { loading, data, error, execute } = useLoading(() => fetchUser());
 *
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 * ```
 */
export function useLoading<T>(asyncFn: () => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Tracks whether the component using the hook is still mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (isMountedRef.current) setData(result);
    } catch (err) {
      if (isMountedRef.current) {
        if (err instanceof Error) setError(err);
        else setError(new Error(String(err)));
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [asyncFn]);

  return { loading, data, error, execute };
}
