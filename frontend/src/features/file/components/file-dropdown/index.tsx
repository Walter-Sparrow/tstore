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
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DeleteFile,
  DownloadFile,
  OffloadFile,
} from "../../../../../wailsjs/go/main/App";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { EventsOn } from "../../../../../wailsjs/runtime/runtime";
import { RemoveAlert } from "../remove-alert";

interface Props {
  file: model.FileRecord;
  icon?: React.ReactNode;
}

export function FileDropdown({ file, icon = <MoreHorizontal /> }: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync: offload } = useMutation({
    mutationKey: ["offload", file.name],
    mutationFn: OffloadFile,
  });
  const isOffloading =
    useIsMutating({
      mutationKey: ["offload", file.name],
    }) > 0;

  const handleOffload: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    offload(file.name)
      .then(() => queryClient.invalidateQueries({ queryKey: ["files"] }))
      .catch((err) => toast.error(err.message));
  };

  const [downloadProgress, setDownloadProgress] = useState(0);
  const { mutateAsync: download } = useMutation({
    mutationKey: ["download", file.name],
    mutationFn: DownloadFile,
  });
  const isDownloading =
    useIsMutating({
      mutationKey: ["download", file.name],
    }) > 0;

  useEffect(() => {
    const unsub = EventsOn(
      `downloadProgress/${file.name}`,
      (percentage: number) => {
        setDownloadProgress(percentage);
      }
    );

    return () => {
      unsub();
      setDownloadProgress(0);
    };
  }, [file.name]);

  const handleDownload: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    setDownloadProgress(0);

    download(file.name)
      .then(() => queryClient.invalidateQueries({ queryKey: ["files"] }))
      .catch((err) => toast.error(err.message))
      .finally(() => {
        setDownloadProgress(0);
      });
  };

  const [showAlert, setShowAlert] = useState(false);
  const { mutateAsync: deleteFile } = useMutation({
    mutationKey: ["delete", file.name],
    mutationFn: DeleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isDeleting =
    useIsMutating({
      mutationKey: ["delete", file.name],
    }) > 0;

  const handleDelete: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    deleteFile(file.name).catch((err) => toast.error(err.message));
  };

  if (isOffloading || isDeleting) {
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
    <>
      <DropdownMenu modal={false}>
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
            <DropdownMenuItem onClick={handleDownload}>
              Download
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowAlert(true);
            }}
            variant="destructive"
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveAlert
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        handleDelete={handleDelete}
      />
    </>
  );
}
