"use client";

import { assetColumns } from "../lib/cryptocurrency-columns";
import { CoreTable } from "@/shared/core-table";
import { useAssetInfo } from "@/entities/asset";
import { Spinner } from "@/shared/ui/feedback/spinner";

export const DataTable = () => {
  const { data, isLoading, isError } = useAssetInfo({
    portfolioId: "shc34",
    query: {},
  });

  const tableCard =
    "bg-base-dark-bg w-1/2 h-1/2 p-4 border-2 border-color-neutral-350 rounded-md";

  if (isLoading) {
    return (
      <div className={`${tableCard} flex flex-row justify-center items-center`}>
        {" "}
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <> Error...</>;
  }

  if (!data) {
    return <> Data is undefined...</>;
  }

  return (
    <div className={`${tableCard}`}>
      <div className="w-full h-full overflow-scroll">
        {" "}
        <CoreTable columns={assetColumns} data={data.data} />{" "}
      </div>
    </div>
  );
};
