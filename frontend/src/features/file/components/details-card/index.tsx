import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Cloud,
  CloudDownload,
  CloudUpload,
  FileText,
  HardDrive,
  Trash,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { model } from "../../../../../wailsjs/go/models";
import { DescriptionEditor } from "../description-editor";
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
import { useState } from "react";
import { RemoveAlert } from "../remove-alert";

interface Props {
  file: model.FileRecord | undefined;
}

export function DetailsCard({ file }: Props) {
  const queryClient = useQueryClient();

  const [showAlert, setShowAlert] = useState(false);
  const { mutateAsync: deleteFile } = useMutation({
    mutationKey: ["delete", file?.name],
    mutationFn: DeleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isDeleting = useIsMutating({ mutationKey: ["delete", file?.name] }) > 0;

  const { mutateAsync: download } = useMutation({
    mutationKey: ["download", file?.name],
    mutationFn: DownloadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isDownloading =
    useIsMutating({ mutationKey: ["download", file?.name] }) > 0;

  const { mutateAsync: offload } = useMutation({
    mutationKey: ["offload", file?.name],
    mutationFn: OffloadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const isOffloading =
    useIsMutating({ mutationKey: ["offload", file?.name] }) > 0;

  const isPending = isDeleting || isDownloading || isOffloading;

  return (
    <>
      <RemoveAlert
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        handleDelete={() => file && deleteFile(file.name)}
      />
      <Card className="relative w-full h-full pt-0 gap-0 hidden lg:flex md:w-1/3">
        {file && (
          <CardHeader className="flex flex-row justify-between px-4 py-3 gap-2 items-center border-b-1">
            <div className="flex gap-3 items-center text-xl font-semibold w-[75%]">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="truncate" title={file?.name}>
                {file?.name}
              </div>
            </div>
            <div className="flex flex-row items-center gap-2">
              {file.state === model.FileState.cloud && (
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => download(file.name)}
                >
                  <CloudDownload />
                </Button>
              )}
              {file.state === model.FileState.local && (
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => offload(file.name)}
                >
                  <CloudUpload />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                disabled={isPending}
                onClick={() => setShowAlert(true)}
              >
                <Trash />
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent className="p-4 relative w-full h-full">
          {file ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded</span>
                  </div>
                  <p className="font-medium">
                    {new Date(file.uploaded_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <HardDrive className="h-4 w-4" />
                    <span>Size</span>
                  </div>
                  <p className="font-medium">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {file.state === model.FileState.local ? (
                      <>
                        <HardDrive className="h-4 w-4 text-emerald-500" />
                        <span>Storage</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 text-sky-500" />
                        <span>Storage</span>
                      </>
                    )}
                  </div>
                  <p className="font-medium">
                    {file.state === model.FileState.local
                      ? "Local Disk"
                      : "Cloud Storage"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <FileText className="h-4 w-4" />
                    <span>Type</span>
                  </div>
                  <p className="font-medium">Document</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                <DescriptionEditor
                  key={file.name}
                  fileName={file.name}
                  defaultValue={file.description}
                />
              </div>
            </div>
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="flex flex-col items-center">
                <img
                  className="w-200"
                  src="/images/no-file-selected.png"
                  alt="No file selected"
                />
                <h1 className="text-2xl font-bold text-primary">
                  No file selected
                </h1>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
