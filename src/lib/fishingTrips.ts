import { useEffect, useState } from "react";
import { fleetCatalog, RARITY_ORDER } from "@/lib/fleetCatalog";

/** Simple local fishing trips: start → countdown by ship trip length → collect that ship's fish. */
export type Trip = { code: string; startedAt: number; endsAt: number };
export type Haul = { name_ar: string; rarity_ar: string; qty: number };
const KEY = "tos.trips";
const BAG = "tos.fishBag";
const EVT = "tos:trips";

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
const write = (k: string, v: unknown) => { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event(EVT)); };

export function startTrip(code: string) {
  const ship = fleetCatalog.find((s) => s.code === code);
  if (!ship) return;
  const trips = read<Record<string, Trip>>(KEY, {});
  if (trips[code]) return;
  const now = Date.now();
  trips[code] = { code, startedAt: now, endsAt: now + ship.tripSeconds * 1000 };
  write(KEY, trips);
}

/** Commoner fish come in larger numbers. */
export function rollHaul(code: string, rand = Math.random): Haul[] {
  const ship = fleetCatalog.find((s) => s.code === code);
  if (!ship) return [];
  return ship.data.fishing.fish.map((f) => {
    const rank = Math.max(0, RARITY_ORDER.indexOf(f.rarity_ar));
    const max = Math.max(1, 12 - rank * 3);
    return { ...f, qty: 1 + Math.floor(rand() * max) };
  });
}

export function collectTrip(code: string): Haul[] | null {
  const trips = read<Record<string, Trip>>(KEY, {});
  const t = trips[code];
  if (!t || t.endsAt > Date.now()) return null;
  const haul = rollHaul(code);
  const bag = read<Record<string, number>>(BAG, {});
  haul.forEach((h) => { bag[h.name_ar] = (bag[h.name_ar] ?? 0) + h.qty; });
  delete trips[code];
  localStorage.setItem(BAG, JSON.stringify(bag));
  write(KEY, trips);
  return haul;
}

export function useTrips() {
  const [trips, setTrips] = useState<Record<string, Trip>>({});
  const [bag, setBag] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const load = () => { setTrips(read(KEY, {})); setBag(read(BAG, {})); };
    load();
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener(EVT, load);
    return () => { window.clearInterval(id); window.removeEventListener(EVT, load); };
  }, []);
  return { trips, bag, now };
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`;
}
