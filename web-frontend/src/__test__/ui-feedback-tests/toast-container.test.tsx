import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastContainer } from "@/shared/ui/feedback/toast/ui/toast-container";
import { useToast } from "@/shared/ui/feedback/toast/ui/toast-context";

jest.mock("@/shared/ui/feedback/toast/ui/toast-context", () => ({
  useToast: jest.fn(),
}));

interface MockToastProps {
  message: string;
  onClose: () => void;
}

jest.mock("@/shared/ui/feedback/toast/ui/toast", () => ({
  Toast: ({ message, onClose }: MockToastProps) => (
    <div role="alert" onClick={onClose}>
      {message}
    </div>
  ),
}));

describe("ToastContainer", () => {
  const mockRemoveToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all toasts provided by context", () => {
    (useToast as jest.Mock).mockReturnValue({
      toasts: [
        { id: 1, message: "Toast 1", type: "info" },
        { id: 2, message: "Toast 2", type: "success" },
      ],
      removeToast: mockRemoveToast,
    });

    render(<ToastContainer />);

    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
  });

  it("calls removeToast when a toast is clicked", () => {
    (useToast as jest.Mock).mockReturnValue({
      toasts: [{ id: 10, message: "Clickable toast", type: "error" }],
      removeToast: mockRemoveToast,
    });

    render(<ToastContainer />);

    const toast = screen.getByText("Clickable toast");
    fireEvent.click(toast);

    expect(mockRemoveToast).toHaveBeenCalledWith(10);
  });

  it("renders empty container when no toasts", () => {
    (useToast as jest.Mock).mockReturnValue({
      toasts: [],
      removeToast: mockRemoveToast,
    });

    const { container } = render(<ToastContainer />);

    expect(container.firstChild).toBeInTheDocument();
    expect(screen.queryByText(/Toast/i)).not.toBeInTheDocument();
  });
});
