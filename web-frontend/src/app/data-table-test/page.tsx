"use client";

import { DataTable } from "@/features/data-table";
import { ToastProvider } from "@/shared/ui/feedback/toast/ui/toast-context";
import { ToastContainer } from "@/shared/ui/feedback/toast/ui/toast-container";

export default function DataTablePage() {
  return (
    <ToastProvider>
      <div className="flex flex-row w-screen h-screen items-center justify-center bg-black">
        <DataTable />
      </div>
      <ToastContainer />
    </ToastProvider>
  );
}
