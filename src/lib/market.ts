import { FISH_ART } from "@/lib/art";
import { ships, type Ship } from "@/lib/ships";

/**
 * The trading floor model.
 *
 * Prices move on a deterministic pseudo-random walk seeded per asset, so every
 * captain sees the same chart at the same minute without a server round-trip.
 * Buying and selling only touches the local ledger for now — the shape of the
 * data is ready to be swapped for live rows later.
 */

export type AssetKind = "ship" | "fish";

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  img: string;
  /** Reference price in coins. */
  base: number;
  /** Circulating supply on the floor. */
  supply: number;
  tag: string;
};

export const FISH_ASSETS: Asset[] = [
  { id: "sardine", kind: "fish", name: "سردين", img: FISH_ART.sardine, base: 12, supply: 7517, tag: "شائع" },
  { id: "mackerel", kind: "fish", name: "ماكريل", img: FISH_ART.mackerel, base: 34, supply: 4210, tag: "شائع" },
  { id: "tuna", kind: "fish", name: "تونة", img: FISH_ART.tuna, base: 92, supply: 1860, tag: "نادر" },
  { id: "swordfish", kind: "fish", name: "سمك السيف", img: FISH_ART.swordfish, base: 175, supply: 640, tag: "ملحمي" },
  { id: "turtle", kind: "fish", name: "سلحفاة", img: FISH_ART.turtle, base: 214, supply: 310, tag: "ملحمي" },
  { id: "pearl", kind: "fish", name: "محار اللؤلؤ", img: FISH_ART.pearl, base: 480, supply: 96, tag: "أسطوري" },
];

export const SHIP_ASSETS: Asset[] = ships.map((s: Ship) => ({
  id: s.id,
  kind: "ship" as const,
  name: s.name,
  img: s.img,
  base: s.price,
  supply: 40 + ((s.price * 7) % 260),
  tag: s.desc,
}));

export const ASSETS: Asset[] = [...SHIP_ASSETS, ...FISH_ASSETS];

export function getAsset(id: string): Asset {
  return ASSETS.find((a) => a.id === id) ?? ASSETS[0]!;
}

/** Stable hash so each asset owns its own price personality. */
function seedOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}

const noise = (a: number, b: number) => {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

export type Candle = { o: number; h: number; l: number; c: number };

/** `points` candles ending at the current 5-minute bucket. */
export function candles(asset: Asset, points = 40, bucketMs = 5 * 60 * 1000): Candle[] {
  const seed = seedOf(asset.id);
  const bucket = Math.floor(Date.now() / bucketMs);
  const out: Candle[] = [];
  let price = asset.base;
  for (let i = points - 1; i >= 0; i--) {
    const t = bucket - i;
    const drift = (noise(seed, t) - 0.47) * asset.base * 0.06;
    const o = price;
    const c = Math.max(asset.base * 0.45, Math.min(asset.base * 2.1, o + drift));
    const wick = asset.base * 0.02 * (0.4 + noise(seed + 5, t));
    out.push({ o, c, h: Math.max(o, c) + wick, l: Math.min(o, c) - wick });
    price = c;
  }
  return out;
}

export function spot(asset: Asset) {
  const c = candles(asset, 40);
  return c[c.length - 1]!.c;
}

/** Percentage move across the visible window. */
export function change(asset: Asset) {
  const c = candles(asset, 40);
  const first = c[0]!.o;
  const last = c[c.length - 1]!.c;
  return ((last - first) / first) * 100;
}

export type Side = "buy" | "sell";

export type Order = {
  id: string;
  assetId: string;
  side: Side;
  qty: number;
  price: number;
  at: number;
};

/** Synthetic depth book around the spot price. */
export function book(asset: Asset) {
  const p = spot(asset);
  const seed = seedOf(asset.id);
  const rows = (side: Side) =>
    Array.from({ length: 6 }, (_, i) => {
      const step = p * 0.004 * (i + 1);
      const price = side === "buy" ? p - step : p + step;
      const qty = Math.round(4 + noise(seed + i, side === "buy" ? 1 : 2) * 120);
      return { price, qty };
    });
  return { bids: rows("buy"), asks: rows("sell") };
}

export const LEDGER_KEY = "bay:ledger";

export type Ledger = { coins: number; holdings: Record<string, number>; orders: Order[] };

export const emptyLedger: Ledger = { coins: 125680, holdings: {}, orders: [] };

export function loadLedger(): Ledger {
  if (typeof window === "undefined") return emptyLedger;
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY);
    if (!raw) return emptyLedger;
    return { ...emptyLedger, ...(JSON.parse(raw) as Partial<Ledger>) };
  } catch {
    return emptyLedger;
  }
}

export function saveLedger(l: Ledger) {
  try {
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify(l));
  } catch {
    /* ignore */
  }
}

export function fmtCoins(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
