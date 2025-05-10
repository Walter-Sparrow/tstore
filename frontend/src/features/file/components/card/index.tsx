import {
  DownloadCloud,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { columns } from "@/features/file/libs/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { DataTable } from "@/features/file/components/data-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ViewSwitch } from "@/components/view-switch";
import { FileCard } from "../file-card";
import { UploadButton } from "../upload-button";
import { useFilesContext } from "@/lib/files-context";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  collapsed: boolean;
  onCollapse: () => void;
}

export function Files({ collapsed, onCollapse }: Props) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [filter, setFilter] = useState<string>("");

  const { files, selectedFile, selectedRows, setSelectedRows } =
    useFilesContext();

  const accumulatedFilesSize = files.reduce(
    (acc, file) => acc + (file.size || 0),
    0
  );
  const totalFiles = files.length;

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card className="w-full h-full pt-3 gap-2 flex-2 relative">
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
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedRows({})}
              >
                <X />
              </Button>
              <Button variant="outline">
                <DownloadCloud />
                Download
              </Button>
              <Button variant="outline">
                <UploadCloud />
                Offload
              </Button>
              <Button variant="destructive">
                <Trash2 />
                Remove
              </Button>
            </>
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
        <div className="flex flex-row items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {totalFiles} files,{" "}
            {(accumulatedFilesSize / 1024 / 1024).toFixed(2)} MBytes
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
