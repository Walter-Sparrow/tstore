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

import { cx } from "class-variance-authority";
import { useFilesContext } from "@/lib/files-context";
import { model } from "../../../../../wailsjs/go/models";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps<TValue> {
  data: model.FileRecord[];
  columns: ColumnDef<model.FileRecord, TValue>[];
}

export function DataTable<TValue>({ data, columns }: DataTableProps<TValue>) {
  const { selectedRows, selectedFile, selectFile, setSelectedRows } =
    useFilesContext();

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.name,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setSelectedRows,
    state: {
      rowSelection: selectedRows,
    },
  });

  return (
    <div className="rounded-md mb-4 pr-4">
      <Table className="relative overflow-auto">
        <TableHeader className="bg-white sticky w-full top-0 ">
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
                    "!bg-purple-50": row.original.name === selectedFile,
                  })}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    if (row.original.name === selectedFile) {
                      selectFile(undefined);
                      return;
                    }

                    selectFile(row.original.name);
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
