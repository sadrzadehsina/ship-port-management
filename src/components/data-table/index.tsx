import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Table, TableCell, TableHead, TableRow } from "../ui/table";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  onRowSelect?: (row: T) => void;
  selectedRowId?: string;
  validationViolations?: number[];
};

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowSelect,
  selectedRowId,
  validationViolations = []
}: DataTableProps<T>) {
  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      <Table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="bg-gray-100">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const rowData = row.original as any;
            const isSelected = onRowSelect && selectedRowId === rowData?.id;
            const hasViolation = validationViolations.includes(row.index);
            
            return (
              <TableRow 
                key={row.id}
                className={`${isSelected ? 'bg-blue-50 border-blue-200' : hasViolation ? '!bg-red-200 border-red-400' : 'hover:bg-gray-50'} ${onRowSelect ? 'cursor-pointer' : ''}`}
                onClick={() => onRowSelect?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
