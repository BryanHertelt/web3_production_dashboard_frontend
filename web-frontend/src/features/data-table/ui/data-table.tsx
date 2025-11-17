"use client";

import { assetColumns } from "../lib/cryptocurrency-columns";
import { CoreTable } from "@/shared/core-table";
import { useAssetInfo } from "@/entities/asset";
import DataTableLoad from "../../../shared/assets/icons/data-table-icons/data_table_load.svg";
import { useToast } from "@/shared/ui/feedback/toast/ui/toast-context";
import { useEffect, useRef, useMemo } from "react";
import { logger } from "@/shared/logger/client-logger";

export const DataTable = () => {
  const portfolioId = "shc34";
  const { data, isLoading, isError, error } = useAssetInfo({
    portfolioId,
    query: {},
  });
  const { addToast } = useToast();
  const hasShownErrorToast = useRef(false);
  const loadingStartTime = useRef<number | null>(null);

  const tableLogger = useMemo(
    () => logger.child({ component: "DataTable", portfolioId }),
    [portfolioId]
  );

  const tableCard =
    "bg-base-dark-bg w-1/2 h-1/2 p-4 border-2 border-color-neutral-350 rounded-md";

  useEffect(() => {
    tableLogger.debug({ query: {} }, "DataTable mounted");
  }, [tableLogger]);

  useEffect(() => {
    if (isLoading) {
      loadingStartTime.current = performance.now();
      tableLogger.info({ operation: "fetchData" }, "Loading asset data");
    }

    if (!isLoading && loadingStartTime.current !== null) {
      const loadingTime = performance.now() - loadingStartTime.current;
      const rowCount = data?.data?.length || 0;
      const logLevel = loadingTime >= 3000 ? "warn" : "info";

      tableLogger[logLevel](
        {
          operation: "fetchData",
          loadingTimeMs: Math.round(loadingTime),
          rowCount,
          metric: "dataLoadDuration",
        },
        `Data loaded in ${Math.round(loadingTime)}ms`
      );

      loadingStartTime.current = null;
    }

    if (isError && error) {
      tableLogger.error(
        {
          operation: "fetchData",
          error: error.message,
          errorName: error.name,
          toastShown: hasShownErrorToast.current,
          skeletonDisplayed: true,
        },
        "Error skeleton displayed - Failed to load asset data"
      );
    }

    if (data && !isError && !isLoading) {
      tableLogger.info(
        {
          operation: "fetchData",
          rowCount: data.data?.length || 0,
          success: true,
        },
        "Asset data loaded successfully"
      );
    }
  }, [isLoading, isError, data, error, tableLogger]);

  useEffect(() => {
    if (isError && !hasShownErrorToast.current) {
      addToast(
        "Failed to load asset data. Please refresh the page...",
        "error",
        5000
      );
      hasShownErrorToast.current = true;
    }

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
