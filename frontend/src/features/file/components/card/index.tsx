import {
  DownloadCloud,
  List,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Sidebar,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { columns, mockData } from "@/features/file/libs/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { DataTable } from "@/features/file/components/data-table";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { File, SelectedRows } from "../../types";
import { SearchInput } from "@/components/search-input";
import { Input } from "@/components/ui/input";
import { ViewSwitch } from "@/components/view-switch";
import { FileCard } from "../file-card";

interface Props {
  collapsed: boolean;
  onCollapse: () => void;
  selectedFile: string | undefined;
  selectFile: (id: string | undefined) => void;
}

export function Files({
  collapsed,
  onCollapse,
  selectFile,
  selectedFile,
}: Props) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedRows, setSelectedRows] = useState<SelectedRows>({});
  const [filter, setFilter] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const accumulatedFilesSize = mockData.reduce(
    (acc, file) => acc + (file.size || 0),
    0
  );
  const totalFiles = mockData.length;

  const filteredFiles = mockData.filter((file) =>
    file.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card className="w-full h-full pt-3 gap-2 flex-2 relative">
      <CardHeader className="flex flex-row justify-between px-3">
        <div className="flex items-center gap-2">
          <Button size="icon" onClick={() => inputRef.current?.click()}>
            <Plus className="!text-white" />
          </Button>
          <input ref={inputRef} type="file" className="hidden" />
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
      <CardContent className="px-[14px]">
        {view === "list" ? (
          <DataTable
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            selectedFile={selectedFile}
            selectFile={selectFile}
            columns={columns}
            data={filteredFiles}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                selected={Boolean(selectedRows[file.id])}
                detailsOpened={selectedFile === file.id}
                selectFile={selectFile}
                setSelectedRows={setSelectedRows}
              />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter
        className={`
          absolute flex px-3 py-2 w-full bottom-0
          border-t-1 border-t-muted-foreground border-t-opacity-50
        `}
      >
        <div className="flex flex-row items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {totalFiles} files, {accumulatedFilesSize} MBytes
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
