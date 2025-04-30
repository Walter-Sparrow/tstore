import { Grid, List } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
}

export function ViewSwitch({ value, onChange }: Props) {
  return (
    <div
      className="flex items-center"
      onClick={() => onChange(value === "grid" ? "list" : "grid")}
    >
      <Button
        variant={value === "grid" ? "secondary" : "default"}
        size="icon"
        className="border-r-0 rounded-r-none"
      >
        <List />
      </Button>
      <Button
        variant={value === "grid" ? "default" : "secondary"}
        size="icon"
        className="border-l-0 rounded-l-none"
      >
        <Grid />
      </Button>
    </div>
  );
}
