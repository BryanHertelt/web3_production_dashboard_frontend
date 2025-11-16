import DataTableTestComponent from "@/page-components/datatable-test";

export default function DataTablePage() {
  return (
    <div className="flex flex-row w-screen h-screen items-center justify-center bg-black">
      <div className="bg-base-dark-bg w-1/2 h-1/2 p-4 border-2 border-color-neutral-350 rounded-md">
        <div className="w-full h-full overflow-scroll">
          {" "}
          <DataTableTestComponent />{" "}
        </div>
      </div>
    </div>
  );
}
