import {
  Cloud,
  File,
  HardDrive,
  Info,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from "lucide-react";
import { getColumns } from "@/features/file/libs/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { DataTable } from "@/features/file/components/data-table";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ViewSwitch } from "@/components/view-switch";
import { FileCard } from "../file-card";
import { UploadButton } from "../upload-button";
import { useFilesContext } from "@/lib/files-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { model } from "../../../../../wailsjs/go/models";
import { GroupButtons } from "../group-buttons";

interface Props {
  collapsed: boolean;
  onCollapse: () => void;
}

export function Files({ collapsed, onCollapse }: Props) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [filter, setFilter] = useState<string>("");

  const { files, selectedFile, selectedRows, setSelectedRows } =
    useFilesContext();

  const hasSelectedRows = Object.keys(selectedRows).length > 0;

  const [cloudSize, localSize] = useMemo(
    () =>
      files.reduce(
        (acc, file) => {
          if (file.state === model.FileState.cloud) {
            acc[0] += file.size / 1024 / 1024;
          } else {
            acc[1] += file.size / 1024 / 1024;
          }
          return acc;
        },
        [0, 0]
      ),
    [files]
  );

  const totalFiles = files.length;

  const filteredFiles = useMemo(
    () =>
      files.filter((file) =>
        file.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [files, filter]
  );

  const columns = useMemo(() => getColumns(hasSelectedRows), [hasSelectedRows]);

  return (
    <Card className="w-full h-full pt-3 gap-2 flex-2 relative overflow-hidden">
      <CardHeader className="flex flex-row justify-between px-3">
        <div className="flex items-center gap-2">
          <UploadButton />
          <div className="relative flex items-center max-w-2xl ">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search files..."
              className=" pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-row items-center space-x-2">
          {Object.keys(selectedRows).length > 0 ? (
            <GroupButtons
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
            />
          ) : (
            <>
              <ViewSwitch value={view} onChange={setView} />
              <Button variant="secondary" size="icon" onClick={onCollapse}>
                {collapsed ? <PanelRightOpen /> : <PanelRightClose />}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-[14px] pb-[14px] flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full mb-1">
          {view === "list" ? (
            <DataTable data={filteredFiles} columns={columns} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pr-4 mb-4">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.name}
                  file={file}
                  selected={Boolean(selectedRows[file.name])}
                  detailsOpened={selectedFile === file.name}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter
        className={`
          absolute flex px-3 py-2 w-full bottom-0
          border-t-1 border-t-muted-foreground border-t-opacity-50
        `}
      >
        <div className="w-full  text-sm text-slate-600 flex items-center gap-1 flex-wrap">
          <div className="flex items-center mr-3">
            <File size={16} className="mr-1.5 text-slate-500" />
            <span>{totalFiles} files</span>
          </div>

          <div className="flex items-center mr-3">
            <Cloud size={16} className="mr-1.5 text-blue-500" />
            <span>{cloudSize.toFixed(2)}MB in cloud</span>
          </div>

          <div className="flex items-center">
            <HardDrive size={16} className="mr-1.5 text-green-500" />
            <span>{localSize.toFixed(2)}MB in local</span>
          </div>

          <div className="ml-auto hidden sm:flex items-center">
            <Info size={16} className="text-slate-400" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
