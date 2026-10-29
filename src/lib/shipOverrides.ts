import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fleetCatalog, type FleetShip } from "@/lib/fleetCatalog";

export type ShipOverride = { product_id: string; name: string | null; description: string | null; price: number | null; hidden: boolean };
export const OVERRIDES_UPDATED = "tos:ship-overrides";

export type LiveShip = FleetShip & { key: string; description: string; hidden: boolean };

/** Applies admin edits (name, text, price, hidden) on top of the bundled catalog. */
export function applyOverrides(rows: ShipOverride[]): LiveShip[] {
  const map = new Map(rows.map((r) => [r.product_id, r]));
  return fleetCatalog.map((ship) => {
    const key = `ship-${ship.id}`;
    const o = map.get(key);
    return {
      ...ship,
      key,
      name: o?.name?.trim() || ship.name,
      price: o?.price ?? ship.price,
      description: o?.description?.trim() || "",
      hidden: o?.hidden ?? false,
    };
  });
}

export function useLiveShips(includeHidden = false) {
  const [rows, setRows] = useState<ShipOverride[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("ship_overrides").select("product_id,name,description,price,hidden");
      if (alive && data) setRows(data as ShipOverride[]);
    };
    void load();
    window.addEventListener(OVERRIDES_UPDATED, load);
    return () => { alive = false; window.removeEventListener(OVERRIDES_UPDATED, load); };
  }, []);
  const ships = applyOverrides(rows);
  return includeHidden ? ships : ships.filter((s) => !s.hidden);
}

export async function saveOverride(o: ShipOverride) {
  const { error } = await supabase.from("ship_overrides").upsert({ ...o, updated_at: new Date().toISOString() });
  if (!error) window.dispatchEvent(new Event(OVERRIDES_UPDATED));
  return error;
}
