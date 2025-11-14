import { assetColumns } from "../lib/cryptocurrency-columns";
import { DataTableProps } from "../model/type";
import { CoreTable } from "@/shared/core-table";

export const DataTable = (props: DataTableProps) => {
  return <CoreTable columns={assetColumns} data={props.data} />;
};
