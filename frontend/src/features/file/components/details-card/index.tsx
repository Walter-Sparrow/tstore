import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function DetailsCard() {
  return (
    <Card className="w-full h-full pt-2 gap-2 flex-1">
      <CardHeader className="flex flex-row justify-end px-3"></CardHeader>
      <CardContent className="px-0"></CardContent>
    </Card>
  );
}
