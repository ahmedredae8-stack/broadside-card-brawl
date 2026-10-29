import seaThemes from "@/data/seaThemes.json";
import type { SeaTheme } from "@/components/SeaScene";

export type SeaWorld = SeaTheme & { name: string; thumb: string };
export const SEA_WORLDS = seaThemes as unknown as SeaWorld[];
const KEY = "ib.seaWorld";
export const SEA_WORLD_EVENT = "ib:sea-world";

export const getSeaWorld = (id: string | null | undefined) => SEA_WORLDS.find((w) => w.id === id) ?? SEA_WORLDS[0]!;

export function loadSeaWorldId(): string {
  try { return localStorage.getItem(KEY) ?? SEA_WORLDS[0]!.id; } catch { return SEA_WORLDS[0]!.id; }
}

export function saveSeaWorldId(id: string) {
  try { localStorage.setItem(KEY, id); } catch { /* storage blocked */ }
  window.dispatchEvent(new CustomEvent(SEA_WORLD_EVENT, { detail: id }));
}
