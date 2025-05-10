import { Button } from "@/components/ui/button";
import { Download, Loader, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { model } from "../../../../../wailsjs/go/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DownloadFile, OffloadFile } from "../../../../../wailsjs/go/main/App";
import { toast } from "sonner";
import { useState } from "react";
import { EventsOn } from "../../../../../wailsjs/runtime/runtime";

interface Props {
  file: model.FileRecord;
  icon?: React.ReactNode;
}

export function FileDropdown({ file, icon = <MoreHorizontal /> }: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync: offload, isPending: isOffloading } = useMutation({
    mutationFn: OffloadFile,
  });

  const handleOffload: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    offload(file.name)
      .then(() => queryClient.invalidateQueries({ queryKey: ["files"] }))
      .catch((err) => toast.error(err.message));
  };

  const [downloadProgress, setDownloadProgress] = useState(0);
  const { mutateAsync: download, isPending: isDownloading } = useMutation({
    mutationFn: DownloadFile,
  });

  const handleDownload: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    setDownloadProgress(0);
    const unsub = EventsOn(
      `downloadProgress/${file.name}`,
      (percentage: number) => {
        setDownloadProgress(percentage);
      }
    );

    download(file.name)
      .then(() => queryClient.invalidateQueries({ queryKey: ["files"] }))
      .catch((err) => toast.error(err.message))
      .finally(() => {
        unsub();
        setDownloadProgress(0);
      });
  };

  if (isOffloading) {
    return <Loader className="h-9 w-4 text-primary shrink-0 animate-spin" />;
  }

  if (isDownloading) {
    return (
      <div className="h-9 flex items-center gap-2">
        {downloadProgress.toFixed(1)}%
        <Download className="h-4 w-4 text-primary shrink-0" />
      </div>
    );
  }

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
          <DropdownMenuItem onClick={handleOffload}>Offload</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleDownload}>Download</DropdownMenuItem>
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
