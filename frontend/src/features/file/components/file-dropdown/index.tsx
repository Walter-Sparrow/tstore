import { Button } from "@/components/ui/button";
import { Loader, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { model } from "../../../../../wailsjs/go/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OffloadFile } from "../../../../../wailsjs/go/main/App";
import { toast } from "sonner";

interface Props {
  file: model.FileRecord;
  icon?: React.ReactNode;
}

export function FileDropdown({ file, icon = <MoreHorizontal /> }: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync: offload, isPending } = useMutation({
    mutationFn: OffloadFile,
  });

  const handleOffload: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    offload(file.name)
      .then(() => queryClient.invalidateQueries({ queryKey: ["files"] }))
      .catch((err) => toast.error(err.message));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="sr-only">Open menu</span>
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {file.state === model.FileState.local ? (
          <DropdownMenuItem disabled={isPending} onClick={handleOffload}>
            {isPending && <Loader className="animate-spin" />}
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
