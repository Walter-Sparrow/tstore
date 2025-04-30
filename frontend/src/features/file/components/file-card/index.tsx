import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { File, SelectedRows } from "../../types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Cloud,
  CloudOff,
  Download,
  File as FileIcon,
  HardDrive,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";
import { CheckedState } from "@radix-ui/react-checkbox";
import { FileDropdown } from "../file-dropdown";

interface Props {
  file: File;
  detailsOpened: boolean;
  selected: boolean;
  selectFile: (id: string | undefined) => void;
  setSelectedRows: Dispatch<SetStateAction<SelectedRows>>;
}

export function FileCard({
  file,
  detailsOpened,
  selected,
  selectFile,
  setSelectedRows,
}: Props) {
  const handleCheckboxChange = (state: CheckedState) => {
    if (state === true) {
      setSelectedRows((prev) => ({
        ...prev,
        [file.id]: true,
      }));
    } else {
      setSelectedRows((prev) => {
        const { [file.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSelectFile = () => {
    if (detailsOpened) {
      selectFile(undefined);
    } else {
      selectFile(file.id);
    }
  };

  return (
    <Card
      className={`relative transition-colors gap-0 p-0 backdrop-blur-sm bg-white/50  ${
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
            {file.status === "local" ? (
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
        <p className="text-sm text-slate-500">{file.size} MB</p>
        <p className="text-sm text-slate-500">{file.createdAt}</p>
      </CardContent>
    </Card>
  );
}
