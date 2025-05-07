import { model } from "wailsjs/go/models";

export interface SelectedRows {
  [id: model.FileRecord["name"]]: boolean;
}
