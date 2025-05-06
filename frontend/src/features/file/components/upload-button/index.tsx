import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { SelectFile, UploadFile } from "@/../wailsjs/go/main/App";

export function UploadButton() {
  const { mutate, isPending } = useMutation({
    mutationFn: UploadFile,
  });

  const handleFileUpload = async () => {
    const path = await SelectFile();
    if (!path) return;
    mutate(path);
  };

  return (
    <Button size="icon" onClick={handleFileUpload}>
      <Plus className="!text-white" />
    </Button>
  );
}
