import { ColumnDef } from "@tanstack/react-table";
import { File } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { cx } from "class-variance-authority";
import { Cloud, File as FileIcon, FileText, HardDrive } from "lucide-react";

export const columns: ColumnDef<File>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onClick={(e) => e.stopPropagation()}
        className={cx("hidden group-hover:inline-block", {
          "inline-block": row.getIsSelected(),
        })}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 1,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-row items-center gap-2">
        <FileIcon className="h-5 w-5 text-primary" />
        {row.original.name}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      cellClassName: "text-muted-foreground",
    },
    cell: ({ row }) => {
      const status = row.original.status;
      return status === "local" ? (
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Local
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Cloud className="h-4 w-4 text-sky-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Cloud
          </span>
        </div>
      );
    },
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
    status: "local",
  },
  {
    id: "2",
    name: "File 2",
    size: 20,
    createdAt: "2021-02-01",
    status: "local",
  },
  {
    id: "3",
    name: "File 3",
    size: 30,
    createdAt: "2021-03-01",
    status: "cloud",
  },
];
