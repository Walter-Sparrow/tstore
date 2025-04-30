export interface File {
  id: string;
  name: string;
  size?: number;
  createdAt: string;
  status: "local" | "cloud";
}
