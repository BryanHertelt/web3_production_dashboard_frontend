"use client";
import { DataTable } from "@/features/data-table";
import { useAssetInfo } from "@/entities/asset";

export default function DataTableTestComponent() {
  const { data, isLoading, isError } = useAssetInfo({
    portfolioId: "shc34",
    query: {},
  });

  if (isLoading) {
    return <> Loading ... </>;
  }

  if (isError) {
    return <> Error...</>;
  }

  if (!data) {
    return <> Data is undefined...</>;
  }

  return <DataTable data={data.data} />;
}
