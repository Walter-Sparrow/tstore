import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { App } from "./App";
import { Toaster } from "./components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FilesProvider } from "./lib/files-context";

const container = document.getElementById("root");

const queryClient = new QueryClient();
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FilesProvider>
        <App />
        <Toaster position="top-right" />
      </FilesProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
