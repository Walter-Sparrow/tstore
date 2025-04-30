import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { File } from "../../types";
import {
  Calendar,
  Clock,
  Cloud,
  CloudDownload,
  Download,
  FileText,
  HardDrive,
  Tag,
  Trash,
  TrashIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  file: File | undefined;
}

export function DetailsCard({ file }: Props) {
  return (
    <Card className="relative w-full h-full pt-0 gap-0 hidden lg:flex md:w-1/3">
      {file && (
        <CardHeader className="flex flex-row justify-between px-4 py-3 gap-2 items-center border-b-1">
          <div className="flex gap-3 items-center text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            {file?.name}
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button size="icon" variant="ghost">
              <CloudDownload />
            </Button>
            <Button size="icon" variant="ghost">
              <Trash />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-4 relative w-full h-full">
        {file ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="font-medium">{file.createdAt}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <HardDrive className="h-4 w-4" />
                  <span>Size</span>
                </div>
                <p className="font-medium">{file.size} MB</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {file.status === "local" ? (
                    <>
                      <HardDrive className="h-4 w-4 text-emerald-500" />
                      <span>Storage</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 text-sky-500" />
                      <span>Storage</span>
                    </>
                  )}
                </div>
                <p className="font-medium">
                  {file.status === "local" ? "Local Disk" : "Cloud Storage"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <FileText className="h-4 w-4" />
                  <span>Type</span>
                </div>
                <p className="font-medium">Document</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <Textarea
                placeholder="Add a description for this file..."
                className="min-h-[120px] resize-none"
                defaultValue="This document contains the quarterly financial report for Q1 2021. It includes revenue breakdowns, expense analysis, and projections for the upcoming quarters."
              />
            </div>
          </div>
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="flex flex-col items-center">
              <img
                className="w-200"
                src="/images/no-file-selected.png"
                alt="No file selected"
              />
              <h1 className="text-2xl font-bold text-primary">
                No file selected
              </h1>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
