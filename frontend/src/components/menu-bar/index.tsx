import { ArrowLeft, Minus, Settings, Square, X } from "lucide-react";
import styles from "./styles.module.css";
import { Minimize, ToggleFullscreen, Close } from "@/../wailsjs/go/main/App";
import { Environment } from "@/../wailsjs//runtime/runtime";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { cx } from "class-variance-authority";

interface Props {
  currentView: "manager" | "settings";
  setView: (view: "manager" | "settings") => void;
}

export function MenuBar({ currentView, setView }: Props) {
  const { data } = useQuery({
    queryKey: ["platform"],
    queryFn: Environment,
  });

  const isWindows = data?.platform === "windows";

  return (
    <div
      className={cx(
        "flex items-center",
        isWindows ? "justify-between" : "justify-end"
      )}
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        {currentView === "manager" ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setView("settings")}
          >
            <Settings />
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setView("manager")}>
            <ArrowLeft />
            Settings
          </Button>
        )}
      </div>
      <div
        className={cx("flex items-center gap-2", {
          hidden: !isWindows,
        })}
      >
        <Button size="icon" variant="ghost" onClick={Minimize}>
          <Minus />
        </Button>
        <Button size="icon" variant="ghost" onClick={ToggleFullscreen}>
          <Square />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={Close}
          className="hover:bg-red-400 hover:text-white"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
