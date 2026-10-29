import shipsData from "@/data/ships.json";

/** ships.json is the single source of truth for every ship: names, tiers, trips, fish, weapons, shields. */
export type CatalogFish = { name_ar: string; rarity_ar: string };
export type CatalogShip = {
  id: string; name_ar: string; file: string; tier: number; class: string; class_ar: string;
  weapons: string[]; weapon_slots: number; shield_max: number;
  fishing: { trip_minutes: number; fish: CatalogFish[] };
};
export const SHIP_DATA = shipsData as unknown as { rarity_order_ar: string[]; ships: CatalogShip[] };
export const RARITY_ORDER = SHIP_DATA.rarity_order_ar;

export type ShipPose = "idle" | "cast" | "submerged" | "haul";

export type FleetShip = {
  id: number;
  code: string;
  name: string;
  fish: string[];
  tripSeconds: number;
  source: "store" | "tribe";
  /** Transparent copy used on the sea. */
  hull: string;
  /** Original store photo (white background, untouched). */
  photo: string;
  price: number;
  currency: "coin" | "gem";
  data: CatalogShip;
};

const base = (file: string) => file.split("/").pop()!.replace(/\.[a-z]+$/i, "");

export const fleetCatalog: FleetShip[] = SHIP_DATA.ships.map((s, i) => ({
  id: i + 1,
  code: s.id,
  name: s.name_ar,
  fish: s.fishing.fish.map((f) => f.name_ar),
  tripSeconds: s.fishing.trip_minutes * 60,
  source: "store",
  hull: `/ships/sea/${base(s.file)}.png`,
  photo: `/ships/catalog/${base(s.file)}.jpg`,
  // Prices are set by the admin in the studio (ship overrides).
  price: 0,
  currency: "coin",
  data: s,
}));

export const hulls = fleetCatalog.map((s) => s.hull);
export const starterShip = fleetCatalog[0]!;

export const WEAPON_AR: Record<string, string> = {
  cannon: "المدفع", mortar: "الهاون", missile: "الصواريخ", torpedo: "الطوربيد",
  fire_barrel: "الجمرة", frost_shell: "الصقيع", harpoon: "الحربة", sun: "شمس الليل",
};

/** "1د 30ث" style trip label. */
export function tripLabel(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s}ث`;
  return s ? `${m}د ${s}ث` : `${m}د`;
}
