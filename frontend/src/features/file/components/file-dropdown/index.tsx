import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { model } from "../../../../../wailsjs/go/models";

interface Props {
  file: model.FileRecord;
  icon?: React.ReactNode;
}

export function FileDropdown({ file, icon = <MoreHorizontal /> }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="sr-only">Open menu</span>
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {file.state === 0 ? (
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
            Offload
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>Download</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => e.stopPropagation()}
          variant="destructive"
        >
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
