import { List, PanelRightClose, PanelRightOpen, Sidebar } from "lucide-react";
import { columns, mockData } from "@/features/file/libs/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";

interface Props {
  collapsed: boolean;
  onCollapse: () => void;
}

export function Files({ collapsed, onCollapse }: Props) {
  const accumulatedFilesSize = mockData.reduce(
    (acc, file) => acc + (file.size || 0),
    0
  );
  const totalFiles = mockData.length;

  return (
    <Card className="w-full h-full pt-2 gap-2 flex-2 relative">
      <CardHeader className="flex flex-row justify-end px-3">
        <div className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon">
            <List />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCollapse}>
            {collapsed ? <PanelRightOpen /> : <PanelRightClose />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <DataTable columns={columns} data={mockData} />
      </CardContent>
      <CardFooter className="flex px-3 py-2 absolute bottom-0 w-full border-t-1 border-t-muted-foreground border-t-opacity-50">
        <div className="flex flex-row items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            {totalFiles} files, {accumulatedFilesSize} bytes
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
