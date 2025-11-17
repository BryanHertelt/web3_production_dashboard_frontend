import ArrowRight from "../../assets/icons/data-table-icons/arrow_right.svg";
import { SortingArrowsProps } from "../model/types";

export const SortingArrows = <TData,>({
  header,
}: SortingArrowsProps<TData>) => {
  const sortDirection = header.column.getIsSorted();

  return (
    <div className="inline-flex flex-col justify-center items-center gap-0 w-1/12 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowRight
        className={`-rotate-90 w-2 h-2 ${
          sortDirection === "asc" ? "text-white" : "text-gray-500"
        }`}
      />
      <ArrowRight
        className={`rotate-90 w-2 h-2 ${
          sortDirection === "desc" ? "text-white" : "text-gray-500"
        }`}
      />
    </div>
  );
};
