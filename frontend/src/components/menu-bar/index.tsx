import { Minus, Search, Settings, Square, X } from "lucide-react";
import styles from "./styles.module.css";
import { Minimize, ToggleFullscreen, Close } from "@/../wailsjs/go/main/App";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

export function MenuBar() {
  return (
    <div
      className="flex items-center justify-end"
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost">
          <Settings />
        </Button>
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
