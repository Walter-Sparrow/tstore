import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { SelectFile, UploadFile } from "@/../wailsjs/go/main/App";
import { useEffect, useState } from "react";
import { EventsOn } from "@/../wailsjs/runtime/runtime";

export function UploadButton() {
  const queryClient = useQueryClient();
  const [uploadPercentage, setUploadPercentage] = useState(0);

  const [syncJobName, setSyncJobName] = useState<string | null>(null);
  const [syncPercentage, setSyncPercentage] = useState(0);

  useEffect(() => {
    const unsub = EventsOn("uploadProgress", (percentage: number) => {
      setUploadPercentage(percentage);
    });
    return () => {
      unsub();
      setUploadPercentage(0);
    };
  }, []);

  useEffect(() => {
    const unsubStart = EventsOn("syncStart", (name) => {
      setSyncJobName(name);
      setSyncPercentage(0);
    });
    const unsubProgress = EventsOn("syncProgress", (name, pct) => {
      setSyncJobName(name);
      setSyncPercentage(pct);
    });
    const unsubDone = EventsOn("syncSuccess", () => {
      setSyncJobName(null);
      setSyncPercentage(0);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    });
    const unsubError = EventsOn("syncError", (name, err) => {
      setSyncJobName(null);
      setSyncPercentage(0);
      console.error(`Sync error for ${name}:`, err);
    });
    return () => {
      unsubStart();
      unsubProgress();
      unsubDone();
      unsubError();
      setSyncJobName(null);
      setSyncPercentage(0);
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

  const busy = isPending || syncJobName !== null;

  return (
    <Button
      size={busy ? "default" : "icon"}
      onClick={handleFileUpload}
      disabled={busy}
    >
      {isPending ? (
        <div className="text-white">{uploadPercentage.toFixed(1)}%</div>
      ) : syncJobName ? (
        <div className="text-white">
          {syncJobName}: {syncPercentage.toFixed(1)}%
        </div>
      ) : (
        <Plus className="!text-white" />
      )}
    </Button>
  );
}
