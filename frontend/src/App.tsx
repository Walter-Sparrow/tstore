import { useMemo, useState } from "react";
import styles from "./App.module.css";
import { MenuBar } from "./components/menu-bar";
import { Files } from "./features/file/components/card";
import { DetailsCard } from "./features/file/components/details-card";
import { mockData } from "./features/file/libs/table";

export function App() {
  const [selectedFileId, setSelectedFile] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState(false);

  const selectedFile = useMemo(
    () => mockData.find((file) => file.id === selectedFileId),
    [selectedFileId]
  );

  return (
    <div className={styles.App}>
      <MenuBar />
      <div className={styles.Content}>
        <Files
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
          selectFile={setSelectedFile}
          selectedFile={selectedFileId}
        />
        {!collapsed && <DetailsCard file={selectedFile} />}
      </div>
    </div>
  );
}
