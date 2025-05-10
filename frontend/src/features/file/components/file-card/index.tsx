import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Cloud, File as FileIcon, HardDrive, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckedState } from "@radix-ui/react-checkbox";
import { FileDropdown } from "../file-dropdown";
import { model } from "../../../../../wailsjs/go/models";
import { useFilesContext } from "@/lib/files-context";

interface Props {
  file: model.FileRecord;
  detailsOpened: boolean;
  selected: boolean;
}

export function FileCard({ file, detailsOpened, selected }: Props) {
  const { setSelectedRows, selectFile } = useFilesContext();

  const handleCheckboxChange = (state: CheckedState) => {
    if (state === true) {
      setSelectedRows((prev) => ({
        ...prev,
        [file.name]: true,
      }));
    } else {
      setSelectedRows((prev) => {
        const { [file.name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSelectFile = () => {
    if (detailsOpened) {
      selectFile(undefined);
    } else {
      selectFile(file.name);
    }
  };

  return (
    <Card
      className={`relative transition-colors gap-0 p-0 cursor-pointer hover:border-primary/50 backdrop-blur-sm bg-white/50  ${
        selected
          ? "border-primary bg-primary/10 dark:bg-primary/20"
          : detailsOpened
          ? "border-primary"
          : ""
      }`}
    >
      <CardContent
        className="flex flex-col p-4 pr-1 gap-1"
        onClick={handleSelectFile}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileIcon className="h-8 w-8 text-primary ml-[-4px]" />
            {file.state === model.FileState.local ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400"
              >
                <HardDrive className="h-3 w-3 mr-1" />
                Local
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-400"
              >
                <Cloud className="h-3 w-3 mr-1" />
                Cloud
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={handleCheckboxChange}
            />
            <FileDropdown file={file} icon={<MoreVertical />} />
          </div>
        </div>
        <h3 className="font-medium">{file.name}</h3>
        <p className="text-sm text-slate-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
        <p className="text-sm text-slate-500">
          {new Date(file.uploaded_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </p>
      </CardContent>
    </Card>
  );
}
