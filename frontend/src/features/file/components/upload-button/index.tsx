import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { SelectFile, UploadFile } from "@/../wailsjs/go/main/App";
import { useEffect, useState } from "react";
import { EventsOff, EventsOn } from "@/../wailsjs/runtime/runtime";

export function UploadButton() {
  const queryClient = useQueryClient();
  const [uploadPercentage, setUploadPercentage] = useState(0);

  useEffect(() => {
    const unsub = EventsOn("uploadProgress", (percentage: number) => {
      setUploadPercentage(percentage);
    });

    return () => {
      unsub();
      setUploadPercentage(0);
    };
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: UploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const handleFileUpload = async () => {
    setUploadPercentage(0);
    const path = await SelectFile();
    if (!path) return;
    mutate(path);
  };

  return (
    <Button
      size={isPending ? "default" : "icon"}
      onClick={handleFileUpload}
      disabled={isPending}
    >
      {isPending ? (
        <div className="text-white">{uploadPercentage.toFixed(1)}%</div>
      ) : (
        <Plus className="!text-white" />
      )}
    </Button>
  );
}
