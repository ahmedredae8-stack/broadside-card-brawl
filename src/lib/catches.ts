import { FISH_ART } from "@/lib/art";
import { supabase } from "@/integrations/supabase/client";

export const FISH = [
  { id: "sardine", name: "سردين", img: FISH_ART.sardine, price: 12, weight: 50 },
  { id: "mackerel", name: "ماكريل", img: FISH_ART.mackerel, price: 34, weight: 25 },
  { id: "tuna", name: "تونة", img: FISH_ART.tuna, price: 92, weight: 12 },
  { id: "swordfish", name: "سمك السيف", img: FISH_ART.swordfish, price: 175, weight: 7 },
  { id: "turtle", name: "سلحفاة", img: FISH_ART.turtle, price: 214, weight: 4 },
  { id: "pearl", name: "محار اللؤلؤ", img: FISH_ART.pearl, price: 480, weight: 2 },
] as const;
export type FishId = (typeof FISH)[number]["id"];
export const CATCHES_UPDATED = "tos:catches";

/** Rolls a random haul of 1-3 species. */
export function rollHaul(): { id: FishId; qty: number }[] {
  const total = FISH.reduce((s, f) => s + f.weight, 0);
  const picks = new Map<FishId, number>();
  const kinds = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < kinds; i++) {
    let r = Math.random() * total;
    const f = FISH.find((x) => (r -= x.weight) < 0) ?? FISH[0];
    picks.set(f.id, (picks.get(f.id) ?? 0) + 1 + Math.floor(Math.random() * 6));
  }
  return [...picks].map(([id, qty]) => ({ id, qty }));
}

export async function saveHaul(haul: { id: FishId; qty: number }[]) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { error } = await supabase.from("catches").insert(haul.map((h) => ({ user_id: data.user!.id, fish_id: h.id, qty: h.qty })));
  if (!error) window.dispatchEvent(new Event(CATCHES_UPDATED));
  return !error;
}

export async function loadInventory() {
  const { data } = await supabase.from("catches").select("fish_id,qty");
  const totals: Record<string, number> = {};
  for (const r of data ?? []) totals[r.fish_id] = (totals[r.fish_id] ?? 0) + r.qty;
  return totals;
}

export async function sellFish(fishId: string) {
  const { error } = await supabase.from("catches").delete().eq("fish_id", fishId);
  if (!error) window.dispatchEvent(new Event(CATCHES_UPDATED));
  return !error;
}

/** Sells part of one fish stack: removes the rows, then returns the remainder. */
export async function sellFishQty(fishId: string, qty: number, have: number) {
  const { data } = await supabase.auth.getUser();
  if (!data.user || qty <= 0) return false;
  const { error } = await supabase.from("catches").delete().eq("fish_id", fishId);
  if (error) return false;
  const rest = Math.max(0, have - qty);
  if (rest > 0) await supabase.from("catches").insert({ user_id: data.user.id, fish_id: fishId, qty: rest });
  window.dispatchEvent(new Event(CATCHES_UPDATED));
  return true;
}

/** Deterministic hourly price curve for a fish (12 points, last = now). */
export function priceCurve(base: number, hours = 12) {
  const now = new Date();
  const pts: { label: string; price: number }[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600_000);
    const h = d.getHours();
    const seed = Math.sin((d.getDate() * 24 + h) * 12.9898 + base) * 43758.5453;
    const r = seed - Math.floor(seed);
    pts.push({ label: `${h % 12 || 12}\n${h < 12 ? "am" : "pm"}`, price: Math.round(base * (0.6 + r * 0.9) * 10) / 10 });
  }
  return pts;
}
