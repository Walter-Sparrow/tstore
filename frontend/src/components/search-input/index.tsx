import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { classNames } from "@/utils/classNames";

interface SearchInputProps {
  className?: string;
}

export function SearchInput() {
  return (
    <div className="flex items-center w-full max-w-xs bg-muted px-2 rounded-sm text-xs h-6 shadow-sm">
      <Search className="h-3 w-3 text-gray-400 ml-1" />
      <Input
        type="search"
        placeholder="Search"
        className="flex-1 h-full bg-transparent border-none focus:outline-none placeholder:text-gray-400 shadow-none focus-visible:ring-0 text-xs"
      />
    </div>
  );
}
