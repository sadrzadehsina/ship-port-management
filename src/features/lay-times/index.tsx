import { createColumnHelper } from "@tanstack/react-table";

import type { LayTime } from "@/types";

import { getCountryFlag } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { useAllLayTimes } from "@/queries/use-all-lay-times";

type LayTimesProps = {
  onRowSelect?: (layTime: LayTime) => void;
  selectedRowId?: string;
};

export function LayTimes({ onRowSelect, selectedRowId }: LayTimesProps) {
  const { data, isLoading, error } = useAllLayTimes();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading lay times</div>;
  }

  return (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-lg shadow">
      <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2">
        Lay Times
      </h1>
      <DataTable
        data={data}
        columns={columns}
        onRowSelect={onRowSelect}
        selectedRowId={selectedRowId}
      />
    </div>
  );
}

const columnHelper = createColumnHelper<LayTime>();

const columns = [
  columnHelper.accessor("portName", {
    header: "Port Name",
    cell: (info) => {
      const countryName = info.getValue();
      const flag = getCountryFlag(countryName);
      return (
        <div className="flex items-center gap-2">
          <span>{countryName}</span>
          <span className="text-2xl">{flag}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("cargo", {
    header: "Cargo",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("f", {
    header: "F",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("blCode", {
    header: "BL Code",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("quantity", {
    header: "Quantity",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("ldRate", {
    header: "LD Rate",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("term", {
    header: "Term",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("demRate", {
    header: "DEM Rate",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("desRate", {
    header: "DES Rate",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("allowed", {
    header: "Allowed",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("used", {
    header: "Used",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("deduction", {
    header: "Deduction",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("balance", {
    header: "Balance",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("laycanFrom", {
    header: "Laycan From",
    cell: (info) => {
      const dateValue = info.getValue();
      // Ensure we have a proper Date object
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return <span>Invalid Date</span>;
      }

      return (
        <div className="flex flex-col">
          <span className="font-medium">{date.toLocaleDateString()}</span>
          <span className="text-sm text-gray-500">
            {date.toLocaleTimeString()}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("laycanTo", {
    header: "Laycan To",
    cell: (info) => {
      const dateValue = info.getValue();
      // Ensure we have a proper Date object
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return <span>Invalid Date</span>;
      }

      return (
        <div className="flex flex-col">
          <span className="font-medium">{date.toLocaleDateString()}</span>
          <span className="text-sm text-gray-500">
            {date.toLocaleTimeString()}
          </span>
        </div>
      );
    },
  }),
];
