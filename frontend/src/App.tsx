import { useMemo, useState } from "react";
import styles from "./App.module.css";
import { MenuBar } from "./components/menu-bar";
import { Files } from "./features/file/components/card";
import { DetailsCard } from "./features/file/components/details-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { SettingsForm } from "./features/settings/components/form";
import { Button } from "./components/ui/button";
import { cx } from "class-variance-authority";
import { Save } from "lucide-react";
import { useFilesContext } from "./lib/files-context";

export function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<"manager" | "settings">("manager");

  const { files, selectedFile: selectedFileId } = useFilesContext();

  const selectedFile = useMemo(
    () => files.find((file) => file.name === selectedFileId),
    [selectedFileId]
  );

  return (
    <div className={styles.App}>
      <MenuBar currentView={view} setView={setView} />
      <div
        className={cx(styles.Content, {
          "justify-center": view === "settings",
        })}
      >
        {view === "manager" ? (
          <>
            <Files
              collapsed={collapsed}
              onCollapse={() => setCollapsed(!collapsed)}
            />
            {!collapsed && <DetailsCard file={selectedFile} />}
          </>
        ) : (
          <Card className="flex flex-1">
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure your tstore application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              <SettingsForm onSuccess={() => setView("manager")} />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="settings-form">
                <Save />
                Save
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
