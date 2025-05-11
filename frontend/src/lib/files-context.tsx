import { SelectedRows } from "@/features/file/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { GetFilesMetadata } from "../../wailsjs/go/main/App";
import { model } from "../../wailsjs/go/models";
import { EventsOn } from "../../wailsjs/runtime/runtime";

interface FilesContextState {
  files: model.FileRecord[];

  selectedFile: string | undefined;
  selectFile: Dispatch<SetStateAction<string | undefined>>;

  selectedRows: SelectedRows;
  setSelectedRows: Dispatch<SetStateAction<SelectedRows>>;
}

const FilesContext = createContext<FilesContextState>({
  files: [],
  selectedFile: undefined,
  selectFile: () => {},
  selectedRows: {},
  setSelectedRows: () => {},
});

export const useFilesContext = () => useContext(FilesContext);
export function FilesProvider({ children }: PropsWithChildren) {
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [selectedRows, setSelectedRows] = useState<SelectedRows>({});

  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["files"],
    queryFn: GetFilesMetadata,
  });

  useEffect(() => {
    const unsub = EventsOn("fileRenamed", () =>
      queryClient.invalidateQueries({ queryKey: ["files"] })
    );
    const unsub2 = EventsOn("fileRemoved", () =>
      queryClient.invalidateQueries({ queryKey: ["files"] })
    );

    return () => {
      unsub();
      unsub2();
      queryClient.invalidateQueries({ queryKey: ["files"] });
    };
  }, []);

  return (
    <FilesContext.Provider
      value={{
        files: data || [],
        selectedFile,
        selectFile: setSelectedFile,
        selectedRows,
        setSelectedRows,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}
