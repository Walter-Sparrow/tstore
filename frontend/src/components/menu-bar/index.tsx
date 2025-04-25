import { Minus, Search, Settings, Square, X } from "lucide-react";
import styles from "./styles.module.css";
import { Minimize, ToggleFullscreen, Close } from "@/../wailsjs/go/main/App";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function MenuBar() {
  return (
    <div
      className={styles.MenuBar}
      style={{ "--wails-draggable": "drag" } as React.CSSProperties}
    >
      <div className={styles.StorageControls}>
        <button type="button" className={styles.SettingsBtn}>
          <Settings className={styles.SettingsIcon} />
        </button>
        <Popover>
          <PopoverTrigger>
            <Search className={styles.SearchIcon} />
          </PopoverTrigger>
          <PopoverContent>Place content for the popover here.</PopoverContent>
        </Popover>
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
