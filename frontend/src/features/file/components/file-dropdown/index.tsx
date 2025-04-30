import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { File } from "../../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  file: File;
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
        {file.status === "local" ? (
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
