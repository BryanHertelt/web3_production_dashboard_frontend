"use client";

import { assetColumns } from "../lib/cryptocurrency-columns";
import { CoreTable } from "@/shared/core-table";
import { useAssetInfo } from "@/entities/asset";
import DataTableLoad from "../../../shared/assets/icons/data-table-icons/data_table_load.svg";


export const DataTable = () => {
  const portfolioId = "shc34";
  const { data, isLoading, isError } = useAssetInfo({
    portfolioId,
    query: {},
  });



  const tableCard =
    "bg-base-dark-bg w-1/2 h-1/2 p-4 border-2 border-color-neutral-350 rounded-md";


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
