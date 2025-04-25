import { useState } from "react";
import styles from "./App.module.css";
import { MenuBar } from "./components/menu-bar";
import { Files } from "./features/file/components/card";
import { DetailsCard } from "./features/file/components/details-card";

export function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.App}>
      <MenuBar />
      <div className={styles.Content}>
        <Files
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
        {!collapsed && <DetailsCard />}
      </div>
    </div>
  );
}
