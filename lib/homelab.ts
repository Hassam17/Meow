export type HomelabStatus = {
  services: { name: string; status: "up" | "down"; uptime: string }[];
  last_checked: string;
} | null;

export async function getHomelabStatus(): Promise<HomelabStatus> {
  throw new Error("getHomelabStatus not implemented yet — see Phase 4");
}
