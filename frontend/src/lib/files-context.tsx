import { SelectedRows } from "@/features/file/types";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { GetFilesMetadata } from "../../wailsjs/go/main/App";
import { model } from "../../wailsjs/go/models";

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

  const { data } = useQuery({
    queryKey: ["files"],
    queryFn: GetFilesMetadata,
  });

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
