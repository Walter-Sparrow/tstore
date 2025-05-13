import { Button } from "@/components/ui/button";
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { DownloadCloud, Loader, Trash2, UploadCloud, X } from "lucide-react";
import {
  DeleteFile,
  DownloadFile,
  OffloadFile,
} from "../../../../../wailsjs/go/main/App";

interface Props {
  selectedRows: Record<string, boolean>;
  setSelectedRows: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}

export function GroupButtons({ selectedRows, setSelectedRows }: Props) {
  const queryClient = useQueryClient();

  const { mutateAsync: remove } = useMutation({
    mutationKey: ["delete"],
    mutationFn: DeleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isDeleting =
    useIsMutating({
      mutationKey: ["delete"],
    }) > 0;
  const handleDelete = () => {
    const selectedFiles = Object.keys(selectedRows).filter(
      (file) => selectedRows[file]
    );
    selectedFiles.forEach(async (file) => await remove(file));
  };

  const { mutateAsync: download } = useMutation({
    mutationKey: ["download"],
    mutationFn: DownloadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isDownloading = useIsMutating({ mutationKey: ["download"] }) > 0;
  const handleDownload = () => {
    const selectedFiles = Object.keys(selectedRows).filter(
      (file) => selectedRows[file]
    );
    selectedFiles.forEach(async (file) => await download(file));
  };

  const { mutateAsync: offload } = useMutation({
    mutationKey: ["offload"],
    mutationFn: OffloadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isOffloading = useIsMutating({ mutationKey: ["offload"] }) > 0;
  const handleOffload = () => {
    const selectedFiles = Object.keys(selectedRows).filter(
      (file) => selectedRows[file]
    );
    selectedFiles.forEach(async (file) => await offload(file));
  };

  const isPending = isDeleting || isDownloading || isOffloading;

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setSelectedRows({})}>
        <X />
      </Button>
      <Button variant="outline" disabled={isPending} onClick={handleDownload}>
        {isDownloading ? (
          <Loader className="animate-spin" />
        ) : (
          <DownloadCloud />
        )}
        Download
      </Button>
      <Button variant="outline" disabled={isPending} onClick={handleOffload}>
        {isOffloading ? <Loader className="animate-spin" /> : <UploadCloud />}
        Offload
      </Button>
      <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
        <Trash2 />
        Remove
      </Button>
    </>
  );
}
