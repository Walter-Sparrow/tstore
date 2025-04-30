import {
  List,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Sidebar,
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
import { useState } from "react";

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
  const accumulatedFilesSize = mockData.reduce(
    (acc, file) => acc + (file.size || 0),
    0
  );
  const totalFiles = mockData.length;

  return (
    <Card className="w-full h-full pt-2 gap-2 flex-2 relative">
      <CardHeader className="flex flex-row justify-between px-3">
        <Button size="icon">
          <Plus className="!text-white" />
        </Button>
        <div className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon">
            <List />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCollapse}>
            {collapsed ? <PanelRightOpen /> : <PanelRightClose />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-[14px]">
        <DataTable
          selectedFile={selectedFile}
          selectFile={selectFile}
          columns={columns}
          data={mockData}
        />
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
