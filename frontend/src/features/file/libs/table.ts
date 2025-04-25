import { ColumnDef } from "@tanstack/react-table";
import { File } from "../types";

export const columns: ColumnDef<File>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "size",
    header: "Size",
    meta: {
      cellClassName: "text-muted-foreground",
    },
    cell: ({ row }) => {
      const size = row.original.size;
      return size ? `${size} MB` : "";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    meta: {
      cellClassName: "text-muted-foreground",
    },
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
  },
];

export const mockData: File[] = [
  {
    id: "1",
    name: "File 1",
    size: 10,
    createdAt: "2021-01-01",
  },
  {
    id: "2",
    name: "File 2",
    size: 20,
    createdAt: "2021-02-01",
  },
  {
    id: "3",
    name: "File 3",
    size: 30,
    createdAt: "2021-03-01",
  },
];
