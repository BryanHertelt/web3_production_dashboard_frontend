"use client";

import { assetColumns } from "../lib/cryptocurrency-columns";
import { CoreTable } from "@/shared/core-table";
import { useAssetInfo } from "@/entities/asset";
import DataTableLoad from "../../../shared/assets/icons/data-table-icons/data_table_load.svg";
import { useToast } from "@/shared/ui/feedback/toast/ui/toast-context";
import { useEffect, useRef } from "react";

export const DataTable = () => {
  const { data, isLoading, isError } = useAssetInfo({
    portfolioId: "shc34",
    query: {},
  });
  const { addToast } = useToast();
  const hasShownErrorToast = useRef(false);

  const tableCard =
    "bg-base-dark-bg w-1/2 h-1/2 p-4 border-2 border-color-neutral-350 rounded-md";

  // Show toast when error occurs (only once)
  useEffect(() => {
    if (isError && !hasShownErrorToast.current) {
      addToast(
        "Failed to load asset data. Please refresh the page...",
        "error",
        5000
      );
      hasShownErrorToast.current = true;
    }
    // Reset the flag when error is resolved
    if (!isError) {
      hasShownErrorToast.current = false;
    }
  }, [isError, addToast]);

  if (isLoading) {
    return (
      <div className={`${tableCard} flex flex-col justify-center items-center`}>
        <DataTableLoad />
        <p className="text-xl font-extralight text-white"> Asset overview </p>
        <p className="text-color-neutral-300"> Loading... </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`${tableCard} flex flex-col justify-center items-center`}>
        <DataTableLoad />
        <p className="text-xl font-extralight text-white"> Asset overview </p>
        <p className="text-color-neutral-300"> Loading failed </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`${tableCard} flex flex-col justify-center items-center`}>
        Data is undefined...
      </div>
    );
  }

  return (
    <div className={`${tableCard}`}>
      <div className="w-full h-full overflow-scroll">
        <CoreTable columns={assetColumns} data={data.data} />
      </div>
    </div>
  );
};
