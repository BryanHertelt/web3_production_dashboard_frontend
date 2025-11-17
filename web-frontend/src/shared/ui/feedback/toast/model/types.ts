export interface Toast {
  id: string;
  message?: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}
