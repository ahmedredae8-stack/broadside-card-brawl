import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OVERRIDES_UPDATED } from "@/lib/shipOverrides";
import { starterShip } from "@/lib/fleetCatalog";

/** The admin's starter-ship list lives in one reserved settings row of ship_overrides. */
const ROW = "setting:starter-ships";

export function useStarterShips() {
  const [codes, setCodes] = useState<string[]>([starterShip.code]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("ship_overrides").select("description").eq("product_id", ROW).maybeSingle();
      try { const v = JSON.parse(data?.description ?? "null"); if (Array.isArray(v) && v.length) setCodes(v); } catch { /* keep default */ }
    };
    void load();
    window.addEventListener(OVERRIDES_UPDATED, load);
    return () => window.removeEventListener(OVERRIDES_UPDATED, load);
  }, []);
  return codes;
}

export async function saveStarterShips(codes: string[]) {
  const { error } = await supabase.from("ship_overrides").upsert({ product_id: ROW, name: "starter-ships", description: JSON.stringify(codes), price: null, hidden: true, updated_at: new Date().toISOString() });
  if (!error) window.dispatchEvent(new Event(OVERRIDES_UPDATED));
  return error;
}
