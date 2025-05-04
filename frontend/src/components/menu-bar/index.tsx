import { ArrowLeft, Minus, Settings, Square, X } from "lucide-react";
import styles from "./styles.module.css";
import { Minimize, ToggleFullscreen, Close } from "@/../wailsjs/go/main/App";
import { Button } from "../ui/button";

interface Props {
  currentView: "manager" | "settings";
  setView: (view: "manager" | "settings") => void;
}

export function MenuBar({ currentView, setView }: Props) {
  return (
    <div
      className="flex items-center justify-end"
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
      <div className={styles.AppControls}>
        <button type="button" className={styles.HideBtn} onClick={Minimize}>
          <Minus className={styles.HideIcon} />
        </button>
        <button
          type="button"
          className={styles.MaximizeBtn}
          onClick={ToggleFullscreen}
        >
          <Square className={styles.MaximizeIcon} />
        </button>
        <button type="button" className={styles.CloseBtn} onClick={Close}>
          <X className={styles.CloseIcon} />
        </button>
      </div>
    </div>
  );
}
