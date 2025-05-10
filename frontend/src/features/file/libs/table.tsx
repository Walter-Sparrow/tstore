import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { cx } from "class-variance-authority";
import { Cloud, File as FileIcon, HardDrive } from "lucide-react";
import { FileDropdown } from "../components/file-dropdown";
import { model } from "../../../../wailsjs/go/models";

export const columns: ColumnDef<model.FileRecord>[] = [
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
      <div className="flex flex-row items-center gap-2 text-ellipsis">
        <FileIcon className="h-5 w-5 text-primary shrink-0" />
        {row.original.name}
      </div>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    meta: {
      cellClassName: "text-muted-foreground",
    },
    cell: ({ row }) => {
      const status = row.original.state;
      return status === 1 /* TODO(ilya): replace with enum */ ? (
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-4 w-4 text-emerald-500 shrink-0" />
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
      return size ? `${(size / 1024 / 1024).toFixed(2)} MB` : "";
    },
  },
  {
    accessorKey: "uploaded_at",
    header: "Uploaded At",
    meta: {
      cellClassName: "text-muted-foreground",
    },
    cell: ({ row }) => {
      const date = new Date(row.original.uploaded_at);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const file = row.original;
      return <FileDropdown file={file} />;
    },
  },
];
