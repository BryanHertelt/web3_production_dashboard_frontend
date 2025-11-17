import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  ToastProvider,
  useToast,
} from "@/shared/ui/feedback/toast/ui/toast-context";

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((msg, ...args) => {
    if (typeof msg === "string" && msg.includes("not wrapped in act")) {
      return;
    }
    console.error(msg, ...args);
  });
  jest.useRealTimers();
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("ToastProvider and useToast", () => {
  it("throws error if useToast is used outside provider", () => {
    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used within a ToastProvider"
    );
  });

  it("provides default empty toast list", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    });

    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.addToast).toBe("function");
    expect(typeof result.current.removeToast).toBe("function");
  });

  it("adds a toast when addToast is called", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    });

    act(() => {
      result.current.addToast("Hello toast!", "success", 100);
    });

    expect(result.current.toasts.length).toBe(1);
    const toast = result.current.toasts[0];
    expect(toast.message).toBe("Hello toast!");
    expect(toast.type).toBe("success");
  });

  it("removes a toast when removeToast is called", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    });

    act(() => {
      result.current.addToast("Temporary toast", "info", 100);
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toEqual([]);
  });

  it("auto-removes toast after duration", async () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    });

    act(() => {
      result.current.addToast("Auto toast", "info", 100);
    });

    expect(result.current.toasts.length).toBe(1);
    const toastId = result.current.toasts[0].id;

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(result.current.toasts.find((t) => t.id === toastId)).toBeUndefined();
  });

  it("limits the number of toasts to maximum", () => {
    const MAX_TOASTS = 7;
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    });

    act(() => {
      for (let i = 0; i < MAX_TOASTS + 3; i++) {
        result.current.addToast(`Toast ${i}`, "info", 1000);
      }
    });

    expect(result.current.toasts.length).toBe(MAX_TOASTS);
    expect(result.current.toasts[0].message).toBe("Toast 3");
    expect(
      result.current.toasts[result.current.toasts.length - 1].message
    ).toBe(`Toast ${MAX_TOASTS + 2}`);
  });
});
