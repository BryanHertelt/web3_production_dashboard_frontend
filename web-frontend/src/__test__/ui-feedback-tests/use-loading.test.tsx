import { renderHook, act } from "@testing-library/react";
import { useLoading } from "@/shared/ui/feedback/hooks/use-loading";

describe("useLoading", () => {
  it("handles successful async function", async () => {
    const mockFn = jest.fn(async () => "Success");
    const { result } = renderHook(() => useLoading(mockFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.execute();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe("Success");
    expect(result.current.error).toBeNull();
  });

  it("handles async function error", async () => {
    const mockFn = jest.fn(async () => {
      throw new Error("Failed");
    });

    const { result } = renderHook(() => useLoading(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed");
  });

  it("sets loading correctly during execution", async () => {
    let resolveFn: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolveFn = resolve;
    });

    const mockFn = jest.fn(() => promise);
    const { result } = renderHook(() => useLoading(mockFn));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveFn!("done");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe("done");
  });

  it("converts non-Error thrown values into Error instances", async () => {
    const mockFn = jest.fn(async () => {
      throw "some failure";
    });

    const { result } = renderHook(() => useLoading(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("some failure");
  });

  it("does not update state if unmounted before async resolves", async () => {
    let resolveFn: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolveFn = resolve;
    });

    const mockFn = jest.fn(() => promise);
    const { result, unmount } = renderHook(() => useLoading(mockFn));

    act(() => {
      result.current.execute();
    });

    unmount();

    await act(async () => {
      resolveFn!("late result");
      await promise;
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    expect(result.current.loading).toBe(true);
  });
});
