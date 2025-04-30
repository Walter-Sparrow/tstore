import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { File, SelectedRows } from "../../types";
import { cx } from "class-variance-authority";
import { Dispatch, SetStateAction } from "react";

interface DataTableProps<TValue> {
  columns: ColumnDef<File, TValue>[];
  data: File[];
  selectedFile: string | undefined;
  selectFile: (id: string | undefined) => void;
  selectedRows: SelectedRows;
  setSelectedRows: Dispatch<SetStateAction<SelectedRows>>;
}

export function DataTable<TValue>({
  columns,
  data,
  selectFile,
  selectedFile,
  selectedRows,
  setSelectedRows,
}: DataTableProps<TValue>) {
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setSelectedRows,
    state: {
      rowSelection: selectedRows,
    },
  });

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="whitespace-nowrap text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              return (
                <TableRow
                  key={row.id}
                  className={cx("rounded-b-xl border-b-0 group", {
                    "!bg-purple-50": row.original.id === selectedFile,
                  })}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    if (row.original.id === selectedFile) {
                      selectFile(undefined);
                      return;
                    }

                    selectFile(row.original.id);
                  }}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const isFirstCell = cellIndex === 0;
                    const isLastCell =
                      cellIndex === row.getVisibleCells().length - 1;

                    return (
                      <TableCell
                        key={cell.id}
                        className={cx(
                          "py-4 border-b-1",
                          {
                            "rounded-l-md border-b-0": isFirstCell,
                            "rounded-r-md": isLastCell,
                          },
                          cell.column.columnDef.meta?.cellClassName
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
